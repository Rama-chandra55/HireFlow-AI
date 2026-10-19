import superjson from "superjson";
import { z } from "zod";
import { requestResumeUpload } from "./resume-upload_POST.schema";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  role: z.string().trim().min(2, "Choose a role"),
  resume: z.instanceof(File)
    .refine(file => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"), "Resume must be a PDF")
    .refine(file => file.size <= MAX_RESUME_BYTES, "Resume must be 5 MB or smaller"),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { ok: true; applicationId: string; stage: string; message: string } | { ok: false; duplicate?: boolean; applicationId?: string | null; error?: string; message?: string };

export const postApplication = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const valid = schema.parse(input);
  const prepared = await requestResumeUpload({ fileName: valid.resume.name, contentType: "application/pdf", sizeBytes: valid.resume.size });
  if (!prepared.ok) throw new Error(prepared.error);
  const uploaded = await fetch(prepared.uploadUrl, { method: "PUT", headers: prepared.headers, body: valid.resume });
  if (!uploaded.ok) throw new Error("Resume upload failed. Please try again.");
  const result = await fetch("/_api/application", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify({
      name: valid.name,
      email: valid.email,
      role: valid.role,
      storageKey: prepared.storageKey,
      resumeFileName: valid.resume.name,
      resumeSizeBytes: valid.resume.size,
    }),
    ...init,
  });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error(("error" in payload && payload.error) || ("message" in payload && payload.message) || "Application could not be submitted");
  return payload;
};
