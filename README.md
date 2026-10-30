# ArcheroHub

An Archero build planner and tier-list hub that helps players compare mode-specific rankings, assemble builds, and plan account progression.

## Included MVP

- Inventory-style, responsive build planner with mode-specific recommendations
- Browser-local owned-item tracking that filters item choices
- Dedicated tier-list and curated-build pages
- Item scores (0–100), tiers, strengths, weaknesses, and mode recommendations
- Versioned PostgreSQL/Supabase foundation for items, statistics, rankings, builds, and build slots
- Google-authenticated admin workspace at `/admin` for curator-managed equipment, patches, and rankings

## Run locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Database

Apply both files in `supabase/migrations/` to a new Supabase project. They provide:

- `heroes` and `equipment` catalogs
- `modes` for Chapter Push, Farming, PvP, and Hero Duo
- versioned `tier_lists`
- mode-specific `rankings`, including a database-level check that a ranking points to exactly one hero or equipment record
- public read-only row-level-security policies for active and published data
- a curator-only `admins` allowlist and write policies

## Admin setup

1. Enable Google in Supabase Auth and add `http://localhost:3000/admin` as a redirect URL.
2. Create `.env.local` with:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Sign in once, then run this in the Supabase SQL editor:

   ```sql
   insert into admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

Only allowlisted accounts can add equipment, create patches, or publish rankings. Stripe checkout remains an intentional UI handoff until Stripe keys and product IDs are configured.

The public planner currently uses a curated local catalog so it works before Supabase is connected. Once the project is configured, the `items`, `tier_rankings`, `builds`, and `build_slots` tables provide the production data model for replacing those drafts.

## Historical data provenance

The schema includes `catalog_sources`, `source_records`, `calculator_rule_sets`, and `calculator_rules` for auditable catalog and calculator work. The initial source is the [LuhCaran Archero Wiki](https://wiki-archero.luhcaran.fr/en/), a legacy reference current through January 2024. Its [open-source project is MIT licensed](https://github.com/enzo405/public-archero-wiki-docker), but the hosted site's terms prohibit copying its content. Use it to independently verify factual mechanics; write original descriptions, do not mirror image assets, and keep source attribution on every reviewed fact.

## Verified catalog seed

`202610240002_seed_verified_catalog.sql` adds equipment corroborated by current official or recent patch-note sources, with source URL and patch/version stored on every seeded row. `202610240003_expand_hero_catalog.sql` adds 32 heroes, labeling them `current-official`, `historical-official`, or `community-correlated` so the catalog remains auditable. Both intentionally leave rankings empty for curator review.

## Validate

```bash
npm run lint
npm run build
```

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Supabase PostgreSQL (schema included)
- Vercel-ready deployment
