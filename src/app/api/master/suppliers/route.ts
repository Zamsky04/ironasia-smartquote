import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// GET /api/master/suppliers?search=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("search") || "").trim();

  const pool = getPool();
  const { rows } = await pool.query(
    `
    SELECT user_id AS id, name
    FROM public.tbl_user
    WHERE role = 'business'
      AND ($1 = '' OR name ILIKE '%' || $1 || '%')
    ORDER BY name ASC
    LIMIT 200
    `,
    [q]
  );

  return NextResponse.json(rows);
}
