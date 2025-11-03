import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function POST(req: Request) {
  const pool = getPool();
  const { customer_id, area_codes, created_by } = await req.json();

  const areas: number[] = Array.isArray(area_codes)
    ? area_codes.map((x: any) => Number(x)).filter(Number.isFinite)
    : (area_codes != null ? [Number(area_codes)].filter(Number.isFinite) : []);

  if (!customer_id || areas.length === 0) {
    return NextResponse.json({ error: "missing field" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT insert_smart_quotation($1, $2::int[], $3) AS sqid`,
    [customer_id, areas, created_by || "system"]
  );

  return NextResponse.json({ sqid: rows[0].sqid, areas });
}
