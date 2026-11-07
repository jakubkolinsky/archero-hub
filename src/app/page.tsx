import Link from "next/link";
import { connection } from "next/server";
import { BuildPlanner } from "@/components/build-planner";
import { getCatalogItems } from "@/lib/catalog-database";

export const instant = false;

export default async function Home() {
  await connection();
  const catalogItems = await getCatalogItems();

  return <main className="min-h-screen bg-[#2b2b2b] text-[#f4f3ef]">
    <div className="border-b border-white/10 bg-[#171717]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-8">
        <Link href="/" className="text-sm font-black uppercase tracking-[.15em]">Archero<span className="text-[#ff3e47]">Hub</span></Link>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wide text-stone-400 sm:gap-6"><Link href="/" className="text-white">Loadout</Link><Link href="/tier-lists" className="hover:text-white">Tier list</Link><Link href="/admin" className="hover:text-white">Admin</Link></div>
      </nav>
    </div>
    <header className="border-b border-white/10 bg-[linear-gradient(110deg,rgba(8,8,8,.78),rgba(8,8,8,.25)),radial-gradient(circle_at_78%_10%,rgba(53,147,143,.55),transparent_35%)]">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-8 sm:py-12">
        <p className="text-[11px] font-bold uppercase tracking-[.28em] text-[#ff555e]">Archero Hub · community draft</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-5xl">Build your run.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">Start with the recommended push loadout, then change any hero, weapon, or slot to match your inventory.</p>
      </div>
    </header>
    <BuildPlanner catalogItems={catalogItems} />
    <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 px-4 py-7 text-xs text-stone-500 sm:flex-row sm:px-8"><p>Unofficial fan project. Not affiliated with Habby.</p><p>Stats are added only after in-game verification.</p></footer>
  </main>;
}
