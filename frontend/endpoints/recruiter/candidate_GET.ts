import superjson from "superjson";
import { schema, type OutputType } from "./candidate_GET.schema";
import { getHireFlowN8nBaseUrl, getHireFlowN8nHeaders, parseUpstreamResponse } from "../../helpers/hireflowServer";
import { requireRecruiter, refreshRecruiterSession } from "../../helpers/requireRecruiter";
import { db } from "../../helpers/db";
import { isHiddenHireFlowQaApplication } from "../../helpers/hireflowQa";
export async function handle(request: Request) {
  try {
    const { session } = await requireRecruiter(request);
    const url = new URL(request.url);
    const input = schema.parse({ applicationId: url.searchParams.get("applicationId") || "" });
    if (isHiddenHireFlowQaApplication(input.applicationId)) {
      const body: OutputType = { ok: false, error: "Candidate not found." };
      return await refreshRecruiterSession(new Response(superjson.stringify(body), { status: 404, headers: { "Content-Type": "application/json" } }), session);
    }
    const upstreamUrl = new URL(`${getHireFlowN8nBaseUrl()}/webhook/hireflow/api/v1/recruiter/candidate`);
    upstreamUrl.searchParams.set("applicationId", input.applicationId);
    const upstream = await fetch(upstreamUrl.toString(), { headers: await getHireFlowN8nHeaders() });
    const { data, status } = await parseUpstreamResponse(upstream);
    let enriched = data;
    if (status >= 200 && status < 300 && data && typeof data === "object" && "ok" in data && (data as { ok?: unknown }).ok === true && "candidate" in data) {
      const [decision, file] = await Promise.all([
        db.selectFrom("recruiterDecisions").selectAll().where("applicationId", "=", input.applicationId).executeTakeFirst(),
        db.selectFrom("applicationFiles").select(["applicationId"]).where("applicationId", "=", input.applicationId).executeTakeFirst(),
      ]);
      const candidate = (data as { candidate: Record<string, unknown> }).candidate;
      enriched = {
        ...data,
        candidate: {
          ...candidate,
          interviewStart: decision?.interviewStart ? new Date(decision.interviewStart).toISOString() : candidate.interviewStart,
          interviewEnd: decision?.interviewEnd ? new Date(decision.interviewEnd).toISOString() : candidate.interviewEnd,
          resumeAvailable: Boolean(file),
        },
      };
    }
    return await refreshRecruiterSession(new Response(superjson.stringify(enriched as OutputType), { status, headers: { "Content-Type": "application/json" } }), session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recruiter API unavailable";
    return new Response(superjson.stringify({ ok: false, error: message }), { status: /access|required|auth/i.test(message) ? 403 : 400 });
  }
}
