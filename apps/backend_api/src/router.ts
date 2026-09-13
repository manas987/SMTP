import { Router } from "express";
import { authRoutes } from "./Routes/auth/routes";
import { orgRoutes } from "./Routes/org/routes";

export const router = Router();

router.use("/auth", authRoutes);

router.use("/org", orgRoutes);

router.get("/list", () => {});

router.post("/email", () => {});

router.post("/emails", () => {});
