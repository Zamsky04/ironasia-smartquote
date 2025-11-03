import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const pool = getPool();
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id");

  const result = await pool.query(
    `
    SELECT
      sq.sq_id,
      sq.customer_id,
      u.name AS customer_name,
      sq.area_code,
      sq.status,
      sq.created_date,
      COALESCE(
        json_agg(
          json_build_object(
            'item_id', i.item_id,
            'category_id', i.category_code,
            'category_name', cp.category_name,
            'product_name', i.product_name,
            'size', i.size,
            'quantity', i.quantity,
            'note', i.note,
            'status', i.status
          )
        ) FILTER (WHERE i.item_id IS NOT NULL),
        '[]'
      ) AS items
    FROM public.tbl_smart_quotation sq
    LEFT JOIN public.tbl_smart_quotation_item i ON i.sq_id = sq.sq_id
    LEFT JOIN public.tbl_category_product cp ON cp.category_code = i.category_code
    LEFT JOIN public.tbl_user u ON u.user_id = sq.customer_id
    WHERE ($1::text IS NULL OR sq.customer_id = $1::text)
    GROUP BY sq.sq_id, u.name
    ORDER BY sq.created_date DESC;
    `,
    [customerId]
  );

  return NextResponse.json(result.rows);
}
