import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// POST /api/smart-quotes/responses
// body: { sq_id, customer_id, area_code, supplier_id, product_id, quantity, price, created_by? }
export async function POST(req: Request) {
  const pool = getPool();
  const body = await req.json();

  const {
    sq_id, customer_id, area_code,
    supplier_id, product_id,
    quantity, price,
    created_by
  } = body || {};

  // minimal validasi
  if (!sq_id || !customer_id || !area_code || !supplier_id || !product_id || !quantity || !price) {
    return NextResponse.json({ error: "missing field" }, { status: 400 });
  }

  // panggil function insert_supplier_response(...)
  await pool.query(
    `SELECT public.insert_supplier_response($1,$2,$3,$4,$5,$6,$7,$8)`,
    [sq_id, customer_id, area_code, supplier_id, product_id, Number(quantity), Number(price), created_by || supplier_id]
  );

  return NextResponse.json({ ok: true });
}
