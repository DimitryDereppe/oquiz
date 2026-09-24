import { Router } from "express";
// FIXME
// import { checkRoles } from "../middlewares/access-control.middleware.ts";
import { createProxyMiddleware } from "http-proxy-middleware";

import { config } from "../../config.ts";

export const router = Router();

const fileServiceProxyMiddleware = createProxyMiddleware({
  target: `http://${config.fileServiceHost}:${config.fileServicePort}/api/files`,
});

// renvoie toutes les requêtes vers l'API /api/files (GET, POST, etc.) vers le file service
router.use(
  '/files', 
  // FIXME
  //checkRoles(['admin', 'author']),
  fileServiceProxyMiddleware
);
