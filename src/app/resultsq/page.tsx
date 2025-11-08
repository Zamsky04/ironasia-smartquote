"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import TopUpModal from "../smartquote/components/TopUpModal";
import ConfirmSpendModal from "../smartquote/components/ConfirmSpendModal";

type Customer = { id: string; name: string };
type ResultRow = {
  item_id: number;
  sq_id: number;
  area_code: number;
  area_name: string;
  category_code: number;
  product_name: string;
  req_note?: string;
  supplier_id: string;
  supplier_name: string;
  req_qty: number;
  resp_qty: number;
  price: number;
  qty_point: number;
  price_point: number;
  total_point: number;
  rank_no: number;
  resp_product_name?: string;
  name_matched?: boolean;
  resp_note?: string;
};
type Contact = { user_id: string; name: string; email: string; phone_number: string; address: string; office_phone?: string | null };
type ContactState = { data?: Contact; loading: boolean };
type TopMode = 3 | 10 | "all";

type SQGroup = {
  sq_id: number;
  areas: Map<number, { areaName: string; products: Record<string, { name: string; items: ResultRow[] }>; productOrder: string[] }>;
  areaOrder: number[];
  counts: { areas: number; products: number; offers: number };
};

type SortBy = "default" | "price" | "qty";
type SortDir = "asc" | "desc";

const cx = (...v: (string | false | null | undefined)[]) => v.filter(Boolean).join(" ");
const keyOf = (sq: number, pid: string, sid: string) => `${sq}|${pid}|${sid}`;
const formatIDR = (n: number) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
const mask = (v?: string) => (!v ? "******" : "＊".repeat(Math.max(6, Math.min(12, v.length))));
const TOKEN_PRICE = 5000;

const toneClass = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
} as const;
type Tone = keyof typeof toneClass;

function Chip({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${toneClass[tone]}`}>{children}</span>;
}
function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs ${className ?? ""}`}>{children}</span>;
}
function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">{children}</div>;
}

