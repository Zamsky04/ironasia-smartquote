import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sqId = searchParams.get("sq_id");
  const supplierId = searchParams.get("supplier_id");

  const pool = getPool();
  const { rows } = await pool.query(
    `
    SELECT
      b.blast_id, b.sq_id,
      b.area_code, a.area_name,
      b.category_code, c.category_name,
      b.supplier_id, u.name AS supplier_name,
      b.created_date
    FROM public.tbl_blast b
    JOIN public.tbl_area a ON a.area_code = b.area_code
    JOIN public.tbl_category_product c ON c.category_code = b.category_code
    JOIN public.tbl_user u ON u.user_id = b.supplier_id
    WHERE ($1::int  IS NULL OR b.sq_id = $1::int)
      AND ($2::text IS NULL OR b.supplier_id = $2::text)
    ORDER BY b.created_date DESC, b.blast_id DESC
    `,
    [sqId, supplierId]
  );

  return NextResponse.json(rows);
}
