import { Router } from "express";
import { isConnected } from "../middlewares/access-control.middleware.ts";
import { router as authRouter } from "./auth.router.ts";
import { router as levelsRouter } from "./levels.router.ts";
import { router as tagRouter } from "./tag.router.ts";
import { router as usersRouter } from "./users.router.ts";
import { router as filesRouter } from "./files.router.ts";

import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export const router = Router();

// Avant isConnected pour rendre la page publique
// documentation swagger
const specification = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API oQuiz",
      version: "1.0.0",
    },
    servers: [{ url: "/api" }],
  },
  apis: [path.join(import.meta.dirname, '*.router.{ts,js}')],
});

// Documentation accessible a http://<API_BASE_URL>/api/api-docs.
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specification));

router.use(filesRouter);

router.use(authRouter);

// toutes les routes qui suivent sont accessibles uniquement si l'utilisateur est connecté
// connecté --> possède un accessToken valide
router.use(isConnected);

router.use(usersRouter);
router.use(levelsRouter);

router.use(tagRouter);


