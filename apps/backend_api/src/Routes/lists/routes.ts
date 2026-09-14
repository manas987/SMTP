import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { pool } from "../../../migrations/db";
import {
  createListSchema,
  readListMembersSchema,
  updateListSchema,
  addListMemberSchema,
  deleteListMemberSchema,
  deleteListSchema,
} from "./schema";

export const listRoutes = Router();

listRoutes.post("/list/create", authMiddleware, async (req, res) => {
  const checkInput = createListSchema.safeParse(req.body);

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
      INSERT INTO lists (user_id, name)
      VALUES ($1, $2)
      RETURNING id, name
      `,
      [userId, name],
    );

    return res.status(201).json({
      status: "success",
      list: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

listRoutes.get("/list/read", authMiddleware, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const result = await pool.query(
      `
      SELECT id, name
      FROM lists
      WHERE user_id = $1
      ORDER BY id ASC
      `,
      [userId],
    );

    return res.status(200).json({
      status: "success",
      lists: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

listRoutes.get("/list/members/read", authMiddleware, async (req, res) => {
  const checkInput = readListMembersSchema.safeParse(req.query);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { listId } = checkInput.data;

  try {
    const result = await pool.query(
      `
        SELECT
          list_members.id,
          list_members.email
        FROM list_members
        JOIN lists
          ON lists.id = list_members.list_id
        WHERE list_members.list_id = $1
          AND lists.user_id = $2
        ORDER BY list_members.id ASC
        `,
      [listId, userId],
    );

    return res.status(200).json({
      status: "success",
      emails: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

listRoutes.patch("/list/update", authMiddleware, async (req, res) => {
  const checkInput = updateListSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { listId, name } = checkInput.data;

  try {
    const result = await pool.query(
      `
      UPDATE lists
      SET name = $1
      WHERE id = $2
        AND user_id = $3
      RETURNING id, name
      `,
      [name, listId, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "list not found",
      });
    }

    return res.status(200).json({
      status: "success",
      list: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

listRoutes.post("/list/member/add", authMiddleware, async (req, res) => {
  const checkInput = addListMemberSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { listId, email } = checkInput.data;

  try {
    const result = await pool.query(
      `
        INSERT INTO list_members (list_id, email)
        SELECT $1, $2
        WHERE EXISTS (
          SELECT 1
          FROM lists
          WHERE lists.id = $1
            AND lists.user_id = $3
        )
        RETURNING id, list_id, email
        `,
      [listId, email, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "list not found",
      });
    }

    return res.status(201).json({
      status: "success",
      member: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

listRoutes.delete("/list/member/delete", authMiddleware, async (req, res) => {
  const checkInput = deleteListMemberSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { listId, email } = checkInput.data;

  try {
    const result = await pool.query(
      `
        DELETE FROM list_members
        WHERE list_id = $1
          AND email = $2
          AND EXISTS (
            SELECT 1
            FROM lists
            WHERE lists.id = $1
              AND lists.user_id = $3
          )
        RETURNING id, list_id, email
        `,
      [listId, email, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "email not found in list",
      });
    }

    return res.status(200).json({
      status: "success",
      member: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

listRoutes.delete("/list/delete", authMiddleware, async (req, res) => {
  const checkInput = deleteListSchema.safeParse(req.body);

  if (!checkInput.success) {
    return res.status(400).json({
      status: "error",
      error: "invalid input",
    });
  }

  const userId = res.locals.userId;
  const { listId } = checkInput.data;

  try {
    const result = await pool.query(
      `
      DELETE FROM lists
      WHERE id = $1
        AND user_id = $2
      RETURNING id, name
      `,
      [listId, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "list not found",
      });
    }

    return res.status(200).json({
      status: "success",
      list: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});
