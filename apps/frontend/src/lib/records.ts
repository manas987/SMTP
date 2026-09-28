import type { DnsRecord } from "./api";

/**
 * The API hands out two DNS record values exactly once and never again:
 * the ownership token (POST /domain/create) and the DKIM public key
 * (POST /domain/verify). GET /domain/read returns neither, so if the tab is
 * closed before the records are published, the value is gone for good.
 *
 * Until the backend returns them on read, this browser keeps its own copy.
 * It is per-browser and best-effort — never the source of truth for status.
 */

type Kind = "ownership" | "dkim";

const key = (kind: Kind, domainId: number) => `smtp.record.${kind}.${domainId}`;

export function rememberRecord(kind: Kind, domainId: number, record: DnsRecord) {
  try {
    localStorage.setItem(key(kind, domainId), JSON.stringify(record));
  } catch {}
}

export function recallRecord(kind: Kind, domainId: number): DnsRecord | null {
  try {
    const raw = localStorage.getItem(key(kind, domainId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.value === "string" && typeof parsed?.name === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function forgetRecords(domainId: number) {
  try {
    localStorage.removeItem(key("ownership", domainId));
    localStorage.removeItem(key("dkim", domainId));
  } catch {}
}

/** What the user must publish for SPF and DMARC — the backend only checks
 *  that these exist and parse, it never issues them. */
export const spfSuggestion = "v=spf1 ip4:REPLACE-WITH-YOUR-SENDING-IP ~all";
export const dmarcSuggestion = "v=DMARC1; p=none";
