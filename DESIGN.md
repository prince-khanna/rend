---
name: Rend
description: Upload an HTML or Markdown file. Get a link.
colors:
  bg: "#0d0d0b"
  surface: "#141412"
  surface2: "#1c1c19"
  border: "#2c2c26"
  border-hover: "#3e3e36"
  text: "#e8e2d4"
  muted: "#6e6860"
  accent: "#e2f740"
  accent-fg: "#0d0d0b"
  danger: "#e85040"
  bg-light: "#f0ebe0"
  surface-light: "#e8e2d6"
  surface2-light: "#ddd8cc"
  accent-light: "#c04820"
typography:
  display:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(3rem, 8vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Syne, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.14em"
  metadata:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    rounded: "{rounded.none}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
  button-primary-compact:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    rounded: "{rounded.none}"
    padding: "7px 16px"
  input-base:
    backgroundColor: "{colors.surface2}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "11px 14px"
  nav-item-active:
    backgroundColor: "{colors.surface2}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "9px 12px"
  nav-item-default:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.none}"
    padding: "9px 12px"
---

# Design System: Rend

## 1. Overview

**Creative North Star: "The Signal Layer"**

The UI gets out of the way so the hosted content can speak. Rend is infrastructure: a thin shell of chrome wrapping what's actually published. Every toolbar, nav element, and button exists to serve the content frame, not to establish Rend's own visual presence. When a page loads inside the iframe, the surrounding tool should be nearly invisible.

The system is dark by default because the hosted content — often a white-background HTML document — needs a frame that recedes. The warm near-black background and near-zero chroma neutrals create a substrate the eye can rest on between interactions. The electric chartreuse accent is a utility signal: it fires only when something needs to be found or acted on. Its rarity is deliberate and non-negotiable.

Components are curt and confident. Nothing asks for attention. A button is a button. Inputs are surfaces, not statements. The monospace type in labels and metadata speaks the same language as curl output and terminal prompts. This is a tool made by someone who uses it themselves.

