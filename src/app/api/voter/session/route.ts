import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const cookieName = "voter_session";
const input = z.object({ code: z.string().regex(/^\d{4}$/) });

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function GET() {
  const session = (await cookies()).get(cookieName)?.value;
  if (!session) return NextResponse.json({ verified: false });
  const { data } = await getSupabaseAdmin().from("voter_sessions").select("voter_codes(display_name)").eq("token_hash", hash(session)).maybeSingle();
  const voter = Array.isArray(data?.voter_codes) ? data.voter_codes[0] : data?.voter_codes;
  return NextResponse.json(voter ? { verified: true, name: voter.display_name } : { verified: false });
}

export async function POST(request: Request) {
  try {
    const { code } = input.parse(await request.json());
    const { data: voter, error } = await getSupabaseAdmin().from("voter_codes").select("id, display_name").eq("code_hash", hash(code)).eq("is_active", true).maybeSingle();
    if (error || !voter) return NextResponse.json({ error: "That code is not registered. Please ask the event team for help." }, { status: 401 });
    const token = randomBytes(32).toString("base64url");
    const { error: sessionError } = await getSupabaseAdmin().from("voter_sessions").insert({ voter_code_id: voter.id, token_hash: hash(token) });
    if (sessionError) throw sessionError;
    const response = NextResponse.json({ name: voter.display_name });
    response.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 180, path: "/" });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter the 4-digit voter code." }, { status: 400 });
    console.error("Voter verification failed", error);
    return NextResponse.json({ error: "Unable to verify the voter code." }, { status: 500 });
  }
}
