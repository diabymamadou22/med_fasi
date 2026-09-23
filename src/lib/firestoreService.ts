import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  CoupleProfile,
  TimelineMemory,
  TimeCapsule,
  MemoryLocation,
  SweetNote,
  DailyGratitude,
  LoveVoucher,
  BucketItem,
  MissYouPulse,
  QuizQuestion,
  DateIdea,
  CoupleChallenge,
  CoupleSettings,
  ChatMessage,
  EnglishLexiconItem,
  WeeklyLearningChallenge,
} from '../types';
import {
  sortChatMessagesChronologically,
  extractMessageTimestampMs,
} from './chatUtils';

// Collections
const COLLECTIONS = {
  PROFILE: 'couple_profile',
  CHAT_MESSAGES: 'chat_messages',
  CHAT_STATUS: 'chat_status',
  MEMORIES: 'memories',
  CAPSULES: 'capsules',
  LOCATIONS: 'locations',
  NOTES: 'notes',
  GRATITUDES: 'gratitudes',
  VOUCHERS: 'vouchers',
  BUCKET_LIST: 'bucket_list',
  PULSES: 'pulses',
  QUIZZES: 'quizzes',
  DATES: 'dates',
  CHALLENGES: 'challenges',
  SETTINGS: 'couple_settings',
  LEXICON: 'couple_lexicon',
  WEEKLY_LEARNING_CHALLENGES: 'weekly_learning_challenges',
};

