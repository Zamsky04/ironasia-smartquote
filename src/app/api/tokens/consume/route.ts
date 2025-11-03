import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

type Body = { user_id: string; amount?: number; reason?: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const userId = String(body?.user_id || "").trim();
  const amount = Number(body?.amount ?? 1);
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
        COALESCE(u.token, (SELECT token_total FROM latest_token), 0) AS base_balance
      FROM public.tbl_user u
      WHERE u.user_id = $1
    )
    UPDATE public.tbl_user u
       SET token = GREATEST(0, (SELECT base_balance FROM base) - $2),
           updated_by = 'system',
           updated_date = NOW()
     WHERE u.user_id = (SELECT user_id FROM base)
     RETURNING COALESCE(u.token,0)::int AS token_balance
    `,
    [userId, amount]
  );

  return NextResponse.json({ user_id: userId, token_balance: rows?.[0]?.token_balance ?? 0 });
}
