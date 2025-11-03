"use client";
import React, { useEffect, useMemo, useState } from "react";

/* ===== Types ===== */
type Customer = { id: string; name: string };
type ResultRow = {
  sq_id: number;
  category_code: number;
  product_name: string;          // nama dari Smart Quotation (header/tab)
  supplier_id: string;
  supplier_name: string;
  req_qty: number;
  resp_qty: number;
  price: number;
  qty_point: number;
  price_point: number;
  total_point: number;
  rank_no: number;
  resp_product_name?: string;    // nama yang diketik supplier
  name_matched?: boolean;        // true jika sama dengan product_name
};
type Contact = {
  user_id: string; name: string; email: string; phone_number: string; address: string;
};
type ContactState = { data?: Contact; loading: boolean; reveal: boolean };

type TopMode = 3 | 10 | 'all';

/* ===== Utils ===== */
const keyOf = (sq: number, pid: string, sid: string) => `${sq}|${pid}|${sid}`;
const formatIDR = (n: number) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
const maskBullets = (n = 8) => "•".repeat(n);
const masked = (n = 8) => <span className="tracking-wider">{maskBullets(n)}</span>;
const maskText = (v?: string) => {
  const s = String(v ?? "").trim();
  if (!s) return maskBullets();
  if (s.length <= 4) return maskBullets(6);
  return `${s.slice(0, 1)}${"•".repeat(Math.min(6, s.length - 2))}${s.slice(-1)}`;
};
const mask = (v?: string) => (!v ? "******" : "＊".repeat(Math.max(6, Math.min(12, v.length))));

