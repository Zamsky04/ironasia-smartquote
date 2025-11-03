import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const sqid = Number(id);
  if (!Number.isFinite(sqid)) {
    return NextResponse.json({ error: "invalid sq_id" }, { status: 400 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const {
    category_code,      
    product_name,     
    size,              
    quantity,           
    note,              
    created_by         
  } = body || {};

  if (!category_code || !product_name || !quantity || Number(quantity) <= 0) {
    return NextResponse.json({ error: "missing/invalid field" }, { status: 400 });
  }

  const pool = getPool();
  try {

    const { rows } = await pool.query(
      `SELECT public.insert_smart_quotation_item($1,$2,$3,$4,$5,$6,$7) AS msg`,
      [
        sqid,
        Number(category_code),
        String(product_name).trim(),
        size ?? null,
        Number(quantity),
        note ?? null,
        created_by || "system",
      ]
    );

    return NextResponse.json({
      message: rows?.[0]?.msg ?? "item added",
      item: {
        sq_id: sqid,
        category_id: Number(category_code),
        category_name: undefined,
        product_name: String(product_name).trim(),
        size: size ?? null,
        quantity: Number(quantity),
        note: note ?? null,
        status: "wait for approval",
      },
    });
  } catch (err) {
    console.error("Add item error:", err);
    return NextResponse.json({ error: "failed to add item" }, { status: 500 });
  }
}
