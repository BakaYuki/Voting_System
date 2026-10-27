"use client";

import { useState } from "react";

type Category = { id: string; name: string };
type Project = { id: string; name: string; description: string; image_url: string | null; vote_count: number };

export function AdminPanel({ categories, projects, isOpen, totalVotes }: { categories: Category[]; projects: Project[]; isOpen: boolean; totalVotes: number }) {
  const [votingOpen, setVotingOpen] = useState(isOpen);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function update(url: string, method: string, body: FormData | unknown) {
    setSaving(true); setMessage("");
    try {
      const response = await fetch(url, body instanceof FormData ? { method, body } : { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save changes.");
      setMessage("Saved successfully.");
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save changes.");
      return null;
    } finally { setSaving(false); }
  }

  async function addProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await update("/api/admin/projects", "POST", form);
    if (result) window.location.reload();
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await update("/api/admin/categories", "POST", { name: form.get("name") });
    if (result) window.location.reload();
  }

  async function toggleVoting() {
    const result = await update("/api/admin/settings", "PATCH", { isOpen: !votingOpen });
    if (result) setVotingOpen(result.isOpen);
  }

  async function rename(kind: "categories" | "projects", id: string, currentName: string) {
    const name = window.prompt("Enter a new name", currentName)?.trim();
    if (!name || name === currentName) return;
    const result = await update(`/api/admin/${kind}/${id}`, "PATCH", { name });
    if (result) window.location.reload();
  }

  async function remove(kind: "categories" | "projects", id: string, name: string) {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    const result = await update(`/api/admin/${kind}/${id}`, "DELETE", {});
    if (result) window.location.reload();
  }

  return <div className="admin-layout">
    <section className="admin-summary"><div><p className="eyebrow">Voting control</p><h2>{votingOpen ? "Voting is open" : "Voting is closed"}</h2><p>{votingOpen ? "Visitors can submit votes." : "New votes are blocked."}</p></div><button className={`button ${votingOpen ? "button-secondary" : "button-primary"}`} onClick={toggleVoting} disabled={saving}>{votingOpen ? "Close voting" : "Open voting"}</button></section>
    <section className="admin-stats"><div className="stat-card"><strong>{totalVotes}</strong><span>Total votes received</span></div><div className="stat-card"><strong>{projects.length}</strong><span>Projects</span></div><div className="stat-card"><strong>{categories.length}</strong><span>Categories</span></div></section>
    <section className="admin-section"><p className="eyebrow">Project management</p><h2>Add a project</h2><form className="admin-form" onSubmit={addProject}><label>Project name<input name="name" required maxLength={120} /></label><label>Category<select name="categoryId" required defaultValue={categories[0]?.id}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Project image <span className="muted">(optional, PNG/JPEG/WebP; max 5 MB)</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp" /></label><label>Description<textarea name="description" rows={4} required maxLength={2000} /></label><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Add project"}</button></form></section>
    <section className="admin-section"><p className="eyebrow">Category management</p><h2>Categories</h2><form className="admin-form" onSubmit={addCategory}><label>Category name<input name="name" required maxLength={120} /></label><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Add category"}</button></form><div className="admin-projects">{categories.map((category) => <article className="admin-project" key={category.id}><div><h3>{category.name}</h3><button className="button button-secondary" type="button" disabled={saving} onClick={() => rename("categories", category.id, category.name)}>Rename</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => remove("categories", category.id, category.name)}>Delete</button></div></article>)}</div></section>
    <section className="admin-section"><p className="eyebrow">Results overview</p><h2>Project vote totals</h2><div className="admin-projects">{projects.map((project) => <article className="admin-project" key={project.id}>{project.image_url && <img src={project.image_url} alt="" />}<div><h3>{project.name}</h3><p>{project.description}</p><strong>{project.vote_count} votes</strong><button className="button button-secondary" type="button" disabled={saving} onClick={() => rename("projects", project.id, project.name)}>Rename</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => remove("projects", project.id, project.name)}>Delete</button></div></article>)}</div></section>
    {message && <p className="admin-message" role="status">{message}</p>}
  </div>;
}
