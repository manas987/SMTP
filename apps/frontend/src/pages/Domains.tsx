import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  api,
  blockingReason,
  canSendFrom,
  isVerified,
  type AuthReport,
  type Domain,
} from "../lib/api";
import {
  dmarcSuggestion,
  forgetRecords,
  recallRecord,
  rememberRecord,
  spfSuggestion,
} from "../lib/records";
import { useAction, useNotice, useResource } from "../lib/store";
import {
  Ago,
  Button,
  ConfirmInline,
  CopyValue,
  DnsRecordRow,
  EmptyState,
  ErrorNote,
  Field,
  Icon,
  Input,
  PageHead,
  Panel,
  Skeleton,
  StatusChip,
  toneOf,
} from "../ui";

export function DomainChips({ domain }: { domain: Domain }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusChip label="Ownership" status={domain.status} />
      <StatusChip label="DKIM" status={domain.dkim_status} />
      <StatusChip label="SPF" status={domain.spf_status} />
      <StatusChip label="DMARC" status={domain.dmarc_status} />
    </div>
  );
}

// ── list ────────────────────────────────────────────────────────────────────

export function Domains() {
  const domains = useResource(api.domains);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Domains"
        description="A domain has to prove you own it, then carry a DKIM key, before this service will send anything from an address on it."
        action={
          <Button variant="primary" icon="plus" onClick={() => setAdding((v) => !v)}>
            Add domain
          </Button>
        }
      />

      {adding ? (
        <AddDomain
          onDone={() => {
            setAdding(false);
            domains.reload();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : null}

      {domains.error ? <ErrorNote onRetry={domains.reload}>{domains.error}</ErrorNote> : null}

      <Panel>
        {domains.loading ? (
          <Skeleton rows={3} />
        ) : !domains.data?.length ? (
          <EmptyState
            title="No domains yet"
            action={
              <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>
                Add your first domain
              </Button>
            }
          >
            <p>
              Add a domain you control the DNS for. You'll publish one TXT record to prove
              ownership, a second to carry the DKIM key this service generates, and then addresses
              on that domain can send.
            </p>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {domains.data.map((d, i) => (
              <li key={d.id} className="rise" style={{ animationDelay: `${i * 35}ms` }}>
                <Link
                  to={`/domains/${d.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 no-underline transition-colors duration-150 hover:bg-sunken"
                >
                  <span className="font-mono text-15 text-ink">{d.domain}</span>
                  <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
                    <DomainChips domain={d} />
                    <span className="text-12 whitespace-nowrap">
                      <Ago at={d.auth_checked_at} prefix="checked " />
                    </span>
                    <Icon name="chevron" className="size-4 text-ink-faint" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function AddDomain({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  const { run, pending, error } = useAction(async () => {
    const result = await api.addDomain(value.trim().toLowerCase());
    rememberRecord("ownership", result.domain.id, result.dnsRecord);
    onDone();
    navigate(`/domains/${result.domain.id}`);
  });

  return (
    <Panel title="Add a domain" description="Use the domain your From addresses will sit on.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-col gap-4 p-4"
        noValidate
      >
        <Field
          label="Domain"
          error={error}
          hint="No protocol and no www — just the registrable domain, e.g. mail.example.com or example.com."
        >
          {(p) => (
            <Input
              {...p}
              mono
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="example.com"
              autoFocus
              required
            />
          )}
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" pending={pending}>
            Add domain
          </Button>
          <Button type="button" variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

// ── detail ──────────────────────────────────────────────────────────────────

function StepHeading({ step, title, done }: { step: number; title: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-11 font-semibold ${
          done ? "border-ok/40 bg-ok-soft text-ok" : "border-line-strong bg-sunken text-ink-muted"
        }`}
      >
        {done ? <Icon name="check" className="size-3" /> : step}
      </span>
      <h2 className="text-15 font-semibold text-ink">{title}</h2>
    </div>
  );
}

function ResultLine({
  label,
  result,
}: {
  label: string;
  result: { status: string; record?: string | null; reason?: string };
}) {
  const tone = toneOf(result.status);
  return (
    <div className="flex flex-col gap-1.5 border-t border-line py-2.5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusChip label={label} status={result.status} />
        {result.reason ? (
          <span className={`text-12 ${tone === "ok" ? "text-ink-muted" : "text-ink"}`}>
            {result.reason}
          </span>
        ) : null}
      </div>
      {result.record ? (
        <code className="block overflow-x-auto rounded border border-line bg-sunken px-2 py-1 font-mono text-11 whitespace-pre text-ink-muted">
          {result.record}
        </code>
      ) : null}
    </div>
  );
}

export function DomainDetail() {
  const { id } = useParams();
  const domainId = Number(id);
  const navigate = useNavigate();
  const notice = useNotice();

  const domains = useResource(api.domains, [domainId]);
  const domain = domains.data?.find((d) => d.id === domainId) ?? null;

  const [report, setReport] = useState<AuthReport | null>(null);
  const [dkimRecord, setDkimRecord] = useState(() => recallRecord("dkim", domainId));
  const [confirming, setConfirming] = useState(false);

  const verify = useAction(async () => {
    const result = await api.verifyDomain(domainId);
    if (result.dkim) {
      const record = { type: result.dkim.type, name: result.dkim.name, value: result.dkim.value };
      rememberRecord("dkim", domainId, record);
      setDkimRecord(record);
      notice("Ownership verified — now publish the DKIM record");
    } else {
      notice(result.message ?? "Ownership verified");
    }
    domains.reload();
  });

  const check = useAction(async () => {
    const result = await api.checkAuth(domainId);
    setReport(result);
    domains.reload();
    const all = [result.spf.status, result.dkim.status, result.dmarc.status];
    notice(
      all.every((s) => s === "verified")
        ? "SPF, DKIM and DMARC all verified"
        : "Checked — see the results below",
      all.every((s) => s === "verified") ? "ok" : "bad",
    );
  });

  const remove = useAction(async () => {
    await api.deleteDomain(domainId);
    forgetRecords(domainId);
    notice("Domain removed");
    navigate("/domains", { replace: true });
  });

  if (domains.loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-64 animate-pulse rounded bg-sunken" />
        <Panel>
          <Skeleton rows={4} />
        </Panel>
      </div>
    );
  }

  if (domains.error) return <ErrorNote onRetry={domains.reload}>{domains.error}</ErrorNote>;

  if (!domain) {
    return (
      <div className="flex flex-col gap-4">
        <PageHead title="Domain not found" description="It may have been removed." />
        <Link to="/domains" className="text-13 font-medium text-accent underline">
          Back to domains
        </Link>
      </div>
    );
  }

  const ownershipRecord = recallRecord("ownership", domainId);
  const owned = isVerified(domain.status);
  const ready = canSendFrom(domain);
  const blocker = blockingReason(domain);
  const dkimHost = domain.dkim_selector ? `${domain.dkim_selector}._domainkey.${domain.domain}` : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          to="/domains"
          className="inline-flex w-fit items-center gap-1 text-13 font-medium text-ink-muted no-underline hover:text-ink"
        >
          <Icon name="chevron" className="size-3.5 rotate-180" />
          Domains
        </Link>

        <PageHead
          title={domain.domain}
          description={
            ready ? (
              <>
                Ready to send. Verified <Ago at={domain.verified_at} />.
              </>
            ) : (
              <>
                Not ready to send — {blocker}.
              </>
            )
          }
          action={
            <Button icon="refresh" onClick={() => check.run()} pending={check.pending}>
              Re-check DNS
            </Button>
          }
        />
        <DomainChips domain={domain} />
      </div>

      {check.error ? <ErrorNote onRetry={() => check.run()}>{check.error}</ErrorNote> : null}

      {/* step 1 */}
      <Panel className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepHeading step={1} title="Prove you own the domain" done={owned} />
            {!owned ? (
              <Button variant="primary" onClick={() => verify.run()} pending={verify.pending}>
                Verify ownership
              </Button>
            ) : null}
          </div>

          {verify.error ? <ErrorNote>{verify.error}</ErrorNote> : null}

          {owned ? (
            <p className="text-13 text-ink-muted">
              Verified <Ago at={domain.verified_at} />. The ownership record can stay or go; it is
              not re-checked.
            </p>
          ) : ownershipRecord ? (
            <>
              <p className="max-w-[68ch] text-13 leading-relaxed text-ink-muted">
                Publish this TXT record at your DNS provider, then press Verify ownership. DNS takes
                anywhere from a minute to a few hours to propagate, so a failure here usually means
                "not yet" rather than "wrong".
              </p>
              <DnsRecordRow record={ownershipRecord} />
            </>
          ) : (
            <p className="max-w-[68ch] rounded-md bg-warn-soft px-3 py-2.5 text-13 leading-relaxed text-warn">
              The ownership token is only returned once, when the domain is added, and this browser
              has no copy of it. Remove this domain and add it again to get a fresh record.
            </p>
          )}
        </div>
      </Panel>

      {/* step 2 */}
      <Panel className="p-4">
        <div className="flex flex-col gap-4">
          <StepHeading step={2} title="Publish the DKIM key" done={isVerified(domain.dkim_status)} />

          {!owned ? (
            <p className="text-13 text-ink-muted">
              The DKIM keypair is generated the moment ownership is verified. Finish step 1 first.
            </p>
          ) : dkimRecord ? (
            <>
              <p className="max-w-[68ch] text-13 leading-relaxed text-ink-muted">
                This is the public half of the key this service signs your mail with. The private
                half never leaves the server.
              </p>
              <DnsRecordRow
                record={dkimRecord}
                note="Some DNS providers split long TXT values across quoted chunks; that is fine, the checker rejoins them."
              />
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="max-w-[68ch] rounded-md bg-warn-soft px-3 py-2.5 text-13 leading-relaxed text-warn">
                The DKIM value is returned only once, in the response that verified ownership, and
                this browser has no copy. The host below is still correct, but the{" "}
                <code className="font-mono">p=</code> value can only come from the{" "}
                <code className="font-mono">sending_domains</code> table — or from removing this
                domain and adding it again, which generates a new key.
              </p>
              {dkimHost ? <CopyValue value={dkimHost} label="DKIM host" wrap /> : null}
            </div>
          )}
        </div>
      </Panel>

      {/* step 3 */}
      <Panel className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepHeading
              step={3}
              title="Add SPF and DMARC"
              done={isVerified(domain.spf_status) && isVerified(domain.dmarc_status)}
            />
            <Button icon="refresh" onClick={() => check.run()} pending={check.pending}>
              Run checks
            </Button>
          </div>

          <p className="max-w-[68ch] text-13 leading-relaxed text-ink-muted">
            Sending does not require these two, but receiving servers care. This service only reads
            them — it never issues them, so the values are yours to author. Checks resolve against
            8.8.8.8 and 1.1.1.1.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-13 font-medium text-ink">
                SPF — one TXT record on{" "}
                <code className="font-mono text-12">{domain.domain}</code>
              </h3>
              <CopyValue value={spfSuggestion} label="SPF record" wrap />
              <p className="text-12 text-ink-muted">
                Replace the placeholder with the public IP your SMTP engine sends from. The check
                only requires exactly one syntactically valid SPF record — it cannot tell whether
                that record actually authorises this sender.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-13 font-medium text-ink">
                DMARC — one TXT record on{" "}
                <code className="font-mono text-12">_dmarc.{domain.domain}</code>
              </h3>
              <CopyValue value={dmarcSuggestion} label="DMARC record" wrap />
              <p className="text-12 text-ink-muted">
                <code className="font-mono">p=none</code> only asks for observation. Move to
                quarantine or reject once you trust your own SPF and DKIM.
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {report ? (
        <Panel
          title="Last check"
          description={`Resolved just now for ${report.domain}.`}
          className="reveal"
        >
          <div className="flex flex-col px-4 py-3">
            <ResultLine label="Ownership" result={{ status: report.ownership }} />
            <ResultLine label="DKIM" result={report.dkim} />
            <ResultLine label="SPF" result={report.spf} />
            <ResultLine label="DMARC" result={report.dmarc} />
          </div>
        </Panel>
      ) : null}

      <Panel title="Remove domain" description="Senders on this domain are removed with it.">
        <div className="p-4">
          {remove.error ? <ErrorNote>{remove.error}</ErrorNote> : null}
          {confirming ? (
            <ConfirmInline
              question={`Remove ${domain.domain} and every sender on it?`}
              confirmLabel="Remove domain"
              pending={remove.pending}
              onCancel={() => setConfirming(false)}
              onConfirm={() => remove.run()}
            />
          ) : (
            <Button variant="danger" icon="trash" onClick={() => setConfirming(true)}>
              Remove {domain.domain}
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}
