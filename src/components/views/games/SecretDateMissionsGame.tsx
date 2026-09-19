import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  Heart,
  Flame,
  Award,
  Calendar,
  Coffee,
  MessageCircle,
  Film,
  Music,
  MapPin,
  Utensils,
  Trophy,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';

interface SecretDateMissionsGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onAddXp: (amount: number) => void;
}

interface DateMission {
  id: string;
  category: 'resto' | 'maison' | 'chat' | 'voyage';
  categoryLabel: string;
  categoryColor: string;
  icon: string;
  title: string;
  instruction: string;
  phraseTipEn: string;
  phraseTipFr: string;
  points: number;
  completedBy: PartnerId[];
  completedAt?: string;
}

const INITIAL_DATE_MISSIONS: DateMission[] = [
  {
    id: 'm1',
    category: 'resto',
    categoryLabel: 'Sortie & Resto 🍷',
    categoryColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: '☕',
    title: 'Commander nos boissons 100% en anglais',
    instruction:
      'Lors de votre prochaine pause café ou commande au restaurant, passez la commande de vos 2 boissons entièrement en anglais devant le serveur ou entre vous.',
    phraseTipEn: 'Two iced lattes with oat milk, please, and the bill whenever you are ready.',
    phraseTipFr: 'Deux lattes glacés au lait d\'avoine, s\'il vous plaît, et l\'addition quand vous voulez.',
    points: 35,
    completedBy: [],
  },
  {
    id: 'm2',
    category: 'chat',
    categoryLabel: 'Chat & Messages 📱',
    categoryColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '💌',
    title: 'Une déclaration d\'amour 100% en anglais',
    instruction:
      'Envoie aujourd\'hui sur votre chat un vrai message d\'amour d\'au moins 3 phrases complètes rédigées exclusivement en anglais.',
    phraseTipEn: 'Thinking of you makes my whole day brighter. Can\'t wait to hug you tonight.',
    phraseTipFr: 'Penser à toi illumine toute ma journée. J\'ai hâte de te serrer dans mes bras ce soir.',
    points: 30,
    completedBy: [],
  },
  {
    id: 'm3',
    category: 'maison',
    categoryLabel: 'Maison & Dîner 🛋️',
    categoryColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '🤫',
    title: 'Le quart d\'heure interdit au français',
    instruction:
      'Pendant 10 à 15 minutes à table ou sur le canapé, interdiction formelle de prononcer un seul mot de français. Rires et gestes autorisés !',
    phraseTipEn: 'How was your day? Pass me the bread, please, my love.',
    phraseTipFr: 'Comment s\'est passée ta journée ? Passe-moi le pain s\'il te plaît, mon amour.',
    points: 40,
    completedBy: [],
  },
  {
    id: 'm4',
    category: 'maison',
    categoryLabel: 'Murmure Secret 🌙',
    categoryColor: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '💋',
    title: '3 compliments chuchotés avant de dormir',
    instruction:
      'Dans le lit ou avant d\'éteindre la lumière, approche-toi et murmure 3 compliments sincères en anglais à l\'oreille de ton partenaire.',
    phraseTipEn: 'You are gorgeous, you are so smart, and you have my whole heart.',
    phraseTipFr: 'Tu es magnifique, tu es si intelligent(e), et tu as tout mon cœur.',
    points: 30,
    completedBy: [],
  },
  {
    id: 'm5',
    category: 'maison',
    categoryLabel: 'Cinéma & Soirée 🎬',
    categoryColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '🍿',
    title: 'Soirée film en VO sous-titrée anglais',
    instruction:
      'Regarder un épisode d\'une série ou un film ensemble en anglais (audio anglais) avec les sous-titres en anglais plutôt qu\'en français.',
    phraseTipEn: 'Let\'s watch with English subtitles to train our ears together!',
    phraseTipFr: 'Regardons avec les sous-titres anglais pour habituer nos oreilles ensemble !',
    points: 35,
    completedBy: [],
  },
  {
    id: 'm6',
    category: 'voyage',
    categoryLabel: 'Sortie & Balade ✈️',
    categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '🎶',
    title: 'Duo musical en voiture ou sous la douche',
    instruction:
      'Mettre votre chanson romantique en anglais préférée et chanter le refrain ensemble à tue-tête avec passion.',
    phraseTipEn: 'Singing our favorite love anthem together at the top of our lungs!',
    phraseTipFr: 'Chanter notre hymne d\'amour préféré ensemble de tout notre cœur !',
    points: 25,
    completedBy: [],
  },
  {
    id: 'm7',
    category: 'chat',
    categoryLabel: 'Chat & Quotidien 💬',
    categoryColor: 'bg-violet-100 text-violet-800 border-violet-200',
    icon: '📝',
    title: 'La liste de courses ou projets en anglais',
    instruction:
      'Rédiger votre prochaine liste de courses ou vos 5 envies de week-end exclusivement avec des mots en anglais.',
    phraseTipEn: 'Strawberries, croissants, sparkling water, chocolate, scented candles.',
    phraseTipFr: 'Fraises, croissants, eau gazeuse, chocolat, bougies parfumées.',
    points: 25,
    completedBy: [],
  },
  {
    id: 'm8',
    category: 'resto',
    categoryLabel: 'Rendez-vous Amoureux 🍽️',
    categoryColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: '🍷',
    title: 'Porter un toast en anglais les yeux dans les yeux',
    instruction:
      'Tinter vos verres et prononcer un toast complice en anglais lors de votre prochain dîner ou apéro.',
    phraseTipEn: 'To us, to our wild adventures, and to forever together. Cheers, my love!',
    phraseTipFr: 'À nous, à nos folles aventures et à toujours ensemble. Santé mon amour !',
    points: 30,
    completedBy: [],
  },
];

