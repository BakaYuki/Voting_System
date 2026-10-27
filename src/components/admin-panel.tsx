"use client";

import { useState } from "react";

type Category = { id: string; name: string };
type Project = { id: string; name: string; description: string; image_url: string | null; category_id: string; school_name: string; student_name: string; vote_count: number };
type ProjectVote = { id: string; voter_name: string; remaining_votes: number; created_at: string };

export function AdminPanel({ categories, projects, isOpen, totalVotes }: { categories: Category[]; projects: Project[]; isOpen: boolean; totalVotes: number }) {
  const [votingOpen, setVotingOpen] = useState(isOpen);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectVotes, setProjectVotes] = useState<ProjectVote[]>([]);
  const [loadingVotes, setLoadingVotes] = useState(false);

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

  async function showProjectVotes(projectId: string) {
    if (selectedProject === projectId) { setSelectedProject(null); return; }
    setSelectedProject(projectId); setLoadingVotes(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/votes`);
      const data = await response.json() as { votes?: ProjectVote[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load project votes.");
      setProjectVotes(data.votes ?? []);
    } catch (error) {
      setProjectVotes([]);
      setMessage(error instanceof Error ? error.message : "Unable to load project votes.");
    } finally { setLoadingVotes(false); }
  }

  function exportProjectVotes(project: Project) {
    const rows = [["Project", "Category", "School name", "Student name", "Voter name", "Remaining votes", "Voted at"], ...projectVotes.map((vote) => [project.name, categories.find((category) => category.id === project.category_id)?.name ?? "", project.school_name, project.student_name, vote.voter_name, String(vote.remaining_votes), new Date(vote.created_at).toISOString()])];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "project"}-votes.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function downloadCsv(filename: string, rows: string[][]) {
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportCategory(category: Category) {
    const categoryProjects = projects.filter((project) => project.category_id === category.id);
    const categoryTotal = categoryProjects.reduce((total, project) => total + project.vote_count, 0);
    const rows = [["Category", "Project", "School name", "Student name", "Description", "Votes received", "Total votes in category", "Marks out of 10"], ...categoryProjects.map((project) => [
      category.name, project.name, project.school_name, project.student_name, project.description, String(project.vote_count), String(categoryTotal), (categoryTotal ? (project.vote_count / categoryTotal) * 10 : 0).toFixed(2),
    ])];
    downloadCsv(`${category.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "category"}-results.csv`, rows);
  }

  return <div className="admin-layout">
    <section className="admin-summary"><div><p className="eyebrow">Voting control</p><h2>{votingOpen ? "Voting is open" : "Voting is closed"}</h2><p>{votingOpen ? "Visitors can submit votes." : "New votes are blocked."}</p></div><button className={`button ${votingOpen ? "button-secondary" : "button-primary"}`} onClick={toggleVoting} disabled={saving}>{votingOpen ? "Close voting" : "Open voting"}</button></section>
    <section className="admin-stats"><div className="stat-card"><strong>{totalVotes}</strong><span>Total votes received</span></div><div className="stat-card"><strong>{projects.length}</strong><span>Projects</span></div><div className="stat-card"><strong>{categories.length}</strong><span>Categories</span></div></section>
    <section className="admin-section"><p className="eyebrow">Project management</p><h2>Add a project</h2><form className="admin-form" onSubmit={addProject}><label>Project name<input name="name" required maxLength={120} /></label><label>School name<input name="schoolName" required maxLength={200} /></label><label>Students name<input name="studentName" required maxLength={200} /></label><label>Category<select name="categoryId" required defaultValue={categories[0]?.id}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Project image <span className="muted">(optional, PNG/JPEG/WebP; max 5 MB)</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp" /></label><label>Description<textarea name="description" rows={4} required maxLength={2000} /></label><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Add project"}</button></form></section>
    <section className="admin-section"><p className="eyebrow">Category management</p><h2>Categories</h2><form className="admin-form" onSubmit={addCategory}><label>Category name<input name="name" required maxLength={120} /></label><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Add category"}</button></form><div className="admin-projects">{categories.map((category) => <article className="admin-project" key={category.id}><div><h3>{category.name}</h3><button className="button button-secondary" type="button" disabled={saving} onClick={() => rename("categories", category.id, category.name)}>Rename</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => remove("categories", category.id, category.name)}>Delete</button></div></article>)}</div></section>
    <section className="admin-section"><p className="eyebrow">Category results</p><h2>Votes and marks by category</h2><p className="muted">Each project is scored against the total votes received by all projects in its category.</p><div className="category-results">{categories.map((category) => { const categoryProjects = projects.filter((project) => project.category_id === category.id); const categoryTotal = categoryProjects.reduce((total, project) => total + project.vote_count, 0); return <article className="category-result" key={category.id}><div className="vote-records-header"><h3>{category.name}</h3><button className="button button-secondary" type="button" disabled={!categoryProjects.length} onClick={() => exportCategory(category)}>Export CSV</button></div>{categoryProjects.length ? <div className="vote-table-wrap"><table className="vote-table"><thead><tr><th>Project</th><th>School</th><th>Students</th><th>Votes received</th><th>Marks / 10</th></tr></thead><tbody>{categoryProjects.map((project) => <tr key={project.id}><td>{project.name}</td><td>{project.school_name}</td><td>{project.student_name}</td><td>{project.vote_count} / {categoryTotal}</td><td>{(categoryTotal ? (project.vote_count / categoryTotal) * 10 : 0).toFixed(2)}</td></tr>)}</tbody></table></div> : <p className="muted">No projects in this category.</p>}</article>; })}</div></section>
    <section className="admin-section"><p className="eyebrow">Results overview</p><h2>Project vote totals</h2><p className="muted">Click a project to view its vote records and export them as a CSV file compatible with Excel.</p><div className="admin-projects">{projects.map((project) => <article className="admin-project" key={project.id}>{project.image_url && <img src={project.image_url} alt="" />}<div><button className="project-title-button" type="button" onClick={() => showProjectVotes(project.id)}><h3>{project.name}</h3></button><p><strong>School:</strong> {project.school_name}</p><p><strong>Students:</strong> {project.student_name}</p><p>{project.description}</p><strong>{project.vote_count} votes</strong><div><button className="button button-secondary" type="button" disabled={saving} onClick={() => rename("projects", project.id, project.name)}>Rename</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => remove("projects", project.id, project.name)}>Delete</button></div>{selectedProject === project.id && <div className="vote-records"><div className="vote-records-header"><h4>Vote records</h4><button className="button button-secondary" type="button" disabled={loadingVotes || !projectVotes.length} onClick={() => exportProjectVotes(project)}>Export CSV</button></div>{loadingVotes ? <p className="muted">Loading vote records…</p> : projectVotes.length ? <div className="vote-table-wrap"><table className="vote-table"><thead><tr><th>Voter name</th><th>Remaining votes</th><th>Voted at</th></tr></thead><tbody>{projectVotes.map((vote) => <tr key={vote.id}><td>{vote.voter_name}</td><td>{vote.remaining_votes}</td><td>{new Date(vote.created_at).toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="muted">No votes recorded for this project.</p>}</div>}</div></article>)}</div></section>
    {message && <p className="admin-message" role="status">{message}</p>}
  </div>;
}
