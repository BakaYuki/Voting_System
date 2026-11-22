import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const generateSchema = z.object({
  count: z.coerce.number().int().min(1).max(10000),
});

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("voter_codes")
    .select("id,code,is_active,display_name,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const codes = data ?? [];
  return NextResponse.json({
    codes,
    count: codes.length,
    activeCount: codes.filter((code) => code.is_active).length,
  });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });

  try {
    const rawBody = await request.json().catch(() => ({}));
    const rawCount =
      rawBody?.count ?? rawBody?.quantity ?? rawBody?.amount ?? rawBody?.number ?? rawBody?.num ?? rawBody?.howMany ?? rawBody?.keys;
    const { count } = generateSchema.parse({ count: rawCount });
    const db = getSupabaseAdmin();

    const { data: existingRows, error: existingError } = await db.from("voter_codes").select("code");
    if (existingError) throw existingError;

    const used = new Set((existingRows ?? []).map((row) => row.code));
    if (used.size + count > 10000) {
      return NextResponse.json({ error: "Not enough unused 4-digit codes are available." }, { status: 409 });
    }

    const generated: string[] = [];
    let attempts = 0;
    while (generated.length < count && attempts < count * 100 + 1000) {
      attempts += 1;
      const code = randomInt(0, 10000).toString().padStart(4, "0");
      if (used.has(code)) continue;
      used.add(code);
      generated.push(code);
    }

    if (generated.length < count) {
      return NextResponse.json({ error: "Not enough unused 4-digit codes are available." }, { status: 409 });
    }

    const { error: insertError } = await db
      .from("voter_codes")
      .insert(generated.map((code) => ({ code, is_active: true })));

    if (insertError) throw insertError;

    return NextResponse.json({ codes: generated, count: generated.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid number of keys to generate." }, { status: 400 });
    }
    console.error("Voter code generation failed", error);
    return NextResponse.json({ error: "Unable to generate voter codes." }, { status: 500 });
  }
}

const bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  isActive: z.boolean(),
});

export async function PATCH(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });

  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  try {
    const { ids, isActive } = bulkStatusSchema.parse(await request.json());
    const { error: updateError } = await db
      .from("voter_codes")
      .update({ is_active: isActive, updated_at: now })
      .in("id", ids);
    if (updateError) throw updateError;

    // Deactivating a key immediately invalidates sessions created with it.
    if (!isActive) {
      const { error: sessionsError } = await db.from("voter_sessions").delete().in("voter_code_id", ids);
      if (sessionsError) throw sessionsError;
    }

    return NextResponse.json({ ok: true, updated: ids.length, isActive });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Select at least one valid voter code." }, { status: 400 });
    }
    console.error("Voter code status update failed", error);
    return NextResponse.json({ error: "Unable to update voter codes." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });

  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  try {
    const rawBody = await request.json().catch(() => ({}));
    const selectedIds = Array.isArray(rawBody?.ids) ? rawBody.ids.filter((id: unknown) => typeof id === "string") : null;

    // No selected ids means "deactivate all keys" (preserves vote history).
    if (!selectedIds) {
      const { data: allCodes, error: codesError } = await db.from("voter_codes").select("id");
      if (codesError) throw codesError;

      const ids = (allCodes ?? []).map((code) => code.id);
      if (ids.length > 0) {
        const { error: deactivateError } = await db
          .from("voter_codes")
          .update({ is_active: false, updated_at: now })
          .in("id", ids);
        if (deactivateError) throw deactivateError;
      }

      const { error: sessionsError } = await db.from("voter_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (sessionsError) throw sessionsError;

      return NextResponse.json({ ok: true, deleted: 0, deactivated: ids.length });
    }

    if (selectedIds.length === 0) {
      return NextResponse.json({ error: "Select at least one voter code." }, { status: 400 });
    }

    const { data: votedRows, error: votedError } = await db.from("votes").select("voter_id");
    if (votedError) throw votedError;
    const votedIds = new Set((votedRows ?? []).map((row) => row.voter_id));

    const usedIds = selectedIds.filter((id: string) => votedIds.has(id));
    const unusedIds = selectedIds.filter((id: string) => !votedIds.has(id));

    // Unused keys can be removed completely. Used keys are deactivated so vote data and names remain available.
    if (unusedIds.length > 0) {
      const { error: deleteError } = await db.from("voter_codes").delete().in("id", unusedIds);
      if (deleteError) throw deleteError;
    }

    if (usedIds.length > 0) {
      const { error: deactivateError } = await db
        .from("voter_codes")
        .update({ is_active: false, updated_at: now })
        .in("id", usedIds);
      if (deactivateError) throw deactivateError;
    }

    const { error: sessionsError } = await db.from("voter_sessions").delete().in("voter_code_id", selectedIds);
    if (sessionsError) throw sessionsError;

    return NextResponse.json({ ok: true, deleted: unusedIds.length, deactivated: usedIds.length });
  } catch (error) {
    console.error("Voter code deletion failed", error);
    return NextResponse.json({ error: "Unable to delete voter codes." }, { status: 500 });
  }
}