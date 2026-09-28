/**
 * Thin client over the backend. Every call goes to /api, which this app's own
 * Bun server proxies to the Express API — the backend sends no CORS headers.
 *
 * The backend reads `Authorization` raw (it does not strip a `Bearer ` prefix),
 * so the token is sent exactly as issued. See BACKEND_NOTES.md.
 */

const TOKEN_KEY = "smtp.token";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: the session simply does not survive a reload */
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function call<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  const token = readToken();
  if (token) headers.authorization = token;
  if (body !== undefined) headers["content-type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("The dashboard could not reach its own server.", 0);
  }

  const text = await res.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      writeToken(null);
      onUnauthorized?.();
    }
    // the API is not consistent: some routes answer {error}, some {status,error}
    const message =
      payload?.error ?? payload?.message ?? `Request failed (${res.status} ${res.statusText}).`;
    throw new ApiError(String(message), res.status);
  }

  return payload as T;
}

// ── types ───────────────────────────────────────────────────────────────────

/** Every status column the backend writes: 'pending' | 'verified' | 'failed' | … */
export type Check = string;

export type Domain = {
  id: number;
  domain: string;
  status: Check;
  verified_at: string | null;
  dkim_selector: string | null;
  spf_status: Check;
  dkim_status: Check;
  dmarc_status: Check;
  auth_checked_at: string | null;
};

export type DnsRecord = { type: string; name: string; value: string };
export type Sender = { id: number; email: string; domain: number };
export type MailList = { id: number; name: string };
export type Member = { id: number; email: string };

export type CheckResult = { status: Check; record: string | null; reason?: string };

export type AuthReport = {
  domain: string;
  ownership: Check;
  spf: CheckResult;
  dkim: CheckResult & { hostname: string };
  dmarc: CheckResult;
};

export const MEMBERS_READ_BROKEN =
  "The API cannot list members yet — its member-read route rejects the query parameter it is given, so every request comes back as an error.";

// ── calls ───────────────────────────────────────────────────────────────────

export const api = {
  signup: (username: string, password: string) =>
    call<{ user: { id: number; username: string }; apiKey: string }>("POST", "/auth/signup", {
      username,
      password,
    }),

  signin: (username: string, password: string) =>
    call<{ token: string }>("POST", "/auth/signin", { username, password }),

  rotateApiKey: () => call<{ apiKey: string }>("POST", "/auth/api-key"),

  domains: () => call<{ domains: Domain[] }>("GET", "/domain/read").then((r) => r.domains ?? []),

  addDomain: (domain: string) =>
    call<{ domain: Domain; dnsRecord: DnsRecord }>("POST", "/domain/create", { domain }),

  verifyDomain: (domainId: number) =>
    call<{ message?: string; domain?: Domain; dkim?: DnsRecord & { status: Check } }>(
      "POST",
      "/domain/verify",
      { domainId },
    ),

  // note: this one route takes `id`, every other domain route takes `domainId`
  checkAuth: (domainId: number) => call<AuthReport>("POST", "/domain/verify-auth", { id: domainId }),

  deleteDomain: (domainId: number) => call<unknown>("DELETE", "/domain/delete", { domainId }),

  senders: () => call<{ senders: Sender[] }>("GET", "/sender/read").then((r) => r.senders ?? []),
  addSender: (email: string) => call<unknown>("POST", "/sender/create", { email }),
  deleteSender: (senderId: number) => call<unknown>("DELETE", "/sender/delete", { senderId }),

  // the list router is mounted at /list and its own paths start with /list too
  lists: () => call<{ lists: MailList[] }>("GET", "/list/list/read").then((r) => r.lists ?? []),
  addList: (name: string) => call<{ list: MailList }>("POST", "/list/list/create", { name }),
  renameList: (listId: number, name: string) =>
    call<{ list: MailList }>("PATCH", "/list/list/update", { listId, name }),
  deleteList: (listId: number) => call<unknown>("DELETE", "/list/list/delete", { listId }),

  // Broken server-side today: the route validates req.query.listId with z.int(),
  // but Express query values are always strings, so every request 400s. Nothing
  // the client can send fixes it — see BACKEND_NOTES.md.
  members: (listId: number) =>
    call<{ emails: Member[] }>("GET", `/list/list/members/read?listId=${listId}`)
      .then((r) => r.emails ?? [])
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 400) {
          throw new ApiError(MEMBERS_READ_BROKEN, 400);
        }
        throw err;
      }),
  addMember: (listId: number, email: string) =>
    call<unknown>("POST", "/list/list/member/add", { listId, email }),
  removeMember: (listId: number, email: string) =>
    call<unknown>("DELETE", "/list/list/member/delete", { listId, email }),

  sendOne: (input: { to: string; senderId: number; subject: string; body: string; html?: string }) =>
    call<{ message: string }>("POST", "/email/send/one", input),

  sendList: (input: {
    listId: number;
    senderId: number;
    subject: string;
    body: string;
    html?: string;
  }) => call<{ message: string }>("POST", "/email/send/list", input),
};

// ── derived truth ───────────────────────────────────────────────────────────

export const isVerified = (c: Check) => c === "verified";

/** The backend refuses a send unless ownership AND DKIM are both verified. */
export const canSendFrom = (d: Domain) => isVerified(d.status) && isVerified(d.dkim_status);

export function blockingReason(d: Domain): string | null {
  if (!isVerified(d.status)) return "domain ownership is not verified yet";
  if (!isVerified(d.dkim_status)) return "DKIM is not verified yet";
  return null;
}
