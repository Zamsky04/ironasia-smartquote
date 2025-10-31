import React, { useEffect, useMemo, useState } from "react";

type Option = { value: string|number; label: string };

export default function AddItemModal({
   open, onClose, sqid, onSaved, createdBy,   
}: {
  open: boolean;
  onClose: () => void;
  sqid: string | number;
  onSaved: (newItem: any) => void;
  createdBy: string;                          
}) {
  const [categories, setCategories] = useState<Option[]>([]);
  const [subcategories, setSubcategories] = useState<Option[]>([]);
  const [products, setProducts] = useState<Option[]>([]);

  const [form, setForm] = useState({
    category_id: "",
    sub_category_id: "",
    product_id: "",
    size: "",
    quantity: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const cat = await fetch("/api/master/categories").then(r => r.json());
      setCategories(cat.map((c: any) => ({ value: c.category_id, label: c.category_name })));
    })();
  }, [open]);

  useEffect(() => {
    if (!form.category_id) { setSubcategories([]); return; }
    (async () => {
      const url = `/api/master/subcategories?category_id=${form.category_id}`;
      const sub = await fetch(url).then(r => r.json());
      setSubcategories(sub.map((s: any) => ({ value: s.sub_category_id, label: s.sub_category_name })));
    })();
  }, [form.category_id]);

  useEffect(() => {
    const qs: string[] = [];
    if (form.category_id) qs.push(`category_id=${form.category_id}`);
    if (form.sub_category_id) qs.push(`sub_category_id=${form.sub_category_id}`);
    const url = `/api/master/products${qs.length ? `?${qs.join("&")}` : ""}`;

    (async () => {
      const prod = await fetch(url, { cache: "no-store" }).then(r => r.json());

      // Safety dedup by lower(product_name)
      const byName = new Map<string, any>();
      for (const p of prod) {
        const key = String(p.product_name || "").toLowerCase().trim();
        if (!byName.has(key)) byName.set(key, p); // ambil yang pertama
      }

      const opts = Array.from(byName.values()).map((p: any) => ({
        value: p.product_id,
        label: p.product_name
      }));

      setProducts(opts);
    })();
  }, [form.category_id, form.sub_category_id]);

  const canSave = useMemo(() => {
    return !!form.product_id && !!form.quantity && Number(form.quantity) > 0;
  }, [form]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/smart-quotes/${sqid}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // ✅ penting
        body: JSON.stringify({
          product_id: form.product_id,
          size: form.size || null,
          quantity: Number(form.quantity),
          note: form.note || null,
          created_by: createdBy,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to save item");
      }

      // ✅ biarkan parent yang re-fetch list item
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
            <select className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
              value={form.category_id}
              onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value, sub_category_id: "", product_id: "" }))}>
              <option value="">-- Select --</option>
              {categories.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Sub Category</label>
            <select className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
              value={form.sub_category_id}
              onChange={e => setForm(prev => ({ ...prev, sub_category_id: e.target.value, product_id: "" }))}
              disabled={!form.category_id}
            >
              <option value="">-- Select --</option>
              {subcategories.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Product</label>
            <select className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
              value={form.product_id}
              onChange={e => setForm(prev => ({ ...prev, product_id: e.target.value }))}
              disabled={!form.category_id}
            >
              <option value="">-- Select --</option>
              {products.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Size (opsional)</label>
            <input className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" value={form.size}
              onChange={e => setForm(prev => ({ ...prev, size: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Quantity</label>
            <input type="number" min={1} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" value={form.quantity}
              onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Note (opsional)</label>
            <textarea className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" rows={2} value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded border border-gray-300 text-gray-900 bg-white">Cancel</button>
          <button
            onClick={save}
            disabled={!canSave || saving}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}