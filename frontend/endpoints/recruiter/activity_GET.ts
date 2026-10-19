import superjson from "superjson";
import { db } from "../../helpers/db";
import { requireRecruiter, refreshRecruiterSession } from "../../helpers/requireRecruiter";
import { getHireFlowN8nBaseUrl, getHireFlowN8nHeaders, parseUpstreamResponse } from "../../helpers/hireflowServer";
import type { OutputType } from "./activity_GET.schema";
import { isHiddenHireFlowQaApplication } from "../../helpers/hireflowQa";

export async function handle(request: Request) {
  try {
    const { session } = await requireRecruiter(request);
    const [decisions, upstream] = await Promise.all([
      db
        .selectFrom("recruiterDecisions")
        .leftJoin("users", "users.id", "recruiterDecisions.recruiterUserId")
        .select([
          "recruiterDecisions.applicationId",
          "recruiterDecisions.decision",
          "recruiterDecisions.recruiterNotes",
          "recruiterDecisions.interviewStart",
          "recruiterDecisions.interviewEnd",
          "recruiterDecisions.createdAt",
          "users.displayName as recruiterName",
        ])
        .orderBy("recruiterDecisions.createdAt", "desc")
        .limit(50)
        .execute(),
      fetch(`${getHireFlowN8nBaseUrl()}/webhook/hireflow/api/v1/recruiter/candidates`, { headers: await getHireFlowN8nHeaders() }),
    ]);

    const { data } = await parseUpstreamResponse(upstream);
    const candidates = data && typeof data === "object" && "candidates" in data && Array.isArray((data as { candidates?: unknown }).candidates)
      ? (data as { candidates: Array<{ applicationId?: string; name?: string; role?: string }> }).candidates
      : [];
    const candidateMap = new Map(candidates.map(candidate => [candidate.applicationId || "", candidate]));

    const body: OutputType = {
      ok: true,
      activity: decisions.filter(item => !isHiddenHireFlowQaApplication(item.applicationId)).map(item => {
        const candidate = candidateMap.get(item.applicationId);
        return {
          applicationId: item.applicationId,
          candidateName: candidate?.name || "Candidate",
          role: candidate?.role || "Role unavailable",
          decision: item.decision === "REJECT" ? "REJECT" : "ADVANCE",
          recruiterNotes: item.recruiterNotes,
          recruiterName: item.recruiterName || "Recruiter",
          interviewStart: item.interviewStart ? new Date(item.interviewStart).toISOString() : null,
          interviewEnd: item.interviewEnd ? new Date(item.interviewEnd).toISOString() : null,
          createdAt: new Date(item.createdAt).toISOString(),
        };
      }),
    };
    return await refreshRecruiterSession(new Response(superjson.stringify(body), { headers: { "Content-Type": "application/json" } }), session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activity unavailable";
    const body: OutputType = { ok: false, error: message };
    return new Response(superjson.stringify(body), { status: /access|required|auth/i.test(message) ? 403 : 503, headers: { "Content-Type": "application/json" } });
  }
}
