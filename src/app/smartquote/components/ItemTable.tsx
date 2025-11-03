import React, { useEffect, useMemo, useState } from "react";
import AddItemModal from "./AddItemModal";

type BlastRow = {
  blast_id: number;
  sq_id: number;
  area_code: number;
  category_code: number;
  supplier_id: string;
  created_date: string;
};

export default function ItemTable({ sq }: { sq: any }) {
  const [open, setOpen] = useState(false);
  const [blasts, setBlasts] = useState<BlastRow[] | null>(null);
  const [loadingBlast, setLoadingBlast] = useState(false);
  const [errorBlast, setErrorBlast] = useState<string | null>(null);

  const [items, setItems] = useState<any[]>(sq.items ?? []);

  useEffect(() => {
    setItems(sq.items ?? []);
  }, [sq.sq_id]);

  const hydrateItems = async () => {
    try {
      const res = await fetch(`/api/smart-quotes/list?customer_id=${sq.customer_id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const list = await res.json();
      const meId = Number(sq.sq_id);
      const found = Array.isArray(list) ? list.find((r: any) => Number(r.sq_id) === meId) : null;
      if (found?.items) setItems(found.items);
    } catch (e) { console.warn("Hydrate items failed:", e); }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoadingBlast(true);
        setErrorBlast(null);
        const res = await fetch(`/api/blast?sq_id=${sq.sq_id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const rows: BlastRow[] = await res.json();
        if (!ignore) setBlasts(rows);
      } catch (e: any) {
        if (!ignore) setErrorBlast(e?.message || "Failed load blast");
      } finally {
        if (!ignore) setLoadingBlast(false);
      }
    })();
    return () => { ignore = true; };
  }, [sq.sq_id]);

  const derivedStatus: "approved" | "rejected" | "checking" = useMemo(() => {
    if (loadingBlast || blasts === null) return "checking";
    return (blasts.length > 0) ? "approved" : "rejected";
  }, [loadingBlast, blasts]);

  const StatusBadge = () => {
    if (derivedStatus === "checking") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
          <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-gray-500" /> Checking…
        </span>
      );
    }
    if (derivedStatus === "approved") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Approved (by blast)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Rejected (no blast)
      </span>
    );
  };

  const approveDisabled = derivedStatus === "approved" || loadingBlast;

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Items</h3>
          <StatusBadge />
          {errorBlast && (
            <span className="text-xs text-red-600">(blast error: {errorBlast})</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Add Item
          </button>

          <button
            disabled={approveDisabled}
            title={approveDisabled ? "Sudah Approved (blast ada) atau sedang cek" : "Approve & Blast"}
            onClick={async () => {
              try {
                const res = await fetch(`/api/smart-quotes/${sq.sq_id}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "approved", updated_by: "admin" }),
                });
                if (!res.ok) {
                  const t = await res.text();
                  console.error("Approve failed:", t);
                  alert("Approve gagal: " + t);
                  return;
                }

                setBlasts(null);
                setLoadingBlast(true);
                const r2 = await fetch(`/api/blast?sq_id=${sq.sq_id}`, { cache: "no-store" });
                const rows2: BlastRow[] = r2.ok ? await r2.json() : [];
                setBlasts(rows2);
                setLoadingBlast(false);
              } catch (err) {
                console.error(err);
                alert("Network/JS error: " + String(err));
              }
            }}
            className={`px-3 py-1 rounded text-white ${approveDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          >
            Send Quotation (Approve)
          </button>
        </div>
      </div>

      <table className="w-full border border-gray-200 text-sm text-gray-900">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Product Name</th>
            <th className="p-2 text-left">Size</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-left">Note</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it: any) => (
            <tr key={it.item_id ?? `${it.category_id}|${it.product_name}`} className="border-t">
              <td className="p-2">{it.category_name || it.category_id || "-"}</td>
              <td className="p-2">{it.product_name || "-"}</td>
              <td className="p-2">{it.size || "-"}</td>
              <td className="p-2 text-right">{it.quantity}</td>
              <td className="p-2">{it.note || "-"}</td>
              <td className="p-2">{it.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <AddItemModal
          open={true}
          onClose={() => setOpen(false)}
          sqid={sq.sq_id}
          onSaved={async (newItem) => {
            setItems(prev => [...prev, newItem]); // tampil instan
            await hydrateItems();                 // re-hydrate label kategori
          }}
          createdBy={sq.customer_id}
        />
      )}
    </div>
  );
}
