This is a portfolio version of a production system I built for a company whose confidentiality policy does not allow the real product to be shown. The original work cannot be published. This repository is a different version, created only for the portfolio: it follows the same architecture decisions, with a different scope, brand, and data. It is not the client's codebase.

# Hearth

Hearth is a small membership product: a short feed of everyday habits, and a coach that only suggests habits. The coach screen shows a notice that this is not medical advice. The coach does not diagnose and it does not recommend a dose.

The portfolio note is [docs/adr/0001-portfolio-version.md](docs/adr/0001-portfolio-version.md). The technical decision is [docs/adr/0002-decision.md](docs/adr/0002-decision.md).

## Decision

Hearth is a modular monolith. Postgres is the source of truth. Entitlement is checked on the server: a free account receives 403 for a members-only post, and that response does not include the body. The feed list omits members-only posts for a free account. Any signed-in account can publish a public post and ask the coach. Only a member can publish or read a members-only post.

The coach schema is isolated from the feed. Feed code does not mention coach. Coach code does not import the feed module and does not query `feed.posts`. Coach notes are private to the signed-in person and have a shorter retention window than posts.

TanStack Query owns server state for the feed, a single post, the session, and the coach thread. Redux stores only UI state: whether the composer is open and the local draft. Locale and theme are browser preferences, not server state. The coach stream is a separate request with `Cache-Control: no-store`. Feed reads go through the `DATABASE_READ_URL` seam. Writes use `DATABASE_URL`.

## Diagram

```text
src/
  adapters/
    coach/fake-coach-responder.ts
    crypto/          passwords, session token hashes, ids, clock
    http/            cookies, webhook signature, HTTP errors
    logging/         JSON logs, request id, redacted fields
    postgres/
      identity-repository.ts
      membership-repository.ts
      feed-repository.ts       reads use DATABASE_READ_URL, writes use DATABASE_URL
      coach-repository.ts
      account-writer.ts
      migrate.ts
      query.ts
  app/
    page.tsx  login/  signup/  coach/  posts/[id]/
    api/auth/  api/session/  api/feed/  api/feed/[id]/
    api/coach/messages/  api/coach/stream/
    api/webhooks/stripe/  api/health/
    layout.tsx  globals.css  icon.svg
  application/
    auth/  coach/  feed/  membership/
  composition/
    container.ts     the only place that builds repositories and selects CoachResponder
    env.ts
  contracts/
    schemas.ts
  domain/
    coach/  feed/  identity/  membership/
    errors.ts  ids.ts
  ports/
  ui/
  instrumentation.ts   refuses to boot when env is incomplete
  middleware.ts        assigns x-request-id

migrations/001_init.sql
  schema identity | schema membership | schema feed | schema coach
  public.schema_migrations records applied files
scripts/          migrate, seed, retain, simulate-membership-webhook
tests/            unit, ui, integration, e2e
docs/adr/         0001-portfolio-version.md, 0002-decision.md
```

Route handlers in `src/app` call use cases in `src/application`. Use cases depend on ports. `src/domain` does not import React, Next.js, Zod, or the Postgres driver. `src/composition/container.ts` is the only file that constructs the repositories and the fake coach.

## Run

Requirements: Node.js 20 or newer, pnpm 9.15.9 (the `packageManager` in `package.json`), and Docker. CI uses Node.js 22.

From PowerShell, in this folder:

```powershell
Copy-Item .env.example .env
```

Edit `.env`. For the local Compose database, replace `USER` and `PASSWORD` with `hearth`, the `POSTGRES_USER` and `POSTGRES_PASSWORD` in `docker-compose.yml`. Set `COACH_ADAPTER` to `fake`. `SESSION_SECRET` and `WEBHOOK_SECRET` must be at least 16 characters. `.env.example` has placeholders only.

```powershell
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://127.0.0.1:3301. `pnpm dev` and `pnpm start` bind to `127.0.0.1` so Windows does not send `localhost` to an IPv6-only socket. The same process serves the route handlers. Postgres is published on host port 5434. In local development both `DATABASE_URL` and `DATABASE_READ_URL` point at `127.0.0.1:5434`.

`pnpm dev` and `pnpm start` refuse to boot when the environment is incomplete. `pnpm build` skips that check.

Demo accounts created by the seed:

| Email | Password | Tier |
| --- | --- | --- |
| jules@hearth.example | hearth-demo-member | Member |
| mira@hearth.example | hearth-demo-free | Free |

Members-only post: http://127.0.0.1:3301/posts/33333333-3333-4333-8333-333333333333

Sign in as Mira and open that post to see the locked state. The API returns 403 and does not include the post body. Sign in as Jules to read it. Jules can publish a members-only post. Mira can publish a public post. Both can open the coach.

Upgrade a free account with the local signed webhook while the app is running. The id below is Mira's seeded user:

```powershell
pnpm simulate:membership -- 11111111-1111-4111-8111-111111111111
```

Delete coach messages older than `COACH_RETENTION_DAYS`. Posts stay:

```powershell
pnpm retain
```

## Test

With the Compose Postgres from the Run section still up:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm db:seed
pnpm test:e2e
```

`pnpm test` runs unit tests, React Testing Library, and integration tests against Postgres on host port 5434. The integration harness applies migrations. It creates rows with its own users and deletes those users afterwards.

The checks that protect the architecture:

- A free account receives 403 for a members-only post, and that response does not include the post body. The feed list for that account omits the post.
- Retention deletes an old coach message and leaves the feed post in place.
- The coach stream responds with `Cache-Control: no-store`.
- A source test fails if feed code mentions coach, and if coach code imports the feed module or queries `feed.posts`.
- Playwright signs in as Jules, publishes a post, and opens the coach. The coach screen shows the not-medical-advice notice.

GitHub Actions runs typecheck, lint, and `pnpm test`, then installs Playwright, seeds, and runs `pnpm test:e2e`. See `.github/workflows/ci.yml`.

## Tradeoffs

- One database, two connection strings. A physical replica is a configuration change, not a code change. While both URLs match, a publish is visible on the next feed read. A real replica could lag. That lag is accepted until a replica exists.
- The coach is a fake adapter with fixed habit copy. The port is the seam for a model later. Version 1 does not call a model provider.
- The stream is not cached and is not stored in TanStack Query. Feed, post, session, and coach-thread JSON are `private, no-store`. TanStack Query still keeps that server state in the browser for a five-second `staleTime`. After the stream finishes, the coach thread query is invalidated.
- Redux holds the composer draft in memory. A refresh clears it. The feed is not stored in Redux. Locale and theme stay in `localStorage`.
- The webhook checks a Stripe-shaped signature with the local secret. Version 1 does not call Stripe's API. The session cookie stores a token, not the tier. Each request reads membership from Postgres.
- Retention is a one-shot command. There is no background worker, so this process does not install its own SIGTERM handler. Next.js handles signals for the web server.
- Foreign keys cascade to `identity.users`. Deleting that row removes sessions, membership, posts, and coach messages. Each repository still queries only its own schema. This version has no account-deletion screen. Applied migration files are recorded in `public.schema_migrations`.

## Out of scope

Physical replica, social graph, mobile app, and clinical history. Video webhooks are not part of this version. The coach does not diagnose, prescribe, or recommend a dose.
