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
    unit_id,         
    product_name,
    size,            
    quantity,
    note,
    created_by
  } = body || {};

  if (!category_code || !unit_id || !product_name || !quantity || Number(quantity) <= 0) {
    return NextResponse.json({ error: "missing/invalid field" }, { status: 400 });
  }

  const pool = getPool();
  try {
    const ures = await pool.query(
      `SELECT unit_name FROM public.tbl_unit WHERE unit_id = $1`,
      [Number(unit_id)]
    );
    if (!ures.rowCount) {
      return NextResponse.json({ error: "invalid unit_id" }, { status: 400 });
    }
    const unitName: string = String(ures.rows[0].unit_name || "").trim();

    const raw = (size ?? "").toString().trim();
    const alreadyHas = raw.toLowerCase().endsWith(unitName.toLowerCase());
    const sizeCombined =
      raw.length === 0 ? unitName : (alreadyHas ? raw : `${raw}${unitName}`);

    const { rows } = await pool.query(
      `SELECT public.insert_smart_quotation_item($1,$2,$3,$4,$5,$6,$7,$8) AS msg`,
      [
        sqid,
        Number(category_code),
        Number(unit_id),
        String(product_name).trim(),
        sizeCombined,              
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
        product_name: String(product_name).trim(),
        size: sizeCombined,          
        unit_id: Number(unit_id),
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
