import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        status: "error",
        error: "missing token",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!);

    res.locals.userId = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      error: "invalid or expired token",
    });
  }
}
