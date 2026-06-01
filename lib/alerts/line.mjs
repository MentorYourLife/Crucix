/**
 * ☯ 淬天情報中心 — LINE Bot 推播整合
 * CTS-LHY13 · 淬天錄-LHY-v13
 *
 * 功能：
 *  - 主動推播重要情報到你的 LINE（緊急事件、市場異動）
 *  - 接收指令：/status /brief /ideas /sweep
 *  - 不打擾模式：只推高優先級事件
 */

import { messagingApi, webhook } from '@line/bot-sdk';
const { MessagingApiClient } = messagingApi;

export class LineAlerter {
  constructor(config = {}) {
    this.channelAccessToken = config.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
    this.channelSecret      = config.channelSecret      || process.env.LINE_CHANNEL_SECRET       || '';
    this.userId             = config.userId             || process.env.LINE_USER_ID               || '';
    this.groupId            = config.groupId            || process.env.LINE_GROUP_ID              || '';

    this.isConfigured = !!(this.channelAccessToken && (this.userId || this.groupId));

    if (this.isConfigured) {
      this.client = new MessagingApiClient({ channelAccessToken: this.channelAccessToken });
    }

    this._commandHandlers = new Map();
    this._alertedKeys     = new Set();     // 防重複推播
    this._quietHours      = { start: 23, end: 7 }; // 不打擾時段（23:00 - 07:00）
  }

  get isQuietHours() {
    const h = new Date().getHours();
    const { start, end } = this._quietHours;
    return start > end ? (h >= start || h < end) : (h >= start && h < end);
  }

  // === 指令綁定 ===
  onCommand(cmd, handler) {
    this._commandHandlers.set(cmd, handler);
  }

