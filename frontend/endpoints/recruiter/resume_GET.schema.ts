import superjson from "superjson";
import { z } from "zod";

export const schema = z.object({ applicationId: z.string().min(4) });
export type OutputType =
  | { ok: true; url: string; fileName: string }
  | { ok: false; error: string };

export async function getRecruiterResume(input: z.infer<typeof schema>): Promise<OutputType> {
  const valid = schema.parse(input);
  const result = await fetch(`/_api/recruiter/resume?applicationId=${encodeURIComponent(valid.applicationId)}`, { method: "GET" });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Resume unavailable");
  return payload;
}
