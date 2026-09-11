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

export interface CoupleSettings {
  pinCode?: string; // 4 chiffres, ex: "2024"
  isPinEnabled: boolean;
  songTitle?: string; // e.g. "Sidiki Diabaté - C'est bon" or "Notre chanson d'amour"
  songAudioUrl?: string; // optional user mp3 / audio stream URL
  ambientTrackId: AmbientTrackId;
  musicVolume: number; // 0 to 1
  isMusicPlaying: boolean;
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
  settings?: CoupleSettings;
}
