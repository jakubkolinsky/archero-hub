import Link from "next/link";
import { BuildPlanner } from "@/components/build-planner";

export default function Home() {
  return <main className="min-h-screen bg-[#090b11] text-[#f7f1e7]">
    <div className="border-b border-white/10 bg-[#0d1017]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 sm:px-8">
        <Link href="/" className="font-bold tracking-tight">Archero<span className="text-amber-400">Hub</span></Link>
        <div className="hidden items-center gap-6 text-sm text-stone-400 lg:flex"><Link href="/builds">Builds</Link><Link href="/tier-lists">Tier Lists</Link><a href="#guides">Guides</a><a href="#updates">Meta Updates</a><span className="text-stone-600">Calculator · Soon</span><a href="#about">About</a></div>
        <div className="flex items-center gap-3"><Link href="/tier-lists" className="hidden text-sm text-stone-400 sm:block">Search</Link><Link href="/admin" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-stone-200 hover:border-amber-400">Login</Link><a href="#support" className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-stone-950 hover:bg-amber-300">Support</a></div>
      </nav>
    </div>
    <header className="mx-auto max-w-7xl px-5 pb-9 pt-14 sm:px-8 lg:pb-12 lg:pt-20">
      <p className="text-xs font-bold uppercase tracking-[.22em] text-amber-400">Archero 8.3.0 · community draft</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-.045em] sm:text-6xl">The build planner for every Archero run.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-400">Compare the current meta, customize a full loadout, and keep recommendations grounded in the equipment you own.</p>
    </header>
    <BuildPlanner />
    <section id="guides" className="border-t border-white/10 bg-[#0d1017]"><div className="mx-auto grid max-w-7xl gap-5 px-5 py-16 sm:px-8 md:grid-cols-3"><Feature number="01" title="Mode-first rankings" text="A weapon can dominate bosses and still be a weak farming choice. Every score is tied to a mode." /><Feature number="02" title="Builds, not lists" text="Tier lists are useful context. Full builds show how the pieces actually fit together." /><Feature number="03" title="Account-aware next" text="Ownership filtering works locally today; personal profiles and upgrade calculations come next." /></div></section>
    <footer id="support" className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-9 text-sm text-stone-500 sm:flex-row sm:px-8"><p>Unofficial fan project. Not affiliated with Habby.</p><p>Support Hosting and Future Development</p></footer>
  </main>;
}

function Feature({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[.025] p-6"><p className="text-sm font-black text-amber-400">{number}</p><h2 className="mt-6 text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-stone-400">{text}</p></article>;
}
