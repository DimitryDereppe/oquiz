import { Router } from "express";
import { Role } from "../../generated/prisma/enums.ts";
import * as userController from "../controllers/users.controller.ts";
import { checkRoles } from "../middlewares/access-control.middleware.ts";

export const router = Router();


// checkRoles prend en argument un tableau avec la liste des role autorisés pour la route
router.get("/users", checkRoles([Role.admin]), userController.getAllUsers);
