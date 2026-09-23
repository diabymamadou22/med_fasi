import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import webpush from "web-push";

dotenv.config();

// Web Push VAPID Setup
const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BGVAXz9p6mfBB0HrdfnM6BWRXQ02r_-YKCTsQqc1B82ZbLBT-n0tDfh-cYWB3OE3qy3Xi_2ERIkKUhGhh8xrHPs";
const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "KbGLzdVl2MAL36DD7dBB0pjO4CV10_UjRPUUmsLd5Oc";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:diaby607622@gmail.com";

try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    DEFAULT_VAPID_PUBLIC_KEY,
    DEFAULT_VAPID_PRIVATE_KEY
  );
  console.log("Web Push VAPID initialisé avec succès");
} catch (err) {
  console.error("Erreur initialisation VAPID webpush:", err);
}

interface PushSubscriptionRecord {
  id: string;
  partnerId: string; // 'p1' | 'p2'
  subscription: webpush.PushSubscription;
  userAgent?: string;
  createdAt: string;
  lastActiveAt: string;
}

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), "push_subscriptions_store.json");

function loadPushSubscriptions(): PushSubscriptionRecord[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Erreur lecture push subscriptions:", err);
  }
  return [];
}

function savePushSubscriptions(records: PushSubscriptionRecord[]) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.warn("Erreur écriture push subscriptions:", err);
  }
}

let pushSubscriptions: PushSubscriptionRecord[] = loadPushSubscriptions();

// Chat Messages Store pour synchronisation directe & haute disponibilité
const CHAT_MESSAGES_FILE = path.join(process.cwd(), "chat_messages_store.json");

function loadServerChatMessages(): any[] {
  try {
    if (fs.existsSync(CHAT_MESSAGES_FILE)) {
      const data = fs.readFileSync(CHAT_MESSAGES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Erreur lecture chat_messages_store.json:", err);
  }
  return [];
}

function saveServerChatMessages(messages: any[]) {
  try {
    fs.writeFileSync(CHAT_MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf-8");
  } catch (err) {
    console.warn("Erreur écriture chat_messages_store.json:", err);
  }
}

let serverChatMessages: any[] = loadServerChatMessages();

// Gallery Memories Store pour synchronisation durable & multi-appareils
const GALLERY_MEMORIES_FILE = path.join(process.cwd(), "gallery_memories_store.json");

function loadServerMemories(): any[] {
  try {
    if (fs.existsSync(GALLERY_MEMORIES_FILE)) {
      const data = fs.readFileSync(GALLERY_MEMORIES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Erreur lecture gallery_memories_store.json:", err);
  }
  return [];
}

function saveServerMemories(memories: any[]) {
  try {
    fs.writeFileSync(GALLERY_MEMORIES_FILE, JSON.stringify(memories, null, 2), "utf-8");
  } catch (err) {
    console.warn("Erreur écriture gallery_memories_store.json:", err);
  }
}

let serverMemories: any[] = loadServerMemories();

// Server-Sent Events (SSE) pour communication instantanée sans latence
let sseClients: { id: string; partnerId: string; res: express.Response }[] = [];

function broadcastChatMessage(msg: any) {
  const data = JSON.stringify({ type: "new_message", message: msg });
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {}
  });
}

function broadcastGalleryEvent(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, ...payload });
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {}
  });
}

const presenceState: Record<string, { partnerId: string; isTyping: boolean; isOnline: boolean; lastSeen: string; updatedAt: string }> = {
  p1: { partnerId: "p1", isTyping: false, isOnline: false, lastSeen: new Date().toISOString(), updatedAt: new Date().toISOString() },
  p2: { partnerId: "p2", isTyping: false, isOnline: false, lastSeen: new Date().toISOString(), updatedAt: new Date().toISOString() },
};

function broadcastPresence() {
  const data = JSON.stringify({ type: "presence", presence: presenceState });
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {}
  });
}

