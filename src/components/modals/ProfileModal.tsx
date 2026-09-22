import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Heart,
  Calendar,
  RefreshCw,
  Camera,
  Upload,
  Link as LinkIcon,
  Check,
  Lock,
  Download,
  FileJson,
  Shield,
  AlertTriangle,
  Cloud,
  CheckCircle2,
  Smartphone,
  Trash2,
  Palette,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Database,
  Clock,
  Bell,
  BellRing,
  Radio,
  Flame,
  ChevronRight,
  Eye,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { CoupleProfile, PartnerId, CoupleSettings, FullCoupleBackup } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti } from '../../lib/confetti';
import { processImageFile } from '../../lib/imageUtils';
import {
  sendSystemNotification,
  requestNotificationPermission,
  triggerVibration,
  subscribeToPushNotifications,
  sendTestPushNotification,
} from '../../lib/notificationService';
import { PartnerAvatar } from '../PartnerAvatar';

interface ProfileModalProps {
  profile: CoupleProfile;
  settings: CoupleSettings;
  onClose: () => void;
  onSaveProfile: (profile: CoupleProfile) => void;
  onSaveSettings: (settings: CoupleSettings) => void;
  onResetToDefault: () => void;
  initialFocusPartner?: PartnerId;
  onExportBackup: () => void;
  onImportBackup: (backup: FullCoupleBackup) => void;
  onLockApp: () => void;
  isFirebaseConnected?: boolean;
  totalMessagesCount?: number;
  onPurgeOldChatMessages?: (days: number) => Promise<number>;
}

// Romantic mood options
const MOOD_STATUS_OPTIONS = [
  { value: 'Rayonnant', label: 'Rayonnant(e)', emoji: '✨', color: 'from-amber-400 to-yellow-500' },
  { value: 'Zen', label: 'Zen & Apaisé(e)', emoji: '🌿', color: 'from-emerald-400 to-teal-500' },
  { value: 'Câlin', label: 'Doux Câlin', emoji: '🧸', color: 'from-pink-400 to-rose-500' },
  { value: 'Amoureux', label: 'Fou Amoureux', emoji: '❤️', color: 'from-rose-500 to-red-600' },
  { value: 'Fatigué', label: 'Fatigué(e)', emoji: '😴', color: 'from-indigo-400 to-blue-500' },
  { value: 'Stressé', label: 'Besoin de réconfort', emoji: '⚡', color: 'from-orange-400 to-amber-500' },
  { value: 'Créatif', label: 'Inspiré(e)', emoji: '🎨', color: 'from-purple-400 to-violet-500' },
];

const MOOD_NEED_OPTIONS = [
  { value: "Besoin d'un câlin", label: 'Un gros câlin', emoji: '🤗' },
  { value: "Envie d'être tranquille", label: 'Un moment calme', emoji: '🧘' },
  { value: 'Prêt à sortir', label: 'Sortir ensemble', emoji: '🎉' },
  { value: "Besoin d'écoute", label: 'Discuter & écoute', emoji: '💬' },
  { value: 'Surprise-moi', label: 'Surprise-moi !', emoji: '🎁' },
  { value: 'Un mot doux', label: 'Un petit mot doux', emoji: '💌' },
];

const PRESET_COLORS_P1 = [
  { label: 'Rose Passion', color: '#F43F5E' },
  { label: 'Framboise', color: '#E11D48' },
  { label: 'Lilas', color: '#EC4899' },
  { label: 'Améthyste', color: '#8B5CF6' },
  { label: 'Corail', color: '#F97316' },
  { label: 'Soleil', color: '#F59E0B' },
  { label: 'Émeraude', color: '#10B981' },
  { label: 'Océan', color: '#0284C7' },
];

const PRESET_COLORS_P2 = [
  { label: 'Bleu Roi', color: '#0284C7' },
  { label: 'Ciel Dégagé', color: '#0EA5E9' },
  { label: 'Indigo', color: '#6366F1' },
  { label: 'Turquoise', color: '#14B8A6' },
  { label: 'Émeraude', color: '#10B981' },
  { label: 'Ambre Chaud', color: '#F59E0B' },
  { label: 'Violet', color: '#8B5CF6' },
  { label: 'Rose', color: '#F43F5E' },
];

