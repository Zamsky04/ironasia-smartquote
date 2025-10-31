import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// GET /api/master/stocks?supplier_id=sup001&product_id=prd001&area_code=31
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplier_id");
  const productId  = searchParams.get("product_id");
  const areaCode   = searchParams.get("area_code");
  const limit  = Math.min(Math.max(parseInt(searchParams.get("limit")  || "200", 10), 1), 1000);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0",   10), 0);

  const pool = getPool();
  const { rows } = await pool.query(
    `
    WITH supplier_areas AS (
      SELECT
        sa.supplier_id,
        ARRAY_AGG(DISTINCT a.area_code) AS supplier_area_codes,
        ARRAY_AGG(DISTINCT a.area_name) AS supplier_area_names
      FROM public.tbl_supplier_area sa
      JOIN public.tbl_area a ON a.area_code = sa.area_code
      GROUP BY sa.supplier_id
    )
    SELECT
      s.*,                                  -- semua kolom stok, aman karena TIDAK pakai GROUP BY
      u.name                  AS supplier_name,
      p.name                  AS product_name,
      p.category_code,
      cp.category_name,
      p.subcategory_code,
      sp.subcategory_name,
      COALESCE(sa2.supplier_area_codes, '{}'::int[])   AS supplier_area_codes,
      COALESCE(sa2.supplier_area_names, '{}'::text[])  AS supplier_area_names
    FROM public.tbl_stok s
    JOIN public.tbl_user u               ON u.user_id = s.supplier_id
    JOIN public.tbl_products p           ON p.product_id = s.product_id
    LEFT JOIN public.tbl_category_product    cp ON cp.category_code = p.category_code
    LEFT JOIN public.tbl_subcategory_product sp ON sp.subcategory_code = p.subcategory_code
    LEFT JOIN supplier_areas sa2          ON sa2.supplier_id = s.supplier_id
    WHERE ($1::text IS NULL OR s.supplier_id = $1::text)
      AND ($2::text IS NULL OR s.product_id  = $2::text)
      AND (
        $3::int IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.tbl_supplier_area sa3
          WHERE sa3.supplier_id = s.supplier_id
            AND sa3.area_code   = $3::int
        )
      )
    ORDER BY u.name, p.name
    LIMIT $4 OFFSET $5
    `,
    [supplierId || null, productId || null, areaCode ? parseInt(areaCode, 10) : null, limit, offset]
  );

  return NextResponse.json(rows);
}
