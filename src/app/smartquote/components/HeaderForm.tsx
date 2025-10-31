import React, { useEffect, useState } from "react";

type Opt = { value: string|number; label: string; role?: string };

export default function HeaderForm({ onCreated }: { onCreated: () => void }) {
  const [customers, setCustomers] = useState<Opt[]>([]);
  const [areas, setAreas] = useState<Opt[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const cs = await fetch("/api/master/customers").then(r => r.json());
      // Safety filter di FE juga, just in case
      const onlyCustomers = cs.filter((c: any) => c.role === 'customer');
      setCustomers(onlyCustomers.map((c: any) => ({ value: c.user_id, label: c.name })));
      const ars = await fetch("/api/master/areas").then(r => r.json());
      setAreas(ars.map((a: any) => ({ value: a.area_code, label: a.area_name })));
    })();
  }, []);

  const createSQ = async () => {
    if (!customerId || !areaCode) return;
    setLoading(true);
    const res = await fetch("/api/smart-quotes", {
      method: "POST",
      body: JSON.stringify({ customer_id: customerId, area_code: Number(areaCode), created_by: "admin" }),
    });
    setLoading(false);
    if (res.ok) {
      setCustomerId("");
      setAreaCode("");
      onCreated();
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-gray-700">Customer</label>
          <select
            className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
          >
            <option value="">-- Select Customer --</option>
            {customers.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-700">Area</label>
          <select
            className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
            value={areaCode}
            onChange={e => setAreaCode(e.target.value)}
          >
            <option value="">-- Select Area --</option>
            {areas.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={createSQ}
            disabled={!customerId || !areaCode || loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Creating..." : "Add Quotation"}
          </button>
        </div>
      </div>
    </div>
  );
}