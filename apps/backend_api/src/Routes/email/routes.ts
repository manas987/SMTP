import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { pool } from "../../../migrations/db";
import { sendListEmailSchema, sendSingleEmailSchema } from "./schema";
import { emailQueue } from "../../queue";

export const emailRoutes = Router();

emailRoutes.post("/send/list", authMiddleware, async (req, res) => {
  const checkInput = sendListEmailSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { listId, senderId, subject, body } = checkInput.data;

  try {
    const result = await pool.query(
      `
      SELECT
        senders.email AS sender_email,
        list_members.email AS recipient_email
      FROM lists
      JOIN senders
        ON senders.user_id = lists.user_id
      JOIN list_members
        ON list_members.list_id = lists.id
      WHERE lists.id = $1
        AND lists.user_id = $2
        AND senders.id = $3
      ORDER BY list_members.id ASC
      `,
      [listId, userId, senderId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "list or sender not found",
      });
    }

    const senderEmail = result.rows[0].sender_email;

    const recipients = result.rows.map((row) => row.recipient_email);

    for (const recipient of recipients) {
      await emailQueue.add("send-email", {
        from: senderEmail,
        to: recipient,
        subject,
        body,
      });
    }

    return res.status(202).json({
      status: "success",
      message: "emails queued",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

emailRoutes.post("/send/one", authMiddleware, async (req, res) => {
  const checkInput = sendSingleEmailSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { to, senderId, subject, body } = checkInput.data;

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email
      FROM senders
      WHERE id = $1
        AND user_id = $2
      `,
      [senderId, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "sender not found",
      });
    }

    const sender = result.rows[0];

    await emailQueue.add("send-email", {
      from: sender.email,
      to,
      subject,
      body,
    });

    return res.status(202).json({
      status: "success",
      message: "email queued",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

emailRoutes.post("/send/one/dev", async (req, res) => {
  const userId = res.locals.userId;
  const { to, from, subject, body } = req.body;

  try {
    console.log("nigga");

    const job = await emailQueue.add("send-email", {
      from,
      to,
      subject,
      body,
    });

    console.log("JOB ADDED:", job.id);

    console.log("nigga");

    return res.status(202).json({
      status: "success",
      message: "email queued",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});
