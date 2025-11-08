"use client";
import React, { useEffect, useMemo, useState } from "react";
import SupplierResponseModal from "../smartquote/components/SupplierResponseModal";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type Supplier = { id: string; name: string };

type InboxRow = {
  blast_id: number;
  sq_id: number;
  item_id: number;
  customer_id: string;
  customer_name: string;
  area_code: number;
  area_name: string;
  category_code: number;
  category_name: string;
  requested_product_name: string;
  requested_size: string | null;
  unit_name: string;
  requested_qty: number;
  sq_created_date: string;
  requested_note?: string | null;

  response_product_name?: string | null;
  response_qty?: number | null;
  response_price?: number | null;
  response_note?: string | null;
  response_created_date?: string | null;
};

type Grouped = {
  sq_id: number;
  items: InboxRow[];
  header: InboxRow;
  counts: { total: number; responded: number; pending: number; categories: number; areas: number };
  created: string;
};

type SortKey = "sq_id" | "created" | null;
type SortDir = "asc" | "desc";

function cx(...v: (string | false | null | undefined)[]) { return v.filter(Boolean).join(" "); }
function formatDateID(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.valueOf())) return s;
  return d.toLocaleString("id-ID", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function SortButton({
  label, column, activeKey, setActiveKey, dir, setDir,
}: {
  label: string;
  column: SortKey;
  activeKey: SortKey;
  setActiveKey: (k: SortKey) => void;
  dir: SortDir;
  setDir: (d: SortDir) => void;
}) {
  const isActive = activeKey === column;
  const toggle = () => {
    if (!isActive) { setActiveKey(column); setDir("desc"); } 
    else { setDir(dir === "desc" ? "asc" : "desc"); }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className={cx(
        "group inline-flex items-center gap-1 rounded-lg px-2 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
        isActive ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      )}
      aria-label={`Sort ${label} ${isActive ? (dir === "desc" ? "desc" : "asc") : ""}`}
    >
      <span className="text-[13px] font-medium">{label}</span>
      {!isActive && <ArrowUpDown className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />}
      {isActive && dir === "desc" && <ArrowDown className="w-3.5 h-3.5" />}
      {isActive && dir === "asc"  && <ArrowUp   className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function SupplierInboxPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");

  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [supplierToken, setSupplierToken] = useState<number | null>(null);

  const [openView, setOpenView] = useState(false);
  const [active, setActive] = useState<Grouped | null>(null);

  const [openResponse, setOpenResponse] = useState(false);
  const [selectedRow, setSelectedRow] = useState<InboxRow | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const k = (...xs: Array<string | number | null | undefined>) => xs.map(v => String(v ?? "")).join("::");

  const loadSupplierToken = async (sid: string) => {
    if (!sid) { setSupplierToken(null); return; }
    try {
      const r = await fetch(`/api/tokens/balance?user_id=${encodeURIComponent(sid)}`, { cache: "no-store" });
      const j = await r.json();
      setSupplierToken(j?.token_balance ?? 0);
    } catch { setSupplierToken(null); }
  };
  useEffect(() => { loadSupplierToken(supplierId); }, [supplierId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/master/suppliers", { cache: "no-store" });
        setSuppliers(await res.json());
      } catch {}
    })();
  }, []);

  const loadInbox = async (sid: string) => {
    if (!sid) { setInbox([]); return; }
    try {
      setErr(null); setLoading(true);
      const res = await fetch(`/api/supplier/inbox?supplier_id=${encodeURIComponent(sid)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      setInbox(await res.json());
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat inbox"); setInbox([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { loadInbox(supplierId); }, [supplierId]);

  const grouped: Grouped[] = useMemo(() => {
    const map = new Map<number, InboxRow[]>();
    for (const r of inbox) {
      const arr = map.get(r.sq_id) || [];
      arr.push(r);
      map.set(r.sq_id, arr);
    }
    const arr: Grouped[] = [];
    for (const [sq_id, items] of map.entries()) {
      const header = items[0];
      const responded = items.filter(x => typeof x.response_price === "number").length;
      const catSet = new Set(items.map(x => x.category_code));
      const areaSet = new Set(items.map(x => `${x.area_code}|${x.area_name}`));
      arr.push({
        sq_id,
        items: items.slice().sort((a, b) => (a.item_id === b.item_id ? b.blast_id - a.blast_id : a.item_id - b.item_id)),
        header,
        counts: { total: items.length, responded, pending: items.length - responded, categories: catSet.size, areas: areaSet.size },
        created: header.sq_created_date,
      });
    }
    const sorted = arr.sort((a, b) => {
      if (sortKey === "sq_id") {
        return sortDir === "asc" ? a.sq_id - b.sq_id : b.sq_id - a.sq_id;
      }
      if (sortKey === "created") {
        const ta = new Date(a.created).getTime();
        const tb = new Date(b.created).getTime();
        return sortDir === "asc" ? ta - tb : tb - ta;
      }
      return 0;
    });
    return [...sorted];
  }, [inbox, sortKey, sortDir]);

  const openDetail = (g: Grouped) => { setActive(g); setOpenView(true); };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Supplier Inbox</h1>
            <p className="text-sm text-gray-600">Lihat semua Smart Quote yang dikirim ke supplier dan kirimkan penawaran.</p>
          </div>
        </div>

        {/* Top bar: pilih supplier + token */}
        <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="flex items-center gap-3">
              <div className="w-full">
                <label className="text-sm text-gray-700">Supplier</label>
                <select
                  className="w-full border border-gray-300 rounded-xl p-2 bg-white text-gray-900"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">— pilih supplier —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              {supplierId && (
                <button
                  onClick={() => loadInbox(supplierId)}
                  className="shrink-0 px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                >
                  Refresh
                </button>
              )}
            </div>

            {supplierId && (
              <div className="justify-self-end inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white">
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
        </div>

        {/* Table ringkas per SQ + sort header */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-4">
            {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}
            {loading && <div className="mb-3 text-gray-600 text-sm animate-pulse">Loading…</div>}
            {!loading && supplierId && grouped.length === 0 && (
              <div className="text-sm text-gray-600">Tidak ada Smart Quote untuk supplier ini.</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 sticky top-0 z-10">
                  <tr className="text-[13px]">
                    <th className="p-3 w-14 font-semibold text-left">No</th>
                    <th className="p-3 font-semibold text-left">
                      <SortButton
                        label="SQID"
                        column="sq_id"
                        activeKey={sortKey}
                        setActiveKey={setSortKey}
                        dir={sortDir}
                        setDir={setSortDir}
                      />
                    </th>
                    <th className="p-3 font-semibold text-left">Customer</th>
                    <th className="p-3 font-semibold text-left">Area</th>
                    <th className="p-3 font-semibold text-left">Category</th>
                    <th className="p-3 font-semibold text-left">Items</th>
                    <th className="p-3 font-semibold text-left">Responded</th>
                    <th className="p-3 font-semibold text-left">Pending</th>
                    <th className="p-3 font-semibold text-left">
                      <SortButton
                        label="Tanggal Dibuat"
                        column="created"
                        activeKey={sortKey}
                        setActiveKey={setSortKey}
                        dir={sortDir}
                        setDir={setSortDir}
                      />
                    </th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((g, idx) => (
                    <tr key={`sq-${g.sq_id}`} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3">#{g.sq_id}</td>
                      <td className="p-3">{g.header.customer_name} ({g.header.customer_id})</td>
                      <td className="p-3">{g.counts.areas} area</td>
                      <td className="p-3">{g.counts.categories}</td>
                      <td className="p-3">{g.counts.total}</td>
                      <td className="p-3">{g.counts.responded}</td>
                      <td className="p-3">{g.counts.pending}</td>
                      <td className="p-3">{formatDateID(g.created)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => { setActive(g); setOpenView(true); }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && supplierId && grouped.length === 0 && (
                    <tr><td className="p-4 text-center text-gray-600" colSpan={10}>Tidak ada data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== Modal VIEW Detail ===== */}
        {openView && active && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpenView(false)} />
            <div className="relative w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Detail Smart Quote</h4>
                  <p className="text-sm text-gray-600">
                    SQID <span className="font-medium text-gray-900">#{active.sq_id}</span> •{" "}
                    Customer <span className="font-medium text-gray-900">{active.header.customer_name} ({active.header.customer_id})</span>
                  </p>
                </div>
                <button onClick={() => setOpenView(false)} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close">✕</button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Area</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {Array.from(new Set(active.items.map(it => it.area_name))).join(", ")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Categories</div>
                    <div className="mt-1 text-sm text-gray-900">{active.counts.categories}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Items</div>
                    <div className="mt-1 text-sm text-gray-900">{active.counts.total}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Tanggal Dibuat</div>
                    <div className="mt-1 text-sm text-gray-900">{formatDateID(active.created)}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-900">
                    Items ({active.items.length})
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <table className="min-w-[920px] w-full text-sm">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr className="text-left">
                          <th className="p-2">Item ID</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Product (requested)</th>
                          <th className="p-2">Size</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2 text-right">Requested Qty</th>
                          <th className="p-2">Request Note</th>
                          <th className="p-2">Price (offer)</th>
                          <th className="p-2">Note (supplier)</th>
                          <th className="p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.items.map((it) => (
                          <tr key={k(it.sq_id, it.blast_id, it.item_id)} className="border-t hover:bg-gray-50">
                            <td className="p-2">{it.item_id}</td>
                            <td className="p-2 text-gray-900">{it.category_name} ({it.category_code})</td>
                            <td className="p-2 text-gray-900">{it.requested_product_name}</td>
                            <td className="p-2">{it.requested_size || "-"}</td>
                            <td className="p-2">{it.unit_name}</td>
                            <td className="p-2 text-right">{it.requested_qty ?? "-"}</td>
                            <td className="p-2">{it.requested_note || <span className="text-gray-400 italic">-</span>}</td>
                            <td className="p-2">
                              {typeof it.response_price === "number"
                                ? new Intl.NumberFormat("id-ID").format(it.response_price)
                                : <span className="text-gray-400 italic">belum diisi</span>}
                            </td>
                            <td className="p-2">{it.response_note || <span className="text-gray-400 italic">opsional</span>}</td>
                            <td className="p-2">
                              {typeof it.response_price === "number" ? (
                                <button className="px-2 py-1 rounded bg-green-300 text-white cursor-not-allowed" disabled>
                                  Submitted
                                </button>
                              ) : (
                                <button
                                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => { setSelectedRow(it); setOpenResponse(true); }}
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

                <div className="flex justify-end pt-1">
                  <button onClick={() => setOpenView(false)} className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <SupplierResponseModal
          open={openResponse}
          onClose={() => setOpenResponse(false)}
          row={selectedRow}
          supplierId={supplierId}
          onSubmitted={() => { loadInbox(supplierId); loadSupplierToken(supplierId); }}
        />
      </div>
    </div>
  );
}
