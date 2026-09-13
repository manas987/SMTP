import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { createOrgSchema, deleteOrgSchema, updateOrgSchema } from "./schema";
import { pool } from "../../../migrations/db";

export const orgRoutes = Router();

orgRoutes.post("/org/create", authMiddleware, async (req, res) => {
  const checkInput = createOrgSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { name } = checkInput.data;

  try {
    const result = await pool.query(
      `
      INSERT INTO orgs (name, user_id)
      VALUES ($1, $2)
      RETURNING id, name
      `,
      [name, userId],
    );

    return res.status(201).json({
      status: "success",
      org: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

orgRoutes.get("/org/read", authMiddleware, async (req, res) => {
  try {
    const userId = res.locals.userId;

    const result = await pool.query(
      `
      SELECT id, name
      FROM orgs
      WHERE user_id = $1
      ORDER BY id ASC
      `,
      [userId],
    );

    return res.status(200).json({
      status: "success",
      orgs: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

orgRoutes.patch("/org/update", authMiddleware, async (req, res) => {
  const checkInput = updateOrgSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { orgId, name } = checkInput.data;

  try {
    const result = await pool.query(
      `
      UPDATE orgs
      SET name = $1
      WHERE id = $2
        AND user_id = $3
      RETURNING id, name
      `,
      [name, orgId, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "organization not found",
      });
    }

    return res.status(200).json({
      status: "success",
      org: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

orgRoutes.delete("/org/delete", authMiddleware, async (req, res) => {
  const checkInput = deleteOrgSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { orgId } = checkInput.data;

  try {
    const result = await pool.query(
      `
      DELETE FROM orgs
      WHERE id = $1
        AND user_id = $2
      RETURNING id, name
      `,
      [orgId, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "organization not found",
      });
    }

    return res.status(200).json({
      status: "success",
      org: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});
