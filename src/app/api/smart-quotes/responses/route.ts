import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function POST(req: Request) {
  const pool = getPool();
  const body = await req.json();

  const {
    sq_id, customer_id, area_code,
    category_code, supplier_id,
    product_name, quantity, price,
    note, created_by
  } = body || {};

  if (!sq_id || !customer_id || !area_code || !category_code || !supplier_id || !product_name || !quantity || !price) {
    return NextResponse.json({ error: "missing field" }, { status: 400 });
  }

  await pool.query(
    `SELECT public.insert_smart_quotation_response($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      Number(sq_id), String(customer_id), Number(area_code),
      Number(category_code), String(supplier_id), String(product_name),
      Number(quantity), Number(price), note ?? null, created_by || supplier_id
    ]
  );

  return NextResponse.json({ ok: true });
}
