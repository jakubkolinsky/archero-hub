"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type CatalogItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  image_url: string | null;
};

type CatalogMedia = {
  path: string;
  label: string;
};

type Mode = {
  id: string;
  name: string;
};

type TierList = {
  id: string;
  game_version: string;
};

type Ranking = {
  item_id: string;
  mode_id: string;
  tier_list_id: string;
  tier: string;
  score: number;
  notes: string | null;
};

const rankTiers = ["SS", "S", "A", "B", "C", "D"];

export default function AdminPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [media, setMedia] = useState<CatalogMedia[]>([]);
  const [modes, setModes] = useState<Mode[]>([]);
  const [tierLists, setTierLists] = useState<TierList[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedMediaOverride, setSelectedMediaOverride] = useState<string | null>(null);
  const [selectedModeId, setSelectedModeId] = useState("");
  const [selectedTierListId, setSelectedTierListId] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase));

  const loadData = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    const [itemResult, mediaResult, modeResult, tierListResult, rankingResult] = await Promise.all([
      supabase.from("items").select("id, name, slug, category, image_url").eq("active", true).order("category").order("name"),
      supabase.from("catalog_media").select("path, label").order("label"),
      supabase.from("modes").select("id, name").order("name"),
      supabase.from("tier_lists").select("id, game_version").order("created_at", { ascending: false }),
      supabase.from("tier_rankings").select("item_id, mode_id, tier_list_id, tier, score, notes"),
    ]);

    const error = itemResult.error ?? mediaResult.error ?? modeResult.error ?? tierListResult.error ?? rankingResult.error;
    if (error) {
      setMessage(error.message);
    } else {
      const nextItems = itemResult.data ?? [];
      const nextModes = modeResult.data ?? [];
      const nextTierLists = tierListResult.data ?? [];

      setItems(nextItems);
      setMedia(mediaResult.data ?? []);
      setModes(nextModes);
      setTierLists(nextTierLists);
      setRankings(rankingResult.data ?? []);
      setSelectedItemId((current) => current || nextItems[0]?.id || "");
      setSelectedModeId((current) => current || nextModes[0]?.id || "");
      setSelectedTierListId((current) => current || nextTierLists[0]?.id || "");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (error) setMessage(error.message);
      setEmail(data.user?.email ?? null);
      if (data.user) void loadData();
      else setLoading(false);
    });
  }, [loadData, supabase]);

  const selectedItem = items.find((item) => item.id === selectedItemId);
  const visibleItems = category === "All" ? items : items.filter((item) => item.category === category);
  const categories = ["All", ...new Set(items.map((item) => item.category))];
  const selectedMediaPath = selectedMediaOverride ?? selectedItem?.image_url ?? "";
  const selectedRanking = rankings.find((entry) => entry.item_id === selectedItemId && entry.mode_id === selectedModeId && entry.tier_list_id === selectedTierListId);

  async function signIn() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });
    if (error) setMessage(error.message);
  }

  async function saveIcon() {
    if (!supabase || !selectedItem || !selectedMediaPath) return;

    const { error } = await supabase.from("items").update({ image_url: selectedMediaPath }).eq("id", selectedItem.id);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Icon saved for ${selectedItem.name}.`);
    await loadData();
  }

  async function saveRanking(tier: string, score: string, notes: string) {
    if (!supabase || !selectedItemId || !selectedModeId || !selectedTierListId) return;

    const numericScore = Number(score);
    if (!Number.isInteger(numericScore) || numericScore < 0 || numericScore > 100) {
      setMessage("Score must be a whole number from 0 to 100.");
      return;
    }

    const { error } = await supabase.from("tier_rankings").upsert({
      item_id: selectedItemId,
      mode_id: selectedModeId,
      tier_list_id: selectedTierListId,
      tier,
      score: numericScore,
      notes: notes.trim() || null,
    }, { onConflict: "item_id,mode_id,tier_list_id" });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Ranking saved for ${selectedItem?.name}.`);
    await loadData();
  }

  if (!supabase) return <SetupNotice />;
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#090b11] text-stone-300">Loading admin workspace...</main>;
  if (!email) return <SignIn onClick={signIn} message={message} />;

  return (
    <main className="min-h-screen bg-[#090b11] px-5 py-10 text-[#f7f1e7] sm:px-8">
      <header className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Admin workspace</p><h1 className="mt-2 text-3xl font-bold">Curate the catalog</h1><p className="mt-2 text-sm text-stone-400">Assign icon assets and publish rankings for each game mode.</p></div>
        <p className="text-sm text-stone-400">{email}</p>
      </header>

      <div className="mx-auto mt-8 grid max-w-7xl gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-3xl border border-white/10 bg-[#151821] p-5">
          <div className="flex flex-wrap gap-2">{categories.map((value) => <button key={value} onClick={() => setCategory(value)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${category === value ? "bg-amber-400 text-stone-950" : "bg-white/[.06] text-stone-400 hover:text-white"}`}>{value}</button>)}</div>
          <div className="mt-5 grid max-h-[65vh] gap-2 overflow-y-auto sm:grid-cols-2">
            {visibleItems.map((item) => <button key={item.id} onClick={() => { setSelectedItemId(item.id); setSelectedMediaOverride(null); }} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${item.id === selectedItemId ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-black/10 hover:border-white/25"}`}>
              <ItemImage item={item} />
              <span className="min-w-0"><span className="block truncate font-semibold">{item.name}</span><span className="mt-1 block text-xs text-stone-500">{item.category}</span></span>
            </button>)}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-[#151821] p-6">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-400">1. Assign an icon</p>
            <div className="mt-4 flex items-center gap-4"><ItemImage item={selectedItem} size={72} /><div><h2 className="text-xl font-bold">{selectedItem?.name ?? "Select an item"}</h2><p className="mt-1 text-sm text-stone-400">Choose the image that best matches the item.</p></div></div>
            <div className="mt-5 grid max-h-80 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
              {media.map((asset) => <button key={asset.path} onClick={() => setSelectedMediaOverride(asset.path)} title={asset.label} className={`rounded-xl border p-2 ${asset.path === selectedMediaPath ? "border-amber-400 bg-amber-400/10" : "border-white/10 hover:border-white/25"}`}><Image src={asset.path} alt={asset.label} width={48} height={48} className="size-12 object-contain" /></button>)}
            </div>
            <button disabled={!selectedItem || !selectedMediaPath} onClick={() => void saveIcon()} className="mt-5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50">Save icon</button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#151821] p-6">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-400">2. Rank the item</p>
            <h2 className="mt-2 text-xl font-bold">{selectedItem?.name ?? "Select an item"}</h2>
            <RankingForm
              key={`${selectedItemId}:${selectedModeId}:${selectedTierListId}`}
              disabled={!selectedItem || !selectedModeId || !selectedTierListId}
              existingRanking={selectedRanking}
              modes={modes}
              onModeChange={setSelectedModeId}
              onSave={saveRanking}
              onTierListChange={setSelectedTierListId}
              selectedModeId={selectedModeId}
              selectedTierListId={selectedTierListId}
              tierLists={tierLists}
            />
          </section>
        </div>
      </div>
      {message && <p role="status" className="mx-auto mt-5 max-w-7xl text-sm text-amber-300">{message}</p>}
    </main>
  );
}

