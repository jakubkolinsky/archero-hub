"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

type ReviewStatus = "unreviewed" | "verified" | "rejected";

type ReviewEntry = {
  id: string;
  entity_type: string;
  external_key: string;
  review_status: ReviewStatus;
  review_note: string | null;
  reviewed_at: string | null;
  source_name: string;
  details: Record<string, unknown>[];
};

type SummaryRow = { entity_type: string; review_status: ReviewStatus; record_count: number };

const PAGE_SIZE = 25;

const entityLabels: Record<string, string> = {
  dragon_statue_source_cost: "Dragon statue costs",
  dragon_statue_source_metadata: "Dragon statue info",
  dragon_statue_source_stat: "Dragon statue stats",
  estate_source_building: "Estate buildings",
  estate_source_building_levels: "Estate building levels",
  estate_source_cost_table: "Estate cost tables",
  estate_source_worker: "Estate workers",
  glyph_source_row: "Glyphs",
  hatchery_source_monster: "Hatchery monsters",
  hero_assist_source_row: "Hero assists",
  hero_bonus_row: "Hero bonuses",
  jewel_source_row: "Jewels",
  medal_source_row: "Medals",
  outfit_source_entry: "Outfits",
  pet_source_profile: "Pet profiles",
  pet_source_skill: "Pet skills",
  quick_raid_source_chapter: "Quick Raid chapters",
  relic_source_row: "Relics",
  sigil_source_row: "Sigils",
  skin_source_row: "Skins",
  workbook_sheet: "Workbook sheets",
};

const statusStyles: Record<ReviewStatus, string> = {
  unreviewed: "bg-white/10 text-stone-300",
  verified: "bg-emerald-400/15 text-emerald-300",
  rejected: "bg-rose-400/15 text-rose-300",
};

const labelFor = (entityType: string) => entityLabels[entityType] ?? entityType;

