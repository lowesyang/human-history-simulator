import type { AgentMessage } from "./types";
import { getEffectiveApiKey, getEffectiveModel } from "@/lib/settings";

const LLM_TIMEOUT_MS = 120_000;
const STREAMING_STALL_MS = 30_000;

export type TokenCallback = (regionId: string, token: string) => void;

export interface LlmUsageStats {
  totalCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  avgLatencyMs: number;
  callHistory: { regionId: string; promptTokens: number; completionTokens: number; latencyMs: number; timestamp: number }[];
}

const usageStats: LlmUsageStats = {
  totalCalls: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalTokens: 0,
  avgLatencyMs: 0,
  callHistory: [],
};

const MAX_HISTORY = 100;

export function getLlmUsageStats(): LlmUsageStats {
  return { ...usageStats, callHistory: [...usageStats.callHistory] };
}

export function resetLlmUsageStats(): void {
  usageStats.totalCalls = 0;
  usageStats.totalPromptTokens = 0;
  usageStats.totalCompletionTokens = 0;
  usageStats.totalTokens = 0;
  usageStats.avgLatencyMs = 0;
  usageStats.callHistory = [];
}

function recordUsage(regionId: string, promptTokens: number, completionTokens: number, latencyMs: number) {
  usageStats.totalCalls++;
  usageStats.totalPromptTokens += promptTokens;
  usageStats.totalCompletionTokens += completionTokens;
  usageStats.totalTokens += promptTokens + completionTokens;
  usageStats.avgLatencyMs = Math.round(
    ((usageStats.avgLatencyMs * (usageStats.totalCalls - 1)) + latencyMs) / usageStats.totalCalls
  );
  usageStats.callHistory.push({ regionId, promptTokens, completionTokens, latencyMs, timestamp: Date.now() });
  if (usageStats.callHistory.length > MAX_HISTORY) {
    usageStats.callHistory.shift();
  }
}

