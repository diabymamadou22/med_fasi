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
} from 'lucide-react';
import { CoupleProfile, PartnerId, CoupleSettings, FullCoupleBackup } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti } from '../../lib/confetti';
import { processImageFile } from '../../lib/imageUtils';

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
}) => {
  const [modalTab, setModalTab] = useState<'profile' | 'security' | 'music' | 'backup' | 'firebase'>('profile');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activePartnerSubTab, setActivePartnerSubTab] = useState<'both' | 'p1' | 'p2'>(
    initialFocusPartner === 'p2' ? 'p2' : initialFocusPartner === 'p1' ? 'p1' : 'both'
  );

  // Profile states
  const [partner1Name, setPartner1Name] = useState(profile.partner1.name);
  const [partner1Nickname, setPartner1Nickname] = useState(profile.partner1.nickname);
  const [partner1Avatar, setPartner1Avatar] = useState(profile.partner1.avatar);
  const [isP1LoadingPhoto, setIsP1LoadingPhoto] = useState(false);
  const [showP1UrlInput, setShowP1UrlInput] = useState(false);
  const [p1Error, setP1Error] = useState<string | null>(null);

  const [partner2Name, setPartner2Name] = useState(profile.partner2.name);
  const [partner2Nickname, setPartner2Nickname] = useState(profile.partner2.nickname);
  const [partner2Avatar, setPartner2Avatar] = useState(profile.partner2.avatar);
  const [isP2LoadingPhoto, setIsP2LoadingPhoto] = useState(false);
  const [showP2UrlInput, setShowP2UrlInput] = useState(false);
  const [p2Error, setP2Error] = useState<string | null>(null);

  const [anniversaryDate, setAnniversaryDate] = useState(profile.anniversaryDate);
  const [relationshipTitle, setRelationshipTitle] = useState(profile.relationshipTitle);

  // Security / PIN states
  const [isPinEnabled, setIsPinEnabled] = useState(settings.isPinEnabled);
  const [pinCode, setPinCode] = useState(settings.pinCode || '1234');
  const [confirmPinCode, setConfirmPinCode] = useState(settings.pinCode || '1234');
  const [pinSaveFeedback, setPinSaveFeedback] = useState<string | null>(null);

  // Music states
  const [songTitle, setSongTitle] = useState(settings.songTitle || 'Notre Douce Sérénade');
  const [songAudioUrl, setSongAudioUrl] = useState(settings.songAudioUrl || '');
  const [ambientTrackId, setAmbientTrackId] = useState(settings.ambientTrackId);

  // File refs
  const p1FileInputRef = useRef<HTMLInputElement>(null);
  const p2FileInputRef = useRef<HTMLInputElement>(null);
  const backupImportInputRef = useRef<HTMLInputElement>(null);

  const suggestedAvatarsP1 = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  ];

  const suggestedAvatarsP2 = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
  ];

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

  const handleSaveMusicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      songTitle: songTitle.trim() || 'Notre Chanson',
      songAudioUrl: songAudioUrl.trim() || undefined,
      ambientTrackId,
    });
    soundEffects.playSuccessSparkle();
    alert('Ambiance musicale mise à jour !');
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
      },
      partner2: {
        ...profile.partner2,
        name: partner2Name.trim() || 'Med',
        nickname: partner2Nickname.trim(),
        avatar: partner2Avatar.trim(),
      },
      anniversaryDate,
      relationshipTitle:
        relationshipTitle.trim() || `${partner1Name} & ${partner2Name}`,
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
            <div className="flex items-center gap-2">
              <h3 className="font-serif-romantic text-xl sm:text-2xl font-bold text-stone-900">
                Paramètres & Personnalisation
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>Mali 🇲🇱</span>
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Photos de profil, sécurité par code PIN, ambiance musicale et sauvegarde complète.
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
            onClick={() => setModalTab('music')}
            className={`py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              modalTab === 'music'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-rose-500" />
            <span>Notre Chanson</span>
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
                {/* Partner 1 (Safi) Section */}
                {(activePartnerSubTab === 'both' || activePartnerSubTab === 'p1') && (
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-romantic text-sm font-bold text-rose-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Partenaire 1 ({partner1Name || 'Safi'})</span>
                      </h4>
                      <span className="text-[11px] font-medium text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-full">
                        Couleur : Rose doux
                      </span>
                    </div>

                    {/* Photo Upload & Preview for Partner 1 */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 p-3.5 rounded-2xl border border-rose-200/60">
                      <div className="relative group">
                        <img
                          src={partner1Avatar}
                          alt={partner1Name}
                          className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-md ring-3 ring-rose-400"
                        />
                        {isP1LoadingPhoto && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                            Chargement...
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => p1FileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition-transform group-hover:scale-110"
                          title="Choisir une photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            Photo de profil de {partner1Name || 'Safi'}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Importez directement depuis votre appareil.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <input
                            ref={p1FileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleP1FileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => p1FileInputRef.current?.click()}
                            disabled={isP1LoadingPhoto}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isP1LoadingPhoto ? 'Compression...' : 'Téléverser ma photo'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowP1UrlInput(!showP1UrlInput)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>Lien web</span>
                          </button>
                        </div>

                        {/* Sample avatars */}
                        <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                          <span className="text-[10px] text-stone-400 font-medium">Suggestions :</span>
                          <div className="flex items-center gap-1.5">
                            {suggestedAvatarsP1.map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPartner1Avatar(url)}
                                className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                                  partner1Avatar === url ? 'border-rose-500 scale-110' : 'border-transparent'
                                }`}
                              >
                                <img src={url} alt="avatar" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {showP1UrlInput && (
                          <input
                            type="url"
                            placeholder="https://..."
                            value={partner1Avatar}
                            onChange={(e) => setPartner1Avatar(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs mt-1"
                          />
                        )}

                        {p1Error && <p className="text-xs text-red-600">{p1Error}</p>}
                      </div>
                    </div>

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
                          placeholder="Ex: Mon étoile ✨, Safi djou"
                          className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-medium text-stone-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Partner 2 (Med) Section */}
                {(activePartnerSubTab === 'both' || activePartnerSubTab === 'p2') && (
                  <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-romantic text-sm font-bold text-sky-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        <span>Partenaire 2 ({partner2Name || 'Med'})</span>
                      </h4>
                      <span className="text-[11px] font-medium text-sky-600 bg-sky-100/60 px-2 py-0.5 rounded-full">
                        Couleur : Bleu roi
                      </span>
                    </div>

                    {/* Photo Upload & Preview for Partner 2 */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 p-3.5 rounded-2xl border border-sky-200/60">
                      <div className="relative group">
                        <img
                          src={partner2Avatar}
                          alt={partner2Name}
                          className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-md ring-3 ring-sky-400"
                        />
                        {isP2LoadingPhoto && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                            Chargement...
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => p2FileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-md transition-transform group-hover:scale-110"
                          title="Choisir une photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            Photo de profil de {partner2Name || 'Med'}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Importez directement depuis votre appareil.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <input
                            ref={p2FileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleP2FileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => p2FileInputRef.current?.click()}
                            disabled={isP2LoadingPhoto}
                            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isP2LoadingPhoto ? 'Compression...' : 'Téléverser ma photo'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowP2UrlInput(!showP2UrlInput)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>Lien web</span>
                          </button>
                        </div>

                        {/* Sample avatars */}
                        <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                          <span className="text-[10px] text-stone-400 font-medium">Suggestions :</span>
                          <div className="flex items-center gap-1.5">
                            {suggestedAvatarsP2.map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPartner2Avatar(url)}
                                className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                                  partner2Avatar === url ? 'border-sky-500 scale-110' : 'border-transparent'
                                }`}
                              >
                                <img src={url} alt="avatar" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {showP2UrlInput && (
                          <input
                            type="url"
                            placeholder="https://..."
                            value={partner2Avatar}
                            onChange={(e) => setPartner2Avatar(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs mt-1"
                          />
                        )}

                        {p2Error && <p className="text-xs text-red-600">{p2Error}</p>}
                      </div>
                    </div>

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
                          placeholder="Ex: Mon cœur ❤️, Med chéri"
                          className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-medium text-stone-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Anniversary & Title */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <h4 className="font-serif-romantic text-xs sm:text-sm font-bold text-stone-800">
                      Notre Histoire & Titre
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
                        placeholder="Ex: Med & Safi"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Réinitialiser avec les données d’origine (Med & Safi au Mali) ?')) {
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
                    <span>Enregistrer le profil</span>
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

          {/* TAB 3: NOTRE CHANSON & AMBIANCE */}
          {modalTab === 'music' && (
            <div className="space-y-4 p-2">
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl mt-0.5">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      Ambiance Sonore & Notre Chanson
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Profitez d'un fond musical apaisant pendant que vous parcourez vos souvenirs (généré directement dans votre navigateur) ou configurez le titre fétiche de votre couple.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveMusicSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Titre de « Notre Chanson » :
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Ex: Sidiki Diabaté - C'est bon / Notre mélodie d'amour"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Ambiance sonore par défaut :
                  </label>
                  <select
                    value={ambientTrackId}
                    onChange={(e) => setAmbientTrackId(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
                  >
                    <option value="kora_serenade">🪕 Kora & Sérénade Malienne (Arpèges doux)</option>
                    <option value="river_breeze">🌊 Brise douce sur le Djoliba (Ondes du Niger)</option>
                    <option value="starry_night">✨ Nuit Étoilée & Piano (Mélodies romantiques)</option>
                    <option value="soft_rain">🌧️ Pluie Douce & Cocooning (Intimité cosy)</option>
                    <option value="none">🔇 Silence (Désactivé)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Lien audio / MP3 personnalisé (facultatif) :
                  </label>
                  <input
                    type="url"
                    value={songAudioUrl}
                    onChange={(e) => setSongAudioUrl(e.target.value)}
                    placeholder="https://exemple.com/notre-chanson.mp3"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Si aucun lien n'est renseigné, le synthétiseur d'ambiance intégré prend le relais automatiquement.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Valider l'ambiance sonore</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SAUVEGARDE & RESTAURATION */}
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
                      Téléchargez en un clic une sauvegarde complète de tout votre nid d'amour (vos photos, vos souvenirs, vos billets doux, vos capsules temporelles, votre bucket list). Vous pouvez la garder en lieu sûr ou la restaurer sur un autre téléphone.
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
        </div>
      </motion.div>
    </div>
  );
};
