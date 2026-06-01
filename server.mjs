#!/usr/bin/env node
// Crucix Intelligence Engine — Dev Server
// Serves the Jarvis dashboard, runs sweep cycle, pushes live updates via SSE

import express from 'express';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import config from './crucix.config.mjs';
import { getLocale, currentLanguage, getSupportedLocales } from './lib/i18n.mjs';
import { fullBriefing } from './apis/briefing.mjs';
import { synthesize, generateIdeas } from './dashboard/inject.mjs';
import { MemoryManager } from './lib/delta/index.mjs';
import { createLLMProvider } from './lib/llm/index.mjs';
import { generateLLMIdeas } from './lib/llm/ideas.mjs';
import { TelegramAlerter } from './lib/alerts/telegram.mjs';
import { DiscordAlerter } from './lib/alerts/discord.mjs';
import { LineAlerter } from './lib/alerts/line.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const RUNS_DIR = join(ROOT, 'runs');
const MEMORY_DIR = join(RUNS_DIR, 'memory');

// Ensure directories exist
for (const dir of [RUNS_DIR, MEMORY_DIR, join(MEMORY_DIR, 'cold')]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// === State ===
let currentData = null;    // Current synthesized dashboard data
let lastSweepTime = null;  // Timestamp of last sweep
let sweepStartedAt = null; // Timestamp when current/last sweep started
let sweepInProgress = false;
const startTime = Date.now();
const sseClients = new Set();

// === Delta/Memory ===
const memory = new MemoryManager(RUNS_DIR);

// === LLM + Telegram + Discord + LINE ===
const llmProvider = createLLMProvider(config.llm);
const telegramAlerter = new TelegramAlerter(config.telegram);
const discordAlerter = new DiscordAlerter(config.discord || {});
const lineAlerter = new LineAlerter({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  userId: process.env.LINE_USER_ID || '',
  groupId: process.env.LINE_GROUP_ID || '',
});

if (lineAlerter.isConfigured) {
  console.log('[Crucix] LINE alerts enabled');

  // ─── LINE Bot 指令綁定 ──────────────────────────────────────────────────
  lineAlerter.onCommand('/status', async () => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const sourcesOk = currentData?.meta?.sourcesOk || 0;
    const sourcesTotal = currentData?.meta?.sourcesQueried || 0;
    const sourcesFailed = currentData?.meta?.sourcesFailed || 0;
    const llmStatus = llmProvider?.isConfigured ? `✅ ${llmProvider.name}` : '❌ Disabled';
    const nextSweep = lastSweepTime
      ? new Date(new Date(lastSweepTime).getTime() + config.refreshIntervalMinutes * 60000).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })
      : 'pending';

    return [
      `🖥️ 淬天情報中心運行狀態`,
      `━━━━━━━━━━━━━━`,
      `運行時間：${h}小時 ${m}分鐘`,
      `上次掃描：${lastSweepTime ? new Date(lastSweepTime).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' }) : '無'}`,
      `下次掃描：${nextSweep}`,
      `掃描狀態：${sweepInProgress ? '🔄 進行中' : '⏸️ 閒置'}`,
      `情報來源：${sourcesOk}/${sourcesTotal} 正常${sourcesFailed > 0 ? ` (${sourcesFailed} 異常)` : ''}`,
      `AI 分析：${llmStatus}`,
      `網頁儀表板：${process.env.PUBLIC_URL || `http://localhost:${config.port}`}/zh`,
    ].join('\n');
  });

  lineAlerter.onCommand('/sweep', async () => {
    if (sweepInProgress) return '🔄 掃描已在進行中，請稍候。';
    runSweepCycle().catch(err => console.error('[LINE Webhook] Manual sweep failed:', err.message));
    return '🚀 淬天手動掃描已觸發！系統正在掃描 29 個全球情報源，完成後將自動更新網頁並發送重要推播。';
  });

  lineAlerter.onCommand('/brief', async () => {
    if (!currentData) return '⏳ 系統剛啟動，尚無資料，請稍候。';
    const tg = currentData.tg || {};
    const energy = currentData.energy || {};
    const metals = currentData.metals || {};
    const delta = memory.getLastDelta();
    const ideas = (currentData.ideas || []).slice(0, 3);

    const sections = [
      `📋 淬天即時情報簡報`,
      `🕒 台北時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      `━━━━━━━━━━━━━━`,
    ];

    if (delta?.summary) {
      const dirEmoji = { 'risk-off': '📉 風險規避', 'risk-on': '📈 風險開啟', 'mixed': '↔️ 混合震盪' }[delta.summary.direction] || '↔️ 混合';
      sections.push(`🧭 市場方向：${dirEmoji} | ${delta.summary.totalChanges} 項變化 (${delta.summary.criticalChanges} 項重大)`);
      sections.push('');
    }

    const vix = currentData.fred?.find(f => f.id === 'VIXCLS');
    if (vix || energy.wti || metals.gold) {
      sections.push(`📊 關鍵指標：`);
      sections.push(`  • VIX 恐慌指數：${vix?.value || '--'}`);
      sections.push(`  • WTI 原油：$${energy.wti || '--'}`);
      sections.push(`  • 黃金價格：$${metals.gold || '--'}`);
      sections.push('');
    }

    if (tg.urgent?.length > 0) {
      sections.push(`📡 開源情報 (OSINT) ${tg.urgent.length} 條緊急：`);
      for (const p of tg.urgent.slice(0, 2)) {
        sections.push(`  • [${(p.channel || '').toUpperCase()}] ${(p.text || '').substring(0, 70)}…`);
      }
      sections.push('');
    }

    if (ideas.length > 0) {
      sections.push(`💡 最新 AI 策略建議：`);
      const typeMap = { long: '📈 做多', short: '📉 做空', hedge: '🛡️ 避險', watch: '👁️ 觀察', avoid: '🚫 迴避' };
      for (const idea of ideas) {
        sections.push(`  • ${typeMap[idea.type?.toLowerCase()] || idea.type} ${idea.ticker || ''} | ${idea.title}`);
      }
    }

    sections.push('');
    sections.push(`👉 完整儀表板：${(process.env.PUBLIC_URL || `http://localhost:${config.port}`)}/zh`);
    return sections.join('\n');
  });

  lineAlerter.onCommand('/ideas', async () => {
    if (!currentData || !currentData.ideas?.length) return '⏳ 暫無 AI 策略建議，可能 Ollama 尚未完成分析或正在啟動中。';
    const ideas = currentData.ideas;
    const typeMap = { long: '📈 做多', short: '📉 做空', hedge: '🛡️ 避險', watch: '👁️ 觀察', avoid: '🚫 迴避' };
    const sections = [
      `💡 淬天 AI 策略建議`,
      `🕒 生成時間：${lastSweepTime ? new Date(lastSweepTime).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '無'}`,
      `━━━━━━━━━━━━━━`,
    ];
    ideas.forEach((idea, i) => {
      sections.push(`${i + 1}. ${typeMap[idea.type?.toLowerCase()] || idea.type} | ${idea.ticker || ''} (${idea.confidence || '中'})`);
      sections.push(`   標題：${idea.title}`);
      sections.push(`   理由：${(idea.text || idea.rationale || '').substring(0, 150)}…`);
      sections.push(`   期限：${idea.horizon || '—'} | 風險：${idea.risk || '—'}`);
      sections.push('');
    });
    return sections.join('\n');
  });

  lineAlerter.onCommand('/market', async () => {
    if (!currentData) return '⏳ 暫無市場資料。';
    const d = currentData;
    const cryptos = d.markets?.crypto || [];
    const btc  = cryptos.find(c => c.name === 'Bitcoin');
    const eth  = cryptos.find(c => c.name === 'Ethereum');
    const bnb  = cryptos.find(c => c.symbol === 'BNB-USD' || c.symbol === 'BNB');
    const wld  = cryptos.find(c => c.symbol === 'WLD-USD' || c.symbol === 'WLD');
    
    const taiwan = d.markets?.taiwan || [];
    const twii = taiwan.find(s => s.symbol === '^TWII');
    const tsmc = taiwan.find(s => s.symbol === '2330.TW');
    const mtk  = taiwan.find(s => s.symbol === '2454.TW');
    const fox  = taiwan.find(s => s.symbol === '2317.TW');
    
    const us = d.markets?.usTech || [];
    const nvda = us.find(s => s.symbol === 'NVDA');
    const tsla = us.find(s => s.symbol === 'TSLA');
    const aapl = us.find(s => s.symbol === 'AAPL');
    const msft = us.find(s => s.symbol === 'MSFT');

    const fmt = (v, prefix = '$', dec = 2) => 
      v != null ? `${prefix}${Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}` : '--';
    const fmtPct = (v) => v != null ? `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%` : '--%';

    const sections = [
      `📊 淬天市場行情快照`,
      `🕒 台北時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      `━━━━━━━━━━━━━━`,
      `🇹🇼 台灣市場`,
      twii ? `  • 加權指數：${fmt(twii.price, '', 0)} (${fmtPct(twii.changePct)})` : '  • 加權指數：--',
      tsmc ? `  • 台積電 2330：${fmt(tsmc.price, 'NT$', 0)} (${fmtPct(tsmc.changePct)})` : '  • 台積電：--',
      mtk  ? `  • 聯發科 2454：${fmt(mtk.price, 'NT$', 0)} (${fmtPct(mtk.changePct)})` : '  • 聯發科：--',
      fox  ? `  • 鴻海 2317：${fmt(fox.price, 'NT$', 0)} (${fmtPct(fox.changePct)})` : '  • 鴻海：--',
      ``,
      `💰 加密貨幣`,
      btc ? `  • BTC：${fmt(btc.price, '$', 0)} (${fmtPct(btc.changePct)})` : '  • BTC：--',
      eth ? `  • ETH：${fmt(eth.price, '$', 0)} (${fmtPct(eth.changePct)})` : '  • ETH：--',
      bnb ? `  • BNB：${fmt(bnb.price, '$', 0)} (${fmtPct(bnb.changePct)})` : '  • BNB：--',
      wld ? `  • WLD：${fmt(wld.price, '$', 3)} (${fmtPct(wld.changePct)})` : '  • WLD：--',
      ``,
      `🚀 美股科技`,
      nvda ? `  • NVDA：${fmt(nvda.price, '$', 0)} (${fmtPct(nvda.changePct)})` : '  • NVDA：--',
      tsla ? `  • TSLA：${fmt(tsla.price, '$', 0)} (${fmtPct(tsla.changePct)})` : '  • TSLA：--',
      aapl ? `  • AAPL：${fmt(aapl.price, '$', 0)} (${fmtPct(aapl.changePct)})` : '  • AAPL：--',
      msft ? `  • MSFT：${fmt(msft.price, '$', 0)} (${fmtPct(msft.changePct)})` : '  • MSFT：--',
      `━━━━━━━━━━━━━━`,
      `👉 儀表板：${(process.env.PUBLIC_URL || `http://localhost:${config.port}`)}/zh`
    ];

    return sections.join('\n');
  });
}

