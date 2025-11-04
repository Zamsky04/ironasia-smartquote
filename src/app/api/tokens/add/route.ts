import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

type Body = { user_id: string; tokens?: number; reason?: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const userId = String(body?.user_id || "").trim();
  const tokens = Number(body?.tokens ?? 0);    
  const reason = body?.reason ?? "topup";

  if (!userId || !Number.isFinite(tokens) || tokens <= 0) {
    return NextResponse.json({ error: "invalid user_id/tokens" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    WITH base AS (
      SELECT e.user_id, e.token_id, COALESCE(e.amount,0)::int AS balance
      FROM public.tbl_ewallet e
      WHERE e.user_id = $1
      LIMIT 1
    ),
    upd AS (
      UPDATE public.tbl_ewallet
         SET amount = (SELECT balance FROM base) + $2,
             updated_by = COALESCE($3,'system'),
             updated_date = NOW()
       WHERE user_id = $1
       RETURNING amount AS token_balance, token_id
    ),
    ins_tx AS (
      INSERT INTO public.tbl_transaction (user_id, token_id, description, transaction_type, amount)
      SELECT $1, u.token_id, $3, 'TOPUP', $2 FROM upd u
      RETURNING 1
    )
    SELECT token_balance FROM upd
    `,
    [userId, tokens, reason]
  );

  const token_balance = rows?.[0]?.token_balance ?? 0;
  return NextResponse.json({
    user_id: userId,
    token_balance,
    approx_idr: token_balance * 1000
  });
}
