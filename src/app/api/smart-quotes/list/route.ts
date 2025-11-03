import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const pool = getPool();
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id");

  const { rows } = await pool.query(
    `
    WITH base AS (
      SELECT sq.sq_id, sq.customer_id, sq.status, sq.created_date
      FROM public.tbl_smart_quotation sq
      WHERE ($1::text IS NULL OR sq.customer_id = $1::text)
    ),
    areas AS (
      SELECT a.sq_id, ARRAY_AGG(DISTINCT a.area_code) AS area_codes
      FROM public.tbl_smart_quotation_area a
      GROUP BY a.sq_id
    ),
    items AS (
      SELECT i.sq_id,
             JSON_AGG(
               DISTINCT JSONB_BUILD_OBJECT(
                 'item_id', i.item_id,
                 'category_id', i.category_code,
                 'category_name', cp.category_name,
                 'product_name', i.product_name,
                 'size', i.size,
                 'unit_id', i.unit_id,
                 'unit_name', un.unit_name,
                 'quantity', i.quantity,
                 'note', i.note,
                 'status', i.status
               )
             )::json AS items
      FROM public.tbl_smart_quotation_item i
      LEFT JOIN public.tbl_category_product cp ON cp.category_code = i.category_code
      LEFT JOIN public.tbl_unit un ON un.unit_id = i.unit_id
      GROUP BY i.sq_id
    )
    SELECT
      b.sq_id,
      b.customer_id,
      u.name AS customer_name,
      COALESCE(ar.area_codes, '{}') AS area_codes,
      b.status,
      b.created_date,
      COALESCE(it.items, '[]') AS items
    FROM base b
    LEFT JOIN areas ar ON ar.sq_id = b.sq_id
    LEFT JOIN items it ON it.sq_id = b.sq_id
    LEFT JOIN public.tbl_user u ON u.user_id = b.customer_id
    ORDER BY b.created_date DESC;
    `,
    [customerId]
  );

  return NextResponse.json(rows);
}