function shortKey(externalKey: string) {
  return externalKey.replace(/^workbook:/, "").replace(/:sheet:/, " › ").replace(/:row:/, " › row ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function SourceReview({ supabase }: { supabase: SupabaseClient }) {
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [entityType, setEntityType] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "all">("unreviewed");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmBulk, setConfirmBulk] = useState<ReviewStatus | null>(null);

  const loadSummary = useCallback(async () => {
    const { data, error } = await supabase.from("source_review_summary").select("entity_type, review_status, record_count");
    if (error) setMessage(error.message);
    else setSummary((data ?? []) as SummaryRow[]);
  }, [supabase]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("source_review_entries")
      .select("id, entity_type, external_key, review_status, review_note, reviewed_at, source_name, details", { count: "exact" })
      .order("entity_type")
      .order("external_key")
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (entityType) query = query.eq("entity_type", entityType);
    if (status !== "all") query = query.eq("review_status", status);
    if (search.trim()) query = query.ilike("search_text", `%${search.trim()}%`);

    const { data, error, count } = await query;
    if (error) setMessage(error.message);
    else {
      setEntries((data ?? []) as ReviewEntry[]);
      setTotal(count ?? 0);
    }
    setSelected(new Set());
    setConfirmBulk(null);
    setLoading(false);
  }, [supabase, entityType, status, search, page]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadSummary());
    return () => window.cancelAnimationFrame(frame);
  }, [loadSummary]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadEntries());
    return () => window.cancelAnimationFrame(frame);
  }, [loadEntries]);

  // Wait for typing to pause before querying.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const byType = useMemo(() => {
    const map = new Map<string, Record<ReviewStatus, number>>();
    for (const row of summary) {
      const counts = map.get(row.entity_type) ?? { unreviewed: 0, verified: 0, rejected: 0 };
      counts[row.review_status] += row.record_count;
      map.set(row.entity_type, counts);
    }
    return [...map.entries()].sort(([a], [b]) => labelFor(a).localeCompare(labelFor(b)));
  }, [summary]);

  const totals = useMemo(
    () => byType.reduce((sum, [, counts]) => ({
      unreviewed: sum.unreviewed + counts.unreviewed,
      verified: sum.verified + counts.verified,
      rejected: sum.rejected + counts.rejected,
    }), { unreviewed: 0, verified: 0, rejected: 0 }),
    [byType],
  );

  async function setReview(ids: string[], nextStatus: ReviewStatus) {
    if (!ids.length) return;
    const payload: { review_status: ReviewStatus; review_note?: string | null } = { review_status: nextStatus };
    // A single-record decision also saves its note.
    if (ids.length === 1 && notes[ids[0]] !== undefined) payload.review_note = notes[ids[0]].trim() || null;

    const { data, error } = await supabase.from("source_records").update(payload).in("id", ids).select("id");
    if (error) {
      setMessage(error.message);
      return;
    }
    if ((data?.length ?? 0) !== ids.length) {
      setMessage(`Only ${data?.length ?? 0} of ${ids.length} records were saved. Check that your account is in the admins allowlist.`);
    } else {
      setMessage(`${ids.length} record${ids.length === 1 ? "" : "s"} marked ${nextStatus}.`);
    }
    await Promise.all([loadSummary(), loadEntries()]);
  }

  async function saveNote(id: string) {
    const note = (notes[id] ?? "").trim() || null;
    const { data, error } = await supabase.from("source_records").update({ review_note: note }).eq("id", id).select("id");
    if (error) setMessage(error.message);
    else if (!data?.length) setMessage("Note was not saved. Check that your account is in the admins allowlist.");
    else {
      setMessage("Note saved.");
      await loadEntries();
    }
  }

  async function bulkUpdateFilter(nextStatus: ReviewStatus) {
    // Applies to every record matching the current filters, not just this page.
    // Matching ids come from the review view (it holds the searchable text), then
    // are updated in batches to keep each request URL short.
    setConfirmBulk(null);
    const ids: string[] = [];
    for (let from = 0; ; from += 1000) {
      let query = supabase.from("source_review_entries").select("id").order("id").range(from, from + 999);
      if (entityType) query = query.eq("entity_type", entityType);
      if (status !== "all") query = query.eq("review_status", status);
      if (search.trim()) query = query.ilike("search_text", `%${search.trim()}%`);
      const { data, error } = await query;
      if (error) {
        setMessage(error.message);
        return;
      }
      ids.push(...(data ?? []).map((row: { id: string }) => row.id));
      if ((data?.length ?? 0) < 1000) break;
    }

    let saved = 0;
    for (let start = 0; start < ids.length; start += 100) {
      const batch = ids.slice(start, start + 100);
      const { data, error } = await supabase.from("source_records").update({ review_status: nextStatus }).in("id", batch).select("id");
      if (error) {
        setMessage(`${error.message} (${saved} of ${ids.length} saved before the error)`);
        await Promise.all([loadSummary(), loadEntries()]);
        return;
      }
      saved += data?.length ?? 0;
    }

    if (saved !== ids.length) setMessage(`Only ${saved} of ${ids.length} records were saved. Check that your account is in the admins allowlist.`);
    else setMessage(`${saved} records marked ${nextStatus}.`);
    await Promise.all([loadSummary(), loadEntries()]);
  }

  function changeFilter(update: () => void) {
    update();
    setPage(0);
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allSelected = entries.length > 0 && entries.every((entry) => selected.has(entry.id));

  return <div className="space-y-6">
    <section className="rounded-3xl border border-white/10 bg-[#151821] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-400">Review progress</p><p className="mt-1 text-sm text-stone-400">Only verified records may feed public stats. Pick a data type to review it.</p></div>
        <p className="text-sm text-stone-300"><span className="font-bold text-emerald-300">{totals.verified}</span> verified · <span className="font-bold text-rose-300">{totals.rejected}</span> rejected · <span className="font-bold text-white">{totals.unreviewed}</span> to review</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {byType.map(([type, counts]) => {
          const all = counts.unreviewed + counts.verified + counts.rejected;
          return <button key={type} onClick={() => changeFilter(() => setEntityType(type === entityType ? "" : type))} className={`rounded-xl border p-3 text-left ${type === entityType ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-black/10 hover:border-white/25"}`}>
            <span className="flex justify-between gap-2 text-sm"><span className="font-semibold text-white">{labelFor(type)}</span><span className="text-stone-400">{counts.verified + counts.rejected}/{all}</span></span>
            <span className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden><span className="bg-emerald-400" style={{ width: `${(counts.verified / all) * 100}%` }} /><span className="bg-rose-400" style={{ width: `${(counts.rejected / all) * 100}%` }} /></span>
          </button>;
        })}
      </div>
    </section>

    <section className="rounded-3xl border border-white/10 bg-[#151821] p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-semibold text-stone-300">Data type
          <select value={entityType} onChange={(event) => changeFilter(() => setEntityType(event.target.value))} className={inputClass}>
            <option value="">All types</option>
            {byType.map(([type]) => <option key={type} value={type}>{labelFor(type)}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-stone-300">Status
          <select value={status} onChange={(event) => changeFilter(() => setStatus(event.target.value as ReviewStatus | "all"))} className={inputClass}>
            <option value="unreviewed">Unreviewed</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="all">All</option>
          </select>
        </label>
        <label className="min-w-48 flex-1 text-sm font-semibold text-stone-300">Search
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name or text in the data, e.g. War Frenzy, Meowgik, Pets.xlsx" className={inputClass} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-white/10 py-3 text-sm">
        <label className="flex items-center gap-2 text-stone-300"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(entries.map((entry) => entry.id)))} className="size-4 accent-amber-400" /> Select page</label>
        <span className="text-stone-500">{selected.size} selected</span>
        <button disabled={!selected.size} onClick={() => void setReview([...selected], "verified")} className="rounded-lg bg-emerald-400/90 px-3 py-1.5 text-xs font-bold text-stone-950 disabled:opacity-40">Verify selected</button>
        <button disabled={!selected.size} onClick={() => void setReview([...selected], "rejected")} className="rounded-lg bg-rose-400/90 px-3 py-1.5 text-xs font-bold text-stone-950 disabled:opacity-40">Reject selected</button>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {confirmBulk ? <>
            <span className="text-amber-300">Mark all {total} matching records {confirmBulk}?</span>
            <button onClick={() => void bulkUpdateFilter(confirmBulk)} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-stone-950">Yes, mark {total}</button>
            <button onClick={() => setConfirmBulk(null)} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-stone-300">Cancel</button>
          </> : <>
            <button disabled={!total || !entityType} title={entityType ? undefined : "Pick a data type first"} onClick={() => setConfirmBulk("verified")} className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-300 disabled:opacity-40">Verify all {total} matching</button>
            <button disabled={!total || !entityType} title={entityType ? undefined : "Pick a data type first"} onClick={() => setConfirmBulk("rejected")} className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-bold text-rose-300 disabled:opacity-40">Reject all {total} matching</button>
          </>}
        </span>
      </div>

      {message && <p role="status" className="mt-3 text-sm text-amber-300">{message}</p>}

      <div className="mt-4 space-y-3">
        {loading ? <p className="py-8 text-center text-sm text-stone-400">Loading records…</p>
          : !entries.length ? <p className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-stone-400">No records match these filters.</p>
          : entries.map((entry) => <ReviewCard
            key={entry.id}
            entry={entry}
            selected={selected.has(entry.id)}
            note={notes[entry.id] ?? entry.review_note ?? ""}
            onToggle={() => setSelected((current) => { const next = new Set(current); if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id); return next; })}
            onNote={(value) => setNotes((current) => ({ ...current, [entry.id]: value }))}
            onSaveNote={() => void saveNote(entry.id)}
            onReview={(nextStatus) => void setReview([entry.id], nextStatus)}
          />)}
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-stone-400">
        <span>{total} records · page {page + 1} of {pageCount}</span>
        <span className="flex gap-2">
          <button disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-white/15 px-3 py-1.5 font-bold disabled:opacity-40">Previous</button>
          <button disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-white/15 px-3 py-1.5 font-bold disabled:opacity-40">Next</button>
        </span>
      </div>
    </section>
  </div>;
}