export async function callAgentStreaming(
  messages: AgentMessage[],
  regionId: string,
  onToken: TokenCallback,
  options?: { temperature?: number }
): Promise<string> {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const model = getEffectiveModel();
  const temperature = options?.temperature ?? 0.5;
  const startTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://human-history-simulator.local",
          "X-Title": "Human Civilization Simulator",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          stream: true,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API error ${response.status}: ${err}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let finishReason = "";
    let usageData: { prompt_tokens?: number; completion_tokens?: number } | null = null;
    let lastDataTime = Date.now();

    while (true) {
      const readPromise = reader.read();
      const stallCheck = new Promise<{ done: true; value: undefined }>((resolve) => {
        const id = setInterval(() => {
          if (Date.now() - lastDataTime > STREAMING_STALL_MS) {
            clearInterval(id);
            resolve({ done: true, value: undefined });
          }
        }, 5_000);
        readPromise.then(() => clearInterval(id)).catch(() => clearInterval(id));
      });

      const { done, value } = await Promise.race([readPromise, stallCheck]);
      if (done && !value && fullContent.length === 0) {
        throw new Error(`LLM streaming stalled for ${STREAMING_STALL_MS}ms with no content`);
      }
      if (done) break;
      lastDataTime = Date.now();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;

        try {
          const chunk = JSON.parse(payload);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onToken(regionId, delta);
          }
          const fr = chunk.choices?.[0]?.finish_reason;
          if (fr) finishReason = fr;
          if (chunk.usage) usageData = chunk.usage;
        } catch {
          // skip malformed chunks
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    const promptTokens = usageData?.prompt_tokens ?? Math.ceil(messages.reduce((s, m) => s + m.content.length, 0) / 4);
    const completionTokens = usageData?.completion_tokens ?? Math.ceil(fullContent.length / 4);

    recordUsage(regionId, promptTokens, completionTokens, latencyMs);

    if (finishReason === "length") {
      console.warn(`[Agent] ${regionId}: streaming response truncated (finish_reason: length), ${fullContent.length} chars`);
    }

    console.log(
      `[Agent] ${regionId}: ${promptTokens}p + ${completionTokens}c = ${promptTokens + completionTokens}t, ${latencyMs}ms`
    );

    if (!fullContent) throw new Error("No content in LLM streaming response");
    return fullContent;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callAgent(
  messages: AgentMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const model = getEffectiveModel();
  const temperature = options?.temperature ?? 0.5;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://human-history-simulator.local",
          "X-Title": "Human Civilization Simulator",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const usage = data.usage;
    if (usage) {
      console.log(
        `[Agent] ${usage.prompt_tokens}p + ${usage.completion_tokens}c = ${usage.total_tokens}t`
      );
    }

    if (data.choices?.[0]?.finish_reason === "length") {
      console.warn("[Agent] Response truncated (finish_reason: length)");
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in LLM response");

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractJSONFromResponse(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  const braceStart = text.indexOf("{");
  const bracketStart = text.indexOf("[");

  if (braceStart === -1 && bracketStart === -1) return text;

  if (bracketStart !== -1 && (braceStart === -1 || bracketStart < braceStart)) {
    return text.slice(bracketStart);
  }

  return text.slice(braceStart);
}

export function safeParseJSON<T = unknown>(text: string): T {
  const jsonStr = extractJSONFromResponse(text);

  try {
    return JSON.parse(jsonStr);
  } catch { /* fall through */ }

  const sanitized = sanitizeJSONControlChars(jsonStr);
  if (sanitized !== jsonStr) {
    try {
      return JSON.parse(sanitized);
    } catch { /* fall through */ }
  }

  let target = sanitized !== jsonStr ? sanitized : jsonStr;

  // Fix bare =N patterns: "field":=7 -> "field":"=7"
  const bareEqualFixed = target.replace(/:(\s*)=([\d.]+)/g, ':$1"=$2"');
  if (bareEqualFixed !== target) {
    try {
      return JSON.parse(bareEqualFixed);
    } catch { /* fall through */ }
    target = bareEqualFixed;
  }

  try {
    const repaired = repairJSON(target);
    const result = JSON.parse(repaired);
    console.warn(`[JSON] Parsed with light repair (${jsonStr.length} chars)`);
    return result;
  } catch { /* fall through */ }

  try {
    const aggressive = aggressiveRepairJSON(target);
    const result = JSON.parse(aggressive);
    console.warn(`[JSON] Parsed with aggressive repair (${jsonStr.length} → ${aggressive.length} chars)`);
    return result;
  } catch { /* fall through */ }

  try {
    const nuclear = nuclearRepairJSON(target);
    const result = JSON.parse(nuclear);
    console.warn(`[JSON] Parsed with nuclear repair (${jsonStr.length} → ${nuclear.length} chars)`);
    return result;
  } catch (err) {
    console.error(`[JSON] All repair strategies failed for ${jsonStr.length} chars. First 200: ${jsonStr.slice(0, 200)}...`);
    throw err;
  }
}

/**
 * Fix unescaped control characters inside JSON string values.
 * Walks the string tracking whether we're inside a JSON string literal,
 * and escapes any raw control chars (0x00-0x1F) found there.
 */
function sanitizeJSONControlChars(json: string): string {
  const chars: string[] = [];
  let inStr = false;
  let esc = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    const code = json.charCodeAt(i);

    if (esc) {
      esc = false;
      chars.push(ch);
      continue;
    }

    if (inStr) {
      if (ch === "\\") {
        esc = true;
        chars.push(ch);
      } else if (ch === '"') {
        inStr = false;
        chars.push(ch);
      } else if (code < 0x20) {
        if (code === 0x0a) chars.push("\\n");
        else if (code === 0x0d) chars.push("\\r");
        else if (code === 0x09) chars.push("\\t");
        else chars.push(`\\u${code.toString(16).padStart(4, "0")}`);
      } else {
        chars.push(ch);
      }
      continue;
    }

    if (ch === '"') {
      inStr = true;
    }
    chars.push(ch);
  }

  return chars.join("");
}

/**
 * State-machine based JSON repair. Tracks complete values precisely,
 * truncates to the last position where a valid value ended, then
 * closes all open structures.
 */
function aggressiveRepairJSON(json: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  let lastSafePos = 0;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (inString) {
      if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
        lastSafePos = i + 1;
      }
      continue;
    }

    switch (ch) {
      case '"':
        inString = true;
        break;
      case "{":
        stack.push("}");
        break;
      case "[":
        stack.push("]");
        break;
      case "}":
      case "]":
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop();
          lastSafePos = i + 1;
        }
        break;
      default:
        // Track end of number / boolean / null literals
        if (/[\d.eE+\-]/.test(ch)) {
          let j = i + 1;
          while (j < json.length && /[\d.eE+\-]/.test(json[j])) j++;
          if (j < json.length) {
            const next = json[j];
            if (",]}".includes(next) || /\s/.test(next) || next === ":") {
              lastSafePos = j;
              i = j - 1;
            }
          }
          // If j === json.length, number is at end of string (potentially truncated)
          // Don't mark as safe — lastSafePos stays before this number
        } else if (json.startsWith("true", i) && (i + 4 >= json.length || /[,\]}\s]/.test(json[i + 4]))) {
          lastSafePos = i + 4;
          i += 3;
        } else if (json.startsWith("false", i) && (i + 5 >= json.length || /[,\]}\s]/.test(json[i + 5]))) {
          lastSafePos = i + 5;
          i += 4;
        } else if (json.startsWith("null", i) && (i + 4 >= json.length || /[,\]}\s]/.test(json[i + 4]))) {
          lastSafePos = i + 4;
          i += 3;
        }
        break;
    }
  }

  // Truncate: if we ended mid-string, mid-number, or mid-value, cut back
  let repaired = json.slice(0, lastSafePos);

  // Strip trailing commas, colons, and partial key patterns
  repaired = repaired.replace(/[,:]\s*$/, "");

  // Recount open structures and close them
  const finalStack: string[] = [];
  let fs = false;
  let fe = false;
  for (const ch of repaired) {
    if (fe) { fe = false; continue; }
    if (fs) {
      if (ch === "\\") fe = true;
      else if (ch === '"') fs = false;
      continue;
    }
    if (ch === '"') fs = true;
    else if (ch === "{") finalStack.push("}");
    else if (ch === "[") finalStack.push("]");
    else if ((ch === "}" || ch === "]") && finalStack.length > 0) finalStack.pop();
  }

  while (finalStack.length > 0) {
    repaired += finalStack.pop();
  }

  return repaired;
}

