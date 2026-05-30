<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project context

Rend hosts uploaded HTML or Markdown files as shareable web pages. Use the domain language below consistently when changing code, docs, routes, database queries, or UI copy.

## Core terminology

- The core entity is a **Page**: a hosted, viewable, shareable web page owned by exactly one User.
- Do not describe a Page as just a file. The underlying uploaded `.html` or `.md` file is the Page's **source**.
- Use `pages` for both the database table and the Storage bucket. Do not introduce `html_files`, `html-files`, `/files`, or similar naming.
- Routes use `/pages/[id]`. Do not use `/view/[id]` or `/files/[id]`.

## Page behavior

- Page public URLs are UUID-based. Do not add user-defined slugs.
- A Page display name is initially derived from the uploaded filename with the `.html` or `.md` extension stripped. Owners can rename it afterward.
- New Pages are public by default. Users may toggle visibility to private afterward.
- Visibility controls are available to the owner on both the dashboard and the Page view toolbar.
- After a successful upload, redirect to `/pages/[id]`, not `/dashboard`.
- Deleted Pages are hard-deleted: remove the database row and the Storage object. Deleted links should return 404.

## Upload and rendering

- Upload lives on a dedicated `/upload` page, not in a modal.
- Markdown uploads are converted to HTML at upload time.
- Store both the rendered HTML and the raw source file for Markdown uploads: HTML for rendering, raw source for later download.
- Track the original source type in the `source_type` column.
- The Page view is a toolbar plus iframe layout: a thin header bar above a full-height iframe.
- Owner toolbar actions: copy link, rename, visibility toggle, delete.
- Public visitor toolbar: page name and copy-link button.
- iframe sandbox policy must remain `sandbox="allow-scripts"` only. Do not add `allow-same-origin`; uploaded HTML must not be able to access Storage-domain cookies or localStorage.

## Auth and navigation

- Sign-up uses auto-confirm auth. Do not add an email verification requirement.
- Users are logged in immediately after sign-up.
- `/` redirects logged-in users to `/dashboard`; public visitors see the landing page.
