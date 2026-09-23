import { TimelineMemory } from '../types';

/**
 * Service de relais et synchronisation bidirectionnelle de la galerie
 * Assure la transmission instantanée des photos et souvenirs entre les deux partenaires
 * avec persistance sur serveur, diffusion temps réel SSE (0ms) et notification push.
 */

/**
 * Envoie un souvenir ou photo de galerie au serveur relais
 */
export async function sendMemoryViaRelay(
  memory: TimelineMemory,
  senderName?: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/gallery/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memory, senderName }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Gallery Relay] Erreur ajout souvenir:', err);
    return false;
  }
}

/**
 * Récupère l'ensemble des souvenirs de galerie sauvegardés sur le serveur
 */
export async function fetchMemoriesFromRelay(): Promise<TimelineMemory[]> {
  try {
    const res = await fetch('/api/gallery/memories');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.memories) ? data.memories : [];
  } catch (err) {
    console.warn('[Gallery Relay] Erreur récupération souvenirs:', err);
    return [];
  }
}

/**
 * Synchronise les souvenirs locaux avec le serveur relais (fusion bidirectionnelle)
 */
export async function syncMemoriesWithRelay(
  localMemories: TimelineMemory[]
): Promise<TimelineMemory[]> {
  try {
    const res = await fetch('/api/gallery/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localMemories }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.memories) ? data.memories : [];
  } catch (err) {
    console.warn('[Gallery Relay] Erreur synchronisation souvenirs:', err);
    return [];
  }
}

/**
 * Met à jour un souvenir (réactions j'aime, édition titre/description) sur le serveur relais
 */
export async function updateMemoryViaRelay(memory: TimelineMemory): Promise<boolean> {
  try {
    const res = await fetch('/api/gallery/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memory }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Gallery Relay] Erreur mise à jour souvenir:', err);
    return false;
  }
}

/**
 * Supprime un souvenir sur le serveur relais
 */
export async function deleteMemoryViaRelay(memoryId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/gallery/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryId }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Gallery Relay] Erreur suppression souvenir:', err);
    return false;
  }
}
