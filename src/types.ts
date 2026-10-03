export type PartnerId = 'p1' | 'p2';

export interface Partner {
  id: PartnerId;
  name: string;
  nickname: string;
  avatar: string;
  color: string;
  mood: {
    energy: number; // 1 to 5
    status: string; // 'Rayonnant' | 'Zen' | 'Fatigué' | 'Stressé' | 'Câlin' | 'Créatif'
    need: string; // 'Besoin d\'un câlin' | 'Envie d\'être tranquille' | 'Prêt à sortir' | 'Besoin d\'écoute' | 'Surprise-moi'
    note?: string;
    lastUpdated: string;
  };
}

export interface CoupleProfile {
  partner1: Partner;
  partner2: Partner;
  anniversaryDate: string; // 'YYYY-MM-DD'
  relationshipTitle: string;
  themeColor: string;
}

export interface TimelineMemory {
  id: string;
  title: string;
  date: string;
  category: 'voyage' | 'rencard' | 'anecdote' | 'etape' | 'fourire';
  description: string;
  photoUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  videoDuration?: number; // duration in seconds
  videoThumbnail?: string;
  locationName?: string;
  coordinates?: { lat: number; lng: number };
  audioDuration?: string;
  tags: string[];
  likes: PartnerId[];
  authorId: PartnerId;
}

export interface TimeCapsule {
  id: string;
  title: string;
  targetUnlockDate: string; // 'YYYY-MM-DD'
  createdAt: string;
  authorId: PartnerId;
  recipientId: PartnerId;
  message: string;
  photoUrl?: string;
  sealTheme: 'gold' | 'rose' | 'ruby' | 'emerald';
  isOpened?: boolean;
}

export interface MemoryLocation {
  id: string;
  name: string;
  category: '1er Rencard' | 'Voyage' | 'Coup de Cœur' | 'Nid Douillet' | 'Balade Romantique';
  description: string;
  date: string;
  photoUrl?: string;
  xPercent: number; // For responsive visual map
  yPercent: number;
  city: string;
  iconName: string;
}

export interface SweetNote {
  id: string;
  senderId: PartnerId;
  recipientId: PartnerId;
  date: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  backgroundStyle: 'cream' | 'rose' | 'terracotta' | 'lavender';
  isFavorite: boolean;
  reaction?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  category: 'Complicité' | 'Rêves & Futur' | 'Fous Rires' | 'Sensibilité' | 'Quotidien';
  options: string[];
  partner1Answer?: number;
  partner2Answer?: number;
  discussionPrompt: string;
  isDaily?: boolean;
}

export interface DateIdea {
  id: string;
  title: string;
  description: string;
  budget: 'Gratuit' | '€' | '€€' | '€€€';
  weather: 'Pluie/Cosy' | 'Plein air' | 'Indifférent';
  category: 'Maison' | 'Sortie' | 'Aventure' | 'Romantique' | 'Gourmand';
  prepTip?: string;
  isSaved?: boolean;
  isCompleted?: boolean;
  completedDate?: string;
}

export interface CoupleChallenge {
  id: string;
  title: string;
  description: string;
  category: 'Romantique' | 'Créatif' | 'Aventure' | 'Bien-être';
  points: number;
  isCompleted: boolean;
  completedDate?: string;
  photoProof?: string;
}

export interface BucketItem {
  id: string;
  title: string;
  category: 'Voyage' | 'Projet de vie' | 'Activité insolite' | 'Cadeau & Plaisir';
  status: 'todo' | 'in_progress' | 'done';
  targetDate?: string;
  budgetEstimate?: string;
  notes?: string;
  photoUrl?: string;
  addedBy: PartnerId;
}

export interface LoveVoucher {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  giverId: PartnerId;
  receiverId: PartnerId;
  isRedeemed: boolean;
  redeemedAt?: string;
  customTerms?: string;
}

export interface DailyGratitude {
  id: string;
  date: string;
  authorId: PartnerId;
  content: string;
  likes: PartnerId[];
}

export interface MissYouPulse {
  id: string;
  timestamp: string;
  senderId: PartnerId;
  vibe: 'hug' | 'kiss' | 'thought' | 'flame' | 'urgent';
  message: string;
}

export type AmbientTrackId =
  | 'kora_serenade'
  | 'river_breeze'
  | 'starry_night'
  | 'soft_rain'
  | 'none';

export type GameAnimationSpeed = 'slow' | 'normal' | 'fast' | 'ultra';

