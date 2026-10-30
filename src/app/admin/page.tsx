"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Equipment = { id: string; name: string; type: string };
type Mode = { id: string; name: string };
type TierList = { id: string; game_version: string; published_at: string | null };

const equipmentTypes = ["weapon", "armor", "ring", "bracelet", "locket", "book", "pet", "relic"];
const tiers = ["S+", "S", "A", "B", "C", "D"];

export default function AdminPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [modes, setModes] = useState<Mode[]>([]);
  const [tierLists, setTierLists] = useState<TierList[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase));

  const loadData = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    const [{ data: equipmentData, error: equipmentError }, { data: modeData, error: modeError }, { data: tierListData, error: tierListError }] =
      await Promise.all([
        supabase.from("equipment").select("id, name, type").eq("active", true).order("name"),
        supabase.from("modes").select("id, name").order("name"),
        supabase.from("tier_lists").select("id, game_version, published_at").order("created_at", { ascending: false }),
      ]);

    const error = equipmentError ?? modeError ?? tierListError;
    if (error) {
      setMessage(error.message);
    } else {
      setEquipment(equipmentData ?? []);
      setModes(modeData ?? []);
      setTierLists(tierListData ?? []);
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

  async function signIn() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });
    if (error) setMessage(error.message);
  }

  async function addEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("equipment").insert({
      name: form.get("name")?.toString().trim(),
      type: form.get("type"),
    });

    if (error) {
      setMessage(error.message);
      return;
    }
    event.currentTarget.reset();
    setMessage("Equipment added.");
    await loadData();
  }

  async function addPatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const version = form.get("version")?.toString().trim();
    const { error } = await supabase.from("tier_lists").insert({
      title: `Version ${version}`,
      game_version: version,
      published_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      return;
    }
    event.currentTarget.reset();
    setMessage(`Patch ${version} created.`);
    await loadData();
  }

  async function addRanking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("rankings").insert({
      tier_list_id: form.get("tierListId"),
      mode_id: form.get("modeId"),
      item_type: "equipment",
      equipment_id: form.get("equipmentId"),
      tier: form.get("tier"),
      comment: form.get("comment")?.toString().trim() || null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }
    event.currentTarget.reset();
    setMessage("Ranking published.");
  }

  if (!supabase) {
    return <SetupNotice />;
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#090b11] text-stone-300">Loading admin workspace…</main>;
  }

  if (!email) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#090b11] px-6 text-[#f7f1e7]">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151821] p-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">ArcheroHub admin</p>
          <h1 className="mt-3 text-3xl font-bold">Curate the meta.</h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">Sign in with the Google account added to the Supabase <code className="text-stone-200">admins</code> table.</p>
          <button onClick={() => void signIn()} className="mt-7 w-full rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-950 hover:bg-amber-300">
            Continue with Google
          </button>
          {message && <p className="mt-4 text-sm text-rose-300">{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b11] px-6 py-10 text-[#f7f1e7] lg:px-10">
      <header className="mx-auto flex max-w-6xl items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Admin workspace</p><h1 className="mt-2 text-3xl font-bold">Rank equipment by mode</h1></div>
        <p className="text-sm text-stone-400">{email}</p>
      </header>
      <div className="mx-auto mt-8 grid max-w-6xl gap-5 lg:grid-cols-3">
        <EditorCard title="1. Add equipment">
          <form onSubmit={(event) => void addEquipment(event)} className="space-y-3">
            <input required name="name" placeholder="Equipment name" className={inputClass} />
            <select required name="type" defaultValue="" className={inputClass}><option value="" disabled>Category</option>{equipmentTypes.map((type) => <option key={type}>{type}</option>)}</select>
            <Submit label="Add equipment" />
          </form>
        </EditorCard>
        <EditorCard title="2. Create patch">
          <form onSubmit={(event) => void addPatch(event)} className="space-y-3">
            <input required name="version" placeholder="e.g. 7.5" className={inputClass} />
            <p className="text-xs leading-5 text-stone-500">Publishing creates a visible versioned tier list.</p>
            <Submit label="Create patch" />
          </form>
        </EditorCard>
        <EditorCard title="3. Publish ranking">
          <form onSubmit={(event) => void addRanking(event)} className="space-y-3">
            <select required name="tierListId" defaultValue="" className={inputClass}><option value="" disabled>Patch</option>{tierLists.map((list) => <option key={list.id} value={list.id}>Version {list.game_version}</option>)}</select>
            <select required name="modeId" defaultValue="" className={inputClass}><option value="" disabled>Game mode</option>{modes.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</select>
            <select required name="equipmentId" defaultValue="" className={inputClass}><option value="" disabled>Equipment</option>{equipment.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.type}</option>)}</select>
            <select required name="tier" defaultValue="" className={inputClass}><option value="" disabled>Tier</option>{tiers.map((tier) => <option key={tier}>{tier}</option>)}</select>
            <textarea name="comment" placeholder="Why does it rank here?" className={`${inputClass} min-h-20`} />
            <Submit label="Publish ranking" />
          </form>
        </EditorCard>
      </div>
      {message && <p role="status" className="mx-auto mt-5 max-w-6xl text-sm text-amber-300">{message}</p>}
    </main>
  );
}

const inputClass = "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-400";

function EditorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-[#151821] p-5"><h2 className="mb-5 font-bold">{title}</h2>{children}</section>;
}

function Submit({ label }: { label: string }) {
  return <button className="w-full rounded-lg bg-amber-400 px-3 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-300">{label}</button>;
}

function SetupNotice() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#090b11] px-6 text-[#f7f1e7]">
      <div className="max-w-xl rounded-3xl border border-amber-400/20 bg-[#151821] p-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Admin setup required</p>
        <h1 className="mt-3 text-3xl font-bold">Connect Supabase first.</h1>
        <p className="mt-4 text-sm leading-6 text-stone-400">Add <code className="text-stone-100">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-stone-100">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to <code className="text-stone-100">.env.local</code>, apply the migrations, enable Google in Supabase Auth, and add your user ID to <code className="text-stone-100">admins</code>.</p>
      </div>
    </main>
  );
}
