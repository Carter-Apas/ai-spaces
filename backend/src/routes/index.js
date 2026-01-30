import { Router } from "express";
import generateRouter from "./generate.js";

const router = Router();

router.use("/generate", generateRouter);

export default router;