if (llmProvider) console.log(`[Crucix] LLM enabled: ${llmProvider.name} (${llmProvider.model})`);
if (telegramAlerter.isConfigured) {
  console.log('[Crucix] Telegram alerts enabled');

  // ─── Two-Way Bot Commands ───────────────────────────────────────────────

  telegramAlerter.onCommand('/status', async () => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const sourcesOk = currentData?.meta?.sourcesOk || 0;
    const sourcesTotal = currentData?.meta?.sourcesQueried || 0;
    const sourcesFailed = currentData?.meta?.sourcesFailed || 0;
    const llmStatus = llmProvider?.isConfigured ? `✅ ${llmProvider.name}` : '❌ Disabled';
    const nextSweep = lastSweepTime
      ? new Date(new Date(lastSweepTime).getTime() + config.refreshIntervalMinutes * 60000).toLocaleTimeString()
      : 'pending';

    return [
      `🖥️ *CRUCIX STATUS*`,
      ``,
      `Uptime: ${h}h ${m}m`,
      `Last sweep: ${lastSweepTime ? new Date(lastSweepTime).toLocaleTimeString() + ' UTC' : 'never'}`,
      `Next sweep: ${nextSweep} UTC`,
      `Sweep in progress: ${sweepInProgress ? '🔄 Yes' : '⏸️ No'}`,
      `Sources: ${sourcesOk}/${sourcesTotal} OK${sourcesFailed > 0 ? ` (${sourcesFailed} failed)` : ''}`,
      `LLM: ${llmStatus}`,
      `SSE clients: ${sseClients.size}`,
      `Dashboard: ${config.publicUrl || `http://localhost:${config.port}`}`,
    ].join('\n');
  });

  telegramAlerter.onCommand('/sweep', async () => {
    if (sweepInProgress) return '🔄 Sweep already in progress. Please wait.';
    // Fire and forget — don't block the bot response
    runSweepCycle().catch(err => console.error('[Crucix] Manual sweep failed:', err.message));
    return '🚀 Manual sweep triggered. You\'ll receive alerts if anything significant is detected.';
  });

  telegramAlerter.onCommand('/brief', async () => {
    if (!currentData) return '⏳ No data yet — waiting for first sweep to complete.';

    const tg = currentData.tg || {};
    const energy = currentData.energy || {};
    const metals = currentData.metals || {};
    const delta = memory.getLastDelta();
    const ideas = (currentData.ideas || []).slice(0, 3);

    const sections = [
      `📋 *CRUCIX BRIEF*`,
      `_${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC_`,
      ``,
    ];

    // Delta direction
    if (delta?.summary) {
      const dirEmoji = { 'risk-off': '📉', 'risk-on': '📈', 'mixed': '↔️' }[delta.summary.direction] || '↔️';
      sections.push(`${dirEmoji} Direction: *${delta.summary.direction.toUpperCase()}* | ${delta.summary.totalChanges} changes, ${delta.summary.criticalChanges} critical`);
      sections.push('');
    }

    // Key metrics
    const vix = currentData.fred?.find(f => f.id === 'VIXCLS');
    const hy = currentData.fred?.find(f => f.id === 'BAMLH0A0HYM2');
    if (vix || energy.wti || metals.gold || metals.silver) {
      sections.push(`📊 VIX: ${vix?.value || '--'} | WTI: $${energy.wti || '--'} | Brent: $${energy.brent || '--'}`);
      sections.push(`   Gold: $${metals.gold || '--'} | Silver: $${metals.silver || '--'}${hy ? ` | HY Spread: ${hy.value}` : ''}`);
      sections.push(`   NatGas: $${energy.natgas || '--'}`);
      sections.push('');
    }

    // OSINT
    if (tg.urgent?.length > 0) {
      sections.push(`📡 OSINT: ${tg.urgent.length} urgent signals, ${tg.posts || 0} total posts`);
      // Top 2 urgent
      for (const p of tg.urgent.slice(0, 2)) {
        sections.push(`  • ${(p.text || '').substring(0, 80)}`);
      }
      sections.push('');
    }

    // Top ideas
    if (ideas.length > 0) {
      sections.push(`💡 *Top Ideas:*`);
      for (const idea of ideas) {
        sections.push(`  ${idea.type === 'long' ? '📈' : idea.type === 'hedge' ? '🛡️' : '👁️'} ${idea.title}`);
      }
    }

    return sections.join('\n');
  });

  telegramAlerter.onCommand('/portfolio', async () => {
    return '📊 Portfolio integration requires Alpaca MCP connection.\nUse the Crucix dashboard or Claude agent for portfolio queries.';
  });

  // Start polling for bot commands
  telegramAlerter.startPolling(config.telegram.botPollingInterval);
}

