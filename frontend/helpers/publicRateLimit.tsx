import { createHash } from "crypto";
import { db } from "./db";

export class PublicRateLimitError extends Error {
  readonly status = 429;
  constructor(message = "Too many requests. Please try again shortly.") {
    super(message);
    this.name = "PublicRateLimitError";
  }
}

function getClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

export async function assertPublicRateLimit(request: Request, action: string, maxRequests: number, windowMs: number) {
  const actorHash = createHash("sha256").update(`${action}:${getClientAddress(request)}`).digest("hex");
  const since = new Date(Date.now() - windowMs);
  const result = await db
    .selectFrom("publicApiRateEvents")
    .select(({ fn }) => fn.countAll().as("count"))
    .where("actorHash", "=", actorHash)
    .where("action", "=", action)
    .where("createdAt", ">=", since)
    .executeTakeFirst();

  if (Number(result?.count ?? 0) >= maxRequests) throw new PublicRateLimitError();

  await db.insertInto("publicApiRateEvents").values({ actorHash, action, createdAt: new Date() }).execute();

  if (Math.random() < 0.03) {
    const cleanupBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.deleteFrom("publicApiRateEvents").where("createdAt", "<", cleanupBefore).execute().catch(() => undefined);
  }
}