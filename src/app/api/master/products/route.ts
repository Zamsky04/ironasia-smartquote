import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category_id");
  const subCategoryId = searchParams.get("sub_category_id");

  const pool = getPool();

  // ❗ Tidak ada filter area di sini. Area dipakai saat blast saja.
  const { rows } = await pool.query(
    `
    SELECT DISTINCT ON (LOWER(p.name))
      p.product_id,
      p.name AS product_name,
      p.category_code AS category_id,
      p.subcategory_code AS sub_category_id
    FROM public.tbl_products p
    WHERE ($1::int IS NULL OR p.category_code = $1::int)
      AND ($2::int IS NULL OR p.subcategory_code = $2::int)
    -- DISTINCT ON butuh ORDER BY dengan key yg sama di depan
    ORDER BY LOWER(p.name), p.product_id;
    `,
    [categoryId ? parseInt(categoryId) : null, subCategoryId ? parseInt(subCategoryId) : null]
  );

  return NextResponse.json(rows);
}
