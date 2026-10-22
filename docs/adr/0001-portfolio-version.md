# 1. Portfolio version

## Context

Hearth is a portfolio version of a production system. The company's confidentiality policy does not allow the real product to be shown, and the original work cannot be published. This repository is a different version, created only for the portfolio: it follows the same architecture decisions, with a different scope, brand, and data. It is not the client's codebase.

The code, schema, copy, and sample data in this repository were written for Hearth. Nothing here is copied from the production system.

## Decision

Publish this repository as a fictional product called Hearth: a short habit feed and a habit coach. Keep the modular boundaries, the server-side entitlement check, the isolated coach data, and the read replica seam. Change the scope, the brand, and the data.

The technical decision is recorded in [0002-decision.md](./0002-decision.md).

## Consequences

- The public README opens with the confidentiality statement and does not name an employer, a client, or an internal codename.
- The repository does not include production metrics, team size, quotes, dumps, or assets from the real system.
- Readers should judge the architecture and the tests, not treat Hearth as the production product.
