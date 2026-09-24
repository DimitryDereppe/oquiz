import { Router } from "express";
import { router as logRouter } from "./log.router.ts";

export const router = Router();

router.use(logRouter);

