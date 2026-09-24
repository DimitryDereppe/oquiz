import { PrismaClient } from "../../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from '../../config.ts';


const adapter = new PrismaPg(config.databaseUrl);
export const prisma = new PrismaClient({ adapter });