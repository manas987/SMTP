---
name: Postmaster Dashboard
description: A conventional developer-tool dashboard for domain-verified email sending, executed straight at a high finish bar.
colors:
  ground: "#ffffff"
  panel: "#fafaf9"
  raised: "#ffffff"
  sunken: "#f5f4f2"
  line: "#e8e5e2"
  line-strong: "#d5d1cc"
  ink: "#1c1917"
  ink-muted: "#56514c"
  ink-faint: "#78716c"
  accent: "#2563eb"
  accent-hover: "#1d4ed8"
  accent-ink: "#ffffff"
  accent-soft: "#eef4ff"
  ok: "#15803d"
  ok-soft: "#f1faf3"
  warn: "#9a5b06"
  warn-soft: "#fdf8ec"
  bad: "#b42318"
  bad-soft: "#fdf3f2"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0.025em"
  mono:
    fontFamily: "\"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  xs: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.accent-ink}"
  button-default:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-default-hover:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-quiet-hover:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.bad}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.bad-soft}"
    textColor: "{colors.bad}"
  button-sm:
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "28px"
  input:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  input-focus:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
  panel:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  nav-item-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  status-chip-ok:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
  status-chip-wait:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
  status-chip-bad:
    backgroundColor: "{colors.bad-soft}"
    textColor: "{colors.bad}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
  machine-value:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.xs}"
    padding: "6px 8px"
---

# Design System: Postmaster Dashboard

## Overview

**Creative North Star: "The Straight Convention"**

This is the category standard, chosen on purpose over six distinctive alternatives, and held to Resend's level of finish rather than approximated. Nothing here is trying to be memorable as a surface. A fixed rail, a titled content column, hairline-bordered panels, warm neutral text, one blue accent: a developer who has used any modern sending dashboard already knows where everything is, and the entire craft budget goes into the parts that usually go soft — real hover, focus-visible, disabled and pending states on every control, self-hosted faces with no system-font flash, a full dark token set, theming for the browser surfaces nobody draws (selection, caret, placeholder, focus ring, scrollbar, dialog backdrop).

Density is that of an operator's tool. Body text runs at 13px, panel titles at 15px, and there is exactly one large statement per screen. The one idea the system owns is textual, not decorative: the Overview opens with a plain sentence saying whether this account can send right now, with the blocking clause set in the accent and linked to the fix. It is not a card, not a banner, not a metric tile. The refusal that makes room for it is a product truth — the backend records no delivery events, so the hero-metric row the category opens with could only be fabricated or empty.

The only visual world-building is material restraint: two neutral surface layers (a slightly warmer sidebar against the content ground), hairline borders instead of fills or shadows, one soft shadow held back for the floating notice, and tinted blocks whose tint alone carries the signal. Confirmed rejection: cool/zinc grays — the ramp is the warm stone family, and a review pass corrected a cool slip back to warm. The wordmark "Postmaster" and the blue envelope mark are placeholders occupying the slot until a real identity exists; they are not brand and carry no weight in this system.

**Key Characteristics:**
- Warm-neutral stone ramp, one blue accent, semantic colour only on record status
- Hairline borders as the primary structural device; shadows near-absent
- Fixed rem type scale (11/12/13/15/17/20/24 at ~1.15 ratio), no fluid type
- Archivo for all UI text, JetBrains Mono for machine values only
- Every interactive primitive ships hover, focus-visible, disabled and pending states
- Full light and dark token sets, system-following with a manual override
- No modals anywhere; destructive confirmation happens inline

## Colors

A warm neutral ground (stone family) carrying one saturated blue, with green/amber/red admitted only to report DNS record state.

