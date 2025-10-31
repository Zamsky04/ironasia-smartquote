import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

/**
 * Ambil ranking hasil dari responses supplier.
 * - Start dari tbl_smart_quotation_response (r)
 * - Join ke item (i) untuk bandingkan quantity
 * - Filter hanya berdasarkan customer_id (tanpa cek status)
 * - Poin:
 *   - qty_point = 1 jika r.quantity = i.quantity, selain itu 0
 *   - price_point = 1 untuk harga termurah di grup (sq_id, product_id) di antara yang qty_point=1
 *   - total_point = qty_point + price_point
 * - Rank per (sq_id, product_id) -> ambil 3 teratas
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id");
  if (!customerId) {
    return NextResponse.json({ error: "missing customer_id" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    WITH base AS (
      SELECT
        r.sq_id,
        r.product_id,
        r.supplier_id,
        COALESCE(sup.name, r.supplier_id)     AS supplier_name,
        i.quantity                             AS req_qty,    -- dari item
        r.quantity                             AS resp_qty,   -- dari response
        r.price,
        CASE WHEN r.quantity = i.quantity THEN 1 ELSE 0 END   AS qty_point
      FROM public.tbl_smart_quotation_response r
      JOIN public.tbl_smart_quotation sq
        ON sq.sq_id = r.sq_id
      JOIN public.tbl_smart_quotation_item i
        ON i.sq_id = r.sq_id AND i.product_id = r.product_id
      LEFT JOIN public.tbl_user sup
        ON sup.user_id = r.supplier_id
      WHERE sq.customer_id = $1
    ),
    with_min AS (
      SELECT
        b.*,
        MIN(b.price) FILTER (WHERE b.qty_point = 1)
          OVER (PARTITION BY b.sq_id, b.product_id) AS min_price_match
      FROM base b
    ),
    scored AS (
      SELECT
        *,
        CASE WHEN qty_point = 1 AND price = min_price_match THEN 1 ELSE 0 END AS price_point,
        (qty_point + CASE WHEN qty_point = 1 AND price = min_price_match THEN 1 ELSE 0 END) AS total_point,
        ROW_NUMBER() OVER (
          PARTITION BY sq_id, product_id
          ORDER BY
            (qty_point + CASE WHEN qty_point = 1 AND price = min_price_match THEN 1 ELSE 0 END) DESC,
            price ASC,
            supplier_id ASC
        ) AS rank_no
      FROM with_min
    )
    SELECT
      s.sq_id,
      s.product_id,
      COALESCE(p.name, s.product_id)          AS product_name,
      s.supplier_id,
      s.supplier_name,
      s.req_qty,
      s.resp_qty,
      s.price,
      s.qty_point,
      s.price_point,
      s.total_point,
      s.rank_no
    FROM scored s
    LEFT JOIN public.tbl_products p ON p.product_id = s.product_id
    WHERE s.rank_no <= 3
    ORDER BY s.sq_id, s.product_id, s.rank_no;
    `,
    [customerId]
  );

  return NextResponse.json(rows);
}
