# 2. Modular monolith with an isolated coach

## Context

Hearth needs a member feed and a habit coach in one portfolio-sized product. The feed is shared. Coach notes are private, more tightly authorized, and kept for a shorter time. A free account must not receive the body of a members-only post. The coach reply is a stream and must not be stored in a shared cache. Feed reads should be able to move to a replica later without rewriting the use cases.

See also [0001-portfolio-version.md](./0001-portfolio-version.md).

## Decision

Ship one Next.js process on port 3301. Postgres is the source of truth, with a schema per module: `identity`, `membership`, `feed`, and `coach`.

- Domain rules and application use cases do not import React or the Postgres driver.
- HTTP, SQL, password hashing, and the coach model sit behind ports.
- `src/composition/container.ts` is the only place that constructs repositories and chooses the `CoachResponder`. Version 1 selects the fake habit adapter.
- Entitlement is checked in the read-post use case on the server. A members-only post returns 403 to a free account, and the list query does not return that body.
- Feed reads use `DATABASE_READ_URL`. Writes use `DATABASE_URL`. Locally both URLs point at the same Postgres on host port 5434.
- The feed module does not import the coach schema. The coach module does not import the feed schema.
- TanStack Query owns feed and coach server state. Redux stores only whether the composer is open and the local draft.
- The coach stream sets `Cache-Control: no-store`.
- A separate `pnpm retain` command deletes coach messages older than `COACH_RETENTION_DAYS` and does not delete posts.
- Membership upgrades arrive through a signed webhook. The local simulator signs the body with `WEBHOOK_SECRET`. The session cookie does not cache the tier; each request reads membership from Postgres.

## Consequences

- A physical replica can be introduced by pointing `DATABASE_READ_URL` at another Postgres. Until then, read-your-writes is immediate because both pools use one database. Replica lag is out of scope.
- The fake coach cannot diagnose or recommend a dose. Replacing it means a new adapter in the composition root, not a change to the feed.
- Retention is a command, not a long-running worker. Nothing in this version needs a custom SIGTERM handler.
- Cross-schema foreign keys point at `identity.users` so deleting an account removes that person's rows. Module code still queries only its own schema.