function ProductPicker({
  products,
  order,
  active,
  onChange,
}: {
  products: Record<string, { name: string; items: ResultRow[] }>;
  order: string[];
  active: string;
  onChange: (pid: string) => void;
}) {
  if (order.length <= 5) {
    return (
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pr-6">
          {order.map((p) => {
            const selected = p === active;
            return (
              <button
                key={p}
                onClick={() => onChange(p)}
                aria-pressed={selected}
                className={cx(
                  "px-3 py-1 rounded-full border text-sm whitespace-nowrap transition",
                  selected ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-100"
                )}
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
        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
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

function Divider() {
  return <div className="h-px bg-gray-200 my-3" />;
}

function InfoRow({
  label,
  value,
  masked,
  copyable,
}: {
  label: string;
  value?: string | null;
  masked?: boolean;
  copyable?: boolean;
}) {
  const shown = (value ?? "") || "Not available";
  const maskText = (v: string) => v.replace(/(.{2}).+(.{2})/, (_m, a, b) => a + "•".repeat(Math.max(4, v.length - 4)) + b);
  const canCopy = copyable && !!value && !masked;

  return (
    <div className="py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-0.5 flex items-center justify-between gap-3">
        <div className="text-sm font-medium break-words">{masked ? maskText(String(value ?? "")) : shown}</div>
        <button
          disabled={!canCopy}
          onClick={() => navigator.clipboard.writeText(String(value))}
          className="text-xs rounded-full border px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function DefaultDisclaimer() {
  return (
    <div className="space-y-3">
      <p>
        All transactions carried out between sellers and buyers through this website are entirely the responsibility of the
        respective parties involved. We act solely as a facilitator to connect sellers and buyers within one marketplace.
      </p>
      <p>
        Always verify the authenticity of information, communicate clearly, keep records of your transactions, and remain vigilant
        against suspicious offers. Any risks arising from interactions or transactions are the sole responsibility of each party.
      </p>
      <p>
        Accounts found to be engaging in dishonest practices will be blocked from our system. By proceeding, you acknowledge and
        accept these terms.
      </p>
      <p>Silakan ganti dengan teks disclaimer panjang versimu (BI/EN) bila diperlukan.</p>
    </div>
  );
}

function SupplierContactModal({
  open,
  onClose,
  revealed,
  supplierName,
  contact,
  disclaimerTitle = "Disclaimer",
  disclaimerBody,
  onAcceptDisclaimer,
  acceptDisabled,
}: {
  open: boolean;
  onClose: () => void;
  revealed: boolean;
  supplierName: string;
  contact?: Contact;
  disclaimerTitle?: string;
  disclaimerBody?: React.ReactNode;
  onAcceptDisclaimer: () => void;
  acceptDisabled?: boolean;
}) {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [agree, setAgree] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setHasScrolledToEnd(false);
      setAgree(false);
    }
  }, [open]);

  const canContinue = hasScrolledToEnd && agree && !acceptDisabled;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    if (atEnd) setHasScrolledToEnd(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 text-white grid place-items-center font-bold">ia</div>
            <h3 className="text-lg font-semibold">Supplier Contact</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body: two columns */}
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Left: contact info */}
          <div className="p-5">
            <div className="text-xs font-semibold tracking-wide text-gray-600">Supplier</div>
            <div className="text-base font-semibold">{revealed ? supplierName : "••••••••••"}</div>
            <Divider />
            <div className="space-y-1">
              <InfoRow label="PIC" value={contact?.name || supplierName} masked={!revealed} copyable />
              <InfoRow label="Handphone" value={contact?.phone_number || ""} masked={!revealed} copyable />
              <InfoRow label="Office Phone" value={contact?.office_phone || "Not available"} masked={!revealed} />
              <InfoRow label="Email" value={contact?.email || ""} masked={!revealed} copyable />
              <InfoRow label="Address" value={contact?.address || ""} masked={!revealed} />
            </div>

            {!revealed && (
              <p className="text-[11px] text-gray-500 mt-4">
                Please read the disclaimer and check the box to continue. After that, you will be asked to confirm token usage.
              </p>
            )}
          </div>

          {/* Right: disclaimer */}
          <div className="border-t md:border-t-0 md:border-l p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600">⚠️</span>
              <h4 className="font-semibold">{disclaimerTitle}</h4>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-64 overflow-y-auto rounded-lg border p-4 text-sm leading-6 text-gray-700"
            >
              {disclaimerBody ?? <DefaultDisclaimer />}
            </div>

            {!revealed && (
              <>
                <div className="mt-3 flex items-start gap-2">
                  <input
                    id="agree"
                    type="checkbox"
                    className="mt-1"
                    disabled={!hasScrolledToEnd}
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <label htmlFor="agree" className="text-sm text-gray-700">
                    I agree to the Disclaimer.
                    {!hasScrolledToEnd && <span className="ml-1 text-gray-500">(Please scroll to the end)</span>}
                  </label>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    disabled={!canContinue}
                    onClick={onAcceptDisclaimer}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700"
                  >
                    Continue
                  </button>
                  <button onClick={onClose} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultSQPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");

  const REVEAL_COST_TOKENS = 1;
  const canAffordReveal = (bal: number | null | undefined) => (bal ?? 0) >= REVEAL_COST_TOKENS;

  const [customerToken, setCustomerToken] = useState<number | null>(null);
  const loadCustomerToken = async (cid: string) => {
    if (!cid) return setCustomerToken(null);
    try {
      const r = await fetch(`/api/tokens/balance?user_id=${encodeURIComponent(cid)}`, { cache: "no-store" });
      const j = await r.json();
      setCustomerToken(typeof j?.token_balance === "number" ? j.token_balance : 0);
    } catch {
      setCustomerToken(null);
    }
  };

  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [contacts, setContacts] = useState<Record<string, ContactState>>({});
  const [topupOpen, setTopupOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCtx, setConfirmCtx] = useState<{ sq_id?: number; product_id?: string; supplier_id?: string; supplier_name?: string }>({});
  const [confirmExtra, setConfirmExtra] = useState<{ productName?: string; areaName?: string; rankNo?: number; bestPrice?: boolean; qtyMatched?: boolean } | null>(null);

  const [selectedArea, setSelectedArea] = useState<Record<number, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<Record<string, string>>({});

  const [openView, setOpenView] = useState(false);
  const [activeSQ, setActiveSQ] = useState<number | null>(null);

  const [contactModal, setContactModal] = useState<{
    open: boolean;
    ctx?: { sq_id: number; product_id: string; supplier_id: string; supplier_name: string };
  }>({ open: false });

  const [modalTop, setModalTop] = useState<TopMode>(3);         
  const [sortBy, setSortBy] = useState<SortBy>("default");      
  const [sortDir, setSortDir] = useState<SortDir>("asc");  

  const hasContactFor = (sq_id?: number, product_id?: string, supplier_id?: string) => {
    if (!sq_id || !product_id || !supplier_id) return false;
    const key = keyOf(sq_id, product_id, supplier_id);
    return !!contacts[key]?.data;
  };

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
      if (cid) setCustomerId(cid);
    })();
  }, []);

  useEffect(() => {
    if (!customerId) return;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const url = new URL(`/api/results`, window.location.origin);
        url.searchParams.set("customer_id", customerId); 
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data: ResultRow[] = await res.json();
        const norm = data.map((r) => ({
          ...r,
          req_qty: Number(r.req_qty),
          resp_qty: Number(r.resp_qty),
          price: Number(r.price),
          rank_no: Number(r.rank_no),
          qty_point: Number(r.qty_point),
          price_point: Number(r.price_point),
          total_point: Number(r.total_point),
        }));
        setRows(norm);
        setContacts({});
        setSelectedProduct({});
        loadCustomerToken(customerId);
      } catch (e: any) {
        setErr(e?.message || "Gagal memuat results");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  const groups = useMemo<Map<number, SQGroup>>(() => {
    const m = new Map<number, SQGroup>();
    for (const r of rows) {
      if (!m.has(r.sq_id)) m.set(r.sq_id, { sq_id: r.sq_id, areas: new Map(), areaOrder: [], counts: { areas: 0, products: 0, offers: 0 } });
      const g = m.get(r.sq_id)!;

      if (!g.areas.has(r.area_code)) {
        g.areas.set(r.area_code, { areaName: r.area_name, products: {}, productOrder: [] });
        g.areaOrder.push(r.area_code);
      }
      const a = g.areas.get(r.area_code)!;

      const pkey = `${r.category_code}|${r.product_name.toLowerCase().trim()}`;
      if (!a.products[pkey]) {
        a.products[pkey] = { name: r.product_name, items: [] };
        a.productOrder.push(pkey);
      }
      a.products[pkey].items.push(r);
      g.counts.offers += 1;
    }
    for (const [, g] of m) {
      const prodSet = new Set<string>();
      for (const [, a] of g.areas) {
        for (const k of Object.keys(a.products)) {
          a.products[k].items.sort((x, y) => x.rank_no - y.rank_no);
          prodSet.add(k);
        }
      }
      g.counts.areas = g.areaOrder.length;
      g.counts.products = prodSet.size;
    }
    return m;
  }, [rows]);

  useEffect(() => {
    if (groups.size === 0) return;
    setSelectedArea((prev) => {
      const next = { ...prev };
      for (const [sq, g] of groups.entries()) {
        if (!next[sq]) next[sq] = g.areaOrder[0];
      }
      return next;
    });
  }, [groups]);

  useEffect(() => {
    if (groups.size === 0) return;
    setSelectedProduct((prev) => {
      const next = { ...prev };
      for (const [sq, g] of groups.entries()) {
        const ac = selectedArea[sq] ?? g.areaOrder[0];
        const a = g.areas.get(ac);
        if (a) {
          const first = a.productOrder[0];
          const key = `${sq}__${ac}`;
          if (!next[key]) next[key] = first;
        }
      }
      return next;
    });
  }, [groups, selectedArea]);

  const openContactModal = async (ctx: { sq_id: number; product_id: string; supplier_id: string; supplier_name: string }) => {
    const modalKey = keyOf(ctx.sq_id, ctx.product_id, ctx.supplier_id);
    setContacts((prev) => ({ ...prev, [modalKey]: prev[modalKey] ?? { loading: true } }));
    try {
      const res = await fetch(`/api/supplier/${encodeURIComponent(ctx.supplier_id)}/contact`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data: Contact = await res.json();
      setContacts((prev) => ({ ...prev, [modalKey]: { data, loading: false } }));
    } catch {
      setContacts((prev) => ({ ...prev, [modalKey]: { ...(prev[modalKey] ?? {}), loading: false } }));
    }
  };

  const askSpendThenReveal = (ctx: { sq_id: number; product_id: string; supplier_id: string; supplier_name: string }) => {
    setContactModal({ open: true, ctx });
    setConfirmCtx(ctx);
    const sample = rows.find((r) => r.sq_id === ctx.sq_id && r.supplier_id === ctx.supplier_id);
    setConfirmExtra({
      productName: sample?.product_name,
      areaName: sample?.area_name,
      rankNo: sample?.rank_no,
      bestPrice: sample?.price_point === 1,
      qtyMatched: sample?.qty_point === 1,
    });
  };

  const onAcceptDisclaimer = () => {
    if (canAffordReveal(customerToken)) setConfirmOpen(true);
    else setTopupOpen(true);
  };

  const performReveal = async () => {
    const { sq_id, product_id, supplier_id, supplier_name } = confirmCtx;
    if (!sq_id || !product_id || !supplier_id) return;

    if (!canAffordReveal(customerToken)) {
      setConfirmOpen(false);
      setTopupOpen(true);
      return;
    }
    setConfirmOpen(false);

    try {
      const item = rows.find(
        (r) => r.sq_id === sq_id && r.supplier_id === supplier_id && `${r.category_code}|${r.product_name.toLowerCase().trim()}` === String(product_id)
      );
      const item_id = item?.item_id;

      await fetch("/api/results/mark-contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sq_id, item_id, supplier_id }),
      });

      const r = await fetch("/api/tokens/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: customerId, tokens: 1, reason: "get_contact" }),
      });
      const j = await r.json();
      if (typeof j?.token_balance === "number") setCustomerToken(j.token_balance);
      if (j?.error === "insufficient_tokens") {
        setTopupOpen(true);
        return;
      }

      await openContactModal({ sq_id, product_id: String(product_id), supplier_id: String(supplier_id), supplier_name: String(supplier_name) });
    } catch {
      alert("Gagal reveal kontak. Coba lagi.");
    }
  };

  const handleTopUp = async (tokens: number) => {
    if (!customerId || !tokens || tokens < 1) return;
    try {
      const r = await fetch("/api/tokens/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: customerId, tokens, reason: "topup_customer" }),
      });
      const j = await r.json();

      if (typeof j?.token_balance === "number") {
        setCustomerToken(j.token_balance);
      }
      setTopupOpen(false);
    } catch (e: any) {
      alert(String(e?.message || e));
    }
  };

  type DisplayRow = ResultRow & { _display_rank: number; _is_display_winner: boolean };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Result Smart Quote</h1>
            <p className="text-sm text-gray-600">Ringkasan per SQ + detail ranking per Area &amp; Produk.</p>
          </div>
        </div>

        <SectionCard>
          <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56">
                <label className="text-sm text-gray-700">Customer</label>
                <select
                  className="w-full border border-gray-300 rounded-xl p-2 bg-white text-gray-900"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">— pilih customer —</option>
                  {customers.map((c, i) => (
                    <option key={`${c.id}-${i}`} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {customerId && (
                <button
                  onClick={() => {
                    const u = new URL(window.location.href);
                    u.searchParams.set("customer_id", customerId);
                    window.history.replaceState(null, "", u);
                    const ev = new Event("refresh_results");
                    window.dispatchEvent(ev);
                  }}
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                >
                  Refresh
                </button>
              )}
            </div>

            {customerId && (
              <div className="justify-self-end inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white">
                <span className="text-gray-600">Token</span>
                <span className="font-semibold">{typeof customerToken === "number" ? `${customerToken} token` : "…"}</span>
                <button
                  onClick={() => setTopupOpen(true)}
                  className="ml-1 px-2 py-0.5 rounded-full border bg-gray-900 text-white hover:bg-black"
                  title="Top-Up token"
                >
                  + Top-Up
                </button>
              </div>
            )}
          </div>
        </SectionCard>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="h-4 w-40 bg-gray-200 animate-pulse rounded mb-3" />
                {Array.from({ length: 3 }).map((__, j) => (
                  <div key={j} className="h-8 bg-gray-100 animate-pulse rounded mb-2" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* TABEL LIST RINGKAS (per SQ) */}
        {!loading && customerId && (
          <SectionCard>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 sticky top-0 z-10">
                  <tr className="text-left text-[13px]">
                    <th className="p-3 w-14">No</th>
                    <th className="p-3">SQID</th>
                    <th className="p-3">Areas</th>
                    <th className="p-3">Products</th>
                    <th className="p-3">Offers</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...groups.keys()]
                    .sort((a, b) => b - a)
                    .map((sq_id, idx) => {
                      const g = groups.get(sq_id)!;
                      return (
                        <tr key={`row-${sq_id}`} className="border-b border-gray-100 hover:bg-gray-50/60">
                          <td className="p-3">{idx + 1}</td>
                          <td className="p-3 font-medium">#{sq_id}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {g.areaOrder.slice(0, 3).map((ac) => (
                                <span
                                  key={ac}
                                  className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
                                  title={String(g.areas.get(ac)?.areaName ?? ac)}
                                >
                                  {g.areas.get(ac)?.areaName ?? ac}
                                </span>
                              ))}
                              {g.areaOrder.length > 3 && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-500">+{g.areaOrder.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">{g.counts.products}</td>
                          <td className="p-3">{g.counts.offers}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setActiveSQ(sq_id);
                                setModalTop(3);
                                setSortBy("default");
                                setSortDir("asc");
                                setOpenView(true);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {groups.size === 0 && (
                    <tr>
                      <td className="p-4 text-center text-gray-600" colSpan={6}>
                        Belum ada response untuk customer ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* MODAL DETAIL per SQ */}
        {openView &&
          activeSQ !== null &&
          groups.has(activeSQ) &&
          (() => {
            const g = groups.get(activeSQ)!;
            const areaCode = selectedArea[activeSQ] ?? g.areaOrder[0];
            const area = g.areas.get(areaCode)!;
            const prodKeyKey = `${activeSQ}__${areaCode}`;
            const pid = selectedProduct[prodKeyKey] ?? area.productOrder[0];
            const current = area.products[pid];
            let viewItems = [...(current?.items ?? [])];

            const bucket = (x: ResultRow) => {
              const nameOK = x.name_matched === true;
              const qtyFull = Number(x.resp_qty) === Number(x.req_qty);
              if (nameOK && qtyFull) return 0;
              if (qtyFull) return 1;
              if (nameOK) return 2;
              return 3;
            };

            if (sortBy === "price") {
              viewItems.sort((a, b) => (sortDir === "asc" ? a.price - b.price : b.price - a.price));
            } else if (sortBy === "qty") {
              viewItems.sort((a, b) => {
                const d = sortDir === "asc" ? a.resp_qty - b.resp_qty : b.resp_qty - a.resp_qty;
                return d !== 0 ? d : a.price - b.price;
              });
            } else {
              viewItems.sort((a, b) => {
                const ba = bucket(a),
                  bb = bucket(b);
                if (ba !== bb) return ba - bb;

                if (ba === 0 || ba === 1) {
                  const dp = a.price - b.price;
                  if (dp !== 0) return dp;
                } else if (ba === 2) {
                  const dq = b.resp_qty - a.resp_qty;
                  if (dq !== 0) return dq;
                  const dp = a.price - b.price;
                  if (dp !== 0) return dp;
                }

                const dp = a.price - b.price;
                if (dp !== 0) return dp;
                return String(a.supplier_id).localeCompare(String(b.supplier_id));
              });
            }

            const ranked: DisplayRow[] = viewItems.map((row, i) => ({
              ...row,
              _display_rank: i + 1,
              _is_display_winner: i === 0,
            }));

            const sliced: DisplayRow[] = modalTop === "all" ? ranked : ranked.slice(0, modalTop);

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setOpenView(false)} />
                <div className="relative w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-gray-900">Detail Result</h4>
                      <Chip tone="gray">SQ #{activeSQ}</Chip>
                    </div>
                    <button onClick={() => setOpenView(false)} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close">
                      ✕
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Header controls */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-700">Area:</span>
                        <div className="flex gap-2 overflow-x-auto pr-6">
                          {g.areaOrder.map((ac) => {
                            const selected = ac === areaCode;
                            const name = g.areas.get(ac)?.areaName || ac;
                            return (
                              <button
                                key={ac}
                                onClick={() => setSelectedArea((prev) => ({ ...prev, [activeSQ]: ac }))}
                                aria-pressed={selected}
                                className={cx(
                                  "px-3 py-1 rounded-full border text-sm whitespace-nowrap transition",
                                  selected ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-100"
                                )}
                                title={String(name)}
                              >
                                {name} <span className="text-xs text-gray-500">({ac})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="inline-flex rounded-lg border overflow-hidden">
                          {([3, 10, "all"] as const).map((opt) => {
                            const sel = modalTop === opt;
                            return (
                              <button
                                key={`top-${opt}`}
                                onClick={() => setModalTop(opt)}
                                className={`px-3 py-1.5 text-sm ${sel ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-100"}`}
                              >
                                {opt === "all" ? "All" : `Top ${opt}`}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-700">Sort:</span>
                          <button
                            onClick={() => {
                              setSortBy("price");
                              setSortDir((d) => (sortBy === "price" ? (d === "asc" ? "desc" : "asc") : "asc"));
                            }}
                            className={`px-3 py-1.5 rounded-xl border ${sortBy === "price" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-100"}`}
                          >
                            Price {sortBy === "price" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy("qty");
                              setSortDir((d) => (sortBy === "qty" ? (d === "asc" ? "desc" : "asc") : "desc"));
                            }}
                            className={`px-3 py-1.5 rounded-xl border ${sortBy === "qty" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-100"}`}
                          >
                            Qty {sortBy === "qty" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy("default");
                              setSortDir("asc");
                            }}
                            className={`px-3 py-1.5 rounded-xl border ${sortBy === "default" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-100"}`}
                          >
                            Default
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Product picker */}
                    <div className="border-b pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-700 pt-0.5">Product Name:</span>
                        <div className="flex-1 min-w-[240px]">
                          <ProductPicker
                            products={area.products}
                            order={area.productOrder}
                            active={pid}
                            onChange={(p) => setSelectedProduct((prev) => ({ ...prev, [prodKeyKey]: p }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ranking table */}
                    <div className="overflow-x-auto">
                      <div className="text-sm text-gray-700 mb-2">
                        Area:{" "}
                        <span className="font-medium">
                          {area.areaName} ({areaCode})
                        </span>{" "}
                        • Product: <span className="font-medium">{current?.name}</span>{" "}
                        <span className="text-gray-500">({pid})</span>
                      </div>
                      <table className="min-w-[980px] w-full text-sm text-gray-900">
                        <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 sticky top-0 z-10">
                          <tr className="text-left">
                            <th className="p-2">Rank</th>
                            <th className="p-2">Supplier</th>
                            <th className="p-2">SQID</th>
                            <th className="p-2">Product Request</th>
                            <th className="p-2">Product Response</th>
                            <th className="p-2 text-right">Qty (req / resp)</th>
                            <th className="p-2 text-right">Price</th>
                            <th className="p-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sliced.map((it) => {
                            const rowKey = keyOf(activeSQ, pid, it.supplier_id);
                            const hasContact = !!contacts[rowKey]?.data;

                            const showBestMatch = sortBy === "default" && it._display_rank === 1;
                            const showBestQty = sortBy === "qty" && it._display_rank === 1;
                            const showBestPrice = sortBy === "price" && it._display_rank === 1;

                            return (
                              <tr
                                key={`${it.supplier_id}-${it._display_rank}-${pid}`}
                                className={cx("border-t transition-colors", it._is_display_winner ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-gray-50")}
                              >
                                <td className="p-2 font-semibold">
                                  {it._display_rank === 1 ? "🥇" : it._display_rank === 2 ? "🥈" : it._display_rank === 3 ? "🥉" : ""} {it._display_rank}
                                </td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{hasContact ? it.supplier_name : mask(it.supplier_name)}</span>
                                  </div>
                                </td>
                                <td className="p-2">#{it.sq_id}</td>
                                <td className="p-2">
                                  <div className="font-medium">{it.product_name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {it.req_note ? (
                                      <>
                                        note: <span className="italic">{it.req_note}</span>
                                      </>
                                    ) : (
                                      <span className="italic text-gray-400">—</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2">
                                  <div className="font-medium">{it.resp_product_name || <span className="italic text-gray-400">—</span>}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {it.resp_note ? (
                                      <>
                                        note: <span className="italic">{it.resp_note}</span>
                                      </>
                                    ) : (
                                      <span className="italic text-gray-400">—</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 text-right">
                                  {it.req_qty} / <span className="text-gray-900">{it.resp_qty}</span>
                                  {showBestMatch && <Pill className="bg-amber-600/10 text-amber-700 ml-2">Best match</Pill>}
                                  {showBestQty && <Pill className="bg-emerald-600/10 text-emerald-700 ml-2">Best qty</Pill>}
                                  {showBestPrice && <Pill className="bg-blue-600/10 text-blue-700 ml-2">Best price</Pill>}
                                </td>
                                <td className="p-2 text-right">
                                  <div className="font-medium">{formatIDR(it.price)}</div>
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() =>
                                      hasContact
                                        ? setContactModal({
                                            open: true,
                                            ctx: { sq_id: activeSQ, product_id: pid, supplier_id: it.supplier_id, supplier_name: it.supplier_name },
                                          })
                                        : askSpendThenReveal({
                                            sq_id: activeSQ,
                                            product_id: pid,
                                            supplier_id: it.supplier_id,
                                            supplier_name: it.supplier_name,
                                          })
                                    }
                                    className={cx(
                                      "px-3 py-1.5 rounded-xl transition",
                                      hasContact
                                        ? "bg-white border hover:bg-gray-100"
                                        : it._is_display_winner
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-white border hover:bg-gray-100"
                                    )}
                                  >
                                    {hasContact ? "View Contact" : "Get Contact"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setOpenView(false)}
                        className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>

      {/* ==== Modal Kontak (kiri info, kanan disclaimer) ==== */}
      <SupplierContactModal
        open={contactModal.open}
        onClose={() => setContactModal({ open: false })}
        revealed={hasContactFor(contactModal.ctx?.sq_id, contactModal.ctx?.product_id, contactModal.ctx?.supplier_id)}
        supplierName={contactModal.ctx?.supplier_name || ""}
        contact={
          (() => {
            const k = contactModal.ctx ? keyOf(contactModal.ctx.sq_id, contactModal.ctx.product_id, contactModal.ctx.supplier_id) : "";
            return k ? (contacts[k]?.data as Contact | undefined) : undefined;
          })()
        }
        disclaimerTitle="Disclaimer"
        disclaimerBody={undefined}
        onAcceptDisclaimer={onAcceptDisclaimer}
        acceptDisabled={false}
      />

      {/* ==== Top-Up & Konfirmasi Token ==== */}
      <TopUpModal open={topupOpen} onClose={() => setTopupOpen(false)} onConfirm={handleTopUp} currentTokens={customerToken ?? 0} />
      <ConfirmSpendModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={performReveal}
        tokens={REVEAL_COST_TOKENS}
        currentTokens={customerToken ?? 0}
        productName={confirmExtra?.productName}
        areaName={confirmExtra?.areaName}
        rankNo={confirmExtra?.rankNo}
        bestPrice={confirmExtra?.bestPrice}
        qtyMatched={confirmExtra?.qtyMatched}
      />
    </div>
  );
}
