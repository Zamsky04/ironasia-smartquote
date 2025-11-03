"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Opt = { value: string|number; label: string };

export default function HeaderNewSQModal({
  open, onClose, customerId, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onCreated: (sqid: number) => void;
}) {
  const [areas, setAreas] = useState<Opt[]>([]);
  const [query, setQuery] = useState("");
  const [areaCodes, setAreaCodes] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const ars = await fetch("/api/master/areas").then(r => r.json());
      setAreas(ars.map((a: any) => ({ value: String(a.area_code), label: a.area_name })));
    })();
  }, [open]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? areas.filter(a => a.label.toLowerCase().includes(q)) : areas;
  }, [areas, query]);

  const toggleArea = (val: string) => {
    setAreaCodes(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const removeArea = (val: string) => setAreaCodes(prev => prev.filter(v => v !== val));
  const clearAreas = () => setAreaCodes([]);

  const labelFor = (val: string) => areas.find(a => String(a.value) === val)?.label ?? val;

  const submit = async () => {
    if (!customerId || areaCodes.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/smart-quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        area_codes: areaCodes.map(Number), 
        created_by: customerId,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const t = await res.text();
      alert(`Create failed: ${t}`);
      return;
    }
    const data = await res.json();
    onCreated(Number(data.sqid));
    setAreaCodes([]);
    setQuery("");
    setMenuOpen(false);
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

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700">Customer</label>
            <input className="w-full border border-gray-300 rounded p-2 bg-gray-100" value={customerId} disabled />
          </div>

          {/* Multi-select dropdown */}
          <div ref={menuRef}>
            <label className="text-sm text-gray-700">Area</label>
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 flex justify-between items-center"
            >
              <span className="truncate">
                {areaCodes.length ? `${areaCodes.length} selected` : "Select areas…"}
              </span>
              <span>▾</span>
            </button>

            {menuOpen && (
              <div className="mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                <div className="p-2 border-b">
                  <input
                    placeholder="Search…"
                    className="w-full border border-gray-200 rounded p-2"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-56 overflow-auto p-1">
                  {filtered.map(a => {
                    const val = String(a.value);
                    const checked = areaCodes.includes(val);
                    return (
                      <label
                        key={`area-${val}`}
                        className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArea(val)}
                        />
                        <span className="text-sm">{a.label}</span>
                      </label>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="p-3 text-sm text-gray-500">No results</div>
                  )}
                </div>

                <div className="flex items-center justify-between px-3 py-2 border-t">
                  <button className="text-sm px-3 py-1 rounded border" onClick={clearAreas}>Clear</button>
                  <button className="text-sm px-3 py-1 rounded bg-blue-600 text-white" onClick={() => setMenuOpen(false)}>Done</button>
                </div>
              </div>
            )}
          </div>

          {/* Chips terpilih */}
          {areaCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {areaCodes.map((v) => (
                <span key={`chip-${v}`} className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {labelFor(v)}
                  <button
                    className="ml-1 text-blue-700 hover:text-blue-900"
                    onClick={() => removeArea(v)}
                    aria-label={`Remove ${labelFor(v)}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded border border-gray-300">Cancel</button>
          <button
            onClick={submit}
            disabled={areaCodes.length === 0 || loading} 
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
