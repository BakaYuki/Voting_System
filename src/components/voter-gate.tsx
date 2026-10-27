"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function VoterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [checking, setChecking] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    fetch("/api/voter/session")
      .then((response) => response.json())
      .then((data: { verified?: boolean; name?: string }) => {
        if (!data.verified) setOpen(true);
        else setOpen(false);
      })
      .catch(() => setOpen(true))
      .finally(() => setChecking(false));
  }, [pathname]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/voter/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { name?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "That code could not be verified.");
      setOpen(false);
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "That code could not be verified.");
    } finally {
      setSaving(false);
    }
  }

  if (pathname.startsWith("/admin") || (!checking && !open)) return <>{children}</>;
  return <div className="voter-overlay" role="presentation"><form className="voter-dialog" onSubmit={verify} aria-labelledby="voter-title"><p className="eyebrow">Before you vote</p><h2 id="voter-title">Enter your 4-digit voter code</h2><p>Your code is provided by the event team. It lets us record your votes against your registered name without asking for an account.</p><label htmlFor="voter-code">Voter code</label><input id="voter-code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoFocus required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="0000" /><button className="button button-primary" type="submit" disabled={saving || code.length !== 4}>{saving ? "Checking…" : "Continue to voting"}</button>{error && <p className="form-error" role="alert">{error}</p>}</form></div>;
}
