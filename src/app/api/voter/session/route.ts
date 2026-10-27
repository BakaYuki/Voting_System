import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const cookieName = "voter_session";
const input = z.object({ code: z.string().regex(/^\d{4}$/), name: z.string().trim().min(1).max(120).optional() });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function GET() {
  const session = (await cookies()).get(cookieName)?.value;
  if (!session) return NextResponse.json({ verified: false });
  const db = getSupabaseAdmin();
  const { data } = await db.from("voter_sessions").select("voter_code_id,voter_name").eq("token_hash", hash(session)).maybeSingle();
  if (!data) return NextResponse.json({ verified: false });
  const { data: votes } = await db.from("votes").select("category_id").eq("voter_id", data.voter_code_id);
  const voteCounts = new Map<string, number>();
  votes?.forEach((vote) => voteCounts.set(vote.category_id, (voteCounts.get(vote.category_id) ?? 0) + 1));
  return NextResponse.json({ verified: true, name: data.voter_name, remainingVotes: Object.fromEntries([...voteCounts].map(([categoryId, count]) => [categoryId, Math.max(0, 3 - count)])) });
}

export async function POST(request: Request) {
  try {
    const { code, name } = input.parse(await request.json());
    const db = getSupabaseAdmin();
    const { data: voter, error } = await db.from("voter_codes").select("id, display_name").eq("code", code).eq("is_active", true).maybeSingle();
    if (error || !voter) return NextResponse.json({ error: "That code is not registered. Please ask the event team for help." }, { status: 401 });
    const voterName = voter.display_name?.trim() || name;
    if (!voterName) return NextResponse.json({ requiresName: true });
    if (!voter.display_name?.trim() && name) {
      const { error: nameError } = await db.from("voter_codes").update({ display_name: voterName, updated_at: new Date().toISOString() }).eq("id", voter.id);
      if (nameError) throw nameError;
    }
    const token = randomBytes(32).toString("base64url");
    const { error: sessionError } = await db.from("voter_sessions").insert({ voter_code_id: voter.id, voter_name: voterName, token_hash: hash(token) });
    if (sessionError) throw sessionError;
    const response = NextResponse.json({ name: voterName });
    response.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 180, path: "/" });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid 4-digit code and your name." }, { status: 400 });
    console.error("Voter verification failed", error);
    return NextResponse.json({ error: "Unable to verify the voter code." }, { status: 500 });
  }
}
