import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "missing user_id" }, { status: 400 });

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT COALESCE(e.amount,0)::int AS token_balance
     FROM public.tbl_ewallet e
     WHERE e.user_id = $1`,
    [userId]
  );

  const token_balance = rows?.[0]?.token_balance ?? 0;
  return NextResponse.json({
    user_id: userId,
    token_balance,                
    approx_idr: token_balance * 1000
  });
}
