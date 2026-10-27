import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({ name: z.string().trim().min(1).max(120), categoryId: z.string().uuid(), description: z.string().trim().min(1).max(2000), imageUrl: z.string().url().optional().or(z.literal("")) });

export async function POST(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const { error } = await getSupabaseAdmin().from("projects").insert({ name: input.name, category_id: input.categoryId, description: input.description, image_url: input.imageUrl || null, is_active: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Check the project fields and try again." }, { status: 400 });
    console.error("Project creation failed", error);
    return NextResponse.json({ error: "Unable to create project." }, { status: 500 });
  }
}
