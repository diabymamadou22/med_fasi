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

      const prompt = `Tu es un expert en relations amoureuses et créateur de moments inoubliables pour les couples vivant au Mali (notamment à Bamako et ses environs magnifiques comme Siby, le Lac de Sélingué, les rives du fleuve Niger Djoliba, le Parc National du Mali).
Génère 3 idées de rendez-vous amoureux originales, chaleureuses et détaillées pour le couple "${coupleNames || "Med & Safi"}".
Critères demandés :
- Budget : ${budget || "Indifférent"} (les montants doivent être en FCFA ou Gratuit, ex: Gratuit, 5 000 FCFA, 15 000 FCFA, 30 000 FCFA)
- Météo / Saison : ${weather || "Indifférent"} (climat du Mali : brise du soir, coucher de soleil au bord du fleuve, fraîcheur sous les manguiers)
- Lieu / Ambiance : ${location || "Maison ou Sortie"} (Vibe : ${vibe || "Romantique et complice"})
- N'hésite pas à intégrer avec délicatesse et romantisme des touches de vie au Mali (le rituel des 3 thés à la menthe, le capitaine braisé au bord du Niger, balade au Parc National, fruits doux de saison).

Réponds UNIQUEMENT sous forme d'un objet JSON strict avec cette structure :
{
  "ideas": [
    {
      "title": "Titre accrocheur",
      "description": "Description concrète du déroulement pas à pas (2-3 phrases)",
      "vibe": "Mot-clé ambiance (ex: Cocooning, Aventure, Gourmand, Fleuve, Étoilé)",
      "budget": "Gratuit / 5 000 FCFA / 15 000 FCFA / 30 000 FCFA+",
      "location": "Maison / Bord du fleuve / Nature / Resto",
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

      const prompt = `Rédige un petit billet doux / message d'amour personnalisé de ${senderName || "Moi"} pour ${recipientName || "Mon amour"} pour ce couple uni au Mali (Med & Safi).
Ton : ${tone || "Doux et poétique"} (ex: Drôle, Passionné, Tendre, Réconfortant).
Occasion : ${occasion || "Billet du matin / pensée spontanée"}.
Détails ou anecdote : ${details || "Juste rappeler combien tu comptes pour moi"}.

Rédige un message court (3 à 5 phrases) touchant, sincère, chaleureux, ancré dans leur douce vie complice au Mali (ex: un thé partagé, la brise du soir, ton doux sourire), qui va faire sourire ou fondre le partenaire.
Renvoie un JSON strict :
{
  "note": "Le texte du billet doux",
  "signature": "Formule de fin courte",
  "suggestedGiftOrAction": "Petite attention suggérée à accompagner (ex: un thé à la menthe chaud, une mangue fraîche découpée, un baiser doux)"
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

      const prompt = `Génère 3 questions de quiz pour couple amusantes et intimes pour un couple vivant au Mali (Med & Safi), sur le thème : "${theme || "Complicité, quotidien au Mali & Rêves"}".
Chaque question doit proposer 4 options de réponse et susciter une discussion bienveillante et complice.
Renvoie un JSON strict :
{
  "questions": [
    {
      "question": "Texte de la question",
      "category": "Complicité / Rêves & Futur / Quotidien / Fous Rires",
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