async function sendPushToPartner(
  senderId: string,
  senderName: string,
  content: string,
  mediaType?: string
): Promise<number> {
  const targetId = senderId === "p1" ? "p2" : "p1";
  const targets = pushSubscriptions.filter((s) => s.partnerId === targetId);

  if (targets.length === 0) return 0;

  let previewText = content || "Nouveau mot doux de votre amour !";
  let targetTab = "chat";
  if (mediaType === "image") {
    previewText = "📷 Vous a envoyé une nouvelle photo dans le chat";
  } else if (mediaType === "audio") {
    previewText = "🎵 Vous a envoyé une note vocale d'amour";
  } else if (mediaType === "video") {
    previewText = "🎬 Vous a envoyé une vidéo";
  } else if (mediaType === "gallery_photo" || mediaType === "memory") {
    previewText = content || "📷 A ajouté une nouvelle photo à votre galerie !";
    targetTab = "gallery";
  }

  if (previewText.length > 140) {
    previewText = previewText.substring(0, 137) + "...";
  }

  const payload = JSON.stringify({
    title: `${senderName || "Votre amour"} ❤️`,
    body: previewText,
    icon: "/pwa-192x192.png",
    badge: "/favicon.png",
    tag: `nid-damour-${targetTab}-${Date.now()}`,
    timestamp: Date.now(),
    data: {
      url: `/?tab=${targetTab}`,
      tab: targetTab,
      senderId,
    },
  });

  let sentCount = 0;
  const deadEndpoints: string[] = [];

  await Promise.all(
    targets.map(async (record) => {
      try {
        await webpush.sendNotification(record.subscription, payload);
        sentCount++;
        record.lastActiveAt = new Date().toISOString();
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          deadEndpoints.push(record.subscription.endpoint);
        }
      }
    })
  );

  if (deadEndpoints.length > 0) {
    pushSubscriptions = pushSubscriptions.filter(
      (s) => !deadEndpoints.includes(s.subscription.endpoint)
    );
    savePushSubscriptions(pushSubscriptions);
  }
  return sentCount;
}

