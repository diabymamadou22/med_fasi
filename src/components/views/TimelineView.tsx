import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Calendar,
  MapPin,
  Heart,
  Plus,
  Play,
  Pause,
  Lock,
  Unlock,
  Sparkles,
  Compass,
  Tag,
  Coffee,
  Trees,
  Home,
  Image as ImageIcon,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  TimelineMemory,
  TimeCapsule,
  MemoryLocation,
} from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

interface TimelineViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  memories: TimelineMemory[];
  capsules: TimeCapsule[];
  locations: MemoryLocation[];
  onOpenAddMemoryModal: () => void;
  onOpenAddCapsuleModal: () => void;
  onOpenAddLocationModal: () => void;
  onLikeMemory: (memoryId: string) => void;
  onUnlockCapsule: (capsuleId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  profile,
  activePartnerId,
  memories,
  capsules,
  locations,
  onOpenAddMemoryModal,
  onOpenAddCapsuleModal,
  onOpenAddLocationModal,
  onLikeMemory,
  onUnlockCapsule,
}) => {
  const [subSection, setSubSection] = useState<'timeline' | 'capsules' | 'map'>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MemoryLocation | null>(
    locations[0] || null
  );

  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  const handleToggleAudio = (memId: string) => {
    if (playingAudioId === memId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(memId);
      soundEffects.playSuccessSparkle();
    }
  };

  const handleOpenCapsule = (cap: TimeCapsule) => {
    const isReady = new Date(cap.targetUnlockDate).getTime() <= Date.now();
    if (isReady || cap.isOpened) {
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();
      onUnlockCapsule(cap.id);
      setSelectedCapsule({ ...cap, isOpened: true });
    } else {
      setSelectedCapsule(cap);
    }
  };

  // Helper for capsule countdown
  const getDaysRemaining = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Sub-navigation pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSubSection('timeline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              subSection === 'timeline'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="sub-tab-timeline"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fil Chronologique ({memories.length})</span>
          </button>

          <button
            onClick={() => setSubSection('capsules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              subSection === 'capsules'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="sub-tab-capsules"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Capsules Temporelles ({capsules.length})</span>
          </button>

          <button
            onClick={() => setSubSection('map')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              subSection === 'map'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="sub-tab-map"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Carte des Souvenirs ({locations.length})</span>
          </button>
        </div>

        {/* Dynamic Add Action Button based on sub-tab */}
        {subSection === 'timeline' && (
          <button
            onClick={onOpenAddMemoryModal}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            id="btn-add-memory"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un moment</span>
          </button>
        )}
        {subSection === 'capsules' && (
          <button
            onClick={onOpenAddCapsuleModal}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            id="btn-add-capsule"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sceller une nouvelle capsule</span>
          </button>
        )}
        {subSection === 'map' && (
          <button
            onClick={onOpenAddLocationModal}
            className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            id="btn-add-location"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Épingler un lieu d'amour</span>
          </button>
        )}
      </div>

      {/* SECTION 1: TIMELINE */}
      {subSection === 'timeline' && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-500 flex items-center gap-1 font-medium pl-1">
              <Filter className="w-3.5 h-3.5" />
              Filtrer :
            </span>
            {[
              { id: 'all', label: 'Tous les souvenirs' },
              { id: 'rencard', label: '❤️ Rencards' },
              { id: 'voyage', label: '✈️ Voyages' },
              { id: 'fourire', label: '😂 Fous rires' },
              { id: 'etape', label: '🏡 Grandes étapes' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Vertical Interactive Timeline */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-rose-200/80 space-y-8 ml-2 sm:ml-4">
            {filteredMemories.map((mem, idx) => {
              const author =
                mem.authorId === 'p1' ? profile.partner1 : profile.partner2;
              const hasLiked = mem.likes.includes(activePartnerId);
              const isPlaying = playingAudioId === mem.id;

              return (
                <motion.div
                  key={mem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="relative group"
                >
                  {/* Timeline Node Point */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-rose-500 border-4 border-[#FAF7F5] shadow-xs flex items-center justify-center text-[10px] text-white">
                    ❤️
                  </div>

                  {/* Memory Card */}
                  <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700">
                            {mem.category}
                          </span>
                          <span className="text-xs text-stone-400 flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3" />
                            {mem.date}
                          </span>
                        </div>
                        <h3 className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900 mt-1">
                          {mem.title}
                        </h3>
                      </div>

                      {mem.locationName && (
                        <div className="flex items-center gap-1 text-xs text-stone-500 bg-stone-50 px-2.5 py-1 rounded-xl w-fit">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{mem.locationName}</span>
                        </div>
                      )}
                    </div>

                    {/* Photo if available */}
                    {mem.photoUrl && (
                      <div className="rounded-2xl overflow-hidden max-h-72 w-full bg-stone-100">
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Anecdote Description */}
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                      {mem.description}
                    </p>

                    {/* Voice Note / Audio Player Simulator */}
                    {mem.audioDuration && (
                      <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center gap-3">
                        <button
                          onClick={() => handleToggleAudio(mem.id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isPlaying
                              ? 'bg-rose-600 text-white shadow-xs scale-105'
                              : 'bg-white text-rose-600 hover:bg-rose-100'
                          }`}
                          title="Écouter la note vocale"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-900 mb-1">
                            <span>Note vocale d'amour enregistrée</span>
                            <span>{mem.audioDuration}</span>
                          </div>
                          {/* Animated Waveform */}
                          <div className="flex items-center gap-1 h-3">
                            {Array.from({ length: 24 }).map((_, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-200 ${
                                  isPlaying
                                    ? 'bg-rose-500 animate-pulse'
                                    : 'bg-rose-300'
                                }`}
                                style={{
                                  height: isPlaying
                                    ? `${Math.sin(i + Date.now() / 300) * 8 + 10}px`
                                    : `${(i % 5) * 2 + 4}px`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tags & Likes Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {mem.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-stone-100 text-stone-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-400">
                          Ajouté par {author.name}
                        </span>
                        <button
                          onClick={() => onLikeMemory(mem.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            hasLiked
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              hasLiked ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                          <span>{mem.likes.length}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CAPSULES TEMPORELLES */}
      {subSection === 'capsules' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 p-5 sm:p-6 rounded-3xl border border-amber-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>La Boîte à Capsules Secrètes</span>
              </span>
              <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
                Messages Programmés dans le Futur
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                Écrivez-vous des lettres qui ne se déverrouilleront qu'au jour et à l'heure convenus !
              </p>
            </div>
            <button
              onClick={onOpenAddCapsuleModal}
              className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              + Nouvelle Capsule
            </button>
          </div>

          {/* Capsules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capsules.map((cap) => {
              const daysLeft = getDaysRemaining(cap.targetUnlockDate);
              const isUnlocked = daysLeft === 0 || cap.isOpened;
              const author =
                cap.authorId === 'p1' ? profile.partner1 : profile.partner2;
              const recipient =
                cap.recipientId === 'p1' ? profile.partner1 : profile.partner2;

              const sealColors = {
                gold: 'from-amber-400 to-yellow-600 ring-amber-300',
                rose: 'from-pink-400 to-rose-600 ring-rose-300',
                ruby: 'from-rose-600 to-red-800 ring-red-300',
                emerald: 'from-emerald-400 to-teal-700 ring-emerald-300',
              };

              return (
                <div
                  key={cap.id}
                  onClick={() => handleOpenCapsule(cap)}
                  className={`bg-white rounded-3xl border p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                    isUnlocked
                      ? 'border-rose-200 hover:shadow-lg hover:border-rose-300'
                      : 'border-stone-200/90 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header: Seal Badge & Target Date */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-tr ${
                          sealColors[cap.sealTheme] || sealColors.gold
                        } text-white flex items-center justify-center shadow-md ring-2`}
                      >
                        {isUnlocked ? (
                          <Unlock className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isUnlocked
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {isUnlocked ? 'Déverrouillé !' : `Dans ${daysLeft} jours`}
                      </span>
                    </div>

                    <h3 className="font-serif-romantic text-lg font-bold text-stone-900 mb-1">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-stone-500 mb-3">
                      De {author.name} pour {recipient.name}
                    </p>

                    {/* Preview / Lock state */}
                    {isUnlocked ? (
                      <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100 text-xs text-stone-700 font-handwriting text-base">
                        « {cap.message.slice(0, 80)}... »
                      </div>
                    ) : (
                      <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-center space-y-1">
                        <Lock className="w-5 h-5 text-stone-400 mx-auto" />
                        <p className="text-xs font-semibold text-stone-600">
                          Sceau secret intact
                        </p>
                        <p className="text-[10px] text-stone-400">
                          Ouverture le {cap.targetUnlockDate}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-400 text-[11px]">
                      Scellée le {cap.createdAt}
                    </span>
                    <span className="text-rose-600 font-bold group-hover:underline flex items-center gap-0.5">
                      {isUnlocked ? 'Lire la capsule' : 'Voir le compte à rebours'}{' '}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Capsule Reader Modal */}
          <AnimatePresence>
            {selectedCapsule && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl border border-rose-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative"
                >
                  <div className="text-center space-y-3 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 text-white mx-auto flex items-center justify-center shadow-lg ring-4 ring-rose-200">
                      {selectedCapsule.isOpened ? (
                        <Unlock className="w-8 h-8" />
                      ) : (
                        <Lock className="w-8 h-8" />
                      )}
                    </div>
                    <h3 className="font-serif-romantic text-2xl font-bold text-stone-900">
                      {selectedCapsule.title}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Programmé pour le {selectedCapsule.targetUnlockDate}
                    </p>
                  </div>

                  {selectedCapsule.isOpened ? (
                    <div className="space-y-4">
                      {selectedCapsule.photoUrl && (
                        <img
                          src={selectedCapsule.photoUrl}
                          alt="Souvenir scellé"
                          className="w-full h-48 object-cover rounded-2xl"
                        />
                      )}
                      <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-rose-100">
                        <p className="font-handwriting text-2xl text-stone-800 leading-relaxed">
                          {selectedCapsule.message}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 text-center space-y-2">
                      <p className="text-sm font-bold text-amber-900">
                        Patience, mon amour ! ⏳
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Cette capsule est protégée par un sceau d'amour jusqu'au{' '}
                        <strong>{selectedCapsule.targetUnlockDate}</strong> (
                        {getDaysRemaining(selectedCapsule.targetUnlockDate)} jours
                        restants).
                      </p>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setSelectedCapsule(null)}
                      className="px-6 py-2 rounded-full bg-stone-900 text-white text-xs font-bold hover:bg-stone-800"
                    >
                      Fermer
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* SECTION 3: CARTE INTERACTIVE DES SOUVENIRS */}
      {subSection === 'map' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 mb-1">
                  <Compass className="w-3.5 h-3.5 text-sky-600" />
                  <span>Notre Géographie Romantique</span>
                </span>
                <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  La Carte de Nos Lieux Précieux
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Chaque point marque un café, une plage, une ville ou un fou rire inoubliable.
                </p>
              </div>

              <button
                onClick={onOpenAddLocationModal}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un lieu</span>
              </button>
            </div>

            {/* Interactive Vector Map Stage */}
            <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-gradient-to-tr from-sky-50 via-rose-50/40 to-amber-50 border border-sky-100 overflow-hidden shadow-inner flex items-center justify-center">
              {/* Subtle background continent lines / grid */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Decorative route connector curves */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <path
                  d="M 200,100 Q 300,180 400,150 T 600,200"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>

              {/* Map Pins */}
              {locations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <motion.button
                    key={loc.id}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedLocation(loc);
                      soundEffects.playSuccessSparkle();
                    }}
                    style={{
                      left: `${loc.xPercent}%`,
                      top: `${loc.yPercent}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all shadow-md z-10 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-rose-600 text-white ring-4 ring-rose-300 scale-110'
                        : 'bg-white text-rose-600 hover:bg-rose-50'
                    }`}
                    title={`${loc.name} (${loc.city})`}
                  >
                    <MapPin className="w-4 h-4 fill-current" />
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md hidden sm:inline ${
                        isSelected ? 'bg-rose-700 text-white' : 'bg-white/90 text-stone-800'
                      }`}
                    >
                      {loc.city}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected Location Details Card */}
            {selectedLocation && (
              <motion.div
                key={selectedLocation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  {selectedLocation.photoUrl ? (
                    <img
                      src={selectedLocation.photoUrl}
                      alt={selectedLocation.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-white shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <MapPin className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {selectedLocation.category} • {selectedLocation.city}
                    </span>
                    <h3 className="font-serif-romantic text-lg font-bold text-stone-900 mt-1">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {selectedLocation.description}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1 font-medium">
                      Date du souvenir : {selectedLocation.date}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
