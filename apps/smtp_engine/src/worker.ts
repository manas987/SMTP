import { Worker } from "bullmq";
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

    console.log("nigga");

    await smtpEngine({
      from,
      to,
      subject,
      body,
    });

    console.log("nigga");
  },

  {
    connection: redis,
  },
);

worker.on("ready", () => {
  console.log("WORKER READY");
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

worker.on("error", (error) => {
  console.error("WORKER ERROR:", error);
});
