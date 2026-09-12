<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Base44 Dev Environment

## App
- **Astrix AI** — Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS.
- Full-stack SaaS: Supabase (PostgreSQL + Auth + RLS), Gemini AI (tone cloning + email generation), Resend (transactional email), Stripe/Dodo Payments (webhooks).

## Running
- `docker compose -f docker-compose.base44.yml up -d` — starts `next dev` on port 3000, bind-mounted from source with live reload.
- `npm install` runs inside the container on startup (node_modules is an anonymous volume).
- Secrets delivered via `/run/base44/app.env` (env_file in compose).

## Next.js preview origin
- `next.config.mjs` sets `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview proxy origin can access dev assets/HMR. Do not remove this.

## Backend Architecture
- **Database**: `supabase/schema.sql` — run in Supabase SQL Editor. Creates tables (profiles, workspaces, gateways, invoices, tone_settings, reminder_logs, activity_feed, subscriptions), RLS policies, and auto-creation triggers.
- **Auth**: Supabase Auth with email/password, Google OAuth, and magic link. Middleware refreshes session tokens. ProtectedRoute guards /app routes.
- **Data layer**: `src/lib/api.ts` — all data operations use Supabase browser client. Gateway API keys encrypted via server-side route (`/api/gateways`).
- **AI engine**: `src/lib/ai.ts` — Gemini primary, OpenRouter fallback. Generates tone prompts from sample emails and reminder email drafts.
- **Email**: `src/lib/email.ts` — Resend SDK. Builds HTML reminder emails with payment links.
- **Crypto**: `src/lib/crypto.ts` — AES-256-GCM encryption for gateway API keys.
- **Supabase clients**: `src/lib/supabase-browser.ts` (client), `src/lib/supabase-server.ts` (server + service role).

## API Routes
- `POST /api/gateways` — Create gateway (encrypts API key server-side)
- `DELETE /api/gateways` — Remove gateway
- `GET /api/admin/users` — List all users (admin only)
- `PATCH /api/admin/users` — Update user status / adjust credits (admin only)
- `POST /api/ai/generate-tone` — Generate voice profile from sample emails
- `POST /api/ai/generate-email` — Generate reminder email draft
- `GET /api/cron/daily-chase` — Daily Chase Engine (scans overdue invoices, sends AI emails via Resend)
- `POST /api/webhooks/stripe` — Payment success/decline handling
- `POST /api/webhooks/dodo` — Subscription lifecycle (created/updated/canceled)

## Supabase Setup (required before app works)
1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Enable Email auth in Supabase Dashboard > Authentication > Providers
3. (Optional) Enable Google OAuth: add client ID/secret in Supabase Dashboard > Authentication > Providers > Google
4. Set the site URL in Supabase Dashboard > Authentication > URL Configuration

## Notes
- The `replit.md` describes a different (Vite-based) version — ignore it. The actual code is Next.js App Router.
- `WATCHPACK_POLLING=true` ensures file-watch fires through the bind mount.
- Views that previously used hardcoded mock data (Dashboard, Invoices, ToneStudio, Gateways, onboarding) now use real Supabase data.
- Analytics, SaaSWorkspace (clients/sequences/templates/notifications/help) still use static demo data — to be wired in a future pass.
