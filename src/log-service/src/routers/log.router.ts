import { Router } from "express";
import * as logController from '../controllers/log.controller.ts'

export const router = Router(); 

// POST /api/logs --> enregistrer un nouveau log
router.post("/logs", logController.createLog);

// POST /api/logs/batch
router.post("/logs/batch", logController.createLogs);

// GET /api/logs --> récupérer tous les logs
router.get("/logs", logController.getLogs);

// L'ordre des routes a son importance
// Exemple : GET /api/logs/io658g --> ne match pas "/logs/stats", donc termine dans "/logs/:id"

// GET /api/logs/stats --> récupérer les stats des logs
router.get("/logs/stats", logController.getStats);

// GET /api/logs/:id --> récupérer un log en particulier selon son id
router.get("/logs/:id", logController.getLogById);
