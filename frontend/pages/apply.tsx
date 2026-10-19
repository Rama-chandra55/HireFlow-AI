import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileText, LockKeyhole, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { FileDropzone } from "../components/FileDropzone";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/Select";
import { postApplication } from "../endpoints/application_POST.schema";
import { getRoles } from "../endpoints/roles_GET.schema";
import styles from "./apply.module.css";

export default function ApplyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = params.get("role") || "";
  const rolesQuery = useQuery({ queryKey: ["hireflow", "roles"], queryFn: getRoles });
  const roleOptions = rolesQuery.data?.ok ? rolesQuery.data.roles.map(item => item.role) : [];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role) return;
    const preferred = initialRole && roleOptions.includes(initialRole)
      ? initialRole
      : roleOptions[0] || "";
    if (preferred) setRole(preferred);
  }, [initialRole, role, roleOptions, rolesQuery.isLoading]);

  const fileSize = useMemo(() => resume ? `${(resume.size / 1024 / 1024).toFixed(2)} MB` : "", [resume]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!role || !roleOptions.includes(role)) { setError("Please choose one of the currently open roles before continuing."); return; }
    if (!resume) { setError("Please attach your resume as a PDF before continuing."); return; }
    setSubmitting(true);
    try {
      const result = await postApplication({ name, email, role, resume });
      if (result.ok) {
        navigate(`/application-success?id=${encodeURIComponent(result.applicationId)}&role=${encodeURIComponent(role)}`, { state: { name, email } });
      } else {
        setError(result.error || result.message || "We could not submit your application.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet><title>Apply — HireFlow AI</title></Helmet>
      <div className={styles.page}>
        <section className={styles.contextPane}>
          <Button variant="ghost" asChild className={styles.back}><a href="/jobs"><ArrowLeft size={16} /> Back to roles</a></Button>
          <div className={styles.contextBody}>
            <span className={styles.kicker}>Application</span>
            <h1>{role || "Choose a role"}</h1>
            <p>Share the essentials. We keep the application intentionally short and let your resume carry the detail.</p>
            <div className={styles.processList}>
              <div><span>1</span><div><strong>Submit application</strong><p>Basic details + one PDF resume.</p></div></div>
              <div><span>2</span><div><strong>Evidence extraction</strong><p>AI organizes role-relevant evidence only.</p></div></div>
              <div><span>3</span><div><strong>Human recruiter review</strong><p>A person makes the final decision.</p></div></div>
            </div>
          </div>
          <div className={styles.contextFoot}><ShieldCheck size={18} /><span>No automated hiring decision</span></div>
        </section>

        <section className={styles.formPane}>
          <div className={styles.formFrame}>
            <div className={styles.formHeading}>
              <div className={styles.formIcon}><Sparkles size={18} /></div>
              <div><span>About 2 minutes</span><h2>Submit your application</h2></div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGrid}>
                <label><span>Full name</span><Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required autoComplete="name" /></label>
                <label><span>Email</span><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required type="email" autoComplete="email" /></label>
              </div>
              <label className={styles.field}><span>Role</span>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue placeholder={rolesQuery.isLoading ? "Loading roles…" : "Choose a role"} /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
              {rolesQuery.error && <div className={styles.errorBox} role="alert"><span>Open roles could not be loaded. Please refresh before submitting an application.</span></div>}

              <div className={styles.uploadSection}>
                <div className={styles.uploadHeader}><div><span>Resume</span><small>PDF · max 5 MB</small></div><span className={styles.required}>Required</span></div>
                {!resume ? (
                  <FileDropzone
                    accept=".pdf,application/pdf"
                    maxSize={5 * 1024 * 1024}
                    onFilesSelected={files => setResume(files[0] || null)}
                    icon={<UploadCloud size={30} />}
                    title="Drop your resume here"
                    subtitle="or click to browse your device"
                    disabled={submitting}
                    className={styles.dropzone}
                  />
                ) : (
                  <div className={styles.fileSelected}>
                    <div className={styles.fileIcon}><FileText size={22} /></div>
                    <div className={styles.fileMeta}><strong>{resume.name}</strong><span>{fileSize} · Ready to upload</span></div>
                    <CheckCircle2 size={18} className={styles.fileCheck} />
                    <Button size="icon-sm" variant="ghost" onClick={() => setResume(null)} disabled={submitting} aria-label="Remove resume"><X size={16} /></Button>
                  </div>
                )}
              </div>

              {error && <div className={styles.errorBox} role="alert"><span>{error}</span></div>}

              <div className={styles.consent}><LockKeyhole size={16} /><p>By submitting, you agree that HireFlow may process your application materials for recruitment. AI is used only to organize evidence for a human recruiter.</p></div>

              <Button type="submit" size="lg" className={styles.submit} disabled={submitting || rolesQuery.isLoading || roleOptions.length === 0}>
                {submitting ? <><span className={styles.spinner} /> Processing resume…</> : <>Submit application <CheckCircle2 size={18} /></>}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
