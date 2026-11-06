export const gameModes = [
  "Chapter Push",
  "Farming",
  "Boss Chapters",
  "Legendary Challenge",
  "PvP",
  "Events",
] as const;

export const categories = [
  "Weapon",
  "Armor",
  "Ring",
  "Pet",
  "Bracelet",
  "Locket",
  "Book",
  "Dragon",
  "Relic",
  "Glyph",
  "Rune",
  "Hero",
  "Hero Assist",
  "Totem",
  "Skin",
] as const;

export type GameMode = (typeof gameModes)[number];
export type Category = (typeof categories)[number];
export type Tier = "SS" | "S" | "A" | "B" | "C" | "D" | "Unranked";

export type Item = {
  id: string;
  name: string;
  category: Category;
  tier: Tier;
  score: number;
  description: string;
  strengths: string;
  weaknesses: string;
  bestModes: GameMode[];
  accent: string;
  meta: "Top meta" | "Strong" | "Situational";
  imageUrl?: string | null;
};

export type Build = {
  id: string;
  name: string;
  description: string;
  mode: GameMode;
  strengths: string;
  weaknesses: string;
  slots: Record<string, string>;
};

export const slotDefinitions = [
  { id: "hero", label: "Hero", category: "Hero" as Category },
  { id: "weapon", label: "Weapon", category: "Weapon" as Category },
  { id: "armor", label: "Armor", category: "Armor" as Category },
  { id: "ring-one", label: "Ring 1", category: "Ring" as Category },
  { id: "ring-two", label: "Ring 2", category: "Ring" as Category },
  { id: "pet-one", label: "Pet 1", category: "Pet" as Category },
  { id: "pet-two", label: "Pet 2", category: "Pet" as Category },
  { id: "bracelet", label: "Bracelet", category: "Bracelet" as Category },
  { id: "locket", label: "Locket", category: "Locket" as Category },
  { id: "book", label: "Book", category: "Book" as Category },
  { id: "dragon", label: "Dragon", category: "Dragon" as Category },
];

export const items: Item[] = [
  { id: "zeus", name: "Zeus", category: "Hero", tier: "SS", score: 99, description: "A high-ceiling hero for aggressive progression.", strengths: "Burst scaling and boss pressure", weaknesses: "Needs investment to shine", bestModes: ["Chapter Push", "Boss Chapters", "Legendary Challenge"], accent: "from-violet-300 to-indigo-700", meta: "Top meta" },
  { id: "meowgik", name: "Meowgik", category: "Hero", tier: "S", score: 91, description: "Reliable projectiles and friendly progression curve.", strengths: "Consistent clearing and accessible shards", weaknesses: "Less burst than premium heroes", bestModes: ["Farming", "Events"], accent: "from-orange-200 to-rose-600", meta: "Strong" },
  { id: "melinda", name: "Melinda", category: "Hero", tier: "S", score: 94, description: "Flexible damage profile with strong team utility.", strengths: "Sustained damage and range", weaknesses: "Requires coordinated build choices", bestModes: ["Chapter Push", "PvP", "Events"], accent: "from-fuchsia-300 to-purple-700", meta: "Strong" },
  { id: "expedition-fists", name: "Expedition Fists", category: "Weapon", tier: "SS", score: 98, description: "High burst damage with excellent progression scaling.", strengths: "Boss burst and late-game scaling", weaknesses: "Shorter effective range", bestModes: ["Chapter Push", "Boss Chapters", "Legendary Challenge"], accent: "from-amber-200 to-orange-600", meta: "Top meta" },
  { id: "antiquated-sword", name: "Antiquated Sword", category: "Weapon", tier: "S", score: 93, description: "A versatile weapon that rewards precise play.", strengths: "Flexible rooms and boss damage", weaknesses: "Less forgiving positioning", bestModes: ["Chapter Push", "PvP", "Events"], accent: "from-slate-200 to-blue-700", meta: "Strong" },
  { id: "demon-blade", name: "Demon Blade", category: "Weapon", tier: "S", score: 90, description: "A close-range option for decisive damage windows.", strengths: "Burst damage and duels", weaknesses: "Risky in dense rooms", bestModes: ["Boss Chapters", "PvP"], accent: "from-rose-300 to-red-800", meta: "Strong" },
  { id: "brightspear", name: "Brightspear", category: "Weapon", tier: "A", score: 82, description: "A dependable ranged weapon with steady clears.", strengths: "Safe range and easy farming", weaknesses: "Lower late-game burst", bestModes: ["Farming", "Events"], accent: "from-cyan-200 to-blue-700", meta: "Situational" },
  { id: "warplate", name: "Warplate", category: "Armor", tier: "SS", score: 96, description: "End-game armor focused on survival through lethal hits.", strengths: "Defensive recovery and clutch value", weaknesses: "Premium investment path", bestModes: ["Chapter Push", "Legendary Challenge"], accent: "from-slate-300 to-zinc-700", meta: "Top meta" },
  { id: "dragon-ring", name: "Dragon Ring", category: "Ring", tier: "S", score: 88, description: "A damage-oriented ring for difficult targets.", strengths: "Boss pressure", weaknesses: "Narrower all-purpose value", bestModes: ["Boss Chapters", "Chapter Push"], accent: "from-emerald-200 to-teal-700", meta: "Strong" },
  { id: "bull-ring", name: "Bull Ring", category: "Ring", tier: "A", score: 80, description: "A reliable utility ring for resource runs.", strengths: "Consistent farming value", weaknesses: "Lower ceiling", bestModes: ["Farming", "Events"], accent: "from-lime-200 to-green-700", meta: "Situational" },
  { id: "starfire-fox", name: "Starfire Fox", category: "Pet", tier: "SS", score: 95, description: "An SS companion with strong offensive contribution.", strengths: "Damage support and rarity scaling", weaknesses: "Hard to acquire", bestModes: ["Chapter Push", "Boss Chapters"], accent: "from-orange-200 to-red-700", meta: "Top meta" },
  { id: "polar-penguin-king", name: "Polar Penguin King", category: "Pet", tier: "S", score: 89, description: "A resilient companion for pressure-heavy modes.", strengths: "Survival support", weaknesses: "Lower direct burst", bestModes: ["Legendary Challenge", "Events"], accent: "from-sky-100 to-blue-700", meta: "Strong" },
  { id: "warbracer", name: "Warbracer", category: "Bracelet", tier: "SS", score: 94, description: "A late-game bracelet built around comeback windows.", strengths: "Clutch recovery", weaknesses: "Premium investment path", bestModes: ["Chapter Push", "Legendary Challenge", "PvP"], accent: "from-yellow-100 to-amber-700", meta: "Top meta" },
  { id: "angel-locket", name: "Angel Locket", category: "Locket", tier: "A", score: 78, description: "A defensive locket for sustained attempts.", strengths: "Recovery and safety", weaknesses: "Limited offensive value", bestModes: ["Chapter Push", "Events"], accent: "from-pink-200 to-rose-700", meta: "Situational" },
  { id: "enlightenment-book", name: "Enlightenment Book", category: "Book", tier: "A", score: 79, description: "A momentum-focused book for longer runs.", strengths: "Steady skill progression", weaknesses: "Less immediate impact", bestModes: ["Farming", "Events"], accent: "from-yellow-100 to-orange-600", meta: "Situational" },
  { id: "riri", name: "Riri", category: "Dragon", tier: "A", score: 77, description: "A dragon companion that supports hero progression.", strengths: "Flexible companion bonuses", weaknesses: "Needs more verified ranking data", bestModes: ["Chapter Push"], accent: "from-violet-200 to-fuchsia-700", meta: "Situational" },
  { id: "bloodfeast-grail", name: "Bloodfeast Grail", category: "Relic", tier: "S", score: 90, description: "A current SS relic introduced in the 8.3.0 season.", strengths: "High-value account progression", weaknesses: "Event availability", bestModes: ["Chapter Push", "Boss Chapters"], accent: "from-red-200 to-rose-800", meta: "Strong" },
];

