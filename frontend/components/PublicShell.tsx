import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "./Button";
import { ThemeModeSwitch } from "./ThemeModeSwitch";
import styles from "./PublicShell.module.css";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="HireFlow AI home">
          <span className={styles.mark}><Sparkles size={17} /></span>
          <span>HireFlow <strong>AI</strong></span>
        </Link>

        <nav className={styles.nav} aria-label="Primary navigation">
          <NavLink to="/jobs" className={({ isActive }) => isActive ? styles.active : undefined}>Open roles</NavLink>
          <NavLink to="/status" className={({ isActive }) => isActive ? styles.active : undefined}>Application status</NavLink>
        </nav>

        <div className={styles.actions}>
          <ThemeModeSwitch />
          <Button variant="ghost" asChild className={styles.recruiterLink}>
            <Link to="/login">Recruiter sign in <ArrowUpRight size={15} /></Link>
          </Button>
          <Button asChild>
            <Link to="/jobs">Explore roles</Link>
          </Button>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <div>
          <div className={styles.footerBrand}>HireFlow AI</div>
          <p>Structured evidence for better human hiring decisions.</p>
        </div>
        <div className={styles.footerMeta}>
          <span>AI assists. People decide.</span>
          <span>© 2026 HireFlow</span>
        </div>
      </footer>
    </div>
  );
}
