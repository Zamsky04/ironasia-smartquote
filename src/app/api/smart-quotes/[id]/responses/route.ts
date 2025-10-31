// import { NextResponse } from 'next/server';
// import { getPool } from '@/app/lib/db';

// ❌ yang salah (sebelumnya):
// export async function GET(_req: Request, { params }: { params: { id: string } }) {
//   const sqId = Number(params.id);

// ✅ yang benar (Next.js 15 / App Router baru):
// type Ctx = { params: Promise<{ id: string }> };

// export async function GET(_req: Request, ctx: Ctx) {
//   const { id } = await ctx.params;        // <-- UNWRAP PROMISE
//   const sqId = Number(id);
//   if (Number.isNaN(sqId)) {
//     return NextResponse.json({ error: 'invalid id' }, { status: 400 });
//   }

//   const sql = `
//     SELECT r.sqr_id, r.sq_id, r.supplier_id, u.name AS supplier_name,
//            r.product_id, p.name AS product_name, r.quantity, r.price, r.get_contact, r.created_date
//     FROM tbl_smart_quotation_response r
//     LEFT JOIN tbl_products p ON p.product_id = r.product_id
//     LEFT JOIN tbl_user u ON u.user_id = r.supplier_id
//     WHERE r.sq_id = $1
//     ORDER BY r.price ASC
//   `;

//   const { rows } = await getPool().query(sql, [sqId]);
//   return NextResponse.json(rows);
// }
