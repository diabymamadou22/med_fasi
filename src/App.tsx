import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { Header } from './components/Header';
import { Navigation, MainTab } from './components/Navigation';
import { MoodAndNeedsBar } from './components/MoodAndNeedsBar';
import { MissYouModal } from './components/MissYouModal';
import { JournalView } from './components/views/JournalView';
import { TimelineView } from './components/views/TimelineView';
import { SharedGalleryView, GalleryItem } from './components/views/SharedGalleryView';
import { GamesView } from './components/views/GamesView';
import { VouchersAndBucketView } from './components/views/VouchersAndBucketView';
import { WriteNoteModal } from './components/modals/WriteNoteModal';
import { AddMemoryModal } from './components/modals/AddMemoryModal';
import { AddCapsuleModal } from './components/modals/AddCapsuleModal';
import { AddLocationModal } from './components/modals/AddLocationModal';
import { AddVoucherModal } from './components/modals/AddVoucherModal';
import { AddBucketModal } from './components/modals/AddBucketModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { PinLockModal } from './components/modals/PinLockModal';
import { PWAInstallModal } from './components/modals/PWAInstallModal';
import { soundEffects } from './lib/audio';
import { triggerCelebrationConfetti } from './lib/confetti';
import {
  CoupleProfile,
  PartnerId,
  TimelineMemory,
  TimeCapsule,
  MemoryLocation,
  SweetNote,
  QuizQuestion,
  DateIdea,
  CoupleChallenge,
  BucketItem,
  LoveVoucher,
  DailyGratitude,
  MissYouPulse,
  CoupleSettings,
  FullCoupleBackup,
} from './types';
import {
  INITIAL_PROFILE,
  INITIAL_MEMORIES,
  INITIAL_CAPSULES,
  INITIAL_LOCATIONS,
  INITIAL_NOTES,
  INITIAL_QUIZZES,
  INITIAL_DATE_IDEAS,
  INITIAL_CHALLENGES,
  INITIAL_BUCKET_LIST,
  INITIAL_VOUCHERS,
  INITIAL_GRATITUDES,
} from './data/initialData';
import {
  seedInitialDataIfEmpty,
  subscribeProfile,
  subscribeCollection,
  subscribeSettings,
  subscribeLatestPulse,
  saveProfile,
  saveMemory,
  deleteMemoryFromDb,
  saveCapsule,
  deleteCapsuleFromDb,
  saveLocation,
  deleteLocationFromDb,
  saveSweetNote,
  deleteSweetNoteFromDb,
  saveGratitude,
  deleteGratitudeFromDb,
  saveVoucher,
  deleteVoucherFromDb,
  saveBucketItem,
  deleteBucketItemFromDb,
  saveQuiz,
  saveDateIdea,
  saveChallenge,
  deleteChallengeFromDb,
  saveSettings,
  sendMissYouPulse,
  COLLECTIONS,
} from './lib/firestoreService';

const STORAGE_KEYS = {
  PROFILE: 'nid_damour_profile',
  MEMORIES: 'nid_damour_memories',
  CAPSULES: 'nid_damour_capsules',
  LOCATIONS: 'nid_damour_locations',
  NOTES: 'nid_damour_notes',
  QUIZZES: 'nid_damour_quizzes',
  DATES: 'nid_damour_dates',
  CHALLENGES: 'nid_damour_challenges',
  BUCKET: 'nid_damour_bucket',
  VOUCHERS: 'nid_damour_vouchers',
  GRATITUDES: 'nid_damour_gratitudes',
  ACTIVE_PARTNER: 'nid_damour_active_partner',
  SETTINGS: 'nid_damour_settings',
};

