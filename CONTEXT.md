# Pigeon — Domain Glossary

## Page
The core entity. A Page is a file uploaded by a User (HTML or Markdown), stored in object storage as HTML, and rendered in the browser at a permanent URL. A Page has a visibility state (public or private) and belongs to exactly one User.

- A Page is *not* just a file — it is a hosted, viewable, shareable web page.
- The underlying `.html` file is referred to as the **source** of the Page.
- Routes use `/pages/[id]`, not `/view/[id]` or `/files/[id]`.
- The DB table is `pages` and the Storage bucket is `pages` — not `html_files` / `html-files`.
- Markdown files (`.md`) are converted to HTML at upload time. Both the rendered HTML and the raw source file are stored — the HTML for rendering, the source for future download. The source type is tracked in the `source_type` column.
- A Page's public URL is based on a UUID — no user-defined slugs.
- A Page's display name is derived from the uploaded filename (`.html` or `.md` extension stripped). No editable title.
- A Page is **public by default** when first uploaded. The user can toggle it private afterward.
- After a successful upload, the user is redirected to the Page view (`/pages/[id]`), not the dashboard.
- The Page view layout is **toolbar + iframe**: a thin header bar above a full-height iframe. Owner sees copy-link, visibility toggle, delete; public visitor sees page name + copy-link button.
- Auth uses **auto-confirm** sign-up — no email verification required. Users are logged in immediately after sign-up.
- Deletion is **hard delete** — row removed from DB and object removed from Storage. Deleted page links return 404.
- `/` redirects logged-in users to `/dashboard`. Public visitors see the landing page.
- Upload lives on a **separate `/upload` page**, not a modal.
- Visibility toggle is available in **both** the dashboard and the Page view toolbar (owner only).
- iframe sandbox policy is `sandbox="allow-scripts"` only — `allow-same-origin` is excluded to prevent uploaded HTML from accessing Storage-domain cookies and localStorage.
