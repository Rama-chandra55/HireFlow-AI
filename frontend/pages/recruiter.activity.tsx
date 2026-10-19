import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, History, Search, ShieldCheck, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRecruiterActivity } from "../endpoints/recruiter/activity_GET.schema";
import { formatHireFlowDateTime } from "../helpers/formatHireFlowDate";
import { Skeleton } from "../components/Skeleton";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import styles from "./recruiter.activity.module.css";

export default function RecruiterActivityPage() {
  const query = useQuery({ queryKey: ["hireflow", "recruiter", "activity"], queryFn: getRecruiterActivity });
  const activity = query.data?.ok ? query.data.activity : [];
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState<"ALL" | "ADVANCE" | "REJECT">("ALL");
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return activity.filter(item => {
      const decisionMatch = decision === "ALL" || item.decision === decision;
      const textMatch = !normalized || [item.candidateName, item.role, item.applicationId, item.recruiterName, item.recruiterNotes].join(" ").toLowerCase().includes(normalized);
      return decisionMatch && textMatch;
    });
  }, [activity, search, decision]);

  return <>
    <Helmet><title>Decision activity — HireFlow AI</title></Helmet>
    <header className={styles.header}>
      <div><span className={styles.kicker}>Audit trail</span><h1>Human decision activity</h1><p>A chronological record of recruiter decisions. AI evidence never creates an entry here by itself.</p></div>
      <div className={styles.trust}><ShieldCheck size={17}/><span>Human actions only</span></div>
    </header>

    <section className={styles.panel}>
      <div className={styles.panelHead}><History size={17}/><div><strong>Recent decisions</strong><span>{filtered.length} of {activity.length} recruiter actions shown</span></div></div>
      <div className={styles.filters}>
        <div className={styles.search}><Search size={15}/><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search candidate, role, notes, or recruiter" /></div>
        <div className={styles.segmented} role="group" aria-label="Filter decisions">
          <Button size="sm" variant={decision === "ALL" ? "secondary" : "ghost"} onClick={() => setDecision("ALL")}>All</Button>
          <Button size="sm" variant={decision === "ADVANCE" ? "secondary" : "ghost"} onClick={() => setDecision("ADVANCE")}>Advanced</Button>
          <Button size="sm" variant={decision === "REJECT" ? "secondary" : "ghost"} onClick={() => setDecision("REJECT")}>Rejected</Button>
        </div>
      </div>
      {query.isLoading && <div className={styles.loading}>{Array.from({length:5}).map((_,i)=><Skeleton key={i} className={styles.skeleton}/>)}</div>}
      {!query.isLoading && filtered.map((item,index)=><article key={`${item.applicationId}-${item.createdAt}`} className={styles.event} style={{animationDelay:`${Math.min(index,8)*45}ms`}}>
        <div className={`${styles.icon} ${item.decision === "REJECT" ? styles.reject : styles.advance}`}>{item.decision === "REJECT" ? <XCircle size={17}/> : <CheckCircle2 size={17}/>}</div>
        <div className={styles.main}><div className={styles.eventTop}><div><strong>{item.candidateName}</strong><span>{item.role}</span></div><time><Clock3 size={13}/>{formatHireFlowDateTime(item.createdAt)}</time></div><p><b>{item.decision === "ADVANCE" ? "Advanced" : "Rejected"}</b> by {item.recruiterName}{item.recruiterNotes ? ` — ${item.recruiterNotes}` : ""}</p>{item.interviewStart && <div className={styles.interview}><CalendarClock size={13}/><span>Interview {formatHireFlowDateTime(item.interviewStart)}{item.interviewEnd ? ` – ${formatHireFlowDateTime(item.interviewEnd)}` : ""}</span></div>}</div>
        <Link to={`/recruiter/candidates/${encodeURIComponent(item.applicationId)}`} aria-label={`Open ${item.candidateName}`}><ArrowRight size={16}/></Link>
      </article>)}
      {!query.isLoading && activity.length===0 && <div className={styles.empty}><History size={28}/><strong>No human decisions recorded yet</strong><span>Advance or reject a candidate and the audit trail will appear here.</span></div>}
      {!query.isLoading && activity.length>0 && filtered.length===0 && <div className={styles.empty}><Search size={28}/><strong>No matching decisions</strong><span>Try another search or change the decision filter.</span></div>}
      {query.error && <div className={styles.empty}><strong>Activity unavailable</strong><span>{query.error instanceof Error ? query.error.message : "Please retry."}</span></div>}
    </section>
  </>;
}