export default function App() {
  // Active partner (p1 or p2)
  const [activePartnerId, setActivePartnerId] = useState<PartnerId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PARTNER);
    return (saved as PartnerId) || 'p1';
  });

  // Main active tab
  const [activeTab, setActiveTab] = useState<MainTab>('journal');

  // Couple Data States with localStorage initialization
  const [profile, setProfile] = useState<CoupleProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.partner1?.name === 'Léa' ||
          parsed?.partner2?.name === 'Thomas' ||
          parsed?.relationshipTitle === 'Léa & Thomas'
        ) {
          const updated = {
            ...parsed,
            partner1: {
              ...parsed.partner1,
              name: parsed.partner1?.name === 'Léa' ? 'Safi' : parsed.partner1?.name,
            },
            partner2: {
              ...parsed.partner2,
              name: parsed.partner2?.name === 'Thomas' ? 'Med' : parsed.partner2?.name,
            },
            relationshipTitle:
              parsed.relationshipTitle === 'Léa & Thomas'
                ? 'Med & Safi'
                : parsed.relationshipTitle,
          };
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
          return updated;
        }
        return parsed;
      }
      return INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  const [memories, setMemories] = useState<TimelineMemory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [capsules, setCapsules] = useState<TimeCapsule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAPSULES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [locations, setLocations] = useState<MemoryLocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notes, setNotes] = useState<SweetNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quizzes, setQuizzes] = useState<QuizQuestion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
    } catch {
      return INITIAL_QUIZZES;
    }
  });

  const [dateIdeas, setDateIdeas] = useState<DateIdea[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DATES);
      return saved ? JSON.parse(saved) : INITIAL_DATE_IDEAS;
    } catch {
      return INITIAL_DATE_IDEAS;
    }
  });

  const [challenges, setChallenges] = useState<CoupleChallenge[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return saved ? JSON.parse(saved) : INITIAL_CHALLENGES;
    } catch {
      return INITIAL_CHALLENGES;
    }
  });

  const [bucketList, setBucketList] = useState<BucketItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUCKET);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [vouchers, setVouchers] = useState<LoveVoucher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [gratitudes, setGratitudes] = useState<DailyGratitude[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRATITUDES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Couple Settings (PIN, Romantic Music, Ambiance)
  const [settings, setSettings] = useState<CoupleSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved
        ? JSON.parse(saved)
        : {
            isPinEnabled: false,
            pinCode: '1234',
            songTitle: "Sidiki Diabaté - C'est bon",
            ambientTrackId: 'kora_serenade',
            musicVolume: 0.35,
            isMusicPlaying: false,
          };
    } catch {
      return {
        isPinEnabled: false,
        pinCode: '1234',
        songTitle: "Sidiki Diabaté - C'est bon",
        ambientTrackId: 'kora_serenade',
        musicVolume: 0.35,
        isMusicPlaying: false,
      };
    }
  });

  // App lock state
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isPinEnabled);
      }
    } catch {}
    return false;
  });

  // Real-time Miss You Pulse state
  const [activeMissYouPulse, setActiveMissYouPulse] = useState<MissYouPulse | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // Protection contre le reset des données sur un nouvel appareil ou rafraîchissement
  const [isInitialRemoteLoaded, setIsInitialRemoteLoaded] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(STORAGE_KEYS.PROFILE));
  });

  // Sécurité pour débloquer l'interface même si la connexion est lente ou hors ligne
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialRemoteLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFocusPartner, setProfileFocusPartner] = useState<PartnerId | undefined>(undefined);
  const [showWriteNoteModal, setShowWriteNoteModal] = useState(false);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [showAddCapsuleModal, setShowAddCapsuleModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddVoucherModal, setShowAddVoucherModal] = useState(false);
  const [showAddBucketModal, setShowAddBucketModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Edit states for existing items
  const [editingMemory, setEditingMemory] = useState<TimelineMemory | null>(null);
  const [editingNote, setEditingNote] = useState<SweetNote | null>(null);
  const [editingCapsule, setEditingCapsule] = useState<TimeCapsule | null>(null);
  const [editingLocation, setEditingLocation] = useState<MemoryLocation | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<LoveVoucher | null>(null);
  const [editingBucketItem, setEditingBucketItem] = useState<BucketItem | null>(null);

  // Generic delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<{
    title: string;
    itemType: string;
    itemName?: string;
    onConfirm: () => void;
  } | null>(null);

  // Initial seed to Firebase if database is empty
  useEffect(() => {
    seedInitialDataIfEmpty({
      profile: INITIAL_PROFILE,
      memories: INITIAL_MEMORIES,
      capsules: INITIAL_CAPSULES,
      locations: INITIAL_LOCATIONS,
      notes: INITIAL_NOTES,
      gratitudes: INITIAL_GRATITUDES,
      vouchers: INITIAL_VOUCHERS,
      bucketList: INITIAL_BUCKET_LIST,
      quizzes: INITIAL_QUIZZES,
      dateIdeas: INITIAL_DATE_IDEAS,
      challenges: INITIAL_CHALLENGES,
    });
  }, []);

  // Real-time Firestore subscriptions
  useEffect(() => {
    const unsubProfile = subscribeProfile(
      (remoteProfile) => {
        if (remoteProfile) {
          setProfile(remoteProfile);
          setIsCloudSynced(true);
          setIsInitialRemoteLoaded(true);
        }
      },
      () => {
        setIsCloudSynced(false);
        setIsInitialRemoteLoaded(true);
      }
    );

    const unsubMemories = subscribeCollection<TimelineMemory>(
      COLLECTIONS.MEMORIES,
      (remoteMemories) => {
        if (Array.isArray(remoteMemories)) {
          setMemories(remoteMemories);
          setIsCloudSynced(true);
          setIsInitialRemoteLoaded(true);
        }
      },
      () => {
        setIsCloudSynced(false);
        setIsInitialRemoteLoaded(true);
      }
    );

    const unsubCapsules = subscribeCollection<TimeCapsule>(
      COLLECTIONS.CAPSULES,
      (remoteCapsules) => {
        if (Array.isArray(remoteCapsules)) {
          setCapsules(remoteCapsules);
        }
      }
    );

    const unsubLocations = subscribeCollection<MemoryLocation>(
      COLLECTIONS.LOCATIONS,
      (remoteLocations) => {
        if (Array.isArray(remoteLocations)) {
          setLocations(remoteLocations);
        }
      }
    );

    const unsubNotes = subscribeCollection<SweetNote>(
      COLLECTIONS.NOTES,
      (remoteNotes) => {
        if (Array.isArray(remoteNotes)) {
          // Sort newest first
          const sorted = [...remoteNotes].sort((a, b) => b.id.localeCompare(a.id));
          setNotes(sorted);
        }
      }
    );

    const unsubGratitudes = subscribeCollection<DailyGratitude>(
      COLLECTIONS.GRATITUDES,
      (remoteGratitudes) => {
        if (Array.isArray(remoteGratitudes)) {
          const sorted = [...remoteGratitudes].sort((a, b) => b.id.localeCompare(a.id));
          setGratitudes(sorted);
        }
      }
    );

    const unsubVouchers = subscribeCollection<LoveVoucher>(
      COLLECTIONS.VOUCHERS,
      (remoteVouchers) => {
        if (Array.isArray(remoteVouchers)) {
          setVouchers(remoteVouchers);
        }
      }
    );

    const unsubBucket = subscribeCollection<BucketItem>(
      COLLECTIONS.BUCKET_LIST,
      (remoteBucket) => {
        if (Array.isArray(remoteBucket)) {
          setBucketList(remoteBucket);
        }
      }
    );

    const unsubQuizzes = subscribeCollection<QuizQuestion>(
      COLLECTIONS.QUIZZES,
      (remoteQuizzes) => {
        if (Array.isArray(remoteQuizzes)) {
          setQuizzes(remoteQuizzes);
        }
      }
    );

    const unsubDates = subscribeCollection<DateIdea>(
      COLLECTIONS.DATES,
      (remoteDates) => {
        if (Array.isArray(remoteDates)) {
          setDateIdeas(remoteDates);
        }
      }
    );

    const unsubChallenges = subscribeCollection<CoupleChallenge>(
      COLLECTIONS.CHALLENGES,
      (remoteChallenges) => {
        if (Array.isArray(remoteChallenges)) {
          setChallenges(remoteChallenges);
        }
      }
    );

    const unsubSettings = subscribeSettings(
      (remoteSettings) => {
        if (remoteSettings) {
          setSettings((prev) => ({
            ...prev,
            ...remoteSettings,
            // Preserve local playing audio flag so sound doesn't auto-start abruptly
            isMusicPlaying: prev.isMusicPlaying,
          }));
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubPulse = subscribeLatestPulse((pulse) => {
      if (pulse && pulse.senderId !== activePartnerId) {
        setActiveMissYouPulse(pulse);
        soundEffects.playHeartPulse();
      }
    });

    return () => {
      unsubProfile();
      unsubMemories();
      unsubCapsules();
      unsubLocations();
      unsubNotes();
      unsubGratitudes();
      unsubVouchers();
      unsubBucket();
      unsubQuizzes();
      unsubDates();
      unsubChallenges();
      unsubSettings();
      unsubPulse();
    };
  }, [activePartnerId]);

  // Sync state to localStorage as offline fallback (uniquement après chargement initial)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PARTNER, activePartnerId);
  }, [activePartnerId]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  }, [memories, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.CAPSULES, JSON.stringify(capsules));
  }, [capsules, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  }, [locations, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  }, [quizzes, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.DATES, JSON.stringify(dateIdeas));
  }, [dateIdeas, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  }, [challenges, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.BUCKET, JSON.stringify(bucketList));
  }, [bucketList, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
  }, [vouchers, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.GRATITUDES, JSON.stringify(gratitudes));
  }, [gratitudes, isInitialRemoteLoaded]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings, isInitialRemoteLoaded]);

  // Export full JSON backup
  const handleExportBackup = () => {
    const backup: FullCoupleBackup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      profile,
      memories,
      capsules,
      locations,
      notes,
      quizzes,
      dateIdeas,
      challenges,
      bucketList,
      vouchers,
      gratitudes,
      settings,
    };
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    const p1 = (profile.partner1?.name || 'safi').toLowerCase();
    const p2 = (profile.partner2?.name || 'med').toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    const filename = `nid_damour_${p1}_${p2}_sauvegarde_${today}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    soundEffects.playSuccessSparkle();
  };

  // Import full JSON backup
  const handleImportBackup = (backup: FullCoupleBackup) => {
    if (backup.profile) setProfile(backup.profile);
    if (backup.memories) setMemories(backup.memories);
    if (backup.capsules) setCapsules(backup.capsules);
    if (backup.locations) setLocations(backup.locations);
    if (backup.notes) setNotes(backup.notes);
    if (backup.quizzes) setQuizzes(backup.quizzes);
    if (backup.dateIdeas) setDateIdeas(backup.dateIdeas);
    if (backup.challenges) setChallenges(backup.challenges);
    if (backup.bucketList) setBucketList(backup.bucketList);
    if (backup.vouchers) setVouchers(backup.vouchers);
    if (backup.gratitudes) setGratitudes(backup.gratitudes);
    if (backup.settings) setSettings(backup.settings);
  };

  const handleUpdateSettings = (newSettings: Partial<CoupleSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated).catch(console.error);
      return updated;
    });
  };

  // Actions
  const handleSwitchPartner = (id: PartnerId) => {
    setActivePartnerId(id);
  };

  const handleUpdateMood = (
    partnerId: PartnerId,
    newMood: { energy: number; status: string; need: string; note?: string }
  ) => {
    const formattedTime =
      "Aujourd'hui à " +
      new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });

    const updatedProfile: CoupleProfile = {
      ...profile,
      [partnerId === 'p1' ? 'partner1' : 'partner2']: {
        ...profile[partnerId === 'p1' ? 'partner1' : 'partner2'],
        mood: {
          ...newMood,
          lastUpdated: formattedTime,
        },
      },
    };

    setProfile(updatedProfile);
    saveProfile(updatedProfile).catch(console.error);
  };

  const handleSendMissYou = (vibe: MissYouPulse['vibe'], message: string) => {
    const pulse: MissYouPulse = {
      id: `pulse-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      senderId: activePartnerId,
      vibe,
      message,
    };
    setActiveMissYouPulse(pulse);
    sendMissYouPulse(pulse).catch(console.error);
  };

  // Notes actions
  const handleSendNote = (newNoteData: Omit<SweetNote, 'id' | 'isRead' | 'isFavorite'>) => {
    const newNote: SweetNote = {
      id: `note-${Date.now()}`,
      ...newNoteData,
      isRead: false,
      isFavorite: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    saveSweetNote(newNote).catch(console.error);
  };

  const handleMarkNoteAsRead = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      const updatedNote = { ...note, isRead: true, readAt: "Aujourd'hui" };
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? updatedNote : n))
      );
      saveSweetNote(updatedNote).catch(console.error);
    }
  };

  const handleToggleFavoriteNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      const updatedNote = { ...note, isFavorite: !note.isFavorite };
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? updatedNote : n))
      );
      saveSweetNote(updatedNote).catch(console.error);
    }
  };

  const handleReactNote = (noteId: string, emoji: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      const updatedNote = { ...note, reaction: emoji };
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? updatedNote : n))
      );
      saveSweetNote(updatedNote).catch(console.error);
    }
  };

  // Gratitude actions
  const handleAddGratitude = (content: string) => {
    const newGrat: DailyGratitude = {
      id: `grat-${Date.now()}`,
      date: "Aujourd'hui",
      authorId: activePartnerId,
      content,
      likes: [activePartnerId],
    };
    setGratitudes((prev) => [newGrat, ...prev]);
    saveGratitude(newGrat).catch(console.error);
  };

  const handleLikeGratitude = (gratId: string) => {
    const grat = gratitudes.find((g) => g.id === gratId);
    if (grat) {
      const hasLiked = grat.likes.includes(activePartnerId);
      const updatedGrat = {
        ...grat,
        likes: hasLiked
          ? grat.likes.filter((id) => id !== activePartnerId)
          : [...grat.likes, activePartnerId],
      };
      setGratitudes((prev) =>
        prev.map((g) => (g.id === gratId ? updatedGrat : g))
      );
      saveGratitude(updatedGrat).catch(console.error);
    }
  };

  // Memory actions
  const handleAddMemory = (memData: Omit<TimelineMemory, 'id' | 'likes'>) => {
    const newMem: TimelineMemory = {
      id: `mem-${Date.now()}`,
      ...memData,
      likes: [activePartnerId],
    };
    setMemories((prev) => [newMem, ...prev]);
    saveMemory(newMem).catch(console.error);
  };

  const handleLikeMemory = (memId: string) => {
    const mem = memories.find((m) => m.id === memId);
    if (mem) {
      const hasLiked = mem.likes.includes(activePartnerId);
      const updatedMem = {
        ...mem,
        likes: hasLiked
          ? mem.likes.filter((id) => id !== activePartnerId)
          : [...mem.likes, activePartnerId],
      };
      setMemories((prev) =>
        prev.map((m) => (m.id === memId ? updatedMem : m))
      );
      saveMemory(updatedMem).catch(console.error);
    }
  };

  // Capsule actions
  const handleAddCapsule = (capData: Omit<TimeCapsule, 'id' | 'createdAt' | 'isOpened'>) => {
    const newCap: TimeCapsule = {
      id: `cap-${Date.now()}`,
      ...capData,
      createdAt: new Date().toISOString().split('T')[0],
      isOpened: false,
    };
    setCapsules((prev) => [newCap, ...prev]);
    saveCapsule(newCap).catch(console.error);
  };

  const handleUnlockCapsule = (capId: string) => {
    const cap = capsules.find((c) => c.id === capId);
    if (cap) {
      const updatedCap = { ...cap, isOpened: true };
      setCapsules((prev) =>
        prev.map((c) => (c.id === capId ? updatedCap : c))
      );
      saveCapsule(updatedCap).catch(console.error);
    }
  };

  // Location actions
  const handleAddLocation = (locData: Omit<MemoryLocation, 'id'>) => {
    const newLoc: MemoryLocation = {
      id: `loc-${Date.now()}`,
      ...locData,
    };
    setLocations((prev) => [...prev, newLoc]);
    saveLocation(newLoc).catch(console.error);
  };

  // Quiz actions
  const handleAnswerQuiz = (
    quizId: string,
    partnerId: PartnerId,
    answerIndex: number
  ) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (quiz) {
      const updatedQuiz = {
        ...quiz,
        [partnerId === 'p1' ? 'partner1Answer' : 'partner2Answer']: answerIndex,
      };
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? updatedQuiz : q))
      );
      saveQuiz(updatedQuiz).catch(console.error);
    }
  };

  const handleAddNewQuiz = (newQ: QuizQuestion) => {
    setQuizzes((prev) => [...prev, newQ]);
    saveQuiz(newQ).catch(console.error);
  };

  // Date ideas actions
  const handleSaveDateIdea = (idea: DateIdea) => {
    const updatedIdea = { ...idea, isSaved: true };
    setDateIdeas((prev) =>
      prev.map((d) => (d.id === idea.id ? updatedIdea : d))
    );
    saveDateIdea(updatedIdea).catch(console.error);
  };

  const handleAddNewDateIdea = (idea: DateIdea) => {
    setDateIdeas((prev) => [idea, ...prev]);
    saveDateIdea(idea).catch(console.error);
  };

  // Challenge actions
  const handleToggleChallenge = (challengeId: string) => {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (challenge) {
      const updated = {
        ...challenge,
        isCompleted: !challenge.isCompleted,
        completedDate: !challenge.isCompleted ? "Aujourd'hui" : undefined,
      };
      setChallenges((prev) =>
        prev.map((c) => (c.id === challengeId ? updated : c))
      );
      saveChallenge(updated).catch(console.error);
    }
  };

  // Voucher actions
  const handleRedeemVoucher = (voucherId: string) => {
    const formattedDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const voucher = vouchers.find((v) => v.id === voucherId);
    if (voucher) {
      const updated = { ...voucher, isRedeemed: true, redeemedAt: formattedDate };
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucherId ? updated : v))
      );
      saveVoucher(updated).catch(console.error);
    }
  };

  const handleAddVoucher = (
    voucherData: Omit<LoveVoucher, 'id' | 'isRedeemed'>
  ) => {
    const newV: LoveVoucher = {
      id: `vouch-${Date.now()}`,
      ...voucherData,
      isRedeemed: false,
    };
    setVouchers((prev) => [newV, ...prev]);
    saveVoucher(newV).catch(console.error);
  };

  // Bucket actions
  const handleAddBucketItem = (itemData: Omit<BucketItem, 'id' | 'status'>) => {
    const newB: BucketItem = {
      id: `buck-${Date.now()}`,
      ...itemData,
      status: 'todo',
    };
    setBucketList((prev) => [...prev, newB]);
    saveBucketItem(newB).catch(console.error);
  };

  const handleUpdateBucketStatus = (
    itemId: string,
    status: BucketItem['status']
  ) => {
    const item = bucketList.find((b) => b.id === itemId);
    if (item) {
      const updated = { ...item, status };
      setBucketList((prev) =>
        prev.map((b) => (b.id === itemId ? updated : b))
      );
      saveBucketItem(updated).catch(console.error);
    }
  };

  // Edit & Delete handlers for all couple entities
  const handleUpdateMemory = (updated: TimelineMemory) => {
    setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setEditingMemory(null);
    saveMemory(updated).catch(console.error);
  };

  const handleDeleteMemory = (memoryId: string) => {
    const mem = memories.find((m) => m.id === memoryId);
    setDeleteTarget({
      title: 'Supprimer ce souvenir ?',
      itemType: 'souvenir',
      itemName: mem?.title,
      onConfirm: () => {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
        setEditingMemory(null);
        deleteMemoryFromDb(memoryId).catch(console.error);
      },
    });
  };

  const handleUpdateNote = (updated: SweetNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setEditingNote(null);
    saveSweetNote(updated).catch(console.error);
  };

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    setDeleteTarget({
      title: 'Supprimer ce mot doux ?',
      itemType: 'mot doux',
      itemName: note?.content ? `« ${note.content.slice(0, 35)}... »` : undefined,
      onConfirm: () => {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        setEditingNote(null);
        deleteSweetNoteFromDb(noteId).catch(console.error);
      },
    });
  };

  const handleDeleteGratitude = (gratId: string) => {
    const grat = gratitudes.find((g) => g.id === gratId);
    setDeleteTarget({
      title: 'Supprimer cette pensée de gratitude ?',
      itemType: 'gratitude',
      itemName: grat?.content ? `« ${grat.content.slice(0, 35)}... »` : undefined,
      onConfirm: () => {
        setGratitudes((prev) => prev.filter((g) => g.id !== gratId));
        deleteGratitudeFromDb(gratId).catch(console.error);
      },
    });
  };

  const handleUpdateCapsule = (updated: TimeCapsule) => {
    setCapsules((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingCapsule(null);
    saveCapsule(updated).catch(console.error);
  };

  const handleDeleteCapsule = (capId: string) => {
    const cap = capsules.find((c) => c.id === capId);
    setDeleteTarget({
      title: 'Supprimer cette capsule temporelle ?',
      itemType: 'capsule temporelle',
      itemName: cap?.title,
      onConfirm: () => {
        setCapsules((prev) => prev.filter((c) => c.id !== capId));
        setEditingCapsule(null);
        deleteCapsuleFromDb(capId).catch(console.error);
      },
    });
  };

  const handleUpdateLocation = (updated: MemoryLocation) => {
    setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditingLocation(null);
    saveLocation(updated).catch(console.error);
  };

  const handleDeleteLocation = (locId: string) => {
    const loc = locations.find((l) => l.id === locId);
    setDeleteTarget({
      title: 'Supprimer ce lieu précieux ?',
      itemType: 'lieu',
      itemName: loc?.name,
      onConfirm: () => {
        setLocations((prev) => prev.filter((l) => l.id !== locId));
        setEditingLocation(null);
        deleteLocationFromDb(locId).catch(console.error);
      },
    });
  };

  const handleUpdateVoucher = (updated: LoveVoucher) => {
    setVouchers((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setEditingVoucher(null);
    saveVoucher(updated).catch(console.error);
  };

  const handleDeleteVoucher = (voucherId: string) => {
    const v = vouchers.find((item) => item.id === voucherId);
    setDeleteTarget({
      title: "Supprimer ce bon d'amour ?",
      itemType: "bon d'amour",
      itemName: v?.title,
      onConfirm: () => {
        setVouchers((prev) => prev.filter((item) => item.id !== voucherId));
        setEditingVoucher(null);
        deleteVoucherFromDb(voucherId).catch(console.error);
      },
    });
  };

  const handleUpdateBucketItem = (updated: BucketItem) => {
    setBucketList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingBucketItem(null);
    saveBucketItem(updated).catch(console.error);
  };

  const handleDeleteBucketItem = (itemId: string) => {
    const item = bucketList.find((b) => b.id === itemId);
    setDeleteTarget({
      title: 'Supprimer ce souhait de la Bucket List ?',
      itemType: 'souhait',
      itemName: item?.title,
      onConfirm: () => {
        setBucketList((prev) => prev.filter((b) => b.id !== itemId));
        setEditingBucketItem(null);
        deleteBucketItemFromDb(itemId).catch(console.error);
      },
    });
  };

  const handleDeleteChallenge = (challengeId: string) => {
    const chal = challenges.find((c) => c.id === challengeId);
    setDeleteTarget({
      title: 'Supprimer ce défi ?',
      itemType: 'défi',
      itemName: chal?.title,
      onConfirm: () => {
        setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
        deleteChallengeFromDb(challengeId).catch(console.error);
      },
    });
  };

  const handleRemoveMemoryPhoto = (memoryId: string) => {
    const mem = memories.find((m) => m.id === memoryId);
    if (!mem) return;
    setDeleteTarget({
      title: 'Supprimer la photo de ce souvenir ?',
      itemType: 'photo de souvenir',
      itemName: mem.title,
      message: 'La photo sera retirée du souvenir, mais votre texte et vos anecdotes restent conservés.',
      onConfirm: () => {
        const updated = { ...mem, photoUrl: '' };
        setMemories((prev) => prev.map((m) => (m.id === memoryId ? updated : m)));
        saveMemory(updated).catch(console.error);
      },
    });
  };

  const handleRemoveLocationPhoto = (locationId: string) => {
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return;
    setDeleteTarget({
      title: 'Supprimer la photo de ce lieu ?',
      itemType: 'photo de lieu',
      itemName: loc.name,
      message: 'La photo sera supprimée du lieu, mais vos notes sur cet endroit restent enregistrées.',
      onConfirm: () => {
        const updated = { ...loc, photoUrl: '' };
        setLocations((prev) => prev.map((l) => (l.id === locationId ? updated : l)));
        saveLocation(updated).catch(console.error);
      },
    });
  };

  const handleRemoveCapsulePhoto = (capsuleId: string) => {
    const cap = capsules.find((c) => c.id === capsuleId);
    if (!cap) return;
    setDeleteTarget({
      title: 'Supprimer la photo de cette capsule ?',
      itemType: 'photo de capsule',
      itemName: cap.title,
      message: 'La photo sera retirée, mais votre message scellé restera préservé.',
      onConfirm: () => {
        const updated = { ...cap, photoUrl: '' };
        setCapsules((prev) => prev.map((c) => (c.id === capsuleId ? updated : c)));
        saveCapsule(updated).catch(console.error);
      },
    });
  };

  const handleRemoveBucketPhoto = (itemId: string) => {
    const item = bucketList.find((b) => b.id === itemId);
    if (!item) return;
    setDeleteTarget({
      title: 'Supprimer la photo de ce souhait ?',
      itemType: 'photo de souhait',
      itemName: item.title,
      message: 'La photo d’illustration sera retirée de ce souhait de la Bucket List.',
      onConfirm: () => {
        const updated = { ...item, photoUrl: '' };
        setBucketList((prev) => prev.map((b) => (b.id === itemId ? updated : b)));
        saveBucketItem(updated).catch(console.error);
      },
    });
  };

  const handleRemoveChallengePhoto = (challengeId: string) => {
    const chal = challenges.find((c) => c.id === challengeId);
    if (!chal) return;
    setDeleteTarget({
      title: 'Supprimer la photo de ce défi ?',
      itemType: 'photo de preuve',
      itemName: chal.title,
      message: 'La photo de preuve sera retirée de ce défi de couple.',
      onConfirm: () => {
        const updated = challenges.map((c) =>
          c.id === challengeId ? { ...c, photoProof: '' } : c
        );
        setChallenges(updated);
        const itemToSave = updated.find((c) => c.id === challengeId);
        if (itemToSave) saveChallenge(itemToSave).catch(console.error);
      },
    });
  };

  const handleRemoveProfilePhoto = (partnerId: PartnerId) => {
    const partnerKey = partnerId === 'p1' ? 'partner1' : 'partner2';
    const partnerName = profile[partnerKey]?.name || 'Profil';
    setDeleteTarget({
      title: 'Retirer la photo de profil ?',
      itemType: 'photo de profil',
      itemName: partnerName,
      message: 'La photo sera retirée et remplacée par la jolie initiale par défaut.',
      onConfirm: () => {
        const updatedProfile: CoupleProfile = {
          ...profile,
          [partnerKey]: {
            ...profile[partnerKey],
            avatar: '',
          },
        };
        setProfile(updatedProfile);
        saveProfile(updatedProfile).catch(console.error);
      },
    });
  };

  // Delete media item from Gallery
  const handleDeleteMediaItem = (item: GalleryItem) => {
    if (item.sourceType === 'memory' && item.originalEntityId) {
      handleDeleteMemory(item.originalEntityId);
    } else if (item.sourceType === 'location' && item.originalEntityId) {
      handleDeleteLocation(item.originalEntityId);
    } else if (item.sourceType === 'capsule' && item.originalEntityId) {
      handleDeleteCapsule(item.originalEntityId);
    } else if (item.sourceType === 'bucket' && item.originalEntityId) {
      handleDeleteBucketItem(item.originalEntityId);
    } else if (item.sourceType === 'challenge' && item.originalEntityId) {
      handleRemoveChallengePhoto(item.originalEntityId);
    } else if (item.sourceType === 'profile') {
      const pId = item.authorId === 'p1' || item.authorId === 'p2' ? item.authorId : 'p1';
      handleRemoveProfilePhoto(pId as PartnerId);
    }
  };

  // Remove photo only from Gallery item
  const handleRemovePhotoOnly = (item: GalleryItem) => {
    if (item.sourceType === 'memory' && item.originalEntityId) {
      handleRemoveMemoryPhoto(item.originalEntityId);
    } else if (item.sourceType === 'location' && item.originalEntityId) {
      handleRemoveLocationPhoto(item.originalEntityId);
    } else if (item.sourceType === 'capsule' && item.originalEntityId) {
      handleRemoveCapsulePhoto(item.originalEntityId);
    } else if (item.sourceType === 'bucket' && item.originalEntityId) {
      handleRemoveBucketPhoto(item.originalEntityId);
    } else if (item.sourceType === 'challenge' && item.originalEntityId) {
      handleRemoveChallengePhoto(item.originalEntityId);
    } else if (item.sourceType === 'profile') {
      const pId = item.authorId === 'p1' || item.authorId === 'p2' ? item.authorId : 'p1';
      handleRemoveProfilePhoto(pId as PartnerId);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    setProfile(INITIAL_PROFILE);
    setMemories(INITIAL_MEMORIES);
    setCapsules(INITIAL_CAPSULES);
    setLocations(INITIAL_LOCATIONS);
    setNotes(INITIAL_NOTES);
    setQuizzes(INITIAL_QUIZZES);
    setDateIdeas(INITIAL_DATE_IDEAS);
    setChallenges(INITIAL_CHALLENGES);
    setBucketList(INITIAL_BUCKET_LIST);
    setVouchers(INITIAL_VOUCHERS);
    setGratitudes(INITIAL_GRATITUDES);
    localStorage.clear();
  };

  const unreadNotesCount = notes.filter(
    (n) => n.recipientId === activePartnerId && !n.isRead
  ).length;

  const currentPartner =
    activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner =
    activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  if (!isInitialRemoteLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4 text-rose-500 shadow-sm"
        >
          <Heart className="w-8 h-8 fill-rose-500 animate-pulse" />
        </motion.div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Notre Nid d'Amour</h2>
        <p className="text-sm text-gray-500">Connexion et synchronisation en direct...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-between selection:bg-rose-200">
      {/* Top Header */}
      <Header
        profile={profile}
        activePartnerId={activePartnerId}
        onSwitchPartner={handleSwitchPartner}
        onOpenSettings={() => {
          setProfileFocusPartner(undefined);
          setShowProfileModal(true);
        }}
        onOpenPhotoPicker={(pId) => {
          setProfileFocusPartner(pId);
          setShowProfileModal(true);
        }}
        onSendMissYou={handleSendMissYou}
        unreadNotesCount={unreadNotesCount}
        onGoToNotes={() => setActiveTab('journal')}
        onGoToGallery={() => setActiveTab('gallery')}
        isPinEnabled={settings.isPinEnabled}
        onLockApp={() => setIsAppLocked(true)}
        isFirebaseConnected={isCloudSynced}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Main Body */}
      <main className="flex-1 pb-24 sm:pb-12">
        {/* Tab Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unreadNotesCount={unreadNotesCount}
        />

        {/* Views */}
        <div className="transition-opacity duration-200">
          {activeTab === 'journal' && (
            <>
              {/* Real-time Mood & Needs Bar for Journal & Douceurs */}
              <MoodAndNeedsBar
                profile={profile}
                activePartnerId={activePartnerId}
                onUpdateMood={handleUpdateMood}
                onOpenPhotoPicker={(pId) => {
                  setProfileFocusPartner(pId);
                  setShowProfileModal(true);
                }}
              />
              <JournalView
                profile={profile}
                activePartnerId={activePartnerId}
                notes={notes}
                gratitudes={gratitudes}
                onOpenWriteNoteModal={() => {
                  setEditingNote(null);
                  setShowWriteNoteModal(true);
                }}
                onMarkNoteAsRead={handleMarkNoteAsRead}
                onToggleFavoriteNote={handleToggleFavoriteNote}
                onReactNote={handleReactNote}
                onAddGratitude={handleAddGratitude}
                onLikeGratitude={handleLikeGratitude}
                onEditNote={(note) => setEditingNote(note)}
                onDeleteNote={handleDeleteNote}
                onDeleteGratitude={handleDeleteGratitude}
              />
            </>
          )}

          {activeTab === 'timeline' && (
            <TimelineView
              profile={profile}
              activePartnerId={activePartnerId}
              memories={memories}
              capsules={capsules}
              locations={locations}
              onOpenAddMemoryModal={() => {
                setEditingMemory(null);
                setShowAddMemoryModal(true);
              }}
              onOpenAddCapsuleModal={() => {
                setEditingCapsule(null);
                setShowAddCapsuleModal(true);
              }}
              onOpenAddLocationModal={() => {
                setEditingLocation(null);
                setShowAddLocationModal(true);
              }}
              onLikeMemory={handleLikeMemory}
              onUnlockCapsule={handleUnlockCapsule}
              onEditMemory={(mem) => setEditingMemory(mem)}
              onDeleteMemory={handleDeleteMemory}
              onEditCapsule={(cap) => setEditingCapsule(cap)}
              onDeleteCapsule={handleDeleteCapsule}
              onEditLocation={(loc) => setEditingLocation(loc)}
              onDeleteLocation={handleDeleteLocation}
            />
          )}

          {activeTab === 'gallery' && (
            <SharedGalleryView
              profile={profile}
              activePartnerId={activePartnerId}
              memories={memories}
              locations={locations}
              capsules={capsules}
              challenges={challenges}
              bucketList={bucketList}
              onLikeMemory={handleLikeMemory}
              onOpenAddMemoryModal={() => {
                setEditingMemory(null);
                setShowAddMemoryModal(true);
              }}
              onOpenProfileModal={(pId) => {
                setProfileFocusPartner(pId);
                setShowProfileModal(true);
              }}
              onEditMemory={(mem) => setEditingMemory(mem)}
              onDeleteMemory={handleDeleteMemory}
              onDeleteMediaItem={handleDeleteMediaItem}
              onRemovePhotoOnly={handleRemovePhotoOnly}
            />
          )}

          {activeTab === 'games' && (
            <GamesView
              profile={profile}
              activePartnerId={activePartnerId}
              quizzes={quizzes}
              dateIdeas={dateIdeas}
              challenges={challenges}
              onAnswerQuiz={handleAnswerQuiz}
              onSaveDateIdea={handleSaveDateIdea}
              onToggleChallenge={handleToggleChallenge}
              onAddNewQuiz={handleAddNewQuiz}
              onAddNewDateIdea={handleAddNewDateIdea}
            />
          )}

          {activeTab === 'vouchers' && (
            <VouchersAndBucketView
              profile={profile}
              activePartnerId={activePartnerId}
              vouchers={vouchers}
              bucketList={bucketList}
              onRedeemVoucher={handleRedeemVoucher}
              onOpenAddVoucherModal={() => {
                setEditingVoucher(null);
                setShowAddVoucherModal(true);
              }}
              onOpenAddBucketModal={() => {
                setEditingBucketItem(null);
                setShowAddBucketModal(true);
              }}
              onUpdateBucketStatus={handleUpdateBucketStatus}
              onEditVoucher={(v) => setEditingVoucher(v)}
              onDeleteVoucher={handleDeleteVoucher}
              onEditBucketItem={(item) => setEditingBucketItem(item)}
              onDeleteBucketItem={handleDeleteBucketItem}
            />
          )}
        </div>
      </main>

      {/* Romantic Footer */}
      <footer className="border-t border-rose-100/70 py-6 text-center text-xs text-stone-500 bg-white/40">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <span>{profile.relationshipTitle}</span>
          <span>•</span>
          <span className="text-rose-500">❤️</span>
          <span>Espace d'Amour & de Complicité</span>
        </p>
      </footer>

      {/* Miss You Modal Pulse Popup */}
      <AnimatePresence>
        {activeMissYouPulse && (
          <MissYouModal
            lastPulse={activeMissYouPulse}
            sender={
              activeMissYouPulse.senderId === 'p1'
                ? profile.partner1
                : profile.partner2
            }
            receiver={
              activeMissYouPulse.senderId === 'p1'
                ? profile.partner2
                : profile.partner1
            }
            onClose={() => setActiveMissYouPulse(null)}
            onSendBack={handleSendMissYou}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {(showWriteNoteModal || editingNote) && (
          <WriteNoteModal
            profile={profile}
            activePartnerId={activePartnerId}
            initialNote={editingNote || undefined}
            onClose={() => {
              setShowWriteNoteModal(false);
              setEditingNote(null);
            }}
            onSendNote={handleSendNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {(showAddMemoryModal || editingMemory) && (
          <AddMemoryModal
            profile={profile}
            activePartnerId={activePartnerId}
            initialMemory={editingMemory || undefined}
            onClose={() => {
              setShowAddMemoryModal(false);
              setEditingMemory(null);
            }}
            onAddMemory={handleAddMemory}
            onUpdateMemory={handleUpdateMemory}
            onDeleteMemory={handleDeleteMemory}
          />
        )}

        {(showAddCapsuleModal || editingCapsule) && (
          <AddCapsuleModal
            profile={profile}
            activePartnerId={activePartnerId}
            initialCapsule={editingCapsule || undefined}
            onClose={() => {
              setShowAddCapsuleModal(false);
              setEditingCapsule(null);
            }}
            onAddCapsule={handleAddCapsule}
            onUpdateCapsule={handleUpdateCapsule}
            onDeleteCapsule={handleDeleteCapsule}
          />
        )}

        {(showAddLocationModal || editingLocation) && (
          <AddLocationModal
            initialLocation={editingLocation || undefined}
            onClose={() => {
              setShowAddLocationModal(false);
              setEditingLocation(null);
            }}
            onAddLocation={handleAddLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
          />
        )}

        {(showAddVoucherModal || editingVoucher) && (
          <AddVoucherModal
            profile={profile}
            activePartnerId={activePartnerId}
            initialVoucher={editingVoucher || undefined}
            onClose={() => {
              setShowAddVoucherModal(false);
              setEditingVoucher(null);
            }}
            onAddVoucher={handleAddVoucher}
            onUpdateVoucher={handleUpdateVoucher}
            onDeleteVoucher={handleDeleteVoucher}
          />
        )}

        {(showAddBucketModal || editingBucketItem) && (
          <AddBucketModal
            activePartnerId={activePartnerId}
            initialBucketItem={editingBucketItem || undefined}
            onClose={() => {
              setShowAddBucketModal(false);
              setEditingBucketItem(null);
            }}
            onAddBucketItem={handleAddBucketItem}
            onUpdateBucketItem={handleUpdateBucketItem}
            onDeleteBucketItem={handleDeleteBucketItem}
          />
        )}

        {showProfileModal && (
          <ProfileModal
            profile={profile}
            settings={settings}
            initialFocusPartner={profileFocusPartner}
            onClose={() => {
              setShowProfileModal(false);
              setProfileFocusPartner(undefined);
            }}
            onSaveProfile={(updatedProfile) => {
              setProfile(updatedProfile);
              saveProfile(updatedProfile).catch(console.error);
            }}
            onSaveSettings={(updatedSettings) => {
              setSettings(updatedSettings);
              saveSettings(updatedSettings).catch(console.error);
            }}
            onResetToDefault={handleResetToDefault}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onLockApp={() => setIsAppLocked(true)}
            isFirebaseConnected={true}
          />
        )}

        {deleteTarget && (
          <ConfirmDeleteModal
            isOpen={Boolean(deleteTarget)}
            title={deleteTarget.title}
            itemName={deleteTarget.itemName}
            itemType={deleteTarget.itemType}
            onConfirm={() => {
              deleteTarget.onConfirm();
              setDeleteTarget(null);
            }}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        <PWAInstallModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
        />
      </AnimatePresence>

      {/* Secret PIN Lock Screen */}
      <AnimatePresence>
        {isAppLocked && settings.isPinEnabled && (
          <PinLockModal
            correctPin={settings.pinCode || '1234'}
            profile={profile}
            onUnlock={() => setIsAppLocked(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
