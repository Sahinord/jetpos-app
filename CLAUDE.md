# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This is **not a single app** — it's a loose collection of four independent npm projects plus a shared Supabase backend, held together by a thin root `package.json` (no workspaces/lerna, just `--prefix` scripts):

| Dir | What it is | Stack | Dev port |
|---|---|---|---|
| `client/` | **JetPos** — the main POS/accounting desktop app (the product) | Electron + Next.js (`app/` router), TypeScript, Tailwind | 3005 |
| `jetpos-web/` | Marketing/corporate website for JetPos | Next.js | 3002 |
| `jetpos-mobile/` | Mobile-oriented PWA for staff (warehouse, KDS, adisyon, POS-lite) | Next.js, Dexie | 3001 |
| `jetsoft-web/` | Separate "Jetsoft" brand site | Vite + React | — |

All four talk to the **same Supabase project** (see `client/src/lib/supabase.ts` for the project URL/anon key fallback). There is no monorepo tooling — each app has its own `node_modules`, lockfile, and is built/deployed independently.

Root scripts (`package.json`):
```bash
npm run install-all   # installs client, jetpos-web, jetpos-mobile
npm run dev            # = electron-dev in client/
npm run build:all      # builds client (electron), jetpos-web, jetpos-mobile
```

## Common commands

Each sub-app is run from its own directory (`cd client`, `cd jetpos-web`, etc.) with its own `npm install` first.

**client/ (main app, Electron + Next.js)**
```bash
npm run dev            # next dev only, http://127.0.0.1:3005
npm run electron-dev   # next dev + electron shell together (what you actually use to "run the app")
npm run build          # next build
npm run electron-build # next build + electron-builder (Windows NSIS installer in dist/)
npm run lint           # next lint
```
No test runner is configured in `client/` — verification is done via ad-hoc `check_*.js` / `test_*.js` scripts run with `node` against Supabase, and manual UI testing in Electron/browser.