// Heartbeat SSE pour maintenir les connexions mobiles ouvertes
setInterval(() => {
  const ping = `data: ${JSON.stringify({ type: "ping", time: Date.now() })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(ping);
    } catch {}
  });
}, 20000);

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
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      pushSubscriptionsCount: pushSubscriptions.length,
    });
  });

  // Web Push API Routes
  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({
      publicKey: DEFAULT_VAPID_PUBLIC_KEY,
      subject: VAPID_SUBJECT,
    });
  });

  app.get("/api/push/status", (req, res) => {
    const partnerId = req.query.partnerId as string;
    const p1Count = pushSubscriptions.filter((s) => s.partnerId === "p1").length;
    const p2Count = pushSubscriptions.filter((s) => s.partnerId === "p2").length;
    res.json({
      total: pushSubscriptions.length,
      partnerSubscriptions: { p1: p1Count, p2: p2Count },
      activePartnerSubs: partnerId
        ? pushSubscriptions.filter((s) => s.partnerId === partnerId).length
        : 0,
    });
  });

  app.post("/api/push/subscribe", (req, res) => {
    try {
      const { partnerId, subscription, userAgent } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: "Abonnement push invalide" });
      }
      const pid = partnerId === "p2" ? "p2" : "p1";
      const nowIso = new Date().toISOString();

      // Supprimer les doublons pour le même endpoint
      pushSubscriptions = pushSubscriptions.filter(
        (s) => s.subscription.endpoint !== subscription.endpoint
      );

      const record: PushSubscriptionRecord = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        partnerId: pid,
        subscription,
        userAgent: userAgent || req.headers["user-agent"] || "",
        createdAt: nowIso,
        lastActiveAt: nowIso,
      };

      pushSubscriptions.push(record);
      savePushSubscriptions(pushSubscriptions);

      console.log(`Nouvel appareil push abonné pour ${pid} (total: ${pushSubscriptions.length})`);
      return res.json({ success: true, count: pushSubscriptions.length });
    } catch (err: any) {
      console.error("Erreur enregistrement abonnement push:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/unsubscribe", (req, res) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        pushSubscriptions = pushSubscriptions.filter(
          (s) => s.subscription.endpoint !== endpoint
        );
        savePushSubscriptions(pushSubscriptions);
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/notify-partner", async (req, res) => {
    try {
      const { senderId, senderName, content, mediaType, targetPartnerId } = req.body;

      const targetId = targetPartnerId || (senderId === "p1" ? "p2" : "p1");
      const targets = pushSubscriptions.filter((s) => s.partnerId === targetId);

      if (targets.length === 0) {
        console.log(`Aucun appareil enregistré pour le partenaire cible (${targetId})`);
        return res.json({
          success: true,
          sentCount: 0,
          message: "Aucun appareil abonné pour le destinataire pour l'instant",
        });
      }

      let previewText = content || "Nouveau mot doux de votre amour !";
      if (mediaType === "image") {
        previewText = "📷 Vous a envoyé une nouvelle photo dans le chat";
      } else if (mediaType === "audio") {
        previewText = "🎵 Vous a envoyé une note vocale d'amour";
      }

      if (previewText.length > 140) {
        previewText = previewText.substring(0, 137) + "...";
      }

      const payload = JSON.stringify({
        title: `${senderName || "Votre amour"} ❤️`,
        body: previewText,
        icon: "/pwa-192x192.png",
        badge: "/favicon.png",
        tag: `nid-damour-msg-${Date.now()}`,
        timestamp: Date.now(),
        data: {
          url: "/?tab=chat",
          tab: "chat",
          senderId,
        },
      });

      let sentCount = 0;
      const deadEndpoints: string[] = [];

      await Promise.all(
        targets.map(async (record) => {
          try {
            await webpush.sendNotification(record.subscription, payload);
            sentCount++;
            record.lastActiveAt = new Date().toISOString();
          } catch (err: any) {
            console.warn(`Échec envoi push vers ${record.id}:`, err?.statusCode || err?.message);
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              deadEndpoints.push(record.subscription.endpoint);
            }
          }
        })
      );

      if (deadEndpoints.length > 0) {
        pushSubscriptions = pushSubscriptions.filter(
          (s) => !deadEndpoints.includes(s.subscription.endpoint)
        );
        savePushSubscriptions(pushSubscriptions);
      }

      console.log(`Push envoyé avec succès à ${sentCount}/${targets.length} appareils pour ${targetId}`);
      return res.json({ success: true, sentCount, targetCount: targets.length });
    } catch (err: any) {
      console.error("Erreur diffusion push:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/test", async (req, res) => {
    try {
      const { partnerId, partnerName } = req.body;
      const pid = partnerId === "p2" ? "p2" : "p1";
      const targets = pushSubscriptions.filter((s) => s.partnerId === pid);

      if (targets.length === 0) {
        return res.json({
          success: false,
          message: "Cet appareil n'est pas encore abonné aux notifications push.",
        });
      }

      const payload = JSON.stringify({
        title: `Nid d'Amour - Alerte active 🔔`,
        body: `Parfait ${partnerName || ""} ! Votre appareil est connecté. Vous recevrez les messages même lorsque l'application ou votre écran est éteint !`,
        icon: "/pwa-192x192.png",
        badge: "/favicon.png",
        tag: `test-alert-${Date.now()}`,
        data: { url: "/?tab=chat", tab: "chat" },
      });

      let sent = 0;
      await Promise.all(
        targets.map(async (r) => {
          try {
            await webpush.sendNotification(r.subscription, payload);
            sent++;
          } catch (e: any) {
            console.warn("Échec test push:", e?.message);
          }
        })
      );

      return res.json({ success: sent > 0, sentCount: sent });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // DIRECT CHAT RELAY & REAL-TIME EVENT STREAM
  // ==========================================

  // Récupérer l'ensemble des messages persistés sur le serveur
  app.get("/api/chat/messages", (_req, res) => {
    res.json({
      success: true,
      messages: serverChatMessages,
      count: serverChatMessages.length,
    });
  });

  // Envoyer un message (stockage immédiat, broadcast SSE instantané, et push vers le partenaire)
  app.post("/api/chat/send", async (req, res) => {
    try {
      const { message, senderName } = req.body;
      if (!message || !message.id) {
        return res.status(400).json({ error: "Message invalide" });
      }

      // Upsert
      const existingIdx = serverChatMessages.findIndex((m) => m.id === message.id);
      if (existingIdx >= 0) {
        serverChatMessages[existingIdx] = { ...serverChatMessages[existingIdx], ...message };
      } else {
        serverChatMessages.push(message);
      }

      // Conserver les 600 messages les plus récents
      if (serverChatMessages.length > 600) {
        serverChatMessages = serverChatMessages.slice(-600);
      }
      saveServerChatMessages(serverChatMessages);

      // Diffusion instantanée vers tous les clients SSE connectés (0ms de latence)
      broadcastChatMessage(message);

      // Déclencher la notification Push vers l'autre partenaire en tâche de fond
      sendPushToPartner(
        message.senderId,
        senderName || (message.senderId === "p1" ? "Med" : "Safi"),
        message.content,
        message.mediaType
      ).catch(() => {});

      return res.json({ success: true, message });
    } catch (err: any) {
      console.error("Erreur /api/chat/send:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Synchronisation bidirectionnelle des messages locaux et distants
  app.post("/api/chat/sync", (req, res) => {
    try {
      const { localMessages } = req.body;
      if (Array.isArray(localMessages) && localMessages.length > 0) {
        let modified = false;
        const idMap = new Map<string, any>();
        serverChatMessages.forEach((m) => idMap.set(m.id, m));

        localMessages.forEach((m) => {
          if (m && m.id && !idMap.has(m.id)) {
            idMap.set(m.id, m);
            serverChatMessages.push(m);
            modified = true;
          }
        });

        if (modified) {
          serverChatMessages.sort((a, b) => {
            const tA = a.timestampMs || new Date(a.timestamp || 0).getTime();
            const tB = b.timestampMs || new Date(b.timestamp || 0).getTime();
            return tA - tB;
          });
          if (serverChatMessages.length > 600) {
            serverChatMessages = serverChatMessages.slice(-600);
          }
          saveServerChatMessages(serverChatMessages);
        }
      }

      return res.json({
        success: true,
        messages: serverChatMessages,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Supprimer un ou plusieurs messages du serveur et diffuser en SSE vers tous les appareils
  app.post("/api/chat/delete", (req, res) => {
    try {
      const { messageIds } = req.body;
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ error: "Liste messageIds invalide" });
      }

      const idSet = new Set(messageIds);
      const initialCount = serverChatMessages.length;
      serverChatMessages = serverChatMessages.filter((m) => !idSet.has(m.id));

      if (serverChatMessages.length !== initialCount) {
        saveServerChatMessages(serverChatMessages);
      }

      // Diffuser instantanément l'événement de suppression à tous les clients connectés
      const payload = JSON.stringify({ type: "delete_messages", messageIds });
      sseClients.forEach((client) => {
        try {
          client.res.write(`data: ${payload}\n\n`);
        } catch {}
      });

      console.log(`[Relay] ${messageIds.length} message(s) supprimé(s). Messages restants: ${serverChatMessages.length}`);
      return res.json({ success: true, remainingCount: serverChatMessages.length });
    } catch (err: any) {
      console.error("Erreur /api/chat/delete:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Vider entièrement la discussion et diffuser l'effacement vers tous les appareils
  app.post("/api/chat/clear", (_req, res) => {
    try {
      serverChatMessages = [];
      saveServerChatMessages([]);

      const payload = JSON.stringify({ type: "clear_chat" });
      sseClients.forEach((client) => {
        try {
          client.res.write(`data: ${payload}\n\n`);
        } catch {}
      });

      console.log("[Relay] Conversation entièrement effacée");
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Erreur /api/chat/clear:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // DIRECT GALLERY RELAY & REAL-TIME EVENT STREAM
  // ==========================================

  // Récupérer l'ensemble des photos & souvenirs de la galerie sur le serveur
  app.get("/api/gallery/memories", (_req, res) => {
    res.json({
      success: true,
      memories: serverMemories,
      count: serverMemories.length,
    });
  });

  // Ajouter un souvenir / photo dans la galerie avec synchronisation SSE instantanée
  app.post("/api/gallery/add", async (req, res) => {
    try {
      const { memory, senderName } = req.body;
      if (!memory || !memory.id) {
        return res.status(400).json({ error: "Souvenir invalide" });
      }

      // Upsert dans le magasin du serveur
      const existingIdx = serverMemories.findIndex((m) => m.id === memory.id);
      if (existingIdx >= 0) {
        serverMemories[existingIdx] = { ...serverMemories[existingIdx], ...memory };
      } else {
        serverMemories.unshift(memory);
      }

      saveServerMemories(serverMemories);

      // Diffusion instantanée vers l'autre partenaire via SSE (0ms)
      broadcastGalleryEvent("new_memory", { memory });

      // Notification Push vers l'autre partenaire
      sendPushToPartner(
        memory.authorId || "p1",
        senderName || (memory.authorId === "p1" ? "Med" : "Safi"),
        `📷 A ajouté "${memory.title || "une nouvelle photo"}" à votre galerie !`,
        "gallery_photo"
      ).catch(() => {});

      console.log(`[Gallery Relay] Nouveau souvenir synchronisé: ${memory.title || memory.id} (total: ${serverMemories.length})`);
      return res.json({ success: true, memory });
    } catch (err: any) {
      console.error("Erreur /api/gallery/add:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Synchronisation bidirectionnelle des souvenirs locaux et distants
  app.post("/api/gallery/sync", (req, res) => {
    try {
      const { localMemories } = req.body;
      if (Array.isArray(localMemories) && localMemories.length > 0) {
        let modified = false;
        const idMap = new Map<string, any>();
        serverMemories.forEach((m) => idMap.set(m.id, m));

        localMemories.forEach((m) => {
          if (m && m.id && !idMap.has(m.id)) {
            idMap.set(m.id, m);
            serverMemories.push(m);
            modified = true;
          }
        });

        if (modified) {
          serverMemories.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });
          saveServerMemories(serverMemories);
        }
      }

      return res.json({
        success: true,
        memories: serverMemories,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Mettre à jour un souvenir (j'aime, description, titre, tags)
  app.post("/api/gallery/update", (req, res) => {
    try {
      const { memory } = req.body;
      if (!memory || !memory.id) {
        return res.status(400).json({ error: "Souvenir invalide" });
      }

      const existingIdx = serverMemories.findIndex((m) => m.id === memory.id);
      if (existingIdx >= 0) {
        serverMemories[existingIdx] = { ...serverMemories[existingIdx], ...memory };
        saveServerMemories(serverMemories);
      } else {
        serverMemories.unshift(memory);
        saveServerMemories(serverMemories);
      }

      broadcastGalleryEvent("update_memory", { memory });
      return res.json({ success: true, memory });
    } catch (err: any) {
      console.error("Erreur /api/gallery/update:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Supprimer un souvenir de la galerie
  app.post("/api/gallery/delete", (req, res) => {
    try {
      const { memoryId } = req.body;
      if (!memoryId) {
        return res.status(400).json({ error: "Identifiant memoryId requis" });
      }

      serverMemories = serverMemories.filter((m) => m.id !== memoryId);
      saveServerMemories(serverMemories);

      broadcastGalleryEvent("delete_memory", { memoryId });
      console.log(`[Gallery Relay] Souvenir ${memoryId} supprimé. Restants: ${serverMemories.length}`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Erreur /api/gallery/delete:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Flux temps-réel Server-Sent Events (SSE)
  app.get("/api/chat/events", (req, res) => {
    const partnerId = (req.query.partnerId as string) || "p1";
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    res.flushHeaders?.();

    const client = { id: clientId, partnerId, res };
    sseClients.push(client);

    // Poignée de main initiale avec l'état de présence
    res.write(`data: ${JSON.stringify({ type: "handshake", presence: presenceState })}\n\n`);

    req.on("close", () => {
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
  });

  // Indicateur de frappe
  app.post("/api/chat/typing", (req, res) => {
    const { partnerId, isTyping } = req.body;
    if (partnerId === "p1" || partnerId === "p2") {
      const now = new Date().toISOString();
      presenceState[partnerId] = {
        ...presenceState[partnerId],
        isTyping: Boolean(isTyping),
        isOnline: true,
        lastSeen: now,
        updatedAt: now,
      };
      broadcastPresence();
    }
    res.json({ success: true, presence: presenceState });
  });

  // Statut en ligne
  app.post("/api/chat/presence", (req, res) => {
    const { partnerId, isOnline } = req.body;
    if (partnerId === "p1" || partnerId === "p2") {
      const now = new Date().toISOString();
      presenceState[partnerId] = {
        ...presenceState[partnerId],
        isOnline: Boolean(isOnline),
        isTyping: isOnline ? presenceState[partnerId]?.isTyping : false,
        lastSeen: now,
        updatedAt: now,
      };
      broadcastPresence();
    }
    res.json({ success: true, presence: presenceState });
  });

  // Impulsion de manque (Pulse)
  app.post("/api/chat/pulse", (req, res) => {
    try {
      const { pulse, senderName } = req.body;
      if (!pulse || !pulse.senderId) {
        return res.status(400).json({ error: "Impulsion invalide" });
      }

      // Diffusion instantanée vers les clients connectés
      const data = JSON.stringify({ type: "pulse", pulse });
      sseClients.forEach((client) => {
        try {
          client.res.write(`data: ${data}\n\n`);
        } catch {}
      });

      // Notification Push
      sendPushToPartner(
        pulse.senderId,
        senderName || (pulse.senderId === "p1" ? "Med" : "Safi"),
        pulse.message || "Tu me manques tellement ! 💓",
        "pulse"
      ).catch(() => {});

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
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
