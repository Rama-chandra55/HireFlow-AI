import superjson from "superjson";
import { schema, type OutputType } from "./application-status_GET.schema";
import { getHireFlowN8nBaseUrl, getHireFlowN8nHeaders, parseUpstreamResponse } from "../helpers/hireflowServer";
import { db } from "../helpers/db";
import { assertPublicRateLimit, PublicRateLimitError } from "../helpers/publicRateLimit";

export async function handle(request: Request) {
  try {
    await assertPublicRateLimit(request, "status-lookup", 30, 15 * 60 * 1000);
    const url = new URL(request.url);
    const input = schema.parse({ applicationId: url.searchParams.get("applicationId") || "", email: url.searchParams.get("email") || "" });
    const upstream = new URL(`${getHireFlowN8nBaseUrl()}/webhook/hireflow/api/v1/application-status`);
    upstream.searchParams.set("applicationId", input.applicationId);
    upstream.searchParams.set("email", input.email);
    const response = await fetch(upstream.toString(), { headers: await getHireFlowN8nHeaders() });
    const { data, status } = await parseUpstreamResponse(response);
    let enriched = data;
    if (status >= 200 && status < 300 && data && typeof data === "object" && "ok" in data && (data as { ok?: unknown }).ok === true && "application" in data) {
      const decision = await db.selectFrom("recruiterDecisions").select(["interviewStart", "interviewEnd"]).where("applicationId", "=", input.applicationId).executeTakeFirst();
      const application = (data as { application: Record<string, unknown> }).application;
      enriched = {
        ...data,
        application: {
          ...application,
          interviewStart: decision?.interviewStart ? new Date(decision.interviewStart).toISOString() : application.interviewStart,
          interviewEnd: decision?.interviewEnd ? new Date(decision.interviewEnd).toISOString() : application.interviewEnd,
        },
      };
    }
    return new Response(superjson.stringify(enriched as OutputType), { status, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status service unavailable";
    const status = error instanceof PublicRateLimitError ? 429 : message.includes("connected") ? 503 : 400;
    return new Response(superjson.stringify({ ok: false, error: message }), { status });
  }
}