/* ===== Adaptive Product Picker (tanpa filter Winner/Qty) ===== */
function ProductPicker({
  products, order, active, onChange,
}: {
  products: Record<string, { name: string; items: ResultRow[] }>;
  order: string[];
  active: string;
  onChange: (pid: string) => void;
}) {
  if (order.length <= 5) {
    return (
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pr-6">
          {order.map((p) => {
            const selected = p === active;
            return (
              <button
                key={p}
                onClick={() => onChange(p)}
                aria-pressed={selected}
                className={
                  "px-3 py-1 rounded-full border text-sm whitespace-nowrap transition " +
                  (selected ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white hover:bg-gray-100")
                }
                title={products[p].name}
              >
                {products[p].name} <span className="text-xs text-gray-500">({p})</span>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <select
        value={active}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border bg-white px-2 py-1 text-sm"
        aria-label="Pilih produk"
      >
        {order.map((p) => (
          <option key={p} value={p}>
            {products[p].name} ({p})
          </option>
        ))}
      </select>
      <span className="text-xs text-gray-500">{order.length} products</span>
    </div>
  );
}

export default function ResultSQPage() {
  /* master */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");

  const [top, setTop] = useState<TopMode>(3);

  /* data */
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* kontak + modal */
  const [contacts, setContacts] = useState<Record<string, ContactState>>({});
  const [modal, setModal] = useState<{
    open: boolean; key?: string; sq_id?: number; product_id?: string; supplier_id?: string; title?: string;
  }>({ open: false });

  /* produk aktif per SQ */
  const [selectedProduct, setSelectedProduct] = useState<Record<number, string>>({});

  /* optional: deep link */
  const [bootstrap, setBootstrap] = useState<{ sq?: number; pid?: string; cid?: string } | null>(null);

  /* load customers */
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/master/customers", { cache: "no-store" });
      const raw = await res.json();
      const map = new Map<string, Customer>();
      for (const c of raw) {
        const id = String(c.user_id ?? c.id ?? "").trim();
        const name = String(c.name ?? "").trim();
        if (id && !map.has(id)) map.set(id, { id, name });
      }
      setCustomers(Array.from(map.values()));
      const sp = new URLSearchParams(window.location.search);
      const cid = sp.get("customer_id") || "";
      const sq = sp.get("sq") ? Number(sp.get("sq")) : undefined;
      const pid = sp.get("product_id") || undefined;
      if (cid) setCustomerId(cid);
      setBootstrap({ sq, pid, cid });
    })();
  }, []);

  const loadResults = async (cid: string) => {
    if (!cid) { setRows([]); return; }
    try {
      setErr(null); setLoading(true);

      const url = new URL(`/api/results`, window.location.origin);
      url.searchParams.set("customer_id", cid);
      if (top !== 'all') url.searchParams.set("top", String(top));

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data: ResultRow[] = await res.json();
      const norm = data.map(r => ({
        ...r,
        rank_no: Number(r.rank_no),
        qty_point: Number(r.qty_point),
        price_point: Number(r.price_point),
        total_point: Number(r.total_point),
      }));
      setRows(norm);
      setContacts({}); setModal({ open: false }); setSelectedProduct({});
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat results"); setRows([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (customerId) loadResults(customerId); }, [customerId, top]);

  const sqGroups = useMemo(() => {
    const map = new Map<number, { products: Record<string, { name: string; items: ResultRow[] }>, productOrder: string[] }>();
    for (const r of rows) {
      if (!map.has(r.sq_id)) map.set(r.sq_id, { products: {}, productOrder: [] });
      const g = map.get(r.sq_id)!;
      const productKey = `${r.category_code}|${r.product_name.toLowerCase().trim()}`;
      if (!g.products[productKey]) {
        g.products[productKey] = { name: r.product_name, items: [] };
        g.productOrder.push(productKey);
      }
      g.products[productKey].items.push(r);
    }
    for (const [, g] of map) {
      for (const k of Object.keys(g.products)) {
        g.products[k].items.sort((a, b) => a.rank_no - b.rank_no);
      }
    }
    return map;
  }, [rows]);

  /* default product per SQ */
  useEffect(() => {
    if (sqGroups.size === 0) return;
    setSelectedProduct(prev => {
      const next = { ...prev };
      for (const [sq_id, g] of sqGroups.entries()) {
        if (!next[sq_id]) next[sq_id] = g.productOrder[0];
      }
      return next;
    });
  }, [sqGroups]);

  /* bootstrap deep link */
  useEffect(() => {
    if (!bootstrap || sqGroups.size === 0) return;
    const { sq, pid } = bootstrap;
    if (sq && sqGroups.has(sq)) {
      const g = sqGroups.get(sq)!;
      setSelectedProduct(prev => ({ ...prev, [sq]: pid && g.products[pid] ? pid : g.productOrder[0] }));
      const el = document.getElementById(`sq-${sq}`);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
    setBootstrap(null);
  }, [bootstrap, sqGroups]);

  /* modal contact */
  const openContactModal = async (ctx: { sq_id: number; product_id: string; supplier_id: string; supplier_name: string; }) => {
    const k = keyOf(ctx.sq_id, ctx.product_id, ctx.supplier_id);
    setModal({ open: true, key: k, ...ctx, title: undefined });
    setContacts(prev => ({ ...prev, [k]: prev[k] ?? { loading: true, reveal: false } }));
    if (!contacts[k]?.data) {
      try {
        const res = await fetch(`/api/supplier/${encodeURIComponent(ctx.supplier_id)}/contact`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data: Contact = await res.json();
        setContacts(prev => ({ ...prev, [k]: { ...(prev[k] ?? { reveal:false }), data, loading:false } }));
      } catch {
        setContacts(prev => ({ ...prev, [k]: { ...(prev[k] ?? { reveal:false }), loading:false } }));
      }
    } else {
      setContacts(prev => ({ ...prev, [k]: { ...(prev[k]!), loading:false } }));
    }
  };

  const setReveal = async (checked: boolean) => {
    if (!modal.key) return;
    setContacts(prev => ({ ...prev, [modal.key!]: { ...(prev[modal.key!] ?? {}), reveal: checked } }));
    if (checked && modal.sq_id && modal.product_id && modal.supplier_id) {
      fetch("/api/results/mark-contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sq_id: modal.sq_id, product_id: modal.product_id, supplier_id: modal.supplier_id })
      }).catch(()=>{});
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4">Result Smart Quote</h1>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-gray-700">Customer</label>
          <select
            className="rounded border px-2 py-1 bg-white text-gray-900"
            value={customerId}
            onChange={(e)=>setCustomerId(e.target.value)}
          >
            <option value="">— pilih customer —</option>
            {customers.map((c,i)=>(
              <option key={`${c.id}-${i}`} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>

          {customerId && (
            <button
              onClick={()=>loadResults(customerId)}
              className="ml-2 px-3 py-1 rounded border hover:bg-gray-100 bg-white text-gray-800"
            >
              Refresh
            </button>
          )}

          {/* ⬇️ Filter Top */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-700">Top</span>
            <div className="inline-flex rounded-lg border overflow-hidden">
              {([3,10,'all'] as TopMode[]).map(opt => {
                const selected = top === opt;
                return (
                  <button
                    key={`${opt}`}
                    onClick={()=>setTop(opt)}
                    aria-pressed={selected}
                    className={
                      "px-3 py-1 text-sm transition " +
                      (selected ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-100")
                    }
                  >
                    {opt === 'all' ? 'All' : opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

        {loading && (
          <div className="space-y-3">
            {[...Array(2)].map((_,i)=>(
              <div key={i} className="rounded-xl border p-3">
                <div className="h-4 w-40 bg-gray-200 animate-pulse rounded mb-3" />
                {[...Array(3)].map((__,j)=>(
                  <div key={j} className="h-8 bg-gray-100 animate-pulse rounded mb-2" />
                ))}
              </div>
            ))}
          </div>
        )}

        {!loading && customerId && rows.length===0 && (
          <div className="text-sm text-gray-600">Belum ada response untuk customer ini.</div>
        )}

        <div className="space-y-6">
          {[...sqGroups.keys()].sort((a,b)=>b-a).map(sq_id => {
            const g = sqGroups.get(sq_id)!;
            const pid = selectedProduct[sq_id] ?? g.productOrder[0];
            const current = g.products[pid];

            return (
              <div id={`sq-${sq_id}`} key={sq_id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Header SQ */}
                <div className="px-3 pt-3 flex items-center justify-between">
                  <div className="font-medium text-gray-900">SQ #{sq_id}</div>
                  <div className="text-xs text-gray-500">
                    {top === 'all' ? 'All ranking' : `Top ${top} ranking`}
                  </div>
                </div>

                {/* Product picker */}
                <div className="px-3 pb-2 mt-2 border-b flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <ProductPicker
                    products={g.products}
                    order={g.productOrder}
                    active={pid}
                    onChange={(p)=>setSelectedProduct(prev => ({ ...prev, [sq_id]: p }))}
                  />
                </div>

                {/* Tabel ranking (tanpa filter winner/qty) */}
                <div className="p-3 overflow-x-auto">
                  <div className="text-sm text-gray-700 mb-2">
                    Produk terpilih: <span className="font-medium">{current?.name}</span> <span className="text-gray-500">({pid})</span>
                  </div>
                  <table className="min-w-[920px] w-full text-sm">
                    <thead>
                      <tr className="text-left bg-gray-100 text-gray-700">
                        <th className="p-2">Rank</th>
                        <th className="p-2">Supplier</th>
                        <th className="p-2">SQID</th>
                        <th className="p-2">Product</th>
                        <th className="p-2 text-right">Quantity (req / resp)</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-center">Point (qty)</th>
                        <th className="p-2 text-center">Point (price)</th>
                        <th className="p-2 text-center">Total</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    {/* Tabel ranking (tanpa filter winner/qty) */}
                    <tbody>
                      {(current?.items ?? []).map((it) => {
                        const rowKey   = keyOf(sq_id, pid, it.supplier_id);
                        const revealed = contacts[rowKey]?.reveal === true;
                        const isWinner  = it.rank_no === 1;
                        const bestPrice = it.price_point === 1;

                        return (
                          <tr
                            key={`${it.supplier_id}-${it.rank_no}-${pid}`}
                            className={
                              "border-t transition-colors " +
                              (isWinner ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-gray-50")
                            }
                          >
                            {/* Rank */}
                            <td className="p-2 font-semibold">
                              {isWinner ? "🥇" : it.rank_no === 2 ? "🥈" : "🥉"} {it.rank_no}
                            </td>

                            {/* Supplier — masih HIDDEN */}
                            <td className="p-2">
                              <div className="font-medium">
                                {revealed ? it.supplier_name : masked(8)}
                              </div>
                              {/* <div className="text-xs text-gray-500">
                                {revealed ? it.supplier_id : masked(6)}
                              </div> */}
                            </td>

                            {/* SQID — terlihat */}
                            <td className="p-2">{it.sq_id}</td>

                            {/* Product — SELALU tampil product_name dari Smart Quotation */}
                            <td className="p-2 text-gray-900">
                              <div className="font-medium">{it.product_name}</div>
                              {it.name_matched === false && it.resp_product_name && (
                                <div className="text-xs text-gray-500">
                                  response supplier: <span className="italic">{it.resp_product_name}</span>
                                </div>
                              )}
                            </td>

                            {/* Quantity — terlihat */}
                            <td className="p-2 text-right">
                              {it.req_qty} / <span className="text-gray-900">{it.resp_qty}</span>
                            </td>

                            {/* Price — terlihat */}
                            <td className="p-2 text-right">
                              {formatIDR(it.price)}
                              {bestPrice && (
                                <span className="ml-2 rounded-full bg-emerald-600/10 text-emerald-700 px-2 py-0.5 text-[11px]">
                                  Best price
                                </span>
                              )}
                            </td>

                            {/* Points — terlihat */}
                            <td className="p-2 text-center">{it.qty_point}</td>
                            <td className="p-2 text-center">{it.price_point}</td>

                            {/* Total — terlihat */}
                            <td className="p-2 text-center">
                              <span className="inline-flex items-center rounded-full bg-gray-900 text-white px-2 py-0.5 text-[12px]">
                                {it.total_point}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="p-2 text-center">
                              <button
                                onClick={() =>
                                  openContactModal({
                                    sq_id,
                                    product_id: pid,
                                    supplier_id: it.supplier_id,
                                    supplier_name: it.supplier_name,
                                  })
                                }
                                className={
                                  "px-3 py-1 rounded border transition " +
                                  (isWinner
                                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                                    : "bg-white hover:bg-gray-100")
                                }
                              >
                                Get Contact
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CONTACT */}
      {modal.open && modal.key && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setModal({ open:false })} />
          <div className="relative z-[101] w-full max-w-xl rounded-2xl bg-white shadow-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="font-semibold">Supplier Contact</div>
              <button onClick={()=>setModal({ open:false })} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
            </div>
            <div className="pt-3">
              {contacts[modal.key]?.loading ? (
                <div className="text-sm text-gray-600 animate-pulse">Memuat kontak…</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Nama</div>
                    <div className="font-medium">
                      {contacts[modal.key]?.reveal ? contacts[modal.key]?.data?.name : mask(contacts[modal.key]?.data?.name)}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Email</div>
                    <div className="font-medium">
                      {contacts[modal.key]?.reveal ? contacts[modal.key]?.data?.email : mask(contacts[modal.key]?.data?.email)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Telepon</div>
                    <div className="font-medium">
                      {contacts[modal.key]?.reveal ? contacts[modal.key]?.data?.phone_number : mask(contacts[modal.key]?.data?.phone_number)}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Alamat</div>
                    <div className="font-medium break-words">
                      {contacts[modal.key]?.reveal ? contacts[modal.key]?.data?.address : mask(contacts[modal.key]?.data?.address)}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2 pt-2">
                    <input
                      id="reveal-contact"
                      type="checkbox"
                      className="h-4 w-4"
                      checked={!!contacts[modal.key]?.reveal}
                      onChange={(e)=>setReveal(e.target.checked)}
                    />
                    <label htmlFor="reveal-contact" className="text-sm">Tampilkan kontak</label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
