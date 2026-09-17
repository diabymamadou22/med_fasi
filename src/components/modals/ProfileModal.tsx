import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Settings,
  Heart,
  Calendar,
  RefreshCw,
  Camera,
  Upload,
  Link as LinkIcon,
  Check,
  MapPin,
  Lock,
  Unlock,
  Music,
  Download,
  FileJson,
  Shield,
  Sliders,
  AlertTriangle,
  Cloud,
  CloudCheck,
  Flame,
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
} from 'lucide-react';
import { CoupleProfile, PartnerId, CoupleSettings, FullCoupleBackup } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti } from '../../lib/confetti';
import { processImageFile } from '../../lib/imageUtils';
import {
  sendSystemNotification,
  requestNotificationPermission,
  areNotificationsSupported,
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
  const [modalTab, setModalTab] = useState<'profile' | 'security' | 'storage' | 'backup' | 'firebase' | 'app_mobile'>('profile');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activePartnerSubTab, setActivePartnerSubTab] = useState<'both' | 'p1' | 'p2'>(
    initialFocusPartner === 'p2' ? 'p2' : initialFocusPartner === 'p1' ? 'p1' : 'both'
  );

  // Profile states
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

  // File refs
  const p1FileInputRef = useRef<HTMLInputElement>(null);
  const p1CameraInputRef = useRef<HTMLInputElement>(null);
  const p2FileInputRef = useRef<HTMLInputElement>(null);
  const p2CameraInputRef = useRef<HTMLInputElement>(null);
  const backupImportInputRef = useRef<HTMLInputElement>(null);

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
      relationshipTitle:
        relationshipTitle.trim() || `${partner1Name} & ${partner2Name}`,
      themeColor,
    });

    soundEffects.playSuccessSparkle();
    triggerCelebrationConfetti();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-6 max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 shadow-2xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-xl sm:text-2xl font-bold text-stone-900">
              Paramètres & Personnalisation
            </h3>
            <p className="text-xs text-stone-500">
              Photos de profil, couleurs, humeurs, sécurité PIN et synchronisation.
            </p>
          </div>
        </div>

        {/* Top level tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl mb-4 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setModalTab('profile')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              modalTab === 'profile'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Profil & Photos</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('security')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              modalTab === 'security'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Code PIN Secret</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('storage')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              modalTab === 'storage'
                ? 'bg-white text-stone-900 shadow-xs ring-1 ring-rose-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Historique & Base</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('backup')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              modalTab === 'backup'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Sauvegarde</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('firebase')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              modalTab === 'firebase'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-amber-500" />
            <span>Cloud & Vercel</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('app_mobile')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              modalTab === 'app_mobile'
                ? 'bg-white text-rose-700 shadow-xs ring-1 ring-rose-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <img src="/app-icon.png" alt="App Icon" className="w-3.5 h-3.5 rounded object-cover shadow-2xs" />
            <span>Icône & Mobile</span>
          </button>
        </div>

        {/* Scrollable tab contents */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1: PROFILE & PHOTOS */}
          {modalTab === 'profile' && (
            <div>
              {/* Partner sub-tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-100/70 rounded-xl mb-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActivePartnerSubTab('both')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activePartnerSubTab === 'both' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500'
                  }`}
                >
                  Vue d'ensemble
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerSubTab('p1')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activePartnerSubTab === 'p1' ? 'bg-rose-500 text-white font-bold' : 'text-stone-500 hover:text-rose-600'
                  }`}
                >
                  Photo {partner1Name || 'Safi'}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePartnerSubTab('p2')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activePartnerSubTab === 'p2' ? 'bg-sky-600 text-white font-bold' : 'text-stone-500 hover:text-sky-600'
                  }`}
                >
                  Photo {partner2Name || 'Med'}
                </button>
              </div>

              <form onSubmit={handleSubmitProfile} className="space-y-5">
                {/* Partner 1 Section */}
                {(activePartnerSubTab === 'both' || activePartnerSubTab === 'p1') && (
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-romantic text-sm font-bold text-rose-900 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: partner1Color }}
                        />
                        <span>Partenaire 1 ({partner1Name || 'Partenaire 1'})</span>
                      </h4>
                      <span className="text-[11px] font-medium text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-full">
                        Profil & Humeur
                      </span>
                    </div>

                    {/* Photo Upload for Partner 1 - Direct from Phone */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 p-3.5 rounded-2xl border border-rose-200/60">
                      <div className="relative group shrink-0">
                        <PartnerAvatar
                          name={partner1Name}
                          avatar={partner1Avatar}
                          partnerId="p1"
                          size="xl"
                          className="border-3 border-white shadow-md ring-3 ring-rose-400"
                        />
                        {isP1LoadingPhoto && (
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-pulse text-center px-1">
                            Traitement...
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            Photo de profil de {partner1Name || 'Partenaire 1'}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Prenez une photo ou choisissez directement dans votre téléphone.
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

                        {/* Direct action buttons */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <button
                            type="button"
                            onClick={() => p1FileInputRef.current?.click()}
                            disabled={isP1LoadingPhoto}
                            className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Galerie / Fichiers</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => p1CameraInputRef.current?.click()}
                            disabled={isP1LoadingPhoto}
                            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Prendre une photo</span>
                          </button>

                          {partner1Avatar && (
                            <button
                              type="button"
                              onClick={() => {
                                setPartner1Avatar('');
                                soundEffects.playNoteClick();
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Retirer la photo actuelle"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Retirer</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowP1UrlInput(!showP1UrlInput)}
                            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1"
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
                            className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs mt-1 text-stone-800"
                          />
                        )}

                        {p1Error && <p className="text-xs text-red-600 font-medium">{p1Error}</p>}
                      </div>
                    </div>

                    {/* Name & Nickname */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">Prénom :</label>
                        <input
                          type="text"
                          value={partner1Name}
                          onChange={(e) => setPartner1Name(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-medium text-stone-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">Surnom d'amour :</label>
                        <input
                          type="text"
                          value={partner1Nickname}
                          onChange={(e) => setPartner1Nickname(e.target.value)}
                          placeholder="Ex: Mon cœur, Mon ange"
                          className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-medium text-stone-800"
                        />
                      </div>
                    </div>

                    {/* Partner 1 Color & Mood Settings */}
                    <div className="p-3 bg-white/70 rounded-xl border border-rose-100 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1.5">
                          <Palette className="w-3.5 h-3.5 text-rose-500" />
                          <span>Couleur de {partner1Name || 'Partenaire 1'} :</span>
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { label: 'Rose', color: '#F43F5E' },
                            { label: 'Framboise', color: '#E11D48' },
                            { label: 'Violet', color: '#8B5CF6' },
                            { label: 'Lilas', color: '#EC4899' },
                            { label: 'Corail', color: '#F97316' },
                            { label: 'Ambre', color: '#F59E0B' },
                            { label: 'Bleu', color: '#0284C7' },
                            { label: 'Émeraude', color: '#10B981' },
                          ].map((c) => (
                            <button
                              key={`p1-color-${c.color}`}
                              type="button"
                              onClick={() => setPartner1Color(c.color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                partner1Color.toLowerCase() === c.color.toLowerCase()
                                  ? 'border-stone-900 scale-110 ring-2 ring-stone-400'
                                  : 'border-white'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.label}
                            />
                          ))}
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-[10px] text-stone-400">Libre :</span>
                            <input
                              type="color"
                              value={partner1Color}
                              onChange={(e) => setPartner1Color(e.target.value)}
                              className="w-7 h-7 rounded-lg border border-stone-200 p-0.5 cursor-pointer bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-stone-100">
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">
                            Humeur par défaut :
                          </label>
                          <select
                            value={partner1MoodStatus}
                            onChange={(e) => setPartner1MoodStatus(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-xl text-xs text-stone-800"
                          >
                            <option value="Rayonnant">✨ Rayonnant(e)</option>
                            <option value="Zen">🌿 Zen</option>
                            <option value="Câlin">🧸 Câlin(e)</option>
                            <option value="Amoureux">❤️ Fou amoureux</option>
                            <option value="Fatigué">😴 Fatigué(e)</option>
                            <option value="Stressé">⚡ Stressé(e)</option>
                            <option value="Créatif">🎨 Créatif(ve)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">
                            Besoin d'amour :
                          </label>
                          <select
                            value={partner1MoodNeed}
                            onChange={(e) => setPartner1MoodNeed(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-xl text-xs text-stone-800"
                          >
                            <option value="Besoin d'un câlin">🤗 Un gros câlin</option>
                            <option value="Envie d'être tranquille">🧘 Être au calme</option>
                            <option value="Prêt à sortir">🎉 Prêt(e) à sortir</option>
                            <option value="Besoin d'écoute">💬 Discuter & écoute</option>
                            <option value="Surprise-moi">🎁 Surprise-moi !</option>
                            <option value="Un mot doux">💌 Un petit mot doux</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">
                            Énergie ({partner1MoodEnergy}/5) :
                          </label>
                          <div className="flex items-center gap-1 pt-1">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <button
                                key={`p1-energy-${lvl}`}
                                type="button"
                                onClick={() => setPartner1MoodEnergy(lvl)}
                                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                                  partner1MoodEnergy >= lvl
                                    ? 'bg-rose-500 text-white shadow-2xs'
                                    : 'bg-stone-100 text-stone-400'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Partner 2 Section */}
                {(activePartnerSubTab === 'both' || activePartnerSubTab === 'p2') && (
                  <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-romantic text-sm font-bold text-sky-900 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: partner2Color }}
                        />
                        <span>Partenaire 2 ({partner2Name || 'Partenaire 2'})</span>
                      </h4>
                      <span className="text-[11px] font-medium text-sky-600 bg-sky-100/60 px-2 py-0.5 rounded-full">
                        Profil & Humeur
                      </span>
                    </div>

                    {/* Photo Upload for Partner 2 - Direct from Phone */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 p-3.5 rounded-2xl border border-sky-200/60">
                      <div className="relative group shrink-0">
                        <PartnerAvatar
                          name={partner2Name}
                          avatar={partner2Avatar}
                          partnerId="p2"
                          size="xl"
                          className="border-3 border-white shadow-md ring-3 ring-sky-400"
                        />
                        {isP2LoadingPhoto && (
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-pulse text-center px-1">
                            Traitement...
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            Photo de profil de {partner2Name || 'Partenaire 2'}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Prenez une photo ou choisissez directement dans votre téléphone.
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

                        {/* Direct action buttons */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <button
                            type="button"
                            onClick={() => p2FileInputRef.current?.click()}
                            disabled={isP2LoadingPhoto}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Galerie / Fichiers</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => p2CameraInputRef.current?.click()}
                            disabled={isP2LoadingPhoto}
                            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Prendre une photo</span>
                          </button>

                          {partner2Avatar && (
                            <button
                              type="button"
                              onClick={() => {
                                setPartner2Avatar('');
                                soundEffects.playNoteClick();
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Retirer la photo actuelle"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Retirer</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowP2UrlInput(!showP2UrlInput)}
                            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1"
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
                            className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs mt-1 text-stone-800"
                          />
                        )}

                        {p2Error && <p className="text-xs text-red-600 font-medium">{p2Error}</p>}
                      </div>
                    </div>

                    {/* Name & Nickname */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">Prénom :</label>
                        <input
                          type="text"
                          value={partner2Name}
                          onChange={(e) => setPartner2Name(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-medium text-stone-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">Surnom d'amour :</label>
                        <input
                          type="text"
                          value={partner2Nickname}
                          onChange={(e) => setPartner2Nickname(e.target.value)}
                          placeholder="Ex: Mon cœur, Mon chéri"
                          className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-medium text-stone-800"
                        />
                      </div>
                    </div>

                    {/* Partner 2 Color & Mood Settings */}
                    <div className="p-3 bg-white/70 rounded-xl border border-sky-100 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1.5">
                          <Palette className="w-3.5 h-3.5 text-sky-600" />
                          <span>Couleur de {partner2Name || 'Partenaire 2'} :</span>
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { label: 'Bleu roi', color: '#0284C7' },
                            { label: 'Ciel', color: '#0EA5E9' },
                            { label: 'Indigo', color: '#6366F1' },
                            { label: 'Émeraude', color: '#10B981' },
                            { label: 'Turquoise', color: '#14B8A6' },
                            { label: 'Ambre', color: '#F59E0B' },
                            { label: 'Violet', color: '#8B5CF6' },
                            { label: 'Rose', color: '#F43F5E' },
                          ].map((c) => (
                            <button
                              key={`p2-color-${c.color}`}
                              type="button"
                              onClick={() => setPartner2Color(c.color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                partner2Color.toLowerCase() === c.color.toLowerCase()
                                  ? 'border-stone-900 scale-110 ring-2 ring-stone-400'
                                  : 'border-white'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.label}
                            />
                          ))}
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-[10px] text-stone-400">Libre :</span>
                            <input
                              type="color"
                              value={partner2Color}
                              onChange={(e) => setPartner2Color(e.target.value)}
                              className="w-7 h-7 rounded-lg border border-stone-200 p-0.5 cursor-pointer bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-stone-100">
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">
                            Humeur par défaut :
                          </label>
                          <select
                            value={partner2MoodStatus}
                            onChange={(e) => setPartner2MoodStatus(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-xl text-xs text-stone-800"
                          >
                            <option value="Rayonnant">✨ Rayonnant(e)</option>
                            <option value="Zen">🌿 Zen</option>
                            <option value="Câlin">🧸 Câlin(e)</option>
                            <option value="Amoureux">❤️ Fou amoureux</option>
                            <option value="Fatigué">😴 Fatigué(e)</option>
                            <option value="Stressé">⚡ Stressé(e)</option>
                            <option value="Créatif">🎨 Créatif(ve)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">
                            Besoin d'amour :
                          </label>
                          <select
                            value={partner2MoodNeed}
                            onChange={(e) => setPartner2MoodNeed(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-xl text-xs text-stone-800"
                          >
                            <option value="Surprise-moi">🎁 Surprise-moi !</option>
                            <option value="Besoin d'un câlin">🤗 Un gros câlin</option>
                            <option value="Envie d'être tranquille">🧘 Être au calme</option>
                            <option value="Prêt à sortir">🎉 Prêt(e) à sortir</option>
                            <option value="Besoin d'écoute">💬 Discuter & écoute</option>
                            <option value="Un mot doux">💌 Un petit mot doux</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">
                            Énergie ({partner2MoodEnergy}/5) :
                          </label>
                          <div className="flex items-center gap-1 pt-1">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <button
                                key={`p2-energy-${lvl}`}
                                type="button"
                                onClick={() => setPartner2MoodEnergy(lvl)}
                                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                                  partner2MoodEnergy >= lvl
                                    ? 'bg-sky-600 text-white shadow-2xs'
                                    : 'bg-stone-100 text-stone-400'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anniversary, Title & Global Theme */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <h4 className="font-serif-romantic text-xs sm:text-sm font-bold text-stone-800">
                      Notre Histoire, Titre & Thème de l'Application
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Date d'anniversaire du couple :</label>
                      <input
                        type="date"
                        value={anniversaryDate}
                        onChange={(e) => setAnniversaryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Titre de notre duo :</label>
                      <input
                        type="text"
                        value={relationshipTitle}
                        onChange={(e) => setRelationshipTitle(e.target.value)}
                        placeholder="Ex: Med & Safi, Notre Duo d'Amour"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 font-medium"
                      />
                    </div>
                  </div>

                  {/* App Color Theme */}
                  <div className="pt-2 border-t border-stone-200/60">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                      <span>Thème de couleur principal :</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: 'Rose Romantique', color: '#F43F5E', bg: 'bg-rose-50 border-rose-200 text-rose-900' },
                        { label: 'Rubis Passion', color: '#E11D48', bg: 'bg-red-50 border-red-200 text-red-900' },
                        { label: 'Bleu Océan', color: '#0284C7', bg: 'bg-sky-50 border-sky-200 text-sky-900' },
                        { label: 'Émeraude Royale', color: '#10B981', bg: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                        { label: 'Violet Mystique', color: '#8B5CF6', bg: 'bg-purple-50 border-purple-200 text-purple-900' },
                      ].map((th) => (
                        <button
                          key={`theme-color-${th.color}`}
                          type="button"
                          onClick={() => setThemeColor(th.color)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            themeColor.toLowerCase() === th.color.toLowerCase()
                              ? 'ring-2 ring-stone-900 shadow-xs scale-[1.02] ' + th.bg
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: th.color }} />
                          <span className="text-[11px] font-bold truncate">{th.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Réinitialiser toutes les données avec les valeurs par défaut ?')) {
                        onResetToDefault();
                        onClose();
                      }
                    }}
                    className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Réinitialiser par défaut</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Enregistrer tous les paramètres</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CODE PIN SECRET */}
          {modalTab === 'security' && (
            <div className="space-y-5 p-2">
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      Protection & Intimité par Code PIN
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Protégez vos billets doux, vos photos et souvenirs des regards indiscrets. Lorsque cette option est activée, un code à 4 chiffres sera demandé pour ouvrir l'application.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePinSettings} className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <p className="text-xs font-bold text-stone-800">Activer le verrouillage par code PIN</p>
                    <p className="text-[11px] text-stone-500">Demander le code PIN pour accéder à l'espace</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinEnabled}
                      onChange={(e) => setIsPinEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {isPinEnabled && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Nouveau code PIN (4 chiffres) :
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 2024"
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-center text-base tracking-widest font-mono font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Confirmer le code PIN :
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={confirmPinCode}
                          onChange={(e) => setConfirmPinCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 2024"
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-center text-base tracking-widest font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 flex items-center gap-2 text-[11px] text-rose-800">
                      <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>
                        En cas d'oubli, votre question de récupération secrète est votre date de couple ({profile.anniversaryDate}).
                      </span>
                    </div>
                  </div>
                )}

                {pinSaveFeedback && (
                  <p className="text-xs font-semibold text-emerald-700 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    {pinSaveFeedback}
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
                      className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Verrouiller maintenant</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="ml-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Sauvegarder le code PIN</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: HISTORIQUE & STOCKAGE / ALLÈGEMENT BASE */}
          {modalTab === 'storage' && (
            <div className="space-y-5 p-2">
              {/* Header card */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl mt-0.5 shadow-2xs">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900">
                        Nettoyage & Allègement de la Base de Données
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                        Firestore Optimisé
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Allégez votre base de données en configurant la suppression automatique des anciens messages (textes, photos et audios). Cela préserve vos quotas Firestore et garantit une navigation ultra-fluide.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-stone-500">Messages en mémoire / base</p>
                    <p className="text-lg font-bold text-stone-900 mt-0.5">
                      {totalMessagesCount ?? 0} <span className="text-xs font-normal text-stone-500">message(s)</span>
                    </p>
                  </div>
                  <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-stone-500">Politique de rétention</p>
                    <p className="text-xs font-bold text-stone-800 mt-1">
                      {autoCleanChatEnabled ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Purge auto (&gt; {autoCleanChatDays} jours)
                        </span>
                      ) : (
                        <span className="text-stone-500">Illimitée (aucun nettoyage auto)</span>
                      )}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Settings Form */}
              <form onSubmit={handleSaveStorageSettings} className="space-y-4">
                {/* Auto clean switch */}
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-stone-800">
                      Vider automatiquement l'historique ancien
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                      Supprime automatiquement les messages plus vieux que la durée sélectionnée pour libérer la base de données.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoCleanChatEnabled}
                      onChange={(e) => setAutoCleanChatEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {/* Day selector presets and input */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Conserver les messages pendant :
                    </label>
                    <p className="text-[11px] text-stone-500 mb-2.5">
                      Les messages plus anciens que ce nombre de jours seront automatiquement supprimés.
                    </p>

                    {/* Quick preset buttons */}
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
                              ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300 hover:bg-rose-50/50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom days input */}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs text-stone-600 font-medium whitespace-nowrap">
                      Ou personnalisé :
                    </label>
                    <div className="relative w-32">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={autoCleanChatDays}
                        onChange={(e) => setAutoCleanChatDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full pl-3 pr-10 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-stone-400">
                        jours
                      </span>
                    </div>
                  </div>

                  {settings.lastAutoCleanAt && (
                    <div className="pt-2 text-[11px] text-stone-500 flex items-center gap-1.5 border-t border-stone-200">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        Dernier nettoyage effectué le{' '}
                        <strong>
                          {new Date(settings.lastAutoCleanAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {storageSaveFeedback && (
                  <p className="text-xs font-semibold text-emerald-700 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{storageSaveFeedback}</span>
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enregistrer les préférences</span>
                  </button>
                </div>
              </form>

              {/* Manual Immediate Clean Action Card */}
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Nettoyage immédiat de la base</span>
                    </h5>
                    <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                      Vous n'avez pas besoin d'attendre : purgez dès maintenant les messages plus anciens que{' '}
                      <strong>{autoCleanChatDays} jours</strong> de Firebase Firestore et de cet appareil.
                    </p>
                  </div>
                </div>

                {purgeFeedback && (
                  <div className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs font-medium text-stone-800">
                    {purgeFeedback}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handlePurgeNow}
                    disabled={isPurgingNow}
                    className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPurgingNow ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                        <span>Nettoyage en cours...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Purger les messages &gt; {autoCleanChatDays} jours maintenant</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Backup recommendation banner */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Conseil :</strong> Si vous souhaitez garder une trace de vos conversations passées, rendez-vous d'abord dans l'onglet <strong>Sauvegarde</strong> pour télécharger une copie complète au format fichier avant de purger.
                </span>
              </div>
            </div>
          )}

          {/* TAB: SAUVEGARDE & RESTAURATION */}
          {modalTab === 'backup' && (
            <div className="space-y-5 p-2">
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sky-100 text-sky-700 rounded-xl mt-0.5">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      Sauvegarde & Transfert (Anti-perte de données)
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Téléchargez en un clic une sauvegarde complète de votre NID (vos photos, vos souvenirs, vos billets doux, vos capsules temporelles, votre bucket list). Vous pouvez la garder en lieu sûr ou la restaurer sur un autre téléphone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export block */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-sky-600" />
                    <span>Télécharger la sauvegarde complète</span>
                  </h5>
                  <p className="text-[11px] text-stone-500">
                    Fichier JSON sécurisé contenant toutes vos données de couple.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter mes données</span>
                </button>
              </div>

              {/* Import block */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Restaurer une sauvegarde</span>
                  </h5>
                  <p className="text-[11px] text-stone-500">
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choisir le fichier</span>
                  </button>
                </div>
              </div>

              {/* Warning note */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Conseil : faites une sauvegarde de temps en temps pour garder vos précieux souvenirs à l'abri de toute réinitialisation de navigateur !
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: FIREBASE CLOUD & VERCEL */}
          {modalTab === 'firebase' && (
            <div className="space-y-4">
              {/* Status Header */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-stone-900">
                        Synchronisation Firebase Firestore
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isFirebaseConnected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isFirebaseConnected ? 'Actif & En Ligne' : 'Mode Local'}</span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Toutes vos données (souvenirs, billets doux, capsules, bucket list, musique et humeurs) sont synchronisées en direct dans le cloud Firebase. Vous et votre moitié voyez les modifications instantanément !
                    </p>
                  </div>
                </div>
              </div>

              {/* Vercel Deployment Instructions */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <h5 className="text-xs font-bold text-stone-800">
                      Déploiement Vercel — Variables d'Environnement
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const envText = `VITE_FIREBASE_API_KEY=\nVITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0642060417.firebaseapp.com\nVITE_FIREBASE_PROJECT_ID=gen-lang-client-0642060417\nVITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0642060417.firebasestorage.app\nVITE_FIREBASE_MESSAGING_SENDER_ID=\nVITE_FIREBASE_APP_ID=`;
                      navigator.clipboard?.writeText(envText);
                      setCopiedEnv(true);
                      setTimeout(() => setCopiedEnv(false), 2500);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedEnv ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copié !</span>
                      </>
                    ) : (
                      <>
                        <FileJson className="w-3 h-3" />
                        <span>Copier format .env</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-stone-600">
                  Pour déployer cette application sur <strong>Vercel</strong>, ajoutez simplement ces variables dans votre panneau de projet Vercel (<em>Settings &gt; Environment Variables</em>) :
                </p>

                <div className="p-3 bg-stone-900 rounded-xl text-stone-100 font-mono text-[11px] overflow-x-auto space-y-1">
                  <div className="text-emerald-400"># Identifiants Firebase pour Vercel</div>
                  <div><span className="text-stone-400">VITE_FIREBASE_PROJECT_ID=</span>gen-lang-client-0642060417</div>
                  <div><span className="text-stone-400">VITE_FIREBASE_AUTH_DOMAIN=</span>gen-lang-client-0642060417.firebaseapp.com</div>
                  <div><span className="text-stone-400">VITE_FIREBASE_STORAGE_BUCKET=</span>gen-lang-client-0642060417.firebasestorage.app</div>
                </div>

                <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-[11px]">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    La configuration Firebase charge automatiquement la configuration locale intégrée ou vos variables d'environnement Vercel si vous les définissez.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ICÔNE & APPLICATION MOBILE */}
          {modalTab === 'app_mobile' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-rose-50/70 via-stone-50 to-pink-50/50 rounded-2xl border border-rose-100/80 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-xl ring-4 ring-rose-200/80 border border-rose-200">
                    <img
                      src="/app-icon.png"
                      alt="Icône NID"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow-xs">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h4 className="font-serif-romantic text-base sm:text-lg font-bold text-stone-900">
                      Icône Mobile « NID »
                    </h4>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                      PWA Prête
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Icône luxueuse avec deux cœurs entrelacés en or et or rose, nichés dans un nid protecteur sur fond terracotta doux.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
                    <a
                      href="/app-icon.png"
                      download="nid-icon.png"
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200 shadow-2xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-rose-500" />
                      <span>Télécharger l'icône HD</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Web Push Notifications & Badges Setup */}
              <div className="p-4 bg-gradient-to-br from-rose-50/70 to-pink-50/50 rounded-2xl border border-rose-200/70 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500 text-white rounded-xl shadow-xs shrink-0">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900">
                          Notifications & Alertes hors de l'application
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            notifPermission === 'granted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : notifPermission === 'denied'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {notifPermission === 'granted'
                            ? 'Actives'
                            : notifPermission === 'denied'
                            ? 'Bloquées'
                            : 'Non activées'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Recevez une alerte native sur votre téléphone dès que votre partenaire vous envoie un message, une photo, ou une impulsion « Tu me manques », même si l'application est fermée.
                      </p>
                    </div>
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
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
                      className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Radio className="w-4 h-4 text-rose-500" />
                      <span>Envoyer une alerte de test</span>
                    </button>
                  )}

                  {notifTestFeedback && (
                    <span className="text-xs font-semibold text-rose-700 bg-white/80 px-3 py-1.5 rounded-xl border border-rose-200">
                      {notifTestFeedback}
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-white/70 rounded-xl border border-rose-100 text-[11px] text-stone-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Badge d'icône non-lus inclus :</strong> Le compteur de messages non-lus s'affiche directement sur l'icône de votre écran d'accueil (sur appareils compatibles).
                  </span>
                </div>
              </div>

              {/* Instructions per device */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Sur Android (Chrome / Samsung)</span>
                  </div>
                  <ol className="text-[11px] text-stone-600 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Ouvrez le site dans Google Chrome.</li>
                    <li>Touchez le menu (<strong>⋮</strong> en haut à droite).</li>
                    <li>Appuyez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
                    <li>L'icône dorée apparaît sur votre écran d'accueil comme une vraie application !</li>
                  </ol>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Sur iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="text-[11px] text-stone-600 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Ouvrez le lien dans le navigateur <strong>Safari</strong>.</li>
                    <li>Touchez l'icône de partage <strong>Partager</strong> en bas au centre.</li>
                    <li>Faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong>.</li>
                    <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
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
