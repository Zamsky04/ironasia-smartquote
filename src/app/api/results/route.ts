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
    WITH item_group AS (
      SELECT
        i.sq_id,
        i.category_code,
        LOWER(TRIM(i.product_name)) AS req_name_norm,
        MIN(i.product_name)         AS req_product_name,
        SUM(i.quantity)             AS req_total_qty
      FROM public.tbl_smart_quotation_item i
      GROUP BY i.sq_id, i.category_code, LOWER(TRIM(i.product_name))
    ),
    resp AS (
      SELECT
        r.sq_id,
        r.category_code,
        r.product_name              AS resp_product_name,
        LOWER(TRIM(r.product_name)) AS resp_name_norm,
        r.supplier_id,
        COALESCE(u.name, r.supplier_id) AS supplier_name,
        r.quantity                  AS resp_qty,
        r.price
      FROM public.tbl_smart_quotation_response r
      JOIN public.tbl_smart_quotation sq ON sq.sq_id = r.sq_id
      LEFT JOIN public.tbl_user u        ON u.user_id = r.supplier_id
      WHERE sq.customer_id = $1
    ),
    resp_flag AS (
      -- tandai apakah suatu response punya pasangan nama di item_group
      SELECT r.*,
            EXISTS (
              SELECT 1 FROM item_group ig
              WHERE ig.sq_id = r.sq_id
                AND ig.category_code = r.category_code
                AND ig.req_name_norm = r.resp_name_norm
            ) AS has_match
      FROM resp r
    ),
    attached AS (
      /* 
        Lampirkan response ke grup item:
        - jika punya pasangan nama → hanya ke grup yang sama namanya
        - jika tidak punya pasangan → tempel ke SEMUA grup pada kategori tsb
      */
      SELECT
        ig.sq_id,
        ig.category_code,
        ig.req_product_name,
        ig.req_name_norm,
        ig.req_total_qty       AS req_qty,

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
    with_min AS (
      SELECT
        a.*,
        MIN(a.price) FILTER (WHERE a.name_matched = TRUE AND a.resp_qty = a.req_qty)
          OVER (PARTITION BY a.sq_id, a.category_code, a.req_product_name) AS min_price_match
      FROM attached a
    ),
    scored AS (
      SELECT
        *,
        /* qty_point hanya untuk yang namanya match dan qty pas */
        CASE WHEN name_matched = TRUE AND resp_qty = req_qty THEN 1 ELSE 0 END                      AS qty_point,
        CASE WHEN name_matched = TRUE AND resp_qty = req_qty AND price = min_price_match THEN 1 ELSE 0 END AS price_point,
        (
          CASE WHEN name_matched = TRUE AND resp_qty = req_qty THEN 1 ELSE 0 END +
          CASE WHEN name_matched = TRUE AND resp_qty = req_qty AND price = min_price_match THEN 1 ELSE 0 END
        ) AS total_point,
        ROW_NUMBER() OVER (
          PARTITION BY sq_id, category_code, req_product_name
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
      s.category_code,
      s.req_product_name        AS product_name,     -- HEADER = nama yang DIMINTA
      s.supplier_id,
      s.supplier_name,
      s.req_qty,
      s.resp_qty,
      s.price,
      s.qty_point,
      s.price_point,
      s.total_point,
      s.rank_no,
      s.resp_product_name,                           -- info nama yang ditawarkan supplier
      s.name_matched                                 -- apakah namanya sama?
    FROM scored s
    ${whereRank}
    ORDER BY s.sq_id, s.category_code, s.req_product_name, s.rank_no;
    `;

  const pool = getPool();
  const { rows } = await pool.query(sql, params);
  return NextResponse.json(rows);
}
