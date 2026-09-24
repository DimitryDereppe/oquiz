import express from "express";
import cors from "cors";
import { router as logApiRouter } from "./routers/index.router.ts";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.ts";
import { globalErrorHandler } from "./middlewares/global-error-handler.ts";
import { config } from "../config.ts";
import { xss } from 'express-xss-sanitizer';
import helmet from "helmet";

export const app = express();

// origin: config.allowedOrigins --> indique au naviguateur qu'on accepte des requêtes depuis le front (URL configurée dans le .env)
app.use(cors({ origin: config.allowedOrigins}));

// protection contre les failles XSS
app.use(xss()); 

// sécurise les réponses HTTP --> modifie les entêtes HTTP, Exemple :
// Content-Security-Policy (CSP) --> Limite les sources de scripts et autres ressources, pour réduire notamment les risques XSS
// X-Content-Type-Options --> Empêche le navigateur de deviner un type de contenu différent de celui annoncé
// X-Frame-Options --> Limite l’intégration d’une page dans une iframe
// Strict-Transport-Security (HSTS) --> Demande au navigateur d’utiliser HTTPS pour les futures connexions
// Suppression de X-Powered-By --> Évite d’annoncer explicitement qu’Express est utilisé
app.use(helmet()); 

// type de contenu JSON dans la body des requêtes
app.use(express.json());

// je branche le middleware apiRouter sur la router "/api"
/// https://expressjs.com/fr/5x/guide/using-middleware/
app.use("/api", logApiRouter);

// Not found middleware
app.use(notFoundMiddleware);

// Global error middleware
app.use(globalErrorHandler);