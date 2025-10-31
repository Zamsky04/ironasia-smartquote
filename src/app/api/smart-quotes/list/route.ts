import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// GET /api/smart-quotes/list?customer_id=cus001
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
            'product_id', i.product_id,
            'product_name', p.name,
            'category_id', p.category_code,
            'category_name', cp.category_name,
            'sub_category_id', p.subcategory_code,
            'sub_category_name', sp.subcategory_name,
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
    LEFT JOIN public.tbl_products p ON p.product_id = i.product_id
    LEFT JOIN public.tbl_category_product cp ON cp.category_code = p.category_code
    LEFT JOIN public.tbl_subcategory_product sp ON sp.subcategory_code = p.subcategory_code
    LEFT JOIN public.tbl_user u ON u.user_id = sq.customer_id
    WHERE ($1::text IS NULL OR sq.customer_id = $1::text)
    GROUP BY sq.sq_id, u.name
    ORDER BY sq.created_date DESC;
    `,
    [customerId]
  );

  return NextResponse.json(result.rows);
}