function ReviewCard({ entry, selected, note, onToggle, onNote, onSaveNote, onReview }: { entry: ReviewEntry; selected: boolean; note: string; onToggle: () => void; onNote: (value: string) => void; onSaveNote: () => void; onReview: (status: ReviewStatus) => void }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? entry.details : entry.details.slice(0, 3);

  return <article className={`rounded-2xl border p-4 ${selected ? "border-amber-400/60 bg-amber-400/5" : "border-white/10 bg-black/10"}`}>
    <div className="flex flex-wrap items-start gap-3">
      <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${entry.external_key}`} className="mt-1 size-4 accent-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{labelFor(entry.entity_type)}</p>
        <p className="break-words text-sm font-semibold text-white">{shortKey(entry.external_key)}</p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[entry.review_status]}`}>{entry.review_status}{entry.reviewed_at ? ` · ${new Date(entry.reviewed_at).toLocaleDateString("en-GB")}` : ""}</span>
    </div>

    <div className="mt-3 space-y-2">
      {rows.length ? rows.map((row, index) => <dl key={index} className="grid gap-x-4 gap-y-1 rounded-xl bg-black/20 p-3 text-xs sm:grid-cols-[160px_1fr]">
        {Object.entries(row).map(([key, value]) => <div key={key} className="contents"><dt className="text-stone-500">{key}</dt><dd className="break-words text-stone-200">{formatValue(value)}</dd></div>)}
      </dl>) : <p className="text-xs text-stone-500">No staged content is linked to this record.</p>}
      {entry.details.length > 3 && <button onClick={() => setExpanded((value) => !value)} className="text-xs font-bold text-amber-300">{expanded ? "Show fewer" : `Show all ${entry.details.length} rows`}</button>}
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input value={note} onChange={(event) => onNote(event.target.value)} placeholder="Curator note (optional)" aria-label="Curator note" className="min-w-48 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-400" />
      <button onClick={onSaveNote} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-stone-300 hover:text-white">Save note</button>
      {entry.review_status !== "verified" && <button onClick={() => onReview("verified")} className="rounded-lg bg-emerald-400/90 px-3 py-1.5 text-xs font-bold text-stone-950">Verify</button>}
      {entry.review_status !== "rejected" && <button onClick={() => onReview("rejected")} className="rounded-lg bg-rose-400/90 px-3 py-1.5 text-xs font-bold text-stone-950">Reject</button>}
      {entry.review_status !== "unreviewed" && <button onClick={() => onReview("unreviewed")} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-stone-300">Reset</button>}
    </div>
  </article>;
}

const inputClass = "mt-2 block w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm font-normal text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-400";
