import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { VoteButton } from "@/components/vote-button";
import { getSupabaseAdmin } from "@/lib/supabase";

export const instant = false;

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const db = getSupabaseAdmin();
  const [{ data: category }, { data: projects }] = await Promise.all([
    db.from("categories").select("id,name,description").eq("id", id).eq("is_active", true).maybeSingle(),
    db.from("projects").select("id,name,description,image_url").eq("category_id", id).eq("is_active", true).order("name"),
  ]);
  if (!category) notFound();

  return <main className="shell section"><Link className="text-link" href="/categories">← All categories</Link><p className="eyebrow" style={{ marginTop: 32 }}>Category</p><h1>{category.name}</h1><p className="lede">{category.description}</p><div className="status-card" style={{ margin: "24px 0" }}><strong>3 votes remaining</strong><span>Choose carefully. You can use all three votes on the same project.</span></div><div className="category-grid">{projects?.map((project) => <article className="category-card" key={project.id}>{project.image_url && <img src={project.image_url} alt="" />}<h2>{project.name}</h2><p>{project.description}</p><div style={{ marginTop: 22 }}><VoteButton categoryId={category.id} projectId={project.id} /></div></article>)}</div>{!projects?.length && <p className="lede">No projects have been added to this category yet.</p>}</main>;
}
