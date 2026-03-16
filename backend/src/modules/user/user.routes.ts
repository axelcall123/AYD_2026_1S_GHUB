import { Router } from "express";
import { UserController } from "./user.controller.js";

const router = Router();

router.get("/", UserController.getUsers);
router.post("/", UserController.createUser);

export default router;
