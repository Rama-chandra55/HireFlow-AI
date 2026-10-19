import superjson from "superjson";
import { z } from "zod";
import type { Candidate } from "./candidates_GET.schema";
export const schema = z.object({ applicationId: z.string().min(4) });
export type OutputType = { ok: true; candidate: Candidate } | { ok: false; error: string };
export const getRecruiterCandidate = async (input: z.infer<typeof schema>, init?: RequestInit): Promise<OutputType> => {
  const valid = schema.parse(input);
  const result = await fetch(`/_api/recruiter/candidate?applicationId=${encodeURIComponent(valid.applicationId)}`, { method: "GET", ...init });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Unable to load candidate");
  return payload;
};