// === Discord Bot ===
if (discordAlerter.isConfigured) {
  console.log('[Crucix] Discord bot enabled');

  // Reuse the same command handlers as Telegram (DRY)
  discordAlerter.onCommand('status', async () => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const sourcesOk = currentData?.meta?.sourcesOk || 0;
    const sourcesTotal = currentData?.meta?.sourcesQueried || 0;
    const sourcesFailed = currentData?.meta?.sourcesFailed || 0;
    const llmStatus = llmProvider?.isConfigured ? `✅ ${llmProvider.name}` : '❌ Disabled';
    const nextSweep = lastSweepTime
      ? new Date(new Date(lastSweepTime).getTime() + config.refreshIntervalMinutes * 60000).toLocaleTimeString()
      : 'pending';

    return [
      `**🖥️ CRUCIX STATUS**\n`,
      `Uptime: ${h}h ${m}m`,
      `Last sweep: ${lastSweepTime ? new Date(lastSweepTime).toLocaleTimeString() + ' UTC' : 'never'}`,
      `Next sweep: ${nextSweep} UTC`,
      `Sweep in progress: ${sweepInProgress ? '🔄 Yes' : '⏸️ No'}`,
      `Sources: ${sourcesOk}/${sourcesTotal} OK${sourcesFailed > 0 ? ` (${sourcesFailed} failed)` : ''}`,
      `LLM: ${llmStatus}`,
      `SSE clients: ${sseClients.size}`,
      `Dashboard: ${config.publicUrl || `http://localhost:${config.port}`}`,
    ].join('\n');
  });

  discordAlerter.onCommand('sweep', async () => {
    if (sweepInProgress) return '🔄 Sweep already in progress. Please wait.';
    runSweepCycle().catch(err => console.error('[Crucix] Manual sweep failed:', err.message));
    return '🚀 Manual sweep triggered. You\'ll receive alerts if anything significant is detected.';
  });

  discordAlerter.onCommand('brief', async () => {
    if (!currentData) return '⏳ No data yet — waiting for first sweep to complete.';

    const tg = currentData.tg || {};
    const energy = currentData.energy || {};
    const metals = currentData.metals || {};
    const delta = memory.getLastDelta();
    const ideas = (currentData.ideas || []).slice(0, 3);

    const sections = [`**📋 CRUCIX BRIEF**\n_${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC_\n`];

    if (delta?.summary) {
      const dirEmoji = { 'risk-off': '📉', 'risk-on': '📈', 'mixed': '↔️' }[delta.summary.direction] || '↔️';
      sections.push(`${dirEmoji} Direction: **${delta.summary.direction.toUpperCase()}** | ${delta.summary.totalChanges} changes, ${delta.summary.criticalChanges} critical\n`);
    }

    const vix = currentData.fred?.find(f => f.id === 'VIXCLS');
    const hy = currentData.fred?.find(f => f.id === 'BAMLH0A0HYM2');
    if (vix || energy.wti || metals.gold || metals.silver) {
      sections.push(`📊 VIX: ${vix?.value || '--'} | WTI: $${energy.wti || '--'} | Brent: $${energy.brent || '--'}`);
      sections.push(`   Gold: $${metals.gold || '--'} | Silver: $${metals.silver || '--'}${hy ? ` | HY Spread: ${hy.value}` : ''}`);
      sections.push(`   NatGas: $${energy.natgas || '--'}`);
      sections.push('');
    }

    if (tg.urgent?.length > 0) {
      sections.push(`📡 OSINT: ${tg.urgent.length} urgent signals, ${tg.posts || 0} total posts`);
      for (const p of tg.urgent.slice(0, 2)) {
        sections.push(`  • ${(p.text || '').substring(0, 80)}`);
      }
      sections.push('');
    }

    if (ideas.length > 0) {
      sections.push(`**💡 Top Ideas:**`);
      for (const idea of ideas) {
        sections.push(`  ${idea.type === 'long' ? '📈' : idea.type === 'hedge' ? '🛡️' : '👁️'} ${idea.title}`);
      }
    }

    return sections.join('\n');
  });

  discordAlerter.onCommand('portfolio', async () => {
    return '📊 Portfolio integration requires Alpaca MCP connection.\nUse the Crucix dashboard or Claude agent for portfolio queries.';
  });

  // Start the Discord bot (non-blocking — connection happens async)
  discordAlerter.start().catch(err => {
    console.error('[Crucix] Discord bot startup failed (non-fatal):', err.message);
  });
}

