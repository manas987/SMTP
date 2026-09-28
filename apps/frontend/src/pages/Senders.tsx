import { useState } from "react";
import { Link } from "react-router";
import { api, canSendFrom, isVerified, type Domain } from "../lib/api";
import { useAction, useNotice, useResource } from "../lib/store";
import {
  Button,
  ConfirmInline,
  EmptyState,
  ErrorNote,
  Field,
  Icon,
  Input,
  PageHead,
  Panel,
  Select,
  Skeleton,
  StatusChip,
} from "../ui";

export function Senders() {
  const senders = useResource(api.senders);
  const domains = useResource(api.domains);
  const [adding, setAdding] = useState(false);
  const notice = useNotice();

  const verifiedDomains = (domains.data ?? []).filter((d) => isVerified(d.status));
  const byId = new Map((domains.data ?? []).map((d) => [d.id, d]));

  const remove = useAction(async (senderId: number) => {
    await api.deleteSender(senderId);
    notice("Sender removed");
    senders.reload();
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Senders"
        description="The From addresses you're allowed to send as. Each one has to sit on a domain whose ownership is already verified."
        action={
          verifiedDomains.length ? (
            <Button variant="primary" icon="plus" onClick={() => setAdding((v) => !v)}>
              Add sender
            </Button>
          ) : null
        }
      />

      {adding ? (
        <AddSender
          domains={verifiedDomains}
          onDone={() => {
            setAdding(false);
            senders.reload();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : null}

      {senders.error ? <ErrorNote onRetry={senders.reload}>{senders.error}</ErrorNote> : null}

      <Panel>
        {senders.loading || domains.loading ? (
          <Skeleton rows={2} />
        ) : !verifiedDomains.length ? (
          <EmptyState title="No verified domain yet">
            <p>
              A sender address can only be registered on a domain that has passed ownership
              verification.{" "}
              <Link to="/domains" className="font-medium text-accent">
                Verify a domain
              </Link>{" "}
              first, then come back.
            </p>
          </EmptyState>
        ) : !senders.data?.length ? (
          <EmptyState
            title="No senders yet"
            action={
              <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>
                Add your first sender
              </Button>
            }
          >
            <p>
              Register the exact address your mail will come from, such as{" "}
              <code className="font-mono text-12">hello@{verifiedDomains[0]!.domain}</code>. Every
              send names one of these.
            </p>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {senders.data.map((s, i) => {
              const domain = byId.get(s.domain);
              return (
                <li
                  key={s.id}
                  className="rise flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-15 break-all text-ink">{s.email}</p>
                    {domain ? (
                      <p className="mt-0.5 text-12 text-ink-muted">
                        {canSendFrom(domain) ? (
                          "Domain is ready"
                        ) : (
                          <>
                            Domain not ready —{" "}
                            <Link
                              to={`/domains/${domain.id}`}
                              className="font-medium text-accent"
                            >
                              finish {domain.domain}
                            </Link>
                          </>
                        )}
                      </p>
                    ) : null}
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    {domain ? <StatusChip label="DKIM" status={domain.dkim_status} /> : null}
                    <RemoveSender
                      email={s.email}
                      pending={remove.pending}
                      onConfirm={() => remove.run(s.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {remove.error ? <ErrorNote>{remove.error}</ErrorNote> : null}
    </div>
  );
}

function RemoveSender({
  email,
  pending,
  onConfirm,
}: {
  email: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming)
    return (
      <Button
        size="sm"
        variant="quiet"
        icon="trash"
        aria-label={`Remove ${email}`}
        onClick={() => setConfirming(true)}
      >
        Remove
      </Button>
    );

  return (
    <ConfirmInline
      question="Remove this sender?"
      confirmLabel="Remove"
      pending={pending}
      onCancel={() => setConfirming(false)}
      onConfirm={onConfirm}
    />
  );
}

function AddSender({
  domains,
  onDone,
  onCancel,
}: {
  domains: Domain[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [local, setLocal] = useState("");
  const [domain, setDomain] = useState(domains[0]?.domain ?? "");
  const notice = useNotice();

  const { run, pending, error } = useAction(async () => {
    await api.addSender(`${local.trim()}@${domain}`);
    notice(`${local.trim()}@${domain} registered`);
    onDone();
  });

  return (
    <Panel title="Add a sender" description="Only verified domains can be chosen.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-col gap-4 p-4"
        noValidate
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Field label="Mailbox" className="flex-1" error={error}>
            {(p) => (
              <Input
                {...p}
                mono
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="hello"
                autoFocus
                required
              />
            )}
          </Field>
          <div className="hidden pt-8 font-mono text-15 text-ink-faint sm:block">@</div>
          <Field label="Domain" className="flex-1">
            {(p) => (
              <Select
                {...p}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="font-mono"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.domain}>
                    {d.domain}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <p className="flex items-start gap-1.5 text-12 text-ink-muted">
          <Icon name="info" className="mt-px size-3.5" />
          Sender addresses are globally unique across all accounts, so an address another account
          already registered will be refused.
        </p>

        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" pending={pending}>
            Add sender
          </Button>
          <Button type="button" variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}
