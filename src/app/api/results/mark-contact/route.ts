import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

type Body = {
  sq_id: number;
  supplier_id: string;
  item_id?: number;           
  product_id?: string;        
};

export async function PUT(req: Request) {
  const body = (await req.json()) as Body;
  const sq_id = Number(body?.sq_id);
  const supplier_id = String(body?.supplier_id || "").trim();

  if (!sq_id || !supplier_id) {
    return NextResponse.json({ error: "missing sq_id/supplier_id" }, { status: 400 });
  }

  const pool = getPool();

  if (Number.isFinite(body.item_id)) {
    const { rowCount } = await pool.query(
      `
      UPDATE public.tbl_smart_quotation_response r
         SET get_contact = 1,
             updated_by = 'system',
             updated_date = NOW()
       WHERE r.item_id = $1
         AND r.supplier_id = $2
         AND r.sq_id = $3
      `,
      [Number(body.item_id), supplier_id, sq_id]
    );
    if (rowCount && rowCount > 0) return NextResponse.json({ ok: true });
  }

  if (body.product_id) {
    const [catStr, ...rest] = String(body.product_id).split("|");
    const category_code = Number(catStr);
    const name_norm = rest.join("|").toLowerCase().trim();
    if (!Number.isFinite(category_code) || !name_norm) {
      return NextResponse.json({ error: "invalid product_id format" }, { status: 400 });
    }

    await pool.query(
      `
      UPDATE public.tbl_smart_quotation_response r
         SET get_contact = 1,
             updated_by = 'system',
             updated_date = NOW()
       WHERE r.supplier_id = $1
         AND r.sq_id = $2
         AND r.item_id IN (
              SELECT i.item_id
                FROM public.tbl_smart_quotation_item i
               WHERE i.sq_id = $2
                 AND i.category_code = $3
                 AND lower(trim(i.product_name)) = $4
         )
      `,
      [supplier_id, sq_id, category_code, name_norm]
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "no key matched" }, { status: 400 });
}
