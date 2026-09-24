import { resolve4, resolve6, resolveMx } from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import { SMTPError } from "./error";

type EngineType = {
  from: string;
  to: string;
  subject: string;
  body: string;
};

type SMTPResponse = {
  code: number;
  lines: string[];
};

const SMTP_TIMEOUT = 30_000;

function classifyResponse(code: number): "success" | "temporary" | "permanent" {
  if (code >= 200 && code < 400) {
    return "success";
  }

  if (code >= 400 && code < 500) {
    return "temporary";
  }

  if (code >= 500 && code < 600) {
    return "permanent";
  }

  throw new Error(`Unknown SMTP response code: ${code}`);
}

function createSMTPError(code: number, message: string): SMTPError {
  const kind = classifyResponse(code);

  if (kind === "temporary") {
    return new SMTPError(message, "temporary");
  }

  if (kind === "permanent") {
    return new SMTPError(message, "permanent");
  }

  throw new Error(message);
}

function readResponse(
  socket: net.Socket | tls.TLSSocket,
): Promise<SMTPResponse> {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(new SMTPError(`SMTP socket error: ${error.message}`, "temporary"));
    };

    const onClose = () => {
      cleanup();

      reject(
        new SMTPError(
          "SMTP socket closed before response was received",
          "temporary",
        ),
      );
    };

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");

      const lines = buffer.split("\r\n");

      buffer = lines.pop() ?? "";

      const responseLines: string[] = [];

      for (const line of lines) {
        if (!line) {
          continue;
        }

        responseLines.push(line);

        if (!/^\d{3}[ -]/.test(line)) {
          continue;
        }

        const code = Number(line.slice(0, 3));

        if (line[3] === "-") {
          continue;
        }

        if (line[3] === " ") {
          cleanup();

          resolve({
            code,
            lines: responseLines,
          });

          return;
        }
      }
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
  });
}

async function sendCommand(
  socket: net.Socket | tls.TLSSocket,
  command: string,
): Promise<SMTPResponse> {
  console.log(`C: ${command}`);

  socket.write(`${command}\r\n`);

  const response = await readResponse(socket);

  console.log(`S: ${response.lines.join(" | ")}`);

  return response;
}

function hasCapability(response: SMTPResponse, capability: string): boolean {
  return response.lines.some((line) => {
    const text = line.slice(4).trim();

    return text.toUpperCase().startsWith(capability.toUpperCase());
  });
}

function setupTimeout(socket: net.Socket | tls.TLSSocket) {
  socket.setTimeout(SMTP_TIMEOUT);

  socket.once("timeout", () => {
    socket.destroy(new SMTPError("SMTP connection timed out", "temporary"));
  });
}

async function resolveAddresses(hostname: string): Promise<string[]> {
  const addresses: string[] = [];

  try {
    const ipv4 = await resolve4(hostname);

    addresses.push(...ipv4);
  } catch {}

  try {
    const ipv6 = await resolve6(hostname);

    addresses.push(...ipv6);
  } catch {}

  if (addresses.length === 0) {
    throw new SMTPError(
      `Could not resolve ${hostname} to an IP address`,
      "temporary",
    );
  }

  return addresses;
}

async function connectTCP(hostname: string, port: number): Promise<net.Socket> {
  const addresses = await resolveAddresses(hostname);

  let lastError: unknown;

  for (const address of addresses) {
    console.log(`Connecting to ${address}:${port}`);

    try {
      const socket = net.createConnection({
        host: address,
        port,
      });

      setupTimeout(socket);

      await new Promise<void>((resolve, reject) => {
        const onConnect = () => {
          resolve();
        };

        const onError = (error: Error) => {
          reject(error);
        };

        const cleanup = () => {
          socket.off("connect", onConnect);

          socket.off("error", onError);
        };

        socket.once("connect", onConnect);

        socket.once("error", onError);
      });

      return socket;
    } catch (error) {
      console.error(`Connection failed for ${address}:`, error);

      lastError = error;
    }
  }

  throw new SMTPError(
    `Could not connect to ${hostname}:${port}: ${String(lastError)}`,
    "temporary",
  );
}

async function upgradeToTLS(
  socket: net.Socket,
  hostname: string,
): Promise<tls.TLSSocket> {
  console.log("Starting TLS...");

  const tlsSocket = tls.connect({
    socket,
    servername: hostname,
  });

  setupTimeout(tlsSocket);

  await new Promise<void>((resolve, reject) => {
    const onSecureConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(
        new SMTPError(`TLS handshake failed: ${error.message}`, "temporary"),
      );
    };

    const cleanup = () => {
      tlsSocket.off("secureConnect", onSecureConnect);

      tlsSocket.off("error", onError);
    };

    tlsSocket.once("secureConnect", onSecureConnect);

    tlsSocket.once("error", onError);
  });

  console.log("TLS established");

  return tlsSocket;
}

