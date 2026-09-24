import { Router } from "express";

import { router as fileRouter } from './file.router.ts';

export const router = Router();

router.use(fileRouter);



