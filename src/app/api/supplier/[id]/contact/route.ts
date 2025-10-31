import { NextResponse } from "next/server";
import { getPool } from "@/app/lib/db";

// ✅ di Next 15, params adalah Promise => harus di-await
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;               // ⬅️ penting
  const supplierId = String(id || "").trim();
  if (!supplierId) {
    return NextResponse.json({ error: "missing supplier_id" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    SELECT user_id, name, email, phone_number, address
    FROM public.tbl_user
    WHERE user_id = $1 AND role = 'business'
    LIMIT 1
    `,
    [supplierId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "supplier not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
