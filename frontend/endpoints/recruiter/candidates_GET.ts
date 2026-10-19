import superjson from "superjson";
import type { OutputType } from "./candidates_GET.schema";
import { getHireFlowN8nBaseUrl, getHireFlowN8nHeaders, parseUpstreamResponse } from "../../helpers/hireflowServer";
import { requireRecruiter, refreshRecruiterSession } from "../../helpers/requireRecruiter";
import { isHiddenHireFlowQaApplication } from "../../helpers/hireflowQa";

export async function handle(request: Request) {
  try {
    const { session } = await requireRecruiter(request);
    const upstream = await fetch(`${getHireFlowN8nBaseUrl()}/webhook/hireflow/api/v1/recruiter/candidates`, { headers: await getHireFlowN8nHeaders() });
    const { data, status } = await parseUpstreamResponse(upstream);
    let normalized = data;
    if (status >= 200 && status < 300 && data && typeof data === "object" && "ok" in data && (data as { ok?: unknown }).ok === true && "candidates" in data) {
      const payload = data as { ok: true; candidates: Array<{ applicationId?: string }>; count?: number };
      const applicationTime = (applicationId = "") => {
        const match = /^HF-(\d+)-/.exec(applicationId);
        return match ? Number(match[1]) : 0;
      };
      const candidates = payload.candidates
        .filter(candidate => !isHiddenHireFlowQaApplication(candidate.applicationId))
        .sort((a, b) => applicationTime(b.applicationId) - applicationTime(a.applicationId));
      normalized = { ...data, candidates, count: candidates.length };
    }
    const response = new Response(superjson.stringify(normalized as OutputType), { status, headers: { "Content-Type": "application/json" } });
    return await refreshRecruiterSession(response, session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recruiter API unavailable";
    return new Response(superjson.stringify({ ok: false, error: message }), { status: /access|required|auth/i.test(message) ? 403 : 503 });
  }
}