Colour is defined exactly once, in `src/index.css`, as `--c-*` custom properties on `:root`, redefined for dark under both `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and `:root[data-theme="dark"]`, then bridged to Tailwind through `@theme inline`. Components name tokens; they never name colours.

### Primary
- **Signal Blue** (`accent`): Primary buttons, the current nav item's text and icon, focus rings, caret and selection, the blocking clause in the readiness verdict, and the "next step" marker. Nothing else.
- **Signal Blue Pressed** (`accent-hover`): Hover and active fill for primary buttons and action-links only.
- **Blue Wash** (`accent-soft`): Sole use is the current nav item's background in the rail.
- **Blue Ink** (`accent-ink`): Text and iconography on filled accent surfaces, including the envelope mark's strokes.

### Secondary
None. The system has one accent by design; do not introduce a second brand hue.

### Tertiary
Semantic status only, never decorative:
- **Verified Green** (`ok`) on **Green Wash** (`ok-soft`): a passing DNS record, a completed setup step, a successful send.
- **Attention Amber** (`warn`) on **Amber Wash** (`warn-soft`): a caveat the user must read before acting — a record not yet published, a signup warning.
- **Failure Red** (`bad`) on **Red Wash** (`bad-soft`): a failing record, a field error, a request error, a destructive action.

### Neutral
- **Content Ground** (`ground`): The page behind the content column and the auth screen.
- **Rail Panel** (`panel`): The sidebar and the mobile bar — one step off ground, which is the whole layering story.
- **Raised Surface** (`raised`): Panel and control interiors.
- **Sunken Surface** (`sunken`): Machine-value blocks, skeleton bars, quiet/default button hover, waiting-state chips, the theme control's selected cell.
- **Hairline** (`line`): Panel borders, dividers between rows, section rules.
- **Hairline Strong** (`line-strong`): Control borders, scrollbar thumb, strike-through on completed steps.
- **Ink** (`ink`): Body and heading text.
- **Ink Muted** (`ink-muted`): Descriptions, hints, secondary row text, inactive nav.
- **Ink Faint** (`ink-faint`): Placeholders, disabled counters, non-essential separators. This is the floor.

### Named Rules
**The One Definition Rule.** Every colour in this app resolves to a `--c-*` property in `src/index.css`. A hex, `rgb()`, or `oklch()` literal written in a component is a defect, not a variation.

**The Warm Neutral Rule.** The ramp is warm stone. Cool and zinc grays are out — this was found in review and corrected. If a neutral looks blue-gray next to `#fafaf9`, it is wrong.

**The Faint Floor Rule.** `ink-faint` is the contrast floor of the system (4.84:1 on white, 5.15:1 on the dark ground) and is also the global `::placeholder` colour. It may never be lightened below 4.5:1, and nothing may sit below it.

**The Reserved Accent Rule.** Accent means one of three things: a primary action, the current selection, or focus. Text is not accent-coloured to be interesting; a link inside prose earns accent only when it is the way out of a stated blocker.

**The Status-Only Semantics Rule.** Green, amber and red report record and request state. They never set mood, never brand a section, and never tint a whole panel.

## Typography

**Display Font:** Archivo (variable, 100–900, self-hosted woff2, latin subset)
**Body Font:** Archivo — one face carries the entire UI
**Label/Mono Font:** JetBrains Mono (variable, 100–800, self-hosted woff2, latin subset)

**Character:** Archivo is a neutral grotesque with tight, even spacing that holds up at 12–13px, which is where most of this interface lives; its variable width axis is available but unused. JetBrains Mono is the machine voice — its job is to signal "this is a literal value you will paste into a registrar form", not to look technical.

### Hierarchy
- **Display** (600, 24px/1.25, -0.015em, balanced): The page title in `PageHead` and the auth headline. One per screen.
- **Headline** (500, 20px/1.375, -0.01em, balanced, max 62ch): The readiness verdict on Overview — the only 20px text in the system, and the only sentence set as a statement rather than as prose.
- **Title** (600, 15px): Panel headers, empty-state headings, the wordmark. Also the size used for a domain name in mono when it is the row's subject.
- **Body** (400, 13px/1.5, max 58–70ch): Everything — descriptions, rows, labels, buttons, nav, hints. The default `<body>` size is 14px; 13px is what components actually set.
- **Small** (400, 12px): Field hints and errors, timestamps, footnotes, secondary values.
- **Label** (500, 11px, 0.025em, uppercase): Status-chip labels only.
- **Mono** (400, 12–13px, tabular numerals): DNS record types, names and values, keys, tokens, selectors, domains, email addresses.

