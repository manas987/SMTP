import {
  forwardRef,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { useNotice } from "./lib/store";

// ── icons: one authored set, 24-grid, 1.5 stroke, currentColor ──────────────

const paths = {
  gauge: ["M4.2 17.5a9 9 0 1 1 15.6 0", "M12 12.8 16 8.5"],
  globe: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M3.3 9.5h17.4M3.3 14.5h17.4", "M12 3c-4 5.4-4 12.6 0 18 4-5.4 4-12.6 0-18Z"],
  at: ["M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z", "M15.8 12v1.9a2.9 2.9 0 0 0 5.7 0V12A9.5 9.5 0 1 0 17 19.6"],
  users: ["M3.5 20v-1.2A4.3 4.3 0 0 1 7.8 14.5h3.4a4.3 4.3 0 0 1 4.3 4.3V20", "M9.5 4.6a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z", "M16.8 5a3.7 3.7 0 0 1 0 6.9M17.6 14.6h.6a4.3 4.3 0 0 1 4.3 4.2V20"],
  send: ["M3.2 11.4 20.8 3.6 13 21.2l-2.4-7.3-7.4-2.5Z", "m10.6 13.9 10.2-10.3"],
  key: ["M8.6 13.4a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Z", "m11.4 13 8.2-8.2", "M16.5 4.3h3.9v3.9"],
  sun: ["M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Z", "M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4"],
  moon: ["M20.4 14.8A8.6 8.6 0 0 1 9.2 3.6a8.6 8.6 0 1 0 11.2 11.2Z"],
  monitor: ["M4.4 4.5h15.2a1.4 1.4 0 0 1 1.4 1.4v9.2a1.4 1.4 0 0 1-1.4 1.4H4.4A1.4 1.4 0 0 1 3 15.1V5.9a1.4 1.4 0 0 1 1.4-1.4Z", "M9 19.9h6M12 16.5v3.4"],
  check: ["m4.8 12.6 4.8 4.8L19.2 6.6"],
  alert: ["M12 3.6 2.4 20.4h19.2L12 3.6Z", "M12 9.6v4.6", "M12 17.2h.01"],
  x: ["m6.2 6.2 11.6 11.6M17.8 6.2 6.2 17.8"],
  copy: ["M9.6 8.4h10.2a1.4 1.4 0 0 1 1.4 1.4v10.2a1.4 1.4 0 0 1-1.4 1.4H9.6a1.4 1.4 0 0 1-1.4-1.4V9.8a1.4 1.4 0 0 1 1.4-1.4Z", "M15.8 5.6V4.2a1.4 1.4 0 0 0-1.4-1.4H4.2a1.4 1.4 0 0 0-1.4 1.4v10.2a1.4 1.4 0 0 0 1.4 1.4h1.4"],
  plus: ["M12 5.2v13.6M5.2 12h13.6"],
  refresh: ["M20.4 12a8.4 8.4 0 1 1-2.5-6", "M20.4 3.6v4.6h-4.6"],
  trash: ["M3.8 7h16.4", "M9.4 7V4.4h5.2V7", "M6.2 7l.9 13.6h9.8L17.8 7"],
  right: ["M5 12h13.4", "m13.4 6.4 6 5.6-6 5.6"],
  out: ["m15.4 16.6 4.6-4.6-4.6-4.6", "M20 12H9.2", "M13 4.2H6.6a2 2 0 0 0-2 2v11.6a2 2 0 0 0 2 2H13"],
  info: ["M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z", "M12 11.2v5.4", "M12 7.8h.01"],
  dot: ["M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"],
  chevron: ["m9.4 5.4 6.6 6.6-6.6 6.6"],
  menu: ["M3.8 7.2h16.4M3.8 12h16.4M3.8 16.8h16.4"],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className = "size-4",
  filled,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {paths[name].map((d, i) => (
        <path key={i} d={d} fill={filled && i === 0 ? "currentColor" : "none"} />
      ))}
    </svg>
  );
}