**Key Characteristics:**
- Zero-radius everywhere. Sharp edges; no rounding that implies softness.
- Tonal layering for depth: bg → surface → surface2, no shadows anywhere.
- Signal Yellow (#e2f740) fires at most 10% of any screen surface.
- JetBrains Mono reserved for metadata, labels, and technical identifiers; Syne for display and body copy.
- Noise texture at 30% opacity over the body — texture without decoration.
- Two themes: dark (default) and light, both using the same token names.

## 2. Colors: The Signal Palette

A warm near-black neutral ramp anchored by one electric accent. No secondary or tertiary palette. The restraint is the system.

### Primary
- **Signal Yellow** (`#e2f740`): The only saturated color in the dark theme. Primary action buttons, focus rings, active nav indicators, and short section eyebrow labels. Used on a strict ≤10% surface budget. In the light theme, replaced by **Ember** (`#c04820`), a warm orange-red with the same signal energy.

### Neutral
- **Rend Black** (`#0d0d0b`): Body background. Near-black with the faintest warm cast; not pure black. The warmth prevents the sterile terminal look.
- **Deep Surface** (`#141412`): Sidebar, card, and list row backgrounds. One tonal step above bg.
- **Raised Surface** (`#1c1c19`): Input fields, hover states, active row backgrounds. One more step up.
- **Quiet Border** (`#2c2c26`): Default dividers and input strokes. Present but not demanding.
- **Active Border** (`#3e3e36`): Hover and focus-adjacent borders.
- **Warm Ash** (`#e8e2d4`): Body text. Warm off-white; not pure white.
- **Faded Ink** (`#6e6860`): Secondary labels, metadata, muted text. Placeholder copy.
- **Signal Red** (`#e85040`): Destructive actions and error states only. Not for emphasis.

### Named Rules
**The One Signal Rule.** Signal Yellow (`#e2f740`) is not a brand color — it is a utility signal. It appears on ≤10% of any given screen. Using it as fill, decorative element, or general highlight defeats the system. Its power is exactly proportional to its rarity.

**The Warm Void Rule.** Never substitute `#000000` for Rend Black. The faint warm cast (hue ~100, near-zero chroma) is what separates a considered workspace from a cold terminal. Pure black reads as sterile; this system lives in the warm shadow between.

## 3. Typography

**Display Font:** Syne (Google Fonts, sans-serif)
**Body Font:** Syne (same family, 400–500 weights)
**Label/Mono Font:** JetBrains Mono (Google Fonts, monospace)

**Character:** Syne is a geometric sans with slightly uneven opticals that give it a constructed, almost printed quality. At 800 weight with tight letter-spacing it reads as decisive. JetBrains Mono grounds the technical layer: dates, token prefixes, file type annotations, page IDs. The pairing works on a contrast axis (geometric sans + mono) not a blend — each font has exclusive territory.

### Hierarchy
- **Display** (800, `clamp(3rem, 8vw, 6rem)`, line-height 0.92, -0.03em): Landing page hero only. One instance per page maximum.
- **Headline** (800, 28–32px, -0.02em): Page-section headings ("Drop your file", "Settings"). Uses `text-wrap: balance`.
- **Body** (400–500, 14–17px, 1.5–1.6 line-height): Descriptions and helper text. Hard cap at 65ch line length.
- **Label** (JetBrains Mono 400, 11px, 0.14em tracking, uppercase): Section eyebrows ("New page", "Account", "HTML & Markdown Hosting"), status badges. Maximum 4 words per uppercase label.
- **Metadata** (JetBrains Mono 400–500, 11–13px, no case transform): Dates, page names in list rows, API token prefixes, file type indicators, toolbar identifiers.

### Named Rules
**The Two-Family Rule.** Syne + JetBrains Mono is the complete typographic system. No third family, no display serif, no accent script. Syne handles all prose; JetBrains handles all technical copy and labels.

**The Mono-as-Signal Rule.** JetBrains Mono marks technical data, not emphasis. When a sentence feels like it wants a monospace treatment, the copy should be rewritten to expose the data it contains, not the font changed.

## 4. Elevation

Rend is flat by default. No `box-shadow` declarations exist anywhere in the codebase. Depth is conveyed entirely through the tonal step system: bg (`#0d0d0b`) as the base canvas, surface (`#141412`) as raised content areas, surface2 (`#1c1c19`) as the topmost interactive layer. Three steps. No shadows.

This is the correct choice for a tool whose primary interface element is an iframe hosting external content. Shadows create visual competition with the hosted page. Tonal steps recede.

The single exception is the mobile sidebar overlay: a `rgba(0,0,0,0.5)` backdrop when the drawer is open. This is structural elevation (one layer must occlude another) not decoration.

**The Flat-By-Default Rule.** Surfaces are tonal, not elevated. If a new surface needs to float over others, reach for the tonal step system first. Reserve dark backdrops for genuine structural elevation: modals, drawers, popovers. Never use `box-shadow` as a hover effect or card decoration.

## 5. Components

### Buttons
Primary actions. Curt and confident: no radius, no border, no decoration beyond color.
- **Shape:** `0px` radius, sharp corners throughout
- **Primary:** Signal Yellow background (`#e2f740`), Rend Black text (`#0d0d0b`), 700 weight, 0.04em tracking. Full-size: `12px 28px` padding; compact: `7px 16px`
- **Hover:** Opacity 0.85. No color shift, no transform.
- **Disabled:** Opacity 0.5, `not-allowed` cursor.
- **Ghost / text link (`.link-muted`):** No background. Muted text (`#6e6860`) at rest; hover shifts to body text (`#e8e2d4`). Used for nav footer links and inline actions.

### Inputs / Fields
- **Style:** 1px solid border (`#2c2c26`), Raised Surface background (`#1c1c19`), no radius, `11px 14px` padding, 14px Syne
- **Focus:** Border shifts to Signal Yellow (`#e2f740`). No glow, no shadow.
- **Placeholder:** Faded Ink (`#6e6860`).
- **Error block:** Separate element below the field — JetBrains Mono 12px, danger-tinted background (`rgba(232,80,64,0.08)`), danger-tinted 1px border (`rgba(232,80,64,0.2)`). The input stroke itself does not turn red.

### Upload Drop Zone
The signature interaction surface. Dashed 1px border at rest (`#3e3e36`), Deep Surface background. On drag: border shifts to Signal Yellow, background gains a barely-perceptible accent tint (`rgba(226,247,64,0.04)`). A 44px inset square (1px border, muted color, centered "+" at 20px) serves as the visual anchor at rest. Upload-in-progress shows a spinner ring (border with accent top-slice) and mono label, not a progress bar.

### File List Rows
The primary content surface. Rows, not cards. Deep Surface background, 1px gap between items via flex column (not borders). Hover reveals Raised Surface background plus a 2px left accent stripe. File name: JetBrains Mono 500, 13px. Date: JetBrains Mono 400, 11px muted. Actions at the right edge as ghost text/icon buttons.

### Navigation (Sidebar)
200px fixed sidebar desktop, fullscreen drawer mobile.
- **Logo:** Syne 800, 15px, 0.12em tracking, uppercase — matches landing page header exactly.
- **Nav items (active):** Raised Surface background, body text color, 600 weight, 2px Signal Yellow left border.
- **Nav items (default):** Transparent background, Faded Ink, 400 weight, 2px transparent left border.
- **Transitions:** `color 0.15s, background 0.15s` on items.
- **User footer:** JetBrains Mono 500, 11px for identity; "sign out" as ghost text at 12px mono, hover → Signal Red.

### Page Toolbar
The 44px chrome frame for hosted content. Designed to disappear.
- All type: JetBrains Mono, 10–12px.
- Back-link separator: 1px right border in Quiet Border color.
- Visibility pill ("public"): 1px Quiet Border stroke, no fill, JetBrains 10px muted, 3px 7px padding.
- Action buttons: ghost treatment at rest (no background, muted text). No filled states except the primary CopyLink button.

## 6. Do's and Don'ts

### Do:
- **Do** use Signal Yellow (`#e2f740`) only for actionable signals and active state: primary buttons, focus rings, active nav indicators, and short section eyebrows. Maximum 10% surface coverage per screen.
- **Do** use JetBrains Mono for all technical data: dates, page names in lists, API tokens, file type labels, short uppercase section labels. Use Syne for all prose and headings.
- **Do** keep every component at 0px border-radius. The sharpness is a commitment, not a default.
- **Do** achieve visual depth through the tonal step system (bg → surface → surface2) before considering any shadow.
- **Do** use Rend Black (`#0d0d0b`) as the base, not pure black (`#000000`). The warm cast is the system.
- **Do** write error messages in JetBrains Mono inside the danger-tinted error block. This is the single pattern for all error states across the product.
- **Do** fade the toolbar and nav chrome at all times. The hosted content is the product.

### Don't:
- **Don't** build anything that looks like a Pastebin or raw hosting tool: gray layout, flat hierarchy, unfinished aesthetic. Rend has a visual opinion.
- **Don't** build marketing-heavy surfaces: hero metric templates, gradient showcases, testimonials. Rend demonstrates rather than sells.
- **Don't** use green-on-black, CRT scan lines, ASCII art, or retro terminal aesthetics. Signal Yellow on warm dark is a considered choice, not nostalgia.
- **Don't** add border-radius to any component. Zero-radius is non-negotiable.
- **Don't** use `box-shadow` for hover effects or decorative depth.
- **Don't** use Signal Yellow across large surface areas, apply a gradient to it, or use it as a text background.
- **Don't** use `background-clip: text` with a gradient. Emphasis comes from weight and size, not gradient fill.
- **Don't** introduce a third typeface. Syne + JetBrains Mono is the complete system.
- **Don't** use uppercase for full sentences or paragraph copy. Reserve uppercase for labels ≤4 words.
