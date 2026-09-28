import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { api } from "../lib/api";
import { useAction, useSession } from "../lib/store";
import { Wordmark } from "../Shell";
import { Button, CopyValue, ErrorNote, Field, Icon, Input } from "../ui";

function AuthFrame({ title, lead, children }: { title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ground px-5 py-12">
      <div className="w-full max-w-[26rem]">
        <Wordmark className="mb-8" />
        <h1 className="text-24 leading-tight font-semibold tracking-[-0.015em] text-ink text-balance">
          {title}
        </h1>
        <p className="mt-2 text-13 leading-relaxed text-ink-muted">{lead}</p>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

export function SignIn() {
  const { token, signIn } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { run, pending, error } = useAction(signIn);

  if (token) return <Navigate to="/" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(username.trim(), password);
  };

  return (
    <AuthFrame
      title="Sign in"
      lead="Your account is identified by a username, not an email address — there is no password reset, so keep it somewhere safe."
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error ? <ErrorNote>{error}</ErrorNote> : null}

        <Field label="Username">
          {(p) => (
            <Input
              {...p}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          )}
        </Field>

        <Field label="Password">
          {(p) => (
            <Input
              {...p}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={8}
              required
            />
          )}
        </Field>

        <Button type="submit" variant="primary" pending={pending} className="mt-1 h-9">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-13 text-ink-muted">
        No account yet?{" "}
        <Link to="/signup" className="font-medium text-accent underline">
          Create one
        </Link>
      </p>
    </AuthFrame>
  );
}

export function SignUp() {
  const { token, signIn } = useSession();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  const { run, pending, error } = useAction(async () => {
    const result = await api.signup(username.trim(), password);
    setApiKey(result.apiKey);
  });

  if (token && !apiKey) return <Navigate to="/" replace />;

  // The signup route issues an API key but no session token, so the credentials
  // just typed are reused to sign in once the key has been acknowledged.
  const enter = async () => {
    setEntering(true);
    try {
      await signIn(username.trim(), password);
      navigate("/", { replace: true });
    } finally {
      setEntering(false);
    }
  };

  if (apiKey) {
    return (
      <AuthFrame
        title="Save your API key now"
        lead="This is the only time it is shown. The server stores a hash of it, so it cannot be displayed again — losing it means rotating to a new one, which invalidates this one."
      >
        <div className="flex flex-col gap-5">
          <CopyValue value={apiKey} label="API key" wrap />
          <p className="flex items-start gap-2 rounded-md bg-warn-soft px-3 py-2.5 text-12 leading-relaxed text-warn">
            <Icon name="alert" className="mt-px size-4" />
            Put it in your password manager or your app's environment before you continue.
          </p>
          <Button variant="primary" onClick={enter} pending={entering}>
            I've saved it — open the dashboard
          </Button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Create an account"
      lead="You'll get an API key immediately, then verify a domain you own before anything can be sent."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        {error ? <ErrorNote>{error}</ErrorNote> : null}

        <Field label="Username">
          {(p) => (
            <Input
              {...p}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          )}
        </Field>

        <Field label="Password" hint="At least 8 characters.">
          {(p) => (
            <Input
              {...p}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          )}
        </Field>

        <Button type="submit" variant="primary" pending={pending} className="mt-1">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-13 text-ink-muted">
        Already have one?{" "}
        <Link to="/signin" className="font-medium text-accent underline">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