export interface CoupleSettings {
  pinCode?: string; // 4 chiffres, ex: "2024"
  isPinEnabled: boolean;
  songTitle?: string; // e.g. "Sidiki Diabaté - C'est bon" or "Notre chanson d'amour"
  songAudioUrl?: string; // optional user mp3 / audio stream URL
  ambientTrackId: AmbientTrackId;
  musicVolume: number; // 0 to 1
  isMusicPlaying: boolean;
  // Allègement de la base de données (purge automatique des messages anciens)
  autoCleanChatEnabled?: boolean;
  autoCleanChatDays?: number; // ex: 7, 14, 30, 60, 90 jours
  lastAutoCleanAt?: string; // date ISO du dernier nettoyage
  // Vitesse d'animation des jeux (Accessibilité ou Compétition)
  gameAnimationSpeed?: GameAnimationSpeed;
}

export interface ChatMessage {
  id: string;
  senderId: PartnerId;
  content: string;
  timestamp: string; // ISO string
  timestampMs?: number; // Exact millisecond timestamp for strict chronological order
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video';
  videoDuration?: number; // duration in seconds
  videoThumbnail?: string;
  audioDuration?: number; // duration in seconds
  reactions?: Record<string, string>; // e.g. { p1: '❤️', p2: '😂' }
  replyTo?: {
    id: string;
    senderId: PartnerId;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'audio' | 'video';
  };
  status?: 'sent' | 'delivered' | 'read';
  readStatus?: 'sent' | 'delivered' | 'read' | 'unread' | boolean;
  readAt?: string; // Date et heure de lecture par le partenaire
  isEdited?: boolean;
  editedAt?: string;
  isLearningChallengeValidation?: boolean;
  learningChallengeTarget?: string;
  learningChallengeBonus?: number;
}

export interface ChatTypingStatus {
  partnerId: PartnerId;
  isTyping: boolean;
  updatedAt: string;
}

export interface FullCoupleBackup {
  version: string;
  exportedAt: string;
  profile: CoupleProfile;
  memories: TimelineMemory[];
  capsules: TimeCapsule[];
  locations: MemoryLocation[];
  notes: SweetNote[];
  quizzes: QuizQuestion[];
  dateIdeas: DateIdea[];
  challenges: CoupleChallenge[];
  bucketList: BucketItem[];
  vouchers: LoveVoucher[];
  gratitudes: DailyGratitude[];
  chatMessages?: ChatMessage[];
  settings?: CoupleSettings;
}

// English Learning For Couples (Débutants)
export interface EnglishLessonItem {
  id: string;
  english: string;
  phonetic: string;
  french: string;
  contextOrTip?: string;
  category: string;
  audioExample?: string;
  tags?: string[];
}

export interface EnglishLessonModule {
  id: string;
  level: 'Débutant A0' | 'Débutant A1';
  title: string;
  englishTitle: string;
  icon: string;
  description: string;
  color: string;
  badgeColor: string;
  items: EnglishLessonItem[];
}

export interface EnglishRoleplayDialogue {
  id: string;
  title: string;
  frenchTitle: string;
  situation: string;
  icon: string;
  lines: {
    speaker: 'partner1' | 'partner2';
    english: string;
    phonetic: string;
    french: string;
  }[];
}

export interface EnglishQuizQuestion {
  id: string;
  type: 'multiple_choice' | 'word_order' | 'listen_guess';
  question: string;
  audioText?: string;
  options?: string[];
  correctAnswer: string | number;
  scrambledWords?: string[];
  explanation: string;
  xpReward: number;
}

export interface EnglishLexiconItem {
  id: string;
  english: string;
  french: string;
  phonetic?: string;
  definition?: string; // Définition ou explication détaillée pour mieux retenir
  contextSentence?: string; // Phrase contextuelle / exemple en anglais
  contextSentenceFrench?: string; // Traduction de la phrase contextuelle
  personalMemory?: string; // Souvenir / note personnelle de couple
  category?: 'romantique' | 'quotidien' | 'restaurant' | 'voyage' | 'humour' | 'autre';
  isFavorite?: boolean;
  isMastered?: boolean;
  addedBy: PartnerId;
  createdAt: string;
  updatedAt?: string;
}

export type EnglishCustomWord = EnglishLexiconItem;

export interface EnglishProgressState {
  xpPoints: number;
  masteredItemIds: string[];
  completedQuizIds: string[];
  dailyStreak: number;
  lastStudiedDate: string;
  customSavedWords: EnglishLexiconItem[];
}

export interface WeeklyLearningChallenge {
  id: string;
  weekKey: string; // e.g. "2026-W38"
  weekNumber: number; // e.g. 1 to 52
  title: string; // Titre poétique ou thématique du défi
  category: 'word' | 'grammar' | 'expression';
  targetEnglish: string; // Mot ou structure cible en anglais
  targetFrench: string; // Traduction / équivalent en français
  phonetic?: string; // Prononciation phonétique simplifiée
  grammarRule?: string; // Formule grammaticale ou structure syntaxique (ex: "Subject + can't help but + V-ing")
  description: string; // Consigne détaillée en français
  tips: string; // Conseil complice pour glisser l'expression naturellement dans le chat
  detectionKeywords: string[]; // Mots-clés ou fragments détectés dans les messages du chat
  exampleSentences: {
    english: string;
    french: string;
  }[];
  pointsReward: number; // Points de couple gagnés par partenaire (ex: 50 pts)
  duoBonusPoints: number; // Bonus additionnel quand les deux partenaires ont relevé le défi (ex: 100 pts)
  partner1Completed: boolean;
  partner1CompletedAt?: string;
  partner1Snippet?: string;
  partner1MessageId?: string;
  partner2Completed: boolean;
  partner2CompletedAt?: string;
  partner2Snippet?: string;
  partner2MessageId?: string;
  bothCompleted: boolean;
  bothCompletedAt?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isCustom?: boolean;
}

