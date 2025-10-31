import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET() {
  const pool = getPool();
  const { rows } = await pool.query(
    `
    SELECT user_id, name, role::text AS role
    FROM public.tbl_user
    WHERE role = 'customer'                 
    ORDER BY name;
    `
  );
  return NextResponse.json(rows);
}
