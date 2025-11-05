// /api/blast/route.ts
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
      b.blast_id,
      i.sq_id,
      i.item_id,
      i.category_code,
      cat.category_name,
      i.product_name,
      i.size,
      i.unit_id,
      un.unit_name,
      i.quantity        AS requested_qty,
      i.note            AS requested_note,   -- ⬅️ NOTE PER ITEM
      b.area_code,
      ar.area_name,
      b.supplier_id,
      su.name           AS supplier_name,
      b.created_date
    FROM public.tbl_blast b
    JOIN public.tbl_smart_quotation_item i ON i.item_id = b.item_id
    JOIN public.tbl_category_product cat   ON cat.category_code = i.category_code
    JOIN public.tbl_unit un                ON un.unit_id = i.unit_id
    JOIN public.tbl_area ar                ON ar.area_code = b.area_code
    JOIN public.tbl_user su                ON su.user_id = b.supplier_id
    WHERE ($1::int  IS NULL OR i.sq_id = $1::int)
      AND ($2::text IS NULL OR b.supplier_id = $2::text)
    ORDER BY b.created_date DESC, b.blast_id DESC
    `,
    [sqId, supplierId]
  );

  return NextResponse.json(rows);
}
