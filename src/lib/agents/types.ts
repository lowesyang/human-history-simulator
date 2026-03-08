import type { WorldState, HistoricalEvent } from "../types";

export type AgentRole =
  | "planner"
  | "historian"
  | "economist"
  | "military"
  | "diplomat"
  | "reviewer";

export interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AgentContext {
  currentState: WorldState;
  events: HistoricalEvent[];
  targetYear: number;
}

export interface PlannerOutput {
  affectedRegionIds: string[];
  indirectRegionIds: string[];
  analysisPoints: string[];
  eventSummary: string;
}

export interface ReviewResult {
  approved: boolean;
  issues: string[];
  suggestions: string[];
}

export type ProgressCallback = (stage: string, detail?: Record<string, unknown>) => void;
export type TokenStreamCallback = (regionId: string, token: string) => void;
