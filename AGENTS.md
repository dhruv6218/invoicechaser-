<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Base44 Dev Environment

## App
- **Astrix AI** — Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS.
- Pure frontend: all data lives in `localStorage` via `src/lib/api.ts`. No database, no backend, no external services required to boot.
- Webhook routes (`src/app/api/webhooks/dodo`, `.../stripe`) are stubs — no credentials needed.

## Running
- `docker compose -f docker-compose.base44.yml up -d` — starts `next dev` on port 3000, bind-mounted from source with live reload.
- `npm install` runs inside the container on startup (node_modules is an anonymous volume, not on the host).
- Healthcheck curls `http://localhost:3000`.

## Next.js preview origin
- `next.config.mjs` sets `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview proxy origin can access dev assets/HMR. Do not remove this.

## Notes
- The `replit.md` describes a *different* (Vite-based) version of this project — ignore it. The actual code is Next.js App Router.
- `WATCHPACK_POLLING=true` is set so file-watch fires reliably through the bind mount.
