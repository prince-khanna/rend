# Rend — Product Spec (MVP)

## Goal
A web app where users can upload HTML files, view them rendered, and share them publicly via a unique URL.

## Users
- **Authenticated users** — can upload, manage, and share their HTML files
- **Public visitors** — can view any HTML shared via a public link (no login required)

---

## Features

### Auth
- Sign up / log in via email + password (Supabase Auth)
- Session persists across page reloads
- Protected routes redirect unauthenticated users to login

### Upload
- Upload a single `.html` file (drag-and-drop or file picker)
- Max file size: 5MB (MVP)
- File stored in Supabase Storage under `uploads/{user_id}/{uuid}.html`
- Metadata saved to DB: `id`, `user_id`, `name`, `storage_key`, `public_url`, `is_public`, `created_at`
- Default visibility: **private** (only owner can view)

### Dashboard
- Lists all uploads by the logged-in user
- Shows: filename, upload date, visibility toggle (public/private), copy link button, delete button
- Sorted by newest first

### Render / View
- Route: `/view/[id]`
- Loads HTML from Supabase Storage and renders it in a sandboxed `<iframe>`
- If `is_public = false` and viewer is not the owner → show 404 / access denied
- iframe uses `sandbox="allow-scripts"` — no cookies, no same-origin access

### Public Sharing
- Toggle a file to public → generates a shareable URL: `yourdomain.com/view/[id]`
- Anyone with the link can view — no login required
- Copying the link available from dashboard

### Delete
- Owner can delete a file
- Removes from Storage + DB

---

## Data Model

```sql
-- Supabase / Postgres
create table html_files (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  name        text not null,
  storage_key text not null,        -- path in Supabase Storage bucket
  is_public   boolean default false,
  created_at  timestamptz default now()
);
```

---

## Routes

| Route        | Access                     | Description              |
| ------------ | -------------------------- | ------------------------ |
| `/`          | Public                     | Landing / marketing page |
| `/login`     | Public                     | Login/signup             |
| `/dashboard` | Auth required              | User's file list         |
| `/upload`    | Auth required              | Upload form              |
| `/view/[id]` | Public (if file is public) | Renders the HTML         |

---

## Out of Scope (MVP)
- Folders / organization
- File versioning
- Editing HTML in-browser
- Custom domains
- Analytics / view counts
- Team sharing / permissions
- Preview thumbnails
