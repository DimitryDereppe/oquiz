// Configuration de la CLI Prisma (migrations, génération du client)
// Nommé prisma.config.ts : c'est le seul nom lu automatiquement par la CLI
import "dotenv/config";
import { defineConfig } from "prisma/config";
import { config } from "./config.ts";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: config.databaseUrl,
  },
});
