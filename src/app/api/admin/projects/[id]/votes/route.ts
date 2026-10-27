import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const { id } = await params;
  const db = getSupabaseAdmin();
  const [{ data: project, error: projectError }, { data: votes, error: votesError }] = await Promise.all([
    db.from("projects").select("id,name,description,image_url,category_id,school_name,student_name,categories(name)").eq("id", id).maybeSingle(),
    db.from("votes").select("id,voter_id,created_at").eq("project_id", id).order("created_at", { ascending: false }),
  ]);
  if (projectError || votesError) return NextResponse.json({ error: (projectError ?? votesError)?.message ?? "Unable to load project votes." }, { status: 400 });
  const voterIds = [...new Set((votes ?? []).map((vote) => vote.voter_id))];
  const { data: voters, error: votersError } = voterIds.length ? await db.from("voter_codes").select("id,display_name").in("id", voterIds) : { data: [], error: null };
  if (votersError) return NextResponse.json({ error: votersError.message }, { status: 400 });
  const { data: voterCategoryVotes, error: categoryVotesError } = voterIds.length ? await db.from("votes").select("voter_id,category_id").in("voter_id", voterIds) : { data: [], error: null };
  if (categoryVotesError) return NextResponse.json({ error: categoryVotesError.message }, { status: 400 });
  const names = new Map((voters ?? []).map((voter) => [voter.id, voter.display_name || "Unnamed voter"]));
  const categoryVoteCounts = new Map<string, number>();
  voterCategoryVotes?.forEach((vote) => {
    const key = `${vote.voter_id}:${vote.category_id}`;
    categoryVoteCounts.set(key, (categoryVoteCounts.get(key) ?? 0) + 1);
  });
  return NextResponse.json({
    project,
    votes: (votes ?? []).map((vote) => ({ id: vote.id, voter_name: names.get(vote.voter_id) ?? "Unknown voter", remaining_votes: Math.max(0, 3 - (categoryVoteCounts.get(`${vote.voter_id}:${project?.category_id}`) ?? 0)), created_at: vote.created_at })),
  });
}
