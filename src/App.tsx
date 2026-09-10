import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Navigation, MainTab } from './components/Navigation';
import { MoodAndNeedsBar } from './components/MoodAndNeedsBar';
import { MissYouModal } from './components/MissYouModal';
import { JournalView } from './components/views/JournalView';
import { TimelineView } from './components/views/TimelineView';
import { GamesView } from './components/views/GamesView';
import { VouchersAndBucketView } from './components/views/VouchersAndBucketView';
import { WriteNoteModal } from './components/modals/WriteNoteModal';
import { AddMemoryModal } from './components/modals/AddMemoryModal';
import { AddCapsuleModal } from './components/modals/AddCapsuleModal';
import { AddLocationModal } from './components/modals/AddLocationModal';
import { AddVoucherModal } from './components/modals/AddVoucherModal';
import { AddBucketModal } from './components/modals/AddBucketModal';
import { ProfileModal } from './components/modals/ProfileModal';
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
      return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  });

  const [capsules, setCapsules] = useState<TimeCapsule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAPSULES);
      return saved ? JSON.parse(saved) : INITIAL_CAPSULES;
    } catch {
      return INITIAL_CAPSULES;
    }
  });

  const [locations, setLocations] = useState<MemoryLocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
      return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
    } catch {
      return INITIAL_LOCATIONS;
    }
  });

  const [notes, setNotes] = useState<SweetNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
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
      return saved ? JSON.parse(saved) : INITIAL_BUCKET_LIST;
    } catch {
      return INITIAL_BUCKET_LIST;
    }
  });

  const [vouchers, setVouchers] = useState<LoveVoucher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
      return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
    } catch {
      return INITIAL_VOUCHERS;
    }
  });

  const [gratitudes, setGratitudes] = useState<DailyGratitude[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRATITUDES);
      return saved ? JSON.parse(saved) : INITIAL_GRATITUDES;
    } catch {
      return INITIAL_GRATITUDES;
    }
  });

  // Real-time Miss You Pulse state
  const [activeMissYouPulse, setActiveMissYouPulse] = useState<MissYouPulse | null>(null);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWriteNoteModal, setShowWriteNoteModal] = useState(false);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [showAddCapsuleModal, setShowAddCapsuleModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddVoucherModal, setShowAddVoucherModal] = useState(false);
  const [showAddBucketModal, setShowAddBucketModal] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PARTNER, activePartnerId);
  }, [activePartnerId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPSULES, JSON.stringify(capsules));
  }, [capsules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DATES, JSON.stringify(dateIdeas));
  }, [dateIdeas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUCKET, JSON.stringify(bucketList));
  }, [bucketList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GRATITUDES, JSON.stringify(gratitudes));
  }, [gratitudes]);

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

    setProfile((prev) => ({
      ...prev,
      [partnerId === 'p1' ? 'partner1' : 'partner2']: {
        ...prev[partnerId === 'p1' ? 'partner1' : 'partner2'],
        mood: {
          ...newMood,
          lastUpdated: formattedTime,
        },
      },
    }));
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
  };

  const handleMarkNoteAsRead = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, isRead: true, readAt: "Aujourd'hui" }
          : n
      )
    );
  };

  const handleToggleFavoriteNote = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
      )
    );
  };

  const handleReactNote = (noteId: string, emoji: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, reaction: emoji } : n))
    );
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
  };

  const handleLikeGratitude = (gratId: string) => {
    setGratitudes((prev) =>
      prev.map((g) => {
        if (g.id === gratId) {
          const hasLiked = g.likes.includes(activePartnerId);
          return {
            ...g,
            likes: hasLiked
              ? g.likes.filter((id) => id !== activePartnerId)
              : [...g.likes, activePartnerId],
          };
        }
        return g;
      })
    );
  };

  // Memory actions
  const handleAddMemory = (memData: Omit<TimelineMemory, 'id' | 'likes'>) => {
    const newMem: TimelineMemory = {
      id: `mem-${Date.now()}`,
      ...memData,
      likes: [activePartnerId],
    };
    setMemories((prev) => [newMem, ...prev]);
  };

  const handleLikeMemory = (memId: string) => {
    setMemories((prev) =>
      prev.map((m) => {
        if (m.id === memId) {
          const hasLiked = m.likes.includes(activePartnerId);
          return {
            ...m,
            likes: hasLiked
              ? m.likes.filter((id) => id !== activePartnerId)
              : [...m.likes, activePartnerId],
          };
        }
        return m;
      })
    );
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
  };

  const handleUnlockCapsule = (capId: string) => {
    setCapsules((prev) =>
      prev.map((c) => (c.id === capId ? { ...c, isOpened: true } : c))
    );
  };

  // Location actions
  const handleAddLocation = (locData: Omit<MemoryLocation, 'id'>) => {
    const newLoc: MemoryLocation = {
      id: `loc-${Date.now()}`,
      ...locData,
    };
    setLocations((prev) => [...prev, newLoc]);
  };

  // Quiz actions
  const handleAnswerQuiz = (
    quizId: string,
    partnerId: PartnerId,
    answerIndex: number
  ) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          return {
            ...q,
            [partnerId === 'p1' ? 'partner1Answer' : 'partner2Answer']: answerIndex,
          };
        }
        return q;
      })
    );
  };

  const handleAddNewQuiz = (newQ: QuizQuestion) => {
    setQuizzes((prev) => [...prev, newQ]);
  };

  // Date ideas actions
  const handleSaveDateIdea = (idea: DateIdea) => {
    setDateIdeas((prev) =>
      prev.map((d) => (d.id === idea.id ? { ...d, isSaved: true } : d))
    );
  };

  const handleAddNewDateIdea = (idea: DateIdea) => {
    setDateIdeas((prev) => [idea, ...prev]);
  };

  // Challenge actions
  const handleToggleChallenge = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === challengeId) {
          return {
            ...c,
            isCompleted: !c.isCompleted,
            completedDate: !c.isCompleted ? "Aujourd'hui" : undefined,
          };
        }
        return c;
      })
    );
  };

  // Voucher actions
  const handleRedeemVoucher = (voucherId: string) => {
    const formattedDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === voucherId
          ? { ...v, isRedeemed: true, redeemedAt: formattedDate }
          : v
      )
    );
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
  };

  // Bucket actions
  const handleAddBucketItem = (itemData: Omit<BucketItem, 'id' | 'status'>) => {
    const newB: BucketItem = {
      id: `buck-${Date.now()}`,
      ...itemData,
      status: 'todo',
    };
    setBucketList((prev) => [...prev, newB]);
  };

  const handleUpdateBucketStatus = (
    itemId: string,
    status: BucketItem['status']
  ) => {
    setBucketList((prev) =>
      prev.map((b) => (b.id === itemId ? { ...b, status } : b))
    );
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

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-between selection:bg-rose-200">
      {/* Top Header */}
      <Header
        profile={profile}
        activePartnerId={activePartnerId}
        onSwitchPartner={handleSwitchPartner}
        onOpenSettings={() => setShowProfileModal(true)}
        onSendMissYou={handleSendMissYou}
        unreadNotesCount={unreadNotesCount}
        onGoToNotes={() => setActiveTab('journal')}
      />

      {/* Main Body */}
      <main className="flex-1 pb-12">
        {/* Real-time Mood & Needs Bar */}
        <MoodAndNeedsBar
          profile={profile}
          activePartnerId={activePartnerId}
          onUpdateMood={handleUpdateMood}
        />

        {/* Tab Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unreadNotesCount={unreadNotesCount}
        />

        {/* Views */}
        <div className="transition-opacity duration-200">
          {activeTab === 'journal' && (
            <JournalView
              profile={profile}
              activePartnerId={activePartnerId}
              notes={notes}
              gratitudes={gratitudes}
              onOpenWriteNoteModal={() => setShowWriteNoteModal(true)}
              onMarkNoteAsRead={handleMarkNoteAsRead}
              onToggleFavoriteNote={handleToggleFavoriteNote}
              onReactNote={handleReactNote}
              onAddGratitude={handleAddGratitude}
              onLikeGratitude={handleLikeGratitude}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView
              profile={profile}
              activePartnerId={activePartnerId}
              memories={memories}
              capsules={capsules}
              locations={locations}
              onOpenAddMemoryModal={() => setShowAddMemoryModal(true)}
              onOpenAddCapsuleModal={() => setShowAddCapsuleModal(true)}
              onOpenAddLocationModal={() => setShowAddLocationModal(true)}
              onLikeMemory={handleLikeMemory}
              onUnlockCapsule={handleUnlockCapsule}
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
              onOpenAddVoucherModal={() => setShowAddVoucherModal(true)}
              onOpenAddBucketModal={() => setShowAddBucketModal(true)}
              onUpdateBucketStatus={handleUpdateBucketStatus}
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
        {showWriteNoteModal && (
          <WriteNoteModal
            profile={profile}
            activePartnerId={activePartnerId}
            onClose={() => setShowWriteNoteModal(false)}
            onSendNote={handleSendNote}
          />
        )}

        {showAddMemoryModal && (
          <AddMemoryModal
            profile={profile}
            activePartnerId={activePartnerId}
            onClose={() => setShowAddMemoryModal(false)}
            onAddMemory={handleAddMemory}
          />
        )}

        {showAddCapsuleModal && (
          <AddCapsuleModal
            profile={profile}
            activePartnerId={activePartnerId}
            onClose={() => setShowAddCapsuleModal(false)}
            onAddCapsule={handleAddCapsule}
          />
        )}

        {showAddLocationModal && (
          <AddLocationModal
            onClose={() => setShowAddLocationModal(false)}
            onAddLocation={handleAddLocation}
          />
        )}

        {showAddVoucherModal && (
          <AddVoucherModal
            profile={profile}
            activePartnerId={activePartnerId}
            onClose={() => setShowAddVoucherModal(false)}
            onAddVoucher={handleAddVoucher}
          />
        )}

        {showAddBucketModal && (
          <AddBucketModal
            activePartnerId={activePartnerId}
            onClose={() => setShowAddBucketModal(false)}
            onAddBucketItem={handleAddBucketItem}
          />
        )}

        {showProfileModal && (
          <ProfileModal
            profile={profile}
            onClose={() => setShowProfileModal(false)}
            onSaveProfile={setProfile}
            onResetToDefault={handleResetToDefault}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
