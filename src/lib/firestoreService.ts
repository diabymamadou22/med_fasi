import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
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
} from '../types';

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
}) {
  if (isSeedChecked) return;
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

    await batch.commit();
  } catch (error) {
    console.error('Erreur lors de la vérification initiale des données Firebase :', error);
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
      console.error('Firestore Profile sync error:', err);
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
      console.error(`Firestore sync error on ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
}

// Fonctions de sauvegarde et suppression avec assainissement systématique des données
export async function saveProfile(profile: CoupleProfile) {
  const ref = doc(db, COLLECTIONS.PROFILE, 'main_profile');
  await setDoc(ref, sanitizeForFirestore({ ...profile, id: 'main_profile' }), { merge: true });
}

export async function saveMemory(memory: TimelineMemory) {
  const ref = doc(db, COLLECTIONS.MEMORIES, memory.id);
  await setDoc(ref, sanitizeForFirestore(memory), { merge: true });
}

export async function deleteMemoryFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.MEMORIES, id));
}

export async function saveCapsule(capsule: TimeCapsule) {
  const ref = doc(db, COLLECTIONS.CAPSULES, capsule.id);
  await setDoc(ref, sanitizeForFirestore(capsule), { merge: true });
}

export async function deleteCapsuleFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.CAPSULES, id));
}

export async function saveLocation(location: MemoryLocation) {
  const ref = doc(db, COLLECTIONS.LOCATIONS, location.id);
  await setDoc(ref, sanitizeForFirestore(location), { merge: true });
}

export async function deleteLocationFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.LOCATIONS, id));
}

export async function saveSweetNote(note: SweetNote) {
  const ref = doc(db, COLLECTIONS.NOTES, note.id);
  await setDoc(ref, sanitizeForFirestore(note), { merge: true });
}

export async function deleteSweetNoteFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.NOTES, id));
}

export async function saveGratitude(gratitude: DailyGratitude) {
  const ref = doc(db, COLLECTIONS.GRATITUDES, gratitude.id);
  await setDoc(ref, sanitizeForFirestore(gratitude), { merge: true });
}

export async function deleteGratitudeFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.GRATITUDES, id));
}

export async function saveVoucher(voucher: LoveVoucher) {
  const ref = doc(db, COLLECTIONS.VOUCHERS, voucher.id);
  await setDoc(ref, sanitizeForFirestore(voucher), { merge: true });
}

export async function deleteVoucherFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.VOUCHERS, id));
}

export async function saveBucketItem(item: BucketItem) {
  const ref = doc(db, COLLECTIONS.BUCKET_LIST, item.id);
  await setDoc(ref, sanitizeForFirestore(item), { merge: true });
}

export async function deleteBucketItemFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.BUCKET_LIST, id));
}

export async function saveQuiz(quiz: QuizQuestion) {
  const ref = doc(db, COLLECTIONS.QUIZZES, quiz.id);
  await setDoc(ref, sanitizeForFirestore(quiz), { merge: true });
}

export async function saveDateIdea(idea: DateIdea) {
  const ref = doc(db, COLLECTIONS.DATES, idea.id);
  await setDoc(ref, sanitizeForFirestore(idea), { merge: true });
}

export async function saveChallenge(challenge: CoupleChallenge) {
  const ref = doc(db, COLLECTIONS.CHALLENGES, challenge.id);
  await setDoc(ref, sanitizeForFirestore(challenge), { merge: true });
}

export async function deleteChallengeFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.CHALLENGES, id));
}

export async function saveSettings(settings: CoupleSettings) {
  const ref = doc(db, COLLECTIONS.SETTINGS, 'main_settings');
  await setDoc(ref, sanitizeForFirestore({ ...settings, id: 'main_settings' }), { merge: true });
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
      console.error('Firestore Settings sync error:', err);
      if (onError) onError(err);
    }
  );
}

export async function sendMissYouPulse(pulse: MissYouPulse) {
  const ref = doc(db, COLLECTIONS.PULSES, pulse.id);
  await setDoc(ref, sanitizeForFirestore(pulse));
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
      console.error('Firestore Pulse sync error:', err);
      if (onError) onError(err);
    }
  );
}

// ---------------------------------------------------------------------------
// WhatsApp-style Real-time Chat
// ---------------------------------------------------------------------------

export async function saveChatMessage(message: ChatMessage) {
  const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, message.id);
  await setDoc(ref, sanitizeForFirestore(message), { merge: true });
}

export async function deleteChatMessageFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.CHAT_MESSAGES, id));
}

export async function updateChatMessageReaction(
  messageId: string,
  partnerId: string,
  reaction: string | null
) {
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
}

export async function updateChatMessageStatus(
  messageId: string,
  status: 'delivered' | 'read'
) {
  const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
  await setDoc(
    ref,
    {
      status,
      readStatus: status === 'read' ? 'read' : 'delivered',
    },
    { merge: true }
  );
}

export async function updateChatMessageReadStatus(
  messageId: string,
  readStatus: 'sent' | 'delivered' | 'read' | 'unread'
) {
  const ref = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
  await setDoc(
    ref,
    {
      readStatus,
      status: readStatus === 'read' ? 'read' : readStatus === 'delivered' ? 'delivered' : 'sent',
    },
    { merge: true }
  );
}

export async function setChatTypingStatus(partnerId: string, isTyping: boolean) {
  try {
    const ref = doc(db, COLLECTIONS.CHAT_STATUS, partnerId);
    await setDoc(ref, {
      partnerId,
      isTyping,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Erreur typing status:', err);
  }
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
      // Sort chronologically
      messages.sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
      onUpdate(messages);
    },
    (err) => {
      console.error('Firestore Chat messages sync error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeChatTypingStatus(
  onUpdate: (statusMap: Record<string, { isTyping: boolean; updatedAt: string }>) => void
) {
  const colRef = collection(db, COLLECTIONS.CHAT_STATUS);
  return onSnapshot(
    colRef,
    (snap) => {
      const map: Record<string, { isTyping: boolean; updatedAt: string }> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.updatedAt) {
          // Check if typing signal is fresh (within last 8 seconds)
          const isFresh = Date.now() - new Date(data.updatedAt).getTime() < 8000;
          map[docSnap.id] = {
            isTyping: Boolean(data.isTyping && isFresh),
            updatedAt: data.updatedAt,
          };
        }
      });
      onUpdate(map);
    },
    (err) => {
      console.error('Firestore typing status error:', err);
    }
  );
}

export { COLLECTIONS };
