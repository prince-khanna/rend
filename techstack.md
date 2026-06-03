# Pigeon — Tech Stack (MVP)

## Stack Overview

| Layer     | Choice                  | Reason                                              |
| --------- | ----------------------- | --------------------------------------------------- |
| Framework | Next.js 14 (App Router) | Full-stack in one repo, API routes, SSR for auth    |
| Language  | TypeScript              | Type safety, better DX                              |
| Auth      | Supabase Auth           | Built-in, free tier, works with Supabase Storage    |
| Database  | Supabase Postgres       | Free tier, row-level security, integrates with auth |
| Storage   | Supabase Storage        | S3-compatible, simpler than raw AWS, free tier      |
| Styling   | Tailwind CSS            | Fast to build, no config overhead                   |
| Deploy    | Vercel                  | Zero-config Next.js deploy, free tier               |

---

## Key Libraries

```json
{
  "dependencies": {
    "next": "14.x",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "tailwindcss": "^3"
  }
}
```

---

## Supabase Setup

### Storage Bucket
- Bucket name: `html-files`
- Public bucket: **no** (files served via signed URLs or policy)
- RLS policy: owner can read/write their own files; public files readable by all

### Row Level Security (RLS)

```sql
-- Users can only insert/update/delete their own rows
create policy "owner full access"
  on html_files for all
  using (auth.uid() = user_id);

-- Anyone can read public files
create policy "public read"
  on html_files for select
  using (is_public = true);
```

---

## Project Structure

```
/app
  /login          → login/signup page
  /dashboard      → file list (auth required)
  /upload         → upload form (auth required)
  /view/[id]      → public HTML renderer
  /api
    /upload       → handles file upload to Supabase Storage
    /files/[id]   → toggle visibility, delete

/lib
  supabase.ts     → Supabase client (browser + server)

/components
  FileList.tsx
  UploadForm.tsx
  HtmlFrame.tsx   → sandboxed iframe renderer
```

---

## Pigeoning — Security

User HTML is rendered in a sandboxed iframe:

```tsx
<iframe
  src={signedUrl}
  sandbox="allow-scripts allow-same-origin"
  className="w-full h-full border-0"
/>
```

- Served from Supabase Storage domain — isolated from main app origin
- No access to main app cookies or localStorage
- `allow-scripts` enables JS inside uploaded HTML
- No `allow-forms`, `allow-popups` to limit attack surface

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-side only, never expose to client
```

---

## Cost (Free Tier Limits)

| Service          | Free Tier               |
| ---------------- | ----------------------- |
| Supabase DB      | 500MB                   |
| Supabase Storage | 1GB                     |
| Supabase Auth    | 50,000 MAU              |
| Vercel           | 100GB bandwidth / month |

Plenty of headroom for MVP and early users.
