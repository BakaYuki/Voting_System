import { connection } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const instant = false;

export default async function ResultsPage() {
  await connection();
  const db = getSupabaseAdmin();
  const [{ data: categories }, { data: projects }, { data: results }] = await Promise.all([
    db.from("categories").select("id,name").eq("is_active", true).order("name"),
    db.from("projects").select("id,category_id").eq("is_active", true),
    db.from("project_results").select("id,name,category_id,vote_count,score"),
  ]);
  const activeProjectIds = new Set(projects?.map((project) => project.id));

  return <main className="shell section"><p className="eyebrow">Live results</p><h1>Project rankings</h1><p className="lede">Scores are calculated within each category. A score of 10 means a project received every valid vote in its category.</p><div style={{ display: "grid", gap: 34, marginTop: 40 }}>{categories?.map((category) => {
    const ranked = (results ?? []).filter((project) => project.category_id === category.id && activeProjectIds.has(project.id)).sort((a, b) => b.vote_count - a.vote_count);
    return <section key={category.id}><h2>{category.name}</h2>{ranked.length ? <div style={{ display: "grid", gap: 10, marginTop: 16 }}>{ranked.map((project, index) => <div className="step" key={project.id}><span className="step-number">{index + 1}</span><div style={{ flex: 1 }}><h3>{project.name}{index === 0 && <span style={{ color: "var(--brand)", fontSize: ".8em", marginLeft: 12 }}>Highest score</span>}</h3><p>{project.vote_count} votes</p></div><strong>{project.score} / 10</strong></div>)}</div> : <p className="muted">No projects have been added yet.</p>}</section>;
  })}</div>{!categories?.length && <p className="lede">No results are available yet.</p>}</main>;
}
