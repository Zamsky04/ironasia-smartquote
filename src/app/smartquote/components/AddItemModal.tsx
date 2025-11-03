import React, { useEffect, useMemo, useState } from "react";

type Option = { value: string|number; label: string };

export default function AddItemModal({ open, onClose, sqid, onSaved, createdBy }: {
  open: boolean; onClose: () => void; sqid: string | number; onSaved: (newItem: any) => void; createdBy: string;
}) {
  const [categories, setCategories] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);               // ⬅️
  const [form, setForm] = useState({
    category_code: "",
    product_name: "",
    size: "",              
    unit_id: "",          
    quantity: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const cat = await fetch("/api/master/categories").then(r => r.json());
      setCategories(cat.map((c: any) => ({ value: c.category_id, label: c.category_name })));

      const un = await fetch("/api/master/units").then(r => r.json());
      setUnits(un.map((u: any) => ({ value: u.unit_id, label: u.unit_name })));
    })();
  }, [open]);

  const canSave = useMemo(() => {
    return !!form.category_code && !!form.product_name.trim()
      && !!form.unit_id && !!form.quantity && Number(form.quantity) > 0;
  }, [form]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/smart-quotes/${sqid}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_code: Number(form.category_code),
          unit_id: Number(form.unit_id),                
          product_name: form.product_name.trim(),
          size: form.size || null,                    
          quantity: Number(form.quantity),
          note: form.note || null,
          created_by: createdBy,
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onSaved(data.item);
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-2xl p-5 shadow-xl text-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Item</h3>
          <button onClick={onClose} className="px-2 py-1">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">Product</label>
            <select
              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
              value={form.category_code}
              onChange={e => setForm(prev => ({ ...prev, category_code: e.target.value }))}>
              <option value="">-- Select --</option>
              {categories.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Product name (free text)</label>
            <input
              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
              value={form.product_name}
              onChange={e => setForm(prev => ({ ...prev, product_name: e.target.value }))}
              placeholder="contoh: Excavator Bucket 1.5"
            />
          </div>

          {/* Size + Unit dalam satu kolom */}
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Size & Unit</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded p-2 bg-white text-gray-900"
                value={form.size}
                onChange={e => setForm(prev => ({ ...prev, size: e.target.value }))}
                placeholder="contoh: 1.5 / 50 / 100"
              />
              <select
                className="w-40 border border-gray-300 rounded p-2 bg-white text-gray-900"
                value={form.unit_id}
                onChange={e => setForm(prev => ({ ...prev, unit_id: e.target.value }))}>
                <option value="">Unit…</option>
                {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Isi angka/teks di “Size”, pilih satuan di dropdown.</p>
          </div>

          <div>
            <label className="text-sm text-gray-700">Quantity</label>
            <input
              type="number" min={1}
              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
              value={form.quantity}
              onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Note (opsional)</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
              rows={2}
              value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded border border-gray-300 text-gray-900 bg-white">Cancel</button>
          <button onClick={save} disabled={!canSave || saving}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

