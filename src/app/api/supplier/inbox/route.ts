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
    -- Aggregate item per (sq_id, category): nama produk (free text) & total qty
    WITH items_cat AS (
      SELECT
        i.sq_id,
        i.category_code,
        COALESCE(string_agg(trim(i.product_name), ', ' ORDER BY i.item_id DESC), '') AS requested_names,
        COALESCE(SUM(i.quantity), 0) AS requested_qty
      FROM public.tbl_smart_quotation_item i
      GROUP BY i.sq_id, i.category_code
    ),
    -- Ambil response terbaru per (sq_id, category, supplier)
    latest_resp AS (
      SELECT DISTINCT ON (r.sq_id, r.category_code, r.supplier_id)
        r.sq_id, r.category_code, r.supplier_id,
        r.product_name      AS response_product_name,
        r.quantity          AS response_qty,
        r.price             AS response_price,
        r.note              AS response_note,
        r.created_date      AS response_created_date
      FROM public.tbl_smart_quotation_response r
      ORDER BY r.sq_id, r.category_code, r.supplier_id, r.created_date DESC
    )
    SELECT
      b.blast_id,
      b.sq_id,
      sq.customer_id,
      cu.name                         AS customer_name,
      b.area_code,
      ar.area_name,
      b.category_code,
      cat.category_name,
      ic.requested_names,
      ic.requested_qty,
      sq.created_date                 AS sq_created_date,

      lr.response_product_name,
      lr.response_qty,
      lr.response_price,
      lr.response_note,
      lr.response_created_date
    FROM public.tbl_blast b
    JOIN public.tbl_smart_quotation sq ON sq.sq_id = b.sq_id
    JOIN public.tbl_user cu            ON cu.user_id = sq.customer_id
    JOIN public.tbl_area ar            ON ar.area_code = b.area_code
    JOIN public.tbl_category_product cat ON cat.category_code = b.category_code
    LEFT JOIN items_cat  ic            ON ic.sq_id = b.sq_id AND ic.category_code = b.category_code
    LEFT JOIN latest_resp lr           ON lr.sq_id = b.sq_id AND lr.category_code = b.category_code AND lr.supplier_id = b.supplier_id
    WHERE b.supplier_id = $1
    ORDER BY b.created_date DESC, b.blast_id DESC;
    `,
    [supplierId]
  );

  return NextResponse.json(rows);
}
