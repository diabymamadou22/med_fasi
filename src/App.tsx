import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { Header } from './components/Header';
import { Navigation, MainTab } from './components/Navigation';
import { MoodAndNeedsBar } from './components/MoodAndNeedsBar';
import { MissYouModal } from './components/MissYouModal';
import { HomeView } from './components/views/HomeView';
import { SharedGalleryView, GalleryItem } from './components/views/SharedGalleryView';
import { GamesView, EnglishGameTab } from './components/views/GamesView';
import { VouchersAndBucketView } from './components/views/VouchersAndBucketView';
import { ChatView } from './components/views/ChatView';
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
import { NotificationAlertModal } from './components/modals/NotificationAlertModal';
import { FloatingMessageAlert, FloatingAlertData } from './components/FloatingMessageAlert';
import { soundEffects } from './lib/audio';
import { triggerCelebrationConfetti } from './lib/confetti';
import {
  sendSystemNotification,
  updateAppBadge,
  triggerVibration,
  notifyPartnerViaPush,
  subscribeToPushNotifications,
  isPushSubscribed,
  startTabMessageAlert,
} from './lib/notificationService';
import { onPwaNavigate } from './lib/pwaService';
import { useBackHandler, backNavigation } from './lib/backNavigation';
import { WifiOff } from 'lucide-react';
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
  ChatMessage,
  EnglishLexiconItem,
  WeeklyLearningChallenge,
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
import { INITIAL_LEXICON_WORDS } from './data/initialLexiconData';
import {
  INITIAL_WEEKLY_LEARNING_CHALLENGES,
  matchLearningChallenge,
  getActiveOrCurrentWeekChallenge,
} from './data/initialWeeklyChallenges';
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
  subscribeChatMessages,
  fetchFirestoreChatMessages,
  saveChatMessage,
  deleteMultipleChatMessagesFromDb,
  editChatMessageContent,
  saveLexiconWord,
  deleteLexiconWordFromDb,
  toggleLexiconFavoriteInDb,
  toggleLexiconMasteredInDb,
  saveWeeklyLearningChallenge,
  deleteWeeklyLearningChallengeFromDb,
  subscribeWeeklyLearningChallenges,
  COLLECTIONS,
  sortChatMessagesChronologically,
  extractMessageTimestampMs,
  isQuotaOrResourceError,
} from './lib/firestoreService';
import {
  sendChatMessageViaRelay,
  fetchChatMessagesFromRelay,
  syncLocalMessagesWithRelay,
  sendPulseViaRelay,
  connectChatEvents,
} from './lib/chatRelayService';

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
  CHAT_MESSAGES: 'nid_damour_chat_messages',
  LEXICON: 'nid_damour_lexicon',
  WEEKLY_CHALLENGES: 'nid_damour_weekly_challenges',
};

