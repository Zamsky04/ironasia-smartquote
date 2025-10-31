"use client";
import React, { useEffect, useMemo, useState } from "react";

type Supplier = { id: string; name: string };
type Product  = { id: string; name: string };
type AreaOpt  = { code: number; name: string };

type StockRow = {
  supplier_id: string;
  supplier_name: string;
  product_id: string;
  product_name: string;
  category_name?: string | null;
  subcategory_name?: string | null;
  qty?: number | null;
  quantity?: number | null;
  stock?: number | null;
  stock_qty?: number | null;
  created_date?: string | null;
  updated_date?: string | null;
  supplier_area_codes?: number[];
  supplier_area_names?: string[];
};

export default function StockPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [areas,     setAreas]     = useState<AreaOpt[]>([]);  // 🔥 baru

  const [supplierId, setSupplierId] = useState("");
  const [productId,  setProductId]  = useState("");
  const [areaCode,   setAreaCode]   = useState<number | "">(""); // 🔥 baru

  const [rows, setRows]       = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  // load suppliers
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/master/suppliers", { cache: "no-store" });
        const data = await res.json();
        const list: Supplier[] = data.map((s: any) => ({
          id: String(s.user_id ?? s.id ?? s.supplier_id),
          name: String(s.name ?? s.supplier_name ?? s.id),
        }));
        const uniq = Array.from(new Map(list.map(x => [x.id, x])).values());
        setSuppliers(uniq);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // load products
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/master/products", { cache: "no-store" });
        const data = await res.json();
        const list: Product[] = data.map((p: any) => ({
          id: String(p.product_id ?? p.id),
          name: String(p.name ?? p.product_name ?? p.id),
        }));
        setProducts(list);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // 🔥 load areas when supplier changes
  useEffect(() => {
    (async () => {
      setAreas([]);
      setAreaCode(""); // reset pilihan area saat ganti supplier
      if (!supplierId) return;
      try {
        const res = await fetch(`/api/master/supplier-areas?supplier_id=${encodeURIComponent(supplierId)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        // bentuk: [{area_code, area_name}]
        setAreas(
          data.map((a: any) => ({ code: Number(a.area_code), name: String(a.area_name) }))
              .sort((a:AreaOpt,b:AreaOpt)=>a.name.localeCompare(b.name))
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, [supplierId]);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const params = new URLSearchParams();
      if (supplierId) params.set("supplier_id", supplierId);
      if (productId)  params.set("product_id", productId);
      if (areaCode !== "") params.set("area_code", String(areaCode)); // 🔥 kirim area_code kalau dipilih
      const res = await fetch(`/api/master/stocks?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data: StockRow[] = await res.json();
      const deduped = dedupeStocks(data);
      setRows(deduped);
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat stok");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // initial + reload when filters change
  useEffect(() => { load(); }, [supplierId, productId, areaCode]);

  const fmtQty  = (r: StockRow) => {
    const v = r.qty ?? r.quantity ?? r.stock ?? r.stock_qty;
    return typeof v === "number" ? new Intl.NumberFormat("id-ID").format(v) : "-";
  };
  const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : "-");

  const title = useMemo(() => {
    const sup = suppliers.find(s => s.id === supplierId);
    return sup ? `Stocks • ${sup.name} (${sup.id})` : "Stocks";
  }, [supplierId, suppliers]);

  // ===== Utils Dedupe =====
  function num(v: unknown): number {
    return typeof v === "number" ? v : 0;
  }

  function parseDateOrNull(s?: string | null): Date | null {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function maxDateStr(a?: string | null, b?: string | null): string | null {
    const da = parseDateOrNull(a);
    const db = parseDateOrNull(b);
    if (!da && !db) return a ?? b ?? null;
    if (!da) return b ?? null;
    if (!db) return a ?? null;
    return (da >= db ? a : b) ?? null;
  }

  function minDateStr(a?: string | null, b?: string | null): string | null {
    const da = parseDateOrNull(a);
    const db = parseDateOrNull(b);
    if (!da && !db) return a ?? b ?? null;
    if (!da) return b ?? null;
    if (!db) return a ?? null;
    return (da <= db ? a : b) ?? null;
  }

  function uniqNumber(arr: (number | undefined)[] = []): number[] {
    return Array.from(new Set(arr.filter((x): x is number => typeof x === "number")));
  }
  function uniqString(arr: (string | undefined | null)[] = []): string[] {
    return Array.from(new Set(arr.filter((x): x is string => typeof x === "string" && x.length > 0)));
  }

  /**
   * Gabungkan duplikat berdasarkan supplier_id + product_id
   * - qty dijumlahkan (mengutamakan field qty, fallback quantity/stock/stock_qty)
   * - updated_date = paling baru, created_date = paling lama
   * - areas di-union (codes & names)
   */
  function dedupeStocks(data: StockRow[]): StockRow[] {
    const map = new Map<string, StockRow>();

    for (const r of data) {
      const key = `${r.supplier_id}|${r.product_id}`;

      const thisQty = num(r.qty ?? r.quantity ?? r.stock ?? r.stock_qty);
      const thisCodes = Array.isArray(r.supplier_area_codes) ? r.supplier_area_codes : [];
      const thisNames = Array.isArray(r.supplier_area_names) ? r.supplier_area_names : [];

      if (!map.has(key)) {
        // normalisasi qty ke field 'qty' agar konsisten
        map.set(key, {
          ...r,
          qty: thisQty,
          quantity: undefined,
          stock: undefined,
          stock_qty: undefined,
          supplier_area_codes: uniqNumber(thisCodes),
          supplier_area_names: uniqString(thisNames),
        });
      } else {
        const ex = map.get(key)!;
        const exQty = num(ex.qty ?? ex.quantity ?? ex.stock ?? ex.stock_qty);
        const sumQty = exQty + thisQty;

        map.set(key, {
          ...ex,
          // qty final disimpan di 'qty'
          qty: sumQty,
          quantity: undefined,
          stock: undefined,
          stock_qty: undefined,
          // tanggal
          updated_date: maxDateStr(ex.updated_date, r.updated_date),
          created_date: minDateStr(ex.created_date, r.created_date),
          // union area
          supplier_area_codes: uniqNumber([...(ex.supplier_area_codes ?? []), ...thisCodes]),
          supplier_area_names: uniqString([...(ex.supplier_area_names ?? []), ...thisNames]),
        });
      }
    }

    // optional: urutkan hasil akhir biar stabil
    return Array.from(map.values()).sort((a, b) => {
      const s = a.supplier_name.localeCompare(b.supplier_name);
      if (s !== 0) return s;
      return a.product_name.localeCompare(b.product_name);
    });
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4">{title}</h1>

        {/* FILTER BAR */}
        <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4">
          {/* Supplier */}
          <div className="flex-1">
            <label className="text-sm text-gray-700">Supplier</label>
            <select
              className="w-full border rounded px-2 py-1 bg-white text-gray-900"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">— Semua supplier —</option>
              {suppliers.map((s, i) => (
                <option key={`${s.id}-${i}`} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div className="flex-1">
            <label className="text-sm text-gray-700">Product</label>
            <select
              className="w-full border rounded px-2 py-1 bg-white text-gray-900"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">— Semua produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
        <div className="text-sm text-gray-600 mb-2">Total: {rows.length} baris</div>

        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-2 text-left">Supplier</th>
                <th className="p-2 text-left">Areas</th>
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Subcategory</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.supplier_id}|${r.product_id}|${idx}`} className="border-t hover:bg-gray-50">
                  <td className="p-2">{r.supplier_name} ({r.supplier_id})</td>
                  <td className="p-2">
                    {Array.isArray(r.supplier_area_names) && r.supplier_area_names.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {r.supplier_area_names.map((nm, idx) => {
                          const code = Array.isArray(r.supplier_area_codes)
                            ? r.supplier_area_codes[idx]
                            : undefined;
                          return (
                            <span
                              key={`${idx}-${code ?? nm}`}
                              className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-gray-100 border border-gray-200"
                            >
                              {nm} ({code ?? "?"})
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-2">{r.product_name} ({r.product_id})</td>
                  <td className="p-2">{r.category_name ?? "-"}</td>
                  <td className="p-2">{r.subcategory_name ?? "-"}</td>
                  <td className="p-2 text-right">
                    {fmtQty(r)}
                  </td>
                  <td className="p-2">{fmtDate(r.created_date)}</td>
                  <td className="p-2">{fmtDate(r.updated_date)}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    Tidak ada data stok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
