import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import cors from "cors";

const DATA_FILE = path.join(process.cwd(), "tripData.json");

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/itineraries", (req, res) => {
    try {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const itineraries = JSON.parse(data);
      // Sort by updatedAt descending
      itineraries.sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      res.json(itineraries);
    } catch (error) {
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/itineraries", (req, res) => {
    try {
      const newItinerary = req.body;
      const now = new Date().toISOString();
      
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const itineraries = JSON.parse(data);
      
      const existingIdx = itineraries.findIndex((i: any) => i.id === newItinerary.id);
      if (existingIdx > -1) {
        itineraries[existingIdx] = { 
          ...itineraries[existingIdx], 
          ...newItinerary, 
          updatedAt: now 
        };
      } else {
        itineraries.unshift({ 
          ...newItinerary, 
          createdAt: now, 
          updatedAt: now 
        });
      }
      
      fs.writeFileSync(DATA_FILE, JSON.stringify(itineraries, null, 2));
      res.json(existingIdx > -1 ? itineraries[existingIdx] : itineraries[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  app.delete("/api/itineraries/:id", (req, res) => {
    try {
      const { id } = req.params;
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      let itineraries = JSON.parse(data);
      itineraries = itineraries.filter((i: any) => i.id !== id);
      fs.writeFileSync(DATA_FILE, JSON.stringify(itineraries, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