// === Express Server ===
const app = express();
app.use(express.static(join(ROOT, 'dashboard/public')));

// LINE Bot Webhook POST 路由
app.post('/api/line/webhook', express.json(), async (req, res) => {
  if (lineAlerter.isConfigured && req.body.events) {
    try {
      await lineAlerter.handleWebhookEvents(req.body.events);
    } catch (err) {
      console.error('[Crucix] Error handling LINE webhook events:', err.message);
    }
  }
  res.sendStatus(200);
});

// 中文版儀表板路由
app.get('/zh', (req, res) => {
  res.sendFile(join(ROOT, 'dashboard/public/cuitian.html'));
});

// 根目錄直接安全導向中文版儀表板
app.get('/', (req, res) => res.redirect('/zh'));

// API: current data (加入 fallback 自動讀取機制以消除 503 黑畫面)
app.get('/api/data', async (req, res) => {
  if (!currentData) {
    try {
      const existing = JSON.parse(readFileSync(join(RUNS_DIR, 'latest.json'), 'utf8'));
      const data = await synthesize(existing);
      currentData = data;
      console.log('[Crucix API] Dynamically loaded fallback data from runs/latest.json');
    } catch (e) {
      return res.status(503).json({ error: 'No data yet — first sweep in progress' });
    }
  }
  res.json(currentData);
});