/**
 * Nuclear fallback: walks the JSON tracking structure depth.
 * Finds the last position where a complete value closed at any depth,
 * then truncates there and closes all remaining open structures.
 */
function nuclearRepairJSON(json: string): string {
  const start = json.indexOf("{");
  if (start === -1) throw new Error("No JSON object found");

  let depth = 0;
  let inStr = false;
  let esc = false;
  let lastClosePos = -1;

  for (let i = start; i < json.length; i++) {
    const ch = json[i];

    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }

    switch (ch) {
      case '"': inStr = true; break;
      case "{": case "[": depth++; break;
      case "}": case "]":
        depth--;
        if (depth >= 0) lastClosePos = i + 1;
        if (depth === 0) return json.slice(start, i + 1);
        break;
    }
  }

  if (lastClosePos > start) {
    let truncated = json.slice(start, lastClosePos);
    // Remove trailing separators
    truncated = truncated.replace(/[,:]\s*$/, "");

    // Recount and close open structures
    const closeStack: string[] = [];
    let s = false, e = false;
    for (const c of truncated) {
      if (e) { e = false; continue; }
      if (s) {
        if (c === "\\") e = true;
        else if (c === '"') s = false;
        continue;
      }
      if (c === '"') s = true;
      else if (c === "{") closeStack.push("}");
      else if (c === "[") closeStack.push("]");
      else if ((c === "}" || c === "]") && closeStack.length > 0) closeStack.pop();
    }
    while (closeStack.length > 0) truncated += closeStack.pop();
    return truncated;
  }

  throw new Error("Unable to repair JSON: no complete values found");
}

function repairJSON(json: string): string {
  let repaired = json;

  // Remove trailing incomplete key-value patterns
  repaired = repaired.replace(/,\s*"[^"]*":\s*"[^"]*$/m, "");
  repaired = repaired.replace(/,\s*"[^"]*":\s*$/m, "");
  repaired = repaired.replace(/,\s*"[^"]*$/m, "");

  // Close any open string literal
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }

  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,\s*([}\]])/g, "$1");

  // Remove trailing comma at end of content
  repaired = repaired.replace(/,\s*$/, "");

  const open = { brace: 0, bracket: 0 };
  const close = { brace: 0, bracket: 0 };
  for (const ch of repaired) {
    if (ch === "{") open.brace++;
    else if (ch === "}") close.brace++;
    else if (ch === "[") open.bracket++;
    else if (ch === "]") close.bracket++;
  }

  for (let i = 0; i < open.bracket - close.bracket; i++) repaired += "]";
  for (let i = 0; i < open.brace - close.brace; i++) repaired += "}";

  return repaired;
}