export const SecretDateMissionsGame: React.FC<SecretDateMissionsGameProps> = ({
  profile,
  activePartnerId,
  onSendChatMessage,
  onAddXp,
}) => {
  const partnerMe = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const partnerOther = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [missions, setMissions] = useState<DateMission[]>(() => {
    try {
      const saved = localStorage.getItem('couple_secret_date_missions');
      return saved ? JSON.parse(saved) : INITIAL_DATE_MISSIONS;
    } catch {
      return INITIAL_DATE_MISSIONS;
    }
  });

  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [customPhrase, setCustomPhrase] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('couple_secret_date_missions', JSON.stringify(missions));
    } catch {}
  }, [missions]);

  const handleToggleMission = (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return;

    const hasMe = mission.completedBy.includes(activePartnerId);
    let nextCompletedBy: PartnerId[];

    if (hasMe) {
      soundEffects.playSoftTap();
      nextCompletedBy = mission.completedBy.filter((id) => id !== activePartnerId);
    } else {
      soundEffects.playVictoryChime();
      triggerHeartConfetti();
      triggerCelebrationConfetti();
      nextCompletedBy = [...mission.completedBy, activePartnerId];
      onAddXp(mission.points);

      // Notify in chat
      if (onSendChatMessage) {
        onSendChatMessage({
          senderId: activePartnerId,
          content: `🎯 **Défi d'anglais dans la vraie vie validé !**\n\n✨ Mission : "${mission.title}"\n🎉 +${mission.points} points de complicité remportés !\n\n👉 *"${mission.phraseTipEn}"*`,
        });
      }
    }

    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              completedBy: nextCompletedBy,
              completedAt: nextCompletedBy.length > 0 ? new Date().toISOString() : undefined,
            }
          : m
      )
    );
  };

  const handleAddCustomMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    soundEffects.playSuccessSparkle();
    const newMission: DateMission = {
      id: `custom-m-${Date.now()}`,
      category: 'maison',
      categoryLabel: 'Défi Personnalisé ✨',
      categoryColor: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: '🎯',
      title: customTitle.trim(),
      instruction: customInstruction.trim() || 'Défi d\'anglais créé sur mesure par votre partenaire.',
      phraseTipEn: customPhrase.trim() || 'English makes us closer every day!',
      phraseTipFr: 'L\'anglais nous rapproche chaque jour un peu plus !',
      points: 40,
      completedBy: [],
    };

    setMissions((prev) => [newMission, ...prev]);
    setCustomTitle('');
    setCustomInstruction('');
    setCustomPhrase('');
    setShowAddCustom(false);
  };

  const filteredMissions =
    filterCategory === 'all'
      ? missions
      : missions.filter((m) => m.category === filterCategory);

  const completedTotal = missions.filter((m) => m.completedBy.length > 0).length;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-2xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-1.5 font-serif-romantic">
              <span>Secret Date Missions</span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                Dans la Vraie Vie
              </span>
            </h2>
            <p className="text-[11px] text-stone-500">Défis d'anglais réels à valider ensemble</p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
          <span>
            {completedTotal} / {missions.length}
          </span>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-0.5">
        {[
          { id: 'all', label: 'Toutes' },
          { id: 'resto', label: 'Sorties & Resto 🍷' },
          { id: 'maison', label: 'Maison & Câlins 🛋️' },
          { id: 'chat', label: 'Chat & Messages 📱' },
          { id: 'voyage', label: 'Voyages & Balades ✈️' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === cat.id
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Create Custom Mission Toggle */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Proposer un défi personnalisé</span>
        </button>
      </div>

      {/* Custom Mission Form */}
      <AnimatePresence>
        {showAddCustom && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddCustomMission}
            className="p-4 bg-white rounded-2xl border border-rose-200 shadow-sm space-y-3"
          >
            <h4 className="text-xs font-bold text-stone-900">
              Nouveau Défi d'Anglais dans la Vraie Vie ✨
            </h4>

            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Ex: Me commander mon dessert préféré en anglais au resto"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
              required
            />

            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Consignes ou détails complices..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
            />

            <input
              type="text"
              value={customPhrase}
              onChange={(e) => setCustomPhrase(e.target.value)}
              placeholder="Phrase anglaise modèle (optionnelle)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-2xs hover:bg-rose-600 cursor-pointer"
              >
                Ajouter la mission
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Missions List */}
      <div className="space-y-3">
        {filteredMissions.map((mission) => {
          const isDoneByMe = mission.completedBy.includes(activePartnerId);
          const isDoneByOther = mission.completedBy.includes(
            activePartnerId === 'p1' ? 'p2' : 'p1'
          );
          const isBoth = isDoneByMe && isDoneByOther;

          return (
            <motion.div
              key={mission.id}
              layout
              className={`p-4 rounded-3xl border transition-all ${
                isDoneByMe
                  ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                  : 'bg-white border-stone-200 hover:border-rose-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Big Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleMission(mission.id)}
                    className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 ${
                      isDoneByMe
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                        : 'border-stone-300 hover:border-rose-400 bg-stone-50'
                    }`}
                  >
                    {isDoneByMe ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-stone-300" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mission.categoryColor}`}
                      >
                        {mission.categoryLabel}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        +{mission.points} XP
                      </span>
                      {isBoth && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                          Duo Relevé ! 🏆
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-sm font-bold text-stone-900 ${
                        isDoneByMe ? 'line-through text-stone-500' : ''
                      }`}
                    >
                      {mission.title}
                    </h3>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {mission.instruction}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phrase Tip in English */}
              <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                <p className="text-[11px] font-bold text-stone-800 flex items-center gap-1">
                  <span>Phrase d'exemple :</span>
                  <span className="font-mono text-rose-600 font-semibold">
                    « {mission.phraseTipEn} »
                  </span>
                </p>
                <p className="text-[10px] text-stone-500 italic">— {mission.phraseTipFr}</p>
              </div>

              {/* Validation Status footer */}
              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Validé par :</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full ${
                      isDoneByMe ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {partnerMe.name} {isDoneByMe ? '✓' : '✗'}
                  </span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full ${
                      isDoneByOther ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {partnerOther.name} {isDoneByOther ? '✓' : '✗'}
                  </span>
                </div>

                {isDoneByMe && onSendChatMessage && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playSuccessSparkle();
                      onSendChatMessage({
                        senderId: activePartnerId,
                        content: `🎯 J'ai validé la mission d'anglais : "${mission.title}" ! À toi de jouer mon amour !`,
                      });
                    }}
                    className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Chat</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
