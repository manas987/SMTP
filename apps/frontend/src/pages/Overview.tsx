import { Link } from "react-router";
import { api, blockingReason, canSendFrom, isVerified, type Domain } from "../lib/api";
import { useAction, useNotice, useResource } from "../lib/store";
import { Ago, Button, ErrorNote, Icon, PageHead, Panel, Skeleton, actionLink } from "../ui";
import { DomainChips } from "./Domains";

type Step = { label: string; done: boolean; to: string; action: string };

export function Overview() {
  const domains = useResource(api.domains);
  const senders = useResource(api.senders);

  const loading = domains.loading || senders.loading;
  const all = domains.data ?? [];
  const ready = all.filter(canSendFrom);
  const readyIds = new Set(ready.map((d) => d.id));
  const usableSenders = (senders.data ?? []).filter((s) => readyIds.has(s.domain));

  const steps: Step[] = [
    { label: "Add a domain", done: all.length > 0, to: "/domains", action: "Add a domain" },
    {
      label: "Verify ownership with a TXT record",
      done: all.some((d) => isVerified(d.status)),
      to: all.length ? `/domains/${all[0]!.id}` : "/domains",
      action: "Verify ownership",
    },
    {
      label: "Publish the DKIM record",
      done: all.some((d) => isVerified(d.dkim_status)),
      to: all.length ? `/domains/${all[0]!.id}` : "/domains",
      action: "Publish DKIM",
    },
    {
      label: "Register a sender address",
      done: usableSenders.length > 0,
      to: "/senders",
      action: "Register a sender",
    },
  ];

  const nextStep = steps.find((s) => !s.done);

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        title="Overview"
        action={
          <Button
            icon="refresh"
            onClick={() => {
              domains.reload();
              senders.reload();
            }}
          >
            Refresh
          </Button>
        }
      />

      {domains.error ? <ErrorNote onRetry={domains.reload}>{domains.error}</ErrorNote> : null}

      {/* the verdict: one sentence, the blocking clause carrying the way out of it */}
      {loading ? (
        <div className="h-7 w-[32rem] max-w-full animate-pulse rounded bg-sunken" />
      ) : (
        <p className="max-w-[62ch] text-20 leading-snug font-medium tracking-[-0.01em] text-ink text-balance">
          <Verdict domains={all} ready={ready} senders={usableSenders.length} />
        </p>
      )}

      {!loading && nextStep ? (
        <Panel
          title="Get to your first send"
          description="Four steps, in this order. Each one is enforced by the API — the next cannot start until the one before it passes."
        >
          <ol className="divide-y divide-line">
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-11 font-semibold ${
                    step.done
                      ? "border-ok/40 bg-ok-soft text-ok"
                      : step === nextStep
                        ? "border-accent bg-accent text-accent-ink"
                        : "border-line-strong bg-sunken text-ink-faint"
                  }`}
                >
                  {step.done ? <Icon name="check" className="size-3" /> : i + 1}
                </span>
                <span
                  className={`text-13 ${step.done ? "text-ink-muted line-through decoration-line-strong" : step === nextStep ? "font-medium text-ink" : "text-ink-muted"}`}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
          <div className="border-t border-line px-4 py-3.5">
            <Link to={nextStep.to} className={actionLink}>
              {nextStep.action}
              <Icon name="right" className="size-4" />
            </Link>
          </div>
        </Panel>
      ) : null}

      {!nextStep || all.length ? (
        <Panel
          title="Domains"
          description={all.length ? "Status is read from live DNS, not remembered." : undefined}
          action={
            <Link
              to="/domains"
              className="inline-flex items-center gap-1 text-13 font-medium text-accent no-underline"
            >
              All domains
              <Icon name="right" className="size-3.5" />
            </Link>
          }
        >
          {loading ? (
            <Skeleton rows={2} />
          ) : (
            <ul className="divide-y divide-line">
              {all.map((d, i) => (
                <DomainRow key={d.id} domain={d} index={i} onChecked={domains.reload} />
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      <p className="max-w-[70ch] border-t border-line pt-5 text-12 leading-relaxed text-ink-muted">
        There are no delivery statistics on this screen because the service records none: no opens,
        clicks, bounces, or per-message status, and no history of what was sent. Once a message is
        queued, the only account of what happened is the SMTP worker's own log.
      </p>
    </div>
  );
}

/** One domain, with the re-check that makes "measured, not claimed" true here
 *  rather than one page deeper. */
function DomainRow({
  domain,
  index,
  onChecked,
}: {
  domain: Domain;
  index: number;
  onChecked: () => void;
}) {
  const notice = useNotice();
  const check = useAction(async () => {
    const report = await api.checkAuth(domain.id);
    const all = [report.spf.status, report.dkim.status, report.dmarc.status];
    notice(
      all.every((s) => s === "verified")
        ? `${domain.domain}: SPF, DKIM and DMARC all verified`
        : `${domain.domain}: checked — open the domain for the detail`,
      all.every((s) => s === "verified") ? "ok" : "bad",
    );
    onChecked();
  });

  return (
    <li
      className="rise flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-150 hover:bg-sunken"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <Link
        to={`/domains/${domain.id}`}
        className="font-mono text-15 text-ink no-underline hover:underline"
      >
        {domain.domain}
      </Link>
      <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
        <DomainChips domain={domain} />
        <span className="text-12 whitespace-nowrap">
          <Ago at={domain.auth_checked_at} prefix="checked " />
        </span>
        <Button
          size="sm"
          variant="quiet"
          icon="refresh"
          pending={check.pending}
          onClick={() => check.run()}
          aria-label={`Re-check DNS for ${domain.domain}`}
        >
          Re-check
        </Button>
      </span>
      {check.error ? <p className="w-full text-12 text-bad">{check.error}</p> : null}
    </li>
  );
}

function Verdict({
  domains,
  ready,
  senders,
}: {
  domains: Domain[];
  ready: Domain[];
  senders: number;
}) {
  const clause = (to: string, text: string) => (
    <Link to={to} className="font-medium text-accent underline decoration-accent/40">
      {text}
    </Link>
  );

  if (domains.length === 0)
    return <>You can't send yet — {clause("/domains", "no domain has been added")}.</>;

  if (ready.length === 0) {
    const first = domains[0]!;
    return (
      <>
        You can't send yet —{" "}
        {clause(`/domains/${first.id}`, `${first.domain}: ${blockingReason(first)}`)}.
      </>
    );
  }

  if (senders === 0)
    return (
      <>
        {ready.length === 1 ? "One domain is" : `${ready.length} domains are`} ready, but{" "}
        {clause("/senders", "no sender address is registered on it")}.
      </>
    );

  return (
    <>
      You can send. {senders} {senders === 1 ? "address" : "addresses"} on{" "}
      {ready.length === 1 ? "one verified domain" : `${ready.length} verified domains`}.
    </>
  );
}
