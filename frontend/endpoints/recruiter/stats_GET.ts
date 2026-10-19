import superjson from "superjson";
import type { OutputType } from "./stats_GET.schema";
import { getHireFlowN8nBaseUrl, getHireFlowN8nHeaders, parseUpstreamResponse } from "../../helpers/hireflowServer";
import { requireRecruiter, refreshRecruiterSession } from "../../helpers/requireRecruiter";
import { isHiddenHireFlowQaApplication } from "../../helpers/hireflowQa";
export async function handle(request: Request) {
  try {
    const { session } = await requireRecruiter(request);
    const upstream = await fetch(`${getHireFlowN8nBaseUrl()}/webhook/hireflow/api/v1/recruiter/candidates`, { headers: await getHireFlowN8nHeaders() });
    const { data, status } = await parseUpstreamResponse(upstream);
    if (status < 200 || status >= 300 || !data || typeof data !== "object" || !("candidates" in data) || !Array.isArray((data as { candidates?: unknown }).candidates)) {
      return await refreshRecruiterSession(new Response(superjson.stringify(data as OutputType), { status, headers: { "Content-Type": "application/json" } }), session);
    }
    const rows = (data as { candidates: Array<{ applicationId?: string; role?: string; stage?: string }> }).candidates
      .filter(candidate => !isHiddenHireFlowQaApplication(candidate.applicationId));
    const byRole: Record<string, number> = {};
    let awaitingReview = 0, manualReview = 0, advanced = 0, rejected = 0, received = 0;
    for (const candidate of rows) {
      const stage = String(candidate.stage || "Received");
      const role = String(candidate.role || "Unspecified");
      const existingRole = Object.keys(byRole).find(key => key.toLowerCase() === role.toLowerCase()) || role;
      byRole[existingRole] = (byRole[existingRole] || 0) + 1;
      if (stage === "Awaiting Recruiter Review") awaitingReview++;
      else if (stage.startsWith("Needs Manual Review")) manualReview++;
      else if (stage.startsWith("Advanced")) advanced++;
      else if (stage.startsWith("Rejected")) rejected++;
      else received++;
    }
    const body: OutputType = { ok: true, stats: { total: rows.length, awaitingReview, manualReview, advanced, rejected, received, byRole } };
    return await refreshRecruiterSession(new Response(superjson.stringify(body), { headers: { "Content-Type": "application/json" } }), session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recruiter API unavailable";
    return new Response(superjson.stringify({ ok: false, error: message }), { status: /access|required|auth/i.test(message) ? 403 : 503 });
  }
}