import { connection } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CategoryLinks } from "@/components/category-links";

export const instant = false;

export default async function CategoriesPage() {
  await connection();
  const db = getSupabaseAdmin();
  const [{ data: categories }, { data: projects }] = await Promise.all([
    db.from("categories").select("id,name,description").eq("is_active", true).order("name"),
    db.from("projects").select("category_id").eq("is_active", true),
  ]);
  const projectCounts = new Map<string, number>();
  projects?.forEach((project) => projectCounts.set(project.category_id, (projectCounts.get(project.category_id) ?? 0) + 1));

  return <main className="shell section"><p className="eyebrow">Cast your votes</p><h1>Choose a category</h1><p className="lede">You have three votes in each category. Use all three on one project or spread them across different projects.</p><CategoryLinks categories={categories ?? []} projectCounts={Object.fromEntries(projectCounts)} />{!categories?.length && <p className="lede">No voting categories are available yet.</p>}</main>;
}
