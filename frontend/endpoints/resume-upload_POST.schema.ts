import superjson from "superjson";
import { z } from "zod";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const schema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.string().refine(value => value === "application/pdf", "Resume must be a PDF"),
  sizeBytes: z.number().int().positive().max(MAX_RESUME_BYTES),
});

export type InputType = z.infer<typeof schema>;
export type OutputType =
  | { ok: true; storageKey: string; uploadUrl: string; headers: Record<string, string> }
  | { ok: false; error: string };

export async function requestResumeUpload(input: InputType): Promise<OutputType> {
  const valid = schema.parse(input);
  const result = await fetch("/_api/resume-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(valid),
  });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Resume upload could not be prepared");
  return payload;
}
