import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  try {
    const { isOpen } = z.object({ isOpen: z.boolean() }).parse(await request.json());
    const now = new Date().toISOString();
    const { error } = await getSupabaseAdmin().from("voting_settings").update({ is_open: isOpen, opened_at: isOpen ? now : undefined, closed_at: isOpen ? null : now, updated_at: now, updated_by: admin.id }).eq("id", true);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ isOpen });
  } catch { return NextResponse.json({ error: "Unable to update voting status." }, { status: 400 }); }
}
