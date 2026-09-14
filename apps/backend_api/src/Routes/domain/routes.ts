import { Router } from "express";
import crypto from "crypto";
import { resolveTxt } from "dns/promises";

import { authMiddleware } from "../../middleware/auth";
import { pool } from "../../../migrations/db";

import {
  createDomainSchema,
  verifyDomainSchema,
  deleteDomainSchema,
} from "./schema";

export const domainRoutes = Router();

domainRoutes.post("/domain/create", authMiddleware, async (req, res) => {
  const checkInput = createDomainSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid domain",
    });
  }

  const userId = res.locals.userId;
  const { domain } = checkInput.data;

  const verificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const result = await pool.query(
      `
        INSERT INTO sending_domains (
          user_id,
          domain,
          status,
          verification_token
        )
        VALUES ($1, $2, 'pending', $3)
        RETURNING id, domain, status
        `,
      [userId, domain, verificationToken],
    );

    const record = {
      type: "TXT",
      name: `_verify.${domain}`,
      value: verificationToken,
    };

    return res.status(201).json({
      status: "success",
      domain: result.rows[0],
      dnsRecord: record,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        status: "error",
        error: "domain already exists",
      });
    }

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

domainRoutes.get("/domain/read", authMiddleware, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          domain,
          status,
          verified_at
        FROM sending_domains
        WHERE user_id = $1
        ORDER BY id ASC
        `,
      [userId],
    );

    return res.status(200).json({
      status: "success",
      domains: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

domainRoutes.post("/domain/verify", authMiddleware, async (req, res) => {
  const checkInput = verifyDomainSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { domainId } = checkInput.data;

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          domain,
          verification_token,
          status
        FROM sending_domains
        WHERE id = $1
          AND user_id = $2
        `,
      [domainId, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "domain not found",
      });
    }

    const domain = result.rows[0];

    if (domain.status === "verified") {
      return res.status(200).json({
        status: "success",
        message: "domain already verified",
      });
    }

    const verificationHost = `_verify.${domain.domain}`;

    let txtRecords: string[][];

    try {
      txtRecords = await resolveTxt(verificationHost);
    } catch (error) {
      return res.status(400).json({
        status: "error",
        error: "verification DNS record not found",
      });
    }

    const records = txtRecords.map((chunks) => chunks.join(""));

    const verified = records.includes(domain.verification_token);

    if (!verified) {
      return res.status(400).json({
        status: "error",
        error: "verification DNS record does not match",
      });
    }

    const updated = await pool.query(
      `
        UPDATE sending_domains
        SET
          status = 'verified',
          verified_at = NOW(),
          verification_token = NULL
        WHERE id = $1
          AND user_id = $2
        RETURNING id, domain, status, verified_at
        `,
      [domainId, userId],
    );

    return res.status(200).json({
      status: "success",
      domain: updated.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

domainRoutes.delete("/domain/delete", authMiddleware, async (req, res) => {
  const checkInput = deleteDomainSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { domainId } = checkInput.data;

  try {
    const domainResult = await pool.query(
      `
        SELECT domain
        FROM sending_domains
        WHERE id = $1
          AND user_id = $2
        `,
      [domainId, userId],
    );

    if (!domainResult.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "domain not found",
      });
    }

    const domain = domainResult.rows[0].domain;

    const senderResult = await pool.query(
      `
        SELECT id
        FROM senders
        WHERE user_id = $1
          AND split_part(email, '@', 2) = $2
        LIMIT 1
        `,
      [userId, domain],
    );

    if (senderResult.rowCount) {
      return res.status(409).json({
        status: "error",
        error: "remove senders using this domain first",
      });
    }

    const result = await pool.query(
      `
        DELETE FROM sending_domains
        WHERE id = $1
          AND user_id = $2
        RETURNING id, domain
        `,
      [domainId, userId],
    );

    return res.status(200).json({
      status: "success",
      domain: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});
