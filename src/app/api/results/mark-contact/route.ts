import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

type Body = {
  sq_id: number;
  supplier_id: string;
  product_id: string; 
};

export async function PUT(req: Request) {
  const body = (await req.json()) as Body;
  const sq_id = Number(body?.sq_id);
  const supplier_id = String(body?.supplier_id || "").trim();
  const product_id = String(body?.product_id || "").trim();

  if (!sq_id || !supplier_id || !product_id) {
    return NextResponse.json({ error: "missing sq_id/supplier_id/product_id" }, { status: 400 });
  }

  const [catStr, ...rest] = product_id.split("|");
  const category_code = Number(catStr);
  const name_norm = rest.join("|").toLowerCase().trim();

  if (!Number.isFinite(category_code) || !name_norm) {
    return NextResponse.json({ error: "invalid product_id format" }, { status: 400 });
  }

  const pool = getPool();

  await pool.query(
    `
    UPDATE public.tbl_smart_quotation_response r
       SET get_contact = 1,
           updated_by = 'system',
           updated_date = NOW()
     WHERE r.sq_id = $1
       AND r.supplier_id = $2
       AND r.category_code = $3
       AND LOWER(TRIM(r.product_name)) = $4
    `,
    [sq_id, supplier_id, category_code, name_norm]
  );

  return NextResponse.json({ ok: true });
}
