# PRD — Rend (MVP)

## Problem Statement

Developers and designers frequently produce standalone HTML files — prototypes, reports, data visualisations, static pages — and have no quick way to host, view, or share them. Uploading to a server requires infra access; sending the file directly requires the recipient to open it locally. There is no lightweight, friction-free way to say "here is the rendered page, anyone can open it."

---

## Solution

A web app where authenticated users can upload `.html` files, view them rendered in the browser, toggle them public, and share a permanent URL with anyone — no login required to view. Files are stored in cloud object storage. The rendered output is isolated from the host application for security.

---

## User Stories

### Authentication
1. As a new visitor, I want to sign up with email and password, so that I can start uploading files.
2. As a returning user, I want to log in with my email and password, so that I can access my previously uploaded files.
3. As a logged-in user, I want my session to persist across page reloads, so that I do not have to log in every visit.
4. As an unauthenticated visitor trying to access a protected page, I want to be redirected to the login page, so that I understand I need an account to use the upload features.
5. As a logged-in user, I want to log out, so that my account is secure on shared devices.

### Upload
6. As a logged-in user, I want to upload an HTML file via a file picker, so that I can host it without any server access.
7. As a logged-in user, I want to drag and drop an HTML file onto the upload area, so that uploading feels fast and native.
8. As a logged-in user, I want to see upload progress feedback, so that I know the file is being processed.
9. As a logged-in user, I want to be shown an error if I try to upload a non-HTML file, so that I don't accidentally store wrong file types.
10. As a logged-in user, I want to be shown an error if my file exceeds 5MB, so that I understand the size limit before retrying.
11. As a logged-in user, after a successful upload I want to be taken to my dashboard, so that I can immediately see and share the new file.

### Dashboard
12. As a logged-in user, I want to see a list of all my uploaded files, so that I can manage them in one place.
13. As a logged-in user, I want files listed newest-first, so that my most recent uploads are immediately visible.
14. As a logged-in user, I want to see the filename and upload date for each file, so that I can identify them at a glance.
15. As a logged-in user, I want to see whether each file is public or private, so that I know which ones are shareable.
16. As a logged-in user, I want a one-click copy for the share URL of a public file, so that sharing is frictionless.
17. As a logged-in user, I want to delete a file from my dashboard, so that I can remove files I no longer need.
18. As a logged-in user, I want a confirmation step before deleting, so that I do not accidentally remove files.
19. As a logged-in user with no uploads yet, I want to see a prompt directing me to upload my first file, so that the empty state is not confusing.

### Visibility
20. As a logged-in user, I want to toggle any file between public and private, so that I control who can view it.
21. As a logged-in user, when I make a file public I want the share URL to appear immediately, so that I can copy and send it right away.
22. As a logged-in user, when I make a file private I want to know that existing share links will stop working, so that I can make an informed decision.

### Rendering
23. As a logged-in owner, I want to view my private file rendered in the browser, so that I can verify it looks correct before sharing.
24. As a public visitor with a share link, I want to view the rendered HTML without logging in, so that the recipient experience has zero friction.
25. As a public visitor, I want the rendered HTML to behave normally (CSS, JavaScript), so that interactive pages work as expected.
26. As a visitor with a link to a private or deleted file, I want to see a clear "not found" message, so that I am not left with a blank page.
27. As a security-conscious user, I want to know that uploaded HTML cannot steal my session or cookies from the host app, so that I can trust the platform.

### Sharing
28. As a logged-in user, I want a permanent URL (`/view/[id]`) for each public file, so that the link never changes after I share it.
29. As a logged-in user, I want the share URL to be copyable from both the dashboard and the view page, so that I can share from wherever is most convenient.

---

## Implementation Decisions

### Auth Layer
- Supabase Auth handles sign-up, login, and session management.
- Next.js middleware runs on the edge to protect `/dashboard` and `/upload` routes — unauthenticated requests redirect to `/login`.
- The Supabase SSR client is used server-side; the browser client is used client-side. Never mix them.