async function deliverToMX(
  mxHost: string,
  from: string,
  to: string,
  subject: string,
  body: string,
) {
  let socket: net.Socket | tls.TLSSocket | undefined;

  try {
    socket = await connectTCP(mxHost, 25);

    const greeting = await readResponse(socket);

    if (greeting.code !== 220) {
      throw createSMTPError(
        greeting.code,
        `SMTP greeting failed: ${greeting.lines.join(" | ")}`,
      );
    }

    let ehlo = await sendCommand(socket, "EHLO localhost");

    if (ehlo.code !== 250) {
      throw createSMTPError(
        ehlo.code,
        `EHLO failed: ${ehlo.lines.join(" | ")}`,
      );
    }

    console.log("SMTP capabilities:", ehlo.lines);

    if (hasCapability(ehlo, "STARTTLS")) {
      const starttls = await sendCommand(socket, "STARTTLS");

      if (starttls.code !== 220) {
        throw createSMTPError(
          starttls.code,
          `STARTTLS failed: ${starttls.lines.join(" | ")}`,
        );
      }

      socket = await upgradeToTLS(socket, mxHost);

      ehlo = await sendCommand(socket, "EHLO localhost");

      if (ehlo.code !== 250) {
        throw createSMTPError(
          ehlo.code,
          `EHLO after TLS failed: ${ehlo.lines.join(" | ")}`,
        );
      }
    }

    const mailFrom = await sendCommand(socket, `MAIL FROM:<${from}>`);

    if (mailFrom.code < 200 || mailFrom.code >= 300) {
      throw createSMTPError(
        mailFrom.code,
        `MAIL FROM failed: ${mailFrom.lines.join(" | ")}`,
      );
    }

    const recipient = await sendCommand(socket, `RCPT TO:<${to}>`);

    if (recipient.code !== 250 && recipient.code !== 251) {
      throw createSMTPError(
        recipient.code,
        `RCPT TO failed: ${recipient.lines.join(" | ")}`,
      );
    }

    const dataResponse = await sendCommand(socket, "DATA");

    if (dataResponse.code !== 354) {
      throw createSMTPError(
        dataResponse.code,
        `DATA failed: ${dataResponse.lines.join(" | ")}`,
      );
    }

    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=utf-8`,
      "",
      body,
      "",
      ".",
      "",
    ].join("\r\n");

    socket.write(message);

    const sent = await readResponse(socket);

    if (sent.code !== 250) {
      throw createSMTPError(
        sent.code,
        `Message rejected: ${sent.lines.join(" | ")}`,
      );
    }

    const quit = await sendCommand(socket, "QUIT");

    if (quit.code >= 400) {
      throw createSMTPError(
        quit.code,
        `QUIT failed: ${quit.lines.join(" | ")}`,
      );
    }

    console.log(`Email sent to ${to}`);
  } finally {
    socket?.destroy();
  }
}

export async function smtpEngine({ from, to, subject, body }: EngineType) {
  const atIndex = to.lastIndexOf("@");

  if (atIndex === -1) {
    throw new Error("Invalid recipient email");
  }

  const domain = to.slice(atIndex + 1).toLowerCase();

  if (!domain) {
    throw new Error("Invalid recipient email");
  }

  let mxRecords;

  try {
    mxRecords = await resolveMx(domain);
  } catch (error) {
    throw new SMTPError(
      `MX lookup failed for ${domain}: ${String(error)}`,
      "temporary",
    );
  }

  console.log("MX RECORDS:", mxRecords);

  if (mxRecords.length === 0) {
    throw new SMTPError(`No MX records found for ${domain}`, "permanent");
  }

  if (mxRecords.some((record) => record.exchange === ".")) {
    throw new SMTPError(
      `${domain} does not accept email (Null MX)`,
      "permanent",
    );
  }

  mxRecords.sort((a, b) => a.priority - b.priority);

  let lastError: unknown;

  for (const mx of mxRecords) {
    console.log(`Trying MX ${mx.exchange} priority=${mx.priority}`);

    try {
      await deliverToMX(mx.exchange, from, to, subject, body);

      return;
    } catch (error) {
      lastError = error;

      console.error(`MX ${mx.exchange} failed:`, error);

      if (error instanceof SMTPError && error.kind === "permanent") {
        throw error;
      }
    }
  }

  throw new SMTPError(
    `All MX servers failed for ${domain}: ${String(lastError)}`,
    "temporary",
  );
}