// API: health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    lastSweep: lastSweepTime,
    nextSweep: lastSweepTime
      ? new Date(new Date(lastSweepTime).getTime() + config.refreshIntervalMinutes * 60000).toISOString()
      : null,
    sweepInProgress,
    sweepStartedAt,
    sourcesOk: currentData?.meta?.sourcesOk || 0,
    sourcesFailed: currentData?.meta?.sourcesFailed || 0,
    llmEnabled: !!config.llm.provider,
    llmProvider: config.llm.provider,
    telegramEnabled: !!(config.telegram.botToken && config.telegram.chatId),
    refreshIntervalMinutes: config.refreshIntervalMinutes,
    language: currentLanguage,
  });
});

// API: available locales
app.get('/api/locales', (req, res) => {
  res.json({
    current: currentLanguage,
    supported: getSupportedLocales(),
  });
});

// SSE: live updates
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('data: {"type":"connected"}\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(msg); } catch { sseClients.delete(client); }
  }
}

// === Sweep Cycle ===
async function runSweepCycle() {
  if (sweepInProgress) {
    console.log('[Crucix] Sweep already in progress, skipping');
    return;
  }

  sweepInProgress = true;
  sweepStartedAt = new Date().toISOString();
  broadcast({ type: 'sweep_start', timestamp: sweepStartedAt });
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Crucix] Starting sweep at ${new Date().toLocaleTimeString()}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // 1. Run the full briefing sweep
    const rawData = await fullBriefing();

    // 2. Save to runs/latest.json
    writeFileSync(join(RUNS_DIR, 'latest.json'), JSON.stringify(rawData, null, 2));
    lastSweepTime = new Date().toISOString();

    // 3. Synthesize into dashboard format
    console.log('[Crucix] Synthesizing dashboard data...');
    const synthesized = await synthesize(rawData);

    // 4. Delta computation + memory
    const delta = memory.addRun(synthesized);
    synthesized.delta = delta;

    // 5. LLM-powered trade ideas (LLM-only feature) — isolated so failures don't kill sweep
    if (llmProvider?.isConfigured) {
      try {
        console.log('[Crucix] Generating LLM trade ideas...');
        const previousIdeas = memory.getLastRun()?.ideas || [];
        const llmIdeas = await generateLLMIdeas(llmProvider, synthesized, delta, previousIdeas);
        if (llmIdeas) {
          synthesized.ideas = llmIdeas;
          synthesized.ideasSource = 'llm';
          console.log(`[Crucix] LLM generated ${llmIdeas.length} ideas`);
        } else {
          synthesized.ideas = [];
          synthesized.ideasSource = 'llm-failed';
        }
      } catch (llmErr) {
        console.error('[Crucix] LLM ideas failed (non-fatal):', llmErr.message);
        synthesized.ideas = [];
        synthesized.ideasSource = 'llm-failed';
      }
    } else {
      synthesized.ideas = [];
      synthesized.ideasSource = 'disabled';
    }

    // 6. Alert evaluation — Telegram + Discord + LINE
    if (delta?.summary?.totalChanges > 0) {
      if (telegramAlerter.isConfigured) {
        telegramAlerter.evaluateAndAlert(llmProvider, delta, memory).catch(err => {
          console.error('[Crucix] Telegram alert error:', err.message);
        });
      }
      if (discordAlerter.isConfigured) {
        discordAlerter.evaluateAndAlert(llmProvider, delta, memory).catch(err => {
          console.error('[Crucix] Discord alert error:', err.message);
        });
      }
      if (lineAlerter.isConfigured) {
        lineAlerter.evaluateAndAlert(synthesized, delta).catch(err => {
          console.error('[Crucix] LINE alert error:', err.message);
        });
      }
    }

    // 7. Post actionable ideas to Discord (HIGH confidence, short horizon, Kalshi-style)
    if (discordAlerter.isConfigured && synthesized.ideas?.length > 0) {
      discordAlerter.sendActionableIdeas(synthesized.ideas).catch(err => {
        console.error('[Crucix] Discord idea alert error:', err.message);
      });
    }

    // Prune old alerted signals
    memory.pruneAlertedSignals();

    currentData = synthesized;

    // 6. Push to all connected browsers
    broadcast({ type: 'update', data: currentData });

    console.log(`[Crucix] Sweep complete — ${currentData.meta.sourcesOk}/${currentData.meta.sourcesQueried} sources OK`);
    console.log(`[Crucix] ${currentData.ideas.length} ideas (${synthesized.ideasSource}) | ${currentData.news.length} news | ${currentData.newsFeed.length} feed items`);
    if (delta?.summary) console.log(`[Crucix] Delta: ${delta.summary.totalChanges} changes, ${delta.summary.criticalChanges} critical, direction: ${delta.summary.direction}`);
    console.log(`[Crucix] Next sweep at ${new Date(Date.now() + config.refreshIntervalMinutes * 60000).toLocaleTimeString()}`);

  } catch (err) {
    console.error('[Crucix] Sweep failed:', err.message);
    broadcast({ type: 'sweep_error', error: err.message });
  } finally {
    sweepInProgress = false;
  }
}