### Named Rules
**The Machine Value Rule.** Mono is for values a machine produced or will consume — records, keys, domains, addresses, tokens. Never for headings, never for labels, never as a flavour of "developer tool".

**The Fixed Ramp Rule.** Type sizes come from the fixed rem scale (`--text-11` … `--text-24`, ~1.15 ratio). No `clamp()`, no `vw` units, no fluid type in product UI: an operator's tool should not reflow its type as the window moves.

**The One Statement Rule.** A screen gets one piece of large type (the 24px title) and at most one 20px statement. Everything else is 11–15px.

## Layout

A two-column shell: a fixed 240px rail (`lg:grid-cols-[240px_1fr]`) on the panel surface, sticky and full-height, against the content ground. The rail holds the wordmark, six nav items — one per screen that exists — and the account block with the theme control at the foot, separated by a hairline. Content sits in a centred column capped at 1120px with 20px padding rising to 32px at `sm`, and 28px vertical page padding rising to 40px.

Below `lg` the rail collapses into a sticky top bar (wordmark plus a Menu toggle) with a disclosure panel beneath it; there is no drawer, no overlay, no scrim. The disclosure closes on route change.

Vertical rhythm inside a page is a single stack: `gap-7` (28px) between page sections, `gap-4` (16px) inside forms, `gap-3`/`gap-2` (12px/8px) inside rows. Spacing is a 4px base with 8px as the dominant step. List rows are 12–14px vertical padding with 16px horizontal; panel headers are 12px/16px. Measure is capped explicitly: 68ch for explanatory prose, 62ch for the verdict, 58ch for empty-state copy.

The Overview deliberately ends short on a two-domain account. Empty vertical space below the readiness board is honest — every candidate for filling it is data the backend does not record.

## Elevation & Depth

This system is flat. Depth comes from two neutral surface steps (`panel` behind the rail, `raised` for panels and controls against `ground`) and from hairline borders — never from shadows on resting elements. Panels are `1px` `line` borders on `raised`; rows divide with the same hairline; sections separate with a top rule.

### Shadow Vocabulary
- **Pop** (`--shadow-pop`: `0 1px 2px hsl(var(--c-shadow) / 0.06), 0 8px 24px -6px hsl(var(--c-shadow) / 0.16)`): The only shadow token. It is used on the floating notice toast, i.e. content that genuinely floats above the page. Its tint is token-driven and flips with theme (warm-black in light, pure black in dark).

### Named Rules
**The Hairline Rule.** Structure is drawn with 1px borders, not fills and not shadows. If a boundary needs emphasis, go from `line` to `line-strong`, not to a shadow.

**The Overlay-Only Shadow Rule.** `shadow-pop` belongs to elements that leave the page plane. A resting panel, row, chip, button or input carries no shadow.

**The Bare Tint Rule.** Tinted blocks (`ok-soft`, `warn-soft`, `bad-soft`) carry no border — the tint is the signal. A bordered tint inside a panel reads as a card inside a card.

## Shapes

One soft-rectangle language, three radii, no other geometry. Controls and small surfaces use a 6px radius (`rounded-md`): buttons, inputs, selects, textareas, nav items, tinted notes, the theme control. Panels step up to 8px (`rounded-lg`). Small inline things — machine-value blocks, record-type badges, status chips, skeleton bars — sit at 4px so they read as inset, not as cards. Pills (`rounded-full`) appear only on step counters and the pending spinner, where the shape means "marker", not "tag".

Borders are always 1px. Focus is a 2px accent outline at 2px offset with a 3px radius, applied globally by `:focus-visible`; form controls additionally shift their border to accent and add a 2px accent ring at 25% opacity on focus. There is no other outline vocabulary.

## Components

