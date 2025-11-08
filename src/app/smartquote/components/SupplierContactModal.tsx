"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

export type Contact = {
  user_id: string;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  office_phone?: string | null;
};

type RowProps = {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
  masked?: boolean;
  copyable?: boolean;
};
function InfoRow({ icon, label, value, masked, copyable }: RowProps) {
  const shown = (value ?? "") || "Not available";
  const mask = (v: string) =>
    v.replace(/(.{2}).+(.{2})/, (_m, a, b) => a + "•".repeat(Math.max(4, v.length - 4)) + b);

  const canCopy = copyable && !!value && !masked;

  return (
    <div className="grid grid-cols-[20px_1fr] gap-3 py-2">
      <div className="flex items-start justify-center text-blue-600">{icon}</div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-sm font-medium break-words">
            {masked ? mask(String(value ?? "")) : shown}
          </div>
        </div>
        <button
          disabled={!canCopy}
          onClick={() => navigator.clipboard.writeText(String(value))}
          className={
            "text-xs rounded-full border px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          }
          aria-label={`Copy ${label}`}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-200 my-3" />;
}

type ModalProps = {
  open: boolean;
  onClose: () => void;

  /** apakah data kontak sudah di-reveal (setelah potong token) */
  revealed: boolean;

  /** data supplier untuk panel kiri */
  supplierName: string;
  contact?: Contact;

  /** panel kanan: disclaimer texts (boleh panjang) */
  disclaimerTitle?: string;
  disclaimerBody?: React.ReactNode;

  /** kontrol alur: user harus scroll ke bawah sebelum bisa centang */
  onAcceptDisclaimer: () => void;
  acceptDisabled?: boolean; // true kalau saldo tidak cukup → tombol Accept disabled (opsional)
};

export default function SupplierContactModal({
  open,
  onClose,
  revealed,
  supplierName,
  contact,
  disclaimerTitle = "Disclaimer",
  disclaimerBody,
  onAcceptDisclaimer,
  acceptDisabled,
}: ModalProps) {
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

  return !open ? null : (
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
              {disclaimerBody ?? (
                <DefaultDisclaimer />
              )}
            </div>

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

            {!revealed && (
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
            )}
          </div>
        </div>
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
      <p>Terjemahan ringkas bahasa Indonesia disarankan bila target user lokal, atau ganti dengan teks panjangmu sendiri.</p>
    </div>
  );
}