export default function App() {
  // Active partner (p1 or p2)
  const [activePartnerId, setActivePartnerId] = useState<PartnerId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PARTNER);
    return (saved as PartnerId) || 'p1';
  });

  // Main active tab (initialized from URL if present, e.g. /?tab=chat)
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['home', 'chat', 'games', 'gallery'].includes(tabParam)) {
        return tabParam as MainTab;
      }
    }
    return 'home';
  });

  // Stable refs for real-time Firestore listeners to avoid tearing down and recreating listeners
  const activePartnerIdRef = useRef<PartnerId>(activePartnerId);
  const activeTabRef = useRef<MainTab>(activeTab);

  useEffect(() => {
    activePartnerIdRef.current = activePartnerId;
  }, [activePartnerId]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  const [lastNonChatTab, setLastNonChatTab] = useState<MainTab>('home');
  const [selectedGameTab, setSelectedGameTab] = useState<EnglishGameTab>('roulette');

  const handleSelectTab = (tab: MainTab) => {
    if (activeTab !== 'chat') {
      setLastNonChatTab(activeTab);
    }
    setActiveTab(tab);
  };

  const handleBackFromChat = () => {
    setActiveTab(lastNonChatTab || 'home');
  };

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

  const profileRef = useRef<CoupleProfile>(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const [memories, setMemories] = useState<TimelineMemory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const seen = new Set<string>();
      return parsed.filter((m: any) => {
        if (!m || !m.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
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

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      const parsed: ChatMessage[] = saved ? JSON.parse(saved) : [];
      return sortChatMessagesChronologically(parsed);
    } catch {
      return [];
    }
  });

  // Notre Lexique d'anglais personnalisé
  const [lexicon, setLexicon] = useState<EnglishLexiconItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEXICON);
      return saved ? JSON.parse(saved) : INITIAL_LEXICON_WORDS;
    } catch {
      return INITIAL_LEXICON_WORDS;
    }
  });

  // Défis d'apprentissage hebdomadaires en duo (mots & structures d'anglais)
  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyLearningChallenge[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_CHALLENGES);
      return saved ? JSON.parse(saved) : INITIAL_WEEKLY_LEARNING_CHALLENGES;
    } catch {
      return INITIAL_WEEKLY_LEARNING_CHALLENGES;
    }
  });

  // Texte pré-rempli pour le chat (insertion depuis le lexique, les défis ou réponse rapide push URL)
  const [chatDraftText, setChatDraftText] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const draft = params.get('replyDraft') || params.get('draft');
      if (draft) {
        return draft;
      }
    }
    return '';
  });

  // Couple Settings (PIN, Romantic Music, Ambiance, Database cleaning)
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
            autoCleanChatEnabled: false,
            autoCleanChatDays: 30,
          };
    } catch {
      return {
        isPinEnabled: false,
        pinCode: '1234',
        songTitle: "Sidiki Diabaté - C'est bon",
        ambientTrackId: 'kora_serenade',
        musicVolume: 0.35,
        isMusicPlaying: false,
        autoCleanChatEnabled: false,
        autoCleanChatDays: 30,
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

  // Network connectivity state for Offline PWA Mode
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for PWA notification navigation events (e.g. user taps a notification)
  useEffect(() => {
    const unsubPwaNav = onPwaNavigate((tab, draftText) => {
      if (tab) {
        setActiveTab(tab as MainTab);
      }
      if (draftText) {
        setChatDraftText(draftText);
      }
    });
    return unsubPwaNav;
  }, []);

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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isNotificationsActive, setIsNotificationsActive] = useState(false);
  const [floatingAlert, setFloatingAlert] = useState<FloatingAlertData | null>(null);

  const checkPushSubscription = async () => {
    try {
      const isSub = await isPushSubscribed();
      setIsNotificationsActive(isSub);

      // Si l'autorisation a déjà été accordée, s'assurer que l'abonnement push est bien synchronisé sur le serveur
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        subscribeToPushNotifications(activePartnerId)
          .then((res) => {
            if (res.success) {
              setIsNotificationsActive(true);
            }
          })
          .catch(() => {});
      }
    } catch {
      setIsNotificationsActive(false);
    }
  };

  useEffect(() => {
    checkPushSubscription();
  }, [activePartnerId]);

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

  // Phone hardware/gesture Back Button Navigation
  // When an open modal/view is active, pressing the phone back button closes only that element instead of the app!
  useBackHandler(showProfileModal, () => setShowProfileModal(false), 'app-modal-profile');
  useBackHandler(showWriteNoteModal, () => setShowWriteNoteModal(false), 'app-modal-write-note');
  useBackHandler(showAddMemoryModal, () => setShowAddMemoryModal(false), 'app-modal-add-memory');
  useBackHandler(showAddCapsuleModal, () => setShowAddCapsuleModal(false), 'app-modal-add-capsule');
  useBackHandler(showAddLocationModal, () => setShowAddLocationModal(false), 'app-modal-add-location');
  useBackHandler(showAddVoucherModal, () => setShowAddVoucherModal(false), 'app-modal-add-voucher');
  useBackHandler(showAddBucketModal, () => setShowAddBucketModal(false), 'app-modal-add-bucket');
  useBackHandler(showInstallModal, () => setShowInstallModal(false), 'app-modal-install');
  useBackHandler(showNotificationModal, () => setShowNotificationModal(false), 'app-modal-notification');
  useBackHandler(Boolean(deleteTarget), () => setDeleteTarget(null), 'app-modal-delete-target');
  useBackHandler(Boolean(activeMissYouPulse), () => setActiveMissYouPulse(null), 'app-modal-miss-you');
  useBackHandler(activeTab !== 'home', () => setActiveTab('home'), 'app-tab-navigation');

  const [showExitToast, setShowExitToast] = useState(false);

  useEffect(() => {
    backNavigation.setExitPromptCallback(() => {
      setShowExitToast(true);
      setTimeout(() => setShowExitToast(false), 2200);
    });
  }, []);

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
      lexicon: INITIAL_LEXICON_WORDS,
      weeklyChallenges: INITIAL_WEEKLY_LEARNING_CHALLENGES,
    });
  }, []);

  // Gestionnaire unifié de réception des messages avec alertes sonores et visuelles
  const handleIncomingChatMessages = useCallback(
    (incomingList: ChatMessage[], _source = 'unknown') => {
      if (!Array.isArray(incomingList) || incomingList.length === 0) return;

      setMessages((prev) => {
        const prevIds = new Set(prev.map((m) => m.id));
        const newFromPartner = incomingList.filter(
          (m) => !prevIds.has(m.id) && m.senderId !== activePartnerIdRef.current
        );

        if (prev.length > 0 && newFromPartner.length > 0) {
          const lastMsg = newFromPartner[newFromPartner.length - 1];
          soundEffects.playMessageReceived();
          triggerVibration([250, 100, 250, 100, 250]);

          const curProf = profileRef.current;
          const sender = lastMsg.senderId === 'p1' ? curProf.partner1 : curProf.partner2;
          const bodyText =
            lastMsg.mediaType === 'image'
              ? '📷 Vous a envoyé une photo'
              : lastMsg.mediaType === 'audio'
              ? '🎵 Vous a envoyé une note vocale'
              : lastMsg.mediaType === 'video'
              ? '🎬 Vous a envoyé une vidéo'
              : lastMsg.content;

          startTabMessageAlert(sender.name || 'Votre amour', bodyText);

          if (document.visibilityState === 'hidden' || activeTabRef.current !== 'chat') {
            sendSystemNotification({
              title: `${sender.name || 'Votre amour'} ❤️`,
              body: bodyText,
              icon: sender.avatar || '/app-icon.png',
              tab: 'chat',
              tag: `chat-${lastMsg.id}`,
            });
          }

          if (activeTabRef.current !== 'chat') {
            setFloatingAlert({
              id: lastMsg.id,
              senderId: lastMsg.senderId,
              senderName: sender.name || 'Votre amour',
              senderAvatar: sender.avatar,
              content: lastMsg.content,
              mediaType: lastMsg.mediaType,
              timestamp: lastMsg.timestamp,
            });
          }
        }

        // Fusionner avec déduplication stricte pour ne jamais perdre de message
        const idMap = new Map<string, ChatMessage>();
        prev.forEach((m) => idMap.set(m.id, m));
        incomingList.forEach((m) => {
          if (m && m.id) {
            const existing = idMap.get(m.id);
            idMap.set(m.id, existing ? { ...existing, ...m } : m);
          }
        });
        return sortChatMessagesChronologically(Array.from(idMap.values()));
      });
    },
    []
  );

  // Fonction de synchronisation unifiée Firestore + Relais haute disponibilité
  const runUnifiedChatSync = useCallback(async () => {
    try {
      const [firestoreMsgs, relayMsgs] = await Promise.all([
        fetchFirestoreChatMessages().catch(() => [] as ChatMessage[]),
        fetchChatMessagesFromRelay().catch(() => [] as ChatMessage[]),
      ]);

      const allIncoming: ChatMessage[] = [];
      const seen = new Set<string>();

      if (Array.isArray(firestoreMsgs)) {
        firestoreMsgs.forEach((m) => {
          if (m && m.id && !seen.has(m.id)) {
            seen.add(m.id);
            allIncoming.push(m);
          }
        });
      }
      if (Array.isArray(relayMsgs)) {
        relayMsgs.forEach((m) => {
          if (m && m.id && !seen.has(m.id)) {
            seen.add(m.id);
            allIncoming.push(m);
          }
        });
      }

      if (allIncoming.length > 0) {
        handleIncomingChatMessages(allIncoming, 'polling-sync');
      }
    } catch (err) {
      console.warn('Sync chat issue:', err);
    }
  }, [handleIncomingChatMessages]);

  // Synchronisation périodique et sur reprise de focus
  useEffect(() => {
    runUnifiedChatSync();
    const pollInterval = setInterval(runUnifiedChatSync, 3500);

    const handleSyncOnVisible = () => {
      if (document.visibilityState === 'visible') {
        runUnifiedChatSync();
      }
    };
    const handleSyncOnFocus = () => runUnifiedChatSync();

    document.addEventListener('visibilitychange', handleSyncOnVisible);
    window.addEventListener('focus', handleSyncOnFocus);
    window.addEventListener('online', handleSyncOnFocus);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleSyncOnVisible);
      window.removeEventListener('focus', handleSyncOnFocus);
      window.removeEventListener('online', handleSyncOnFocus);
    };
  }, [runUnifiedChatSync]);

  // Synchronisation immédiate lors du passage sur l'onglet de discussion
  useEffect(() => {
    if (activeTab === 'chat') {
      runUnifiedChatSync();
    }
  }, [activeTab, runUnifiedChatSync]);

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
          const seen = new Set<string>();
          const deduped = remoteMemories.filter((m) => {
            if (!m || !m.id || seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
          setMemories(deduped);
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
      },
      () => setIsCloudSynced(false)
    );

    const unsubLocations = subscribeCollection<MemoryLocation>(
      COLLECTIONS.LOCATIONS,
      (remoteLocations) => {
        if (Array.isArray(remoteLocations)) {
          setLocations(remoteLocations);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubNotes = subscribeCollection<SweetNote>(
      COLLECTIONS.NOTES,
      (remoteNotes) => {
        if (Array.isArray(remoteNotes)) {
          // Sort newest first
          const sorted = [...remoteNotes].sort((a, b) => b.id.localeCompare(a.id));
          setNotes(sorted);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubGratitudes = subscribeCollection<DailyGratitude>(
      COLLECTIONS.GRATITUDES,
      (remoteGratitudes) => {
        if (Array.isArray(remoteGratitudes)) {
          const sorted = [...remoteGratitudes].sort((a, b) => b.id.localeCompare(a.id));
          setGratitudes(sorted);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubVouchers = subscribeCollection<LoveVoucher>(
      COLLECTIONS.VOUCHERS,
      (remoteVouchers) => {
        if (Array.isArray(remoteVouchers)) {
          setVouchers(remoteVouchers);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubBucket = subscribeCollection<BucketItem>(
      COLLECTIONS.BUCKET_LIST,
      (remoteBucket) => {
        if (Array.isArray(remoteBucket)) {
          setBucketList(remoteBucket);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubQuizzes = subscribeCollection<QuizQuestion>(
      COLLECTIONS.QUIZZES,
      (remoteQuizzes) => {
        if (Array.isArray(remoteQuizzes)) {
          setQuizzes(remoteQuizzes);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubDates = subscribeCollection<DateIdea>(
      COLLECTIONS.DATES,
      (remoteDates) => {
        if (Array.isArray(remoteDates)) {
          setDateIdeas(remoteDates);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubChallenges = subscribeCollection<CoupleChallenge>(
      COLLECTIONS.CHALLENGES,
      (remoteChallenges) => {
        if (Array.isArray(remoteChallenges)) {
          setChallenges(remoteChallenges);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubLexicon = subscribeCollection<EnglishLexiconItem>(
      COLLECTIONS.LEXICON,
      (remoteLexicon) => {
        if (Array.isArray(remoteLexicon) && remoteLexicon.length > 0) {
          setLexicon(remoteLexicon);
        }
      },
      () => setIsCloudSynced(false)
    );

    const unsubWeeklyChallenges = subscribeWeeklyLearningChallenges(
      (remoteChallenges) => {
        if (Array.isArray(remoteChallenges) && remoteChallenges.length > 0) {
          setWeeklyChallenges(remoteChallenges);
        }
      },
      () => setIsCloudSynced(false)
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
      if (pulse && pulse.senderId !== activePartnerIdRef.current) {
        setActiveMissYouPulse(pulse);
        soundEffects.playHeartPulse();
        triggerVibration([100, 50, 150]);

        // Background Web Push / Native notification if app is in background or not on chat tab
        if (document.visibilityState === 'hidden' || activeTabRef.current !== 'chat') {
          const curProf = profileRef.current;
          const sender = pulse.senderId === 'p1' ? curProf.partner1 : curProf.partner2;
          sendSystemNotification({
            title: `Tu me manques ! 💓`,
            body: `${sender.name || 'Votre amour'} vous envoie une impulsion de cœur !`,
            icon: sender.avatar || '/app-icon.png',
            tab: 'chat',
            tag: 'miss-you-pulse',
          });
        }
      }
    });

    const unsubChat = subscribeChatMessages(
      (remoteMessages) => {
        handleIncomingChatMessages(remoteMessages, 'firestore-stream');
      },
      () => setIsCloudSynced(false)
    );

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
      unsubLexicon();
      unsubWeeklyChallenges();
      unsubSettings();
      unsubPulse();
      unsubChat();
    };
  }, [handleIncomingChatMessages]);

  // Synchronisation continue des événements en direct (SSE) pour réception instantanée des messages et coeurs
  useEffect(() => {
    const disconnectSse = connectChatEvents({
      partnerId: activePartnerId,
      onNewMessage: (newMsg) => {
        if (!newMsg || !newMsg.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          const updated = sortChatMessagesChronologically([...prev, newMsg]);

          if (newMsg.senderId !== activePartnerIdRef.current) {
            soundEffects.playMessageReceived();
            triggerVibration([250, 100, 250, 100, 250]);

            const curProf = profileRef.current;
            const sender = newMsg.senderId === 'p1' ? curProf.partner1 : curProf.partner2;
            const bodyText =
              newMsg.mediaType === 'image'
                ? '📷 Vous a envoyé une photo'
                : newMsg.mediaType === 'audio'
                ? '🎵 Vous a envoyé une note vocale'
                : newMsg.mediaType === 'video'
                ? '🎬 Vous a envoyé une vidéo'
                : newMsg.content;

            startTabMessageAlert(sender.name || 'Votre amour', bodyText);

            if (document.visibilityState === 'hidden' || activeTabRef.current !== 'chat') {
              sendSystemNotification({
                title: `${sender.name || 'Votre amour'} ❤️`,
                body: bodyText,
                icon: sender.avatar || '/app-icon.png',
                tab: 'chat',
                tag: `chat-${newMsg.id}`,
              });
            }

            if (activeTabRef.current !== 'chat') {
              setFloatingAlert({
                id: newMsg.id,
                senderId: newMsg.senderId,
                senderName: sender.name || 'Votre amour',
                senderAvatar: sender.avatar,
                content: newMsg.content,
                mediaType: newMsg.mediaType,
                timestamp: newMsg.timestamp,
              });
            }
          }

          return updated;
        });
      },
      onPulse: (pulse) => {
        if (pulse && pulse.senderId !== activePartnerIdRef.current) {
          setActiveMissYouPulse(pulse);
          soundEffects.playHeartPulse();
          triggerVibration([100, 50, 150]);

          if (document.visibilityState === 'hidden' || activeTabRef.current !== 'chat') {
            const curProf = profileRef.current;
            const sender = pulse.senderId === 'p1' ? curProf.partner1 : curProf.partner2;
            sendSystemNotification({
              title: `Tu me manques ! 💓`,
              body: `${sender.name || 'Votre amour'} vous envoie une impulsion de cœur !`,
              icon: sender.avatar || '/app-icon.png',
              tab: 'chat',
              tag: 'miss-you-pulse',
            });
          }
        }
      },
    });

    return () => {
      disconnectSse();
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
    localStorage.setItem(STORAGE_KEYS.WEEKLY_CHALLENGES, JSON.stringify(weeklyChallenges));
  }, [weeklyChallenges, isInitialRemoteLoaded]);

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
    localStorage.setItem(STORAGE_KEYS.LEXICON, JSON.stringify(lexicon));
  }, [lexicon, isInitialRemoteLoaded]);

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

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  }, [messages, isInitialRemoteLoaded]);

  // Update PWA Home Screen App Badge for unread chat messages
  useEffect(() => {
    if (activeTab === 'chat') {
      updateAppBadge(0);
      return;
    }
    const unreadCount = messages.filter(
      (m) =>
        m.senderId !== activePartnerId &&
        m.readStatus !== 'read' &&
        m.readStatus !== true &&
        m.status !== 'read'
    ).length;

    updateAppBadge(unreadCount);
  }, [messages, activeTab, activePartnerId]);

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
      messages,
    } as any;
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
    if ((backup as any).messages) setMessages((backup as any).messages);
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
    const senderPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
    // 1. Relais direct instantané SSE pour que le partenaire reçoive l'impulsion même si quota Firestore est plein
    sendPulseViaRelay(pulse, senderPartner.name || 'Votre amour').catch(() => {});
    // 2. Persistance Firestore
    sendMissYouPulse(pulse).catch(console.error);
  };

  const handleSendMissYouPulseFromChat = (
    pulseData: Omit<MissYouPulse, 'id' | 'timestamp'>
  ) => {
    handleSendMissYou(pulseData.vibe, pulseData.message);
  };

  const handleSendChatMessage = async (
    msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'readStatus'>
  ) => {
    // Determine the highest existing message timestamp in the thread to guarantee strict monotonicity in both directions
    let maxExistingMs = 0;
    for (const m of messages) {
      const t = extractMessageTimestampMs(m);
      if (t > maxExistingMs) maxExistingMs = t;
    }

    const now = Date.now();
    // Guarantee that each new message in either direction arrives at least 1 second after the previous message
    const finalTimestampMs = Math.max(now, maxExistingMs + 1000);
    const finalTimestampIso = new Date(finalTimestampMs).toISOString();

    // Check Weekly English Challenge completion
    let challengeValidated = false;
    let challengeBonusPoints = 0;
    let challengeTargetWord = '';

    const activeChallenge = getActiveOrCurrentWeekChallenge(weeklyChallenges);
    if (activeChallenge && msgData.content) {
      const isMatch = matchLearningChallenge(msgData.content, activeChallenge);
      if (isMatch) {
        const sender = msgData.senderId;
        const alreadyDoneBySender =
          (sender === 'p1' && activeChallenge.partner1Completed) ||
          (sender === 'p2' && activeChallenge.partner2Completed);

        if (!alreadyDoneBySender) {
          challengeValidated = true;
          challengeBonusPoints = activeChallenge.pointsReward || 50;
          challengeTargetWord = activeChallenge.targetEnglish;

          const nowIso = new Date().toISOString();
          const updatedPartner1Completed = sender === 'p1' ? true : activeChallenge.partner1Completed;
          const updatedPartner2Completed = sender === 'p2' ? true : activeChallenge.partner2Completed;
          const bothNowCompleted = updatedPartner1Completed && updatedPartner2Completed;

          const updatedChallenge: WeeklyLearningChallenge = {
            ...activeChallenge,
            partner1Completed: updatedPartner1Completed,
            partner1CompletedAt: sender === 'p1' ? nowIso : activeChallenge.partner1CompletedAt,
            partner1Snippet: sender === 'p1' ? msgData.content.slice(0, 120) : activeChallenge.partner1Snippet,
            partner2Completed: updatedPartner2Completed,
            partner2CompletedAt: sender === 'p2' ? nowIso : activeChallenge.partner2CompletedAt,
            partner2Snippet: sender === 'p2' ? msgData.content.slice(0, 120) : activeChallenge.partner2Snippet,
            bothCompleted: bothNowCompleted,
            bothCompletedAt: bothNowCompleted ? (activeChallenge.bothCompletedAt || nowIso) : undefined,
            updatedAt: nowIso,
          };

          // Update state and DB
          setWeeklyChallenges((prev) =>
            prev.map((c) => (c.id === updatedChallenge.id ? updatedChallenge : c))
          );
          saveWeeklyLearningChallenge(updatedChallenge).catch(console.error);

          // Add learning points to couple profile
          const partnerKey = sender === 'p1' ? 'partner1' : 'partner2';
          const currentPts = profile[partnerKey]?.learningPoints || 0;
          const totalPointsAwarded = bothNowCompleted ? challengeBonusPoints + 30 : challengeBonusPoints;

          const updatedProfile: CoupleProfile = {
            ...profile,
            [partnerKey]: {
              ...profile[partnerKey],
              learningPoints: currentPts + totalPointsAwarded,
            },
          };
          setProfile(updatedProfile);
          saveProfile(updatedProfile).catch(console.error);

          // Trigger audio sparkle & celebration confetti
          soundEffects.playSuccessSparkle();
          triggerCelebrationConfetti();
        }
      }
    }

    const newMsg: ChatMessage = {
      id: `msg_${finalTimestampMs}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: finalTimestampIso,
      timestampMs: finalTimestampMs,
      status: 'sent',
      readStatus: 'sent',
      ...msgData,
      ...(challengeValidated
        ? {
            isLearningChallengeValidation: true,
            learningChallengeId: activeChallenge?.id,
            learningChallengeTarget: challengeTargetWord,
            learningChallengeBonus: challengeBonusPoints,
          }
        : {}),
    };
    setMessages((prev) => sortChatMessagesChronologically([...prev, newMsg]));
    const targetPartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';
    const senderPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;

    // 1. Relais direct serveur (immédiat, SSE instantané vers le partenaire, non bloqué par les quotas)
    sendChatMessageViaRelay(newMsg, senderPartner.name || 'Votre amour').catch((err) => {
      console.warn('Relais serveur différé:', err);
    });

    // 2. Persistance Firestore
    try {
      await saveChatMessage(newMsg);
      // Synchronisation immédiate en arrière-plan
      runUnifiedChatSync();
      // Trigger Web Push alert to partner device asynchronously
      notifyPartnerViaPush({
        senderId: activePartnerId,
        senderName: senderPartner.name || 'Votre amour',
        content: newMsg.content,
        mediaType: newMsg.mediaType,
        targetPartnerId,
      }).catch((err) => console.warn('Push dispatch error:', err));
    } catch (err) {
      if (!isQuotaOrResourceError(err)) {
        console.warn('Sauvegarde distante message différée:', err);
      }
    }
  };

  const handleDeleteChatMessages = async (messageIds: string[]) => {
    if (!messageIds || messageIds.length === 0) return;
    const idSet = new Set(messageIds);
    setMessages((prev) => prev.filter((m) => !idSet.has(m.id)));
    try {
      await deleteMultipleChatMessagesFromDb(messageIds);
    } catch (err) {
      if (!isQuotaOrResourceError(err)) {
        console.warn('Suppression distante messages différée:', err);
      }
    }
  };

  const handleClearChat = async () => {
    if (messages.length === 0) return;
    const allIds = messages.map((m) => m.id);
    await handleDeleteChatMessages(allIds);
  };

  // Purge de l'historique des messages plus vieux qu'un certain nombre de jours
  const handlePurgeOldChatMessages = async (days: number): Promise<number> => {
    if (days <= 0) return 0;
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const oldMessages = messages.filter((m) => {
      const t = extractMessageTimestampMs(m);
      return t > 0 && t < cutoffMs;
    });
    if (oldMessages.length === 0) return 0;
    const oldIds = oldMessages.map((m) => m.id);
    await handleDeleteChatMessages(oldIds);
    const nowIso = new Date().toISOString();
    const updatedSettings: CoupleSettings = {
      ...settings,
      lastAutoCleanAt: nowIso,
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings).catch(console.error);
    return oldIds.length;
  };

  // Nettoyage automatique des anciens messages pour alléger la base Firestore
  const lastCleanCheckRef = useRef<number>(0);

  useEffect(() => {
    lastCleanCheckRef.current = 0;
  }, [settings.autoCleanChatEnabled, settings.autoCleanChatDays]);

  useEffect(() => {
    if (!isInitialRemoteLoaded) return;
    if (!settings.autoCleanChatEnabled) return;
    const days = settings.autoCleanChatDays ?? 30;
    if (days <= 0) return;

    const now = Date.now();
    // Limiter la vérification de nettoyage pour éviter les appels répétés
    if (now - lastCleanCheckRef.current < 5 * 60 * 1000) return;

    const cutoffMs = now - days * 24 * 60 * 60 * 1000;
    const oldMessages = messages.filter((m) => {
      const t = extractMessageTimestampMs(m);
      return t > 0 && t < cutoffMs;
    });

    if (oldMessages.length > 0) {
      lastCleanCheckRef.current = now;
      console.log(`[Auto-Clean] Suppression de ${oldMessages.length} anciens messages (> ${days} jours)...`);
      const oldIds = oldMessages.map((m) => m.id);
      handleDeleteChatMessages(oldIds)
        .then(() => {
          const nowIso = new Date().toISOString();
          setSettings((prev) => {
            const updated = { ...prev, lastAutoCleanAt: nowIso };
            saveSettings(updated).catch(console.error);
            return updated;
          });
        })
        .catch(console.error);
    } else {
      lastCleanCheckRef.current = now;
    }
  }, [isInitialRemoteLoaded, settings.autoCleanChatEnabled, settings.autoCleanChatDays, messages]);

  const handleEditChatMessage = async (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              content: newContent,
              isEdited: true,
              editedAt: new Date().toISOString(),
            }
          : m
      )
    );
    try {
      await editChatMessageContent(messageId, newContent);
    } catch (err) {
      if (!isQuotaOrResourceError(err)) {
        console.warn('Modification distante message différée:', err);
      }
    }
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
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...memData,
      likes: [activePartnerId],
    };
    setMemories((prev) => [newMem, ...prev.filter((m) => m.id !== newMem.id)]);
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

  // Lexicon Handlers
  const handleSaveLexiconWord = (word: EnglishLexiconItem) => {
    setLexicon((prev) => {
      const idx = prev.findIndex((w) => w.id === word.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = word;
        return next;
      }
      return [word, ...prev];
    });
    saveLexiconWord(word).catch(console.error);
  };

  const handleDeleteLexiconWord = (wordId: string) => {
    setLexicon((prev) => prev.filter((w) => w.id !== wordId));
    deleteLexiconWordFromDb(wordId).catch(console.error);
  };

  const handleToggleLexiconFavorite = (wordId: string, isFavorite: boolean) => {
    setLexicon((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, isFavorite } : w))
    );
    toggleLexiconFavoriteInDb(wordId, isFavorite).catch(console.error);
  };

  const handleToggleLexiconMastered = (wordId: string, isMastered: boolean) => {
    setLexicon((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, isMastered } : w))
    );
    toggleLexiconMasteredInDb(wordId, isMastered).catch(console.error);
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
    setMessages([]);
    localStorage.clear();
  };

  const unreadNotesCount = notes.filter(
    (n) => n.recipientId === activePartnerId && !n.isRead
  ).length;

  const unreadChatCount = messages.filter(
    (m) =>
      m.senderId !== activePartnerId &&
      m.readStatus !== 'read' &&
      m.readStatus !== true &&
      m.status !== 'read'
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
        <h2 className="text-xl font-bold text-gray-800 mb-1">NID</h2>
        <p className="text-sm text-gray-500">Connexion et synchronisation en direct...</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen min-h-[100dvh] bg-[#FAF7F5] flex flex-col justify-between selection:bg-rose-200 ${
        activeTab === 'chat' ? 'h-screen h-[100dvh] max-h-[100dvh] overflow-hidden no-scrollbar' : ''
      }`}
    >
      {/* Floating real-time message alert if user is in another tab */}
      <FloatingMessageAlert
        alert={floatingAlert}
        profile={profile}
        onOpenChat={() => {
          setActiveTab('chat');
          setFloatingAlert(null);
        }}
        onDismiss={() => setFloatingAlert(null)}
      />

      {/* Offline Mode Alert banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-3 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2 shadow-xs shrink-0 z-50">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Mode hors-ligne : vous consultez vos souvenirs et messages mis en cache localement.</span>
        </div>
      )}

      {/* Top Header - hidden when in Chat for immersive edge-to-edge phone-style messaging */}
      {activeTab !== 'chat' && (
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
          onGoToGallery={() => handleSelectTab('gallery')}
          isPinEnabled={settings.isPinEnabled}
          onLockApp={() => setIsAppLocked(true)}
          isFirebaseConnected={isCloudSynced}
          onOpenInstallModal={() => setShowInstallModal(true)}
          onOpenNotifications={() => setShowNotificationModal(true)}
          isNotificationsActive={isNotificationsActive}
        />
      )}

      {/* Main Body */}
      <main
        className={`flex-1 flex flex-col min-h-0 ${
          activeTab === 'chat'
            ? 'pb-0 overflow-hidden'
            : 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-12'
        }`}
      >
        {/* Tab Navigation - hidden when in Chat like a native messaging phone screen */}
        {activeTab !== 'chat' && (
          <Navigation
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            unreadChatCount={unreadChatCount}
          />
        )}

        {/* Views */}
        <div
          className={`relative ${
            activeTab === 'chat' ? 'flex-1 flex flex-col min-h-0 h-full overflow-hidden' : ''
          }`}
        >
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden animate-fade-in">
              <ChatView
                profile={profile}
                activePartnerId={activePartnerId}
                onSwitchPartner={handleSwitchPartner}
                messages={messages}
                onSendMessage={handleSendChatMessage}
                onSendMissYouPulse={handleSendMissYouPulseFromChat}
                onDeleteMessages={handleDeleteChatMessages}
                onClearChat={handleClearChat}
                onEditMessage={handleEditChatMessage}
                onBack={handleBackFromChat}
                weeklyChallenge={getActiveOrCurrentWeekChallenge(weeklyChallenges)}
                onOpenWeeklyChallengeHub={() => {
                  setActiveTab('games');
                }}
                draftText={chatDraftText}
                onClearDraftText={() => setChatDraftText('')}
                onOpenNotificationModal={() => setShowNotificationModal(true)}
                onRefreshChat={runUnifiedChatSync}
              />
            </div>
          )}

          {activeTab === 'home' && (
            <div className="animate-fade-in">
              <HomeView
                profile={profile}
                activePartnerId={activePartnerId}
                onSwitchPartner={handleSwitchPartner}
                onNavigateToTab={(tab) => handleSelectTab(tab)}
                onNavigateToGame={(gameTab) => {
                  setSelectedGameTab(gameTab);
                  handleSelectTab('games');
                }}
                onSendMissYou={(vibe, msg) => handleSendMissYou(vibe, msg)}
                onOpenWriteNoteModal={() => {
                  setEditingNote(null);
                  setShowWriteNoteModal(true);
                }}
                notes={notes}
                messages={messages}
                memories={memories}
                onOpenProfileModal={(pId) => {
                  setProfileFocusPartner(pId);
                  setShowProfileModal(true);
                }}
              />
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="animate-fade-in">
              <SharedGalleryView
                profile={profile}
                activePartnerId={activePartnerId}
                memories={memories}
                locations={locations}
                capsules={capsules}
                challenges={challenges}
                onLikeMemory={handleLikeMemory}
                onAddMemory={handleAddMemory}
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
            </div>
          )}

          {activeTab === 'games' && (
            <div className="animate-fade-in">
              <GamesView
                profile={profile}
                activePartnerId={activePartnerId}
                quizzes={quizzes}
                dateIdeas={dateIdeas}
                challenges={challenges}
                initialTab={selectedGameTab}
                lexicon={lexicon}
                onSaveLexiconWord={handleSaveLexiconWord}
                onDeleteLexiconWord={handleDeleteLexiconWord}
                onToggleLexiconFavorite={handleToggleLexiconFavorite}
                onToggleLexiconMastered={handleToggleLexiconMastered}
                weeklyChallenges={weeklyChallenges}
                onSelectActiveWeeklyChallenge={(challengeId) => {
                  const updated = weeklyChallenges.map((c) => ({
                    ...c,
                    isActive: c.id === challengeId,
                  }));
                  setWeeklyChallenges(updated);
                  const chosen = updated.find((c) => c.id === challengeId);
                  if (chosen) {
                    saveWeeklyLearningChallenge(chosen).catch(console.error);
                  }
                }}
                onSaveWeeklyChallenge={(ch) => {
                  setWeeklyChallenges((prev) => {
                    const idx = prev.findIndex((c) => c.id === ch.id);
                    if (idx >= 0) {
                      const copy = [...prev];
                      copy[idx] = ch;
                      return copy;
                    }
                    return [ch, ...prev];
                  });
                  saveWeeklyLearningChallenge(ch).catch(console.error);
                }}
                onOpenChatWithDraft={(prefill) => {
                  setChatDraftText(prefill);
                  setActiveTab('chat');
                }}
                onAnswerQuiz={handleAnswerQuiz}
                onSaveDateIdea={handleSaveDateIdea}
                onToggleChallenge={handleToggleChallenge}
                onAddNewQuiz={handleAddNewQuiz}
                onAddNewDateIdea={handleAddNewDateIdea}
                onSendChatMessage={handleSendChatMessage}
              />
            </div>
          )}
        </div>
      </main>

      {/* Romantic Footer */}
      {activeTab !== 'chat' && (
        <footer className="border-t border-rose-100/70 py-6 text-center text-xs text-stone-500 bg-white/40">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <span>{profile.relationshipTitle}</span>
            <span>•</span>
            <span className="text-rose-500">❤️</span>
            <span>Espace d'Amour & de Complicité</span>
          </p>
        </footer>
      )}

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
            key="modal-write-note"
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
            key="modal-add-memory"
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
            key="modal-add-capsule"
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
            key="modal-add-location"
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
            key="modal-add-voucher"
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
            key="modal-add-bucket"
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
            key="modal-profile"
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
            totalMessagesCount={messages.length}
            onPurgeOldChatMessages={handlePurgeOldChatMessages}
          />
        )}

        {deleteTarget && (
          <ConfirmDeleteModal
            key="modal-confirm-delete"
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
          key="modal-pwa-install"
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
        />

        <NotificationAlertModal
          key="modal-notification-alert"
          isOpen={showNotificationModal}
          onClose={() => {
            setShowNotificationModal(false);
            checkPushSubscription();
          }}
          profile={profile}
          activePartnerId={activePartnerId}
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
