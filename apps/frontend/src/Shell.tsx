import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router";
import { useSession, useTheme, type Theme } from "./lib/store";
import { Button, Icon, type IconName } from "./ui";

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Overview", icon: "gauge" },
  { to: "/domains", label: "Domains", icon: "globe" },
  { to: "/senders", label: "Senders", icon: "at" },
  { to: "/lists", label: "Lists", icon: "users" },
  { to: "/compose", label: "Compose", icon: "send" },
  { to: "/api-key", label: "API key", icon: "key" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
        <rect width="24" height="24" rx="6" className="fill-accent" />
        <path
          d="M5.6 8.4h12.8v7.9H5.6z"
          fill="none"
          stroke="var(--c-accent-ink)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="m5.6 8.9 6.4 4.9 6.4-4.9"
          fill="none"
          stroke="var(--c-accent-ink)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-15 font-semibold tracking-[-0.01em] text-ink">Postmaster</span>
    </span>
  );
}

function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; icon: IconName; label: string }[] = [
    { value: "system", icon: "monitor", label: "System theme" },
    { value: "light", icon: "sun", label: "Light theme" },
    { value: "dark", icon: "moon", label: "Dark theme" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex rounded-md border border-line bg-ground p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={theme === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => setTheme(o.value)}
          className={`flex size-6 items-center justify-center rounded transition-colors duration-150 ${
            theme === o.value
              ? "bg-sunken text-ink"
              : "text-ink-faint hover:text-ink-muted"
          }`}
        >
          <Icon name={o.icon} className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-13 font-medium transition-colors duration-150 ${
              isActive
                ? "bg-accent-soft text-accent"
                : "text-ink-muted hover:bg-sunken hover:text-ink"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} className={isActive ? "size-4 text-accent" : "size-4"} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Account() {
  const { username, signOut } = useSession();
  return (
    <div className="flex flex-col gap-3 border-t border-line px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-13 text-ink-muted" title={username ?? undefined}>
          {username ?? "Signed in"}
        </span>
        <Button size="sm" variant="quiet" icon="out" onClick={signOut} aria-label="Sign out">
          Sign out
        </Button>
      </div>
      <ThemeControl />
    </div>
  );
}

export function Shell() {
  const { token } = useSession();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  if (!token) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      {/* mobile bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Wordmark />
        <Button
          className="ml-auto"
          size="sm"
          variant="quiet"
          icon={open ? "x" : "menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </Button>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-b border-line bg-panel px-3 py-3 lg:hidden">
          <NavItems onNavigate={() => setOpen(false)} />
          <Account />
        </div>
      ) : null}

      {/* desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-panel lg:flex">
        <div className="px-4 py-4">
          <Wordmark />
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavItems />
        </div>
        <Account />
      </aside>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-7 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