Everything interactive lives in `src/ui.tsx`. Pages compose those primitives; they do not restyle raw elements.

### Buttons
- **Shape:** 6px radius, 1px border on every variant (transparent where no border shows), 36px tall at `md` / 28px at `sm`, gap 6px to a leading icon.
- **Primary:** accent fill, accent-ink text, transparent border. The single most important action on a screen.
- **Default:** raised fill, ink text, `line-strong` border. The workhorse — Refresh, Copy, Add.
- **Quiet:** transparent, ink-muted text, no border; hovers to sunken with ink text. Row-level actions and toggles.
- **Danger:** transparent with `line` border and bad text; hovers to `bad-soft` with a 40%-opacity bad border. Never a filled red button.
- **Hover / Focus:** colour-only transition at 150ms. No lift, no scale, no shadow. Focus is the global focus-visible outline.
- **Disabled:** 45% opacity, pointer events off.
- **Pending:** a 14px current-colour ring spinner replaces the leading icon; the button disables itself and sets `aria-busy`. Pending is a first-class state, not an overlay.
- **Action-link:** a `<Link>` needing primary appearance uses the shared `actionLink` class string (identical to `button-primary` at `md`, with `no-underline`). A `<button>` is never nested in an anchor.

### Chips
- **Style:** 4px radius, 1px tinted border, wash background, 11px uppercase medium label, then a faint `·` separator, then the raw status word in plain case. 12px icon leads.
- **State:** `ok` — green wash, green border at 35%, check icon. `wait` — sunken fill, `line-strong` border, ink-muted text, filled dot icon. `bad` — red wash, red border at 35%, alert icon.
- Chips report record status (SPF, DKIM, DMARC, ownership). They are not filters, not tags, not navigation.

### Cards / Containers
- **Corner Style:** 8px radius (`Panel`).
- **Background:** `raised` against `ground`.
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** 1px `line`, with a hairline-separated header when the panel is titled.
- **Internal Padding:** 12px/16px in the header; body padding belongs to the rows (16px horizontal, 12–14px vertical) so lists reach the panel's edges and divide with `divide-line`.

### Inputs / Fields
- **Style:** 1px `line-strong` border on `raised`, 6px radius, 36px tall, 10px horizontal padding, 13px text. Textareas add 8px vertical padding, relaxed leading, and vertical-only resize. Selects hide the native arrow and draw the chevron from the authored icon set as an inlined data-URI at 16px.
- **Hover:** border to `ink-faint` at 60%.
- **Focus:** border to accent plus a 2px accent ring at 25%; the native outline is suppressed only because that ring replaces it.
- **Error:** `aria-invalid` shifts the border to `bad`; `Field` renders a 12px bad-coloured message with a 14px alert icon and wires `aria-describedby`. Hint text uses the same slot in ink-muted when there is no error.
- **Disabled:** 50% opacity.
- **Field:** label (13px medium, ink) above the control at 6px gap, message below. Labels are sentence case and never uppercase.

### Navigation
- **Style:** vertical list of 6px-radius rows, 10px/6px padding, 13px medium, 16px icon at 10px gap.
- **Default:** ink-muted text; **hover:** sunken fill with ink text; **active:** `accent-soft` fill with accent text and accent icon. Active state is fill plus colour — never a bar, underline, or bold-only cue.
- **Mobile:** the rail becomes a sticky bar on `panel` at 95% opacity with a backdrop blur, and nav appears as an inline disclosure below it.

### Icons
One authored set in `ui.tsx`: 24-unit grid, 1.5 stroke, `currentColor`, round caps and joins, `fill="none"` except where a single shape is deliberately filled (the waiting dot). Rendered at 12px, 14px, 16px or 24px. No icon library, no icon font, no emoji.

### Readiness Verdict (signature)
One sentence at 20px in ink, max 62ch, balanced, sitting directly under the page title with no container of any kind. The clause naming what is blocking the account is an accent-coloured link underlined at 40% accent, and it navigates to the screen that fixes it. When there is nothing blocking, the sentence says so plainly and the accent disappears from it. It is skeleton-loaded as a single 28px bar, never as a spinner.

