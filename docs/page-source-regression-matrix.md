# Page source regression matrix

This is the release gate for the source-sharing expansion. Each row must be
run against a migrated Supabase project and a clean project. The source bytes
used for download assertions must be compared byte-for-byte, not as decoded
text.

| Source | Browser upload | API upload | CLI upload | Public/private view | Preview | Browser/API source download | Delete |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.html`, `.htm` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| `.md`, `.markdown` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| `.json` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| `.yaml`, `.yml` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| JavaScript/TypeScript | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Python/shell/PowerShell | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Ruby/PHP | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| HTML-project `.zip` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Security assertions

- [ ] Direct render responses contain `Content-Security-Policy: sandbox allow-scripts`.
- [ ] Render responses contain `X-Content-Type-Options: nosniff` and
      `X-Frame-Options: SAMEORIGIN`.
- [ ] The iframe contains exactly `sandbox="allow-scripts"` and never
      `allow-same-origin`.
- [ ] JSON, YAML, and every script preview escape `</script>`, `</style>`,
      `</pre>`, event attributes, and hostile URLs without executing them.
- [ ] Unauthorized private Page, render, source-download, and project-asset
      requests all return 404.
- [ ] Public source downloads work without a session; private source downloads
      work only for the owner session or owner API token.
- [ ] ZIP traversal, absolute paths, backslashes, duplicate normalized paths,
      symlinks, missing root `index.html`, excessive file count, and excessive
      uncompressed size are rejected before Page creation.
- [ ] Failed uploads remove every object created by the attempt.
- [ ] Failed cleanup emits only structured identifiers and error categories,
      never source bytes or parser snippets.
- [ ] Legacy HTML and Markdown Pages retain their UUID URLs, visibility, names,
      render behavior, and correct source extension after migration.
