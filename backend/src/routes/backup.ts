// src/routes/backupRoute.js
import express from "express";
import { runBackupDatabase } from "../utils/backupDatabase";
import { logger } from "../utils/logger";

const router = express.Router();

router.post("/backup-database", async (req, res) => {
  try {
    await runBackupDatabase();
    res.status(200).send("Backup do banco de dados realizado com sucesso!");
  } catch (error) {
    logger.error("Erro ao realizar o backup do banco de dados:", error);
    res.status(500).send("Erro ao realizar o backup do banco de dados.");
  }
});

export default router;
