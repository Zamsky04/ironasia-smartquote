import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// Pastikan runtime NodeJS
export const runtime = "nodejs";

type Status = "wait for approval" | "approved" | "rejected";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  // Kompatibel dgn Next 14+ (kadang params itu Promise)
  const p = (context.params as any);
  const { id } = typeof p.then === "function" ? await p : p;

  const sqid = Number(id);
  if (!Number.isFinite(sqid)) {
    return NextResponse.json({ error: "invalid sq_id" }, { status: 400 });
  }

  let body: { status?: Status; updated_by?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { status, updated_by } = body;
  const valid: Status[] = ["wait for approval", "approved", "rejected"];
  if (!status || !valid.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const pool = getPool();
  try {
    // ⚠️ CAST ke enum agar aman di Postgres
    await pool.query(
      `SELECT public.update_smart_quotation_status($1, $2::public.status_type, $3)`,
      [sqid, status, updated_by || "admin"]
    );

    // Ambil ringkasan (berapa blast yang tercipta)
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS blasts FROM public.tbl_blast WHERE sq_id=$1`,
      [sqid]
    );

    return NextResponse.json({
      ok: true,
      sq_id: sqid,
      status,
      blasts: rows?.[0]?.blasts ?? 0
    });
  } catch (e: any) {
    console.error("PATCH status error", e);
    return NextResponse.json({ error: "db error", detail: String(e?.message || e) }, { status: 500 });
  }
}
