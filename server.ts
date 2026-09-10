import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // AI Date Idea Generator
  app.post("/api/gemini/generate-date", async (req, res) => {
    try {
      const { budget, weather, location, vibe, coupleNames } = req.body;
      const ai = getAI();
      if (!ai) {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: "API Gemini non configurée, utilisation du générateur interne.",
        });
      }

      const prompt = `Tu es un expert en relations amoureuses et créateur de moments inoubliables pour les couples.
Génère 3 idées de rendez-vous amoureux originales, chaleureuses et détaillées pour un couple nommé "${coupleNames || "les amoureux"}".
Critères demandés :
- Budget : ${budget || "Indifférent"}
- Météo / Saison : ${weather || "Indifférent"}
- Lieu / Ambiance : ${location || "Maison ou Sortie"} (Vibe : ${vibe || "Romantique et complice"})

Réponds UNIQUEMENT sous forme d'un objet JSON strict avec cette structure :
{
  "ideas": [
    {
      "title": "Titre accrocheur",
      "description": "Description concrète du déroulement pas à pas (2-3 phrases)",
      "vibe": "Mot-clé ambiance (ex: Cocooning, Aventure, Gourmand, Chic)",
      "budget": "Gratuit / € / €€ / €€€",
      "location": "Maison / Extérieur / Resto / Nature",
      "prepTip": "Un petit conseil de préparation secret"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "Réponse vide de Gemini" });
      }

      const parsed = JSON.parse(text);
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Gemini Date Error:", err);
      return res.status(500).json({ error: err.message || "Erreur lors de la génération" });
    }
  });

  // AI Sweet Note Assistant
  app.post("/api/gemini/generate-note", async (req, res) => {
    try {
      const { recipientName, senderName, tone, occasion, details } = req.body;
      const ai = getAI();
      if (!ai) {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: "Clé Gemini absente, génération locale.",
        });
      }

      const prompt = `Rédige un petit billet doux / message d'amour personnalisé de ${senderName || "Moi"} pour ${recipientName || "Mon amour"}.
Ton : ${tone || "Doux et poétique"} (ex: Drôle, Passionné, Tendre, Réconfortant).
Occasion : ${occasion || "Billet du matin / pensée spontanée"}.
Détails ou anecdote : ${details || "Juste rappeler combien tu comptes pour moi"}.

Rédige un message court (3 à 5 phrases) touchant, sincère, sans clichés mièvres, qui va faire sourire ou fondre le partenaire.
Renvoie un JSON strict :
{
  "note": "Le texte du billet doux",
  "signature": "Formule de fin courte",
  "suggestedGiftOrAction": "Petite attention suggérée à accompagner (ex: un café chaud, une chanson, un baiser)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      const parsed = JSON.parse(text || "{}");
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Gemini Note Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // AI Couple Quiz Questions Generator
  app.post("/api/gemini/generate-quiz", async (req, res) => {
    try {
      const { theme } = req.body;
      const ai = getAI();
      if (!ai) {
        return res.status(200).json({ success: false, fallback: true });
      }

      const prompt = `Génère 3 questions de quiz pour couple amusantes et intimes sur le thème : "${theme || "Complicité & Quotidien"}".
Chaque question doit proposer 2 ou 4 options de réponse et susciter une discussion bienveillante.
Renvoie un JSON strict :
{
  "questions": [
    {
      "question": "Texte de la question",
      "category": "Thème",
      "options": ["Choix A", "Choix B", "Choix C", "Choix D"],
      "funFactPrompt": "Question de relance pour la discussion"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Nid d'Amour actif sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
