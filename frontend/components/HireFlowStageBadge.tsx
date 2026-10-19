import React from "react";
import { AlertTriangle, CheckCircle2, Clock3, XCircle } from "lucide-react";
import styles from "./HireFlowStageBadge.module.css";

export function stageTone(stage: string) {
  const s = stage.toLowerCase();
  if (s.includes("advanced")) return "success";
  if (s.includes("rejected")) return "error";
  if (s.includes("manual") || s.includes("parse") || s.includes("missing")) return "warning";
  if (s.includes("awaiting")) return "review";
  return "neutral";
}

export function HireFlowStageBadge({ stage, compact = false, className = "" }: { stage: string; compact?: boolean; className?: string }) {
  const tone = stageTone(stage);
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : tone === "warning" ? AlertTriangle : Clock3;
  return <span className={`${styles.badge} ${styles[tone]} ${compact ? styles.compact : ""} ${className}`}><Icon size={compact ? 12 : 14} /><span>{stage}</span></span>;
}
