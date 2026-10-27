import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const input = z.object({ categoryId: z.string().uuid(), projectId: z.string().uuid() });
const cookieName = "anonymous_voter";

export async function POST(request: Request) {
  try {
    const body = input.parse(await request.json());
    const cookieStore = await cookies();
    let token = cookieStore.get(cookieName)?.value;
    if (!token || token.length < 32) token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data, error } = await getSupabaseAdmin().rpc("submit_vote", {
      p_token_hash: tokenHash,
      p_category_id: body.categoryId,
      p_project_id: body.projectId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    const response = NextResponse.json(data);
    response.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 180, path: "/" });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid vote details." }, { status: 400 });
    console.error("Vote submission failed", error);
    return NextResponse.json({ error: "Unable to submit vote." }, { status: 500 });
  }
}