export interface MorpionGameSession {
  id: string; // 'morpion_live'
  board: (string | null)[]; // 9 cells
  currentTurn: PartnerId; // 'p1' | 'p2'
  p1Symbol: string; // '💖'
  p2Symbol: string; // '🌹'
  winner: PartnerId | 'tie' | null;
  winningLine: number[] | null;
  p1Wins: number;
  p2Wins: number;
  ties: number;
  selectedPledge: string;
  pledgeFulfilled: boolean;
  lastMoveBy?: PartnerId | null;
  lastMoveIndex?: number | null;
  lastUpdated: string;
  rematchRequestedBy?: PartnerId | null;
  mode?: 'live' | 'local' | 'ai';
  p1Active?: boolean;
  p2Active?: boolean;
}

export interface WhoQuestion {
  id: string;
  text: string;
  category: 'Quotidien' | 'Romance' | 'Fous rires' | 'Avenir' | 'Intime';
  authorId?: PartnerId; // 'p1' | 'p2'
  authorName?: string;
  createdAt?: string;
  isCustom?: boolean;
  votes?: {
    p1?: PartnerId;
    p2?: PartnerId;
  };
}

export interface WhoMostLikelySession {
  id: string; // 'who_most_likely_live'
  currentQuestionIndex: number;
  votes: {
    p1?: PartnerId;
    p2?: PartnerId;
  };
  revealed: boolean;
  scoreMatches: number;
  totalAnswered: number;
  lastUpdated: string;
  customQuestions?: WhoQuestion[];
}

export interface LoveRouletteSession {
  id: string; // 'love_roulette_live'
  isSpinning: boolean;
  targetIndex: number;
  targetItem: string;
  category: 'dates' | 'pledges' | 'sweet';
  spunBy: PartnerId;
  spinTimestamp: number;
  lastUpdated: string;
}

export interface LoveTouchSession {
  id: string; // 'love_touch_live'
  p1Touching: boolean;
  p2Touching: boolean;
  p1LastTouched?: string;
  p2LastTouched?: string;
  lastUpdated: string;
}

// -------------------------------------------------------------
// LUDO MS DUO AMOUROUX EN DIRECT
// -------------------------------------------------------------
export interface LudoToken {
  id: string; // e.g. 'p1_0', 'p1_1', 'p2_0', 'p2_1'
  player: PartnerId; // 'p1' | 'p2'
  state: 'yard' | 'path' | 'home_run' | 'finished';
  step: number; // 0 in yard, 0..50 on path, 51..55 on home run, 56 is finished
}

export interface LudoGameSession {
  id: string; // 'ludo_live'
  currentTurn: PartnerId;
  diceValue: number | null;
  isRolling: boolean;
  consecutiveSixes: number;
  tokens: {
    p1: LudoToken[];
    p2: LudoToken[];
  };
  winner: PartnerId | null;
  lastMoveBy?: PartnerId | null;
  lastMoveText?: string | null;
  lastDiceRolledBy?: PartnerId | null;
  p1Wins: number;
  p2Wins: number;
  selectedPledge?: string;
  tokensPerPlayer: 2 | 4;
  lastUpdated: string;
}

// -------------------------------------------------------------
// HISTORIQUE DES SCORES GLOBAUX DU COUPLE POUR TOUS LES JEUX
// -------------------------------------------------------------
export interface GameHistoryEntry {
  id: string;
  gameId: string;
  gameTitle: string;
  winner: PartnerId | 'tie';
  winnerName: string;
  timestamp: string;
  pledge?: string;
  notes?: string;
}

export interface GameScoreRecord {
  gameId: string;
  gameTitle: string;
  category: 'duo' | 'flirt' | 'bilingual';
  p1Wins: number;
  p1Losses: number;
  p2Wins: number;
  p2Losses: number;
  ties: number;
  totalPlayed: number;
  lastPlayedAt?: string;
  lastWinner?: PartnerId | 'tie' | null;
}

export interface GlobalGamesScoreboard {
  id: string; // 'global_scores'
  games: Record<string, GameScoreRecord>;
  recentHistory: GameHistoryEntry[];
  totalP1Wins: number;
  totalP2Wins: number;
  totalTies: number;
  totalPlayed: number;
  lastUpdated: string;
}


