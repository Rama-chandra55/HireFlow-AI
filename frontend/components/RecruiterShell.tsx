import React from "react";
import { Helmet } from "react-helmet";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, BriefcaseBusiness, ChevronRight, History, LogOut, Sparkles, Users } from "lucide-react";
import { Button } from "./Button";
import { ThemeModeSwitch } from "./ThemeModeSwitch";
import { RecruiterCommandPalette } from "./RecruiterCommandPalette";
import { useAuth } from "../helpers/useAuth";
import { useRecruiterCandidates } from "../helpers/useHireFlowRecruiter";
import styles from "./RecruiterShell.module.css";

export default function RecruiterShell({ children }: { children: React.ReactNode }) {
  const { authState, logout } = useAuth();
  // Subscribe to candidate cache for the attention badge, but do not trigger a
  // full candidate-index request on every recruiter route.
  const candidatesQuery = useRecruiterCandidates(false);
  const navigate = useNavigate();
  const userName = authState.type === "authenticated" ? authState.user.displayName : "Recruiter";
  const avatarUrl = authState.type === "authenticated" ? authState.user.avatarUrl : null;
  const initials = userName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const attentionCount = candidatesQuery.data?.ok ? candidatesQuery.data.candidates.filter(candidate => candidate.decisionRequired).length : 0;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
    <Helmet><meta name="robots" content="noindex,nofollow,noarchive" /></Helmet>
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link to="/recruiter" className={styles.brand}>
          <span className={styles.mark}><Sparkles size={16} /></span>
          <span>HireFlow <strong>AI</strong></span>
        </Link>

        <div className={styles.workspaceLabel}>Recruiting workspace</div>
        <nav className={styles.nav}>
          <NavLink end to="/recruiter" className={({ isActive }) => isActive ? styles.active : undefined}><BarChart3 size={18} /> Overview</NavLink>
          <NavLink to="/recruiter/candidates" className={({ isActive }) => isActive ? styles.active : undefined}><Users size={18} /> Candidates {attentionCount > 0 && <span className={styles.navCount}>{attentionCount}</span>}</NavLink>
          <NavLink to="/recruiter/activity" className={({ isActive }) => isActive ? styles.active : undefined}><History size={18} /> Activity</NavLink>
          <NavLink to="/recruiter/roles" className={({ isActive }) => isActive ? styles.active : undefined}><BriefcaseBusiness size={18} /> Roles <ChevronRight size={15} className={styles.push} /></NavLink>
        </nav>

        <div className={styles.sidebarNote}>
          <span className={styles.noteDot} />
          <div><strong>Human decision mode</strong><p>AI extracts evidence. Recruiters make final decisions.</p></div>
        </div>

        <div className={styles.profile}>
          <div className={styles.avatar}>{avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : initials}</div>
          <div className={styles.profileText}><strong>{userName}</strong><span>Recruiter</span></div>
          <Button size="icon-sm" variant="ghost" aria-label="Sign out" onClick={handleLogout}><LogOut size={16} /></Button>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <RecruiterCommandPalette />
          <ThemeModeSwitch />
        </header>
        <main className={styles.content}>{children}</main>
      </section>
    </div>
    </>
  );
}