function ItemImage({ item, size = 40 }: { item: CatalogItem | undefined; size?: number }) {
  if (!item?.image_url) return <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold text-stone-500">?</span>;
  return <Image src={item.image_url} alt="" width={size} height={size} className="shrink-0 rounded-lg object-contain" style={{ width: size, height: size }} />;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="text-sm font-semibold text-stone-300">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function RankingForm({ disabled, existingRanking, modes, onModeChange, onSave, onTierListChange, selectedModeId, selectedTierListId, tierLists }: { disabled: boolean; existingRanking: Ranking | undefined; modes: Mode[]; onModeChange: (value: string) => void; onSave: (tier: string, score: string, notes: string) => Promise<void>; onTierListChange: (value: string) => void; selectedModeId: string; selectedTierListId: string; tierLists: TierList[] }) {
  const [tier, setTier] = useState(existingRanking?.tier ?? "A");
  const [score, setScore] = useState(existingRanking?.score?.toString() ?? "80");
  const [notes, setNotes] = useState(existingRanking?.notes ?? "");

  return <><div className="mt-5 grid gap-3 sm:grid-cols-2">
    <Select label="Patch" value={selectedTierListId} onChange={onTierListChange} options={tierLists.map((list) => ({ value: list.id, label: `Version ${list.game_version}` }))} />
    <Select label="Game mode" value={selectedModeId} onChange={onModeChange} options={modes.map((mode) => ({ value: mode.id, label: mode.name }))} />
    <Select label="Tier" value={tier} onChange={setTier} options={rankTiers.map((value) => ({ value, label: value }))} />
    <label className="text-sm font-semibold text-stone-300">Score<input value={score} onChange={(event) => setScore(event.target.value)} inputMode="numeric" className={inputClass} /></label>
  </div>
  <label className="mt-3 block text-sm font-semibold text-stone-300">Curator note<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${inputClass} mt-2 min-h-24`} placeholder="Why does it rank here?" /></label>
  <button disabled={disabled} onClick={() => void onSave(tier, score, notes)} className="mt-5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50">Save ranking</button></>;
}

function SignIn({ onClick, message }: { onClick: () => void; message: string }) {
  return <main className="grid min-h-screen place-items-center bg-[#090b11] px-6 text-[#f7f1e7]"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151821] p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">ArcheroHub admin</p><h1 className="mt-3 text-3xl font-bold">Curate the catalog.</h1><p className="mt-3 text-sm leading-6 text-stone-400">Sign in with the Google account in the Supabase <code className="text-stone-200">admins</code> table.</p><button onClick={onClick} className="mt-7 w-full rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-950 hover:bg-amber-300">Continue with Google</button>{message && <p className="mt-4 text-sm text-rose-300">{message}</p>}</div></main>;
}

function SetupNotice() {
  return <main className="grid min-h-screen place-items-center bg-[#090b11] px-6 text-[#f7f1e7]"><div className="max-w-xl rounded-3xl border border-amber-400/20 bg-[#151821] p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Admin setup required</p><h1 className="mt-3 text-3xl font-bold">Connect Supabase first.</h1><p className="mt-4 text-sm leading-6 text-stone-400">Add <code className="text-stone-100">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-stone-100">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to the environment before opening the admin workspace.</p></div></main>;
}

const inputClass = "mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm font-normal text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-400";
