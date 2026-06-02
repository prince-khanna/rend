# Product

## Register

product

## Users

Two overlapping user types:

**Technical contributors** (designers, engineers, PMs) who produce HTML or Markdown artifacts and need a permanent, shareable URL without configuring a server. They want to paste a link, not explain a setup.

**AI agents and automation pipelines** that upload rendered output programmatically via the API. The human reviews results through the dashboard; the agent does the writing. Rend is the output surface.

## Product Purpose

Rend turns a local HTML or Markdown file into a permanent, shareable URL in one step. No server, no deployment config, no account ceremony. Success looks like: file goes in, link comes out, link always works.

## Brand Personality

Fast · opinionated · indie. Rend has a point of view. It makes choices so users don't have to. Feels like a sharp tool a maker built for themselves and decided to share — not a polished SaaS product built by committee.

## Anti-references

- **Pastebin / raw hosting tools**: utilitarian to the point of looking unfinished — gray, flat, no considered hierarchy. Rend has a visual opinion.
- **Marketing-heavy landing pages**: hero gradients, metric showcases, testimonial carousels. Rend demonstrates rather than sells.
- **Terminal-cosplay dark themes**: green-on-black, CRT scan lines, ASCII art, retro hacker aesthetic. The electric accent and noise texture are craft choices, not nostalgia.

## Design Principles

1. **Show, don't sell** — demonstrate capability through the interface itself. Copy describes what happens, not what it empowers you to achieve.
2. **Opinionated defaults** — every decision that can be made for the user should be. Private/public default, redirect after upload, UUID URLs. Don't ask what can be inferred.
3. **Tool confidence** — sharp edges, precise spacing, no rounded softness that implies uncertainty. The interface behaves like it knows what it's doing.
4. **Chrome gets out of the way** — hosted content is the product. Every dashboard element, toolbar, and nav item defers to the page being viewed.
5. **Fluent with the CLI** — the interface speaks the same language as `curl` and `rend upload`. Token names, endpoints, and copy are consistent with what a developer reads in the terminal.

## Accessibility & Inclusion

WCAG AA minimum. Reduced motion via `prefers-reduced-motion`. No color-only state indicators — pair color with label or icon. `prefers-color-scheme` honored; dark is default.
