// src/components/topbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bell, ShoppingCart, User, LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export default function Topbar() {
  const user = { name: "Sky", email: "sky@iron.asia", image: "" };
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200/70">
      <div className="mx-auto max-w-7xl px-3 md:px-4">
        {/* ===== Row 1: logo + search + icons/profile (compact) ===== */}
        <div className="flex items-center gap-2 py-2 md:py-3">
          {/* Logo dari /public/logo.png */}
          <Link href="/" className="shrink-0 flex items-center gap-2" aria-label="IronAsia">
            <Image
              src="/logo.png"     // file di public/logo.png
              alt="IronAsia"
              width={50}
              height={50}
              priority
            />
          </Link>

          {/* Search: lebar pas, tidak kepanjangan */}
          <div className="ms-2 flex-1">
            <div className="relative mx-auto w-full max-w-[680px]">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, categories, suppliers…"
                className="h-10 pe-20 rounded-xl text-sm"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 rounded-lg"
                onClick={() => console.log("search:", q)}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Icons & Profile */}
          <div className="ms-1 flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="rounded-xl">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Cart" className="rounded-xl">
              <ShoppingCart className="h-5 w-5" />
            </Button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-xl">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="font-medium">
                      {user.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-[13px]">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => alert("Sign out dummy")}>
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator />

        {/* ===== Row 2: CTA Smart Quotation + Results (center) ===== */}
        <div className="py-2 md:py-3">
          <div className="flex items-center justify-center gap-2">
            {/* CTA utama */}
            <Link
              href="/smart-quote"
              className="group relative inline-flex items-center gap-2 rounded-full px-5 py-2.5
                         text-sm font-semibold text-white shadow-sm
                         bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-600/90 hover:to-indigo-500/90
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <span>Smart&nbsp;Quotation</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">Beta</span>
              <span className="pointer-events-none absolute -z-10 inset-0 rounded-full blur-md opacity-40
                               bg-gradient-to-r from-blue-600/40 to-indigo-500/40" />
            </Link>

            {/* Link ke results */}
            <Link
              href="/smart-quote/results"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
                         text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Results
              <span className="rounded-full bg-blue-600/10 text-blue-700 px-2 py-0.5 text-[11px]">12</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
