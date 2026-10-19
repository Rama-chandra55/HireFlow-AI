import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { getRoles } from "../endpoints/roles_GET.schema";
import styles from "./recruiter.roles.module.css";

const split = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean);

export default function RecruiterRolesPage() {
  const query = useQuery({ queryKey: ["hireflow", "roles"], queryFn: getRoles });
  const [search, setSearch] = useState("");
  const roles = query.data?.ok ? query.data.roles : [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(role => [role.role, role.mustHaves, role.niceToHaves, role.notes].join(" ").toLowerCase().includes(q));
  }, [roles, search]);

  return <>
    <Helmet><title>Roles & rubrics — HireFlow AI</title></Helmet>
    <header className={styles.header}>
      <div><span className={styles.kicker}>Hiring rubrics</span><h1>Roles & requirements</h1><p>These are the role rubrics used to organize resume evidence. They are never converted into an automated hiring score.</p></div>
      <Button variant="outline" asChild><Link to="/jobs">Candidate view <ArrowRight size={15}/></Link></Button>
    </header>

    <section className={styles.toolbar}>
      <div className={styles.search}><Search size={16}/><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search role, requirement, technology, or note" /></div>
      <div className={styles.count}><BriefcaseBusiness size={15}/><strong>{filtered.length}</strong><span>role{filtered.length === 1 ? "" : "s"}</span></div>
    </section>

    <div className={styles.grid}>
      {query.isLoading && Array.from({length:3}).map((_, index) => <Skeleton key={index} className={styles.skeleton}/>) }
      {!query.isLoading && filtered.map((role, index) => {
        const must = split(role.mustHaves);
        const nice = split(role.niceToHaves);
        return <article className={styles.card} key={role.role} style={{animationDelay:`${Math.min(index,6)*55}ms`}}>
          <div className={styles.cardTop}><div className={styles.icon}><Sparkles size={18}/></div><div><span>Open role</span><h2>{role.role}</h2></div><ShieldCheck size={17} className={styles.shield}/></div>
          <div className={styles.section}><div className={styles.sectionHead}><span>Must have</span><strong>{must.length}</strong></div><div className={styles.requirements}>{must.map(item => <span key={item}><CheckCircle2 size={13}/>{item}</span>)}{must.length === 0 && <small>No must-have requirements listed.</small>}</div></div>
          <div className={styles.section}><div className={styles.sectionHead}><span>Nice to have</span><strong>{nice.length}</strong></div><div className={`${styles.requirements} ${styles.nice}`}>{nice.map(item => <span key={item}>{item}</span>)}{nice.length === 0 && <small>No nice-to-have requirements listed.</small>}</div></div>
          <div className={styles.notes}><ShieldCheck size={15}/><p>{role.notes || "No additional recruiter notes for this role."}</p></div>
          <div className={styles.cardFoot}><span>Evidence is matched against this rubric</span><Button size="sm" variant="ghost" asChild><Link to={`/recruiter/candidates?role=${encodeURIComponent(role.role)}`}>View candidates <ArrowRight size={14}/></Link></Button></div>
        </article>;
      })}
      {!query.isLoading && !query.error && filtered.length === 0 && <div className={styles.empty}><Search size={25}/><strong>No matching role</strong><span>Try a broader requirement or technology search.</span></div>}
      {query.error && <div className={styles.empty}><ShieldCheck size={25}/><strong>Role rubrics unavailable</strong><span>{query.error instanceof Error ? query.error.message : "Please retry shortly."}</span></div>}
    </div>
  </>;
}