const THEME_COLORS = [
  { label: 'Rose Romantique', color: '#F43F5E', accent: 'bg-rose-500', border: 'border-rose-300' },
  { label: 'Rubis Passion', color: '#E11D48', accent: 'bg-red-600', border: 'border-red-300' },
  { label: 'Bleu Océan', color: '#0284C7', accent: 'bg-sky-600', border: 'border-sky-300' },
  { label: 'Émeraude Royale', color: '#10B981', accent: 'bg-emerald-600', border: 'border-emerald-300' },
  { label: 'Violet Mystique', color: '#8B5CF6', accent: 'bg-purple-600', border: 'border-purple-300' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  settings,
  onClose,
  onSaveProfile,
  onSaveSettings,
  onResetToDefault,
  initialFocusPartner,
  onExportBackup,
  onImportBackup,
  onLockApp,
  isFirebaseConnected = true,
  totalMessagesCount = 0,
  onPurgeOldChatMessages,
}) => {
  const [modalTab, setModalTab] = useState<'profile' | 'security' | 'storage' | 'backup' | 'app_mobile'>('profile');
  const [activePartnerSubTab, setActivePartnerSubTab] = useState<'both' | 'p1' | 'p2'>(
    initialFocusPartner === 'p2' ? 'p2' : initialFocusPartner === 'p1' ? 'p1' : 'both'
  );

  // Partner 1 states
  const [partner1Name, setPartner1Name] = useState(profile.partner1.name);
  const [partner1Nickname, setPartner1Nickname] = useState(profile.partner1.nickname);
  const [partner1Avatar, setPartner1Avatar] = useState(profile.partner1.avatar);
  const [partner1Color, setPartner1Color] = useState(profile.partner1.color || '#F43F5E');
  const [partner1MoodStatus, setPartner1MoodStatus] = useState(profile.partner1.mood?.status || 'Rayonnant');
  const [partner1MoodNeed, setPartner1MoodNeed] = useState(profile.partner1.mood?.need || "Besoin d'un câlin");
  const [partner1MoodEnergy, setPartner1MoodEnergy] = useState<number>(profile.partner1.mood?.energy ?? 5);
  const [isP1LoadingPhoto, setIsP1LoadingPhoto] = useState(false);
  const [showP1UrlInput, setShowP1UrlInput] = useState(false);
  const [p1Error, setP1Error] = useState<string | null>(null);

  // Partner 2 states
  const [partner2Name, setPartner2Name] = useState(profile.partner2.name);
  const [partner2Nickname, setPartner2Nickname] = useState(profile.partner2.nickname);
  const [partner2Avatar, setPartner2Avatar] = useState(profile.partner2.avatar);
  const [partner2Color, setPartner2Color] = useState(profile.partner2.color || '#0284C7');
  const [partner2MoodStatus, setPartner2MoodStatus] = useState(profile.partner2.mood?.status || 'Zen');
  const [partner2MoodNeed, setPartner2MoodNeed] = useState(profile.partner2.mood?.need || 'Surprise-moi');
  const [partner2MoodEnergy, setPartner2MoodEnergy] = useState<number>(profile.partner2.mood?.energy ?? 5);
  const [isP2LoadingPhoto, setIsP2LoadingPhoto] = useState(false);
  const [showP2UrlInput, setShowP2UrlInput] = useState(false);
  const [p2Error, setP2Error] = useState<string | null>(null);

  // Couple states
  const [anniversaryDate, setAnniversaryDate] = useState(profile.anniversaryDate);
  const [relationshipTitle, setRelationshipTitle] = useState(profile.relationshipTitle);
  const [themeColor, setThemeColor] = useState(profile.themeColor || '#F43F5E');

  // Security / PIN states
  const [isPinEnabled, setIsPinEnabled] = useState(settings.isPinEnabled);
  const [pinCode, setPinCode] = useState(settings.pinCode || '1234');
  const [confirmPinCode, setConfirmPinCode] = useState(settings.pinCode || '1234');
  const [pinSaveFeedback, setPinSaveFeedback] = useState<string | null>(null);

  // Storage / Auto-Clean History states
  const [autoCleanChatEnabled, setAutoCleanChatEnabled] = useState<boolean>(
    settings.autoCleanChatEnabled ?? false
  );
  const [autoCleanChatDays, setAutoCleanChatDays] = useState<number>(
    settings.autoCleanChatDays ?? 30
  );
  const [isPurgingNow, setIsPurgingNow] = useState<boolean>(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);
  const [storageSaveFeedback, setStorageSaveFeedback] = useState<string | null>(null);

  // Web Push Notifications & Badging state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });
  const [notifTestFeedback, setNotifTestFeedback] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // File refs
  const p1FileInputRef = useRef<HTMLInputElement>(null);
  const p1CameraInputRef = useRef<HTMLInputElement>(null);
  const p2FileInputRef = useRef<HTMLInputElement>(null);
  const p2CameraInputRef = useRef<HTMLInputElement>(null);
  const backupImportInputRef = useRef<HTMLInputElement>(null);

  // Calculate days together
  const daysTogether = useMemo(() => {
    if (!anniversaryDate) return null;
    const start = new Date(anniversaryDate).getTime();
    if (isNaN(start)) return null;
    const diff = Date.now() - start;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }, [anniversaryDate]);

  const handleP1FileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsP1LoadingPhoto(true);
    setP1Error(null);
    try {
      const compressedDataUrl = await processImageFile(file, 360, 0.85);
      setPartner1Avatar(compressedDataUrl);
      soundEffects.playSuccessSparkle();
    } catch (err: any) {
      setP1Error(err?.message || 'Erreur lors du traitement de la photo.');
    } finally {
      setIsP1LoadingPhoto(false);
      if (p1FileInputRef.current) p1FileInputRef.current.value = '';
      if (p1CameraInputRef.current) p1CameraInputRef.current.value = '';
    }
  };

  const handleP2FileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsP2LoadingPhoto(true);
    setP2Error(null);
    try {
      const compressedDataUrl = await processImageFile(file, 360, 0.85);
      setPartner2Avatar(compressedDataUrl);
      soundEffects.playSuccessSparkle();
    } catch (err: any) {
      setP2Error(err?.message || 'Erreur lors du traitement de la photo.');
    } finally {
      setIsP2LoadingPhoto(false);
      if (p2FileInputRef.current) p2FileInputRef.current.value = '';
      if (p2CameraInputRef.current) p2CameraInputRef.current.value = '';
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backupData: FullCoupleBackup = JSON.parse(content);
        if (!backupData.profile || !backupData.profile.partner1) {
          throw new Error('Fichier de sauvegarde invalide.');
        }
        if (confirm('Voulez-vous restaurer cette sauvegarde ? Vos données actuelles seront remplacées par celles du fichier.')) {
          onImportBackup(backupData);
          soundEffects.playSuccessSparkle();
          triggerCelebrationConfetti();
          onClose();
        }
      } catch (err: any) {
        alert('Erreur lors de la lecture du fichier : ' + (err?.message || 'Format JSON invalide'));
      }
    };
    reader.readAsText(file);
    if (backupImportInputRef.current) backupImportInputRef.current.value = '';
  };

  const handleSavePinSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPinEnabled) {
      if (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
        setPinSaveFeedback('Le code PIN doit comporter exactement 4 chiffres.');
        return;
      }
      if (pinCode !== confirmPinCode) {
        setPinSaveFeedback('Les deux codes PIN ne correspondent pas.');
        return;
      }
    }

    onSaveSettings({
      ...settings,
      isPinEnabled,
      pinCode,
    });

    setPinSaveFeedback('Paramètres de sécurité enregistrés !');
    soundEffects.playSuccessSparkle();
    setTimeout(() => setPinSaveFeedback(null), 3000);
  };

  const handleSaveStorageSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedSettings: CoupleSettings = {
      ...settings,
      autoCleanChatEnabled,
      autoCleanChatDays: Math.max(1, Number(autoCleanChatDays) || 30),
    };
    onSaveSettings(updatedSettings);
    soundEffects.playSuccessSparkle();
    setStorageSaveFeedback('Options de nettoyage de la base enregistrées !');
    setTimeout(() => setStorageSaveFeedback(null), 3500);
  };

  const handlePurgeNow = async () => {
    const days = Math.max(1, Number(autoCleanChatDays) || 30);
    const confirmed = confirm(
      `Confirmez-vous la suppression définitive de tous les messages de plus de ${days} jours pour alléger la base de données Firestore et cet appareil ?`
    );
    if (!confirmed) return;

    setIsPurgingNow(true);
    setPurgeFeedback(null);
    try {
      if (onPurgeOldChatMessages) {
        const deletedCount = await onPurgeOldChatMessages(days);
        soundEffects.playSuccessSparkle();
        triggerCelebrationConfetti();
        if (deletedCount > 0) {
          setPurgeFeedback(`✨ Succès : ${deletedCount} ancien(s) message(s) purgé(s) de Firestore !`);
        } else {
          setPurgeFeedback(`ℹ️ Aucun message antérieur à ${days} jours trouvé dans l'historique.`);
        }
      }
    } catch (err: any) {
      setPurgeFeedback(`Erreur lors du nettoyage : ${err?.message || 'Une erreur est survenue'}`);
    } finally {
      setIsPurgingNow(false);
    }
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      partner1: {
        ...profile.partner1,
        name: partner1Name.trim() || 'Safi',
        nickname: partner1Nickname.trim(),
        avatar: partner1Avatar.trim(),
        color: partner1Color,
        mood: {
          ...profile.partner1.mood,
          status: partner1MoodStatus,
          need: partner1MoodNeed,
          energy: partner1MoodEnergy,
          lastUpdated: new Date().toISOString(),
        },
      },
      partner2: {
        ...profile.partner2,
        name: partner2Name.trim() || 'Med',
        nickname: partner2Nickname.trim(),
        avatar: partner2Avatar.trim(),
        color: partner2Color,
        mood: {
          ...profile.partner2.mood,
          status: partner2MoodStatus,
          need: partner2MoodNeed,
          energy: partner2MoodEnergy,
          lastUpdated: new Date().toISOString(),
        },
      },
      anniversaryDate,
      relationshipTitle: relationshipTitle.trim() || `${partner1Name} & ${partner2Name}`,
      themeColor,
    });

    soundEffects.playSuccessSparkle();
    triggerCelebrationConfetti();
    onClose();
  };

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        id="profile-modal-container"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 max-w-2xl w-full shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden text-stone-900 dark:text-stone-100"
      >
        {/* ========================================================= */}
        {/* HEADER: Romantic Duo Preview & Close Button */}
        {/* ========================================================= */}
        <div className="relative bg-gradient-to-r from-rose-50/90 via-pink-50/50 to-sky-50/90 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 p-4 sm:p-5 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Visual Connected Duo Avatars */}
            <div className="flex items-center -space-x-2.5 relative shrink-0">
              <div
                className="p-0.5 rounded-full bg-white dark:bg-stone-800 shadow-md ring-2 ring-rose-400"
                style={{ borderColor: partner1Color }}
              >
                <PartnerAvatar
                  name={partner1Name}
                  avatar={partner1Avatar}
                  partnerId="p1"
                  size="md"
                />
              </div>

              <div className="z-10 w-6 h-6 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-md flex items-center justify-center text-rose-500">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
              </div>

              <div
                className="p-0.5 rounded-full bg-white dark:bg-stone-800 shadow-md ring-2 ring-sky-400"
                style={{ borderColor: partner2Color }}
              >
                <PartnerAvatar
                  name={partner2Name}
                  avatar={partner2Avatar}
                  partnerId="p2"
                  size="md"
                />
              </div>
            </div>

            {/* Title & Romantic Milestone */}
            <div className="min-w-0">
              <h3 className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900 dark:text-white truncate flex items-center gap-1.5">
                <span>{relationshipTitle || `${partner1Name || 'Safi'} & ${partner2Name || 'Med'}`}</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {daysTogether !== null && (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                    <Sparkles className="w-3 h-3" />
                    <span>{daysTogether.toLocaleString('fr-FR')} jours d'amour</span>
                  </span>
                )}
                {isPinEnabled && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 px-1.5 py-0.2 rounded-md">
                    <Lock className="w-2.5 h-2.5" />
                    <span>PIN actif</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            id="profile-modal-close-btn"
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 flex items-center justify-center transition-colors border border-stone-200/80 dark:border-stone-700 shadow-2xs shrink-0 cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* TABS NAVIGATION (Refined Segmented Bar) */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800 shrink-0 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-1 p-1 bg-stone-200/60 dark:bg-stone-800 rounded-2xl overflow-x-auto no-scrollbar text-xs font-semibold">
            <button
              id="tab-profile-btn"
              type="button"
              onClick={() => setModalTab('profile')}
              className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                modalTab === 'profile'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span>Profil & Duo</span>
            </button>

            <button
              id="tab-security-btn"
              type="button"
              onClick={() => setModalTab('security')}
              className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                modalTab === 'security'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Sécurité</span>
            </button>

            <button
              id="tab-storage-btn"
              type="button"
              onClick={() => setModalTab('storage')}
              className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                modalTab === 'storage'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>Historique</span>
            </button>

            <button
              id="tab-backup-btn"
              type="button"
              onClick={() => setModalTab('backup')}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                modalTab === 'backup'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-sky-500" />
              <span>Sauvegarde</span>
            </button>

            <button
              id="tab-mobile-btn"
              type="button"
              onClick={() => setModalTab('app_mobile')}
              className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                modalTab === 'app_mobile'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-500" />
              <span>App & Alertes</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCROLLABLE BODY */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* TAB 1: PROFIL & DUO */}
          {modalTab === 'profile' && (
            <form onSubmit={handleSubmitProfile} className="space-y-5">
              {/* Partner Filter Sub-Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActivePartnerSubTab('both')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activePartnerSubTab === 'both'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs font-bold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Les deux amoureux
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerSubTab('p1')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    activePartnerSubTab === 'p1'
                      ? 'bg-rose-500 text-white font-bold shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-rose-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: partner1Color }} />
                  <span>{partner1Name || 'Partenaire 1'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerSubTab('p2')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    activePartnerSubTab === 'p2'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-sky-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: partner2Color }} />
                  <span>{partner2Name || 'Partenaire 2'}</span>
                </button>
              </div>

              {/* ---------------- PARTNER 1 CARD ---------------- */}
              {(activePartnerSubTab === 'both' || activePartnerSubTab === 'p1') && (
                <div
                  id="partner-1-card"
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-rose-50/70 to-white dark:from-stone-800/60 dark:to-stone-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs"
                        style={{ backgroundColor: partner1Color }}
                      />
                      <h4 className="font-serif-romantic text-base font-bold text-rose-950 dark:text-rose-200">
                        {partner1Name || 'Partenaire 1'}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full">
                      Partenaire 1
                    </span>
                  </div>

                  {/* Photo Studio */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/90 dark:bg-stone-800/80 p-4 rounded-2xl border border-rose-100 dark:border-stone-700/60 shadow-2xs">
                    <div className="relative group shrink-0">
                      <PartnerAvatar
                        name={partner1Name}
                        avatar={partner1Avatar}
                        partnerId="p1"
                        size="xl"
                        className="border-3 border-white shadow-lg ring-3"
                        ringColor={`ring-[${partner1Color}]`}
                      />
                      {isP1LoadingPhoto && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-pulse text-center px-1">
                          Traitement...
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                      <div>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
                          Photo de profil de {partner1Name || 'Partenaire 1'}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          Importez depuis votre galerie ou prenez un selfie instantané.
                        </p>
                      </div>

                      {/* Hidden file and camera inputs */}
                      <input
                        ref={p1FileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleP1FileChange}
                        className="hidden"
                      />
                      <input
                        ref={p1CameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleP1FileChange}
                        className="hidden"
                      />

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => p1FileInputRef.current?.click()}
                          disabled={isP1LoadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Galerie</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => p1CameraInputRef.current?.click()}
                          disabled={isP1LoadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Selfie</span>
                        </button>

                        {partner1Avatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setPartner1Avatar('');
                              soundEffects.playNoteClick();
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Retirer la photo actuelle"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Retirer</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowP1UrlInput(!showP1UrlInput)}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>Lien URL</span>
                        </button>
                      </div>

                      {showP1UrlInput && (
                        <input
                          type="url"
                          placeholder="https://exemple.com/photo.jpg"
                          value={partner1Avatar}
                          onChange={(e) => setPartner1Avatar(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-rose-200 dark:border-stone-700 rounded-xl text-xs mt-1 text-stone-800 dark:text-stone-200"
                        />
                      )}

                      {p1Error && <p className="text-xs text-red-600 font-medium">{p1Error}</p>}
                    </div>
                  </div>

                  {/* Name and Nickname */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Prénom :
                      </label>
                      <input
                        type="text"
                        value={partner1Name}
                        onChange={(e) => setPartner1Name(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Surnom d'amour :
                      </label>
                      <input
                        type="text"
                        value={partner1Nickname}
                        onChange={(e) => setPartner1Nickname(e.target.value)}
                        placeholder="Ex: Mon cœur, Mon trésor"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                  </div>

                  {/* Accent Color Palette */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                      <Palette className="w-3.5 h-3.5 text-rose-500" />
                      <span>Couleur préférée :</span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS_P1.map((c) => (
                        <button
                          key={`p1-color-${c.color}`}
                          type="button"
                          onClick={() => setPartner1Color(c.color)}
                          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                            partner1Color.toLowerCase() === c.color.toLowerCase()
                              ? 'border-stone-900 dark:border-white scale-110 shadow-sm ring-2 ring-rose-300'
                              : 'border-white dark:border-stone-700 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      ))}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[10px] text-stone-400 font-medium">Libre :</span>
                        <input
                          type="color"
                          value={partner1Color}
                          onChange={(e) => setPartner1Color(e.target.value)}
                          className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 p-0.5 cursor-pointer bg-white dark:bg-stone-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mood, Needs & Energy (Interactive Chips) */}
                  <div className="pt-2 border-t border-rose-100 dark:border-stone-800 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1.5">
                        Humeur du jour :
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {MOOD_STATUS_OPTIONS.map((m) => (
                          <button
                            key={`p1-mood-${m.value}`}
                            type="button"
                            onClick={() => setPartner1MoodStatus(m.value)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              partner1MoodStatus === m.value
                                ? 'bg-rose-500 text-white shadow-2xs font-bold scale-[1.02]'
                                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-rose-300'
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1.5">
                        Besoin amoureux :
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {MOOD_NEED_OPTIONS.map((n) => (
                          <button
                            key={`p1-need-${n.value}`}
                            type="button"
                            onClick={() => setPartner1MoodNeed(n.value)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              partner1MoodNeed === n.value
                                ? 'bg-rose-500 text-white shadow-2xs font-bold scale-[1.02]'
                                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-rose-300'
                            }`}
                          >
                            <span>{n.emoji}</span>
                            <span>{n.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">
                          Niveau d'énergie :
                        </label>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          {partner1MoodEnergy} / 5
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={`p1-energy-${lvl}`}
                            type="button"
                            onClick={() => setPartner1MoodEnergy(lvl)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              partner1MoodEnergy >= lvl
                                ? 'bg-rose-500 text-white shadow-2xs'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                            }`}
                          >
                            <Zap className={`w-3 h-3 ${partner1MoodEnergy >= lvl ? 'fill-white' : ''}`} />
                            <span>{lvl}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- PARTNER 2 CARD ---------------- */}
              {(activePartnerSubTab === 'both' || activePartnerSubTab === 'p2') && (
                <div
                  id="partner-2-card"
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-sky-50/70 to-white dark:from-stone-800/60 dark:to-stone-900 border border-sky-200/80 dark:border-sky-900/40 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-sky-100 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs"
                        style={{ backgroundColor: partner2Color }}
                      />
                      <h4 className="font-serif-romantic text-base font-bold text-sky-950 dark:text-sky-200">
                        {partner2Name || 'Partenaire 2'}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full">
                      Partenaire 2
                    </span>
                  </div>

                  {/* Photo Studio */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/90 dark:bg-stone-800/80 p-4 rounded-2xl border border-sky-100 dark:border-stone-700/60 shadow-2xs">
                    <div className="relative group shrink-0">
                      <PartnerAvatar
                        name={partner2Name}
                        avatar={partner2Avatar}
                        partnerId="p2"
                        size="xl"
                        className="border-3 border-white shadow-lg ring-3"
                        ringColor={`ring-[${partner2Color}]`}
                      />
                      {isP2LoadingPhoto && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-pulse text-center px-1">
                          Traitement...
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                      <div>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
                          Photo de profil de {partner2Name || 'Partenaire 2'}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          Importez depuis votre galerie ou prenez un selfie instantané.
                        </p>
                      </div>

                      {/* Hidden file and camera inputs */}
                      <input
                        ref={p2FileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleP2FileChange}
                        className="hidden"
                      />
                      <input
                        ref={p2CameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleP2FileChange}
                        className="hidden"
                      />

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => p2FileInputRef.current?.click()}
                          disabled={isP2LoadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Galerie</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => p2CameraInputRef.current?.click()}
                          disabled={isP2LoadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Selfie</span>
                        </button>

                        {partner2Avatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setPartner2Avatar('');
                              soundEffects.playNoteClick();
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Retirer la photo actuelle"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Retirer</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowP2UrlInput(!showP2UrlInput)}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>Lien URL</span>
                        </button>
                      </div>

                      {showP2UrlInput && (
                        <input
                          type="url"
                          placeholder="https://exemple.com/photo.jpg"
                          value={partner2Avatar}
                          onChange={(e) => setPartner2Avatar(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-sky-200 dark:border-stone-700 rounded-xl text-xs mt-1 text-stone-800 dark:text-stone-200"
                        />
                      )}

                      {p2Error && <p className="text-xs text-red-600 font-medium">{p2Error}</p>}
                    </div>
                  </div>

                  {/* Name and Nickname */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Prénom :
                      </label>
                      <input
                        type="text"
                        value={partner2Name}
                        onChange={(e) => setPartner2Name(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-sky-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Surnom d'amour :
                      </label>
                      <input
                        type="text"
                        value={partner2Nickname}
                        onChange={(e) => setPartner2Nickname(e.target.value)}
                        placeholder="Ex: Mon ange, Mon cœur"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                  </div>

                  {/* Accent Color Palette */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                      <Palette className="w-3.5 h-3.5 text-sky-600" />
                      <span>Couleur préférée :</span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS_P2.map((c) => (
                        <button
                          key={`p2-color-${c.color}`}
                          type="button"
                          onClick={() => setPartner2Color(c.color)}
                          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                            partner2Color.toLowerCase() === c.color.toLowerCase()
                              ? 'border-stone-900 dark:border-white scale-110 shadow-sm ring-2 ring-sky-300'
                              : 'border-white dark:border-stone-700 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      ))}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[10px] text-stone-400 font-medium">Libre :</span>
                        <input
                          type="color"
                          value={partner2Color}
                          onChange={(e) => setPartner2Color(e.target.value)}
                          className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 p-0.5 cursor-pointer bg-white dark:bg-stone-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mood, Needs & Energy (Interactive Chips) */}
                  <div className="pt-2 border-t border-sky-100 dark:border-stone-800 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1.5">
                        Humeur du jour :
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {MOOD_STATUS_OPTIONS.map((m) => (
                          <button
                            key={`p2-mood-${m.value}`}
                            type="button"
                            onClick={() => setPartner2MoodStatus(m.value)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              partner2MoodStatus === m.value
                                ? 'bg-sky-600 text-white shadow-2xs font-bold scale-[1.02]'
                                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-sky-300'
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1.5">
                        Besoin amoureux :
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {MOOD_NEED_OPTIONS.map((n) => (
                          <button
                            key={`p2-need-${n.value}`}
                            type="button"
                            onClick={() => setPartner2MoodNeed(n.value)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              partner2MoodNeed === n.value
                                ? 'bg-sky-600 text-white shadow-2xs font-bold scale-[1.02]'
                                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-sky-300'
                            }`}
                          >
                            <span>{n.emoji}</span>
                            <span>{n.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">
                          Niveau d'énergie :
                        </label>
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          {partner2MoodEnergy} / 5
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={`p2-energy-${lvl}`}
                            type="button"
                            onClick={() => setPartner2MoodEnergy(lvl)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              partner2MoodEnergy >= lvl
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                            }`}
                          >
                            <Zap className={`w-3 h-3 ${partner2MoodEnergy >= lvl ? 'fill-white' : ''}`} />
                            <span>{lvl}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- DUO HISTORY & THEME ---------------- */}
              <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700/60 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif-romantic text-sm font-bold text-stone-800 dark:text-stone-200">
                    Notre Duo & Thème de l'Espace
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Date d'anniversaire du couple :
                    </label>
                    <input
                      type="date"
                      value={anniversaryDate}
                      onChange={(e) => setAnniversaryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Titre de notre duo :
                    </label>
                    <input
                      type="text"
                      value={relationshipTitle}
                      onChange={(e) => setRelationshipTitle(e.target.value)}
                      placeholder="Ex: Med & Safi, Notre Nid d'Amour"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                </div>

                {/* Main Application Theme Selector */}
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ambiance colorée de l'application :</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {THEME_COLORS.map((th) => (
                      <button
                        key={`theme-color-${th.color}`}
                        type="button"
                        onClick={() => setThemeColor(th.color)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          themeColor.toLowerCase() === th.color.toLowerCase()
                            ? 'ring-2 ring-stone-900 dark:ring-white shadow-xs scale-[1.02] bg-white dark:bg-stone-800 border-transparent font-bold'
                            : 'bg-white/70 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${th.accent}`} />
                        <span className="text-[11px] truncate">{th.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Réinitialiser toutes les données avec les valeurs par défaut ?')) {
                      onResetToDefault();
                      onClose();
                    }
                  }}
                  className="text-xs font-medium text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Réinitialiser par défaut</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>Enregistrer le profil</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CODE PIN & SÉCURITÉ */}
          {modalTab === 'security' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-stone-800/60 dark:to-stone-800 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      Protection & Intimité par Code PIN
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      Protégez vos billets doux, vos photos et souvenirs des regards indiscrets. Lorsque cette option est activée, un code à 4 chiffres sera exigé à l'ouverture de l'application.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePinSettings} className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700">
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Activer le verrouillage par code PIN
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Demander le code PIN secret à chaque ouverture de l'espace
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isPinEnabled}
                      onChange={(e) => setIsPinEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 dark:bg-stone-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {isPinEnabled && (
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                          Nouveau code PIN (4 chiffres) :
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full px-3 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-center text-lg tracking-[0.3em] font-mono font-bold text-stone-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                          Confirmer le code PIN :
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={confirmPinCode}
                          onChange={(e) => setConfirmPinCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full px-3 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-center text-lg tracking-[0.3em] font-mono font-bold text-stone-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50/80 dark:bg-rose-950/40 rounded-xl border border-rose-200/80 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                      <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>
                        En cas d'oubli, la question de récupération secrète est votre date de couple ({profile.anniversaryDate}).
                      </span>
                    </div>
                  </div>
                )}

                {pinSaveFeedback && (
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{pinSaveFeedback}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  {isPinEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        onLockApp();
                        onClose();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Verrouiller maintenant</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="ml-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Sauvegarder le code PIN</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: HISTORIQUE & ALLÈGEMENT BASE */}
          {modalTab === 'storage' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-stone-800/60 dark:to-stone-800 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                        Nettoyage & Optimisation de la Base
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                        Firestore Cloud
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      Allégez votre base de données en configurant la suppression automatique des anciens messages (textes, photos et audios). Cela préserve vos quotas et garantit une réactivité optimale.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Messages en mémoire</p>
                    <p className="text-lg font-bold text-stone-900 dark:text-white mt-0.5">
                      {totalMessagesCount ?? 0} <span className="text-xs font-normal text-stone-500">message(s)</span>
                    </p>
                  </div>
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Rétention automatique</p>
                    <p className="text-xs font-bold text-stone-900 dark:text-white mt-1">
                      {autoCleanChatEnabled ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Purge auto (&gt; {autoCleanChatDays} j)
                        </span>
                      ) : (
                        <span className="text-stone-400">Illimitée (aucun nettoyage auto)</span>
                      )}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveStorageSettings} className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-stone-900 dark:text-white">
                      Vider automatiquement l'historique ancien
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Supprime les messages antérieurs au délai configuré ci-dessous.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoCleanChatEnabled}
                      onChange={(e) => setAutoCleanChatEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 dark:bg-stone-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                      Conserver les messages pendant :
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { days: 7, label: '7 jours' },
                        { days: 14, label: '14 jours' },
                        { days: 30, label: '30 jours' },
                        { days: 60, label: '60 jours' },
                        { days: 90, label: '90 jours' },
                      ].map((preset) => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => setAutoCleanChatDays(preset.days)}
                          className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                            autoCleanChatDays === preset.days
                              ? 'bg-rose-500 text-white border-rose-500 shadow-2xs font-bold'
                              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-rose-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs text-stone-600 dark:text-stone-400 font-medium whitespace-nowrap">
                      Ou personnalisé :
                    </label>
                    <div className="relative w-32">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={autoCleanChatDays}
                        onChange={(e) => setAutoCleanChatDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full pl-3 pr-10 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-stone-400">
                        jours
                      </span>
                    </div>
                  </div>
                </div>

                {storageSaveFeedback && (
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{storageSaveFeedback}</span>
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enregistrer les préférences</span>
                  </button>
                </div>
              </form>

              {/* Immediate Purge Card */}
              <div className="p-4 bg-rose-50/50 dark:bg-stone-800/60 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Nettoyage immédiat de la base</span>
                  </h5>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                    Purger sans attendre les messages plus anciens que <strong>{autoCleanChatDays} jours</strong> de Firestore et de cet appareil.
                  </p>
                </div>

                {purgeFeedback && (
                  <div className="p-2.5 bg-white dark:bg-stone-800 rounded-xl border border-rose-200 dark:border-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200">
                    {purgeFeedback}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handlePurgeNow}
                    disabled={isPurgingNow}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPurgingNow ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                        <span>Nettoyage en cours...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Purger &gt; {autoCleanChatDays} jours maintenant</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SAUVEGARDE & RESTAURATION */}
          {modalTab === 'backup' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-stone-800/60 dark:to-stone-800 rounded-2xl border border-sky-100 dark:border-stone-700 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      Sauvegarde & Restauration (Anti-perte)
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      Téléchargez en un clic une sauvegarde complète de votre NID (photos, souvenirs, billets doux, capsules temporelles, bucket list). Conservez-la en lieu sûr ou importez-la sur un nouvel appareil.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export block */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-sky-600" />
                    <span>Télécharger la sauvegarde complète</span>
                  </h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Fichier JSON sécurisé contenant toutes vos données de couple.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter mes données</span>
                </button>
              </div>

              {/* Import block */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Restaurer une sauvegarde</span>
                  </h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Importer un fichier de sauvegarde préalablement téléchargé.
                  </p>
                </div>
                <div>
                  <input
                    ref={backupImportInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => backupImportInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choisir le fichier</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Faites une sauvegarde régulière pour garder vos précieux souvenirs à l'abri de toute réinitialisation de navigateur !
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: APP MOBILE, NOTIFICATIONS & CLOUD */}
          {modalTab === 'app_mobile' && (
            <div className="space-y-4">
              {/* App Icon Banner */}
              <div className="p-4 bg-gradient-to-br from-rose-50/70 via-stone-50 to-pink-50/50 dark:from-stone-800/70 dark:to-stone-900 rounded-2xl border border-rose-100/80 dark:border-stone-700 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-xl ring-4 ring-rose-200/80 dark:ring-rose-900/60 border border-rose-200">
                    <img
                      src="/app-icon.png"
                      alt="Icône NID"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow-xs">
                    <Heart className="w-3 h-3 fill-current" />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h4 className="font-serif-romantic text-base font-bold text-stone-900 dark:text-white">
                      Icône Mobile « NID »
                    </h4>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                      PWA Prête
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                    Icône luxueuse avec deux cœurs entrelacés en or et or rose, nichés dans un nid protecteur.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <a
                      href="/app-icon.png"
                      download="nid-icon.png"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 shadow-2xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-rose-500" />
                      <span>Télécharger l'icône HD</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Web Push Notifications & Badges Setup */}
              <div className="p-4 bg-gradient-to-br from-rose-50/70 to-pink-50/50 dark:from-stone-800/60 dark:to-stone-800 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                        Notifications & Alertes hors de l'application
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          notifPermission === 'granted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : notifPermission === 'denied'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {notifPermission === 'granted'
                          ? 'Actives'
                          : notifPermission === 'denied'
                          ? 'Bloquées'
                          : 'Non activées'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      Recevez une alerte native sur votre téléphone dès que votre partenaire vous envoie un message ou une photo, même si l'application est fermée.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {notifPermission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const granted = await requestNotificationPermission();
                        if (typeof window !== 'undefined' && 'Notification' in window) {
                          setNotifPermission(Notification.permission);
                        }
                        if (granted) {
                          await subscribeToPushNotifications('p1');
                          setNotifTestFeedback('Notifications & push activés avec succès !');
                          soundEffects.playSuccessSparkle();
                        } else {
                          setNotifTestFeedback('Autorisation non accordée par le navigateur.');
                        }
                        setTimeout(() => setNotifTestFeedback(null), 3500);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Activer les alertes push sur cet appareil</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        triggerVibration([100, 50, 150]);
                        soundEffects.playHeartPulse();
                        sendTestPushNotification('p1', profile.partner1.name).catch(() => {});
                        const sent = await sendSystemNotification({
                          title: 'NID 💕 Alerte Test',
                          body: 'Vos notifications push et alertes hors-ligne fonctionnent à merveille !',
                          icon: '/app-icon.png',
                          tab: 'chat',
                          tag: 'test-notification',
                        });
                        if (sent) {
                          setNotifTestFeedback('Notification & alerte push envoyées !');
                        } else {
                          setNotifTestFeedback('Vérifiez les paramètres de notification du système.');
                        }
                        setTimeout(() => setNotifTestFeedback(null), 4000);
                      }}
                      className="px-4 py-2 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-stone-700 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-stone-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Radio className="w-4 h-4 text-rose-500" />
                      <span>Envoyer une alerte de test</span>
                    </button>
                  )}

                  {notifTestFeedback && (
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-stone-700">
                      {notifTestFeedback}
                    </span>
                  )}
                </div>
              </div>

              {/* Cloud Synchronization Status */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-900 dark:text-white">
                      Synchronisation Cloud Firestore
                    </h5>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {isFirebaseConnected
                        ? 'Connecté en temps réel entre vous deux'
                        : 'Mode local actif'}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    isFirebaseConnected
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isFirebaseConnected ? 'En direct' : 'Local'}</span>
                </span>
              </div>

              {/* Installation Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Sur Android (Chrome)</span>
                  </div>
                  <ol className="text-[11px] text-stone-600 dark:text-stone-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Touchez le menu (<strong>⋮</strong> en haut à droite).</li>
                    <li>Appuyez sur <strong>« Installer l'application »</strong>.</li>
                    <li>L'icône apparaît sur votre écran d'accueil !</li>
                  </ol>
                </div>

                <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Sur iPhone (Safari)</span>
                  </div>
                  <ol className="text-[11px] text-stone-600 dark:text-stone-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Touchez l'icône de partage <strong>Partager</strong> en bas.</li>
                    <li>Choisissez <strong>« Sur l'écran d'accueil »</strong>.</li>
                    <li>Touchez <strong>Ajouter</strong> en haut à droite.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
