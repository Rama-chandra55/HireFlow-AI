import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Filter, Search, SlidersHorizontal, Users } from "lucide-react";
import { Input } from "../components/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/Select";
import { HireFlowStageBadge } from "../components/HireFlowStageBadge";
import { Skeleton } from "../components/Skeleton";
import { useRecruiterCandidates } from "../helpers/useHireFlowRecruiter";
import styles from "./recruiter.candidates.module.css";

export default function RecruiterCandidatesPage() {
  const query = useRecruiterCandidates();
  const [params] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const candidates = query.data?.ok ? query.data.candidates : [];
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [role, setRole] = useState(params.get("role") || "all");
  const roles = useMemo(()=>{
    const grouped = new Map<string,string>();
    for (const candidate of candidates) {
      const label = candidate.role?.trim();
      if (label && !grouped.has(label.toLowerCase())) grouped.set(label.toLowerCase(), label);
    }
    return Array.from(grouped.values()).sort((a,b)=>a.localeCompare(b));
  },[candidates]);
  useEffect(()=>{ if(params.get("focus") === "search") requestAnimationFrame(()=>searchRef.current?.focus()); },[params]);
  useEffect(()=>{ const requested=params.get("role"); if(requested){ const match=roles.find(item=>item.toLowerCase()===requested.toLowerCase()); if(match) setRole(match); } },[params,roles]);
  const filtered = useMemo(()=>candidates.filter(c=>{
    const text=`${c.name} ${c.email} ${c.role} ${c.applicationId}`.toLowerCase();
    const searchOk=text.includes(search.toLowerCase());
    const stageOk=stage==="all"||(stage==="attention"?c.decisionRequired:c.stage.toLowerCase().includes(stage));
    const roleOk=role==="all"||c.role.toLowerCase()===role.toLowerCase();
    return searchOk&&stageOk&&roleOk;
  }),[candidates,search,stage,role]);

  return <>
    <Helmet><title>Candidates — HireFlow AI</title></Helmet>
    <div className={styles.header}><div><span className={styles.kicker}>Candidate pipeline</span><h1>Candidates</h1><p>Review resume evidence, investigate exceptions, and record human decisions.</p></div><div className={styles.count}><Users size={16}/><strong>{filtered.length}</strong><span>shown</span></div></div>
    <section className={styles.filters}>
      <div className={styles.search}><Search size={16}/><Input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, role, or application ID" /></div>
      <Select value={stage} onValueChange={setStage}><SelectTrigger className={styles.select}><SlidersHorizontal size={15}/><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem><SelectItem value="attention">Needs decision</SelectItem><SelectItem value="awaiting">Awaiting review</SelectItem><SelectItem value="manual">Manual review</SelectItem><SelectItem value="advanced">Advanced</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
      <Select value={role} onValueChange={setRole}><SelectTrigger className={styles.select}><Filter size={15}/><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{roles.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
    </section>
    <section className={styles.tableCard}>
      <div className={styles.tableHead}><span>Candidate</span><span>Role</span><span>Stage</span><span>Parse</span><span>Extraction confidence</span><span>Applied</span><span /></div>
      {query.isLoading && Array.from({length:6}).map((_,i)=><Skeleton key={i} className={styles.loadingRow}/>)}
      {!query.isLoading && filtered.map(candidate=><Link key={candidate.applicationId} to={`/recruiter/candidates/${encodeURIComponent(candidate.applicationId)}`} className={styles.row}>
        <span className={styles.person}><i>{candidate.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}</i><b>{candidate.name}</b><small>{candidate.email}</small></span>
        <span>{candidate.role}</span><span><HireFlowStageBadge stage={candidate.stage} compact /></span><span className={styles.capitalize}>{candidate.parseQuality||"—"}</span><span className={styles.capitalize}>{candidate.confidence||"—"}</span><span>{candidate.appliedAt||"—"}</span><span><ArrowRight size={15}/></span>
      </Link>)}
      {!query.isLoading&&filtered.length===0&&<div className={styles.empty}><Search size={24}/><strong>No candidates match these filters</strong><span>Try clearing a filter or using a broader search.</span></div>}
      {query.error&&<div className={styles.empty}><strong>Candidate data unavailable</strong><span>{query.error instanceof Error?query.error.message:"Please retry."}</span></div>}
    </section>
  </>;
}
