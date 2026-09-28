# Dashboard

The web UI for the sending service: sign up, verify a domain's DNS, register senders, manage lists,
compose and queue mail, rotate the API key.

React 19 + Tailwind v4 + react-router, served and bundled by Bun — no Vite, no PostCSS config.

## Run it

```bash
bun install
bun dev                       # http://localhost:5180
```

The backend must be running separately (`cd ../backend_api && bun dev`). It listens on the `PORT`
in `apps/backend_api/.env`, currently **3001**, which is what this app proxies to by default.
Override either side with:

```bash
BACKEND_URL=http://localhost:3000 bun dev   # if the API moves
PORT=3000 bun dev                           # if you want the dashboard on another port
```

**Everything under `/api` is proxied to the backend by this app's own server** (`src/index.ts`).
The browser only ever talks to this origin, so the backend needs no CORS middleware. See
`../../BACKEND_NOTES.md`.

```bash
bun run build                 # → dist/
bun start                     # production mode
```

## Layout

```
src/
  index.ts        Bun.serve: the SPA + the /api proxy
  index.css       design tokens (light + dark), base layer, browser-surface theming
  App.tsx         routes
  Shell.tsx       sidebar, nav, account, theme control
  ui.tsx          the whole component kit + icon set
  lib/api.ts      typed client for every backend route
  lib/store.tsx   session, notices, useResource / useAction
  lib/records.ts  local cache for the DNS records the API returns only once
  pages/          one file per area
```

## Placeholders

The name **Postmaster** and the blue envelope mark (`src/mark.svg`, redrawn inline in `Shell.tsx`)
are placeholders — no name or identity has been decided. Replace both together.

## Conventions

- Tokens are CSS custom properties on `:root`, redefined for dark under both
  `prefers-color-scheme` and `[data-theme="dark"]`. Tailwind reads them via `@theme inline`, so
  `bg-ground`, `text-ink-muted`, `border-line` and friends work in both themes automatically. Add a
  colour in `index.css` only, never as a hex value in a component.
- Monospace (`font-mono`) is for machine values only: DNS records, keys, domains, addresses, tokens.
- Every interactive element ships hover, focus-visible, disabled and pending states — `Button` and
  the form controls in `ui.tsx` already carry them, so use those rather than raw elements.
- Destructive actions confirm inline (`ConfirmInline`), not in a modal.
- Nothing in the UI may imply data the backend does not record. There are no delivery events, no
  send history and no analytics; see `PRODUCT.md`.
