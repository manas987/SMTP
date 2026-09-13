import { Router } from "express";
import { signup, signin } from "./schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../../migrations/db";

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

    // Check whether username already exists
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username
      `,
      [username, passwordHash],
    );

    const user = result.rows[0];

    return res.status(201).json({
      status: "success",
      user,
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

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!passwordValid) {
      return res.status(401).json({
        status: "error",
        error: "invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );

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

authRoutes.post("/apiKey", (req, res) => {});
