import { Worker, UnrecoverableError } from "bullmq";
import Redis from "ioredis";
import { smtpEngine } from "./SMTP/smtp-engine";
import { SMTPError } from "./SMTP/error";
import { pool } from "./db";

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "email",
  async (job) => {
    const { from, to, subject, body, html, attachments } = job.data;

    const atIndex = from.lastIndexOf("@");

    if (atIndex === -1) {
      throw new UnrecoverableError("Invalid sender email");
    }

    const domainName = from.slice(atIndex + 1).toLowerCase();

    const result = await pool.query(
      `
      SELECT
        sd.domain,
        sd.dkim_selector,
        sd.dkim_private_key
      FROM senders s
      JOIN sending_domains sd
        ON sd.id = s.domain
      WHERE s.email = $1
        AND sd.status = 'verified'
      LIMIT 1
  `,
      [from],
    );

    if (!result.rowCount) {
      throw new UnrecoverableError(`Sending domain ${domainName} is not verified`);
    }

    const domain = result.rows[0];

    if (!domain.dkim_selector || !domain.dkim_private_key) {
      throw new UnrecoverableError(`DKIM is not configured for ${domainName}`);
    }

    try {
      await smtpEngine({
        from,
        to,
        subject,
        body,
        html,
        attachments,

        dkim: {
          domain: domain.domain,
          selector: domain.dkim_selector,
          privateKey: domain.dkim_private_key,
        },
      });
    } catch (error) {
      if (error instanceof SMTPError && error.kind === "temporary") {
        throw error;
      }

      throw new UnrecoverableError(
        error instanceof Error ? error.message : String(error),
      );
    }
  },
  {
    connection: redis,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});
