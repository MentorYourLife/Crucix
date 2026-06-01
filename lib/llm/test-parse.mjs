/**
 * test-parse.mjs
 * Run: node lib/llm/test-parse.mjs
 *
 * Tests all 6 output formats that dolphin-llama3 / qwen may produce.
 */

// ─── Inline copy of parseIdeasResponse (mirrors ideas.mjs exactly) ─────────
function parseIdeasResponse(text) {
  if (!text) return null;

  let cleaned = text.trim();

  // Step 1: strip <think>...</think> blocks (qwen reasoning mode)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Step 2: extract from markdown code blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  }

  // Step 3: unwrap outer string quotes (dolphin-llama3 quirk), iteratively
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
        const inner = s.slice(1, -1)
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\');
        cleaned = inner.trim();
      }
    }
    break;
  }

  // Step 4: locate the top-level JSON array or object (bracket counting)
  // Avoids accidentally grabbing nested arrays like "signals"
  let jsonStr = null;

  const firstBracket = cleaned.search(/[\[{]/);
  if (firstBracket !== -1) {
    const opener = cleaned[firstBracket];
    const closer = opener === '[' ? ']' : '}';
    let depth = 0, inString = false, escape = false, end = -1;
    for (let i = firstBracket; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escape)          { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"')      { inString = !inString; continue; }
      if (inString)        continue;
      if (ch === opener)   depth++;
      else if (ch === closer) { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      const extracted = cleaned.slice(firstBracket, end + 1);
      jsonStr = opener === '[' ? extracted : '[' + extracted + ']';
    }
  }

  if (!jsonStr) return null;

  // Step 5: parse + validate
  const tryParse = (str) => {
    const parsed = JSON.parse(str);
    if (!Array.isArray(parsed)) {
      if (parsed && typeof parsed === 'object' && parsed.title) return [parsed];
      return null;
    }
    return parsed;
  };

  let parsed = null;
  try {
    parsed = tryParse(jsonStr);
  } catch (firstErr) {
    const fallbackArray = cleaned.match(/\[[\s\S]*\]/);
    if (fallbackArray) {
      try { parsed = tryParse(fallbackArray[0]); } catch { /* skip */ }
    }
    if (!parsed) {
      const fallbackObj = cleaned.match(/\{[\s\S]*\}/);
      if (fallbackObj) {
        try { parsed = tryParse('[' + fallbackObj[0] + ']'); } catch { /* skip */ }
      }
    }
    if (!parsed) return null;
  }

  if (!parsed) return null;

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

// ─── Shared fixture ─────────────────────────────────────────────────────────
const SINGLE_OBJ = `{ "title": "做多 TSM", "type": "LONG", "ticker": "TSM", "confidence": "HIGH", "rationale": "AI 需求強勁", "risk": "地緣衝突", "horizon": "Weeks", "signals": ["需求增加"] }`;
const ARRAY_OBJ  = `[${SINGLE_OBJ}, { "title": "觀察 BTC", "type": "WATCH", "ticker": "BTC", "confidence": "MEDIUM", "rationale": "資金流入穩定", "risk": "利率上升", "horizon": "Days", "signals": ["ETF 淨流入"] }]`;

// ─── Test cases ─────────────────────────────────────────────────────────────
const cases = [
  {
    id: 1,
    label: '字串包裹的 JSON 物件  "{ ... }"',
    input: JSON.stringify(SINGLE_OBJ),   // produces a double-quoted string
    minCount: 1,
  },
  {
    id: 2,
    label: '字串包裹的 JSON 陣列  "[ ... ]"',
    input: JSON.stringify(ARRAY_OBJ),    // produces a double-quoted string of an array
    minCount: 2,
  },
  {
    id: 3,
    label: '正常 JSON 陣列  [ ... ]',
    input: ARRAY_OBJ,
    minCount: 2,
  },
  {
    id: 4,
    label: '正常 JSON 物件（單一）{ ... } → 包成陣列',
    input: SINGLE_OBJ,
    minCount: 1,
  },
  {
    id: 5,
    label: 'markdown code block 包裹（含 json tag）',
    input: '```json\n' + ARRAY_OBJ + '\n```',
    minCount: 2,
  },
  {
    id: 6,
    label: '<think>...</think> + 正常陣列（qwen 思考模式）',
    input: '<think>這是我的分析過程，應該被過濾掉。</think>\n' + ARRAY_OBJ,
    minCount: 2,
  },
  {
    id: '5b',
    label: 'markdown code block 包裹字串包裹的陣列（雙重包裹）',
    input: '```json\n' + JSON.stringify(ARRAY_OBJ) + '\n```',
    minCount: 2,
  },
  {
    id: '6b',
    label: '<think> + markdown code block + 陣列（三層）',
    input: '<think>思考中…</think>\n```json\n' + ARRAY_OBJ + '\n```',
    minCount: 2,
  },
];

// ─── Runner ──────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

for (const tc of cases) {
  let result;
  let error = null;
  try {
    result = parseIdeasResponse(tc.input);
  } catch (e) {
    error = e;
    result = null;
  }

  const ok =
    !error &&
    Array.isArray(result) &&
    result.length >= tc.minCount &&
    result.every(r => r.title && r.type && r.confidence && r.source === 'llm');

  const status = ok ? '✅ PASS' : '❌ FAIL';
  if (ok) passed++; else failed++;

  console.log(`${status} [Case ${tc.id}] ${tc.label}`);
  if (!ok) {
    if (error) {
      console.log(`       Error: ${error.message}`);
    } else {
      console.log(`       Expected >= ${tc.minCount} ideas, got: ${JSON.stringify(result)}`);
    }
  } else {
    const titles = result.map(r => `"${r.title}"`).join(', ');
    console.log(`       → ${result.length} idea(s): ${titles}`);
  }
}

console.log('');
console.log(`─────────────────────────────────────────`);
console.log(`結果：${passed} 通過 / ${failed} 失敗 (共 ${cases.length} 項)`);
if (failed === 0) {
  console.log('🎉 全部測試通過！');
} else {
  console.log('⚠️  有測試失敗，請檢查上方輸出。');
  process.exit(1);
}
