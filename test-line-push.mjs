// 使用 Crucix 自己的環境變數載入器
await import('./apis/utils/env.mjs');

const { LineAlerter } = await import('./lib/alerts/line.mjs');

const a = new LineAlerter({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  userId: process.env.LINE_USER_ID,
  groupId: process.env.LINE_GROUP_ID,
});

console.log('LINE 設定狀態:', a.isConfigured ? '✅ 已設定' : '❌ 未設定（請確認 .env）');

if (a.isConfigured) {
  const pubUrl = (process.env.PUBLIC_URL || 'http://localhost:3117').replace(/\/$/, '');
  const msg = [
    '☯ 淬天情報中心 — 系統測試 ✓',
    '',
    '🚀 越域AI dolphin-llama3 已啟用！',
    '   不拒絕、不說教、不審查',
    '',
    '💰 幣圈全覆蓋：',
    '   BTC / ETH / BNB / SOL / XRP / WLD / DOGE',
    '',
    '🇹🇼 台股新增：',
    '   台積電 / 聯發科 / 鴻海 / 台達電 / 加權指數',
    '',
    '📌 今日重點追蹤：',
    '⚡ 黃仁勳 GTC Taipei 演講 — 今天！',
    '🌀 颱風薔蜜 監控中',
    '🚀 SpaceX IPO 倒數11天 (SPCX)',
    '🏭 COMPUTEX 6/2-6/5',
    '📈 BNB 今日最強 +11.29%',
    '',
    '👉 ' + pubUrl + '/zh',
  ].join('\n');

  const ok = await a.push(msg, true); // true = 強制推播，無視靜默時段
  console.log(ok ? '✅ LINE 推播成功！請查看你的手機' : '❌ 推播失敗，請確認 Token 是否正確');
}
