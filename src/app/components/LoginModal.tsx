"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (payload?: { username: string }) => void;
};

export default function LoginModal({ open, onClose, onSuccess }: Props) {
  const [showPass, setShowPass] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submit = () => {
    if (!username || !password) {
      setErr("Username dan password wajib diisi.");
      return;
    }
    setErr(null);
    onSuccess({ username });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-2">
          {/* Brand panel */}
          <div className="relative hidden md:block bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 p-6 text-white">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(50%_50%_at_50%_0%,white,transparent_60%)]" />
            <div className="relative z-10">
              <Image src="/logo.png" alt="IronAsia" width={36} height={36} className="rounded-md" />
              <h3 className="mt-4 text-xl font-semibold">Welcome back 👋</h3>
              <p className="mt-1 text-sm text-white/80">Sign in to continue your procurement journey.</p>
              <ul className="mt-6 space-y-2 text-sm text-white/90">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Access Smart Quotation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Manage suppliers & carts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Track orders in real-time</li>
              </ul>
            </div>
          </div>

          {/* Form panel */}
          <div className="p-6">
            <div className="flex items-center gap-3 md:hidden">
              <Image src="/logo.png" alt="IronAsia" width={28} height={28} className="rounded-md" />
              <h4 className="text-base font-semibold">Sign in to IronAsia</h4>
            </div>

            <div className="mt-2 space-y-3">
              <div>
                <label className="text-xs text-slate-600">Username</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="you@mail.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-600">Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    onClick={() => setShowPass(v => !v)}
                    aria-label="Toggle password"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300" /> Remember me
                </label>
                <Link href="/forgot-password" className="text-xs text-blue-700 hover:underline">Lupa password?</Link>
              </div>

              {err && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200">
                  {err}
                </div>
              )}

              <button
                className="w-full rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2 text-sm font-medium shadow-sm hover:brightness-110"
                onClick={submit}
              >
                Sign in
              </button>

              <button
                className="w-full rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
