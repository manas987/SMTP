---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Sending dashboard

Scope: the whole authenticated dashboard plus signin/signup, in `apps/frontend`. No public marketing page.
Visitor mode: **Operate**. Read notes apply to the DNS instruction passages.

Audience: a developer or a small team's technical person, signed up self-serve, who wants to send from a domain they control. Two jobs, equally weighted: integrate the send API, and compose and broadcast to a list from the dashboard.

Job: get from a fresh account to a verified domain with passing SPF/DKIM/DMARC and a first accepted send, without giving up during DNS setup. Then return to send.

Content and proof: only what the API returns. No metrics, no history, no delivery events exist — see PRODUCT.md's absent-capabilities list.

Constraints: Bun + React 19, Tailwind v4, react-router. Backend is a separate origin; the frontend's own Bun server proxies `/api/*` so no backend change is needed. Light and dark, system-following with a manual override.

Direction: the standing exit. The user was offered seven derived worlds and chose the category standard on purpose. Resend is the named craft bar.

Memorable moment: the readiness board's verdict line — one plain sentence that says whether this account can send right now and what is blocking it.

Standing guidance for the overview: the space below the readiness board is deliberately empty. A
two-domain account ends around 650px and that is honest — every candidate for filling it is data
the backend does not record, and the thesis explicitly refuses the arrangement that would fill it.
If that space is ever spent, it goes to the send-side job (compose, the API snippet), never to a
statistic.

Unresolved: product name — "Postmaster" is a placeholder, and so is the blue envelope mark drawn in Shell.tsx and src/mark.svg. Both ship only so the slot is not empty; replace them together when a real identity exists. No logo asset.

## Direction contract

THESIS: The conventional developer-tool dashboard, executed at Resend's level of finish rather than approximated. It owns one idea the category does not: the home screen states, in one sentence, whether this account can send right now and what is blocking it. It refuses the arrangement every competitor opens with — the hero-metric row of sends, opens and bounces — because this backend records no delivery events, and a stat row here could only be fabricated or empty.

OWN-WORLD: Warm-neutral grays (stone family, never cool zinc), one blue accent reserved for primary actions, current selection and focus rings; semantic green / amber / red only for record status. Two surface layers: a slightly cooler sidebar against the content ground. Archivo for all UI text on a fixed rem scale at a 1.15 ratio; JetBrains Mono for every machine value — DNS records, keys, selectors, addresses. 8px spacing grid, 6px radii, hairline borders instead of fills or shadows, one soft shadow reserved for overlays. Full light and dark token sets.

STORY: The visitor understands that sending requires a verified domain and that the four DNS checks are measured live, not claimed. They believe the tool is telling them the truth about their own DNS, including "not yet". They publish the records, re-check until the readiness line goes green, register a sender, and send — by API with the copyable snippet, or from the compose screen.

FIRST VIEWPORT: Fixed 240px sidebar left, cool ground, wordmark top, six nav items (one per screen that exists), account and theme control at the foot. Content column starts with the page title row and its primary action right-aligned. Directly under it the readiness statement, full content width, set at 20px in the text color with the blocking clause in the accent — not a card, not a banner. Under that the domains list: one row per domain, the domain in mono at 15px, four small labelled status chips right-aligned, the last-checked time beside them, a re-check action per row. On a fresh account that list is replaced by the first-run panel: what a sending domain is, and one primary action to add one.

FORM: The standing exit (the category standard), taken deliberately by the user over all seven grounded directions and both competitive challengers; not a position on the grounded list. Seed key 413fa755.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
