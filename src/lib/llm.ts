export async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "your_openrouter_api_key_here") {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const model = process.env.LLM_MODEL || "openai/gpt-5.4";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300_000);

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
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${err}`);
    }

    const data = await response.json();

    if (data.choices?.[0]?.finish_reason === "length") {
      console.warn("LLM response was truncated (finish_reason: length)");
    }

    const usage = data.usage;
    if (usage) {
      console.log(
        `LLM usage: ${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion = ${usage.total_tokens} tokens`
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    return text.slice(braceStart, braceEnd + 1);
  }
  return text;
}

export function tryParseJSON(text: string): unknown {
  const jsonStr = extractJSON(text);
  try {
    return JSON.parse(jsonStr);
  } catch {
    const repaired = repairTruncatedJSON(jsonStr);
    return JSON.parse(repaired);
  }
}

function repairTruncatedJSON(json: string): string {
  let repaired = json.replace(/,\s*([}\]])/g, "$1");

  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;

  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += "]";
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += "}";
  }

  return repaired;
}
