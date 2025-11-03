import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "missing user_id" }, { status: 400 });

  const pool = getPool();

  const { rows } = await pool.query(
    `
    WITH latest_token AS (
      SELECT t.token_total
      FROM public.tbl_token t
      WHERE t.user_id = $1
      ORDER BY t.created_date DESC NULLS LAST, t.token_id DESC
      LIMIT 1
    )
    SELECT
      COALESCE(u.token, (SELECT token_total FROM latest_token), 0)::int AS token_balance
    FROM public.tbl_user u
    WHERE u.user_id = $1
    `,
    [userId]
  );

  const token_balance = rows?.[0]?.token_balance ?? 0;
  return NextResponse.json({ user_id: userId, token_balance });
}
