// app/api/smart-quotes/responses/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function POST(req: Request) {
  const pool = getPool();
  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const {
    item_id,              // WAJIB
    supplier_id,          // WAJIB
    product_name,         // WAJIB
    quantity,             // WAJIB > 0
    price,                // WAJIB > 0
    note,                 // opsional
    area_code,            // opsional (kalau tak dikirim, ambil dari blast)
    created_by,           // opsional
  } = body || {};

  if (!item_id || !supplier_id || !product_name || !quantity || !price) {
    return NextResponse.json({ error: "missing field" }, { status: 400 });
  }
  if (Number(quantity) <= 0 || Number(price) <= 0) {
    return NextResponse.json({ error: "invalid qty/price" }, { status: 400 });
  }

  // 1) Ambil konteks dari ITEM (untuk customer_id & category_code)
  const qItem = await pool.query(
    `
    SELECT i.item_id, i.sq_id, i.category_code, sq.customer_id
    FROM public.tbl_smart_quotation_item i
    JOIN public.tbl_smart_quotation sq ON sq.sq_id = i.sq_id
    WHERE i.item_id = $1
    `,
    [Number(item_id)]
  );
  if (!qItem.rowCount) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }
  const ctx = qItem.rows[0] as {
    item_id: number; sq_id: number; category_code: number; customer_id: string;
  };

  // 2) Tentukan area_code:
  //    - pakai body jika ada
  //    - jika kosong, ambil dari blast (item_id + supplier_id)
  let useArea: number | null = Number.isFinite(Number(area_code)) ? Number(area_code) : null;
  if (useArea === null) {
    const qBlast = await pool.query(
      `SELECT area_code
         FROM public.tbl_blast
        WHERE item_id=$1 AND supplier_id=$2
        ORDER BY created_date DESC, blast_id DESC
        LIMIT 1`,
      [Number(item_id), String(supplier_id)]
    );
    if (!qBlast.rowCount) {
      return NextResponse.json({ error: "forbidden: no blast for this supplier/item" }, { status: 403 });
    }
    useArea = Number(qBlast.rows[0].area_code);
  }

  // 3) Insert sesuai kolom yang ADA di tabel response (tanpa sq_id)
  const ins = await pool.query(
    `
    INSERT INTO public.tbl_smart_quotation_response
      (item_id, customer_id, area_code, category_code,
       supplier_id, product_name, quantity, price, note, created_by)
    VALUES
      ($1,      $2,          $3,        $4,
       $5,         $6,           $7,      $8,   $9,    $10)
    RETURNING item_id
    `,
    [
      Number(item_id),
      String(ctx.customer_id),
      Number(useArea),
      Number(ctx.category_code),

      String(supplier_id),
      String(product_name).trim(),
      Number(quantity),
      Number(price),
      note ?? null,
      created_by || String(supplier_id),
    ]
  );

  return NextResponse.json({ ok: true, item_id: ins.rows[0]?.item_id ?? Number(item_id) });
}
