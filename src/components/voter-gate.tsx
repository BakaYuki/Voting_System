"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function VoterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [checking, setChecking] = useState(true);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [voterName, setVoterName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (pathname.startsWith("/admin")) return; fetch("/api/voter/session").then((response) => response.json()).then((data: { verified?: boolean; name?: string }) => { setOpen(!data.verified); if (data.name) setVoterName(data.name); }).catch(() => setOpen(true)).finally(() => setChecking(false)); }, [pathname]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      const response = await fetch("/api/voter/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, ...(needsName ? { name } : {}) }) });
      const data = (await response.json()) as { requiresName?: boolean; name?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "That code could not be verified.");
      if (data.requiresName) { setNeedsName(true); return; }
      if (data.name) setVoterName(data.name);
      setOpen(false);
    } catch (verificationError) { setError(verificationError instanceof Error ? verificationError.message : "That code could not be verified."); }
    finally { setSaving(false); }
  }

  if (pathname.startsWith("/admin") || (!checking && !open)) return <>{voterName && <div className="voter-identity" role="status">Name: <strong>{voterName}</strong></div>}{children}</>;
  return <div className="voter-overlay" role="presentation"><form className="voter-dialog" onSubmit={verify} aria-labelledby="voter-title"><p className="eyebrow">Before you vote</p><h2 id="voter-title">{needsName ? "What is your name?" : "Enter your 4-digit voter code"}</h2><p>{needsName ? "We will record your name with this voting session." : "Your code is provided by the event team."}</p>{!needsName ? <><label htmlFor="voter-code">Voter code</label><input id="voter-code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoFocus required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="0000" /></> : <><label htmlFor="voter-name">Your name</label><input id="voter-name" autoFocus required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></>}<button className="button button-primary" type="submit" disabled={saving || (!needsName && code.length !== 4) || (needsName && !name.trim())}>{saving ? "Checking…" : needsName ? "Continue to voting" : "Continue"}</button>{error && <p className="form-error" role="alert">{error}</p>}</form></div>;
}
