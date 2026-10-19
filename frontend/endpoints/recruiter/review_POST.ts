import superjson from "superjson";
import { schema, type OutputType } from "./review_POST.schema";
import { getHireFlowN8nBaseUrl, getHireFlowN8nHeaders, parseUpstreamResponse } from "../../helpers/hireflowServer";
import { requireRecruiter, refreshRecruiterSession } from "../../helpers/requireRecruiter";
import { db } from "../../helpers/db";
export async function handle(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new Error("Invalid request origin");
    const { user, session } = await requireRecruiter(request);
    const input = schema.parse(superjson.parse(await request.text()));
    const upstream = await fetch(`${getHireFlowN8nBaseUrl()}/webhook/hireflow/api/v1/recruiter/review`, {
      method: "POST", headers: await getHireFlowN8nHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(input),
    });
    const { data, status } = await parseUpstreamResponse(upstream);
    if (status >= 200 && status < 300 && data && typeof data === "object" && "ok" in data && (data as { ok?: unknown }).ok === true) {
      const stage = "stage" in data ? String((data as { stage?: unknown }).stage ?? "") : "";
      try {
        await db.insertInto("recruiterDecisions").values({
          applicationId: input.applicationId,
          recruiterUserId: user.id,
          decision: input.decision,
          recruiterNotes: input.recruiterNotes,
          interviewStart: input.interviewStart ? new Date(input.interviewStart) : null,
          interviewEnd: input.interviewEnd ? new Date(input.interviewEnd) : null,
          upstreamStage: stage,
          createdAt: new Date(),
        }).onConflict(conflict => conflict.column("applicationId").doUpdateSet({
          recruiterUserId: user.id,
          decision: input.decision,
          recruiterNotes: input.recruiterNotes,
          interviewStart: input.interviewStart ? new Date(input.interviewStart) : null,
          interviewEnd: input.interviewEnd ? new Date(input.interviewEnd) : null,
          upstreamStage: stage,
        })).execute();
      } catch (auditError) {
        console.error("HireFlow decision audit persistence failed", auditError);
      }
    }
    return await refreshRecruiterSession(new Response(superjson.stringify(data as OutputType), { status, headers: { "Content-Type": "application/json" } }), session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recruiter API unavailable";
    return new Response(superjson.stringify({ ok: false, error: message }), { status: /access|required|auth/i.test(message) ? 403 : 400 });
  }
}
