import { Router } from "express";

import { authMiddleware } from "../../middleware/auth";
import { pool } from "../../../migrations/db";

import { createSenderSchema, deleteSenderSchema } from "./schema";

export const senderMailRoutes = Router();

senderMailRoutes.post("/create", authMiddleware, async (req, res) => {
  const checkInput = createSenderSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { email } = checkInput.data;

  const domain = email.split("@")[1];

  try {
    const result = await pool.query(
      `
        INSERT INTO senders(
          user_id,
          email,
          domain
        )
        SELECT
          $1,
          $2,
          id
        FROM sending_domains
        WHERE
          domain=$3 
        AND
          user_id=$1
        AND
          status='verified';
        `,
      [userId, email, domain],
    );

    if (!result.rowCount) {
      return res.status(400).json({
        status: "error",
        error: "email domain is not verified",
      });
    }

    return res.status(201).json({
      status: "success",
      sender: result.rows[0],
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        status: "error",
        error: "sender already exists",
      });
    }

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

senderMailRoutes.get("/read", authMiddleware, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          email,
          domain
        FROM senders
        WHERE user_id = $1
        ORDER BY id ASC
        `,
      [userId],
    );

    return res.status(200).json({
      status: "success",
      senders: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

senderMailRoutes.delete("/delete", authMiddleware, async (req, res) => {
  const checkInput = deleteSenderSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { senderId } = checkInput.data;

  try {
    const result = await pool.query(
      `
        DELETE FROM senders
        WHERE id = $1
          AND user_id = $2
        RETURNING id, email
        `,
      [senderId, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "sender not found",
      });
    }

    return res.status(200).json({
      status: "success",
      sender: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});
