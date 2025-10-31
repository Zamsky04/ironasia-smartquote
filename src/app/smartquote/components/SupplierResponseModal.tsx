"use client";
import React, { useEffect, useState } from "react";

type InboxRow = {
  blast_id: number;
  sq_id: number;
  customer_id: string;
  customer_name: string;
  area_code: number;
  area_name: string;
  product_id: string;
  product_name: string;
  requested_qty: number;

  response_qty?: number | null;
  response_price?: number | null;
  response_note?: string | null;
};

export default function SupplierResponseModal({
  open,
  onClose,
  row,
  supplierId,
  onSubmitted
}: {
  open: boolean;
  onClose: () => void;
  row: InboxRow | null;
  supplierId: string;
  onSubmitted?: () => void;
}) {
  const [quantity, setQuantity] = useState<number>(row?.response_qty || row?.requested_qty || 1);
  const [price, setPrice] = useState<number>(row?.response_price || 0);
  const [note, setNote] = useState<string>(row?.response_note || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!row) return;
    setQuantity(row.response_qty ?? row.requested_qty ?? 1);
    setPrice(row.response_price ?? 0);
    setNote(row.response_note ?? "");
  }, [row]);

  if (!open || !row) return null;

  const submit = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/smart-quotes/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sq_id: row.sq_id,
          customer_id: row.customer_id,
          area_code: row.area_code,
          supplier_id: supplierId,
          product_id: row.product_id,
          quantity,
          price,
          note,            // kalau function tidak pakai note, boleh diabaikan server-side
          created_by: supplierId,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        alert("Gagal submit response: " + t);
        return;
      }
      onClose();
      onSubmitted?.();   // ← ini akan reload list di halaman
    } catch (e: any) {
      alert(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const formatIDR = (n: number | null | undefined) =>
    !n || n <= 0 ? "" : `Rp ${n.toLocaleString("id-ID")}`;

    // Parse: "Rp 1.234.567" / "1.234.567" -> 1234567
    const parseIDR = (s: string) => {
    const digits = s.replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : 0;
    };

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-lg">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">{row.response_price ? "Edit Response" : "Response Quotation"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>

        <div className="p-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-500">SQ ID</div>
              <div className="font-medium">{row.sq_id}</div>
            </div>
            <div>
              <div className="text-gray-500">Customer</div>
              <div className="font-medium">{row.customer_name} ({row.customer_id})</div>
            </div>
            <div>
              <div className="text-gray-500">Area</div>
              <div className="font-medium">{row.area_name} ({row.area_code})</div>
            </div>
            <div>
              <div className="text-gray-500">Product</div>
              <div className="font-medium">{row.product_name} ({row.product_id})</div>
            </div>
            <div>
              <div className="text-gray-500">Requested Qty</div>
              <div className="font-medium">{row.requested_qty ?? "-"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-gray-600">Offer Quantity</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded border px-2 py-1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
            <label className="block">
                <span className="text-gray-600">Offer Price</span>
                <input
                    type="text"
                    inputMode="numeric"
                    className="mt-1 w-full rounded border px-2 py-1"
                    placeholder="Rp 0"
                    value={formatIDR(price)}
                    onChange={(e) => {
                    const val = parseIDR(e.target.value);
                    setPrice(val);
                    }}
                    onBlur={() => {
                    // minimal 1 rupiah biar tombol enable; sesuaikan kalau mau 1000 min
                    if (!price || price < 1) setPrice(1);
                    }}
                />
            </label>
          </div>

          <label className="block">
            <span className="text-gray-600">Note (optional)</span>
            <input
              type="text"
              className="mt-1 w-full rounded border px-2 py-1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan untuk customer"
            />
          </label>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border hover:bg-gray-50" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            disabled={loading || !quantity || !price}
          >
            {loading ? "Saving..." : (row.response_price ? "Update Response" : "Submit Response")}
          </button>
        </div>
      </div>
    </div>
  );
}
