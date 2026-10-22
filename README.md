> This is a portfolio version of a production system I built for a company whose confidentiality policy does not allow the real product to be shown. The original work cannot be published. This repository is a different version, created only for the portfolio: it follows the same architecture decisions, with a different scope, brand, and data. It is not the client's codebase.

# Hearth

Hearth is a small membership product: a short feed of everyday habits, and a coach that only suggests habits. The coach is not medical advice. It does not diagnose and it does not recommend a dose.

## Decision

Hearth is a modular monolith. Postgres is the source of truth. Entitlement is checked on the server. Coach data is isolated from the feed, with stricter access and a shorter retention window. TanStack Query pages the feed. Redux stores UI state only. The coach replies as a stream that is not cached. Feed reads go through a replica seam (`DATABASE_READ_URL`).

The portfolio note is [docs/adr/0001-portfolio-version.md](docs/adr/0001-portfolio-version.md). The technical decision is [docs/adr/0002-decision.md](docs/adr/0002-decision.md).

## Architecture

```text
Browser
  |
  +-- src/ui
  |     React screens
  |     TanStack Query for feed, coach, and session
  |     Redux for composerOpen and draft only
  |
  +-- src/app
  |     Next.js pages and route handlers on port 3301
  |     src/middleware.ts assigns x-request-id
  |     src/instrumentation.ts refuses to boot when env is incomplete
  |
  +-- src/composition/container.ts
        the only place that builds repositories and selects CoachResponder
        |
        +-- src/application     use cases
        |     +-- src/domain    pure rules (no React, no Postgres driver)
        |
        +-- src/ports           repositories, clock, logger, CoachResponder
        +-- src/contracts       Zod schemas for HTTP JSON
        |
        +-- src/adapters/postgres
        |     identity | membership | feed | coach
        |     feed reads use DATABASE_READ_URL
        |     writes use DATABASE_URL
        +-- src/adapters/coach/fake-coach-responder.ts
        +-- src/adapters/http        cookies, webhook signature, HTTP errors
        +-- src/adapters/logging     JSON logs, request id, redacted fields
        +-- src/adapters/crypto      passwords, session token hashes, ids

Postgres host port 5434
  schema identity | schema membership | schema feed | schema coach
```

Directories under `src/` are `adapters`, `app`, `application`, `composition`, `contracts`, `domain`, `ports`, and `ui`, plus `middleware.ts` and `instrumentation.ts`.

## Run

Requirements: Node.js 20 or newer, pnpm, and Docker.

From PowerShell, in this folder:

```powershell
Copy-Item .env.example .env
```

Edit `.env`. For the local Compose database, set `USER` and `PASSWORD` to `POSTGRES_USER` and `POSTGRES_PASSWORD` from `docker-compose.yml`. Set `COACH_ADAPTER` to `fake`. Use long stand-in values for `SESSION_SECRET` and `WEBHOOK_SECRET`. `.env.example` has placeholders only.

```powershell
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3301. The web process listens on port 3301 and serves the route handlers in the same process. Postgres is published on host port 5434. Both `DATABASE_URL` and `DATABASE_READ_URL` point at that same database in local development.

Demo accounts created by the seed:

| Email | Password | Tier |
| --- | --- | --- |
| mira@hearth.example | hearth-demo-free | Free |
| jules@hearth.example | hearth-demo-member | Member |

Sign in as Mira and open http://localhost:3301/posts/33333333-3333-4333-8333-333333333333 to see the members-only state. Sign in as Jules to publish and to use the coach.

Upgrade a free account with the local signed webhook while the app is running:

```powershell
pnpm simulate:membership -- 11111111-1111-4111-8111-111111111111
```

Delete coach messages older than `COACH_RETENTION_DAYS`. Posts stay:

```powershell
pnpm retain
```

## Test

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm db:seed
pnpm test:e2e
```

`pnpm test` runs unit tests, React Testing Library, and integration tests against the Compose Postgres. The integration harness applies migrations. It creates rows with its own users and deletes those users afterwards.

The checks that protect the architecture:

- A free account receives 403 for a members-only post, and that response does not include the post body.
- Retention deletes an old coach message and leaves the feed post in place.
- The coach stream responds with `Cache-Control: no-store`.
- A source test fails if feed code imports or names the coach schema.
- Playwright signs in, publishes a post, and opens the coach.

GitHub Actions runs the same steps. See `.github/workflows/ci.yml`.

## Tradeoffs

- One database, two connection strings. A physical replica is a configuration change, not a code change. While both URLs match, a publish is visible on the next feed read. A real replica could lag. That lag is accepted until a replica exists.
- The coach is a fake adapter with fixed habit copy. The port is the seam for a model later. Version 1 does not call a model provider.
- The stream is not cached. Feed JSON is `private, no-store` as well, so a shared cache cannot replay one person's feed to another. TanStack Query still keeps the feed in the browser.
- Redux holds the composer draft in memory. A refresh clears it. The feed is not stored in Redux.
- The webhook checks a Stripe-shaped signature with the local secret. Version 1 does not call Stripe's API.
- Retention is a one-shot command. There is no background worker, so this process does not install its own SIGTERM handler. Next.js handles signals for the web server.
- Account deletion cascades through foreign keys to `identity.users`. Each repository still queries only its own schema.

## Out of scope

Physical replica, social graph, mobile app, and clinical history. Video webhooks are not part of this version. The coach does not diagnose, prescribe, or recommend a dose.