**jetpos-web/ and jetpos-mobile/**
```bash
npm run dev    # next dev (port 3002 / 3001 respectively)
npm run build
npm run lint
```

**jetsoft-web/**
```bash
npm run dev      # vite
npm run build    # tsc -b && vite build
npm run lint
```

There is no top-level or per-app automated test suite (no jest/vitest/playwright config anywhere). Treat "lint passes" + manual verification as the bar for correctness.

## Database / Supabase

- Backend is a single shared Supabase project (Postgres + RLS + RPC functions). Schema changes live in **two places**, both manually applied (no `supabase db push` workflow / no `supabase/config.toml`):
  - `supabase/migrations/` — newer, timestamp-prefixed (`YYYYMMDD_description.sql`), the more "current" convention.
  - `supabase-migrations/` — older, non-timestamped ad-hoc scripts.
  - The repo root also accumulates one-off `fix_*.sql` files (e.g. `fix_rls_permissions.sql`, `fix_rpc_permissions.sql`) for targeted RLS/RPC patches pasted into the Supabase SQL Editor by hand. When fixing an RLS/permissions bug, follow this pattern: add a new timestamped file under `supabase/migrations/`, don't edit old migrations in place.
  - There's no automatic migration runner — SQL files are applied manually via the Supabase Dashboard SQL Editor or CLI. Say so explicitly rather than assuming a migration auto-applies.
- **Multi-tenancy** is custom-built, not Supabase Auth:
  - A tenant logs in with a `license_key` + `tenant_id` (UUID) validated via the `validate_license` RPC; cached in `localStorage`.
  - Tenant context for RLS is set two ways: custom headers (`x-tenant-id`, `x-license-key`) injected into the Supabase client (`client/src/lib/supabase.ts`), AND an explicit `set_current_tenant` RPC call (`setCurrentTenant()`) that must run before tenant-scoped queries. `client/src/lib/tenant-context.tsx` (`TenantProvider`/`useTenant`) is the canonical place this happens on app boot and tenant switch.
  - RLS policies must define `WITH CHECK` in addition to `USING` for `FOR ALL` policies — missing `WITH CHECK` (INSERTs silently bypassing tenant scoping) has been a recurring real bug class here (see `RLS_POLICY_AUDIT_REPORT.md`). Mirror the working `cari_*` pattern, not the broken `kasa_*`/`banka_fisleri` one.
  - Within a tenant, staff identity is a separate layer: employees authenticate via a PIN (`verify_employee_pin` RPC), not Supabase Auth users.
- Root-level `check_*.js` / `test_*.js` scripts (same pattern inside `client/`) are throwaway Node scripts that read `client/.env.local` directly and connect with the **service role key** to inspect RLS policies/table contents/RPC behavior directly against Supabase. This is the standard way to debug data/RLS issues here — expect to write one-off scripts like this rather than relying on a test suite.

## Architecture of `client/` (the main app)

- Next.js App Router under `client/src/app/`. Notable routes beyond the main app:
  - `app/api/**` — server routes proxying third-party integrations (QNB e-fatura SOAP, Paraşüt, Trendyol Go, invoice OCR/vision-analyze). `client/src/server-api-backup/` is a dead snapshot of older versions — not live code.
  - `app/m/[slug]/[tableId]` — customer-facing mobile menu/ordering (QR menu) for table `tableId` of tenant `slug`.
  - `app/v/[slug]` — another tenant-scoped public view.
  - `app/display` — customer-facing order display screen (KDS-adjacent).
- `client/src/components/` is organized by business domain, not UI atom (`Cari/`, `POS/`, `Kasa/`, `Banka/`, `Warehouse/`, `Invoice/`, `Waybill/`, `Adisyon/`, `KDS/`, `Employee/`, `Tenant/`, `Setup/`, `Reports/`, `Integrations/`, `AI/`, `CRM/`, `QRMenu/`, etc.). Match a new feature to the existing domain folder rather than creating a generic one. `Cari/` = current accounts / customer-supplier ledger (Turkish accounting term) — its `*Dekontu.tsx`/`*Fisi.tsx` files are printable voucher/slip documents (jspdf + react-to-print), a pattern reused in `Kasa/` and `Banka/`.
- `client/src/lib/` cross-cutting logic:
  - `supabase.ts` — Supabase client + tenant header/RLS plumbing + `auditLog()` (fire-and-forget, must never block the POS flow).
  - `tenant-context.tsx` — tenant/license/employee/warehouse state (see Multi-tenancy above).
  - `offline-db.ts` + `sync-service.ts` — Dexie-backed local IndexedDB cache for products and a pending-sales outbox, so POS sales work offline and sync once connectivity returns (`sync_status: pending|syncing|synced|error`). Changes to the sale-creation path need to consider both the online (`supabase.from(...)`) and offline (`offlineDB.pending_sales`) paths.
  - `i18n.tsx` + `locales/{tr,en,ar}` — key-path i18n (`t('pos.cart_title')`); Turkish is default and most UI copy is still hardcoded Turkish rather than routed through `t()`.
  - `qnb/`, `parasut/`, `invoice-providers/`, `trendyol-client.ts`, `trendyol-go-client.ts` — e-invoice (GİB/QNB e-fatura SOAP+UBL) and marketplace (Trendyol/Trendyol Go) integrations. `invoice-providers/` is the abstraction layer (`types.ts` + `qnb-provider.ts`/`parasut-provider.ts`) that `app/api/invoices/**` calls into.
  - `hardware.ts` — bridges to Electron `main.js`/`preload.js` IPC for thermal/label printing and cash drawer control.
- Electron shell: `main.js` (printing via bundled PowerShell `rawprint.ps1`, hourly electron-updater polling, machine ID capture) + `preload.js` (contextBridge allowlist of IPC channels — adding a new native capability requires adding the channel name to `validChannels` in `preload.js` or it's silently rejected).
- Desktop build targets Windows specifically (NSIS installer); printing (`rawprint.ps1`, PowerShell `exec`) is Windows-only.

## Conventions worth knowing

- Business-domain naming (components, tables, RPCs) is Turkish (`cari`, `kasa`, `banka`, `adisyon`, `fiş`, `dekont`, `virman`, `devir`). Match existing naming for related code rather than introducing English equivalents.
- No automated tests anywhere — correctness is lint + targeted Node scripts against Supabase + manual run-through. Don't assume a test command exists.
- The long Turkish `*_RAPORU.md`/`*_RAPOR.md`/`*_PLANI.md` files at repo root are point-in-time integration/feature reports (e-fatura, Trendyol, multi-tenant, licensing, RLS audit) — historical context, not living docs.
