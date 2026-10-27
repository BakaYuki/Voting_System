import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({ name: z.string().trim().min(1).max(120), categoryId: z.string().uuid(), schoolName: z.string().trim().min(1).max(200).optional(), studentName: z.string().trim().min(1).max(200).optional(), description: z.string().trim().min(1).max(2000) });
const imageTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function POST(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  try {
    const form = await request.formData();
    const input = schema.parse(Object.fromEntries(form));
    const image = form.get("image");
    let imageUrl: string | null = null;
    if (image instanceof File && image.size > 0) {
      const extension = imageTypes.get(image.type);
      if (!extension || image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Choose a PNG, JPEG, or WebP image no larger than 5 MB." }, { status: 400 });
      const db = getSupabaseAdmin();
      const path = `${randomUUID()}.${extension}`;
      const { error: uploadError } = await db.storage.from("project-images").upload(path, Buffer.from(await image.arrayBuffer()), { contentType: image.type, upsert: false });
      if (uploadError) throw uploadError;
      imageUrl = db.storage.from("project-images").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await getSupabaseAdmin().from("projects").insert({ name: input.name, category_id: input.categoryId, school_name: input.schoolName ?? "", student_name: input.studentName ?? "", description: input.description, image_url: imageUrl, is_active: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Check the project fields and try again." }, { status: 400 });
    console.error("Project creation failed", error);
    return NextResponse.json({ error: "Unable to create project." }, { status: 500 });
  }
}
