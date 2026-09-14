import { Router } from "express";
import { authRoutes } from "./Routes/auth/routes";
import { listRoutes } from "./Routes/lists/routes";
import { emailRoutes } from "./Routes/email/routes";
import { senderMailRoutes } from "./Routes/sender/routes";
import { domainRoutes } from "./Routes/domain/routes";

export const router = Router();

router.use("/auth", authRoutes);

router.use("/list", listRoutes);

router.use("/email", emailRoutes);

router.use("/sender", senderMailRoutes);

router.use("domain", domainRoutes);