export const builds: Build[] = [
  { id: "chapter-push", name: "Chapter Push Meta", description: "High-score setup for sustained late-game progression.", mode: "Chapter Push", strengths: "Boss burst, recovery, survival", weaknesses: "Premium item requirements", slots: { hero: "zeus", weapon: "expedition-fists", armor: "warplate", "ring-one": "dragon-ring", "ring-two": "dragon-ring", "pet-one": "starfire-fox", "pet-two": "polar-penguin-king", bracelet: "warbracer", locket: "angel-locket", book: "enlightenment-book", dragon: "riri" } },
  { id: "farm", name: "Gold Farming Build", description: "A safe and consistent setup for quick resource runs.", mode: "Farming", strengths: "Room clear, range, repeatability", weaknesses: "Lower boss ceiling", slots: { hero: "meowgik", weapon: "brightspear", armor: "warplate", "ring-one": "bull-ring", "ring-two": "bull-ring", "pet-one": "polar-penguin-king", "pet-two": "starfire-fox", bracelet: "warbracer", locket: "angel-locket", book: "enlightenment-book", dragon: "riri" } },
  { id: "boss-killer", name: "Boss Killer Build", description: "Optimized for focused damage against boss encounters.", mode: "Boss Chapters", strengths: "Burst and target pressure", weaknesses: "Less comfortable room clearing", slots: { hero: "zeus", weapon: "expedition-fists", armor: "warplate", "ring-one": "dragon-ring", "ring-two": "dragon-ring", "pet-one": "starfire-fox", "pet-two": "starfire-fox", bracelet: "warbracer", locket: "angel-locket", book: "enlightenment-book", dragon: "riri" } },
  { id: "f2p", name: "F2P Progression Build", description: "A flexible starting point that prioritizes consistency.", mode: "Events", strengths: "Adaptable and easier to assemble", weaknesses: "Not the highest damage ceiling", slots: { hero: "meowgik", weapon: "brightspear", armor: "warplate", "ring-one": "bull-ring", "ring-two": "dragon-ring", "pet-one": "polar-penguin-king", "pet-two": "starfire-fox", bracelet: "warbracer", locket: "angel-locket", book: "enlightenment-book", dragon: "riri" } },
];

export function itemById(id: string) {
  return items.find((item) => item.id === id);
}
