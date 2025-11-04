"use client";
import React, { useEffect, useMemo, useState } from "react";

export default function TopUpModal({
  open, onClose, onConfirm, currentTokens = 0,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (tokens: number) => Promise<void> | void; 
  currentTokens?: number;
}) {
  const [raw, setRaw] = useState("5");
  const parseIntOnly = (s: string) => {
    const d = s.replace(/[^\d]/g, "");
    return d ? Math.max(0, parseInt(d, 10)) : 0;
  };
  const tokens = useMemo(() => parseIntOnly(raw), [raw]);
  const after = Math.max(0, (currentTokens ?? 0) + tokens);

  useEffect(() => { if (!open) setRaw("5"); }, [open]);
  if (!open) return null;

  const chips = [5, 10, 25, 50, 100]; 

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Top-Up IronAsia Token</h3>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="text-gray-600">Saldo saat ini</div>
          <div className="text-2xl font-semibold">{currentTokens} token</div>
          <div className="text-[12px] text-gray-500">≈ Rp {(currentTokens*1000).toLocaleString("id-ID")}</div>

          <label className="block">
            <span className="text-gray-700">Jumlah Token</span>
            <input
              inputMode="numeric"
              placeholder="0"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-base"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onFocus={(e) => setRaw(parseIntOnly(e.target.value) ? String(parseIntOnly(e.target.value)) : "")}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {chips.map(c => (
              <button
                key={c}
                onClick={() => setRaw(String(c))}
                className="px-3 py-1 rounded-full border bg-white hover:bg-gray-50 text-sm"
              >
                {c} token (≈ Rp {(c*1000).toLocaleString("id-ID")})
              </button>
            ))}
          </div>

          <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex justify-between">
              <span>Tagihan</span>
              <span className="font-medium">Rp {(tokens*1000).toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span>Saldo setelah Top-Up</span>
              <span className="font-medium">{after} token</span>
            </div>
            <div className="text-[11px] text-gray-500">
              ≈ Rp {(after*1000).toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded border hover:bg-gray-50">Batal</button>
          <button
            disabled={!tokens || tokens < 1}
            onClick={async () => { await onConfirm(tokens); onClose(); }}
            className="px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-black disabled:opacity-50"
          >
            Top-Up {tokens} token (Rp {(tokens*1000).toLocaleString("id-ID")})
          </button>
        </div>
      </div>
    </div>
  );
}
