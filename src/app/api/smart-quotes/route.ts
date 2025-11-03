import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function POST(req: Request) {
  const pool = getPool();
  const { customer_id, area_code, created_by } = await req.json();

  if (!customer_id || !area_code) {
    return NextResponse.json({ error: "missing field" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT insert_smart_quotation($1,$2,$3) AS sqid`,
    [customer_id, parseInt(String(area_code), 10), created_by || "system"]
  );

  return NextResponse.json({ sqid: result.rows[0].sqid });
}
