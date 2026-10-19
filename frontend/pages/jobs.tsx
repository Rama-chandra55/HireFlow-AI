import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BrainCircuit, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Badge } from "../components/Badge";
import { useScrollReveal } from "../helpers/useScrollReveal";
import { getRoles } from "../endpoints/roles_GET.schema";
import styles from "./jobs.module.css";

const splitSkills = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean);

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const jobsReveal = useScrollReveal({ threshold: 0.08 });
  const rolesQuery = useQuery({ queryKey: ["hireflow", "roles"], queryFn: getRoles });
  const roles = useMemo(() => rolesQuery.data?.ok ? rolesQuery.data.roles.map(role => ({
    title: role.role,
    team: "Open position",
    type: "Full time",
    location: "Flexible",
    must: splitSkills(role.mustHaves),
    nice: splitSkills(role.niceToHaves),
    note: role.notes || "Review the role requirements and share the resume that best represents your experience.",
  })) : [], [rolesQuery.data]);
  const filtered = useMemo(() => roles.filter(r => `${r.title} ${r.team} ${r.must.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [roles, query]);
  return (
    <>
      <Helmet><title>Open roles — HireFlow AI</title></Helmet>
      <section className={styles.header}>
        <Badge variant="secondary">Careers at HireFlow</Badge>
        <h1>Find work that fits how you think.</h1>
        <p>Every application is reviewed by a human recruiter. AI helps organize evidence from your resume; it never makes the final hiring decision.</p>
      </section>

      <section ref={jobsReveal} className={`${styles.jobsArea} ${styles.reveal}`}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}><Search size={17} /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search roles, teams, or skills" aria-label="Search open roles" /></div>
          <span>{filtered.length} open role{filtered.length === 1 ? "" : "s"}</span>
        </div>
        <div className={styles.roleList}>
          {rolesQuery.isLoading && <div className={styles.empty}><BrainCircuit size={28} /><h3>Loading open roles…</h3><p>Fetching the latest hiring rubric.</p></div>}
          {rolesQuery.error && <div className={styles.empty}><ShieldCheck size={28} /><h3>Roles are temporarily unavailable</h3><p>{rolesQuery.error instanceof Error ? rolesQuery.error.message : "Please try again shortly."}</p></div>}
          {filtered.map(role => (
            <article key={role.title} className={styles.roleCard}>
              <div className={styles.roleTop}>
                <div className={styles.roleIcon}><BrainCircuit size={24} /></div>
                <div><h2>{role.title}</h2><p>{role.team} · {role.type} · {role.location}</p></div>
                <Button asChild><Link to={`/apply?role=${encodeURIComponent(role.title)}`}>Apply now <ArrowRight size={16} /></Link></Button>
              </div>
              <div className={styles.roleBody}>
                <div><span className={styles.label}>Must have</span><div className={styles.tags}>{role.must.map(x => <span key={x}><CheckCircle2 size={13} />{x}</span>)}</div></div>
                <div><span className={styles.label}>Nice to have</span><div className={styles.tags}>{role.nice.map(x => <span key={x}>{x}</span>)}</div></div>
                <div className={styles.note}><ShieldCheck size={17} /><span>{role.note}</span></div>
              </div>
            </article>
          ))}
          {!rolesQuery.isLoading && !rolesQuery.error && filtered.length === 0 && <div className={styles.empty}><Search size={28} /><h3>No matching roles</h3><p>Try a broader search. New roles will appear here as they open.</p></div>}
        </div>
      </section>
    </>
  );
}