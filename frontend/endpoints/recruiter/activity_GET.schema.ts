import superjson from "superjson";

export type RecruiterActivity = {
  applicationId: string;
  candidateName: string;
  role: string;
  decision: "ADVANCE" | "REJECT";
  recruiterNotes: string;
  recruiterName: string;
  interviewStart: string | null;
  interviewEnd: string | null;
  createdAt: string;
};

export type OutputType = { ok: true; activity: RecruiterActivity[] } | { ok: false; error: string };

export async function getRecruiterActivity(init?: RequestInit): Promise<OutputType> {
  const result = await fetch("/_api/recruiter/activity", { method: "GET", ...init });
  const payload = superjson.parse<OutputType>(await result.text());
  if (!result.ok) throw new Error("error" in payload ? payload.error : "Unable to load recruiter activity");
  return payload;
}
