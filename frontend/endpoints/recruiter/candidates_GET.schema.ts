import superjson from "superjson";
import { z } from "zod";

export const schema = z.object({});
export type MatchedRequirement = { requirement: string; evidence: string };
export type Candidate = {
  applicationId: string; name: string; email: string; role: string; stage: string; source: string;
  appliedAt: string | null; parseQuality: string | null; aiSummary: string;
  matchedRequirements: MatchedRequirement[]; missingRequirements: string[];
  evidence: { experience?: string[]; projects?: string[]; education?: string; skills?: string[] };
  confidence: string; recruiterNotes: string; interviewStart: string | null; interviewEnd: string | null; decisionRequired: boolean; resumeAvailable?: boolean;
};
export type OutputType = { ok: true; candidates: Candidate[]; count: number } | { ok: false; error: string };
export const getRecruiterCandidates = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch("/_api/recruiter/candidates", { method: "GET", ...init });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Unable to load candidates");
  return payload;
};