### Storage
- Supabase Storage bucket: `html-files` (private by default, RLS governs access).
- Files stored at path: `{user_id}/{uuid}.html` to namespace per user and guarantee uniqueness.
- File metadata (name, storage key, visibility, timestamps) stored in a Postgres table `html_files`.

### Data Model

```
html_files
  id          uuid PK
  user_id     uuid FK → auth.users
  name        text
  storage_key text
  is_public   boolean default false
  created_at  timestamptz
```

### Row-Level Security
- Owners have full read/write/delete on their own rows.
- Any authenticated or anonymous caller can SELECT rows where `is_public = true`.
- Storage access mirrors the DB policy via Supabase Storage RLS.

### Rending
- Rendered via `<iframe sandbox="allow-scripts allow-same-origin">` pointing to a signed (or public) Supabase Storage URL.
- The Storage domain is a different origin from the app — uploaded HTML cannot access the app's cookies, localStorage, or DOM.
- `allow-scripts` is enabled to support interactive HTML. `allow-forms` and `allow-popups` are excluded to limit attack surface.

### Signed vs Public URLs
- Private files: generate a short-lived signed URL server-side on each `/view/[id]` page load.
- Public files: use the static public URL (no expiry). This also means making a file public in Storage when `is_public` is set to true.

### Upload Flow
1. Client sends multipart form to Next.js API route `/api/upload`.
2. API route validates file type (`.html`) and size (≤ 5MB) server-side.
3. File uploaded to Supabase Storage.
4. Metadata row inserted into `html_files`.
5. Response returns the new file `id`; client redirects to dashboard.

### Deletion Flow
1. API route deletes the row from `html_files`.
2. API route deletes the object from Supabase Storage.
3. Both happen in the same request; partial failure is surfaced as an error (no silent data loss).

### Module Boundaries

| Module                  | Responsibility                                                   |
| ----------------------- | ---------------------------------------------------------------- |
| `lib/supabase.ts`       | Exports browser and server Supabase clients                      |
| `lib/storage.ts`        | Upload, delete, get signed URL, get public URL                   |
| `lib/files.ts`          | DB CRUD: insert, list by user, toggle visibility, delete         |
| `components/HtmlFrame`  | Sandboxed iframe with consistent sizing and error state          |
| `components/UploadForm` | File validation, drag-and-drop, progress feedback                |
| `components/FileList`   | Dashboard table: file rows, visibility toggle, copy link, delete |

---

## Testing Decisions

**What makes a good test:** test observable behaviour from the outside — what the user or caller experiences — not internal implementation details. A test that breaks when you rename a private variable is a bad test.

**Modules to test:**

| Module             | What to test                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/storage.ts`   | Upload stores file at correct path; delete removes it; signed URL is returned for private files; public URL returned for public files         |
| `lib/files.ts`     | Insert creates a row; list returns only the calling user's rows; toggle updates `is_public`; delete removes the row                           |
| `POST /api/upload` | Rejects non-HTML files with 400; rejects files > 5MB with 400; unauthenticated request returns 401; valid upload returns 200 with new file id |
| Middleware         | Unauthenticated request to `/dashboard` redirects to `/login`; authenticated request passes through                                           |
| `/view/[id]`       | Public file renders iframe; private file owned by viewer renders iframe; private file visited by stranger returns 404                         |

**Approach:** Integration-style tests against a real Supabase local instance (via `supabase start`) are preferred over mocks for the storage and DB layers. Unit tests are sufficient for the API route validation logic.

---

## Out of Scope

- Folders or file organisation
- File versioning / history
- In-browser HTML editing
- Custom domains for rendered pages
- View counts or analytics
- Team sharing / multi-user permissions
- Preview thumbnails
- OAuth / social login (email+password only for MVP)
- Bulk upload

---

## Further Notes

- The `/view/[id]` route must work without JavaScript on the host page (for link-preview scrapers and accessibility). The iframe `src` should be set server-side via SSR, not injected client-side.
- Supabase free tier limits: 1GB storage, 500MB DB, 50k MAU. These are sufficient for MVP and early users — no immediate cost concerns.
- When Prince is ready to move beyond MVP, the most natural next additions are: preview thumbnails (screenshot the iframe), view counts, and in-browser editing.
