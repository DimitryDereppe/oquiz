import { Router } from "express";

import * as fileController from "../controllers/file.controller.ts";

export const router = Router();

router.post('/files', fileController.upload)
router.get('/files/:id', fileController.getFile)