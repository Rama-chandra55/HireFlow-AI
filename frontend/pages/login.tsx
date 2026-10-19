import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, LockKeyhole, Sparkles } from "lucide-react";
import { OAuthButtonGroup } from "../components/OAuthButtonGroup";
import { ThemeModeSwitch } from "../components/ThemeModeSwitch";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <>
      <Helmet><title>Recruiter sign in — HireFlow AI</title><meta name="robots" content="noindex,nofollow,noarchive" /></Helmet>
      <div className={styles.page}>
        <section className={styles.storyPane}>
          <div className={styles.brand}><span><Sparkles size={16} /></span>HireFlow <strong>AI</strong></div>
          <div className={styles.story}>
            <span className={styles.kicker}>Recruiter workspace</span>
            <h1>Move faster.<br /><em>Keep judgment human.</em></h1>
            <p>Review structured resume evidence, surface missing requirements, document decisions, and schedule interviews from one focused workspace.</p>
            <div className={styles.signalList}><span><BadgeCheck size={17} /> Evidence-linked review packets</span><span><LockKeyhole size={17} /> Protected recruiter workspace</span></div>
          </div>
          <Link to="/" className={styles.homeLink}><ArrowLeft size={15} /> Candidate site</Link>
        </section>
        <section className={styles.loginPane}>
          <div className={styles.top}><ThemeModeSwitch /></div>
          <div className={styles.card}>
            <div className={styles.cardHeading}><span>Welcome back</span><h2>Sign in to recruiting.</h2><p>Use your authorized HireFlow recruiter account.</p></div>
            <OAuthButtonGroup />
            <div className={styles.securityNote}><LockKeyhole size={14} /><span>Recruiter access uses an authorized Google account and a protected session. Candidate applications never require an account.</span></div>
          </div>
        </section>
      </div>
    </>
  );
}