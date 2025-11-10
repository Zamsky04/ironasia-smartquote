// app/Home/page.tsx  (SERVER)
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "IronAsia — Marketplace",
  description: "B2B marketplace for materials, tools, electricals & heavy equipment.",
  openGraph: { title: "IronAsia — Marketplace" },
};

export default function Page() {
  return <HomeClient />;
}
