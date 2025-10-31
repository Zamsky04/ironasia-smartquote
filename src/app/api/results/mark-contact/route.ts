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

  const pool = getPool();
  await pool.query(
    `
    UPDATE public.tbl_smart_quotation_response
    SET get_contact = 1, updated_by = 'system', updated_date = NOW()
    WHERE sq_id = $1 AND supplier_id = $2 AND product_id = $3
    `,
    [sq_id, supplier_id, product_id]
  );

  return NextResponse.json({ ok: true });
}
