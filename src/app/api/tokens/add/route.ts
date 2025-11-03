import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

type Body = { user_id: string; amount?: number; reason?: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const userId = String(body?.user_id || "").trim();
  const amount = Number(body?.amount ?? 0);

  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "invalid user_id/amount" }, { status: 400 });
  }

  const pool = getPool();

  const { rows } = await pool.query(
    `
    WITH latest_token AS (
      SELECT t.token_total
      FROM public.tbl_token t
      WHERE t.user_id = $1
      ORDER BY t.created_date DESC NULLS LAST, t.token_id DESC
      LIMIT 1
    ),
    base AS (
      SELECT
        u.user_id,
        COALESCE(u.token, (SELECT token_total FROM latest_token), 0)::int AS base_balance
      FROM public.tbl_user u
      WHERE u.user_id = $1
    ),
    upd AS (
      UPDATE public.tbl_user u
         SET token       = (SELECT base_balance FROM base) + $2,
             updated_by  = COALESCE($3, 'system'),
             updated_date= NOW()
       WHERE u.user_id   = (SELECT user_id FROM base)
       RETURNING u.user_id, COALESCE(u.token,0)::int AS token_balance
    ),
    ins AS (
      INSERT INTO public.tbl_token (user_id, token_total, created_by, created_date)
      SELECT user_id, token_balance, COALESCE($3,'system'), NOW() FROM upd
      RETURNING 1
    )
    SELECT token_balance FROM upd
    `,
    [userId, amount, body?.reason ?? "topup"]
  );

  return NextResponse.json({ user_id: userId, token_balance: rows?.[0]?.token_balance ?? 0 });
}
