import type { AgentMessage, ReviewResult } from "./types";
import type { Region } from "../types";
import { callAgent, safeParseJSON } from "./llm-client";

const FIXER_SYSTEM = `You are a data correction agent for a historical civilization simulation.
Given region data and specific issues identified by a reviewer, fix the issues.

Output ONLY compact JSON — an array of the corrected region objects:
[<complete region object 1>, <complete region object 2>, ...]

Rules:
- Only output regions that actually need fixing
- Output COMPLETE region objects (all fields) for each fixed region
- ALL text fields must be bilingual: {"zh": "...", "en": "..."}
- Fix the specific issues listed, don't change unrelated data
- Ensure internal consistency after fixes`;

export async function runFixer(
  regions: Region[],
  review: ReviewResult
): Promise<Region[]> {
  if (review.issues.length === 0) return [];

  const messages: AgentMessage[] = [
    { role: "system", content: FIXER_SYSTEM },
    {
      role: "user",
      content: `Issues to fix:
${review.issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Suggestions:
${review.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Current region data:
${JSON.stringify(regions)}`,
    },
  ];

  const response = await callAgent(messages, { temperature: 0.3 });

  const parsed = safeParseJSON(response);
  if (Array.isArray(parsed)) return parsed as Region[];

  const obj = parsed as Record<string, unknown>;
  if (obj.regions && Array.isArray(obj.regions)) return obj.regions as Region[];

  return [];
}
