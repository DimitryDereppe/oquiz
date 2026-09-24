import { Router } from "express";
import * as authController from "../controllers/auth.controller.ts";
import { isConnected } from "../middlewares/access-control.middleware.ts";

export const router = Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/logout", isConnected, authController.logout);

router.get("/auth/me", isConnected, authController.getMe);
