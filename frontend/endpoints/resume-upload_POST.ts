import superjson from "superjson";
import { nanoid } from "nanoid";
import { upload } from "@floot/storage";
import { schema, type OutputType } from "./resume-upload_POST.schema";
import { assertPublicRateLimit, PublicRateLimitError } from "../helpers/publicRateLimit";

export async function handle(request: Request) {
  try {
    await assertPublicRateLimit(request, "resume-upload", 8, 60 * 60 * 1000);
    const input = schema.parse(superjson.parse(await request.text()));
    const storageKey = `applications/${nanoid(24)}.pdf`;
    const prepared = await upload({
      visibility: "private",
      filename: storageKey,
      contentType: "application/pdf",
      sizeBytes: input.sizeBytes,
      ifAbsent: true,
      expiresInSeconds: 300,
    });
    if (!prepared.ok) throw new Error(prepared.error.message || "Resume upload could not be prepared");
    const body: OutputType = { ok: true, storageKey, uploadUrl: prepared.presignedUrl, headers: prepared.headers };
    return new Response(superjson.stringify(body), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const status = error instanceof PublicRateLimitError ? 429 : 400;
    const body: OutputType = { ok: false, error: error instanceof Error ? error.message : "Resume upload unavailable" };
    return new Response(superjson.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }
}
