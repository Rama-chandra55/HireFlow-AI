import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, History, Search, Users } from "lucide-react";
import { Button } from "./Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./Dialog";
import { Input } from "./Input";
import { HireFlowStageBadge } from "./HireFlowStageBadge";
import { useRecruiterCandidates } from "../helpers/useHireFlowRecruiter";
import styles from "./RecruiterCommandPalette.module.css";

export function RecruiterCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  // Candidate search is intentionally lazy so opening a detail page does not
  // also fetch the entire pipeline in the background.
  const candidatesQuery = useRecruiterCandidates(open);
  const candidates = candidatesQuery.data?.ok ? candidatesQuery.data.candidates : [];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(current => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return candidates.slice(0, 6);
    return candidates.filter(candidate =>
      [candidate.name, candidate.email, candidate.role, candidate.applicationId, candidate.stage]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    ).slice(0, 8);
  }, [candidates, query]);

  const openCandidate = (applicationId: string) => {
    setOpen(false);
    navigate(`/recruiter/candidates/${encodeURIComponent(applicationId)}`);
  };

  return <>
    <Button type="button" variant="ghost" className={styles.trigger} onClick={() => setOpen(true)}>
      <Search size={17} />
      <span>Search candidates, roles, IDs…</span>
      <kbd>⌘ K</kbd>
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={styles.dialog}>
        <DialogHeader className={styles.header}>
          <DialogTitle>Jump anywhere in HireFlow</DialogTitle>
          <DialogDescription>Search the candidate database or open a recruiter workspace section.</DialogDescription>
        </DialogHeader>
        <div className={styles.searchBox}>
          <Search size={18} />
          <Input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Candidate name, email, role, or application ID" />
        </div>
        <div className={styles.quickLinks}>
          <Link to="/recruiter" onClick={() => setOpen(false)}><Users size={15} /> Overview</Link>
          <Link to="/recruiter/candidates" onClick={() => setOpen(false)}><Search size={15} /> Candidates</Link>
          <Link to="/recruiter/activity" onClick={() => setOpen(false)}><History size={15} /> Activity</Link>
          <Link to="/recruiter/roles" onClick={() => setOpen(false)}><BriefcaseBusiness size={15} /> Roles</Link>
        </div>
        <div className={styles.resultsHead}><span>{query ? "Search results" : "Recent candidates"}</span><small>{filtered.length} shown</small></div>
        <div className={styles.results}>
          {candidatesQuery.isLoading && <div className={styles.state}>Loading candidate index…</div>}
          {!candidatesQuery.isLoading && filtered.map(candidate => (
            <button key={candidate.applicationId} type="button" className={styles.result} onClick={() => openCandidate(candidate.applicationId)}>
              <span className={styles.avatar}>{candidate.name.split(/\s+/).map(part => part[0]).join("").slice(0,2).toUpperCase()}</span>
              <span className={styles.person}><strong>{candidate.name}</strong><small>{candidate.role} · {candidate.applicationId}</small></span>
              <HireFlowStageBadge stage={candidate.stage} compact />
              <ArrowRight size={15} />
            </button>
          ))}
          {!candidatesQuery.isLoading && filtered.length === 0 && <div className={styles.state}>No candidate matches that search.</div>}
        </div>
        <div className={styles.footer}><span>Search is text-only and does not rank candidate suitability.</span><kbd>Esc</kbd></div>
      </DialogContent>
    </Dialog>
  </>;
}
