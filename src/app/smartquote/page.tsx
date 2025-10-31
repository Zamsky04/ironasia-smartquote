"use client";
import React, { useEffect, useState } from "react";
import SQList from "./components/SQList";
import HeaderNewSQModal from "./components/HeaderNewSQModal";
import AddItemModal from "./components/AddItemModal";

type Opt = { value: string|number; label: string; role?: string };

export default function SmartQuotePage() {
  const [customers, setCustomers] = useState<Opt[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [refresh, setRefresh] = useState(0);

  // Modal state
  const [openNewHeader, setOpenNewHeader] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [newSqId, setNewSqId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const cs = await fetch("/api/master/customers").then(r => r.json());
      const onlyCustomers = cs.filter((c: any) => c.role === "customer");
      setCustomers(onlyCustomers.map((c: any) => ({ value: c.user_id, label: c.name })));
    })();
  }, []);

  // Setelah header dibuat -> buka AddItemModal langsung
  const handleCreatedHeader = (sqid: number) => {
    setNewSqId(sqid);
    setOpenAddItem(true);
    setRefresh(r => r + 1);
  };

  const handleItemSaved = () => {
    setOpenAddItem(false);
    setNewSqId(null);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Smart Quotation</h1>

        {/* Top bar: pilih customer + add header */}
        <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="text-sm text-gray-700">Customer</label>
              <select
                className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- Select Customer --</option>
                {customers.map(opt => (
                  <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={!customerId}
              onClick={() => setOpenNewHeader(true)}
            >
              Add Quotation
            </button>
          </div>
        </div>

        {/* List SQ milik customer terpilih */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-4">
            {customerId ? (
              <SQList refresh={refresh} customerId={customerId} />
            ) : (
              <p className="text-gray-600">Pilih customer terlebih dahulu untuk melihat daftar Smart Quotation.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: buat header baru */}
      <HeaderNewSQModal
        open={openNewHeader}
        onClose={() => setOpenNewHeader(false)}
        customerId={customerId}
        onCreated={handleCreatedHeader}
      />

      {/* Modal: langsung tambah item ke SQID baru */}
      {newSqId !== null && (
        <AddItemModal
          open={openAddItem}
          onClose={() => setOpenAddItem(false)}
          sqid={newSqId}
          onSaved={handleItemSaved}
          createdBy={customerId}
        />
      )}
    </div>
  );
}
