import React, { useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileSearch, Users } from "lucide-react";
import { Button } from "../components/Button";
import { HireFlowStageBadge } from "../components/HireFlowStageBadge";
import { Skeleton } from "../components/Skeleton";
import { useRecruiterCandidates, useRecruiterStats } from "../helpers/useHireFlowRecruiter";
import styles from "./recruiter.module.css";

export default function RecruiterDashboardPage() {
  const statsQuery = useRecruiterStats();
  const candidatesQuery = useRecruiterCandidates();
  const stats = statsQuery.data?.ok ? statsQuery.data.stats : null;
  const candidates = candidatesQuery.data?.ok ? candidatesQuery.data.candidates : [];
  const attention = candidates.filter(c => c.decisionRequired).slice(0, 4);
  const recent = candidates.slice(0, 5);
  const roleBreakdown = useMemo(() => {
    const grouped = new Map<string, { label: string; count: number }>();
    for (const candidate of candidates) {
      const label = candidate.role?.trim() || "Unspecified";
      const key = label.toLowerCase();
      const current = grouped.get(key);
      grouped.set(key, { label: current?.label || label, count: (current?.count || 0) + 1 });
    }
    return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  }, [candidates]);
  const loading = statsQuery.isLoading || candidatesQuery.isLoading;
  const error = statsQuery.error || candidatesQuery.error;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <Helmet><title>Recruiter dashboard — HireFlow AI</title></Helmet>
      <div className={styles.pageHeader}>
        <div><span className={styles.kicker}>Recruiting overview</span><h1>{greeting}. Here’s what needs attention.</h1><p>AI evidence is ready where available. Every final candidate decision remains yours.</p></div>
        <Button asChild><Link to="/recruiter/candidates">Review candidates <ArrowRight size={16} /></Link></Button>
      </div>

      {error && <div className={styles.error}><AlertTriangle size={17} /><span>{error instanceof Error ? error.message : "Dashboard data could not be loaded."}</span></div>}

      <section className={styles.statsGrid}>
        {loading ? Array.from({ length: 4 }).map((_,i)=><Skeleton key={i} className={styles.statSkeleton} />) : <>
          <article><span>Total candidates</span><strong>{stats?.total ?? 0}</strong><small><Users size={14} /> Across all roles</small></article>
          <article><span>Awaiting review</span><strong>{stats?.awaitingReview ?? 0}</strong><small><Clock3 size={14} /> Evidence ready</small></article>
          <article><span>Needs manual review</span><strong>{stats?.manualReview ?? 0}</strong><small><FileSearch size={14} /> Parse / rubric checks</small></article>
          <article><span>Advanced by recruiter</span><strong>{stats?.advanced ?? 0}</strong><small><CheckCircle2 size={14} /> Human decisions</small></article>
        </>}
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}><div><span>Attention queue</span><h2>Requires a recruiter decision</h2></div><Button variant="ghost" size="sm" asChild><Link to="/recruiter/candidates">View all <ArrowRight size={14} /></Link></Button></div>
          <div className={styles.queue}>
            {loading && Array.from({length:3}).map((_,i)=><Skeleton key={i} className={styles.rowSkeleton} />)}
            {!loading && attention.map(candidate => (
              <Link key={candidate.applicationId} to={`/recruiter/candidates/${encodeURIComponent(candidate.applicationId)}`} className={styles.queueRow}>
                <div className={styles.avatar}>{candidate.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}</div>
                <div className={styles.person}><strong>{candidate.name}</strong><span>{candidate.role}</span></div>
                <HireFlowStageBadge stage={candidate.stage} compact />
                <div className={styles.confidence}><span>Extraction</span><strong>{candidate.confidence || "—"}</strong></div>
                <ArrowRight size={16} className={styles.rowArrow} />
              </Link>
            ))}
            {!loading && attention.length === 0 && <div className={styles.empty}><CheckCircle2 size={25} /><strong>Queue cleared</strong><span>No candidates currently require a decision.</span></div>}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.rolePanel}`}>
          <div className={styles.panelHeader}><div><span>Pipeline</span><h2>Candidates by role</h2></div></div>
          <div className={styles.roleBars}>
            {roleBreakdown.map(({ label, count }) => {
              const pct = candidates.length ? Math.max(8, Math.round((count / candidates.length) * 100)) : 0;
              return <div key={label.toLowerCase()} className={styles.roleBar}><div><strong>{label}</strong><span>{count}</span></div><div className={styles.track}><i style={{ width: `${pct}%` }} /></div></div>;
            })}
            {!loading && roleBreakdown.length === 0 && <div className={styles.emptySmall}>No role data yet.</div>}
          </div>
        </section>
      </div>

      <section className={`${styles.panel} ${styles.recentPanel}`}>
        <div className={styles.panelHeader}><div><span>Recent activity</span><h2>Latest candidates</h2></div></div>
        <div className={styles.recentTable}>
          <div className={styles.tableHead}><span>Candidate</span><span>Role</span><span>Stage</span><span>Parse</span><span>AI confidence</span><span /></div>
          {recent.map(candidate => <Link key={candidate.applicationId} to={`/recruiter/candidates/${encodeURIComponent(candidate.applicationId)}`} className={styles.tableRow}><span><strong>{candidate.name}</strong><small>{candidate.applicationId}</small></span><span>{candidate.role}</span><span><HireFlowStageBadge stage={candidate.stage} compact /></span><span>{candidate.parseQuality || "—"}</span><span>{candidate.confidence || "—"}</span><span><ArrowRight size={15} /></span></Link>)}
        </div>
      </section>
    </>
  );
}
