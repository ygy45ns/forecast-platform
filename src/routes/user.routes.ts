import { Router } from "express";
import { deposit } from "../controllers/user.controller";

const router = Router();

router.post("/:id/deposit", deposit);

export default router;
