import { PrismaClient } from "../../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../../config.ts";

const adapter = new PrismaPg({ connectionString: config.dbUrl });
export const prisma = new PrismaClient({ adapter });
