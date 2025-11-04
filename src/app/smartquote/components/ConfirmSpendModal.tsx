"use client";
import React from "react";

export default function ConfirmSpendModal({
  open, onClose, onConfirm,
  tokens, currentTokens,
  productName, areaName, rankNo, bestPrice, qtyMatched,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  tokens: number;                 
  currentTokens?: number;         
  productName?: string;
  areaName?: string;
  rankNo?: number;
  bestPrice?: boolean;
  qtyMatched?: boolean;
  onTopUp?: () => void;
}) {
  if (!open) return null;

  const after = Math.max(0, (currentTokens ?? 0) - (tokens ?? 0));
  const insufficient = (currentTokens ?? 0) < (tokens ?? 0);
  const idr = (n?: number) => `≈ Rp ${(n ?? 0).toLocaleString("id-ID")}`;

  const Badge = ({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray"|"blue"|"green"|"amber" }) => {
    const tones: Record<string,string> = {
      gray: "bg-gray-100 text-gray-800",
      blue: "bg-blue-100 text-blue-800",
      green: "bg-emerald-100 text-emerald-800",
      amber: "bg-amber-100 text-amber-800",
    };
    return <span className={`px-2 py-0.5 rounded-full text-[12px] ${tones[tone]}`}>{children}</span>;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Konfirmasi Penggunaan Token</h3>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {(productName || areaName || rankNo !== undefined) && (
            <div className="rounded-xl border p-3 bg-gray-50/60">
              <div className="text-gray-700 mb-2">Anda akan membuka kontak kandidat berikut:</div>
              <div className="flex flex-wrap items-center gap-2">
                {rankNo !== undefined && <Badge tone="amber">Rank #{rankNo}</Badge>}
                {bestPrice && <Badge tone="green">Best price</Badge>}
                {qtyMatched && <Badge tone="blue">Qty match</Badge>}
              </div>
              <div className="mt-2 text-[13px] text-gray-700">
                {productName && <>Produk: <span className="font-medium">{productName}</span></>}
                {productName && areaName && <span> • </span>}
                {areaName && <>Area: <span className="font-medium">{areaName}</span></>}
              </div>
              <div className="mt-1 text-[12px] text-gray-500">
                *Nama supplier akan terlihat setelah Anda melanjutkan.
              </div>
            </div>
          )}

          <p className="text-gray-700">
            Token yang akan digunakan: <span className="font-semibold">{tokens} IronAsia Token</span>{" "}
            <span className="text-gray-500">({idr(tokens * 1000)})</span>
          </p>

          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex justify-between">
              <span>Saldo sekarang</span>
              <span className="font-medium">{currentTokens ?? 0} token</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya</span>
              <span className="font-medium">– {tokens} token</span>
            </div>
            <div className="mt-2 border-t pt-2 flex justify-between">
              <span>Saldo setelah transaksi</span>
              <span className="font-semibold">{after} token</span>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              {idr(after * 1000)} setelah transaksi
            </div>
          </div>

          {insufficient && (
            <div className="text-red-600 text-sm">Saldo token tidak cukup. Silakan Top-Up.</div>
          )}
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded border hover:bg-gray-50">Batal</button>
          <button
            disabled={insufficient}
            onClick={async () => { await onConfirm(); onClose(); }}
            className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Ya, gunakan {tokens} token
          </button>
        </div>
      </div>
    </div>
  );
}
