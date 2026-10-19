import superjson from "superjson";
import { getHireFlowN8nBaseUrl, getHireFlowN8nHeaders, parseUpstreamResponse } from "../helpers/hireflowServer";
import type { OutputType } from "./roles_GET.schema";

export async function handle() {
  try {
    const response = await fetch(`${getHireFlowN8nBaseUrl()}/webhook/hireflow/api/v1/roles`, { headers: await getHireFlowN8nHeaders() });
    const { data, status } = await parseUpstreamResponse(response);
    if (!response.ok) return new Response(superjson.stringify({ ok: false, error: "Unable to load roles right now." }), { status });
    return new Response(superjson.stringify(data as OutputType), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("HireFlow roles proxy error", error);
    return new Response(superjson.stringify({ ok: false, error: error instanceof Error ? error.message : "Roles service unavailable" }), { status: 503 });
  }
}