import React, { useEffect, useState } from "react";
import ItemTable from "./ItemTable";

export default function SQList({ refresh, customerId }: { refresh: number; customerId: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!customerId) { setData([]); return; }
    fetch(`/api/smart-quotes/list?customer_id=${encodeURIComponent(customerId)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, [refresh, customerId]);

  return (
    <div className="space-y-4">
      {data.map((sq) => (
        <div key={sq.sq_id} className="border border-gray-200 rounded-lg p-4 bg-white text-gray-900 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <p className="font-semibold">SQID: <span className="font-normal">{sq.sq_id}</span></p>
              <p><span className="font-semibold">Customer:</span> {sq.customer_name || sq.customer_id} &nbsp;|&nbsp; <span className="font-semibold">Area:</span> {sq.area_code}</p>
              <p><span className="font-semibold">Status:</span> {sq.status}</p>
            </div>
          </div>
          <ItemTable sq={sq} />
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-gray-600">Belum ada Smart Quotation untuk customer ini.</p>
      )}
    </div>
  );
}
