// LLM-Powered Trade Ideas — generates actionable ideas from sweep data + delta context

/**
 * Generate LLM-enhanced trade ideas from sweep data.
 * @param {LLMProvider} provider - configured LLM provider
 * @param {object} sweepData - synthesized dashboard data
 * @param {object|null} delta - delta from last sweep
 * @param {Array} previousIdeas - ideas from previous runs (for dedup)
 * @returns {Promise<Array>} - array of idea objects
 */
export async function generateLLMIdeas(provider, sweepData, delta, previousIdeas = []) {
  if (!provider?.isConfigured) return null;

  let context;
  try {
    context = compactSweepForLLM(sweepData, delta, previousIdeas);
  } catch (err) {
    console.error('[LLM Ideas] Failed to compact sweep data:', err.message);
    return null;
  }

  const systemPrompt = `你是「淬天情報中心」的首席量化分析師，代號 SKY-QUANT。你接收來自 25 個情報源的結構化 OSINT、總體經濟數據、市場信號，必須在 3 分鐘內給出 5–8 個具備殺傷力的交易策略。

【核心分析框架】
你必須優先聚焦以下高優先度主題，有信號就要點名：

1. 🇹🇼 台股核心標的
   - 台積電（2330.TW / TSM）：AI 晶片需求、先進製程、黃仁勳題材
   - 聯發科（2454.TW）：天璣旗艦、AI 終端、手機復甦
   - COMPUTEX 概念股（緯創、廣達、英業達）：黃仁勳演講倒數

2. 🪙 加密貨幣核心部位
   - BTC：現貨 ETF 資金流量、礦工拋售壓力、宏觀利率敏感度
   - BNB：幣安生態動能、監管壓力、鏈上活躍度
   - WLD（Worldcoin）：AI 身分敘事、Sam Altman 動態
   - 整體加密市場多空結構

3. 🚀 SpaceX IPO 倒數（目標日期 6/12，SPCX 代理 ETF）
   - 距離 6/12 還剩天數決定策略積極度
   - 倒數 < 14 天：高度積極看多 SPCX、航太 ETF（ITA、XAR）

4. 🌀 颱風薔蜜對台股的影響
   - 台灣半導體廠商生產中斷風險
   - 航運、保險（國泰金）反應
   - 颱風後重建概念（電線電纜、建材）

5. 🌏 地緣風險矩陣（台海、烏克蘭、中東）

【規則（鐵律，不得違反）】
- 每個建議必須引用輸入數據中的具體數字或信號
- 必須包含：進場理由、關鍵風險、時間框架
- 跨域交叉分析：地緣→能源→科技→匯率的連鎖效應
- 具體到代號（股票代碼、期貨合約、ETF）
- Delta 顯示重大變化時，優先處理
- 不重複「先前建議」清單中的標的，除非條件有重大改變
- 信心等級：HIGH（多重確認信號）、MEDIUM（論點成立）、LOW（投機性）
- 語氣要犀利、直接、有觀點，不要廢話

【輸出格式】
只輸出合法 JSON 陣列，不要有任何前綴或說明文字。每個物件結構：
{
  "title": "簡短標題（最多 10 個字）",
  "type": "LONG|SHORT|HEDGE|WATCH|AVOID",
  "ticker": "主要標的代碼",
  "confidence": "HIGH|MEDIUM|LOW",
  "rationale": "2-3 句引用具體數據的分析",
  "risk": "最關鍵的一個風險因子",
  "horizon": "Intraday|Days|Weeks|Months",
  "signals": ["信號1", "信號2"]
}
重要：直接輸出 JSON，不要加任何說明文字，不要用引號包裹整個 JSON`;

  try {
    const result = await provider.complete(systemPrompt, context, { maxTokens: 8192, timeout: 90000 });
    const ideas = parseIdeasResponse(result.text);
    if (ideas && ideas.length > 0) {
      return ideas;
    }
    console.warn('[LLM Ideas] No valid ideas parsed from response. Raw length:', result.text?.length, 'First 1000 chars:', JSON.stringify(result.text?.slice(0, 1000)));
    return null;
  } catch (err) {
    console.error('[LLM Ideas] Generation failed:', err.message);
    return null;
  }
}

/**
 * Compact sweep data to ~8KB for token efficiency.
 */
