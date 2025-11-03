import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET() {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT unit_id, unit_name FROM public.tbl_unit ORDER BY unit_name ASC`
  );
  return NextResponse.json(rows);
}
