import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id");
  if (!customerId) {
    return NextResponse.json({ error: "missing customer_id" }, { status: 400 });
  }

  const rawTop = searchParams.get("top");
  const parsedTop = rawTop ? Number(rawTop) : NaN;
  const allowed = [3, 10];
  const useTop = Number.isFinite(parsedTop) && allowed.includes(parsedTop) ? parsedTop : null;

  const whereRank = useTop ? "WHERE s.rank_no <= $2" : "";
  const params: any[] = [customerId];
  if (useTop) params.push(useTop);

  const sql = `
    /* === Group item per (sq, category, product_name_norm) === */
    WITH item_group AS (
      SELECT
        i.sq_id,
        i.category_code,
        LOWER(TRIM(i.product_name))      AS req_name_norm,
        MIN(i.product_name)              AS req_product_name,
        SUM(i.quantity)                  AS req_total_qty
      FROM public.tbl_smart_quotation_item i
      GROUP BY i.sq_id, i.category_code, LOWER(TRIM(i.product_name))
    ),
    /* === Ambil response supplier utk customer ini (bawa area) === */
    resp AS (
      SELECT
        r.sq_id,
        r.area_code,
        a.area_name,
        r.category_code,
        r.product_name                    AS resp_product_name,
        LOWER(TRIM(r.product_name))       AS resp_name_norm,
        r.supplier_id,
        COALESCE(u.name, r.supplier_id)   AS supplier_name,
        r.quantity                        AS resp_qty,
        r.price
      FROM public.tbl_smart_quotation_response r
      JOIN public.tbl_smart_quotation sq ON sq.sq_id = r.sq_id
      LEFT JOIN public.tbl_user u        ON u.user_id = r.supplier_id
      LEFT JOIN public.tbl_area a        ON a.area_code = r.area_code
      WHERE sq.customer_id = $1
    ),
    /* === Flag: apakah nama resp cocok dgn item_group === */
    resp_flag AS (
      SELECT r.*,
             EXISTS (
               SELECT 1 FROM item_group ig
                WHERE ig.sq_id = r.sq_id
                  AND ig.category_code = r.category_code
                  AND ig.req_name_norm = r.resp_name_norm
             ) AS has_match
      FROM resp r
    ),
    /* === Lampirkan response ke grup item, per AREA === */
    attached AS (
      SELECT
        ig.sq_id,
        r.area_code,
        r.area_name,
        ig.category_code,
        ig.req_product_name,
        ig.req_name_norm,
        ig.req_total_qty         AS req_qty,

        r.supplier_id,
        r.supplier_name,
        r.resp_product_name,
        r.resp_name_norm,
        r.resp_qty,
        r.price,

        (r.resp_name_norm = ig.req_name_norm) AS name_matched
      FROM resp_flag r
      JOIN item_group ig
        ON ig.sq_id = r.sq_id
       AND ig.category_code = r.category_code
      WHERE (r.has_match = FALSE) OR (r.resp_name_norm = ig.req_name_norm)
    ),
    /* === Cari min price untuk yang match & qty pas, per AREA === */
    with_min AS (
      SELECT
        a.*,
        MIN(a.price) FILTER (
          WHERE a.name_matched = TRUE AND a.resp_qty = a.req_qty
        ) OVER (PARTITION BY a.sq_id, a.area_code, a.category_code, a.req_product_name) AS min_price_match
      FROM attached a
    ),
    /* === Skoring + Ranking per AREA === */
    scored AS (
      SELECT
        *,
        CASE WHEN name_matched = TRUE AND resp_qty = req_qty THEN 1 ELSE 0 END AS qty_point,
        CASE WHEN name_matched = TRUE AND resp_qty = req_qty AND price = min_price_match THEN 1 ELSE 0 END AS price_point,
        (
          CASE WHEN name_matched = TRUE AND resp_qty = req_qty THEN 1 ELSE 0 END +
          CASE WHEN name_matched = TRUE AND resp_qty = req_qty AND price = min_price_match THEN 1 ELSE 0 END
        ) AS total_point,
        ROW_NUMBER() OVER (
          PARTITION BY sq_id, area_code, category_code, req_product_name
          ORDER BY
            (
              CASE WHEN name_matched = TRUE AND resp_qty = req_qty THEN 1 ELSE 0 END +
              CASE WHEN name_matched = TRUE AND resp_qty = req_qty AND price = min_price_match THEN 1 ELSE 0 END
            ) DESC,
            price ASC,
            supplier_id ASC
        ) AS rank_no
      FROM with_min
    )
    SELECT
      s.sq_id,
      s.area_code,
      s.area_name,
      s.category_code,
      s.req_product_name        AS product_name,
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
      s.name_matched
    FROM scored s
    ${whereRank}
    ORDER BY s.sq_id, s.area_code, s.category_code, s.req_product_name, s.rank_no;
  `;

  const pool = getPool();
  const { rows } = await pool.query(sql, params);
  return NextResponse.json(rows);
}
