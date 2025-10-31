import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET() {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT category_code AS category_id, category_name
    FROM public.tbl_category_product
    ORDER BY category_name;
  `);
  return NextResponse.json(rows);
}