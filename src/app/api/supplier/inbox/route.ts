// /api/supplier/inbox/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplier_id");
  if (!supplierId) {
    return NextResponse.json({ error: "missing supplier_id" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    WITH latest_resp AS (
      SELECT DISTINCT ON (r.item_id, r.supplier_id)
        r.item_id,
        r.supplier_id,
        r.product_name AS response_product_name,
        r.quantity     AS response_qty,
        r.price        AS response_price,
        r.note         AS response_note,
        r.created_date AS response_created_date
      FROM public.tbl_smart_quotation_response r
      ORDER BY r.item_id, r.supplier_id, r.created_date DESC
    )
    SELECT
      b.blast_id,
      i.sq_id,
      i.item_id,
      sq.customer_id,
      cu.name           AS customer_name,
      b.area_code,
      ar.area_name,
      i.category_code,
      cat.category_name,
      i.product_name    AS requested_product_name,
      i.size            AS requested_size,
      un.unit_name,
      i.quantity        AS requested_qty,
      i.note            AS requested_note,     -- ⬅️ NOTE PER ITEM
      sq.created_date   AS sq_created_date,

      lr.response_product_name,
      lr.response_qty,
      lr.response_price,
      lr.response_note,
      lr.response_created_date
    FROM public.tbl_blast b
    JOIN public.tbl_smart_quotation_item i ON i.item_id = b.item_id
    JOIN public.tbl_smart_quotation sq     ON sq.sq_id = i.sq_id
    JOIN public.tbl_user cu                ON cu.user_id = sq.customer_id
    JOIN public.tbl_area ar                ON ar.area_code = b.area_code
    JOIN public.tbl_category_product cat   ON cat.category_code = i.category_code
    JOIN public.tbl_unit un                ON un.unit_id = i.unit_id
    LEFT JOIN latest_resp lr
           ON lr.item_id = i.item_id
          AND lr.supplier_id = b.supplier_id
    WHERE b.supplier_id = $1
    ORDER BY b.created_date DESC, b.blast_id DESC;
    `,
    [supplierId]
  );

  return NextResponse.json(rows);
}
