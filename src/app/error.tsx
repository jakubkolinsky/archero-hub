"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[#2b2b2b] px-4 text-[#f4f3ef]">
      <div className="w-full max-w-md border border-white/10 bg-[#1c1c1c] p-7 text-center shadow-2xl shadow-black/30">
        <Link href="/" className="text-sm font-black uppercase tracking-[.15em]">
          Archero<span className="text-[#ff3e47]">Hub</span>
        </Link>
        <h1 className="mt-6 text-2xl font-black uppercase tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          This page hit an unexpected error. Trying again usually fixes it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => retry()}
            className="bg-[#ff3e47] px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-[#ff555e]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-300 hover:border-white/40 hover:text-white"
          >
            Home
          </Link>
        </div>
        {digest && <p className="mt-6 font-mono text-[11px] text-stone-500">Error {digest}</p>}
      </div>
    </main>
  );
}
