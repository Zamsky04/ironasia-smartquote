import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// GET /api/supplier/inbox?supplier_id=sup001
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplier_id");
  if (!supplierId) {
    return NextResponse.json({ error: "missing supplier_id" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    -- Ambil 1 item (requested_qty) per (sq_id, product_id): yang terbaru (item_id paling besar)
    WITH latest_item AS (
      SELECT DISTINCT ON (i.sq_id, i.product_id)
        i.sq_id,
        i.product_id,
        i.quantity AS requested_qty
      FROM public.tbl_smart_quotation_item i
      ORDER BY i.sq_id, i.product_id, i.item_id DESC
    ),
    -- Ambil 1 response terbaru per (sq_id, product_id, supplier_id)
    latest_resp AS (
      SELECT DISTINCT ON (sr.sq_id, sr.product_id, sr.supplier_id)
        sr.sq_id,
        sr.product_id,
        sr.supplier_id,
        sr.quantity     AS response_qty,
        sr.price        AS response_price,
        sr.created_date AS response_created_date
      FROM public.tbl_smart_quotation_response sr
      ORDER BY sr.sq_id, sr.product_id, sr.supplier_id, sr.created_date DESC
    )
    SELECT
      b.blast_id,
      b.sq_id,
      sq.customer_id,
      cu.name                        AS customer_name,
      b.area_code,
      ar.area_name,
      b.product_id,
      p.name                         AS product_name,
      li.requested_qty,
      sq.created_date                AS sq_created_date,
      lr.response_qty,
      lr.response_price,
      NULL::text                     AS response_note,
      lr.response_created_date
    FROM public.tbl_blast b
    JOIN public.tbl_smart_quotation sq ON sq.sq_id = b.sq_id
    JOIN public.tbl_user cu            ON cu.user_id = sq.customer_id
    JOIN public.tbl_area ar            ON ar.area_code = b.area_code
    JOIN public.tbl_products p         ON p.product_id = b.product_id
    LEFT JOIN latest_item  li          ON li.sq_id = b.sq_id AND li.product_id = b.product_id
    LEFT JOIN latest_resp  lr          ON lr.sq_id = b.sq_id AND lr.product_id = b.product_id AND lr.supplier_id = b.supplier_id
    WHERE b.supplier_id = $1
    ORDER BY b.created_date DESC, b.blast_id DESC;
    `,
    [supplierId]
  );

  return NextResponse.json(rows);
}
