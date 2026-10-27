import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({ name: z.string().trim().min(1).max(120) });

export async function POST(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  try {
    const { name } = schema.parse(await request.json());
    const { error } = await getSupabaseAdmin().from("categories").insert({ name, is_active: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a category name." }, { status: 400 });
    console.error("Category creation failed", error);
    return NextResponse.json({ error: "Unable to create category." }, { status: 500 });
  }
}
