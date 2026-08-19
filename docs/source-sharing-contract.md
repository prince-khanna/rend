# Source-sharing contract

Status: accepted implementation contract for the Page source expansion.

## Vocabulary and format matrix

A **Page** is the durable, viewable object. Its uploaded source is not called a
file in product copy. Every source has one `source_family` and one exact
`source_format`:

| Family | Formats | Preview behavior |
| --- | --- | --- |
| `html` | `html`, `htm` | Rendered as active HTML in the Page sandbox. |
| `markdown` | `md`, `markdown` | Converted to HTML at upload time; Mermaid diagrams may run in the sandbox. |
| `data` | `json`, `yaml`, `yml` | Parsed with a safe parser and rendered as escaped, readable data. Never executes source. |
| `script` | `js`, `mjs`, `cjs`, `ts`, `tsx`, `jsx`, `py`, `sh`, `bash`, `zsh`, `ps1`, `rb`, `php` | Escaped, whitespace-preserving code preview. Never executes source. |
| `html_project` | `zip` | A constrained static project with one root `index.html`; assets remain isolated. |

MDX, notebooks, server-side applications, arbitrary binaries, and archives
other than the constrained HTML-project ZIP are explicitly excluded. ZIP
projects are limited to a 20 MiB archive, 100 files, and 50 MiB uncompressed.

The initial maximum source size is 5 MiB for text sources. ZIP projects have a
separate archive, entry-count, and uncompressed-size limit defined by the
project validator. Empty sources, invalid UTF-8 text, unsafe filenames, and
malformed JSON/YAML are rejected before a Page is committed.

`source_format` is the lower-case extension without the dot. The immutable
metadata stored on each new Page is the family, format, original filename,
source byte size, and SHA-256 digest. A display-name rename never changes the
original filename or digest.

## Storage and migration

Every new Page retains the exact uploaded source under a Page-owned source key.
Any derived HTML is stored separately and is the only object used by the render
endpoint. Existing HTML and Markdown Pages keep their UUID URLs, names,
visibility, and existing rendered storage objects. A migration backfills their
metadata from the known object key and existing `source_type`; where an old
Markdown source object exists it remains the original download, while legacy
HTML pages use their existing HTML object as the source until replaced by a
new upload. Hard deletion removes every object owned by the Page.

## Visibility and downloads

New browser uploads are public by default. API and CLI uploads are private by
default. Public Pages permit anyone to download the exact original source.
Private Pages permit source downloads only to the owning browser session or an
API request authenticated with a token belonging to the owner. Render access
uses the same public/owner authorization and returns 404 to unauthorized
visitors. Rendered HTML is never substituted for the original source download;
API clients may explicitly request a derived rendered variant where one exists.

Downloads use a safe attachment filename derived from the original filename,
without allowing path separators or response-header injection. The digest is
available as metadata so recipients can verify exact bytes.

## Execution boundary

Only HTML source and generated Markdown rendering may contain executable client
JavaScript. JSON, YAML, and every script-family preview are escaped before
being placed in HTML and are non-executable, including on a direct render URL.
Every render response sends `Content-Security-Policy: sandbox allow-scripts` in
addition to the iframe's exact `sandbox="allow-scripts"` attribute. No
`allow-same-origin` permission is permitted. Render responses send
`X-Content-Type-Options: nosniff` and same-origin framing protection.

## Compatibility guarantee

Existing `/pages/[id]` URLs remain valid. Existing visibility and readable page
names are preserved. Existing HTML continues to render as before, and existing
Markdown continues to render its derived HTML and download its retained raw
Markdown source. Metadata backfill is deterministic and does not require a
user to re-upload a Page. After applying the SQL migration, deploy and run
`scripts/backfill-page-source-metadata.mjs` with the Supabase URL and service
role key to calculate byte sizes and SHA-256 digests from retained objects.

All browser, API, and CLI paths use this same extension matrix, size policy,
visibility contract, source metadata vocabulary, and `/pages/[id]` route
terminology. Storage uses the `pages` bucket; no `/files` or `html_files`
terminology is introduced.
