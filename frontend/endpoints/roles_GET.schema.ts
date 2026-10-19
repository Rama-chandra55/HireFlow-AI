import superjson from "superjson";
import { z } from "zod";

export const schema = z.object({});
export type Role = { role: string; mustHaves: string; niceToHaves: string; notes: string };
export type OutputType = { ok: true; roles: Role[] } | { ok: false; error: string };

export const getRoles = async (_body: z.infer<typeof schema> = {}, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch("/_api/roles", { method: "GET", ...init });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Unable to load roles");
  return payload;
};