/**
 * Nettoie récursivement un objet pour Firestore:
 * - Supprime tous les champs avec des valeurs `undefined`
 * - Protège contre l'erreur Firestore: "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Variable pour éviter les vérifications répétées en cours d'exécution
let isSeedChecked = false;

// Initialisation / Seed des données UNIQUEMENT si la base est totalement vierge
export async function seedInitialDataIfEmpty(defaults: {
  profile: CoupleProfile;
  memories: TimelineMemory[];
  capsules: TimeCapsule[];
  locations: MemoryLocation[];
  notes: SweetNote[];
  gratitudes: DailyGratitude[];
  vouchers: LoveVoucher[];
  bucketList: BucketItem[];
  quizzes?: QuizQuestion[];
  dateIdeas?: DateIdea[];
  challenges?: CoupleChallenge[];
  settings?: CoupleSettings;
  lexicon?: EnglishLexiconItem[];
  weeklyChallenges?: WeeklyLearningChallenge[];
}) {
  if (isSeedChecked || isQuotaExhausted()) return;
  isSeedChecked = true;

  try {
    const profileRef = doc(db, COLLECTIONS.PROFILE, 'main_profile');
    const profileSnap = await getDoc(profileRef);

    // SÉCURITÉ ABSOLUE : Si le profil existe déjà dans Firestore, la base est DÉJÀ INITIALISÉE
    // Ne JAMAIS réécrire, écraser ou réinitialiser les données réelles du couple !
    if (profileSnap.exists()) {
      return;
    }

    // Double vérification : si l'une des collections contient déjà des documents
    const [memoriesSnap, notesSnap, capsSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.MEMORIES)),
      getDocs(collection(db, COLLECTIONS.NOTES)),
      getDocs(collection(db, COLLECTIONS.CAPSULES)),
    ]);

    if (!memoriesSnap.empty || !notesSnap.empty || !capsSnap.empty) {
      return;
    }

    // Uniquement dans le cas d'une base 100% neuve et vide
    const batch = writeBatch(db);

    // Seed profile
    batch.set(profileRef, sanitizeForFirestore({ ...defaults.profile, id: 'main_profile', isInitialized: true }));

    // Seed memories
    defaults.memories.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.MEMORIES, item.id), sanitizeForFirestore(item));
    });

    // Seed capsules
    defaults.capsules.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.CAPSULES, item.id), sanitizeForFirestore(item));
    });

    // Seed locations
    defaults.locations.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.LOCATIONS, item.id), sanitizeForFirestore(item));
    });

    // Seed notes
    defaults.notes.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.NOTES, item.id), sanitizeForFirestore(item));
    });

    // Seed gratitudes
    defaults.gratitudes.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.GRATITUDES, item.id), sanitizeForFirestore(item));
    });

    // Seed vouchers
    defaults.vouchers.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.VOUCHERS, item.id), sanitizeForFirestore(item));
    });

    // Seed bucket list
    defaults.bucketList.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.BUCKET_LIST, item.id), sanitizeForFirestore(item));
    });

    // Seed quizzes
    if (defaults.quizzes) {
      defaults.quizzes.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.QUIZZES, item.id), sanitizeForFirestore(item));
      });
    }

    // Seed dates
    if (defaults.dateIdeas) {
      defaults.dateIdeas.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.DATES, item.id), sanitizeForFirestore(item));
      });
    }

    // Seed challenges
    if (defaults.challenges) {
      defaults.challenges.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.CHALLENGES, item.id), sanitizeForFirestore(item));
      });
    }

    // Seed settings
    if (defaults.settings) {
      batch.set(doc(db, COLLECTIONS.SETTINGS, 'main_settings'), sanitizeForFirestore({
        ...defaults.settings,
        id: 'main_settings',
      }));
    }

    // Seed lexicon
    if (defaults.lexicon) {
      defaults.lexicon.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.LEXICON, item.id), sanitizeForFirestore(item));
      });
    }

    // Seed weekly learning challenges
    if (defaults.weeklyChallenges) {
      defaults.weeklyChallenges.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.WEEKLY_LEARNING_CHALLENGES, item.id), sanitizeForFirestore(item));
      });
    }

    await batch.commit();
  } catch (error) {
    logFirestoreSyncIssue('Vérification initiale des données Firebase', error);
  }
}

// ---------------------------------------------------------------------------
// Gestion résiliente des erreurs de quota et réseau Firestore (Circuit Breaker)
// ---------------------------------------------------------------------------

const QUOTA_STORAGE_KEY = 'nid_firestore_quota_exhausted_timestamp';
let quotaExhaustedInMemory = false;

export function isQuotaExhausted(): boolean {
  if (quotaExhaustedInMemory) return true;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        // Réessai après 4 heures ou lendemain
        if (Date.now() - ts < 4 * 60 * 60 * 1000) {
          quotaExhaustedInMemory = true;
          return true;
        } else {
          localStorage.removeItem(QUOTA_STORAGE_KEY);
        }
      }
    } catch {}
  }
  return false;
}

export async function pauseFirestoreNetwork() {
  try {
    if (db) {
      await disableNetwork(db);
    }
  } catch {}
}

export async function resumeFirestoreNetwork() {
  try {
    if (db) {
      await enableNetwork(db);
      resetQuotaExhausted();
    }
  } catch {}
}

export function markQuotaExhausted() {
  quotaExhaustedInMemory = true;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(QUOTA_STORAGE_KEY, String(Date.now()));
    } catch {}
  }
}

export function resetQuotaExhausted() {
  quotaExhaustedInMemory = false;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
    } catch {}
  }
}

// Assurer la reprise du réseau dès le démarrage
if (typeof window !== 'undefined') {
  setTimeout(() => {
    resumeFirestoreNetwork().catch(() => {});
  }, 100);
}

export function isQuotaOrResourceError(err: any): boolean {
  if (!err) return false;
  const msg = (err?.message || String(err)).toLowerCase();
  const code = (err?.code || '').toLowerCase();
  return (
    code === 'resource-exhausted' ||
    code === 'failed-precondition' ||
    code === 'unavailable' ||
    msg.includes('quota') ||
    msg.includes('resource exhausted') ||
    msg.includes('limit exceeded') ||
    msg.includes('client is offline') ||
    msg.includes('network') ||
    msg.includes('target id')
  );
}

let quotaExceededNotified = false;

export function logFirestoreSyncIssue(context: string, err: any) {
  if (isQuotaOrResourceError(err)) {
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('target id')) {
      console.warn(`[Firestore Warning] Sync issue on ${context}:`, err?.message || err);
      return;
    }
    markQuotaExhausted();
    if (!quotaExceededNotified) {
      quotaExceededNotified = true;
      console.warn(
        `[Firestore Info] Le quota gratuit quotidien Firebase est atteint ou vous êtes hors-ligne (${context}). Mode local automatique actif (IndexedDB / localStorage) sans impact sur vos données.`
      );
    }
  } else {
    console.error(`[Firestore Error] ${context}:`, err);
  }
}

async function safeFirestoreOperation<T>(action: () => Promise<T>, context: string): Promise<T | void> {
  try {
    const result = await action();
    // Si une opération réussit, le quota est opérationnel
    resetQuotaExhausted();
    return result;
  } catch (err) {
    logFirestoreSyncIssue(context, err);
  }
}

// Abonnements en temps réel (onSnapshot)
export function subscribeProfile(
  onUpdate: (profile: CoupleProfile) => void,
  onError?: (error: Error) => void
) {
  const ref = doc(db, COLLECTIONS.PROFILE, 'main_profile');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as CoupleProfile);
      }
    },
    (err) => {
      logFirestoreSyncIssue('Profile sync', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: T[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as T);
      });
      onUpdate(items);
    },
    (err) => {
      logFirestoreSyncIssue(`sync error on ${collectionName}`, err);
      if (onError) onError(err);
    }
  );
}

// Fonctions de sauvegarde et suppression avec assainissement systématique des données
export async function saveProfile(profile: CoupleProfile) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.PROFILE, 'main_profile');
    await setDoc(ref, sanitizeForFirestore({ ...profile, id: 'main_profile' }), { merge: true });
  }, 'saveProfile');
}

export async function saveMemory(memory: TimelineMemory) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.MEMORIES, memory.id);
    await setDoc(ref, sanitizeForFirestore(memory), { merge: true });
  }, 'saveMemory');
}

export async function deleteMemoryFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.MEMORIES, id));
  }, 'deleteMemoryFromDb');
}

export async function saveCapsule(capsule: TimeCapsule) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CAPSULES, capsule.id);
    await setDoc(ref, sanitizeForFirestore(capsule), { merge: true });
  }, 'saveCapsule');
}

export async function deleteCapsuleFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.CAPSULES, id));
  }, 'deleteCapsuleFromDb');
}

export async function saveLocation(location: MemoryLocation) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.LOCATIONS, location.id);
    await setDoc(ref, sanitizeForFirestore(location), { merge: true });
  }, 'saveLocation');
}

export async function deleteLocationFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.LOCATIONS, id));
  }, 'deleteLocationFromDb');
}

export async function saveSweetNote(note: SweetNote) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.NOTES, note.id);
    await setDoc(ref, sanitizeForFirestore(note), { merge: true });
  }, 'saveSweetNote');
}

export async function deleteSweetNoteFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.NOTES, id));
  }, 'deleteSweetNoteFromDb');
}

export async function saveGratitude(gratitude: DailyGratitude) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.GRATITUDES, gratitude.id);
    await setDoc(ref, sanitizeForFirestore(gratitude), { merge: true });
  }, 'saveGratitude');
}

export async function deleteGratitudeFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.GRATITUDES, id));
  }, 'deleteGratitudeFromDb');
}

export async function saveVoucher(voucher: LoveVoucher) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.VOUCHERS, voucher.id);
    await setDoc(ref, sanitizeForFirestore(voucher), { merge: true });
  }, 'saveVoucher');
}

export async function deleteVoucherFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.VOUCHERS, id));
  }, 'deleteVoucherFromDb');
}

export async function saveBucketItem(item: BucketItem) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.BUCKET_LIST, item.id);
    await setDoc(ref, sanitizeForFirestore(item), { merge: true });
  }, 'saveBucketItem');
}

export async function deleteBucketItemFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.BUCKET_LIST, id));
  }, 'deleteBucketItemFromDb');
}

export async function saveQuiz(quiz: QuizQuestion) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.QUIZZES, quiz.id);
    await setDoc(ref, sanitizeForFirestore(quiz), { merge: true });
  }, 'saveQuiz');
}

export async function saveDateIdea(idea: DateIdea) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.DATES, idea.id);
    await setDoc(ref, sanitizeForFirestore(idea), { merge: true });
  }, 'saveDateIdea');
}

export async function saveChallenge(challenge: CoupleChallenge) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CHALLENGES, challenge.id);
    await setDoc(ref, sanitizeForFirestore(challenge), { merge: true });
  }, 'saveChallenge');
}

export async function deleteChallengeFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.CHALLENGES, id));
  }, 'deleteChallengeFromDb');
}

// =========================================================================
// Notre Lexique d'Anglais du Couple (Synchronisation Cloud)
// =========================================================================

export async function saveLexiconWord(word: EnglishLexiconItem) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.LEXICON, word.id);
    await setDoc(ref, sanitizeForFirestore(word), { merge: true });
  }, 'saveLexiconWord');
}

export async function deleteLexiconWordFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.LEXICON, id));
  }, 'deleteLexiconWordFromDb');
}

export async function toggleLexiconFavoriteInDb(id: string, isFavorite: boolean) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.LEXICON, id);
    await setDoc(ref, { isFavorite }, { merge: true });
  }, 'toggleLexiconFavoriteInDb');
}

export async function toggleLexiconMasteredInDb(id: string, isMastered: boolean) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.LEXICON, id);
    await setDoc(ref, { isMastered }, { merge: true });
  }, 'toggleLexiconMasteredInDb');
}

export async function saveWeeklyLearningChallenge(challenge: WeeklyLearningChallenge) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.WEEKLY_LEARNING_CHALLENGES, challenge.id);
    await setDoc(ref, sanitizeForFirestore(challenge), { merge: true });
  }, 'saveWeeklyLearningChallenge');
}

export async function deleteWeeklyLearningChallengeFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.WEEKLY_LEARNING_CHALLENGES, id));
  }, 'deleteWeeklyLearningChallengeFromDb');
}

export function subscribeWeeklyLearningChallenges(
  onUpdate: (challenges: WeeklyLearningChallenge[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeCollection<WeeklyLearningChallenge>(
    COLLECTIONS.WEEKLY_LEARNING_CHALLENGES,
    onUpdate,
    onError
  );
}

export async function saveSettings(settings: CoupleSettings) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'main_settings');
    await setDoc(ref, sanitizeForFirestore({ ...settings, id: 'main_settings' }), { merge: true });
  }, 'saveSettings');
}

export function subscribeSettings(
  onUpdate: (settings: CoupleSettings) => void,
  onError?: (error: Error) => void
) {
  const ref = doc(db, COLLECTIONS.SETTINGS, 'main_settings');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as CoupleSettings);
      }
    },
    (err) => {
      logFirestoreSyncIssue('Settings sync', err);
      if (onError) onError(err);
    }
  );
}

export async function sendMissYouPulse(pulse: MissYouPulse) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.PULSES, pulse.id);
    await setDoc(ref, sanitizeForFirestore(pulse));
  }, 'sendMissYouPulse');
}

export function subscribeLatestPulse(
  onUpdate: (pulse: MissYouPulse) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTIONS.PULSES);
  const listenerStartTime = Date.now();
  return onSnapshot(
    colRef,
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as MissYouPulse;
          // Trigger only if pulse was generated within last 60 seconds
          const idMatch = change.doc.id.match(/^pulse-(\d+)$/);
          const pulseTime = idMatch ? parseInt(idMatch[1], 10) : 0;
          if (pulseTime >= listenerStartTime - 60000) {
            onUpdate({ id: change.doc.id, ...data });
          }
        }
      });
    },
    (err) => {
      logFirestoreSyncIssue('Pulse sync', err);
      if (onError) onError(err);
    }
  );
}

// ---------------------------------------------------------------------------
// WhatsApp-style Real-time Chat
// ---------------------------------------------------------------------------

export async function saveChatMessage(message: ChatMessage) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, message.id);
    await setDoc(ref, sanitizeForFirestore(message), { merge: true });
  }, 'saveChatMessage');
}

export async function deleteChatMessageFromDb(id: string) {
  return safeFirestoreOperation(async () => {
    await deleteDoc(doc(db, COLLECTIONS.CHAT_MESSAGES, id));
  }, 'deleteChatMessageFromDb');
}

export async function deleteMultipleChatMessagesFromDb(ids: string[]) {
  if (!ids || ids.length === 0) return;
  return safeFirestoreOperation(async () => {
    // Use batches (max 500 per batch)
    const chunkSize = 450;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        batch.delete(doc(db, COLLECTIONS.CHAT_MESSAGES, id));
      });
      await batch.commit();
    }
  }, 'deleteMultipleChatMessagesFromDb');
}

export async function editChatMessageContent(id: string, newContent: string) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, id);
    await setDoc(
      ref,
      sanitizeForFirestore({
        content: newContent,
        isEdited: true,
        editedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  }, 'editChatMessageContent');
}

export async function updateMultipleChatMessagesReaction(
  messageIds: string[],
  partnerId: string,
  reaction: string | null
) {
  if (!messageIds || messageIds.length === 0) return;
  return safeFirestoreOperation(async () => {
    await Promise.all(
      messageIds.map((id) => updateChatMessageReaction(id, partnerId, reaction))
    );
  }, 'updateMultipleChatMessagesReaction');
}

export async function updateMultipleChatMessagesReadStatus(
  messageIds: string[],
  status: 'delivered' | 'read'
) {
  if (!messageIds || messageIds.length === 0) return;
  return safeFirestoreOperation(async () => {
    const chunkSize = 450;
    for (let i = 0; i < messageIds.length; i += chunkSize) {
      const chunk = messageIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, id);
        batch.set(
          ref,
          {
            status,
            readStatus: status === 'read' ? 'read' : 'delivered',
          },
          { merge: true }
        );
      });
      await batch.commit();
    }
  }, 'updateMultipleChatMessagesReadStatus');
}

export async function updateChatMessageReaction(
  messageId: string,
  partnerId: string,
  reaction: string | null
) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as ChatMessage;
      const reactions = { ...(data.reactions || {}) };
      if (reaction) {
        reactions[partnerId] = reaction;
      } else {
        delete reactions[partnerId];
      }
      await setDoc(ref, sanitizeForFirestore({ reactions }), { merge: true });
    }
  }, 'updateChatMessageReaction');
}

export async function updateChatMessageStatus(
  messageId: string,
  status: 'delivered' | 'read'
) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
    await setDoc(
      ref,
      {
        status,
        readStatus: status === 'read' ? 'read' : 'delivered',
      },
      { merge: true }
    );
  }, 'updateChatMessageStatus');
}

export async function updateChatMessageReadStatus(
  messageId: string,
  readStatus: 'sent' | 'delivered' | 'read' | 'unread'
) {
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
    await setDoc(
      ref,
      {
        readStatus,
        status: readStatus === 'read' ? 'read' : readStatus === 'delivered' ? 'delivered' : 'sent',
      },
      { merge: true }
    );
  }, 'updateChatMessageReadStatus');
}

export interface PartnerPresenceInfo {
  partnerId: string;
  isTyping: boolean;
  isOnline: boolean;
  lastSeen: string;
  updatedAt: string;
}

export async function setChatTypingStatus(partnerId: string, isTyping: boolean) {
  if (isQuotaExhausted()) return;
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CHAT_STATUS, partnerId);
    const now = new Date().toISOString();
    await setDoc(
      ref,
      {
        partnerId,
        isTyping,
        isOnline: true,
        lastSeen: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }, 'setChatTypingStatus');
}

export async function updatePartnerPresence(partnerId: string, isOnline: boolean) {
  if (isQuotaExhausted()) return;
  return safeFirestoreOperation(async () => {
    const ref = doc(db, COLLECTIONS.CHAT_STATUS, partnerId);
    const now = new Date().toISOString();
    await setDoc(
      ref,
      {
        partnerId,
        isOnline,
        ...(isOnline ? {} : { isTyping: false }),
        lastSeen: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }, 'updatePartnerPresence');
}

export function subscribeChatMessages(
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTIONS.CHAT_MESSAGES);
  return onSnapshot(
    colRef,
    (snap) => {
      const messages: ChatMessage[] = [];
      snap.forEach((docSnap) => {
        messages.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      // Sort chronologically strictly by sending/arrival timestamp to the second
      const sorted = sortChatMessagesChronologically(messages);
      onUpdate(sorted);
    },
    (err) => {
      logFirestoreSyncIssue('Chat messages sync', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeChatTypingStatus(
  onUpdate: (statusMap: Record<string, PartnerPresenceInfo>) => void
) {
  const colRef = collection(db, COLLECTIONS.CHAT_STATUS);
  return onSnapshot(
    colRef,
    (snap) => {
      const map: Record<string, PartnerPresenceInfo> = {};
      const nowMs = Date.now();
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.updatedAt) {
          const updatedMs = new Date(data.updatedAt).getTime();
          // Typing signal strictly expires after 4.2 seconds if not refreshed
          const isTypingFresh = nowMs - updatedMs < 4200;
          // Presence is considered online if lastSeen was within the last 65 seconds
          const lastSeenMs = data.lastSeen ? new Date(data.lastSeen).getTime() : updatedMs;
          const isOnlineFresh = Boolean(data.isOnline && nowMs - lastSeenMs < 65000);

          map[docSnap.id] = {
            partnerId: docSnap.id,
            isTyping: Boolean(data.isTyping && isTypingFresh),
            isOnline: isOnlineFresh,
            lastSeen: data.lastSeen || data.updatedAt,
            updatedAt: data.updatedAt,
          };
        }
      });
      onUpdate(map);
    },
    (err) => {
      logFirestoreSyncIssue('Typing status sync', err);
    }
  );
}

export { COLLECTIONS, sortChatMessagesChronologically, extractMessageTimestampMs };
