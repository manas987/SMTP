import { Router } from "express";
import { signup, signin } from "./schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../../../migrations/db";
import { authMiddleware } from "../../middleware/auth";

export const authRoutes = Router();

authRoutes.post("/signup", async (req, res) => {
  try {
    const checkInput = signup.safeParse(req.body);

    if (!checkInput.success) {
      return res.status(400).json({
        status: "error",
        error: "invalid input",
      });
    }

    const { username, password } = checkInput.data;

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE username = $1
      `,
      [username],
    );

    if (existingUser.rowCount) {
      return res.status(409).json({
        status: "error",
        error: "username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const apiKey = `re_${crypto.randomBytes(32).toString("hex")}`;

    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const result = await pool.query(
      `
      INSERT INTO users (
        username,
        password_hash,
        api_key_hash
      )
      VALUES ($1, $2, $3)
      RETURNING id, username
      `,
      [username, passwordHash, apiKeyHash],
    );

    const user = result.rows[0];

    return res.status(201).json({
      status: "success",
      user,
      apiKey,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

authRoutes.post("/signin", async (req, res) => {
  try {
    const checkInput = signin.safeParse(req.body);

    if (!checkInput.success) {
      return res.status(400).json({
        status: "error",
        error: "invalid input",
      });
    }

    const { username, password } = checkInput.data;

    const result = await pool.query(
      `
      SELECT id, username, password_hash
      FROM users
      WHERE username = $1
      `,
      [username],
    );

    if (!result.rowCount) {
      return res.status(401).json({
        status: "error",
        error: "invalid credentials",
      });
    }

    const user = result.rows[0];

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        status: "error",
        error: "invalid credentials",
      });
    }

    const token = jwt.sign(user.id, process.env.JWT_SECRET!);

    return res.status(200).json({
      status: "success",
      token,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});

authRoutes.post("/api-key", authMiddleware, async (req, res) => {
  try {
    const userId = res.locals.userId;

    const apiKey = `re_${crypto.randomBytes(32).toString("hex")}`;

    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const result = await pool.query(
      `
      UPDATE users
      SET api_key_hash = $1
      WHERE id = $2
      RETURNING id, username
      `,
      [apiKeyHash, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        status: "error",
        error: "user not found",
      });
    }

    return res.status(201).json({
      status: "success",
      apiKey,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: "internal server error",
    });
  }
});
