import superjson from "superjson";
import { z } from "zod";

export const schema = z.object({
  applicationId: z.string().min(4),
  email: z.string().email(),
});
export type CandidateStatus = { applicationId: string; name: string; role: string; stage: string; appliedAt: string | null; interviewStart: string | null; interviewEnd: string | null };
export type OutputType = { ok: true; application: CandidateStatus } | { ok: false; error: string };

export const getApplicationStatus = async (body: z.infer<typeof schema>, init?: RequestInit): Promise<OutputType> => {
  const valid = schema.parse(body);
  const query = new URLSearchParams(valid).toString();
  const result = await fetch(`/_api/application-status?${query}`, { method: "GET", ...init });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Unable to load application status");
  return payload;
};
