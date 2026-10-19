import { getServerUserSession } from "./getServerUserSession";
import { setServerSession } from "./getSetServerSession";

export async function requireRecruiter(request: Request) {
  const { user, session } = await getServerUserSession(request);
  if (user.role !== "admin") throw new Error("Recruiter access required");
  return { user, session };
}

export async function refreshRecruiterSession(response: Response, session: { id: string; createdAt: number; lastAccessed: Date }) {
  await setServerSession(response, {
    id: session.id,
    createdAt: session.createdAt,
    lastAccessed: session.lastAccessed.getTime(),
  });
  return response;
}
