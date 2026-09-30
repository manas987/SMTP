import { Resolver } from "node:dns/promises";

const resolver = new Resolver();

resolver.setServers(["8.8.8.8", "1.1.1.1"]);

export async function getTxtRecords(hostname: string): Promise<string[]> {
  const records = await resolver.resolveTxt(hostname);

  console.log("HOST:", hostname);
  console.dir(records, { depth: null });

  const joined = records.map((chunks) => chunks.join(""));

  console.log("JOINED:", joined);

  return joined;
}

export async function verifySpf(domain: string) {
  let records: string[];

  try {
    records = await getTxtRecords(domain);
  } catch (error) {
    return {
      status: "missing" as const,
      record: null,
      reason: `DNS lookup failed: ${String(error)}`,
    };
  }

  const spfRecords = records.filter((record) =>
    /^v=spf1(?:\s|$)/i.test(record.trim()),
  );

  if (spfRecords.length === 0) {
    return {
      status: "missing" as const,
      record: null,
      reason: "No SPF record found",
    };
  }

  if (spfRecords.length > 1) {
    return {
      status: "invalid" as const,
      record: null,
      reason: "Multiple SPF records found",
    };
  }

  return {
    status: "verified" as const,
    record: spfRecords[0],
    reason: "SPF record found",
  };
}

function parseTags(record: string): Record<string, string> {
  const tags: Record<string, string> = {};

  for (const part of record.split(";")) {
    const item = part.trim();

    if (!item) {
      continue;
    }

    const index = item.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = item.slice(0, index).trim().toLowerCase();
    const value = item.slice(index + 1).trim();

    tags[key] = value;
  }

  return tags;
}

export async function verifyDkim(
  domain: string,
  selector: string,
  expectedPublicKey: string,
) {
  const hostname = `${selector}._domainkey.${domain}`;

  let rawRecords: string[][];

  try {
    rawRecords = await resolver.resolveTxt(hostname);
  } catch (error) {
    return {
      status: "missing" as const,
      record: null,
      reason: `DNS lookup failed: ${String(error)}`,
    };
  }

  const dkimRecords: string[] = [];

  let currentDkimRecord: string | null = null;

  for (const chunks of rawRecords) {
    const text = chunks.join("").trim();

    if (/^v=DKIM1(?:\s*;|\s|$)/i.test(text)) {
      if (currentDkimRecord !== null) {
        dkimRecords.push(currentDkimRecord);
      }

      currentDkimRecord = text;
      continue;
    }

    if (currentDkimRecord !== null) {
      currentDkimRecord += text;
    }
  }

  if (currentDkimRecord !== null) {
    dkimRecords.push(currentDkimRecord);
  }

  if (dkimRecords.length === 0) {
    return {
      status: "missing" as const,
      record: null,
      reason: "No DKIM record found",
    };
  }

  if (dkimRecords.length > 1) {
    return {
      status: "invalid" as const,
      record: null,
      reason: "Multiple DKIM records found",
    };
  }

  const record = dkimRecords[0];

  const tags = parseTags(record!);

  if (!tags.p) {
    return {
      status: "invalid" as const,
      record,
      reason: "DKIM record has no public key",
    };
  }

  const dnsKey = tags.p.replace(/\s+/g, "");
  const expectedKey = expectedPublicKey.replace(/\s+/g, "");

  if (dnsKey !== expectedKey) {
    return {
      status: "invalid" as const,
      record,
      reason: "Public key does not match",
    };
  }

  return {
    status: "verified" as const,
    record,
    reason: "DKIM public key matches",
  };
}

export async function verifyDmarc(domain: string) {
  const hostname = `_dmarc.${domain}`;

  let records: string[];

  try {
    records = await getTxtRecords(hostname);
  } catch (error) {
    return {
      status: "missing" as const,
      record: null,
      reason: `DNS lookup failed: ${String(error)}`,
    };
  }

  const dmarcRecords = records.filter((record) =>
    /^v=DMARC1(?:\s*;|\s|$)/i.test(record.trim()),
  );

  if (dmarcRecords.length === 0) {
    return {
      status: "missing" as const,
      record: null,
      reason: "No DMARC record found",
    };
  }

  if (dmarcRecords.length > 1) {
    return {
      status: "invalid" as const,
      record: null,
      reason: "Multiple DMARC records found",
    };
  }

  const record = dmarcRecords[0];
  const tags = parseTags(record!);

  if (!tags.p) {
    return {
      status: "invalid" as const,
      record,
      reason: "DMARC record has no policy",
    };
  }

  const policy = tags.p.toLowerCase();

  if (policy !== "none" && policy !== "quarantine" && policy !== "reject") {
    return {
      status: "invalid" as const,
      record,
      reason: `Invalid DMARC policy: ${policy}`,
    };
  }

  return {
    status: "verified" as const,
    record,
    reason: "Valid DMARC record found",
  };
}
