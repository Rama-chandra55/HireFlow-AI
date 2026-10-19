import superjson from "superjson";
import { z } from "zod";
import { getUrl, remove } from "@floot/storage";
import pdf from "pdf-parse";
import { db } from "../helpers/db";
import { type OutputType } from "./application_POST.schema";
import { getHireFlowN8nBaseUrl, getHireFlowN8nHeaders, parseUpstreamResponse } from "../helpers/hireflowServer";
import { assertPublicRateLimit, PublicRateLimitError } from "../helpers/publicRateLimit";

const serverSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  role: z.string().trim().min(2),
  storageKey: z.string().startsWith("applications/").endsWith(".pdf"),
  resumeFileName: z.string().trim().min(1).max(180),
  resumeSizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
});

export async function handle(request: Request) {
  let storageKey = "";
  try {
    await assertPublicRateLimit(request, "application-submit", 5, 60 * 60 * 1000);
    const input = serverSchema.parse(superjson.parse(await request.text()));
    storageKey = input.storageKey;
    const stored = await getUrl({ visibility: "private", filename: input.storageKey, expiresInSeconds: 300 });
    if (!stored.ok) throw new Error("Uploaded resume could not be read.");
    const fileResponse = await fetch(stored.url);
    if (!fileResponse.ok) throw new Error("Uploaded resume could not be read.");
    const bytes = new Uint8Array(await fileResponse.arrayBuffer());
    if (bytes.byteLength !== input.resumeSizeBytes || bytes.byteLength > 5 * 1024 * 1024) throw new Error("Uploaded resume size could not be verified.");
    const magic = new TextDecoder().decode(bytes.slice(0, 5));
    if (magic !== "%PDF-") throw new Error("Resume must be a valid PDF file.");
    const parsedPdf = await pdf(Buffer.from(bytes));
    const resumeText = parsedPdf.text
      .replace(/\u0000/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (resumeText.length < 40) {
      throw new Error("We could not extract readable text from this PDF. Please upload a text-based PDF resume.");
    }
    if (resumeText.length > 150_000) {
      throw new Error("The extracted resume text is unexpectedly large. Please upload a standard resume PDF.");
    }
    const response = await fetch(`${getHireFlowN8nBaseUrl()}/webhook/hireflow/api/v1/applications`, {
      method: "POST",
      headers: await getHireFlowN8nHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        role: input.role,
        resumeText,
        resumeFileName: input.resumeFileName,
        resumeMimeType: "application/pdf",
        resumeStorageKey: input.storageKey,
        resumeSizeBytes: input.resumeSizeBytes,
      }),
    });
    const { data, status } = await parseUpstreamResponse(response);
    const accepted = Boolean(data && typeof data === "object" && "ok" in data && (data as { ok?: unknown }).ok === true && "applicationId" in data);
    if (accepted) {
      const applicationId = String((data as { applicationId: unknown }).applicationId);
      await db.insertInto("applicationFiles").values({
        applicationId,
        storageKey: input.storageKey,
        originalFilename: input.resumeFileName,
        contentType: "application/pdf",
        sizeBytes: input.resumeSizeBytes,
        createdAt: new Date(),
      }).onConflict(conflict => conflict.column("applicationId").doUpdateSet({
        storageKey: input.storageKey,
        originalFilename: input.resumeFileName,
        contentType: "application/pdf",
        sizeBytes: input.resumeSizeBytes,
      })).execute();
    } else {
      await remove({ visibility: "private", filename: input.storageKey });
      storageKey = "";
    }
    return new Response(superjson.stringify(data as OutputType), { status, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    if (storageKey) await remove({ visibility: "private", filename: storageKey }).catch(() => undefined);
    console.error("HireFlow application proxy error", error);
    const status = error instanceof PublicRateLimitError ? 429 : 400;
    return new Response(superjson.stringify({ ok: false, error: error instanceof Error ? error.message : "Application service unavailable" }), { status });
  }
}
