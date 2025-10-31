"use client";
import React, { useEffect, useState } from "react";

type Opt = { value: string|number; label: string };

export default function HeaderNewSQModal({
  open,
  onClose,
  customerId,
  onCreated, // (newSqId: number) => void
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onCreated: (sqid: number) => void;
}) {
  const [areas, setAreas] = useState<Opt[]>([]);
  const [areaCode, setAreaCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const ars = await fetch("/api/master/areas").then(r => r.json());
      setAreas(ars.map((a: any) => ({ value: a.area_code, label: a.area_name })));
    })();
  }, [open]);

  const submit = async () => {
    if (!customerId || !areaCode) return;
    setLoading(true);
    const res = await fetch("/api/smart-quotes", {
      method: "POST",
      body: JSON.stringify({
        customer_id: customerId,
        area_code: Number(areaCode),
        created_by: customerId,
      }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    onCreated(Number(data.sqid));
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-lg p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Quotation</h3>
          <button className="px-2 py-1" onClick={onClose}>✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-700">Customer</label>
            <input
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
              value={customerId}
              disabled
            />
          </div>
          <div>
            <label className="text-sm text-gray-700">Area</label>
            <select
              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
            >
              <option value="">-- Select Area --</option>
              {areas.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded border border-gray-300">Cancel</button>
          <button
            onClick={submit}
            disabled={!areaCode || loading}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
