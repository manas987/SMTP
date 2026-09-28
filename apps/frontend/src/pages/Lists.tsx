import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api, type MailList } from "../lib/api";
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
  Skeleton,
} from "../ui";

/** There is no count endpoint, so a count means one members read per list.
 *  ponytail: N+1 reads, fine at a handful of lists; add a count column to
 *  /list/list/read if anyone keeps dozens. */
async function listsWithCounts(): Promise<(MailList & { count: number | null })[]> {
  const lists = await api.lists();
  return Promise.all(
    lists.map(async (list) => {
      try {
        const members = await api.members(list.id);
        return { ...list, count: members.length };
      } catch {
        return { ...list, count: null };
      }
    }),
  );
}

export function Lists() {
  const lists = useResource(listsWithCounts);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Lists"
        description="Named groups of recipient addresses. A list send queues one message per member."
        action={
          <Button variant="primary" icon="plus" onClick={() => setAdding((v) => !v)}>
            New list
          </Button>
        }
      />

      {adding ? (
        <NewList
          onDone={() => {
            setAdding(false);
            lists.reload();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : null}

      {lists.error ? <ErrorNote onRetry={lists.reload}>{lists.error}</ErrorNote> : null}

      <Panel>
        {lists.loading ? (
          <Skeleton rows={2} />
        ) : !lists.data?.length ? (
          <EmptyState
            title="No lists yet"
            action={
              <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>
                Create your first list
              </Button>
            }
          >
            <p>
              A list holds plain email addresses — no names, no subscription state, no unsubscribe
              handling. Add one, put addresses in it, then pick it on the compose screen.
            </p>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {lists.data.map((list, i) => (
              <li key={list.id} className="rise" style={{ animationDelay: `${i * 35}ms` }}>
                <Link
                  to={`/lists/${list.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 no-underline transition-colors duration-150 hover:bg-sunken"
                >
                  <span className="min-w-0 truncate text-15 font-medium text-ink">{list.name}</span>
                  <span className="ml-auto text-13 whitespace-nowrap text-ink-muted">
                    {list.count === null
                      ? "count unavailable"
                      : `${list.count} ${list.count === 1 ? "address" : "addresses"}`}
                  </span>
                  <Icon name="chevron" className="size-4 text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function NewList({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const { run, pending, error } = useAction(async () => {
    await api.addList(name.trim());
    onDone();
  });

  return (
    <Panel title="New list">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-col gap-4 p-4"
        noValidate
      >
        <Field label="Name" error={error} hint="Only you see this — name it for how you'll use it.">
          {(p) => (
            <Input
              {...p}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beta testers"
              autoFocus
              required
            />
          )}
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" pending={pending}>
            Create list
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

export function ListDetail() {
  const { id } = useParams();
  const listId = Number(id);
  const navigate = useNavigate();
  const notice = useNotice();

  const lists = useResource(api.lists, [listId]);
  const members = useResource(() => api.members(listId), [listId]);
  const list = lists.data?.find((l) => l.id === listId) ?? null;

  const [email, setEmail] = useState("");
  const [filter, setFilter] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirming, setConfirming] = useState(false);

  const add = useAction(async () => {
    await api.addMember(listId, email.trim());
    setEmail("");
    members.reload();
  });

  const drop = useAction(async (address: string) => {
    await api.removeMember(listId, address);
    notice(`${address} removed`);
    members.reload();
  });

  const rename = useAction(async () => {
    await api.renameList(listId, newName.trim());
    setRenaming(false);
    notice("List renamed");
    lists.reload();
  });

  const remove = useAction(async () => {
    await api.deleteList(listId);
    notice("List deleted");
    navigate("/lists", { replace: true });
  });

  const shown = useMemo(() => {
    const all = members.data ?? [];
    const needle = filter.trim().toLowerCase();
    return needle ? all.filter((m) => m.email.toLowerCase().includes(needle)) : all;
  }, [members.data, filter]);

  if (lists.loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 animate-pulse rounded bg-sunken" />
        <Panel>
          <Skeleton rows={4} />
        </Panel>
      </div>
    );
  }

  if (lists.error) return <ErrorNote onRetry={lists.reload}>{lists.error}</ErrorNote>;

  if (!list) {
    return (
      <div className="flex flex-col gap-4">
        <PageHead title="List not found" description="It may have been deleted." />
        <Link to="/lists" className="text-13 font-medium text-accent underline">
          Back to lists
        </Link>
      </div>
    );
  }

  const count = members.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          to="/lists"
          className="inline-flex w-fit items-center gap-1 text-13 font-medium text-ink-muted no-underline hover:text-ink"
        >
          <Icon name="chevron" className="size-3.5 rotate-180" />
          Lists
        </Link>

        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              rename.run();
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <Field label="List name" className="min-w-[16rem] flex-1" error={rename.error}>
              {(p) => (
                <Input
                  {...p}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              )}
            </Field>
            <Button type="submit" variant="primary" pending={rename.pending}>
              Save
            </Button>
            <Button type="button" variant="quiet" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <PageHead
            title={list.name}
            description={
              members.loading
                ? "Loading addresses…"
                : members.error
                  ? "A send to this list queues one message per address. How many that is cannot be read right now."
                  : `${count} ${count === 1 ? "address" : "addresses"}. A send to this list queues one message per address.`
            }
            action={
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setNewName(list.name);
                    setRenaming(true);
                  }}
                >
                  Rename
                </Button>
                <Button variant="primary" icon="send" onClick={() => navigate(`/compose?list=${list.id}`)}>
                  Send to list
                </Button>
              </div>
            }
          />
        )}
      </div>

      <Panel title="Add an address">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add.run();
          }}
          className="flex flex-wrap items-end gap-2 p-4"
          noValidate
        >
          <Field label="Email address" className="min-w-[18rem] flex-1" error={add.error}>
            {(p) => (
              <Input
                {...p}
                mono
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@example.com"
                required
              />
            )}
          </Field>
          <Button type="submit" variant="primary" icon="plus" pending={add.pending}>
            Add
          </Button>
        </form>
      </Panel>

      <Panel
        title="Addresses"
        description={
          members.error ? undefined : count > 8 ? undefined : "Every address currently in this list."
        }
        action={
          count > 8 ? (
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter addresses"
              aria-label="Filter addresses"
              className="w-56"
            />
          ) : null
        }
      >
        {members.loading ? (
          <Skeleton rows={3} />
        ) : members.error ? (
          <div className="flex flex-col gap-3 p-4">
            <ErrorNote onRetry={members.reload}>{members.error}</ErrorNote>
            <p className="max-w-[70ch] text-13 leading-relaxed text-ink">
              Adding and removing addresses still works, and so does sending to this list — the
              server reads the members itself. Only reading them back here is blocked, which is why
              the count above is unknown.
            </p>
          </div>
        ) : !count ? (
          <EmptyState title="No addresses yet">
            <p>
              Add addresses one at a time above. There is no bulk or CSV import in the API yet, so a
              large list has to be filled by whatever script you already have.
            </p>
          </EmptyState>
        ) : !shown.length ? (
          <EmptyState title="Nothing matches that filter">
            <p>
              No address in this list contains <strong className="text-ink">{filter}</strong>.
            </p>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((m) => (
              <li key={m.id} className="flex items-center gap-4 px-4 py-2.5">
                <span className="min-w-0 truncate font-mono text-13 text-ink">{m.email}</span>
                <Button
                  size="sm"
                  variant="quiet"
                  icon="x"
                  className="ml-auto"
                  aria-label={`Remove ${m.email}`}
                  onClick={() => drop.run(m.email)}
                  disabled={drop.pending}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {drop.error ? <ErrorNote>{drop.error}</ErrorNote> : null}

      <Panel title="Delete list" description="The addresses in it are deleted too.">
        <div className="p-4">
          {remove.error ? <ErrorNote>{remove.error}</ErrorNote> : null}
          {confirming ? (
            <ConfirmInline
              question={
                members.error
                  ? `Delete "${list.name}" and every address in it?`
                  : `Delete "${list.name}" and its ${count} ${count === 1 ? "address" : "addresses"}?`
              }
              confirmLabel="Delete list"
              pending={remove.pending}
              onCancel={() => setConfirming(false)}
              onConfirm={() => remove.run()}
            />
          ) : (
            <Button variant="danger" icon="trash" onClick={() => setConfirming(true)}>
              Delete list
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}
