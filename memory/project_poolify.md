---
name: Poolify project context
description: Core facts about the Poolify project — stack, Supabase credentials, key architectural decisions
type: project
---

Poolify is a private pool/quiniela platform for friends focused on World Cup 2026.

**Stack:** Next.js 16 (App Router), Tailwind CSS v4, TypeScript, Supabase (auth + DB), lucide-react.

**Key Next.js 16 breaking change:** `middleware.ts` is deprecated; use `src/proxy.ts` with `export function proxy()`.

**Supabase project:**
- URL: https://iudjoclwkmbuvilhuowm.supabase.co
- Publishable key stored in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Why:** Schema SQL is at `schema.sql` (root). Must be run in Supabase SQL editor before the app works.

**How to apply:** Always run `schema.sql` in Supabase first. Use `src/proxy.ts` (not middleware) for auth protection.