function compactSweepForLLM(data, delta, previousIdeas) {
  const sections = [];

  // Economic indicators
  if (data.fred?.length) {
    const key = data.fred.filter(f => ['VIXCLS', 'DFF', 'DGS10', 'DGS2', 'T10Y2Y', 'BAMLH0A0HYM2', 'DTWEXBGS', 'MORTGAGE30US'].includes(f.id));
    sections.push(`ECONOMIC: ${key.map(f => `${f.id}=${f.value}${f.momChange ? ` (${f.momChange > 0 ? '+' : ''}${f.momChange})` : ''}`).join(', ')}`);
  }

  // Energy
  if (data.energy) {
    sections.push(`ENERGY: WTI=$${data.energy.wti}, Brent=$${data.energy.brent}, NatGas=$${data.energy.natgas}, CrudeStocks=${data.energy.crudeStocks}bbl`);
  }

  // Metals
  if (data.metals?.gold != null || data.metals?.silver != null) {
    const gold = data.metals?.gold != null ? `$${data.metals.gold}` : 'n/a';
    const silver = data.metals?.silver != null ? `$${data.metals.silver}` : 'n/a';
    const goldChg = data.metals?.goldChangePct != null ? ` (${data.metals.goldChangePct >= 0 ? '+' : ''}${data.metals.goldChangePct}%)` : '';
    const silverChg = data.metals?.silverChangePct != null ? ` (${data.metals.silverChangePct >= 0 ? '+' : ''}${data.metals.silverChangePct}%)` : '';
    sections.push(`METALS: Gold=${gold}${goldChg}, Silver=${silver}${silverChg}`);
  }

  // BLS
  if (data.bls?.length) {
    sections.push(`LABOR: ${data.bls.map(b => `${b.id}=${b.value}`).join(', ')}`);
  }

  // Treasury
  if (data.treasury) {
    sections.push(`TREASURY: totalDebt=$${data.treasury}T`);
  }

  // Supply chain
  if (data.gscpi) {
    sections.push(`SUPPLY_CHAIN: GSCPI=${data.gscpi.value} (${data.gscpi.interpretation})`);
  }

  // Geopolitical signals (cap total OSINT text to ~1500 chars to keep prompt compact)
  const urgentPosts = (data.tg?.urgent || []).slice(0, 5);
  if (urgentPosts.length) {
    const MAX_OSINT_CHARS = 1500;
    let remaining = MAX_OSINT_CHARS;
    const lines = [];
    for (const p of urgentPosts) {
      const text = p.text || '';
      if (remaining <= 0) break;
      const trimmed = text.length > remaining ? text.substring(0, remaining) + '…' : text;
      lines.push(`- ${trimmed}`);
      remaining -= trimmed.length;
    }
    sections.push(`URGENT_OSINT:\n${lines.join('\n')}`);
  }

  // Thermal / fire detections
  if (data.thermal?.length) {
    const hotRegions = data.thermal.filter(t => t.det > 10).map(t => `${t.region}: ${t.det} detections (${t.hc} high-conf)`);
    if (hotRegions.length) sections.push(`THERMAL: ${hotRegions.join(', ')}`);
  }

  // Air activity
  if (data.air?.length) {
    const airSum = data.air.map(a => `${a.region}: ${a.total} aircraft`);
    sections.push(`AIR_ACTIVITY: ${airSum.join(', ')}`);
  }

  // Nuclear
  if (data.nuke?.length) {
    const anomalies = data.nuke.filter(n => n.anom);
    if (anomalies.length) sections.push(`NUCLEAR_ANOMALY: ${anomalies.map(n => `${n.site}: ${n.cpm}cpm`).join(', ')}`);
  }

  // WHO alerts
  if (data.who?.length) {
    sections.push(`WHO_ALERTS: ${data.who.slice(0, 3).map(w => w.title).join('; ')}`);
  }

  // Defense spending
  if (data.defense?.length) {
    const topContracts = data.defense.slice(0, 3).map(d => `$${((d.amount || 0) / 1e6).toFixed(0)}M to ${d.recipient}`);
    sections.push(`DEFENSE_CONTRACTS: ${topContracts.join(', ')}`);
  }

  // Delta context
  if (delta?.summary) {
    sections.push(`\nDELTA_SINCE_LAST_SWEEP: direction=${delta.summary.direction}, changes=${delta.summary.totalChanges}, critical=${delta.summary.criticalChanges}`);
    if (delta.signals?.escalated?.length) {
      sections.push(`ESCALATED: ${delta.signals.escalated.map(s => `${s.label}: ${s.previous}→${s.current} (${(s.changePct||0) > 0 ? '+' : ''}${(s.changePct||0).toFixed(1)}%)`).join(', ')}`);
    }
    if (delta.signals?.new?.length) {
      sections.push(`NEW_SIGNALS: ${delta.signals.new.map(s => s.label || s.text?.substring(0, 60)).join('; ')}`);
    }
  }

  // Previous ideas (for dedup)
  if (previousIdeas.length) {
    sections.push(`\nPREVIOUS_IDEAS (avoid repeating):\n${previousIdeas.map(i => `- ${i.title} [${i.type}]`).join('\n')}`);
  }

  return sections.join('\n');
}

