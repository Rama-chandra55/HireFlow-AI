import superjson from "superjson";
import { z } from "zod";
export const schema = z.object({
  applicationId: z.string().min(4),
  decision: z.enum(["ADVANCE", "REJECT"]),
  recruiterNotes: z.string().max(5000).default(""),
  interviewStart: z.string().optional().default(""),
  interviewEnd: z.string().optional().default(""),
});
export type OutputType = { ok: true; applicationId: string; stage: string; interviewScheduled?: boolean } | { ok: false; error: string; stage?: string };
export const postRecruiterReview = async (body: z.infer<typeof schema>, init?: RequestInit): Promise<OutputType> => {
  const valid = schema.parse(body);
  const result = await fetch("/_api/recruiter/review", { method: "POST", body: superjson.stringify(valid), headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, ...init });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Recruiter decision could not be saved");
  return payload;
};
