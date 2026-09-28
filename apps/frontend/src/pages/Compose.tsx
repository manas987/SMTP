import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api, canSendFrom } from "../lib/api";
import { useAction, useResource } from "../lib/store";
import {
  Button,
  EmptyState,
  ErrorNote,
  Field,
  Icon,
  Input,
  PageHead,
  Panel,
  Select,
  Skeleton,
  Textarea,
} from "../ui";

type Mode = "one" | "list";

export function Compose() {
  const [params, setParams] = useSearchParams();
  const senders = useResource(api.senders);
  const domains = useResource(api.domains);
  const lists = useResource(api.lists);

  const preselectedList = params.get("list");
  const [mode, setMode] = useState<Mode>(preselectedList ? "list" : "one");
  const [senderId, setSenderId] = useState("");
  const [listId, setListId] = useState(preselectedList ?? "");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [html, setHtml] = useState("");
  const [withHtml, setWithHtml] = useState(false);
  const [queued, setQueued] = useState<string | null>(null);

  // only senders whose domain the backend will actually accept a send from
  const readyById = new Map((domains.data ?? []).filter(canSendFrom).map((d) => [d.id, d]));
  const usable = (senders.data ?? []).filter((s) => readyById.has(s.domain));
  const blocked = (senders.data ?? []).length - usable.length;

  useEffect(() => {
    if (!senderId && usable.length) setSenderId(String(usable[0]!.id));
  }, [usable, senderId]);

  useEffect(() => {
    if (!listId && lists.data?.length) setListId(String(lists.data[0]!.id));
  }, [lists.data, listId]);

  // a list send with no members comes back as a 404 from the join, so the count
  // is worth knowing before the user presses send
  const memberCount = useResource(
    () => (mode === "list" && listId ? api.members(Number(listId)) : Promise.resolve(null)),
    [mode, listId],
  );

  const send = useAction(async () => {
    const common = {
      senderId: Number(senderId),
      subject: subject.trim(),
      body,
      ...(withHtml && html.trim() ? { html } : {}),
    };

    if (mode === "one") {
      await api.sendOne({ ...common, to: to.trim() });
      setQueued(`Queued one message to ${to.trim()}.`);
    } else {
      const count = memberCount.data?.length ?? 0;
      await api.sendList({ ...common, listId: Number(listId) });
      const name = lists.data?.find((l) => String(l.id) === listId)?.name ?? "the list";
      setQueued(`Queued ${count} ${count === 1 ? "message" : "messages"} to ${name}.`);
    }
    setSubject("");
    setBody("");
    setHtml("");
    setTo("");
  });

  const loading = senders.loading || domains.loading;
  const listEmpty = mode === "list" && memberCount.data !== null && memberCount.data?.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Compose"
        description="Sends are accepted into a queue and delivered by the SMTP worker afterwards. Nothing here reports delivery — the API records no send history."
      />

      {queued ? (
        <div className="reveal flex flex-wrap items-center gap-3 rounded-md bg-ok-soft px-3.5 py-3 text-13 text-ok">
          <Icon name="check" className="size-4" />
          <span className="min-w-0 flex-1">
            <strong className="font-semibold">{queued}</strong> Queued is not delivered — the worker
            retries up to five times, and there is no endpoint to look the result up.
          </span>
          <Button size="sm" variant="quiet" icon="x" onClick={() => setQueued(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {loading ? (
        <Panel>
          <Skeleton rows={3} />
        </Panel>
      ) : !usable.length ? (
        <Panel>
          <EmptyState title="Nothing can send yet">
            <p>
              A send needs a registered sender address whose domain has passed{" "}
              <strong className="text-ink">both</strong> ownership and DKIM verification — the
              backend refuses anything else.
            </p>
            <p className="mt-2">
              {blocked > 0 ? (
                <>
                  You have {blocked} sender {blocked === 1 ? "address" : "addresses"} whose domain
                  is not finished yet.{" "}
                  <Link to="/domains" className="font-medium text-accent">
                    Finish DNS setup
                  </Link>
                  .
                </>
              ) : (
                <>
                  <Link to="/domains" className="font-medium text-accent">
                    Verify a domain
                  </Link>
                  , then{" "}
                  <Link to="/senders" className="font-medium text-accent">
                    register a sender
                  </Link>
                  .
                </>
              )}
            </p>
          </EmptyState>
        </Panel>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send.run();
          }}
          className="flex flex-col gap-6"
          noValidate
        >
          <Panel title="Recipients">
            <div className="flex flex-col gap-4 p-4">
              <div
                role="tablist"
                aria-label="Send to"
                className="inline-flex w-fit rounded-md border border-line bg-sunken p-0.5"
              >
                {(
                  [
                    ["one", "One address"],
                    ["list", "A list"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => {
                      setMode(value);
                      if (value !== "list") setParams({}, { replace: true });
                    }}
                    className={`rounded px-3 py-1 text-13 font-medium transition-colors duration-150 ${
                      mode === value
                        ? "bg-raised text-ink"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Field label="From" className="flex-1">
                  {(p) => (
                    <Select
                      {...p}
                      value={senderId}
                      onChange={(e) => setSenderId(e.target.value)}
                      className="font-mono"
                      required
                    >
                      {usable.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.email}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                {mode === "one" ? (
                  <Field label="To" className="flex-1">
                    {(p) => (
                      <Input
                        {...p}
                        mono
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="person@example.com"
                        required
                      />
                    )}
                  </Field>
                ) : (
                  <Field
                    label="List"
                    className="flex-1"
                    error={listEmpty ? "This list has no addresses, so there is nothing to send." : null}
                    hint={
                      memberCount.data
                        ? `${memberCount.data.length} ${memberCount.data.length === 1 ? "address" : "addresses"} — one message is queued per address.`
                        : undefined
                    }
                  >
                    {(p) =>
                      lists.data?.length ? (
                        <Select
                          {...p}
                          value={listId}
                          onChange={(e) => setListId(e.target.value)}
                          required
                        >
                          {lists.data.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <p className="pt-2 text-13 text-ink-muted">
                          No lists yet —{" "}
                          <Link to="/lists" className="font-medium text-accent">
                            create one
                          </Link>
                          .
                        </p>
                      )
                    }
                  </Field>
                )}
              </div>

              {blocked > 0 ? (
                <p className="flex items-start gap-1.5 text-12 text-ink-muted">
                  <Icon name="info" className="mt-px size-3.5" />
                  {blocked} sender {blocked === 1 ? "address is" : "addresses are"} hidden here
                  because {blocked === 1 ? "its" : "their"} domain is not fully verified.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Message">
            <div className="flex flex-col gap-4 p-4">
              <Field label="Subject">
                {(p) => (
                  <Input
                    {...p}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                )}
              </Field>

              <Field label="Plain text body" hint="Always sent. Required, even alongside HTML.">
                {(p) => (
                  <Textarea
                    {...p}
                    rows={10}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                )}
              </Field>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-13 text-ink">
                <input
                  type="checkbox"
                  checked={withHtml}
                  onChange={(e) => setWithHtml(e.target.checked)}
                  className="size-4 cursor-pointer rounded border border-line-strong accent-accent"
                />
                Also send an HTML part
              </label>

              {withHtml ? (
                <Field label="HTML body" hint="Sent as an alternative part alongside the plain text.">
                  {(p) => (
                    <Textarea
                      {...p}
                      mono
                      rows={10}
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                      placeholder="<p>Hello</p>"
                    />
                  )}
                </Field>
              ) : null}
            </div>
          </Panel>

          {send.error ? <ErrorNote>{send.error}</ErrorNote> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              icon="send"
              pending={send.pending}
              disabled={listEmpty || (mode === "list" && !lists.data?.length)}
            >
              {mode === "one" ? "Queue message" : "Queue to list"}
            </Button>
            <span className="text-12 text-ink-muted">
              There is no draft, schedule, or undo — this queues immediately.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
