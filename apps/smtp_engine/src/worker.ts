import { UnrecoverableError, Worker } from "bullmq";
import Redis from "ioredis";
import { smtpEngine } from "./SMTP/smtp-engine";

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "email",

  async (job) => {
    const { from, to, subject, body } = job.data;

    await smtpEngine({
      from,
      to,
      subject,
      body,
    });
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
