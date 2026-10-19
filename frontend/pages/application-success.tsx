import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, CheckCircle2, Clipboard, Clock3, Mail, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";
import styles from "./application-success.module.css";

export default function ApplicationSuccessPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const id = params.get("id") || "Application ID unavailable";
  const role = params.get("role") || "your selected role";
  const email = (location.state as { email?: string } | null)?.email;
  const [copied, setCopied] = useState(false);
  const copyId = async () => { try { await navigator.clipboard.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  return (
    <>
      <Helmet><title>Application received — HireFlow AI</title></Helmet>
      <section className={styles.page}>
        <div className={styles.successMark}><Check size={34} /></div>
        <span className={styles.kicker}>Application received</span>
        <h1>You’re in the review queue.</h1>
        <p className={styles.lead}>Thanks for applying for <strong>{role}</strong>. We’ve saved your application and started preparing it for human recruiter review.</p>

        <div className={styles.idCard}>
          <div><span>Application ID</span><strong>{id}</strong></div>
          <Button variant="outline" onClick={copyId}>{copied ? <><CheckCircle2 size={16} /> Copied</> : <><Clipboard size={16} /> Copy ID</>}</Button>
        </div>

        <div className={styles.nextGrid}>
          <article><div className={styles.icon}><Mail size={20} /></div><h3>Confirmation sent</h3><p>{email ? `We sent a confirmation to ${email}.` : "A confirmation email is on its way."}</p></article>
          <article><div className={styles.icon}><Clock3 size={20} /></div><h3>Evidence review</h3><p>Your resume is parsed and organized against the role requirements for a recruiter.</p></article>
          <article><div className={styles.icon}><ShieldCheck size={20} /></div><h3>Human decision</h3><p>AI never makes the final advance or reject decision in HireFlow.</p></article>
        </div>

        <div className={styles.actions}>
          <Button size="lg" asChild><Link to={`/status?applicationId=${encodeURIComponent(id)}${email ? `&email=${encodeURIComponent(email)}` : ""}`}>Track application <ArrowRight size={17} /></Link></Button>
          <Button size="lg" variant="ghost" asChild><Link to="/jobs">Back to open roles</Link></Button>
        </div>
      </section>
    </>
  );
}
