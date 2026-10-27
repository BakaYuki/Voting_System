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
    const { error } = await getSupabaseAdmin().from("categories").update({ name, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to rename category." }, { status: 400 }); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const { id } = await params;
  const db = getSupabaseAdmin();
  const { count, error: countError } = await db.from("projects").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 400 });
  if (count) return NextResponse.json({ error: "Delete this category's projects first." }, { status: 409 });
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
