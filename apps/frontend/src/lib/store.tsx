import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, readToken, setUnauthorizedHandler, writeToken } from "./api";

// ── session ─────────────────────────────────────────────────────────────────

const NAME_KEY = "smtp.username";

type Session = {
  token: string | null;
  username: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => readToken());
  const [username, setUsername] = useState<string | null>(() => {
    try {
      return localStorage.getItem(NAME_KEY);
    } catch {
      return null;
    }
  });

  const signOut = useCallback(() => {
    writeToken(null);
    try {
      localStorage.removeItem(NAME_KEY);
    } catch {}
    setTokenState(null);
    setUsername(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(async (name: string, password: string) => {
    const { token: fresh } = await api.signin(name, password);
    writeToken(fresh);
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {}
    setTokenState(fresh);
    setUsername(name);
  }, []);

  const value = useMemo(
    () => ({ token, username, signIn, signOut }),
    [token, username, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}

// ── theme ───────────────────────────────────────────────────────────────────

export type Theme = "system" | "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("theme");
      return stored === "light" || stored === "dark" ? stored : "system";
    } catch {
      return "system";
    }
  });

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
  }, []);

  return { theme, setTheme };
}

// ── notices ─────────────────────────────────────────────────────────────────

export type Notice = { id: number; text: string; tone: "ok" | "bad" };

const NoticeContext = createContext<((text: string, tone?: "ok" | "bad") => void) | null>(null);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);

  const push = useCallback((text: string, tone: "ok" | "bad" = "ok") => {
    const id = nextId.current++;
    setNotices((all) => [...all, { id, text, tone }]);
    setTimeout(() => setNotices((all) => all.filter((n) => n.id !== id)), 4200);
  }, []);

  return (
    <NoticeContext.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:items-end"
      >
        {notices.map((n) => (
          <div
            key={n.id}
            className={`reveal pointer-events-auto flex max-w-sm items-start gap-2 rounded-md px-3 py-2 text-13 shadow-pop ${
              n.tone === "ok" ? "bg-raised text-ink" : "bg-bad-soft text-bad"
            }`}
          >
            {n.text}
          </div>
        ))}
      </div>
    </NoticeContext.Provider>
  );
}

export function useNotice() {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotice outside NoticeProvider");
  return ctx;
}

// ── data ────────────────────────────────────────────────────────────────────

export type Resource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  set: (next: T) => void;
};

/** One-shot loader with an explicit reload. No cache: every screen asks for the
 *  truth when it mounts, which is what DNS-backed state deserves. */
export function useResource<T>(load: () => Promise<T>, deps: unknown[] = []): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const fn = useRef(load);
  fn.current = load;

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    fn.current().then(
      (value) => {
        if (!live) return;
        setData(value);
        setLoading(false);
      },
      (err: unknown) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      },
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, reload, set: setData };
}

/** Wraps a mutation so a button can show pending / error without each page
 *  reinventing it. */
export function useAction<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: A) => {
      setPending(true);
      setError(null);
      try {
        await fn(...args);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return false;
      } finally {
        setPending(false);
      }
    },
    [fn],
  );

  return { run, pending, error, clearError: () => setError(null) };
}
