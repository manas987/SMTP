import { Router } from "express";
import crypto from "crypto";
import { resolveTxt } from "dns/promises";
import { generateDkimKeys } from "./dkim-keys";
import { authMiddleware } from "../../middleware/auth";
import { pool } from "../../../migrations/db";

import {
  createDomainSchema,
  verifyDomainSchema,
  deleteDomainSchema,
} from "./schema";
import { verifyDkim, verifyDmarc, verifySpf } from "./auth-dns";

export const domainRoutes = Router();

domainRoutes.post("/create", authMiddleware, async (req, res) => {
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

domainRoutes.get("/read", authMiddleware, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          domain,
          status,
          verified_at,
          dkim_selector,
          spf_status,
          dkim_status,
          dmarc_status,
          auth_checked_at
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

domainRoutes.post("/verify", authMiddleware, async (req, res) => {
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

    const dkim = generateDkimKeys();

    const updated = await pool.query(
      `
    UPDATE sending_domains
    SET
      status = 'verified',
      verified_at = NOW(),
      verification_token = NULL,
      dkim_selector = $1,
      dkim_private_key = $2,
      dkim_public_key = $3
    WHERE id = $4
      AND user_id = $5
    RETURNING
      id,
      domain,
      status,
      verified_at,
      dkim_selector
  `,
      [dkim.selector, dkim.privateKey, dkim.publicKey, domainId, userId],
    );

    return res.status(200).json({
      status: "success",
      domain: updated.rows[0],

      dkim: {
        status: "pending",
        name: `${dkim.selector}._domainkey.${domain.domain}`,
        type: "TXT",
        value: dkim.dnsValue,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

domainRoutes.post("/verify-auth", authMiddleware, async (req, res) => {
  try {
    const userId = res.locals.userId;

    const body = req.body as {
      id: number;
    };

    const result = await pool.query(
      `
      SELECT
        id,
        domain,
        status,
        dkim_selector,
        dkim_public_key
      FROM sending_domains
      WHERE id = $1
        AND user_id = $2
      `,
      [body.id, userId],
    );

    if (!result.rowCount) {
      return res.status(404).send({
        error: "Domain not found",
      });
    }

    const domain = result.rows[0];

    if (domain.status !== "verified") {
      return res.status(400).send({
        error: "Verify domain ownership first",
      });
    }

    if (!domain.dkim_selector || !domain.dkim_public_key) {
      return res.status(400).send({
        error: "DKIM has not been generated go to /domain/verify",
      });
    }

    const spf = await verifySpf(domain.domain);

    const dkim = await verifyDkim(
      domain.domain,
      domain.dkim_selector,
      domain.dkim_public_key,
    );

    const dmarc = await verifyDmarc(domain.domain);

    await pool.query(
      `
      UPDATE sending_domains
      SET
        spf_status = $1,
        spf_record = $2,
        dkim_status = $3,
        dmarc_status = $4,
        dmarc_record = $5,
        auth_checked_at = NOW()
      WHERE id = $6
        AND user_id = $7
      `,
      [
        spf.status,
        spf.record,
        dkim.status,
        dmarc.status,
        dmarc.record,
        domain.id,
        userId,
      ],
    );

    return res.send({
      domain: domain.domain,

      ownership: domain.status,

      spf,

      dkim: {
        ...dkim,
        hostname: `${domain.dkim_selector}._domainkey.${domain.domain}`,
      },

      dmarc,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

domainRoutes.delete("/delete", authMiddleware, async (req, res) => {
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
