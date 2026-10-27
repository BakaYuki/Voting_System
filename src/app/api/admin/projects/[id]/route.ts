import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const nameSchema = z.object({ name: z.string().trim().min(1).max(120) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  try {
    const { id } = await params;
    const { name } = nameSchema.parse(await request.json());
    const { error } = await getSupabaseAdmin().from("projects").update({ name, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to rename project." }, { status: 400 }); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const { id } = await params;
  const db = getSupabaseAdmin();
  const { count, error: countError } = await db.from("votes").select("id", { count: "exact", head: true }).eq("project_id", id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 400 });
  if (count) return NextResponse.json({ error: "This project has votes and cannot be deleted." }, { status: 409 });
  const { error } = await db.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
