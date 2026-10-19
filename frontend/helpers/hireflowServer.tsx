import { db } from "./db";

let cachedWebhookSecret: string | null = null;

export function getHireFlowN8nBaseUrl() {
  const permanentBase = "https://hireflow-n8n-d8ri.onrender.com";
  const raw = (process.env as Record<string, string | undefined>)["HIRE_FLOW_N8N_PUBLIC_URL"];
  if (!raw) return permanentBase;
  const base = raw.trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(base)) throw new Error("HireFlow n8n API must use a public HTTPS URL.");
  if (/ngrok/i.test(base)) return permanentBase;
  return base;
}

async function getHireFlowWebhookSecret() {
  if (cachedWebhookSecret) return cachedWebhookSecret;
  const row = await db
    .selectFrom("hireflowServerSecrets")
    .select("secretValue")
    .where("key", "=", "n8n_webhook_token")
    .executeTakeFirst();
  if (!row?.secretValue) throw new Error("HireFlow n8n gateway credential is not configured.");
  cachedWebhookSecret = row.secretValue;
  return cachedWebhookSecret;
}

export async function getHireFlowN8nHeaders(extra: Record<string, string> = {}) {
  const secret = await getHireFlowWebhookSecret();
  const authorization = Buffer.from(`hireflow:${secret}`, "utf8").toString("base64");
  return {
    Accept: "application/json",
    ...extra,
    Authorization: `Basic ${authorization}`,
  };
}

export async function parseUpstreamResponse(response: Response) {
  const text = await response.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = { error: text || "Invalid upstream response" }; }
  return { data, status: response.status };
}
