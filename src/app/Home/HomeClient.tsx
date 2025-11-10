"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Topbar from "../components/topbar";
import LoginModal from "../components/LoginModal";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

/* ========================= Theme Tokens ========================= */
const tokens = {
  brand: { primary: "#2563eb", primaryDark: "#1d4ed8", accent: "#22c55e", warning: "#f59e0b" },
  radius: { xl: "1.25rem", lg: "1rem" },
};

/* ========================= Types ========================= */
interface Category { id: string; name: string; productCount: number; image: string; }
interface Product  { id: string; name: string; price: number; location: string; stats: { boxes: number; stars: number }; image: string; category: string; badge?: string; }

/* ========================= Dummy Data ========================= */
const HERO_IMAGES = [
  { src: "/images/hero/materials-1.jpg", title: "MATERIALS", subtitle: "Bolt & Nuts • Nails • Wire Rope" },
  { src: "/images/hero/materials-2.jpg", title: "TOOLS", subtitle: "Industrial Grade • Hand & Power" },
  { src: "/images/hero/materials-3.jpg", title: "ELECTRICALS", subtitle: "Switchgears • Panels • Cables" },
  { src: "/images/hero/materials-4.jpg", title: "HEAVY EQUIPMENT", subtitle: "Trucks • Excavators • Spareparts" },
];

const ALL_CATEGORIES: Category[] = [
  { id: "steel",       name: "Steel",                       productCount: 21, image: "/images/cat/steel.jpg" },
  { id: "tools",       name: "Tools",                       productCount: 22, image: "/images/cat/tools.jpg" },
  { id: "heavy",       name: "Heavy Equipment & Sparepart", productCount: 10, image: "/images/cat/he.jpg" },
  { id: "building",    name: "Building Support Equipment",  productCount: 6,  image: "/images/cat/building.jpg" },
  { id: "materials",   name: "Materials",                   productCount: 17, image: "/images/cat/materials.jpg" },
  { id: "electricals", name: "Electricals",                 productCount: 6,  image: "/images/cat/electrical.jpg" },
  // extra saat Show more
  { id: "plumbing",    name: "Plumbing",                    productCount: 8,  image: "/images/cat/plumbing.jpg" },
  { id: "safety",      name: "Safety & PPE",                productCount: 13, image: "/images/cat/safety.jpg" },
];

const TOP_RANKING: Product[] = [
  { id: "p1", name: "MAKITA Impact Wrench Brushless", price: 600_000, location: "BANTEN", stats: { boxes: 50, stars: 5 }, image: "/images/prod/makita.jpg", category: "Tools", badge: "Top 1" },
  { id: "p2", name: "Spesifikasi Hand", price: 25_000, location: "Jawa Tengah", stats: { boxes: 1200, stars: 4 }, image: "/images/prod/handtools.jpg", category: "Tools", badge: "Hot" },
  { id: "p3", name: "Palu Kambing Owner", price: 28_000, location: "ACEH", stats: { boxes: 9_999_999, stars: 4 }, image: "/images/prod/hammer.jpg", category: "Tools" },
];

const RECOMMENDED: Product[] = [
  { id: "r1", name: "Truck Dump", price: 50_000_000, location: "NUSA TENGGARA TIMUR", stats: { boxes: 100, stars: 4 }, image: "/images/prod/dumptruck.jpg", category: "Heavy Equipment & Sparepart" },
  { id: "r2", name: "Sinotruck Howo 3340", price: 155_000_000, location: "JAWA TIMUR", stats: { boxes: 10, stars: 4 }, image: "/images/prod/howo.jpg", category: "Heavy Equipment & Sparepart", badge: "New" },
  { id: "r3", name: "Mini Excavator Manufacturer", price: 135_000_000, location: "SULAWESI TENGGARA", stats: { boxes: 50, stars: 4 }, image: "/images/prod/excavator.jpg", category: "Heavy Equipment & Sparepart" },
  { id: "r4", name: "MAKITA Impact Wrench Brushless", price: 580_000, location: "ACEH", stats: { boxes: 9_999_999, stars: 5 }, image: "/images/prod/makita.jpg", category: "Tools", badge: "Deal" },
];

