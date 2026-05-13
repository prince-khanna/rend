# ADR 0001 — iframe sandbox policy: allow-scripts only

**Status:** Accepted  
**Date:** 2026-05-13

## Context

Pages are rendered inside an `<iframe>` whose `src` points to a Supabase Storage URL (a separate origin from the app). We needed to decide which `sandbox` permissions to grant.

Two options were considered:

- `sandbox="allow-scripts allow-same-origin"` — allows uploaded HTML to run JS and access Storage-domain cookies/localStorage
- `sandbox="allow-scripts"` — allows JS only; no cookie or storage access on any origin

The `allow-same-origin` flag is safe when the iframe is cross-origin (which it is here — Supabase Storage is not the app domain). However, it still grants uploaded HTML access to Storage-domain storage, which is unnecessary for the expected use cases (prototypes, reports, visualisations).

## Decision

Use `sandbox="allow-scripts"` only. Drop `allow-same-origin`.

## Reasoning

1. The primary use cases (static prototypes, data visualisations, reports) do not require cookie or localStorage access.
2. Tighter sandbox = smaller attack surface. If we ever serve from a same-origin path in future, `allow-same-origin + allow-scripts` would be dangerous without this ADR flagging the risk.
3. `fetch()` and most JS APIs still work without `allow-same-origin`. The constraint is narrow.

## Consequences

- Uploaded HTML cannot read or write cookies or localStorage on the Storage domain.
- If a future use case genuinely needs storage access, this decision must be revisited explicitly and the security implications re-evaluated.
