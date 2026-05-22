import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get("/api/skill/glossary", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "skill", "Glossary", "japan_anime_game_company_glossary.txt");
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        res.json({ content });
      } else {
        res.status(404).json({ error: "Predefined glossary file not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/skill/rules", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "skill", "Translation Rules and Context", "japan_anime_game_company_rules.txt");
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        res.json({ content });
      } else {
        res.status(404).json({ error: "Predefined rules file not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
