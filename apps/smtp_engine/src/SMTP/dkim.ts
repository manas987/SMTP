import { createHash, createSign } from "node:crypto";

type DkimConfig = {
  domain: string;
  selector: string;
  privateKey: string;
};

type ParsedHeader = {
  name: string;
  value: string;
};

function normalizeCrlf(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\r\n");
}

function parseMessage(message: string): {
  headers: ParsedHeader[];
  body: string;
} {
  const normalized = normalizeCrlf(message);

  const separator = normalized.indexOf("\r\n\r\n");

  if (separator === -1) {
    throw new Error("Invalid MIME message: missing header/body separator");
  }

  const headerBlock = normalized.slice(0, separator);
  const body = normalized.slice(separator + 4);

  const rawLines = headerBlock.split("\r\n");

  const headers: ParsedHeader[] = [];

  for (const line of rawLines) {
    if (/^[ \t]/.test(line)) {
      const previous = headers[headers.length - 1];

      if (!previous) {
        throw new Error("Invalid folded header");
      }

      previous.value += ` ${line.trim()}`;
      continue;
    }

    const colon = line.indexOf(":");

    if (colon === -1) {
      throw new Error(`Invalid header: ${line}`);
    }

    headers.push({
      name: line.slice(0, colon),
      value: line.slice(colon + 1).trim(),
    });
  }

  return {
    headers,
    body,
  };
}

function canonicalizeRelaxedBody(body: string): string {
  let normalized = normalizeCrlf(body);

  let lines = normalized.split("\r\n");

  lines = lines.map((line) => {
    line = line.replace(/[ \t]+/g, " ");
    line = line.replace(/[ \t]+$/g, "");

    return line;
  });

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return `${lines.join("\r\n")}\r\n`;
}

function canonicalizeRelaxedHeader(name: string, value: string): string {
  const normalizedName = name.trim().toLowerCase();

  const normalizedValue = value
    .replace(/\r\n[ \t]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

  return `${normalizedName}:${normalizedValue}\r\n`;
}

function findHeader(
  headers: ParsedHeader[],
  name: string,
): ParsedHeader | undefined {
  const wanted = name.toLowerCase();

  for (let i = headers.length - 1; i >= 0; i--) {
    if (headers[i]!.name.toLowerCase() === wanted) {
      return headers[i];
    }
  }

  return undefined;
}

function createDkimSignatureHeader(
  config: DkimConfig,
  signedHeaders: string,
  bodyHash: string,
  signature: string,
): string {
  return [
    "v=1",
    "a=rsa-sha256",
    "c=relaxed/relaxed",
    `d=${config.domain}`,
    `s=${config.selector}`,
    `h=${signedHeaders}`,
    `bh=${bodyHash}`,
    `b=${signature}`,
  ].join("; ");
}

export function signDkimMessage(message: string, config: DkimConfig): string {
  const { headers, body } = parseMessage(message);

  const headersToSign = [
    "From",
    "To",
    "Subject",
    "Date",
    "Message-ID",
    "MIME-Version",
    "Content-Type",
  ];

  const selectedHeaders: ParsedHeader[] = [];

  for (const name of headersToSign) {
    const header = findHeader(headers, name);

    if (header) {
      selectedHeaders.push(header);
    }
  }

  if (!findHeader(headers, "From")) {
    throw new Error("DKIM requires a From header");
  }

  const signedHeaderNames = selectedHeaders
    .map((header) => header.name.toLowerCase())
    .join(":");

  const canonicalBody = canonicalizeRelaxedBody(body);

  const bodyHash = createHash("sha256")
    .update(canonicalBody, "utf8")
    .digest("base64");

  /*
   * Build the DKIM-Signature with an empty b=.
   * That exact form is what gets signed.
   */
  const unsignedDkimValue = createDkimSignatureHeader(
    config,
    signedHeaderNames,
    bodyHash,
    "",
  );

  let signingInput = "";

  for (const header of selectedHeaders) {
    signingInput += canonicalizeRelaxedHeader(header.name, header.value);
  }

  signingInput += canonicalizeRelaxedHeader(
    "DKIM-Signature",
    unsignedDkimValue,
  );

  const signer = createSign("RSA-SHA256");

  signer.update(signingInput, "utf8");

  const signature = signer.sign(config.privateKey, "base64");

  const finalDkimValue = createDkimSignatureHeader(
    config,
    signedHeaderNames,
    bodyHash,
    signature,
  );

  return [`DKIM-Signature: ${finalDkimValue}`, message].join("\r\n");
}
