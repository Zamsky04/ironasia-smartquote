import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// GET /api/smart-quotes/:id → header + items (dengan NAMA, bukan kode)
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const sqid = Number(id);

  if (!Number.isFinite(sqid)) {
    return NextResponse.json({ error: "invalid sq_id" }, { status: 400 });
  }

  const pool = getPool();

  try {
    // --- Header ---
    const hdr = await pool.query(
      `SELECT sq_id, customer_id, area_code, status, created_by, created_date, updated_by, updated_date
         FROM public.tbl_smart_quotation
        WHERE sq_id = $1`,
      [sqid]
    );
    if (hdr.rowCount === 0) {
      return NextResponse.json({ error: "Smart Quote not found" }, { status: 404 });
    }

    // --- Items dengan NAMA (coba skema master dulu) ---
    let itemsRows: any[] | null = null;

    try {
      const qMaster = await pool.query(
        `
        SELECT
          i.item_id,
          i.sq_id,
          i.product_id,
          p.product_name,
          i.category_code                 AS category_id,
          c.category_name                 AS category_name,
          i.subcategory_code              AS sub_category_id,
          s.subcategory_name              AS sub_category_name,
          i.size,
          i.quantity,
          i.note,
          i.status,
          i.created_by, i.created_date, i.updated_by, i.updated_date
        FROM public.tbl_smart_quotation_item i
        JOIN public.tbl_products             p ON p.product_id      = i.product_id
        LEFT JOIN master.tbl_category_product c ON c.category_code  = i.category_code
        LEFT JOIN master.tbl_subcategory_product s ON s.subcategory_code = i.subcategory_code
        WHERE i.sq_id = $1
        ORDER BY i.item_id ASC
        `,
        [sqid]
      );
      itemsRows = qMaster.rows;
    } catch (e) {
      // Jika skema master tidak ada, fallback ke public.*
      const qPublic = await pool.query(
        `
        SELECT
          i.item_id,
          i.sq_id,
          i.product_id,
          p.product_name,
          i.category_code                 AS category_id,
          c.category_name                 AS category_name,
          i.subcategory_code              AS sub_category_id,
          s.subcategory_name              AS sub_category_name,
          i.size,
          i.quantity,
          i.note,
          i.status,
          i.created_by, i.created_date, i.updated_by, i.updated_date
        FROM public.tbl_smart_quotation_item i
        JOIN public.tbl_products             p ON p.product_id      = i.product_id
        LEFT JOIN public.tbl_category_product c ON c.category_code  = i.category_code
        LEFT JOIN public.tbl_subcategory_product s ON s.subcategory_code = i.subcategory_code
        WHERE i.sq_id = $1
        ORDER BY i.item_id ASC
        `,
        [sqid]
      );
      itemsRows = qPublic.rows;
    }

    // Safety fallback (harusnya tidak kepakai kalau join sukses)
    if (!itemsRows) itemsRows = [];

    return NextResponse.json({
      ...hdr.rows[0],
      items: itemsRows,
    });
  } catch (err: any) {
    console.error("GET SQ detail error:", err?.message || err);
    return NextResponse.json(
      { error: "failed to get SQ", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
