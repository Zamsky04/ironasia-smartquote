"use client";
import React from "react";

export default function ConfirmSpendModal({
  open, onClose, onConfirm,
  price, currentBalance,
  productName, areaName, rankNo, bestPrice, qtyMatched,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  price: number;                 
  currentBalance?: number;

  // teaser (opsional)
  productName?: string;
  areaName?: string;
  rankNo?: number;              
  bestPrice?: boolean;           
  qtyMatched?: boolean;          
}) {
  if (!open) return null;

  const fmt = (n?: number) =>
    typeof n === "number" ? `Rp ${n.toLocaleString("id-ID")}` : "Rp 0";
  const after = Math.max(0, (currentBalance ?? 0) - (price ?? 0));
  const insufficient = (currentBalance ?? 0) < (price ?? 0);

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
          <h3 className="font-semibold text-gray-900">Konfirmasi Penggunaan Saldo</h3>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {/* Teaser tanpa menyebut nama supplier */}
          {(productName || areaName || rankNo !== undefined) && (
            <div className="rounded-xl border p-3 bg-gray-50/60">
              <div className="text-gray-700 mb-2">Anda akan membuka kontak untuk kandidat berikut:</div>
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
                *Identitas supplier akan terlihat setelah Anda melanjutkan.
              </div>
            </div>
          )}

          <p className="text-gray-700">
            Saldo yang akan digunakan: <span className="font-semibold">{fmt(price)}</span>
          </p>

          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex justify-between">
              <span>Saldo sekarang</span>
              <span className="font-medium">{fmt(currentBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya</span>
              <span className="font-medium">– {fmt(price)}</span>
            </div>
            <div className="mt-2 border-t pt-2 flex justify-between">
              <span>Saldo setelah transaksi</span>
              <span className="font-semibold">{fmt(after)}</span>
            </div>
          </div>

          {insufficient && (
            <div className="text-red-600 text-sm">
              Saldo tidak cukup. Silakan Top-Up terlebih dahulu.
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded border hover:bg-gray-50">Batal</button>
          <button
            disabled={insufficient}
            onClick={async () => { await onConfirm(); onClose(); }}
            className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Ya, gunakan {fmt(price)}
          </button>
        </div>
      </div>
    </div>
  );
}
