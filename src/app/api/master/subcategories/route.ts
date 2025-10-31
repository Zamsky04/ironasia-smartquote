import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category_id");

  const pool = getPool();
  const { rows } = await pool.query(
    `
    SELECT
      subcategory_code AS sub_category_id,
      subcategory_name AS sub_category_name,
      category_code
    FROM public.tbl_subcategory_product
    WHERE ($1::int IS NULL OR category_code = $1::int)
    ORDER BY subcategory_name;
    `,
    [categoryId ? parseInt(categoryId) : null]
  );
  return NextResponse.json(rows);
}