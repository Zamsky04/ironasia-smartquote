import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id");
  const itemIdRaw = searchParams.get("item_id");
  if (!customerId) return NextResponse.json({ error: "missing customer_id" }, { status: 400 });

  const rawTop = searchParams.get("top");
  const parsedTop = rawTop ? Number(rawTop) : NaN;
  const allowed = [3, 10];
  const useTop = Number.isFinite(parsedTop) && allowed.includes(parsedTop) ? parsedTop : null;

  const params: any[] = [customerId];
  let itemFilter = "";
  if (itemIdRaw) {
    params.push(Number(itemIdRaw));
    itemFilter = `AND i.item_id = $2::int`;
  }
  const topParamIndex = itemIdRaw ? 3 : 2;
  const whereRank = useTop ? `WHERE s.rank_no <= $${topParamIndex}::int` : "";

  const sql = `
    WITH req AS (
      SELECT
        i.item_id,
        i.sq_id,
        i.category_code,
        i.product_name                   AS req_product_name,
        LOWER(TRIM(i.product_name))      AS req_name_norm,
        i.quantity                       AS req_qty,
        i.note                           AS req_note
      FROM public.tbl_smart_quotation_item i
      JOIN public.tbl_smart_quotation sq ON sq.sq_id = i.sq_id
      WHERE sq.customer_id = $1::text
      ${itemFilter}
    ),

    resp AS (
      SELECT
        r.item_id,
        r.area_code,
        a.area_name,
        r.category_code,
        r.product_name                   AS resp_product_name,
        LOWER(TRIM(r.product_name))      AS resp_name_norm,
        r.supplier_id,
        COALESCE(u.name, r.supplier_id)  AS supplier_name,
        r.quantity                       AS resp_qty,
        r.price,
        r.note                           AS resp_note
      FROM public.tbl_smart_quotation_response r
      JOIN req q ON q.item_id = r.item_id
      LEFT JOIN public.tbl_user u ON u.user_id = r.supplier_id
      LEFT JOIN public.tbl_area a ON a.area_code = r.area_code
    ),

    joined AS (
      SELECT
        q.item_id, q.sq_id, q.category_code,
        q.req_product_name, q.req_name_norm, q.req_qty, q.req_note,
        r.area_code, r.area_name,
        r.supplier_id, r.supplier_name,
        r.resp_product_name, r.resp_name_norm, r.resp_qty, r.price,
        r.resp_note,
        (r.resp_name_norm = q.req_name_norm) AS name_matched
      FROM req q
      JOIN resp r ON r.item_id = q.item_id
    ),

    with_min AS (
      SELECT
        j.*,
        MIN(j.price) FILTER (WHERE j.name_matched = TRUE AND j.resp_qty = j.req_qty)
          OVER (PARTITION BY j.item_id, j.area_code) AS min_price_match
      FROM joined j
    ),

    scored AS (
      SELECT
        w.*,

        -- Poin kuantitas: 1 jika nama cocok & qty pas
        CASE WHEN w.name_matched = TRUE AND w.resp_qty = w.req_qty THEN 1 ELSE 0 END AS qty_point,

        -- Poin harga: 1 jika kandidat exact match dan harganya sama dengan min price exact match
        CASE
          WHEN w.name_matched = TRUE AND w.resp_qty = w.req_qty AND w.price = w.min_price_match THEN 1
          ELSE 0
        END AS price_point,

        -- Total poin
        (
          CASE WHEN w.name_matched = TRUE AND w.resp_qty = w.req_qty THEN 1 ELSE 0 END +
          CASE WHEN w.name_matched = TRUE AND w.resp_qty = w.req_qty AND w.price = w.min_price_match THEN 1 ELSE 0 END
        ) AS total_point,

        -- Bucket untuk urutan ranking
        CASE
          WHEN w.name_matched = TRUE AND w.resp_qty = w.req_qty THEN 0
          WHEN w.name_matched = TRUE THEN 1
          ELSE 2
        END AS rank_bucket,

        ROW_NUMBER() OVER (
          PARTITION BY w.item_id, w.area_code
          ORDER BY
            -- 1) exact match (nama & qty) dulu
            CASE
              WHEN w.name_matched = TRUE AND w.resp_qty = w.req_qty THEN 0
              WHEN w.name_matched = TRUE THEN 1
              ELSE 2
            END ASC,
            -- 2) dalam exact match: harga termurah menang
            w.price ASC,
            -- 3) tie breaker stabil
            w.supplier_id ASC
        ) AS rank_no
      FROM with_min w
    )

    SELECT
      s.item_id,
      s.sq_id,
      s.area_code,
      s.area_name,
      s.category_code,
      s.req_product_name AS product_name,
      s.req_note,
      s.supplier_id,
      s.supplier_name,
      s.req_qty,
      s.resp_qty,
      s.price,
      s.qty_point,
      s.price_point,
      s.total_point,
      s.rank_no,
      s.resp_product_name,
      s.name_matched,
      s.resp_note
    FROM scored s
    ${whereRank}
    ORDER BY s.item_id, s.area_code, s.rank_no;
  `;

  const pool = getPool();
  const qParams = useTop ? [...params, useTop] : params;
  const { rows } = await pool.query(sql, qParams);
  return NextResponse.json(rows);
}
