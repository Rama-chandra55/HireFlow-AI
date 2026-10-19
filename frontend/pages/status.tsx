import React, { FormEvent, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import { CalendarClock, CheckCircle2, Clock3, Search, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { getApplicationStatus, type CandidateStatus } from "../endpoints/application-status_GET.schema";
import { formatHireFlowDateTime } from "../helpers/formatHireFlowDate";
import styles from "./status.module.css";

const stageSteps = ["Received", "Evidence prepared", "Recruiter review", "Decision"];

function stageIndex(stage: string) {
  if (/advanced|rejected/i.test(stage)) return 3;
  if (/awaiting recruiter|manual review/i.test(stage)) return 2;
  if (/received/i.test(stage)) return 0;
  return 1;
}

export default function StatusPage() {
  const [params] = useSearchParams();
  const [applicationId, setApplicationId] = useState(params.get("applicationId") || "");
  const [email, setEmail] = useState(params.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [application, setApplication] = useState<CandidateStatus | null>(null);

  async function lookup() {
    setLoading(true); setError(""); setApplication(null);
    try {
      const result = await getApplicationStatus({ applicationId, email });
      if (result.ok) setApplication(result.application);
      else setError(result.error);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to look up your application."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (applicationId && email) void lookup(); }, []);
  const submit = (e: FormEvent) => { e.preventDefault(); void lookup(); };
  const progress = application ? stageIndex(application.stage) : -1;

  return (
    <>
      <Helmet><title>Application status — HireFlow AI</title></Helmet>
      <section className={styles.page}>
        <div className={styles.intro}>
          <span className={styles.kicker}>Candidate portal</span>
          <h1>Track your application.</h1>
          <p>Use the application ID from your confirmation email and the same email address you applied with.</p>
        </div>

        <div className={styles.lookupCard}>
          <form onSubmit={submit} className={styles.lookupForm}>
            <label><span>Application ID</span><Input value={applicationId} onChange={e => setApplicationId(e.target.value)} placeholder="HF-…" required /></label>
            <label><span>Email</span><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" required /></label>
            <Button type="submit" size="lg" disabled={loading}>{loading ? <><span className={styles.spinner} /> Checking…</> : <><Search size={17} /> Check status</>}</Button>
          </form>
          <div className={styles.privacy}><ShieldCheck size={16} /><span>We require both values to protect your application information.</span></div>
        </div>

        {error && <div className={styles.error} role="alert"><strong>We couldn’t find that application.</strong><span>{error}</span></div>}

        {application && (
          <div className={styles.result}>
            <div className={styles.resultTop}>
              <div><span className={styles.mono}>{application.applicationId}</span><h2>{application.role}</h2><p>Application for {application.name}</p></div>
              <div className={styles.stageBadge}>{application.stage}</div>
            </div>
            <div className={styles.timeline}>
              {stageSteps.map((step, index) => (
                <div key={step} className={`${styles.timelineStep} ${index <= progress ? styles.complete : ""} ${index === progress ? styles.current : ""}`}>
                  <span className={styles.node}>{index < progress ? <CheckCircle2 size={15} /> : index + 1}</span>
                  <div><strong>{step}</strong>{index === progress && <small>Current stage</small>}</div>
                </div>
              ))}
            </div>
            {(application.interviewStart || application.interviewEnd) && (
              <div className={styles.interview}><CalendarClock size={20} /><div><strong>Interview scheduled</strong><span>{application.interviewStart ? formatHireFlowDateTime(application.interviewStart) : "Time pending"}{application.interviewEnd ? ` → ${formatHireFlowDateTime(application.interviewEnd)}` : ""}</span></div></div>
            )}
            <div className={styles.resultFoot}><Clock3 size={15} /><span>Status reflects the latest recruiter action recorded in HireFlow.</span></div>
          </div>
        )}
      </section>
    </>
  );
}