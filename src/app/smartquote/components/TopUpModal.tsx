"use client";
import React, { useEffect, useMemo, useState } from "react";

export default function TopUpModal({
  open, onClose, onConfirm, currentBalance = 0,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void> | void;
  currentBalance?: number;
}) {
  const [raw, setRaw] = useState("5000");
  const parseIDR = (s: string) => {
    const d = s.replace(/[^\d]/g, "");
    return d ? Math.max(0, parseInt(d, 10)) : 0;
  };
  const formatIDR = (n: number) => !n ? "" : `Rp ${n.toLocaleString("id-ID")}`;
  const amount = useMemo(() => parseIDR(raw), [raw]);
  const after = Math.max(0, (currentBalance ?? 0) + amount);

  useEffect(() => {
    if (!open) setRaw("5000");
  }, [open]);

  if (!open) return null;

  const chips = [5000, 10000, 25000, 50000, 100000];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Top-Up Saldo</h3>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="text-gray-600">Saldo saat ini</div>
          <div className="text-2xl font-semibold">{formatIDR(currentBalance)}</div>

          <label className="block">
            <span className="text-gray-700">Nominal Top-Up</span>
            <input
              inputMode="numeric"
              placeholder="Rp 0"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-base"
              value={raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".").replace(/^/, "Rp ")}
              onChange={(e) => setRaw(e.target.value)}
              onFocus={(e) => {
                const clean = parseIDR(e.target.value);
                setRaw(String(clean || ""));
              }}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {chips.map(c => (
              <button
                key={c}
                onClick={() => setRaw(String(c))}
                className="px-3 py-1 rounded-full border bg-white hover:bg-gray-50 text-sm"
              >
                {(c).toLocaleString("id-ID",{style:"currency", currency:"IDR"})}
              </button>
            ))}
          </div>

          <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex justify-between">
              <span>Setelah Top-Up</span>
              <span className="font-medium">{formatIDR(after)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded border hover:bg-gray-50">Batal</button>
          <button
            disabled={!amount || amount < 5000}
            onClick={async () => { await onConfirm(amount); onClose(); }}
            className="px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-black disabled:opacity-50"
          >
            Top-Up {amount ? `(${(amount).toLocaleString("id-ID",{style:"currency", currency:"IDR"})})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
