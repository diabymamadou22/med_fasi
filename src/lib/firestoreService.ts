import {
  collection,
  doc,
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
} from '../types';

// Collections
const COLLECTIONS = {
  PROFILE: 'couple_profile',
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

// Initialisation / Seed des données si la base est vide
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
  try {
    const profileRef = doc(db, COLLECTIONS.PROFILE, 'main_profile');
    const memoriesCol = collection(db, COLLECTIONS.MEMORIES);
    const snap = await getDocs(memoriesCol);

    if (snap.empty) {
      const batch = writeBatch(db);

      // Seed profile
      batch.set(profileRef, { ...defaults.profile, id: 'main_profile' });

      // Seed memories
      defaults.memories.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.MEMORIES, item.id), item);
      });

      // Seed capsules
      defaults.capsules.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.CAPSULES, item.id), item);
      });

      // Seed locations
      defaults.locations.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.LOCATIONS, item.id), item);
      });

      // Seed notes
      defaults.notes.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.NOTES, item.id), item);
      });

      // Seed gratitudes
      defaults.gratitudes.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.GRATITUDES, item.id), item);
      });

      // Seed vouchers
      defaults.vouchers.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.VOUCHERS, item.id), item);
      });

      // Seed bucket list
      defaults.bucketList.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.BUCKET_LIST, item.id), item);
      });

      // Seed quizzes
      if (defaults.quizzes) {
        defaults.quizzes.forEach((item) => {
          batch.set(doc(db, COLLECTIONS.QUIZZES, item.id), item);
        });
      }

      // Seed dates
      if (defaults.dateIdeas) {
        defaults.dateIdeas.forEach((item) => {
          batch.set(doc(db, COLLECTIONS.DATES, item.id), item);
        });
      }

      // Seed challenges
      if (defaults.challenges) {
        defaults.challenges.forEach((item) => {
          batch.set(doc(db, COLLECTIONS.CHALLENGES, item.id), item);
        });
      }

      // Seed settings
      if (defaults.settings) {
        batch.set(doc(db, COLLECTIONS.SETTINGS, 'main_settings'), {
          ...defaults.settings,
          id: 'main_settings',
        });
      }

      await batch.commit();
    }
  } catch (error) {
    console.error('Erreur lors de l’initialisation des données Firebase :', error);
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

// Fonctions de sauvegarde et suppression
export async function saveProfile(profile: CoupleProfile) {
  const ref = doc(db, COLLECTIONS.PROFILE, 'main_profile');
  await setDoc(ref, { ...profile, id: 'main_profile' }, { merge: true });
}

export async function saveMemory(memory: TimelineMemory) {
  const ref = doc(db, COLLECTIONS.MEMORIES, memory.id);
  await setDoc(ref, memory, { merge: true });
}

export async function deleteMemoryFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.MEMORIES, id));
}

export async function saveCapsule(capsule: TimeCapsule) {
  const ref = doc(db, COLLECTIONS.CAPSULES, capsule.id);
  await setDoc(ref, capsule, { merge: true });
}

export async function deleteCapsuleFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.CAPSULES, id));
}

export async function saveLocation(location: MemoryLocation) {
  const ref = doc(db, COLLECTIONS.LOCATIONS, location.id);
  await setDoc(ref, location, { merge: true });
}

export async function deleteLocationFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.LOCATIONS, id));
}

export async function saveSweetNote(note: SweetNote) {
  const ref = doc(db, COLLECTIONS.NOTES, note.id);
  await setDoc(ref, note, { merge: true });
}

export async function deleteSweetNoteFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.NOTES, id));
}

export async function saveGratitude(gratitude: DailyGratitude) {
  const ref = doc(db, COLLECTIONS.GRATITUDES, gratitude.id);
  await setDoc(ref, gratitude, { merge: true });
}

export async function deleteGratitudeFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.GRATITUDES, id));
}

export async function saveVoucher(voucher: LoveVoucher) {
  const ref = doc(db, COLLECTIONS.VOUCHERS, voucher.id);
  await setDoc(ref, voucher, { merge: true });
}

export async function deleteVoucherFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.VOUCHERS, id));
}

export async function saveBucketItem(item: BucketItem) {
  const ref = doc(db, COLLECTIONS.BUCKET_LIST, item.id);
  await setDoc(ref, item, { merge: true });
}

export async function deleteBucketItemFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.BUCKET_LIST, id));
}

export async function saveQuiz(quiz: QuizQuestion) {
  const ref = doc(db, COLLECTIONS.QUIZZES, quiz.id);
  await setDoc(ref, quiz, { merge: true });
}

export async function saveDateIdea(idea: DateIdea) {
  const ref = doc(db, COLLECTIONS.DATES, idea.id);
  await setDoc(ref, idea, { merge: true });
}

export async function saveChallenge(challenge: CoupleChallenge) {
  const ref = doc(db, COLLECTIONS.CHALLENGES, challenge.id);
  await setDoc(ref, challenge, { merge: true });
}

export async function deleteChallengeFromDb(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.CHALLENGES, id));
}

export async function saveSettings(settings: CoupleSettings) {
  const ref = doc(db, COLLECTIONS.SETTINGS, 'main_settings');
  await setDoc(ref, { ...settings, id: 'main_settings' }, { merge: true });
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
  await setDoc(ref, pulse);
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

export { COLLECTIONS };
