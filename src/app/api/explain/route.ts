import { NextRequest } from "next/server";
import { getEffectiveApiKey, getEffectiveModel } from "@/lib/settings";
import { applyClientHeaders } from "@/lib/api-headers";
import { CONTENT_FILTER_PROMPT } from "@/lib/content-filter";

export async function POST(req: NextRequest) {
  applyClientHeaders(req);
  const body = await req.json();
  const {
    regionName,
    regionId,
    year,
    era,
    events,
    changeLabel,
    changeDetail,
    changeSentiment,
    regionDescription,
    locale,
  } = body as {
    regionName: string;
    regionId: string;
    year: number;
    era: string;
    events: string[];
    changeLabel: string;
    changeDetail: string;
    changeSentiment: string;
    regionDescription: string;
    locale: "zh" | "en";
  };

  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
    });
  }

  const model = getEffectiveModel();

  const lang = locale === "zh" ? "中文" : "English";
  const yearStr =
    locale === "zh"
      ? year < 0
        ? `公元前${Math.abs(year)}年`
        : `公元${year}年`
      : year < 0
        ? `${Math.abs(year)} BCE`
        : `${year} CE`;

  const eventsText = events.length > 0 ? events.join("; ") : (locale === "zh" ? "无特定触发事件" : "No specific triggering events");

  const systemPrompt =
    locale === "zh"
      ? `你是一位严谨的历史学家。用户会给你一个文明在某个历史时期发生的具体变化，请你用简洁、清晰的${lang}解释这个变化产生的历史原因和逻辑。回答要基于真实历史背景，200字以内。\n\n${CONTENT_FILTER_PROMPT}`
      : `You are a rigorous historian. The user will give you a specific change that happened to a civilization in a historical period. Explain the historical causes and logic behind this change in concise, clear ${lang}. Base your answer on real historical context. Keep it under 150 words.\n\n${CONTENT_FILTER_PROMPT}`;

  const userPrompt =
    locale === "zh"
      ? `时间：${yearStr}，${era}\n文明：${regionName}\n触发事件：${eventsText}\n变化概述：${regionDescription}\n\n具体变化：「${changeLabel}」→ ${changeDetail}（趋势：${changeSentiment}）\n\n请解释为什么会产生这个变化。`
      : `Time: ${yearStr}, ${era}\nCivilization: ${regionName}\nTriggering events: ${eventsText}\nOverview: ${regionDescription}\n\nSpecific change: "${changeLabel}" → ${changeDetail} (trend: ${changeSentiment})\n\nExplain why this change occurred.`;

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
        temperature: 0.6,
        stream: true,
        max_tokens: 500,
      }),
    }
  );

  if (!response.ok || !response.body) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err }), {
      status: response.status,
    });
  }

  const encoder = new TextEncoder();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
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
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`)
                );
              }
            } catch {
              // skip
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
