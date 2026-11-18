import type { CatalogSource } from "@/lib/catalog-database";

export function SnapshotNotice({ source }: { source: CatalogSource }) {
  if (source === "live") return null;

  return (
    <div role="status" className="border-b border-[#ffbe63]/25 bg-[#ffbe63]/10">
      <p className="mx-auto max-w-7xl px-4 py-2.5 text-xs leading-5 text-[#ffd99a] sm:px-8">
        <span className="font-bold uppercase tracking-wide">Offline catalog.</span> The live database is unavailable, so
        you are seeing a bundled snapshot. Recent curator changes may be missing.
      </p>
    </div>
  );
}
