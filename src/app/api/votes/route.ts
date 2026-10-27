import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const input = z.object({ categoryId: z.string().uuid(), projectId: z.string().uuid() });
const cookieName = "voter_session";

export async function POST(request: Request) {
  try {
    const body = input.parse(await request.json());
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    if (!token) return NextResponse.json({ error: "Enter your registered voter code first." }, { status: 401 });
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data, error } = await getSupabaseAdmin().rpc("submit_vote", {
      p_session_hash: tokenHash,
      p_category_id: body.categoryId,
      p_project_id: body.projectId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    const response = NextResponse.json(data);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid vote details." }, { status: 400 });
    console.error("Vote submission failed", error);
    return NextResponse.json({ error: "Unable to submit vote." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = input.parse(await request.json());
    const token = (await cookies()).get(cookieName)?.value;
    if (!token) return NextResponse.json({ error: "Enter your registered voter code first." }, { status: 401 });
    const { data, error } = await getSupabaseAdmin().rpc("undo_vote", {
      p_session_hash: createHash("sha256").update(token).digest("hex"),
      p_category_id: body.categoryId,
      p_project_id: body.projectId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid vote details." }, { status: 400 });
    console.error("Vote undo failed", error);
    return NextResponse.json({ error: "Unable to undo vote." }, { status: 500 });
  }
}