// === Startup ===
async function start() {
  const port = config.port;

  console.log(`
  ╔══════════════════════════════════════════════╗
  ║           CRUCIX INTELLIGENCE ENGINE         ║
  ║          Local Palantir · 26 Sources         ║
  ╠══════════════════════════════════════════════╣
  ║  Dashboard:  http://localhost:${port}${' '.repeat(14 - String(port).length)}║
  ║  Health:     http://localhost:${port}/api/health${' '.repeat(4 - String(port).length)}║
  ║  Refresh:    Every ${config.refreshIntervalMinutes} min${' '.repeat(20 - String(config.refreshIntervalMinutes).length)}║
  ║  LLM:        ${(config.llm.provider || 'disabled').padEnd(31)}║
  ║  Telegram:   ${config.telegram.botToken ? 'enabled' : 'disabled'}${' '.repeat(config.telegram.botToken ? 24 : 23)}║
  ║  Discord:    ${config.discord?.botToken ? 'enabled' : config.discord?.webhookUrl ? 'webhook only' : 'disabled'}${' '.repeat(config.discord?.botToken ? 24 : config.discord?.webhookUrl ? 20 : 23)}║
  ╚══════════════════════════════════════════════╝
  `);

  const server = app.listen(port);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Crucix] FATAL: Port ${port} is already in use!`);
      console.error(`[Crucix] A previous Crucix instance may still be running.`);
      console.error(`[Crucix] Fix:  taskkill /F /IM node.exe   (Windows)`);
      console.error(`[Crucix]       kill $(lsof -ti:${port})   (macOS/Linux)`);
      console.error(`[Crucix] Or change PORT in .env\n`);
    } else {
      console.error(`[Crucix] Server error:`, err.stack || err.message);
    }
    process.exit(1);
  });

  server.on('listening', async () => {
    console.log(`[Crucix] Server running on http://localhost:${port}`);

    // Auto-open browser
    // NOTE: On Windows, `start` in PowerShell is an alias for Start-Service, not cmd's start.
    // We must use `cmd /c start ""` to ensure it works in both cmd.exe and PowerShell.
    const openCmd = process.platform === 'win32' ? 'cmd /c start ""' :
                    process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${openCmd} "http://localhost:${port}"`, (err) => {
      if (err) console.log('[Crucix] Could not auto-open browser:', err.message);
    });

    // Try to load existing data first for instant display (await so dashboard shows immediately)
    try {
      const existing = JSON.parse(readFileSync(join(RUNS_DIR, 'latest.json'), 'utf8'));
      const data = await synthesize(existing);
      currentData = data;
      console.log('[Crucix] Loaded existing data from runs/latest.json — dashboard ready instantly');
      broadcast({ type: 'update', data: currentData });
    } catch {
      console.log('[Crucix] No existing data found — first sweep required');
    }

    // Run first sweep (refreshes data in background)
    console.log('[Crucix] Running initial sweep...');
    runSweepCycle().catch(err => {
      console.error('[Crucix] Initial sweep failed:', err.message || err);
    });

    // Schedule recurring sweeps
    setInterval(runSweepCycle, config.refreshIntervalMinutes * 60 * 1000);

    // ☯ 三段式定時推播排程：07:00 早安 / 13:00 午間 / 19:00 上班前 (台北時間 UTC+8)
    if (lineAlerter.isConfigured) {
      scheduleDaily(7,  '早安',   sendMorningBriefing);
      scheduleDaily(13, '午間',   sendAfternoonBriefing);
      scheduleDaily(19, '上班前', sendPreWorkBriefing);
    }
  });
}

// ─── 每日定時推播核心 (台北時間 UTC+8) ────────────────────────────────────────────────────
function scheduleDaily(targetHour, label, fn) {
  function msUntilNext() {
    const now = new Date();
    const nowTPEmin = (now.getUTCHours() * 60 + now.getUTCMinutes() + 8 * 60) % (24 * 60);
    const diffMin = targetHour * 60 - nowTPEmin;
    const waitMin = diffMin > 0 ? diffMin : diffMin + 24 * 60;
    return waitMin * 60 * 1000 - now.getUTCSeconds() * 1000 - now.getUTCMilliseconds();
  }
  const wait = msUntilNext();
  const nextRun = new Date(Date.now() + wait);
  console.log(`[淬天] ${label}推播排程 → ${nextRun.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })} (台北時間)`);
  setTimeout(async function fire() {
    console.log(`[淬天] 🔔 ${label}推播觸發！`);
    try { 
      await fn(); 
    } catch(err) { 
      console.error(`[淬天] ${label}推播失敗:`, err.message); 
    }
    setTimeout(fire, msUntilNext());
  }, wait);
}

// 07:00 早安推播
async function sendMorningBriefing() {
  if (!lineAlerter?.isConfigured || !currentData) return;
  console.log('[淬天] 正在發送早安情報推播...');
  await lineAlerter.pushMorningSummary(currentData);
  console.log('[淬天] 早安推播完成');
}

// 13:00 午間推播
async function sendAfternoonBriefing() {
  if (!lineAlerter?.isConfigured || !currentData) return;
  console.log('[淬天] 正在發送午間情報推播...');
  const pubUrl = (process.env.PUBLIC_URL || `http://localhost:${config.port}`).replace(/\/$/, '');
  const d = currentData;
  const cryptos = d.markets?.crypto || [];
  const btc  = cryptos.find(c => c.name === 'Bitcoin');
  const bnb  = cryptos.find(c => c.symbol === 'BNB-USD' || c.symbol === 'BNB');
  const wld  = cryptos.find(c => c.symbol === 'WLD-USD' || c.symbol === 'WLD');
  const tsmc = (d.markets?.taiwan || []).find(s => s.symbol === '2330.TW');
  const nvda = (d.markets?.usTech || []).find(s => s.symbol === 'NVDA');
  
  const nameMap = {Bitcoin:'BTC',Ethereum:'ETH',BNB:'BNB',Solana:'SOL',XRP:'XRP',Dogecoin:'DOGE',Worldcoin:'WLD'};
  const topCrypto = [...cryptos].filter(c => c.changePct != null)
    .sort((a, b) => (b.changePct || 0) - (a.changePct || 0))[0];

  const lines = [
    `☯【13:00】淬天午間情報`, 
    `━━━━━━━━━━━━━━`,
    `📊 市場中場`,
    btc  ? `  • BTC: $${btc.price?.toLocaleString()} (${btc.changePct>=0?'+':''}${btc.changePct?.toFixed(2)}%)` : '',
    bnb  ? `  • BNB: $${bnb.price?.toFixed(0)} (${bnb.changePct>=0?'+':''}${bnb.changePct?.toFixed(2)}%)` : '',
    wld  ? `  • WLD: $${wld.price?.toFixed(3)} (${wld.changePct>=0?'+':''}${wld.changePct?.toFixed(2)}%)` : '',
    tsmc ? `  • 台積電: NT$${tsmc.price} (${tsmc.changePct>=0?'+':''}${tsmc.changePct?.toFixed(2)}%)` : '',
    nvda ? `  • NVDA: $${nvda.price?.toFixed(0)} (${nvda.changePct>=0?'+':''}${nvda.changePct?.toFixed(2)}%)` : '',
    topCrypto ? `🔥 最強：${nameMap[topCrypto.name]||topCrypto.name} +${topCrypto.changePct?.toFixed(2)}%` : '',
    ``,
    (d.ideas||[])[0] ? `🤖 AI策略：[${d.ideas[0].type.toUpperCase()}] ${d.ideas[0].title}` : '',
    `👉 儀表板：${pubUrl}/zh`,
  ].filter(line => line !== null && line !== undefined).join('\n');
  
  await lineAlerter.push(lines, true);
  console.log('[淬天] 午間推播完成');
}

