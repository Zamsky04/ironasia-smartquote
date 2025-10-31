// ✅ File: src/app/api/smart-quotes/[id]/items/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

/*
  ✅ Perbaikan:
  - Menambahkan `const { id } = await params;` karena `params` adalah Promise (Next.js 14+)
  - sq_id diambil dari URL dan digunakan langsung di INSERT
  - Validasi header SQ
  - Insert manual ke tbl_smart_quotation_item (join ke tbl_products)
  - Transaksi BEGIN/COMMIT dengan rollback aman
*/
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // 🟢 FIX utamanya (params adalah Promise)
  const sqid = Number(id);

  if (!Number.isFinite(sqid)) {
    return NextResponse.json({ error: "invalid sq_id" }, { status: 400 });
  }

  const { product_id, size, quantity, note, created_by } = await req.json();
  if (!product_id || !quantity) {
    return NextResponse.json({ error: "missing field" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🟢 Pastikan SQ Header ada
    const hdr = await client.query(
      `SELECT 1 FROM public.tbl_smart_quotation WHERE sq_id = $1`,
      [sqid]
    );
    if (hdr.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "SQ header not found" }, { status: 404 });
    }

    // 🟢 Insert item langsung (join produk → category/subcategory)
    const ins = await client.query(
      `
      INSERT INTO public.tbl_smart_quotation_item (
        sq_id, product_id, category_code, subcategory_code,
        size, quantity, note, status, created_by
      )
      SELECT
        $1, p.product_id, p.category_code, p.subcategory_code,
        $3, $4, $5, 'wait for approval', $6
      FROM public.tbl_products p
      WHERE p.product_id = $2
      RETURNING item_id, sq_id, product_id, size, quantity, note, status;
      `,
      [sqid, product_id, size || null, Number(quantity), note || null, created_by || "system"]
    );

    if (ins.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "product not found" }, { status: 400 });
    }

    await client.query("COMMIT");
    return NextResponse.json({ message: "item added", item: ins.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add item error:", err);
    return NextResponse.json({ error: "failed to add item" }, { status: 500 });
  } finally {
    client.release();
  }
}