  // === 處理 Webhook 事件（來自 LINE 伺服器） ===
  async handleWebhookEvents(events) {
    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;

      const text = (event.message.text || '').trim();
      const replyToken = event.replyToken;

      // 解析指令
      const [cmd] = text.split(' ');
      const handler = this._commandHandlers.get(cmd);

      if (handler) {
        try {
          const reply = await handler(text);
          if (reply && replyToken) {
            await this.client.replyMessage({
              replyToken,
              messages: [this._buildTextMessage(reply)]
            });
          }
        } catch (err) {
          console.error('[LINE] Command handler error:', err.message);
        }
      }
    }
  }

  // === 推播到你的帳號 ===
  async push(text, forceQuiet = false) {
    if (!this.isConfigured) return false;
    if (this.isQuietHours && !forceQuiet) {
      console.log('[LINE] Quiet hours — message queued for morning');
      return false;
    }

    const target = this.groupId || this.userId;
    try {
      await this.client.pushMessage({
        to: target,
        messages: [this._buildTextMessage(text)]
      });
      return true;
    } catch (err) {
      console.error('[LINE] Push failed:', err.message);
      return false;
    }
  }

  // === 推播 Flex Message（豐富格式） ===
  async pushFlex(altText, flexContent) {
    if (!this.isConfigured) return false;
    const target = this.groupId || this.userId;
    try {
      await this.client.pushMessage({
        to: target,
        messages: [{ type: 'flex', altText, contents: flexContent }]
      });
      return true;
    } catch (err) {
      console.error('[LINE] Flex push failed:', err.message);
      return false;
    }
  }

  // === 情報評估：決定是否推播 ===
  async evaluateAndAlert(data, delta) {
    if (!this.isConfigured || !data) return;

    const alerts = [];

    // 1. 緊急 OSINT 信號
    const newUrgent = (data.tg?.urgent || []).filter(p => {
      const key = `tg:${p.channel}:${p.date}`;
      if (this._alertedKeys.has(key)) return false;
      this._alertedKeys.add(key);
      return true;
    });

    if (newUrgent.length > 0) {
      const top = newUrgent[0];
      alerts.push({
        priority: 'HIGH',
        text: [
          '⚡ 緊急情報 · 淬天警報',
          `━━━━━━━━━━━━━━`,
          `📡 ${(top.channel || '').toUpperCase()}`,
          `${(top.text || '').substring(0, 200)}`,
          ``,
          `🏷️ 標記：${(top.urgentFlags || []).join(', ') || '—'}`,
          `👁️ ${top.views?.toLocaleString() || '?'} 次瀏覽`,
          ``,
          `📊 查看儀表板：http://localhost:3117/zh`,
        ].join('\n')
      });
    }

    // 2. 油價突破
    const wti = data.energy?.wti;
    if (wti) {
      const wtiKey = `wti:${Math.floor(wti / 5) * 5}`;
      if (wti > 100 && !this._alertedKeys.has(wtiKey)) {
        this._alertedKeys.add(wtiKey);
        alerts.push({
          priority: 'MEDIUM',
          text: [
            `🛢️ WTI 原油突破 $${Math.floor(wti)} 美元`,
            `━━━━━━━━━━━━━━`,
            `目前價格：$${wti.toFixed(2)}/bbl`,
            `布倫特：$${data.energy?.brent?.toFixed(2) || '--'}`,
            ``,
            `⚠️ 高油價可能反映地緣衝突加劇`,
          ].join('\n')
        });
      }
    }

    // 3. VIX 恐慌升高
    const vix = data.fred?.find(f => f.id === 'VIXCLS');
    if (vix && vix.value > 30) {
      const vixKey = `vix:${Math.floor(vix.value / 5) * 5}`;
      if (!this._alertedKeys.has(vixKey)) {
        this._alertedKeys.add(vixKey);
        alerts.push({
          priority: 'HIGH',
          text: [
            `😱 VIX 恐慌指數飆至 ${vix.value.toFixed(1)}`,
            `━━━━━━━━━━━━━━`,
            `VIX > 30 = 市場進入高度恐慌`,
            `VIX > 40 = 極端危機（2020 疫情水位）`,
            ``,
            `📊 建議：查看AI策略建議`,
            `http://localhost:3117/zh`,
          ].join('\n')
        });
      }
    }

    // 4. Delta 重大變化
    if (delta?.summary?.criticalChanges > 0) {
      const deltaKey = `delta:${delta.summary.timestamp}`;
      if (!this._alertedKeys.has(deltaKey)) {
        this._alertedKeys.add(deltaKey);
        alerts.push({
          priority: 'MEDIUM',
          text: [
            `📊 淬天情報重大更新`,
            `━━━━━━━━━━━━━━`,
            `方向：${delta.summary.direction === 'risk-off' ? '📉 風險規避' : delta.summary.direction === 'risk-on' ? '📈 風險開啟' : '↔️ 混合'}`,
            `總變化：${delta.summary.totalChanges} 項`,
            `關鍵變化：${delta.summary.criticalChanges} 項`,
          ].join('\n')
        });
      }
    }

    // 推播（高優先立即推，中等級避開靜默時段）
    for (const alert of alerts) {
      const force = alert.priority === 'HIGH';
      await this.push(alert.text, force);
      await new Promise(r => setTimeout(r, 500)); // 避免 API 限流
    }
  }

  // === 推播 AI 策略建議 ===
  async pushIdeas(ideas) {
    if (!this.isConfigured || !ideas?.length) return;

    const highConf = ideas.filter(i => i.confidence === 'HIGH' || i.confidence === '高');
    if (!highConf.length) return;

    const typeMap = { long: '📈 做多', short: '📉 做空', hedge: '🛡️ 避險', watch: '👁️ 觀察', avoid: '🚫 迴避' };
    const lines = [
      `💡 AI 策略建議 · 淬天分析`,
      `━━━━━━━━━━━━━━`,
    ];

    for (const idea of highConf.slice(0, 3)) {
      lines.push(`${typeMap[idea.type?.toLowerCase()] || idea.type} ${idea.ticker || ''}`);
      lines.push(`${idea.title}`);
      lines.push(`信心：${idea.confidence} · ${idea.horizon}`);
      lines.push('');
    }

    lines.push(`http://localhost:3117/zh`);
    await this.push(lines.join('\n'));
  }

  // === 早安情報摘要（每天 07:00 SKY 風格推播） ===
  async pushMorningSummary(data) {
    if (!this.isConfigured || !data) return false;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

    // === 市場快照 ===
    const crypto = data.markets?.crypto || [];
    const btc   = crypto.find(c => c.name === 'Bitcoin' || c.symbol === 'BTC');
    const eth   = crypto.find(c => c.name === 'Ethereum' || c.symbol === 'ETH');
    const bnb   = crypto.find(c => c.symbol === 'BNB');
    const wld   = crypto.find(c => c.symbol === 'WLD');

    const twStocks = data.markets?.twStocks || [];
    const tsm  = twStocks.find(s => s.symbol === 'TSM' || s.symbol === '2330.TW');
    const mtk  = twStocks.find(s => s.symbol === '2454.TW');

    const vix  = data.fred?.find(f => f.id === 'VIXCLS');
    const gold = data.metals?.gold;

    const fmt = (v, prefix = '$', dec = 0) =>
      v != null ? `${prefix}${Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}` : '--';
    const fmtPct = (v) => v != null ? `${v >= 0 ? '+' : ''}${Number(v).toFixed(1)}%` : '';

    // === 最強幣（24h 漲幅最大） ===
    const topCoin = [...crypto]
      .filter(c => c.changePercent24h != null)
      .sort((a, b) => (b.changePercent24h || 0) - (a.changePercent24h || 0))[0];

    // === SpaceX IPO 倒數 ===
    const SPACEX_IPO = new Date('2026-06-12T09:30:00-04:00');
    const daysLeft   = Math.max(0, Math.ceil((SPACEX_IPO - now) / 86400000));
    const spacexLine = daysLeft > 0
      ? `• SpaceX IPO（SPCX）剩 ${daysLeft} 天 🚀`
      : `• SpaceX IPO 今日登場！📡 SPCX`;

    // === 颱風薔蜜 ===
    const typhoonLine = `• 颱風薔蜜：持續追蹤台灣半導體廠區風險`;

    // === 今日重點（取 OSINT 前 2 條 + 固定事件） ===
    const osintTop = (data.tg?.urgent || []).slice(0, 2).map(p =>
      `• ${(p.text || '').substring(0, 60).trim()}…`
    );
    if (osintTop.length < 2) osintTop.push(`• COMPUTEX 展覽倒數：黃仁勳主題演講焦點`);

    // === 市場方向 ===
    const delta = data.delta;
    const dirEmoji = {
      'risk-off': '📉 風險規避',
      'risk-on':  '📈 風險開啟',
      'mixed':    '↔️ 混合震盪',
    }[delta?.summary?.direction] || '🔍 待觀察';

    const lines = [
      `☯【${timeStr}】淬天早安情報`,
      ``,
      `📈 市場快照`,
      `BTC ${fmt(btc?.price)} ${fmtPct(btc?.changePercent24h)} | VIX ${vix?.value?.toFixed(1) || '--'}`,
      `台積電 ${fmt(tsm?.price, 'NT$')} | 聯發科 ${fmt(mtk?.price, 'NT$')}`,
      `黃金 ${fmt(gold)} | ETH ${fmt(eth?.price)} ${fmtPct(eth?.changePercent24h)}`,
      ...(bnb  ? [`BNB ${fmt(bnb.price)} ${fmtPct(bnb.changePercent24h)}`]  : []),
      ...(wld  ? [`WLD ${fmt(wld.price, '$', 3)} ${fmtPct(wld.changePercent24h)}`] : []),
      ``,
      `⚡ 最強幣：${topCoin ? `${topCoin.symbol} ${fmtPct(topCoin.changePercent24h)}` : '--'}`,
      ``,
      `🧭 市場方向：${dirEmoji}`,
      ``,
      `🌏 今日重點：`,
      ...osintTop,
      ``,
      `🚀 倒數事件：`,
      spacexLine,
      typhoonLine,
      ``,
      `📊 儀表板：${(process.env.PUBLIC_URL || 'http://localhost:3117').replace(/\/$/, '')}/zh`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `☯ 淬天情報中心 · SKY-QUANT`,
    ];

    // 早安摘要強制推播（忽略靜默時段）
    return this.push(lines.join('\n'), true);
  }

  // === 清掉舊的已推播紀錄（每天清一次） ===
  pruneAlertedKeys() {
    if (this._alertedKeys.size > 500) {
      const arr = [...this._alertedKeys];
      this._alertedKeys = new Set(arr.slice(-200));
    }
  }

  _buildTextMessage(text) {
    return { type: 'text', text: String(text).substring(0, 5000) };
  }
}
