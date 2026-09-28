import index from "./index.html";

// The backend is a separate Express app with no CORS middleware, so the browser
// never talks to it directly: everything under /api is proxied from this origin.
// 3001 matches PORT in apps/backend_api/.env; override with BACKEND_URL.
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3001";

async function proxy(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const target = BACKEND + url.pathname.slice("/api".length) + url.search;

  const headers = new Headers();
  for (const name of ["content-type", "authorization", "accept"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  const body =
    req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();

  try {
    return await fetch(target, { method: req.method, headers, body });
  } catch {
    return Response.json(
      { status: "error", error: `Cannot reach the API at ${BACKEND}. Is the backend running?` },
      { status: 502 },
    );
  }
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 5180),

  routes: {
    "/api/*": proxy,

    // every other path is the SPA; react-router resolves it client-side
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`dashboard on ${server.url} → api ${BACKEND}`);
