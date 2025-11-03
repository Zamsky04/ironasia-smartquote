"use client";
import React, { useEffect, useMemo, useState } from "react";
import SupplierResponseModal from "../smartquote/components/SupplierResponseModal";

type Supplier = { id: string; name: string };

type InboxRow = {
  blast_id: number;
  sq_id: number;
  customer_id: string;
  customer_name: string;
  area_code: number;
  area_name: string;
  category_code: number;
  category_name: string;
  requested_names: string;   
  requested_qty: number;
  sq_created_date: string;

  response_product_name?: string | null;
  response_qty?: number | null;
  response_price?: number | null;
  response_note?: string | null;
  response_created_date?: string | null;
};

export default function SupplierInboxPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<InboxRow | null>(null);

  const [supplierToken, setSupplierToken] = useState<number | null>(null);

  const loadSupplierToken = async (sid: string) => {
    if (!sid) { setSupplierToken(null); return; }
    try {
      const r = await fetch(`/api/tokens/balance?user_id=${encodeURIComponent(sid)}`, { cache: "no-store" });
      const j = await r.json();
      setSupplierToken(j?.token_balance ?? 0);
    } catch { setSupplierToken(null); }
  };

  useEffect(() => { loadSupplierToken(supplierId); }, [supplierId]);

  // load suppliers
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/master/suppliers", { cache: "no-store" });
        const data: Supplier[] = await res.json();
        setSuppliers(data);
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, []);

  // load inbox when supplier selected
  const loadInbox = async (sid: string) => {
    if (!sid) { setInbox([]); return; }
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch(`/api/supplier/inbox?supplier_id=${encodeURIComponent(sid)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const rows: InboxRow[] = await res.json();
      setInbox(rows);
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat inbox");
      setInbox([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInbox(supplierId); }, [supplierId]);

  const grouped = useMemo(() => {
    // group by sq_id
    const map = new Map<number, InboxRow[]>();
    for (const r of inbox) {
      const arr = map.get(r.sq_id) || [];
      arr.push(r);
      map.set(r.sq_id, arr);
    }
    return Array.from(map.entries())
      .map(([sq_id, items]) => ({ sq_id, items, header: items[0] }))
      .sort((a, b) => b.sq_id - a.sq_id);
  }, [inbox]);

  // Tambahkan helper key di atas komponen (setelah semua import)
  const k = (...xs: Array<string | number | null | undefined>) =>
    xs.map(v => String(v ?? "")).join("::");

  return (
  <div className="min-h-screen bg-white text-gray-900">
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Supplier Inbox</h1>

      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm text-gray-700">Supplier</label>
        <select
          className="rounded border px-2 py-1 bg-white text-gray-900"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="">— pilih supplier —</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.id})
            </option>
          ))}
        </select>
        {supplierId && (
          <button
            onClick={() => loadInbox(supplierId)}
            className="ml-2 px-3 py-1 rounded border hover:bg-gray-100 bg-white text-gray-800"
          >
            Refresh
          </button>
        )}

        {supplierId && (
          <div className="ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white">
            <span className="text-gray-600">Tokens</span>
            <span className="font-semibold">{supplierToken ?? "…"}</span>
            <button
              onClick={async () => {
                const amt = Number(prompt("Top-up berapa? (mis. 5,10,15)", "5") || 0);
                if (!amt || amt <= 0) return;
                try {
                  const r = await fetch("/api/tokens/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: supplierId, amount: amt, reason: "topup_supplier" }),
                  });
                  const j = await r.json();
                  if (typeof j?.token_balance === "number") setSupplierToken(j.token_balance);
                  else alert("Top-up gagal");
                } catch (e:any) { alert(String(e?.message || e)); }
              }}
              className="ml-2 px-2 py-0.5 rounded border hover:bg-gray-100"
              title="Top-up token"
            >
              + Top-up
            </button>
          </div>
        )}
      </div>

      {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}
      {loading && (
        <div className="mb-3 text-gray-600 text-sm animate-pulse">
          Loading…
        </div>
      )}
      {!loading && supplierId && grouped.length === 0 && (
        <div className="text-sm text-gray-600">
          Tidak ada Smart Quote untuk supplier ini.
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(({ sq_id, items, header }) => (
          <div
            key={sq_id}
            className="rounded-xl border border-gray-200 shadow-sm bg-white"
          >
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
              <div className="font-medium text-gray-900">
                SQ #{sq_id} • {header.customer_name} ({header.customer_id}) •{" "}
                {header.area_name} ({header.area_code})
              </div>
              <div className="text-xs text-gray-500">
                Created: {new Date(header.sq_created_date).toLocaleString()}
              </div>
            </div>

            <div className="p-3 overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-100 text-gray-700">
                    <th className="p-2">Category</th>
                    <th className="p-2">Requested (names)</th>
                    <th className="p-2 text-right">Requested Qty</th>
                    <th className="p-2">Price (offer)</th>
                    <th className="p-2">Note (supplier)</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={k("row", it.sq_id, it.category_code, supplierId, it.blast_id)}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-2 text-gray-900">
                        {it.category_name} ({it.category_code})
                      </td>
                      <td className="p-2 text-gray-900">
                        {it.requested_names || <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="p-2 text-right text-gray-900">{it.requested_qty ?? "-"}</td>
                      <td className="p-2">
                        {typeof it.response_price === "number"
                          ? new Intl.NumberFormat("id-ID").format(it.response_price)
                          : <span className="text-gray-400 italic">diisi saat Response</span>}
                      </td>
                      <td className="p-2">
                        {it.response_note ? it.response_note : <span className="text-gray-400 italic">opsional</span>}
                      </td>
                      <td className="p-2">
                        {typeof it.response_price === "number" ? (
                          <button
                            className="px-2 py-1 rounded bg-green-300 text-white cursor-not-allowed"
                            disabled
                            title="Response sudah dikirim. Edit dinonaktifkan."
                          >
                            Submitted
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => { setSelectedRow(it); setOpenModal(true); }}
                          >
                            Response
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <SupplierResponseModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        row={selectedRow}
        supplierId={supplierId}
        onSubmitted={() => { loadInbox(supplierId); loadSupplierToken(supplierId); }}   
      />
    </div>
  </div>
);
}