/**
 * Parse LLM response into ideas array.
 * Handles all known dolphin-llama3 / qwen output quirks:
 *   1. String-wrapped JSON object:  "{ ... }"
 *   2. String-wrapped JSON array:   "[ ... ]"
 *   3. Normal JSON array:           [ ... ]
 *   4. Normal JSON object (single): { ... }  → wrapped as array
 *   5. Markdown code block wrapping any of the above
 *   6. <think>...</think> prefix (qwen thinking mode)
 */
function parseIdeasResponse(text) {
  if (!text) return null;

  let cleaned = text.trim();

  // ── Step 1: strip <think>...</think> blocks (qwen reasoning mode) ────────
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // ── Step 2: extract from markdown code blocks ────────────────────────────
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  } else if (cleaned.startsWith('```')) {
    // Unclosed code block edge case
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  }

  // ── Step 3: unwrap outer string quotes (dolphin-llama3 quirk) ────────────
  // Handles both double-quoted and single-quoted outer wrapping.
  // We do this iteratively in case of double-wrapping.
  for (let i = 0; i < 3; i++) {
    const s = cleaned;
    if ((s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))) {
      try {
        const unwrapped = JSON.parse(s);
        if (typeof unwrapped === 'string') {
          cleaned = unwrapped.trim();
          continue;
        }
      } catch {
        // Not valid JSON string — try manual strip
        const inner = s.slice(1, -1)
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\');
        cleaned = inner.trim();
      }
    }
    break;
  }

  // ── Step 4: locate the top-level JSON array or object ────────────────────
  // Use bracket counting so we don't accidentally grab a nested array
  // (e.g. the "signals" field) instead of the top-level structure.
  let jsonStr = null;

  const firstBracket = cleaned.search(/[\[{]/);
  if (firstBracket !== -1) {
    const opener = cleaned[firstBracket];
    const closer = opener === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    let escape = false;
    let end = -1;
    for (let i = firstBracket; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === opener) depth++;
      else if (ch === closer) {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end !== -1) {
      const extracted = cleaned.slice(firstBracket, end + 1);
      jsonStr = opener === '[' ? extracted : '[' + extracted + ']';
    }
  }

  if (!jsonStr) {
    console.warn('[LLM Ideas] parseIdeasResponse: no JSON structure found in response');
    return null;
  }

  // ── Step 5: parse + validate ─────────────────────────────────────────────
  const tryParse = (str) => {
    const parsed = JSON.parse(str);
    if (!Array.isArray(parsed)) {
      // Could be a single object returned without array brackets
      if (parsed && typeof parsed === 'object' && parsed.title) {
        return [parsed];
      }
      return null;
    }
    return parsed;
  };

  let parsed = null;
  try {
    parsed = tryParse(jsonStr);
  } catch (firstErr) {
    // Last-resort: scan for first complete array/object in original cleaned text
    const fallbackArray = cleaned.match(/\[[\s\S]*\]/);
    if (fallbackArray) {
      try { parsed = tryParse(fallbackArray[0]); } catch { /* give up */ }
    }
    if (!parsed) {
      const fallbackObj = cleaned.match(/\{[\s\S]*\}/);
      if (fallbackObj) {
        try { parsed = tryParse('[' + fallbackObj[0] + ']'); } catch { /* give up */ }
      }
    }
    if (!parsed) {
      console.warn('[LLM Ideas] parseIdeasResponse: JSON.parse failed:', firstErr.message);
      return null;
    }
  }

  if (!parsed) return null;

  // Validate & normalise each idea
  return parsed
    .filter(idea => idea && idea.title && idea.type && idea.confidence)
    .map(idea => ({
      title:      idea.title,
      type:       idea.type,
      ticker:     idea.ticker     || '',
      confidence: idea.confidence,
      rationale:  idea.rationale  || '',
      risk:       idea.risk       || '',
      horizon:    idea.horizon    || '',
      signals:    Array.isArray(idea.signals) ? idea.signals : [],
      source:     'llm',
    }));
}
