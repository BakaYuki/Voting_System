"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to sign in.");
      window.location.assign("/admin");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
      setLoading(false);
    }
  }

  return <form className="category-card" action="/api/admin/login" method="post" onSubmit={submit} style={{ display: "grid", gap: 16, marginTop: 28 }}>
    <label>Email<input name="email" type="email" autoComplete="email" required style={{ display: "block", width: "100%", marginTop: 6, padding: 12, border: "1px solid var(--line)", borderRadius: 6 }} /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required style={{ display: "block", width: "100%", marginTop: 6, padding: 12, border: "1px solid var(--line)", borderRadius: 6 }} /></label>
    <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
