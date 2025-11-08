import React, { useEffect, useMemo, useState } from "react";
import ItemTable from "./ItemTable";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SQItem = {
  item_id: number;
  category_id: number;
  category_name?: string;
  product_name?: string;
  size?: string | null;
  unit_id?: number;
  unit_name?: string;
  quantity: number;
  note?: string | null;
  status?: string;
};

type SQRow = {
  sq_id: number;
  customer_id: string;
  customer_name?: string;
  area_codes?: (string | number)[];
  status: string;
  created_date: string;
  items: SQItem[];
};

function cx(...a: (string | false | null | undefined)[]) { return a.filter(Boolean).join(" "); }
function formatDateID(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.valueOf())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
const StatusPill = ({ status }: { status: string }) => {
  const st = (status || "").toLowerCase();
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    approved: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-600", label: "Approved" },
    pending:  { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-600", label: "Pending" },
    rejected: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-600", label: "Rejected" },
    draft:    { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-600", label: "Draft" },
  };
  const style = map[st] ?? { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-600", label: status || "-" };
  return (
    <span className={cx("inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs", style.bg, style.text)}>
      <span className={cx("w-1.5 h-1.5 rounded-full", style.dot)} /> {style.label}
    </span>
  );
};
const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-700 bg-white">
    {children}
  </span>
);

type SortKey = "sq_id" | "created_date" | null;
type SortDir = "asc" | "desc";
const DEFAULT_SORT: { key: SortKey; dir: SortDir } = { key: "created_date", dir: "desc" }; 

export default function SQList({
  refresh,
  customerId,
}: {
  refresh: number;
  customerId: string;
}) {
  const [data, setData] = useState<SQRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [active, setActive] = useState<SQRow | null>(null);

  const [areaMap, setAreaMap] = useState<Record<string, string>>({});

  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT.key);
  const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_SORT.dir);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/master/areas", { cache: "force-cache" });
        if (!r.ok) return;
        const rows = await r.json();
        const m: Record<string, string> = {};
        for (const a of rows) m[String(a.area_code)] = a.area_name || String(a.area_code);
        setAreaMap(m);
      } catch {}
    })();
  }, []);
  const areaLabel = (code: string | number) => areaMap[String(code)] || `Area ${String(code)}`;

  useEffect(() => {
    if (!customerId) { setData([]); return; }
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch(`/api/smart-quotes/list?customer_id=${encodeURIComponent(customerId)}`, { cache: "no-store" });
        if (!r.ok) throw new Error(await r.text());
        const rows: SQRow[] = await r.json();
        if (!ignore) setData(rows);
      } catch (e: any) {
        if (!ignore) setErr(e?.message || "Failed to load");
        setData([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [refresh, customerId]);

  const tableRows = useMemo(() => {
    const withCounts = data.map((row) => {
      const uniqueCat = new Set<number>();
      (row.items || []).forEach((it) => { if (typeof it.category_id === "number") uniqueCat.add(it.category_id); });
      return { ...row, categoryCount: uniqueCat.size, productCount: (row.items || []).length };
    });

    const sorted = [...withCounts].sort((a, b) => {
      if (!sortKey) return 0;
      if (sortKey === "sq_id") {
        const va = Number(a.sq_id), vb = Number(b.sq_id);
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (sortKey === "created_date") {
        const ta = new Date(a.created_date).getTime();
        const tb = new Date(b.created_date).getTime();
        return sortDir === "asc" ? ta - tb : tb - ta;
      }
      return 0;
    });

    return sorted;
  }, [data, sortKey, sortDir]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    const isActive = sortKey === column;
    const isAsc = sortDir === "asc";
    const isDesc = sortDir === "desc";

    return (
      <button
        onClick={() => {
          if (sortKey !== column) {
            setSortKey(column);
            setSortDir("desc");
          } else {
            setSortDir(isDesc ? "asc" : "desc");
          }
        }}
        className={cx(
          "ml-1 inline-flex items-center justify-center rounded-md p-1 transition-colors",
          isActive
            ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
            : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        )}
        aria-label={`Sort ${column}`}
      >
        {!isActive && <ArrowUpDown className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition" />}
        {isActive && isDesc && <ArrowDown className="w-3.5 h-3.5" />}
        {isActive && isAsc && <ArrowUp className="w-3.5 h-3.5" />}
      </button>
    );
  };

  const openView = (row: SQRow) => {
    setActive(row);
    setOpenDetail(true);
  };

  return (
    <div className="w-full">
      {/* Head toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Daftar Smart Quotation</h3>
          <Chip>{data.length} total</Chip>
          {loading && <Chip>Loading…</Chip>}
        </div>
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 w-14">No</th>
                <th className="text-left p-3">
                  <div className="flex items-center gap-1">
                    SQID
                    <SortIcon column="sq_id" />
                  </div>
                </th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Status</th> 
                <th className="text-left p-3">
                  <div className="flex items-center gap-1">
                    Tanggal Dibuat
                    <SortIcon column="created_date" />
                  </div>
                </th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {/* Skeleton */}
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-gray-100">
                  <td className="p-3"><div className="h-3 w-6 animate-pulse bg-gray-200 rounded" /></td>
                  <td className="p-3"><div className="h-3 w-24 animate-pulse bg-gray-200 rounded" /></td>
                  <td className="p-3"><div className="h-3 w-20 animate-pulse bg-gray-200 rounded" /></td>
                  <td className="p-3"><div className="h-3 w-20 animate-pulse bg-gray-200 rounded" /></td>
                  <td className="p-3"><div className="h-5 w-24 animate-pulse bg-gray-200 rounded-full" /></td>
                  <td className="p-3"><div className="h-3 w-36 animate-pulse bg-gray-200 rounded" /></td>
                  <td className="p-3 text-right"><div className="h-8 w-20 animate-pulse bg-gray-200 rounded-xl inline-block" /></td>
                </tr>
              ))}

              {/* Empty */}
              {!loading && tableRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-600">
                    Belum ada Smart Quotation untuk customer ini.
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading && tableRows.map((row, idx) => (
                <tr key={`sq-${row.sq_id}`} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-gray-900">#{row.sq_id}</span>
                      {row.area_codes?.length ? (
                        <span className="text-xs text-gray-500">({row.area_codes.length} area)</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="p-3">{(row as any).categoryCount}</td>
                  <td className="p-3">{(row as any).productCount}</td>
                  <td className="p-3"><StatusPill status={row.status} /></td>
                  <td className="p-3">{formatDateID(row.created_date)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openView(row)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                    >
                      View
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======== Center Modal Detail ======== */}
      {openDetail && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenDetail(false)} />
          <div className="relative w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Smart Quotation Detail</h4>
                <p className="text-sm text-gray-600">
                  SQID <span className="font-medium text-gray-900">#{active.sq_id}</span> •{" "}
                  Customer <span className="font-medium text-gray-900">{active.customer_name || active.customer_id}</span>
                </p>
              </div>
              <button
                onClick={() => setOpenDetail(false)}
                className="rounded-full p-2 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="mt-1"><StatusPill status={active.status} /></div>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Tanggal Dibuat</div>
                  <div className="mt-1 text-sm text-gray-900">{formatDateID(active.created_date)}</div>
                </div>
                <div className="rounded-xl border border-gray-200 p-3 md:col-span-1">
                  <div className="text-xs text-gray-500">Total Items</div>
                  <div className="mt-1 text-sm text-gray-900">{active.items?.length || 0}</div>
                </div>

                {/* Area by NAME */}
                <div className="rounded-xl border border-gray-200 p-3 md:col-span-3">
                  <div className="text-xs text-gray-500 mb-2">Area</div>
                  <div className="flex flex-wrap gap-2">
                    {(active.area_codes ?? []).map((a, i) => (
                      <Chip key={`ac-${i}`}>{areaLabel(a)}</Chip>
                    ))}
                    {(!active.area_codes || active.area_codes.length === 0) && (
                      <span className="text-sm text-gray-600">Tidak ada area.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-900">
                  Items ({active.items?.length || 0})
                </div>
                <div className="p-3">
                  <ItemTable sq={active} />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setOpenDetail(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
