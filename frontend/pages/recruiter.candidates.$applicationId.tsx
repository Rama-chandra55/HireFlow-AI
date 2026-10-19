import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, BriefcaseBusiness, CalendarClock, Check, CheckCircle2, Clock3, Download, FileSearch, GraduationCap, Mail, ShieldCheck, Sparkles, UserRoundCheck, X } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/Dialog";
import { HireFlowStageBadge } from "../components/HireFlowStageBadge";
import { Skeleton } from "../components/Skeleton";
import { useRecruiterCandidate, useRecruiterReview } from "../helpers/useHireFlowRecruiter";
import { getRecruiterResume } from "../endpoints/recruiter/resume_GET.schema";
import { formatHireFlowDateTime } from "../helpers/formatHireFlowDate";
import styles from "./recruiter.candidates.$applicationId.module.css";

type Decision = "ADVANCE" | "REJECT";

export default function CandidateReviewPage() {
  const { applicationId = "" } = useParams();
  const candidateQuery = useRecruiterCandidate(applicationId);
  const review = useRecruiterReview();
  const candidate = candidateQuery.data?.ok ? candidateQuery.data.candidate : null;
  const [notes, setNotes] = useState("");
  const [interviewStart, setInterviewStart] = useState("");
  const [interviewEnd, setInterviewEnd] = useState("");
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");
  const [openingResume, setOpeningResume] = useState(false);

  const initials = useMemo(() => candidate?.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase() || "—", [candidate?.name]);
  const hasFinalDecision = candidate ? /advanced|rejected/i.test(candidate.stage) : false;

  function beginDecision(decision: Decision) {
    setActionMessage("");
    if (decision === "ADVANCE") {
      const oneTimeOnly = Boolean(interviewStart) !== Boolean(interviewEnd);
      if (oneTimeOnly) {
        setActionMessage("Provide both interview start and end times, or leave both blank to schedule later.");
        return;
      }
      if (interviewStart && interviewEnd && new Date(interviewEnd).getTime() <= new Date(interviewStart).getTime()) {
        setActionMessage("Interview end time must be after the start time.");
        return;
      }
    }
    setPendingDecision(decision);
  }

  async function confirmDecision() {
    if (!candidate || !pendingDecision) return;
    setActionMessage("");
    try {
      const result = await review.mutateAsync({
        applicationId: candidate.applicationId,
        decision: pendingDecision,
        recruiterNotes: notes,
        interviewStart: pendingDecision === "ADVANCE" && interviewStart ? new Date(interviewStart).toISOString() : "",
        interviewEnd: pendingDecision === "ADVANCE" && interviewEnd ? new Date(interviewEnd).toISOString() : "",
      });
      if (result.ok) setActionMessage(`Saved: ${result.stage}`);
      setPendingDecision(null);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "The recruiter decision could not be saved.");
    }
  }

  async function openOriginalResume() {
    if (!candidate?.resumeAvailable || openingResume) return;
    setResumeMessage("");
    setOpeningResume(true);
    const tab = window.open("about:blank", "_blank");
    try {
      const result = await getRecruiterResume({ applicationId: candidate.applicationId });
      if (!result.ok) throw new Error(result.error);
      if (tab) tab.location.href = result.url;
      else window.location.assign(result.url);
    } catch (error) {
      tab?.close();
      setResumeMessage(error instanceof Error ? error.message : "The original resume could not be opened.");
    } finally {
      setOpeningResume(false);
    }
  }

  if (candidateQuery.isLoading) return <div className={styles.loading}><Skeleton className={styles.heroSkeleton}/><Skeleton className={styles.bodySkeleton}/></div>;
  if (candidateQuery.error || !candidate) return <div className={styles.loadError}><AlertTriangle size={24}/><h2>Candidate unavailable</h2><p>{candidateQuery.error instanceof Error ? candidateQuery.error.message : "This candidate could not be loaded."}</p><Button variant="outline" asChild><Link to="/recruiter/candidates"><ArrowLeft size={16}/> Back to candidates</Link></Button></div>;

  return <>
    <Helmet><title>{candidate.name} — HireFlow AI</title></Helmet>
    <div className={styles.breadcrumb}><Link to="/recruiter/candidates"><ArrowLeft size={14}/> Candidates</Link><span>/</span><code>{candidate.applicationId}</code></div>
    <section className={styles.candidateHero}>
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.identity}><div className={styles.identityTop}><h1>{candidate.name}</h1><HireFlowStageBadge stage={candidate.stage}/></div><p>{candidate.role}</p><div className={styles.meta}><span><Mail size={14}/>{candidate.email}</span><span><BriefcaseBusiness size={14}/>{candidate.source || "HireFlow"}</span><span><Clock3 size={14}/>{candidate.appliedAt || "Application date unavailable"}</span></div></div>
      <div className={styles.heroSignals}><div><span>Parse quality</span><strong className={candidate.parseQuality === "good" ? styles.good : styles.warn}>{candidate.parseQuality || "—"}</strong></div><div><span>Extraction confidence</span><strong>{candidate.confidence || "—"}</strong></div><div><span>Decision</span><strong>{hasFinalDecision ? "Finalised" : "Required"}</strong></div></div>
    </section>

    <div className={styles.reviewGrid}>
      <main className={styles.evidenceCanvas}>
        <Tabs defaultValue="evidence">
          <TabsList className={styles.tabs}><TabsTrigger value="evidence">Evidence</TabsTrigger><TabsTrigger value="application">Application details</TabsTrigger></TabsList>
          <TabsContent value="evidence" className={styles.tabContent}>
            <section className={styles.aiSummary}><div className={styles.sectionIcon}><Sparkles size={18}/></div><div><div className={styles.sectionLabel}>AI evidence summary</div><p>{candidate.aiSummary || "No AI summary is available. Review the application manually."}</p><span><ShieldCheck size={13}/> Extraction confidence: {candidate.confidence || "unavailable"} — this is not a suitability score.</span></div></section>

            <section className={styles.evidenceSection}><div className={styles.sectionHead}><div><span>Role rubric</span><h2>Matched requirements</h2></div><strong>{candidate.matchedRequirements.length}</strong></div><div className={styles.requirements}>{candidate.matchedRequirements.map((item,index)=><article key={`${item.requirement}-${index}`}><span className={styles.matchIcon}><Check size={14}/></span><div><h3>{item.requirement}</h3><p>{item.evidence}</p></div></article>)}{candidate.matchedRequirements.length===0&&<div className={styles.inlineEmpty}>No matched requirement evidence was extracted.</div>}</div></section>

            <section className={styles.evidenceSection}><div className={styles.sectionHead}><div><span>Needs attention</span><h2>Missing or unclear</h2></div><strong className={styles.warningCount}>{candidate.missingRequirements.length}</strong></div><div className={styles.missingList}>{candidate.missingRequirements.map(item=><span key={item}><AlertTriangle size={14}/>{item}</span>)}{candidate.missingRequirements.length===0&&<span className={styles.clear}><CheckCircle2 size={14}/> No missing requirements were flagged.</span>}</div></section>

            <div className={styles.twoCol}>
              <section className={styles.evidenceSection}><div className={styles.sectionHead}><div><span>Background</span><h2>Relevant experience</h2></div></div><ul className={styles.bullets}>{candidate.evidence.experience?.length ? candidate.evidence.experience.map((x,i)=><li key={i}>{x}</li>) : <li>No experience evidence extracted.</li>}</ul></section>
              <section className={styles.evidenceSection}><div className={styles.sectionHead}><div><span>Proof of work</span><h2>Relevant projects</h2></div></div><ul className={styles.bullets}>{candidate.evidence.projects?.length ? candidate.evidence.projects.map((x,i)=><li key={i}>{x}</li>) : <li>No project evidence extracted.</li>}</ul></section>
            </div>

            <section className={styles.evidenceSection}><div className={styles.sectionHead}><div><span>Profile</span><h2>Education & skills</h2></div></div><div className={styles.education}><GraduationCap size={18}/><p>{candidate.evidence.education || "No education evidence extracted."}</p></div><div className={styles.skills}>{candidate.evidence.skills?.map(skill=><span key={skill}>{skill}</span>)}</div></section>
          </TabsContent>

          <TabsContent value="application" className={styles.tabContent}>
            <section className={styles.detailGrid}><div><span>Application ID</span><code>{candidate.applicationId}</code></div><div><span>Source</span><strong>{candidate.source || "—"}</strong></div><div><span>Role</span><strong>{candidate.role}</strong></div><div><span>Current stage</span><strong>{candidate.stage}</strong></div><div><span>Parse quality</span><strong>{candidate.parseQuality || "—"}</strong></div><div><span>Applied at</span><strong>{candidate.appliedAt || "—"}</strong></div></section>
            <section className={styles.resumeNotice}><FileSearch size={21}/><div><h3>Original resume</h3><p>{candidate.resumeAvailable ? "The applicant’s PDF is stored privately and can be opened only from the authenticated recruiter workspace." : "This application predates secure resume storage, so only its structured evidence packet is available."}</p>{candidate.resumeAvailable && <Button size="sm" variant="outline" onClick={openOriginalResume} disabled={openingResume}><Download size={14}/>{openingResume ? "Opening…" : "Open original PDF"}</Button>}{resumeMessage && <small>{resumeMessage}</small>}</div></section>
            {candidate.interviewStart && <section className={styles.interviewCard}><CalendarClock size={20}/><div><span>Interview scheduled</span><strong>{formatHireFlowDateTime(candidate.interviewStart)}{candidate.interviewEnd ? ` → ${formatHireFlowDateTime(candidate.interviewEnd)}` : ""}</strong></div></section>}
          </TabsContent>
        </Tabs>
      </main>

      <aside className={styles.actionPanel}>
        <div className={styles.actionHeader}><span>Human decision</span><h2>Recruiter review</h2><p>Use the evidence as support. Make the decision yourself.</p></div>
        <label><span>Recruiter notes</span><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Document the reasoning, follow-up points, or interview focus…" rows={6} disabled={hasFinalDecision || review.isPending}/></label>
        {!hasFinalDecision && <>
          <div className={styles.scheduleBox}><div><CalendarClock size={17}/><span>Optional interview scheduling</span></div><label><span>Start</span><Input type="datetime-local" value={interviewStart} onChange={e=>setInterviewStart(e.target.value)} disabled={review.isPending}/></label><label><span>End</span><Input type="datetime-local" value={interviewEnd} onChange={e=>setInterviewEnd(e.target.value)} disabled={review.isPending}/></label><small>Used only when you choose Advance. Leave both blank to schedule later.</small></div>
          <div className={styles.decisionActions}><Button size="lg" onClick={()=>beginDecision("ADVANCE")} disabled={review.isPending}><UserRoundCheck size={17}/> Advance</Button><Button size="lg" variant="destructive" onClick={()=>beginDecision("REJECT")} disabled={review.isPending}><X size={17}/> Reject</Button></div>
        </>}
        {hasFinalDecision && <div className={styles.finalised}><CheckCircle2 size={20}/><div><strong>Decision finalised</strong><span>{candidate.stage}</span></div></div>}
        {actionMessage && <div className={styles.actionMessage}>{actionMessage}</div>}
        <div className={styles.humanNotice}><ShieldCheck size={16}/><span>AI output is evidence organization only. It did not choose this candidate’s outcome.</span></div>
      </aside>
    </div>

    <Dialog open={Boolean(pendingDecision)} onOpenChange={open=>!open&&setPendingDecision(null)}>
      <DialogContent className={styles.dialog}>
        <DialogHeader><DialogTitle>{pendingDecision === "ADVANCE" ? "Advance this candidate?" : "Reject this candidate?"}</DialogTitle><DialogDescription>This records a final human recruiter decision for {candidate.name}. HireFlow prevents a second final decision later.</DialogDescription></DialogHeader>
        <div className={`${styles.decisionPreview} ${pendingDecision === "REJECT" ? styles.rejectPreview : ""}`}><span>{pendingDecision === "ADVANCE" ? <UserRoundCheck size={19}/> : <X size={19}/>}</span><div><strong>{pendingDecision === "ADVANCE" ? "Advance by human recruiter" : "Reject by human recruiter"}</strong><small>{pendingDecision === "ADVANCE" && interviewStart ? "An interview event and invitation will be created." : "The candidate will receive the appropriate application update."}</small></div></div>
        <DialogFooter><Button variant="ghost" onClick={()=>setPendingDecision(null)}>Cancel</Button><Button variant={pendingDecision === "REJECT" ? "destructive" : "primary"} onClick={confirmDecision} disabled={review.isPending}>{review.isPending ? "Saving decision…" : `Confirm ${pendingDecision === "ADVANCE" ? "advance" : "rejection"}`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
