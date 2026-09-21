import { Queue } from "bullmq";
import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

export const emailQueue = new Queue("email", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,

    backoff: {
      type: "exponential",
      delay: 5000,
    },

    removeOnComplete: {
      count: 1000,
    },

    removeOnFail: {
      count: 5000,
    },
  },
});
