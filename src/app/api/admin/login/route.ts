import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

const credentials = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const isFormSubmission = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded") ?? false;
  try {
    const rawBody = isFormSubmission
      ? Object.fromEntries(await request.formData())
      : await request.json();
    const body = credentials.parse(rawBody);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ error: "Supabase authentication is not configured." }, { status: 500 });
    const response = isFormSubmission
      ? NextResponse.redirect(new URL("/admin", request.url), 303)
      : NextResponse.json({ ok: true });
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.headers.get("cookie")?.split("; ").flatMap((item) => {
          const separator = item.indexOf("=");
          return separator > 0 ? [{ name: item.slice(0, separator), value: item.slice(separator + 1) }] : [];
        }) ?? [],
        setAll: (values) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    });
    const { error } = await supabase.auth.signInWithPassword(body);
    if (error) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
