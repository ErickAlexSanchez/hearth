# 2. Modular monolith with an isolated coach

## Context

Hearth needs a member feed and a habit coach in one portfolio-sized product. The feed is shared. Coach notes are private to the signed-in person, kept for a shorter time than posts, and stored in their own schema. A free account must not receive the body of a members-only post. The coach reply is a stream and must not be stored in a shared cache. Feed reads should be able to move to a replica later without rewriting the use cases.

See also [0001-portfolio-version.md](./0001-portfolio-version.md).

## Decision

Ship one Next.js process that listens on `127.0.0.1` port 3301. Postgres is the source of truth, with a schema per module: `identity`, `membership`, `feed`, and `coach`. Applied migration files are recorded in `public.schema_migrations`.

- Domain rules and application use cases do not import React, Next.js, Zod, or the Postgres driver.
- HTTP, SQL, password hashing, and the coach model sit behind ports.
- `src/composition/container.ts` is the only place that constructs repositories and chooses the `CoachResponder`. Version 1 selects the fake habit adapter when `COACH_ADAPTER` is `fake`.
- Entitlement is checked on the server. A members-only post returns 403 to a free account, and that response does not include the body. The feed list omits members-only posts for a free account. A free account cannot publish a members-only post. Any signed-in account can publish a public post.
- The coach thread is available to any signed-in account. It is not gated on the member tier. Feed code does not mention coach. Coach code does not import the feed module and does not query `feed.posts`.
- Feed reads use `DATABASE_READ_URL`. Writes use `DATABASE_URL`. Locally both URLs point at the same Postgres on `127.0.0.1` host port 5434.
- TanStack Query owns server state for the paginated feed, a single post, the session, and the coach thread. The coach stream is a separate fetch and is not written into that cache. Redux stores only whether the composer is open and the local draft. Locale and theme are browser preferences in `localStorage`.
- The coach stream sets `Cache-Control: no-store`. Feed, post, session, and coach-thread JSON use `private, no-store`.
- A separate `pnpm retain` command deletes coach messages older than `COACH_RETENTION_DAYS` and does not delete posts.
- Membership upgrades arrive through a signed webhook at `/api/webhooks/stripe`. The local simulator signs the body with `WEBHOOK_SECRET` and posts to `http://127.0.0.1:3301`. The session cookie stores a token, not the tier. Each request reads membership from Postgres.
- `src/instrumentation.ts` loads the environment on boot and refuses to start when it is incomplete. It skips that check while `NEXT_PHASE` is `phase-production-build`, so `pnpm build` does not need a database.
- `src/middleware.ts` assigns `x-request-id` when the request does not already carry one.

When `DATABASE_URL` is unset, the composition root serves an in-memory catalog seeded with the two demo accounts and the members-only post. The Edge middleware only assigns `x-request-id`; it does not read that environment and it does not import the Postgres driver. If `DATABASE_URL` is set and the rest of the environment is incomplete, boot still fails. Local development with `DATABASE_URL` set still uses Postgres, including the read and write URL split. Membership is still read on the server for each request.

## Consequences

- A physical replica can be introduced by pointing `DATABASE_READ_URL` at another Postgres. Until then, read-your-writes is immediate because both pools use one database. Replica lag is out of scope.
- The fake coach stays on everyday habits. It does not diagnose or recommend a dose. Replacing it means a new adapter in the composition root, not a change to the feed. The coach screen keeps a visible notice that the reply is not medical advice.
- `no-store` stops a shared cache. It does not stop TanStack Query from keeping server state in the browser. The configured `staleTime` is five seconds. The thread query is invalidated after the stream finishes.
- Retention is a command, not a long-running worker. Nothing in this version needs a custom SIGTERM handler. Next.js handles signals for the web server.
- Cross-schema foreign keys point at `identity.users`, so deleting that row removes the person's sessions, membership, posts, and coach messages. Module code still queries only its own schema. This version has no account-deletion screen.
- The dev server binds IPv4. The documented app URL is `http://127.0.0.1:3301`, because on Windows `localhost` can resolve to an IPv6 address where nothing is listening.
