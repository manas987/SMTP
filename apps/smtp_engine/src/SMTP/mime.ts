import { randomBytes } from "node:crypto";

export type EmailAttachment = {
  filename: string;
  contentType: string;
  content: Buffer | Uint8Array;
  inline?: boolean;
  contentId?: string;
};

export type MimeInput = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
};

function normalizeCrlf(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\r\n");
}

function assertSafeHeader(name: string, value: string): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(`Invalid ${name}: CR/LF is not allowed`);
  }
}

function encodeHeaderValue(value: string): string {
  assertSafeHeader("header", value);

  // ASCII headers can remain unchanged.
  if (!/[^\x20-\x7E]/.test(value)) {
    return value;
  }

  /*
   * Simple RFC 2047 encoded-word implementation.
   *
   * We keep each UTF-8 chunk small so the resulting encoded-word
   * stays well below normal header line limits.
   */
  const chunks: string[] = [];
  let current = "";

  for (const char of value) {
    const next = current + char;

    if (current.length > 0 && Buffer.byteLength(next, "utf8") > 30) {
      chunks.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks
    .map(
      (chunk) => `=?UTF-8?B?${Buffer.from(chunk, "utf8").toString("base64")}?=`,
    )
    .join(" ");
}

function base64Lines(buffer: Buffer | Uint8Array): string {
  const base64 = Buffer.from(buffer).toString("base64");

  const lines: string[] = [];

  for (let i = 0; i < base64.length; i += 76) {
    lines.push(base64.slice(i, i + 76));
  }

  return lines.join("\r\n");
}

function createBoundary(): string {
  return `=_mail_${randomBytes(18).toString("hex")}`;
}

function createMessageId(from: string): string {
  const atIndex = from.lastIndexOf("@");

  const domain =
    atIndex !== -1 && atIndex < from.length - 1
      ? from.slice(atIndex + 1)
      : "localhost";

  return `<${randomBytes(16).toString("hex")}@${domain}>`;
}

function createTextPart(
  content: string,
  contentType: "text/plain" | "text/html",
): string {
  const normalized = normalizeCrlf(content);

  const encoded = base64Lines(Buffer.from(normalized, "utf8"));

  return [
    `Content-Type: ${contentType}; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    "",
    encoded,
  ].join("\r\n");
}

function escapeQuoted(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function createAttachmentPart(attachment: EmailAttachment): string {
  assertSafeHeader("attachment filename", attachment.filename);
  assertSafeHeader("attachment content type", attachment.contentType);

  const encoded = base64Lines(Buffer.from(attachment.content));

  let disposition: string;

  if (/^[\x20-\x7E]+$/.test(attachment.filename)) {
    disposition = `${attachment.inline ? "inline" : "attachment"}; filename="${escapeQuoted(
      attachment.filename,
    )}"`;
  } else {
    const encodedFilename = encodeURIComponent(attachment.filename);

    disposition = `${attachment.inline ? "inline" : "attachment"}; filename*=UTF-8''${encodedFilename}`;
  }

  const headers = [
    `Content-Type: ${attachment.contentType}`,
    `Content-Disposition: ${disposition}`,
    `Content-Transfer-Encoding: base64`,
  ];

  if (attachment.contentId) {
    assertSafeHeader("Content-ID", attachment.contentId);

    const contentId = attachment.contentId.startsWith("<")
      ? attachment.contentId
      : `<${attachment.contentId}>`;

    headers.push(`Content-ID: ${contentId}`);
  }

  return [...headers, "", encoded].join("\r\n");
}

function createMultipart(boundary: string, parts: string[]): string {
  const output: string[] = [];

  for (const part of parts) {
    output.push(`--${boundary}`);
    output.push(part);
  }

  output.push(`--${boundary}--`);

  return `${output.join("\r\n")}\r\n`;
}

export function buildMimeMessage(input: MimeInput): string {
  assertSafeHeader("From", input.from);
  assertSafeHeader("To", input.to);
  assertSafeHeader("Subject", input.subject);

  const attachments = input.attachments ?? [];

  const textPart = createTextPart(input.text, "text/plain");

  let contentBody: string;
  let contentType: string;

  /*
   * No attachment
   *
   * text only
   * html only
   * text + html => multipart/alternative
   */
  if (attachments.length === 0) {
    if (input.html !== undefined) {
      const htmlPart = createTextPart(input.html, "text/html");

      const boundary = createBoundary();

      contentType = `multipart/alternative; boundary="${boundary}"`;

      contentBody = createMultipart(boundary, [textPart, htmlPart]);
    } else {
      contentType = `text/plain; charset=utf-8`;
      contentBody = textPart;
    }
  } else {
    /*
     * Attachments:
     *
     * multipart/mixed
     *
     * first part is either:
     *   text/plain
     *   text/html
     *   multipart/alternative
     */
    let mainPart: string;

    if (input.html !== undefined) {
      const htmlPart = createTextPart(input.html, "text/html");

      const alternativeBoundary = createBoundary();

      const alternativeBody = createMultipart(alternativeBoundary, [
        textPart,
        htmlPart,
      ]);

      mainPart = [
        `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
        "",
        alternativeBody,
      ].join("\r\n");
    } else {
      mainPart = textPart;
    }

    const attachmentParts = attachments.map((attachment) =>
      createAttachmentPart(attachment),
    );

    const mixedBoundary = createBoundary();

    contentType = `multipart/mixed; boundary="${mixedBoundary}"`;

    contentBody = createMultipart(mixedBoundary, [
      mainPart,
      ...attachmentParts,
    ]);
  }

  const messageId = createMessageId(input.from);

  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${contentType}`,
  ];

  return `${headers.join("\r\n")}\r\n\r\n${contentBody}`;
}
