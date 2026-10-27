import Link from "next/link";
import { connection } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

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

  return <main className="shell section"><p className="eyebrow">Cast your votes</p><h1>Choose a category</h1><p className="lede">You have three votes in each category. Use all three on one project or spread them across different projects.</p><div className="category-grid">{categories?.map((category) => <Link className="category-card" href={`/categories/${category.id}`} key={category.id}><h2>{category.name}</h2><p>{category.description}</p><span>{projectCounts.get(category.id) ?? 0} projects · 3 votes available →</span></Link>)}</div>{!categories?.length && <p className="lede">No voting categories are available yet.</p>}</main>;
}