/* ========================= Utils ========================= */
const rupiah = (v: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
const cx = (...a: Array<string | false | undefined | null>) => a.filter(Boolean).join(" ");

/* ========================= Fancy Primitives ========================= */
function GButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; href?: string; variant?: "primary" | "secondary" | "ghost" | "gradient" }
) {
  const { className, children, asChild, href, variant = "primary", ...rest } = props;
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white shadow-sm ring-1 ring-slate-200 hover:bg-blue-700 active:translate-y-[1px]"
      : variant === "secondary"
      ? "bg-slate-900 text-white hover:bg-black"
      : variant === "gradient"
      ? "text-white bg-gradient-to-r from-blue-600 to-indigo-500 shadow-sm hover:brightness-110"
      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50";
  const cls = cx(base, styles, className);
  if (asChild && href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}

function GCard({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  // gradient ring + glass
  return (
    <div className={cx(
      "relative rounded-3xl",
      "before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-b before:from-slate-100 before:to-white before:opacity-80",
      "after:pointer-events-none after:absolute after:inset-0 after:rounded-3xl after:ring-1 after:ring-inset after:ring-slate-200/70",
      "bg-white/60 backdrop-blur",
      className
    )}>
      <div className="relative">{children}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600 max-w-2xl">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <span className="text-sm font-medium">View More</span>
          <span className="i-lucide-arrow-right group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

/* ========================= Hero ========================= */
function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => { timer.current = setInterval(() => setIndex(p => (p + 1) % HERO_IMAGES.length), 5000); return () => { if (timer.current) clearInterval(timer.current); }; }, []);
  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* background mesh halus */}
      <div className="absolute -z-10 inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.10),transparent_60%)]" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {HERO_IMAGES.map((img, i) => (
          <div key={img.src} className={cx("relative h-56 md:h-64 lg:h-72 rounded-3xl", i === index ? "opacity-100" : "opacity-85")}>
            <Image src={img.src} alt={img.title} fill priority sizes="(max-width:768px) 100vw, 25vw" className="object-cover rounded-3xl" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            {i === index && (
              <div className="absolute bottom-3 left-3 text-white drop-shadow">
                <div className="text-xs opacity-90">{img.subtitle}</div>
                <div className="text-lg font-semibold tracking-wide">{img.title}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} className={cx("h-1.5 w-6 rounded-full transition-all", i === index ? "bg-white/90" : "bg-white/50 hover:bg-white/70")} />
        ))}
      </div>
    </div>
  );
}

/* ========================= Cards ========================= */
function CategoryCard({ c }: { c: Category }) {
  return (
    <GCard className="group p-4 overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-20 shrink-0 rounded-2xl overflow-hidden ring-1 ring-slate-200/70">
          <Image src={c.image} alt={c.name} fill sizes="96px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{c.name}</h3>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-[2px] text-[11px] text-slate-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> {c.productCount} Products
          </div>
        </div>
        <div className="ms-auto">
          <GButton asChild href={`/#cat-${c.id}`} variant="gradient">Details</GButton>
        </div>
      </div>
    </GCard>
  );
}

function ProductCard({ p, onRequireAuth }: { p: Product; onRequireAuth: () => void }) {
  return (
    <GCard className="flex h-full flex-col hover:-translate-y-0.5 transition-transform">
      <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden">
        <Image src={p.image} alt={p.name} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover" />
        {p.badge && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-800 ring-1 ring-slate-200">{p.badge}</span>}
      </div>
      <div className="p-4 flex flex-1 flex-col">
        <div className="text-[13px] text-slate-500">{p.category}</div>
        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900">{p.name}</h3>
        <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1"><span className="i-lucide-box" />{p.stats.boxes}</div>
          <div className="flex items-center gap-1"><span className="i-lucide-star" />{p.stats.stars}</div>
          <div className="flex items-center gap-1"><span className="i-lucide-map-pin" />{p.location}</div>
        </div>
        <div className="mt-3 text-lg font-semibold text-blue-700">{rupiah(p.price)}</div>
        <GButton className="mt-4" variant="gradient" onClick={onRequireAuth}>
          Shop Now <span className="i-lucide-shopping-cart" />
        </GButton>
      </div>
    </GCard>
  );
}

/* ========================= Page ========================= */
export default function HomeClient() {
  const [showMoreCats, setShowMoreCats] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // dummy
  const [loginOpen, setLoginOpen] = useState(false);

  const visibleCategories = showMoreCats ? ALL_CATEGORIES.slice(0, 8) : ALL_CATEGORIES.slice(0, 6);
  const requireAuth = () => { if (!isLoggedIn) setLoginOpen(true); else console.log("proceed to flow"); };

  return (
    <main className="min-h-dvh bg-slate-50">
      <Topbar />

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <HeroCarousel />
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 pt-10">
        <SectionHeader title="Popular Categories" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map((c) => <CategoryCard key={c.id} c={c} />)}
        </div>
        <div className="mt-5 flex justify-center">
          <button
            onClick={() => setShowMoreCats(v => !v)}
            className="rounded-full bg-white px-4 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {showMoreCats ? "Show less" : "Show more"}
          </button>
        </div>
      </section>

      {/* TOP RANKING */}
      <section className="mx-auto max-w-7xl px-4 pt-10">
        <GCard className="p-5">
          <SectionHeader title="Top Ranking" subtitle="Best selling & top rated items trusted by thousands of buyers." href="#top-ranking" />
          <div className="mt-4 overflow-x-auto [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
            <div className="flex gap-4 min-w-max">
              {TOP_RANKING.map((p) => <div key={p.id} className="w-[320px]"><ProductCard p={p} onRequireAuth={requireAuth} /></div>)}
            </div>
          </div>
        </GCard>
      </section>

      {/* NEW ARRIVALS + HOT DEALS */}
      <section className="mx-auto max-w-7xl px-4 pt-10 grid gap-6 md:grid-cols-2">
        <GCard className="p-5">
          <SectionHeader title="New Arrivals" subtitle="Be the first to shop the latest additions." href="#new-arrivals" />
          <div className="mt-6 grid place-items-center text-slate-500 text-sm min-h-64">Connect this to your feed later.</div>
        </GCard>
        <GCard className="relative overflow-hidden p-6">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(59,130,246,0.15),transparent_60%)]" />
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Hot Deals</h3>
              <p className="mt-1 text-slate-600 max-w-2xl">Exclusive discounts & limited-time offers on popular products.</p>
            </div>
            <Link href="#hot-deals" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2">View More <span className="i-lucide-arrow-right" /></Link>
          </div>
        </GCard>
      </section>

      {/* RECOMMENDED */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-16">
        <div className="mb-4 flex items-center gap-4">
          <h3 className="text-sm md:text-base font-semibold tracking-[0.25em] text-slate-700">RECOMMENDED PRODUCTS</h3>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-600/60 to-transparent rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {RECOMMENDED.map((p) => <ProductCard key={p.id} p={p} onRequireAuth={requireAuth} />)}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/60 bg-white/80 py-10">
        <div className="mx-auto max-w-7xl px-4 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="size-10 rounded-xl bg-blue-600 text-white grid place-items-center font-bold">ia</div>
            <p className="mt-3 text-sm text-slate-600 max-w-sm">IronAsia is a modern B2B marketplace for materials, tools, electricals, and heavy equipment — built for speed, reliability, and transparency.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Company</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li><Link href="#about" className="hover:text-slate-900">About</Link></li>
              <li><Link href="#careers" className="hover:text-slate-900">Careers</Link></li>
              <li><Link href="#press" className="hover:text-slate-900">Press</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Support</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li><Link href="#help" className="hover:text-slate-900">Help Center</Link></li>
              <li><Link href="#contact" className="hover:text-slate-900">Contact</Link></li>
              <li><Link href="#policy" className="hover:text-slate-900">Privacy & Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Seller</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li><Link href="#seller" className="hover:text-slate-900">Become a Seller</Link></li>
              <li><Link href="/smart-quote" className="hover:text-slate-900">Smart Quote</Link></li>
              <li><Link href="#docs" className="hover:text-slate-900">Documentation</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 mt-8 text-xs text-slate-500">© {new Date().getFullYear()} IronAsia. All rights reserved.</div>
      </footer>

      {/* LOGIN MODAL */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setIsLoggedIn(true)}
        />
    </main>
  );
}
