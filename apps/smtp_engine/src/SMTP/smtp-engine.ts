type engineType = { from: string; to: string; subject: string; body: string };

import { resolveMx } from "dns/promises";
import net from "net";

type EngineType = {
  from: string;
  to: string;
  subject: string;
  body: string;
};

function readResponse(
  socket: net.Socket,
): Promise<{ code: number; message: string }> {
  return new Promise((resolve, reject) => {
    let data = "";

    const onData = (chunk: Buffer) => {
      data += chunk.toString();

      const lines = data.split("\r\n");

      for (const line of lines) {
        if (/^\d{3} /.test(line)) {
          const code = Number(line.slice(0, 3));

          socket.off("data", onData);

          resolve({
            code,
            message: line,
          });

          return;
        }
      }
    };

    socket.on("data", onData);
    socket.once("error", reject);
  });
}

function sendCommand(
  socket: net.Socket,
  command: string,
): Promise<{ code: number; message: string }> {
  socket.write(`${command}\r\n`);
  return readResponse(socket);
}

export async function smtpEngine({ from, to, subject, body }: EngineType) {
  const domain = to.split("@")[1];

  if (!domain) {
    throw new Error("Invalid recipient email");
  }

  const mxRecords = await resolveMx(domain);

  if (mxRecords.length === 0) {
    throw new Error(`No MX records found for ${domain}`);
  }

  mxRecords.sort((a, b) => a.priority - b.priority);

  const mxHost = mxRecords[0]!.exchange;

  console.log(`Connecting to ${mxHost}:25`);

  const socket = net.createConnection({
    host: mxHost,
    port: 25,
  });

  await new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });

  // 220 greeting
  const greeting = await readResponse(socket);

  if (greeting.code !== 220) {
    socket.destroy();
    throw new Error(`SMTP greeting failed: ${greeting.message}`);
  }

  // EHLO
  const ehlo = await sendCommand(socket, "EHLO localhost");

  if (ehlo.code !== 250) {
    socket.destroy();
    throw new Error(`EHLO failed: ${ehlo.message}`);
  }

  // MAIL FROM
  const mailFrom = await sendCommand(socket, `MAIL FROM:<${from}>`);

  if (mailFrom.code !== 250) {
    socket.destroy();
    throw new Error(`MAIL FROM failed: ${mailFrom.message}`);
  }

  // RCPT TO
  const recipient = await sendCommand(socket, `RCPT TO:<${to}>`);

  if (recipient.code !== 250 && recipient.code !== 251) {
    socket.destroy();
    throw new Error(`RCPT TO failed: ${recipient.message}`);
  }

  // DATA
  const data = await sendCommand(socket, "DATA");

  if (data.code !== 354) {
    socket.destroy();
    throw new Error(`DATA failed: ${data.message}`);
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
    socket.destroy();
    throw new Error(`Message rejected: ${sent.message}`);
  }

  // QUIT
  await sendCommand(socket, "QUIT");

  socket.end();

  console.log(`Email sent to ${to}`);
}