### CopyValue / DnsRecordRow (signature)
A machine value renders as a `<code>` block on `sunken` with a 1px `line` border, 4px radius, mono 12px, either horizontally scrolling or `break-all`, with a small default button to its right that swaps its icon and label to a check and "Copied" for 1.6s and announces through the notice channel. A DNS record row stacks a mono type badge and the record name on one baseline, the copyable value under it, and an optional 12px muted note, divided from its siblings by a top hairline.

### Motion
Two utilities, each with one job, both defined in `src/index.css`:
- `.rise` (`420ms`, `cubic-bezier(0.16, 1, 0.3, 1)`, from 6px down): staggers list rows at 35ms increments as loaded data lands. This is the one authored moment in the system.
- `.reveal` (`320ms`, same easing, from -4px and 0.985 scale, origin top): only for content that appears because the user just acted — a generated key, a fresh DNS panel, a success note, the notice toast.

**The Already-Visible Rule.** Both animations use `animation-fill-mode: backwards` and animate *from* a hidden state toward the element's normal visible default. If the animation never runs, nothing is hidden. Both are `animation: none` under `prefers-reduced-motion: reduce`.

**The Colour-Only Transition Rule.** Interactive feedback is `transition-colors` at 150ms. Nothing in this system translates, scales, or shadows on hover.

## Do's and Don'ts

### Do:
- **Do** define every colour once in `src/index.css` as a `--c-*` property, in both light and dark blocks, and reach it through the Tailwind bridge (`bg-panel`, `text-ink-muted`).
- **Do** keep the neutral ramp warm (stone), matching `#fafaf9` / `#1c1917` in light and `#0c0a09` / `#fafaf9` in dark.
- **Do** reserve the accent for primary actions, current selection and focus; reserve green/amber/red for record and request status.
- **Do** set machine values — DNS records, keys, selectors, domains, addresses, tokens — in JetBrains Mono, and everything else in Archivo.
- **Do** take type sizes from the fixed `--text-*` scale.
- **Do** build screens from the `ui.tsx` primitives, so hover, focus-visible, disabled and pending arrive for free.
- **Do** draw structure with 1px hairlines and the two neutral surface steps.
- **Do** confirm destructive actions inline with `ConfirmInline`, in place, next to the thing being destroyed.
- **Do** give tinted blocks a wash background and no border.
- **Do** leave a screen short when the backend has nothing more to say; empty space is honest here.
- **Do** treat the "Postmaster" wordmark and the envelope mark as placeholders, replaced together when a real identity exists.

### Don't:
- **Don't** write a hex, `rgb()`, `oklch()` or arbitrary Tailwind colour/shadow value in a component — including `shadow-[...]`. If a value is needed, it becomes a token first.
- **Don't** introduce cool or zinc grays, or a second brand hue.
- **Don't** lighten `ink-faint`, or add any text colour below it; it is the placeholder colour and the contrast floor.
- **Don't** use fluid or `clamp()` type, and don't add type sizes outside the `--text-*` ramp.
- **Don't** set mono for headings, labels or body copy to look technical.
- **Don't** add a shadow to a resting element; `shadow-pop` is for things that float above the page.
- **Don't** put a border on a tinted block.
- **Don't** add a modal or dialog for confirmation — there is no modal in this system.
- **Don't** add an icon library, an icon font, or emoji; extend the authored 24-grid/1.5-stroke set in `ui.tsx` instead.
- **Don't** add a `tailwind.config` file; the system is configured entirely in CSS via `@theme inline`, and a config file would create a second source of truth.
- **Don't** add a fourth radius or a second focus treatment.
- **Don't** fabricate a metric, chart, or hero-stat row: the backend records no delivery events, so any such surface would be empty or invented.
- **Don't** add personality to compensate for the conventionality. The category standard executed straight is the chosen direction, not a gap to be filled.
