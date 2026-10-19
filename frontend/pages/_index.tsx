import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, BrainCircuit, FileSearch, ShieldCheck, Sparkles, UserRoundCheck, Workflow } from "lucide-react";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useScrollReveal } from "../helpers/useScrollReveal";
import { getRoles } from "../endpoints/roles_GET.schema";
import styles from "./_index.module.css";

const fallbackRole = {
  title: "Machine Learning Engineer",
  must: ["Python", "Machine Learning", "Scikit-learn", "SQL"],
};

export default function HomePage() {
  const rolesQuery = useQuery({ queryKey: ["hireflow", "roles"], queryFn: () => getRoles() });
  const upstreamRole = rolesQuery.data?.ok ? rolesQuery.data.roles[0] : undefined;
  const featuredRole = upstreamRole ? {
    title: upstreamRole.role,
    must: upstreamRole.mustHaves.split(",").map(item => item.trim()).filter(Boolean),
  } : fallbackRole;
  const processReveal = useScrollReveal({ threshold: 0.12 });
  const roleReveal = useScrollReveal({ threshold: 0.12 });
  const transparencyReveal = useScrollReveal({ threshold: 0.18 });
  return (
    <>
      <Helmet>
        <title>HireFlow AI — Human-first recruitment</title>
        <meta name="description" content="A transparent hiring experience where AI organizes resume evidence and human recruiters make every final decision." />
      </Helmet>

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <Badge variant="secondary" className={styles.eyebrow}><Sparkles size={13} /> Human-in-the-loop recruitment</Badge>
          <h1>Recruiting intelligence,<br /><em>without outsourcing judgment.</em></h1>
          <p>HireFlow turns resumes into structured, traceable evidence for recruiters — while candidates get a clear, respectful application experience.</p>
          <div className={styles.heroActions}>
            <Button size="lg" asChild><Link to="/jobs">Explore open roles <ArrowRight size={18} /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/status">Track an application</Link></Button>
          </div>
          <div className={styles.trustRow}>
            <span><ShieldCheck size={16} /> No automated hire/reject</span>
            <span><BadgeCheck size={16} /> Evidence-linked review</span>
            <span><UserRoundCheck size={16} /> Human final decision</span>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Illustration of the HireFlow review process">
          <div className={styles.signalRail}>
            <span className={styles.signalDot} />
            <span className={styles.signalLine} />
            <span className={styles.signalDot} />
            <span className={styles.signalLine} />
            <span className={styles.signalDot} />
          </div>
          <div className={`${styles.demoCard} ${styles.resumeCard}`}>
            <div className={styles.cardTop}><span className={styles.miniIcon}><FileSearch size={17} /></span><span>Resume evidence</span><small>Parsed</small></div>
            <div className={styles.resumeLines}><i /><i /><i /><i /></div>
            <div className={styles.skillChips}><span>Python</span><span>SQL</span><span>scikit-learn</span></div>
          </div>
          <div className={`${styles.demoCard} ${styles.evidenceCard}`}>
            <div className={styles.cardTop}><span className={styles.miniIcon}><BrainCircuit size={17} /></span><span>AI evidence packet</span><small>High confidence</small></div>
            <div className={styles.evidenceRow}><b>Python</b><span>Matched with resume evidence</span><strong>✓</strong></div>
            <div className={styles.evidenceRow}><b>SQL</b><span>Matched with resume evidence</span><strong>✓</strong></div>
            <div className={`${styles.evidenceRow} ${styles.unclear}`}><b>PyTorch</b><span>Missing / unclear</span><strong>—</strong></div>
          </div>
          <div className={`${styles.demoCard} ${styles.humanCard}`}>
            <div className={styles.cardTop}><span className={styles.miniIcon}><Workflow size={17} /></span><span>Recruiter review</span><small>Human action</small></div>
            <div className={styles.decisionButtons}><span>Advance</span><span>Reject</span></div>
            <p>AI does not select the outcome.</p>
          </div>
        </div>
      </section>

      <section ref={processReveal} className={`${styles.processSection} ${styles.reveal}`}>
        <div className={styles.sectionHeading}>
          <span>Designed around clarity</span>
          <h2>A hiring flow candidates can understand.</h2>
          <p>Short applications, visible progress, clear communication, and structured review instead of black-box scoring.</p>
        </div>
        <div className={styles.processGrid}>
          <article><span className={styles.stepNo}>01</span><FileSearch size={22} /><h3>Apply once</h3><p>Choose a role, add basic details, and upload a PDF resume with instant file validation.</p></article>
          <article><span className={styles.stepNo}>02</span><BrainCircuit size={22} /><h3>Evidence is organized</h3><p>AI extracts role-relevant evidence and flags what is missing or unclear — without producing a hiring score.</p></article>
          <article><span className={styles.stepNo}>03</span><UserRoundCheck size={22} /><h3>A person decides</h3><p>A recruiter reviews the evidence, adds notes, and makes the final advance or reject decision.</p></article>
        </div>
      </section>

      <section ref={roleReveal} className={`${styles.openRoleSection} ${styles.reveal}`}>
        <div className={styles.sectionHeadingRow}>
          <div><span>Open now</span><h2>Build the next generation of AI systems.</h2></div>
          <Button variant="ghost" asChild><Link to="/jobs">View all roles <ArrowRight size={16} /></Link></Button>
        </div>
        <Link to={`/apply?role=${encodeURIComponent(featuredRole.title)}`} className={styles.roleCard}>
          <div className={styles.roleIcon}><BrainCircuit size={22} /></div>
          <div className={styles.roleMain}><h3>{featuredRole.title}</h3><p>Open role · Flexible working environment</p><div className={styles.tags}>{featuredRole.must.map(item => <span key={item}>{item}</span>)}</div></div>
          <div className={styles.roleCta}>View role <ArrowRight size={18} /></div>
        </Link>
      </section>

      <section ref={transparencyReveal} className={`${styles.transparencyStrip} ${styles.reveal}`}>
        <div><ShieldCheck size={25} /><h3>Transparent AI use</h3></div>
        <p>HireFlow uses AI to structure evidence from application materials. It does not infer sensitive traits, rank candidates, or make final hiring decisions.</p>
        <Link to="/jobs">See how review works <ArrowRight size={15} /></Link>
      </section>
    </>
  );
}
