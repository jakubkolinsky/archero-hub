import Link from "next/link";
import { connection } from "next/server";
import { BuildPlanner } from "@/components/build-planner";
import { SnapshotNotice } from "@/components/snapshot-notice";
import { getCatalogItems } from "@/lib/catalog-database";

export const instant = false;

export default async function Home() {
  await connection();
  const { catalogItems, source } = await getCatalogItems();

  return <main className="min-h-screen bg-[#2b2b2b] text-[#f4f3ef]">
    <div className="border-b border-white/10 bg-[#171717]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-8">
        <Link href="/" className="text-sm font-black uppercase tracking-[.15em]">Archero<span className="text-[#ff3e47]">Hub</span></Link>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wide text-stone-400 sm:gap-6"><Link href="/" className="text-white">Loadout</Link><Link href="/tier-lists" className="hover:text-white">Tier list</Link><Link href="/admin" className="hover:text-white">Admin</Link></div>
      </nav>
    </div>
    <SnapshotNotice source={source} />
    <BuildPlanner catalogItems={catalogItems} />
    <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 px-4 py-7 text-xs text-stone-500 sm:flex-row sm:px-8"><p>Unofficial fan project. Not affiliated with Habby.</p><p>Stats are added only after in-game verification.</p></footer>
  </main>;
}
