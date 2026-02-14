# Future Direction Planning

This document captures architectural discussions and planning for potential future directions of the flash cards application.

## Current Architecture

- **Backend**: Hono framework on Node.js (`@hono/node-server`)
- **Frontend**: Vue 3 + Vite (standard SPA)
- **Database**: PostgreSQL via Drizzle ORM
- **Storage**: Not yet implemented — Garage or MinIO planned for images
- **Deployment**: Docker Compose (PostgreSQL + Node.js app) on a self-managed VM

### How It Runs

**Development (native mode):**
- Server: `cd server && npm run dev` — runs via `tsx watch`, connects to local PostgreSQL using `server/.env`
- Frontend: `npm run dev` — Vite dev server on port 3000, proxies `/api` to port 3001

**Production (Docker):**
- `docker compose up --build` — builds multi-stage Docker image, starts PostgreSQL + app
- PostgreSQL auto-initializes schema from `server/migrations/001_initial_schema.sql`
- DB connection info comes from `.env` in the project root

### Object Storage (Future)

When card images or file attachments are needed, add a Garage or MinIO service to `docker-compose.yml`:
- Self-hosted S3-compatible storage
- Runs alongside PostgreSQL in the same Docker Compose stack
- No vendor lock-in

---

## Migration History

Migrations have been consolidated into a single PostgreSQL schema file:
- `server/migrations/001_initial_schema.sql` — all 6 tables and indexes

Previous incremental SQLite migrations (archived, no longer needed):
- `schema.sql` → base tables (decks, cards)
- `002_add_progress_tracking.sql` → card_attempts, card_schedule
- `003_add_card_tags.sql` → tags column
- `004_add_users_and_auth.sql` → users, sessions, user_id on decks

---

## Offline Capabilities

### Assessment: Difficulty 4/10 (basic) to 6/10 (full sync)

The application architecture is well-suited for offline capabilities.

### What Makes It Easier
1. **Clean separation already exists:**
   - All API calls go through Pinia stores
   - Data is already managed client-side during practice sessions
   - Vue 3 + Pinia architecture is ideal for offline-first patterns

2. **Perfect use case:**
   - Flashcard practice doesn't need real-time sync
   - Most interactions are read-heavy (viewing/practicing cards)
   - Write operations (recording results) can be queued

### Implementation Levels

#### Level 1: Basic Offline (Easy - 1-2 days work)
1. **Service Worker + Cache** - Use Vite PWA plugin
   - Cache the built app assets
   - Cache card data from API responses
   - App works offline for already-loaded decks

2. **IndexedDB for local storage** - Replace or supplement Pinia
   - Store decks/cards locally (instead of fetching from API each time)
   - Practice sessions work entirely offline

#### Level 2: Sync When Online (Medium - 3-5 days work)
3. **Queue write operations**
   - Store card attempts/progress locally
   - Sync to backend when connection returns

4. **Conflict resolution**
   - Handle cases where cards were edited both online and offline
   - Last-write-wins is probably fine for this use case

#### Level 3: Full PWA (Medium+ - add another 2-3 days)
5. **Install prompt** - Make it installable on phones/desktop
6. **Background sync** - Sync data even when app is closed
7. **Push notifications** - Remind user to practice

### Technology Recommendations

**Easiest path:**
- [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) - Handles service worker + manifest
- [`Dexie.js`](https://dexie.org/) - Wrapper for IndexedDB (much easier than raw IndexedDB API)
- [`Pinia Plugin Persist`](https://prazdevs.github.io/pinia-plugin-persistedstate/) - Auto-sync Pinia state to localStorage/IndexedDB

### Authentication Considerations
The app now has user accounts with session cookies. Offline mode works great, but need to handle:
- Session expiration while offline
- User switching between devices
- Syncing data to the correct user account

---

## Multi-Platform Distribution (Web + Desktop)

### Question: If offline work is done, how difficult to maintain as both web app and Tauri app?

**Answer: Not difficult at all.** Offline capabilities actually make the Tauri transition *easier*.

### Why It Works Well

**Tauri is essentially a web app wrapper:**
- Vue frontend code stays identical
- HTML/CSS/JS runs in Tauri's webview (same as browser)
- No code rewrite needed for the UI

**With offline capabilities, bonus benefits:**
- App already works without constant API calls
- Local-first data storage (IndexedDB) works identically in Tauri
- Service workers work in Tauri (though less critical since it's always "installed")

### What Changes for Tauri

#### Minimal changes:
1. **Backend communication** - Instead of `fetch('/api/...')`:
   - **Option A**: Keep hitting the Docker-hosted backend (easiest, requires network access)
   - **Option B**: Bundle a local SQLite database and run API logic in Tauri's Rust backend (true offline)

2. **Build configuration**:
   - Add `tauri.conf.json` configuration
   - Add Rust backend files (minimal if using Option A)
   - Build script produces both web and desktop apps

3. **Platform-specific features** (optional):
   - Native file system access (export decks to actual files)
   - Native notifications
   - System tray icon
   - Auto-updater

### Maintenance Overhead

**Single codebase, multiple outputs:**
```
src/              <- Same Vue app
  components/     <- Works everywhere
  views/          <- Works everywhere
  store/          <- Works everywhere

dist/             <- Web build (Vite)
dist-tauri/       <- Desktop builds (Tauri)
```

**What you'd maintain:**
- One Vue codebase
- One set of components/views/stores
- One build process (with different targets)
- Platform-specific code only if you use native features

### Recommended Strategy

For this use case:
1. Build offline-first web app (works in browser, progressive enhancement)
2. Wrap it with Tauri when you want desktop apps
3. Keep using the Docker-hosted backend (sync when online)
4. Add native features (like local file export) only when needed

This gives you:
- Web app (deploy via Docker on your VM)
- Desktop app (Mac/Windows/Linux via Tauri)
- Mobile-ready PWA (installable on phones)
- Single codebase

**The offline work done for PWA directly enables the Tauri version.** They complement each other rather than compete.

---

## Summary

The application has excellent architectural flexibility:

1. **Deployment**: Self-hosted Docker Compose on a VM you control (PostgreSQL + Node.js)
2. **Migrations**: Consolidated into a single PostgreSQL schema
3. **Storage**: Garage or MinIO for future S3-compatible object storage
4. **Offline**: Well-suited for offline-first architecture with moderate implementation effort
5. **Multi-platform**: Can be distributed as web app, PWA, and desktop app (via Tauri) with single codebase
