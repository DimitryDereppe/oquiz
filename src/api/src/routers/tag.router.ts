import { Router } from "express";
import { Role } from "../../generated/prisma/enums.ts";
import * as tagsController from "../controllers/tags.controller.ts";
import { checkRoles } from "../middlewares/access-control.middleware.ts";

export const router = Router();

router.get("/tags", checkRoles([Role.member, Role.author, Role.admin]), tagsController.getAllTags);

router.get("/tags/:id", checkRoles([Role.member, Role.author, Role.admin]), tagsController.getOneTag);

router.post("/tags", checkRoles([Role.author, Role.admin]), tagsController.createTag);

router.patch("/tags/:id", checkRoles([Role.author, Role.admin]), tagsController.updateTag);

router.delete("/tags/:id", checkRoles([Role.author, Role.admin]), tagsController.deleteTag);
