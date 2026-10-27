import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { AdminPanel } from "@/components/admin-panel";

export const instant = false;

export default async function AdminPage() {
  await connection();
  return <AdminContent />;
}

async function AdminContent() {
  if (!await getAdminUser()) redirect("/admin/login");
  const db = getSupabaseAdmin();
  const [categoriesResult, projectsResult, votesResult, settingsResult] = await Promise.all([
    db.from("categories").select("id,name").order("name"),
    db.from("project_results").select("id,name,description,image_url,vote_count").order("name"),
    db.from("votes").select("id", { count: "exact", head: true }),
    db.from("voting_settings").select("is_open").eq("id", true).single(),
  ]);
  const error = categoriesResult.error ?? projectsResult.error ?? votesResult.error ?? settingsResult.error;
  if (error) return <main className="shell section"><p className="eyebrow">Admin dashboard</p><h1>Dashboard could not load</h1><p className="form-error" role="alert">{error.message}</p></main>;
  return <main className="shell section"><p className="eyebrow">Admin dashboard</p><h1>Manage project awards</h1><AdminPanel categories={categoriesResult.data ?? []} projects={projectsResult.data ?? []} isOpen={settingsResult.data?.is_open ?? false} totalVotes={votesResult.count ?? 0} /></main>;
}