// 19:00 上班前推播 (台北時間)
async function sendPreWorkBriefing() {
  if (!lineAlerter?.isConfigured || !currentData) return;
  console.log('[淬天] 正在發送上班前情報推播...');
  const pubUrl = (process.env.PUBLIC_URL || `http://localhost:${config.port}`).replace(/\/$/, '');
  const d = currentData;
  const cryptos = d.markets?.crypto || [];
  const btc = cryptos.find(c => c.name === 'Bitcoin');
  const nameMap = {Bitcoin:'BTC',Ethereum:'ETH',BNB:'BNB',Solana:'SOL',XRP:'XRP',Dogecoin:'DOGE',Worldcoin:'WLD'};
  const topCrypto = [...cryptos].filter(c => c.changePct != null)
    .sort((a, b) => (b.changePct || 0) - (a.changePct || 0))[0];
  const vix = d.fred?.find(f => f.id === 'VIXCLS');
  const ideas = d.ideas || [];
  const daysLeft = Math.max(0, Math.floor((new Date('2026-06-12T09:30:00-04:00') - Date.now()) / 86400000));
  
  const lines = [
    `☯【19:00】淬天上班前情報`,
    `━━━━━━━━━━━━━━━━━━━━━`, 
    btc ? `BTC $${btc.price?.toLocaleString()} (${btc.changePct>=0?'+':''}${btc.changePct?.toFixed(2)}%)` : '',
    `VIX ${vix?.value?.toFixed(1)||'--'} | 緊急情報 ${d.tg?.urgent?.length||0} 條`,
    topCrypto ? `🔥 今日最強：${nameMap[topCrypto.name]||topCrypto.name} +${topCrypto.changePct?.toFixed(2)}%` : '',
    ``,
    ideas.length ? `🤖 AI今日策略：` : '',
    ...ideas.slice(0,3).map((idea,i)=>`  ${i+1}. [${idea.type.toUpperCase()}] ${idea.ticker||''} — ${(idea.title||'').substring(0,40)}`),
    ``,
    ...(d.tg?.urgent||[]).slice(0,2).map(p=>`⚡ ${(p.text||'').substring(0,70)}…`),
    ``,
    daysLeft>0 ? `🚀 SpaceX IPO 倒數 ${daysLeft} 天` : '',
    `━━━━━━━━━━━━━━━━━━━━━`,
    `輸入 /ideas 看完整策略`, 
    `👉 儀表板：${pubUrl}/zh`,
  ].filter(line => line !== null && line !== undefined).join('\n');
  
  await lineAlerter.push(lines, true);
  console.log('[淬天] 上班前推播完成');
}

// Graceful error handling — log full stack traces for diagnosis
process.on('unhandledRejection', (err) => {
  console.error('[Crucix] Unhandled rejection:', err?.stack || err?.message || err);
});
process.on('uncaughtException', (err) => {
  console.error('[Crucix] Uncaught exception:', err?.stack || err?.message || err);
});

start().catch(err => {
  console.error('[Crucix] FATAL — Server failed to start:', err?.stack || err?.message || err);
  process.exit(1);
});
