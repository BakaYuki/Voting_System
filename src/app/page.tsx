import { connection } from "next/server";
import { CategoryLinks } from "@/components/category-links";
import { getSupabaseAdmin } from "@/lib/supabase";

export const instant = false;

export default async function Home() {
  await connection();
  const db = getSupabaseAdmin();
  const [{ data: categories }, { data: projects }] = await Promise.all([
    db.from("categories").select("id,name,description").eq("is_active", true).order("name"),
    db.from("projects").select("category_id").eq("is_active", true),
  ]);
  const projectCounts = new Map<string, number>();
  projects?.forEach((project) => projectCounts.set(project.category_id, (projectCounts.get(project.category_id) ?? 0) + 1));

  return <main className="shell section"><p className="eyebrow">Project awards</p><h1>Choose a category</h1><p className="lede">Select a category to see its projects and cast your votes.</p><CategoryLinks categories={categories ?? []} projectCounts={Object.fromEntries(projectCounts)} className="category-grid category-grid-home" />{!categories?.length && <p className="lede">No voting categories are available yet.</p>}</main>;
}