// ── button ──────────────────────────────────────────────────────────────────

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "default" | "quiet" | "danger";
  size?: "sm" | "md";
  icon?: IconName;
  pending?: boolean;
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-accent text-accent-ink border-transparent hover:bg-accent-hover active:bg-accent-hover",
  default: "bg-raised text-ink border-line-strong hover:bg-sunken active:bg-sunken",
  quiet: "bg-transparent text-ink-muted border-transparent hover:bg-sunken hover:text-ink",
  danger: "bg-transparent text-bad border-line hover:bg-bad-soft hover:border-bad/40",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size = "md", icon, pending, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      disabled={rest.disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 ${
        size === "sm" ? "h-7 px-2 text-12" : "h-9 px-3 text-13"
      } ${variants[variant]} ${className}`}
    >
      {pending ? (
        <span className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
      ) : icon ? (
        <Icon name={icon} className={size === "sm" ? "size-3.5" : "size-4"} />
      ) : null}
      {children}
    </button>
  );
});

/** Primary-button styling for a react-router <Link>; a <button> inside an
 *  anchor is invalid, so navigation that looks like an action uses this. */
export const actionLink =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-transparent bg-accent px-3 text-13 font-medium text-accent-ink no-underline transition-colors duration-150 hover:bg-accent-hover";

// ── form controls ───────────────────────────────────────────────────────────

// the select arrow, drawn from the same icon set rather than left to the browser
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888891' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9.5 6 6 6-6'/%3E%3C/svg%3E\")";

const control =
  "w-full rounded-md border border-line-strong bg-raised px-2.5 text-13 text-ink transition-colors duration-150 placeholder:text-ink-faint hover:border-ink-faint/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-50 aria-[invalid=true]:border-bad";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(
  function Input({ className = "", mono, ...rest }, ref) {
    return <input ref={ref} {...rest} className={`${control} h-9 ${mono ? "font-mono text-13" : ""} ${className}`} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }>(
  function Textarea({ className = "", mono, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        {...rest}
        className={`${control} resize-y py-2 leading-relaxed ${mono ? "font-mono" : ""} ${className}`}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        {...rest}
        style={{ backgroundImage: CHEVRON, ...rest.style }}
        className={`${control} h-9 cursor-pointer appearance-none bg-[length:16px] bg-[position:right_0.5rem_center] bg-no-repeat pr-9 ${className}`}
      >
        {children}
      </select>
    );
  },
);

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-13 font-medium text-ink">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-12 text-bad">
          <Icon name="alert" className="mt-px size-3.5" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-12 text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ── status ──────────────────────────────────────────────────────────────────

export type Tone = "ok" | "wait" | "bad";

export function toneOf(status: string): Tone {
  if (status === "verified") return "ok";
  if (status === "pending") return "wait";
  return "bad";
}

const tones: Record<Tone, { chip: string; icon: IconName }> = {
  ok: { chip: "border-ok/35 bg-ok-soft text-ok", icon: "check" },
  wait: { chip: "border-line-strong bg-sunken text-ink-muted", icon: "dot" },
  bad: { chip: "border-bad/35 bg-bad-soft text-bad", icon: "alert" },
};

/** A labelled record status, e.g. `SPF · verified`. */
export function StatusChip({ label, status }: { label: string; status: string }) {
  const tone = tones[toneOf(status)];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-11 leading-4 font-medium ${tone.chip}`}
    >
      <Icon name={tone.icon} className="size-3" filled={toneOf(status) === "wait"} />
      <span className="tracking-wide uppercase">{label}</span>
      <span className="text-ink-faint" aria-hidden="true">
        ·
      </span>
      <span>{status}</span>
    </span>
  );
}

// ── copyable machine values ─────────────────────────────────────────────────

export function CopyValue({
  value,
  label,
  wrap,
}: {
  value: string;
  label?: string;
  wrap?: boolean;
}) {
  const notice = useNotice();
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
      notice(`${label ?? "Value"} copied`);
    } catch {
      notice("Your browser blocked the clipboard — select the text and copy it", "bad");
    }
  };

  return (
    <div className="flex items-start gap-2">
      <code
        className={`min-w-0 flex-1 rounded border border-line bg-sunken px-2 py-1.5 font-mono text-12 leading-relaxed text-ink ${
          wrap ? "break-all" : "overflow-x-auto whitespace-pre"
        }`}
      >
        {value}
      </code>
      <Button size="sm" icon={done ? "check" : "copy"} onClick={copy} aria-label={`Copy ${label ?? "value"}`}>
        {done ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

/** One DNS record, laid out the way a registrar's form asks for it. */
export function DnsRecordRow({
  record,
  note,
}: {
  record: { type: string; name: string; value: string };
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-line py-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="rounded border border-line-strong bg-sunken px-1.5 py-0.5 font-mono text-11 font-medium text-ink-muted">
          {record.type}
        </span>
        <span className="font-mono text-13 break-all text-ink">{record.name}</span>
      </div>
      <CopyValue value={record.value} label="Record value" wrap />
      {note ? <p className="text-12 text-ink-muted">{note}</p> : null}
    </div>
  );
}

// ── containers ──────────────────────────────────────────────────────────────

export function Panel({
  title,
  action,
  description,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-line bg-raised ${className}`}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-15 font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-13 text-ink-muted">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function PageHead({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-[68ch]">
        <h1 className="text-24 leading-tight font-semibold tracking-[-0.015em] text-ink text-balance">
          {title}
        </h1>
        {description ? <p className="mt-1.5 text-13 text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 px-4 py-10 sm:px-6">
      <h3 className="text-15 font-semibold text-ink">{title}</h3>
      <div className="max-w-[58ch] text-13 leading-relaxed text-ink-muted">{children}</div>
      {action}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-line" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4">
          <div className="h-3.5 w-44 animate-pulse rounded bg-sunken" />
          <div className="ml-auto h-3.5 w-24 animate-pulse rounded bg-sunken" />
        </div>
      ))}
    </div>
  );
}

export function ErrorNote({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md bg-bad-soft px-3 py-2.5 text-13 text-bad">
      <Icon name="alert" className="size-4" />
      <span className="min-w-0 flex-1">{children}</span>
      {onRetry ? (
        <Button size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Inline confirm — no modal for a task that needs no protected focus. */
export function ConfirmInline({
  question,
  confirmLabel,
  onConfirm,
  onCancel,
  pending,
}: {
  question: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-13">
      <span className="mr-auto text-ink-muted">{question}</span>
      <Button size="sm" variant="quiet" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
      <Button size="sm" variant="danger" onClick={onConfirm} pending={pending}>
        {confirmLabel}
      </Button>
    </div>
  );
}

/** A relative timestamp with the exact value one hover away. */
export function Ago({ at, prefix = "" }: { at: string | null; prefix?: string }) {
  if (!at) return <span className="text-ink-faint">not checked yet</span>;
  const then = new Date(at);
  if (Number.isNaN(then.getTime())) return <span className="text-ink-faint">unknown</span>;

  const secs = Math.round((Date.now() - then.getTime()) / 1000);
  const text =
    secs < 60
      ? "just now"
      : secs < 3600
        ? `${Math.floor(secs / 60)}m ago`
        : secs < 86400
          ? `${Math.floor(secs / 3600)}h ago`
          : `${Math.floor(secs / 86400)}d ago`;

  return (
    <time dateTime={at} title={then.toLocaleString()} className="text-ink-muted">
      {prefix}
      {text}
    </time>
  );
}
