import superjson from "superjson";
import { getUrl } from "@floot/storage";
import { db } from "../../helpers/db";
import { requireRecruiter, refreshRecruiterSession } from "../../helpers/requireRecruiter";
import { isHiddenHireFlowQaApplication } from "../../helpers/hireflowQa";
import { schema, type OutputType } from "./resume_GET.schema";

export async function handle(request: Request) {
  try {
    const { session } = await requireRecruiter(request);
    const url = new URL(request.url);
    const input = schema.parse({ applicationId: url.searchParams.get("applicationId") || "" });
    if (isHiddenHireFlowQaApplication(input.applicationId)) {
      const body: OutputType = { ok: false, error: "Original resume is not available for this application." };
      return await refreshRecruiterSession(new Response(superjson.stringify(body), { status: 404, headers: { "Content-Type": "application/json" } }), session);
    }
    const file = await db.selectFrom("applicationFiles").selectAll().where("applicationId", "=", input.applicationId).executeTakeFirst();
    if (!file) {
      const body: OutputType = { ok: false, error: "Original resume is not available for this application." };
      return await refreshRecruiterSession(new Response(superjson.stringify(body), { status: 404, headers: { "Content-Type": "application/json" } }), session);
    }
    const signed = await getUrl({ visibility: "private", filename: file.storageKey, expiresInSeconds: 300 });
    if (!signed.ok) throw new Error("Resume could not be opened.");
    const body: OutputType = { ok: true, url: signed.url, fileName: file.originalFilename };
    return await refreshRecruiterSession(new Response(superjson.stringify(body), { headers: { "Content-Type": "application/json" } }), session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume unavailable";
    const body: OutputType = { ok: false, error: message };
    return new Response(superjson.stringify(body), { status: /access|required|auth/i.test(message) ? 403 : 400, headers: { "Content-Type": "application/json" } });
  }
}
