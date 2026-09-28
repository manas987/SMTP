import { useState } from "react";
import { api, readToken } from "../lib/api";
import { useAction } from "../lib/store";
import {
  Button,
  ConfirmInline,
  CopyValue,
  ErrorNote,
  Icon,
  PageHead,
  Panel,
} from "../ui";

function curlExample(token: string) {
  return `curl "$API_BASE/email/send/one" \\
  -H "Authorization: ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "senderId": 1,
    "to": "person@example.com",
    "subject": "Hello",
    "body": "Sent from my own SMTP engine."
  }'`;
}

export function ApiKeyPage() {
  const [fresh, setFresh] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const token = readToken() ?? "";

  const rotate = useAction(async () => {
    const result = await api.rotateApiKey();
    setFresh(result.apiKey);
    setConfirming(false);
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="API key"
        description="Issued at signup and replaceable here. Only a hash is stored, so a key is visible exactly once — at the moment it is created."
      />

      {fresh ? (
        <Panel
          title="Your new API key"
          description="This is the only time it will be shown."
          className="reveal"
        >
          <div className="flex flex-col gap-4 p-4">
            <CopyValue value={fresh} label="API key" wrap />
            <p className="flex items-start gap-2 rounded-md bg-warn-soft px-3 py-2.5 text-12 leading-relaxed text-warn">
              <Icon name="alert" className="mt-px size-4" />
              The previous key stopped working the moment this one was created. Update anything that
              was using it.
            </p>
            <Button variant="quiet" onClick={() => setFresh(null)} className="w-fit">
              Done — hide it
            </Button>
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Rotate the key"
        description="Replaces the existing key immediately. There is no way to see the current one."
      >
        <div className="flex flex-col gap-3 p-4">
          {rotate.error ? <ErrorNote>{rotate.error}</ErrorNote> : null}
          {confirming ? (
            <ConfirmInline
              question="Rotate now? Anything using the old key stops working at once."
              confirmLabel="Rotate key"
              pending={rotate.pending}
              onCancel={() => setConfirming(false)}
              onConfirm={() => rotate.run()}
            />
          ) : (
            <Button variant="primary" icon="refresh" className="w-fit" onClick={() => setConfirming(true)}>
              Rotate API key
            </Button>
          )}
        </div>
      </Panel>

      <Panel
        title="How requests authenticate today"
        description="Worth reading before you wire anything up."
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="flex max-w-[70ch] items-start gap-2 rounded-md bg-warn-soft px-3 py-2.5 text-13 leading-relaxed text-warn">
            <Icon name="alert" className="mt-0.5 size-4" />
            <span>
              No endpoint accepts the API key yet. The server stores its hash but every protected
              route authenticates with the signin token instead, passed raw in{" "}
              <code className="font-mono text-12">Authorization</code> — no{" "}
              <code className="font-mono text-12">Bearer</code> prefix.
            </span>
          </p>

          <div className="flex flex-col gap-2">
            <h3 className="text-13 font-medium text-ink">Your current session token</h3>
            <CopyValue value={token} label="Token" wrap />
            <p className="max-w-[70ch] text-12 text-ink-muted">
              It carries no expiry, so it keeps working until the signing secret changes. Treat it
              like a password: anything holding it can send as you.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-13 font-medium text-ink">Sending one message</h3>
            <pre className="overflow-x-auto rounded border border-line bg-sunken px-3 py-2.5 font-mono text-12 leading-relaxed text-ink">
              {curlExample(token || "<your token>")}
            </pre>
            <p className="max-w-[70ch] text-12 text-ink-muted">
              <code className="font-mono">API_BASE</code> is wherever the Express API is listening
              — <code className="font-mono">http://localhost:3001</code> in this checkout, not this
              dashboard's origin. <code className="font-mono">senderId</code> is the id of a
              registered sender whose domain has passed ownership and DKIM verification. A success
              is <code className="font-mono">202</code>, which means queued, not delivered.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
