import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// GET /api/master/supplier-areas?supplier_id=sup001
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplier_id");
  if (!supplierId) {
    return NextResponse.json({ error: "missing supplier_id" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    SELECT
      sa.supplier_id,
      sa.area_code,
      a.area_name
    FROM public.tbl_supplier_area sa
    JOIN public.tbl_area a ON a.area_code = sa.area_code
    WHERE sa.supplier_id = $1
    ORDER BY a.area_name;
    `,
    [supplierId]
  );

  // bentuk: [{area_code: 31, area_name: 'DKI Jakarta'}, ...]
  return NextResponse.json(rows.map(r => ({
    area_code: r.area_code,
    area_name: r.area_name,
  })));
}
