import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET() {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT area_code, area_name
    FROM public.tbl_area
    ORDER BY area_name;
  `);
  return NextResponse.json(rows);
}