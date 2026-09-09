# AI Compliance Copilot — Frontend

Angular frontend for the AI Compliance Copilot RAG application. Talks exclusively to the
Spring Boot backend — never directly to OpenAI.

```
Angular  →  Spring Boot  →  OpenAI
```

This is a standalone repository, independent from the backend
([`spring-ai-multitenant-rag`](https://github.com/ThierryTe/spring-ai-multitenant-rag),
checked out as a sibling directory during local development) — separate git history, CI, and
deployment pipeline. See [`docs/DEPLOY.md`](docs/DEPLOY.md) for how the two are wired together
in production despite living in different repos.

## Stack

- **Angular 21.2** (standalone components only, no `NgModule`)
- **Zoneless** change detection (Angular 21 default — no `zone.js` dependency)
- **Signals-first**: `signal()` / `computed()` / `effect()` for state; RxJS kept only where it
  earns its place (upload progress events, HTTP)
- **Vitest** as the test runner (Angular's `@angular/build:unit-test` builder)
- SCSS, native `@if` / `@for` / `@switch` control flow (no `*ngIf` / `*ngFor`)

### Why Angular 21, not 22

Angular 22 (June 2026) is the version where `httpResource()` / `resource()` graduate from
experimental to stable. This project was built on 21 instead because Angular 22 requires
Node ≥22.22.3 / ≥24.15 / ≥26, and the development machine's Node (22.14.0) didn't meet that —
upgrading a machine's global Node install wasn't this project's call to make unilaterally.
`httpResource()` is used anyway: its API is identical between 21 and 22, it's been usable in
practice since 19.2, and it's the correct signals-first tool for reactive GET requests. If the
environment changes, bumping to Angular 22 should be close to a drop-in version bump — no code
here relies on 21-specific behavior.

## Backend contract (verified against the real code, not assumed)

The backend exposes two independent access modes. This frontend targets the **anonymous demo
mode** (`/api/demo/**`, header `X-Demo-Session-Id`), the only one consistent with "no
authentication" — the other, JWT + department RBAC under `/api/auth`, `/api/documents`,
`/api/chat`, is not used here.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/demo/sessions` | Creates a session, no auth |
| GET | `/api/demo/sessions/me` | Requires `X-Demo-Session-Id` header |
| POST | `/api/demo/documents` | Multipart upload, `file` field |
| GET | `/api/demo/documents` | List, includes `status` |
| POST | `/api/demo/chat` | `{ question, departmentId }`, `departmentId` ignored in demo mode |

Key backend behaviors that shape the UI (see inline code comments for exact references):

- Chat is **fully synchronous** — no streaming/SSE. A refused answer (off-topic, no relevant
  context, expired session) comes back as **HTTP 200** with `refused: true`, except a demo
  question-quota overrun, which comes back as **429**.
- Document status is `UPLOADED | PROCESSING | INDEXED | FAILED` (not `UPLOADING`). There is no
  per-document status endpoint in demo mode and no delete endpoint — only the authenticated,
  non-demo flow has those.
- No conversation-history endpoint exists anywhere in the backend. Chat history is
  client-only, held in `ChatStore` for the lifetime of the tab; a refresh loses it by design.
- File size is never returned by `GET /api/demo/documents` — only known locally right after
  the browser picks the file, for that tab's session.
- Demo quotas (`application.properties`): 5 questions, 2 documents, 2h session TTL.

## Architecture — feature-based, not type-based

```
src/app/
  core/
    config/      — API base path, header name constants
    http/        — functional interceptors (demo-session header, error → AppError mapping)
    models/      — DTOs, UI models, DTO→UI mappers, all as plain interfaces/types
    services/    — thin API clients (SessionApi, DocumentApi, ChatApi) — no logic, no URLs
                   anywhere else in the app
    state/       — SessionStore, DocumentsStore, ChatStore: signal-based, providedIn: 'root'
  shared/
    ui/          — generic design-system pieces (EmptyState, LoadingState, ErrorState)
    components/  — small reusable pieces tied to this domain (DocumentStatusBadge)
  layout/
    app-shell          — shared sidebar-menu + routed content shell (workspace & portal)
    sidebar-nav        — left-hand menu, data-driven, active state via routerLinkActive
  features/
    landing/     — marketing page + "start a session" CTA
    session/     — sessionGuard (route protection)
    workspace/
      documents/         — upload, list, item, status badge
      chat/              — message list, input, per-message rendering
      sources/           — SourceList / SourceCard, reused by chat messages
```

Data flow is always `Component → Store → API client → HttpClient/httpResource → Spring Boot`.
No component builds a URL or touches `HttpClient` directly.

## State management

No NgRx. Three `providedIn: 'root'` stores, each owning one domain:

- **`SessionStore`** — the active demo session, quota, expiry. Persisted to `sessionStorage`
  (not `localStorage`: the session should die with the tab, matching its 2h server TTL). Also
  owns `handleExpiry()` — the one required recovery path when a session goes invalid: clear
  the stored session and route back to `/`. Both `ChatStore` and `DocumentsStore` call it
  whenever they see a `session_expired` `AppError`, or (for chat) a graceful 200
  `refusalReason: 'SESSION_EXPIRED'`.
- **`DocumentsStore`** — wraps the documents list as an `httpResource`, plus upload state.
- **`ChatStore`** — message history, in-flight/error state for asking a question.

### `httpResource` vs `HttpClient`

`httpResource` is used only for **GET**s that should re-run reactively: the documents list and
session-info refresh. Every mutation (create session, upload, ask a question) goes through
`HttpClient` directly, per Angular's own guidance against using `httpResource` for
POST/PUT/DELETE.

One real gotcha hit while building this: `httpResource().value()` **throws** when the resource
is in its `error` state (its `defaultValue` option only covers the idle/loading states, not
error). Reading it unconditionally inside a `computed()` will crash any `effect()` that reads
that computed, silently — this broke the session-expiry recovery effect during development
until every read of `.value()` was guarded with `.hasValue()` first. Search `hasValue()` in
`documents.store.ts` for the pattern.

### Polling document status

Ingestion is asynchronous on the backend (`@Async`), and demo mode has no per-document status
endpoint — only the list. `httpResource` re-fetches on reactive-input change, not on a timer,
so `DocumentsStore` drives polling itself: an `effect()` starts a `setInterval` calling
`listResource.reload()` only while at least one document is non-terminal
(`UPLOADED`/`PROCESSING`), and clears it as soon as none are.

### Quota tracking is optimistic, and precisely so

No endpoint returns the post-action quota, so `SessionStore.recordQuestionAsked()` /
`recordDocumentUploaded()` increment a local counter. The chat side needed care: reading
`QuotaGuard.checkAndConsume()` in the backend shows the question slot is consumed **before**
the sensitive-topic/no-context checks but **after** the expiry check — so a refused answer for
`NO_RELEVANT_CONTEXT` or `SENSITIVE_TOPIC` still burns a slot, while `SESSION_EXPIRED` never
does, and neither does a 429 (nothing left to consume) nor a 400/401 (rejected before that
guard runs). `ChatStore.ask()` implements exactly this rule — see its comments.

## Error handling

Every failed request passes through `errorMappingInterceptor`, which turns an `HttpErrorResponse`
into an `AppError { kind, status, message }` with a ready-to-display French message — no raw
error, status code, or stack trace ever reaches a template.

One dev-only edge case worth knowing: the `ng serve` proxy (`proxy.conf.json`, forwarding
`/api/**` to `http://localhost:8080`) returns a bare `500` with an empty body when the backend
process isn't running — indistinguishable from a genuine backend 500 by status code alone. The
backend's `GlobalExceptionHandler` guarantees a real `ErrorResponse` JSON body on every response
it actually produces, so the interceptor treats a `5xx` **without** that body as "server
unreachable" (`kind: 'network'`), not as an application error.

## Routing

```
/                 — landing
/login            — login page

/workspace        — AppShellComponent (guarded by sessionGuard, shellMode: 'workspace')
  /workspace/chat    — anonymous demo chat
  /workspace/files   — anonymous demo document list/upload

/app              — AppShellComponent (guarded by authGuard, shellMode: 'portal')
  /app/chat          — authenticated chat
  /app/files         — authenticated document list/upload
  /app/dashboard     — analytics (guarded by adminGuard, ADMIN role only)
```

`AppShellComponent` (`src/app/layout/`) is a single shared shell used by both the anonymous demo
area and the authenticated portal: a left sidebar menu (Fichiers/Chat, plus Dashboard for admins)
and a routed content area on the right. `shellMode` (route `data`) picks which store backs the
header (`SessionStore` for workspace, `AuthStore` for portal) — the child routes themselves decide
which document/chat components render.

## Running locally

Backend (separate repo/checkout, e.g. a sibling directory) must be running on `:8080` (its
CORS config is pinned to `http://localhost:4200`, matching Angular's default dev port):

```bash
# from the backend's own repo root
docker compose up -d postgres
./mvnw spring-boot:run
```

Frontend:

```bash
npm install
npm start      # ng serve — proxies /api/** to :8080, see proxy.conf.json
npm test       # Vitest, single run: npm test -- --watch=false
npm run build
```

## Deployment

Own Docker image (multi-stage build → nginx serving the static build, `Dockerfile` +
`nginx.conf.template`), own GitHub Actions pipelines (`.github/workflows/ci.yml`,
`.github/workflows/deploy.yml`), own VPS deployment path — see [`docs/DEPLOY.md`](docs/DEPLOY.md).
Nothing here depends on the backend's CI/CD, and nothing in the backend depends on this
repo's.

## Known limitations (by design, for this MVP)

- No document deletion — the backend doesn't expose it in demo mode.
- No "view source" action on a citation — the backend has no endpoint to fetch a document's
  raw content.
- Chat history and a session's document list don't reset when a *new* session is created in
  the same browser tab without a full reload (each store is a long-lived singleton). Not hit
  in practice, since `handleExpiry()`/quota exhaustion push the user back to `/` first.
