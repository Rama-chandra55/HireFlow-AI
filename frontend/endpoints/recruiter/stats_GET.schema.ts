import superjson from "superjson";
import { z } from "zod";
export const schema = z.object({});
export type RecruiterStats = { total: number; awaitingReview: number; manualReview: number; advanced: number; rejected: number; received: number; byRole: Record<string, number> };
export type OutputType = { ok: true; stats: RecruiterStats } | { ok: false; error: string };
export const getRecruiterStats = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch("/_api/recruiter/stats", { method: "GET", ...init });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Unable to load dashboard stats");
  return payload;
};
