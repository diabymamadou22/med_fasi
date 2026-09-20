import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Check,
  Gift,
  Heart,
  Shuffle,
  Lock,
  Flame,
  Award,
  Calendar,
} from 'lucide-react';
import { CoupleProfile, PartnerId, DateIdea, LoveVoucher } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';

interface LoveVouchersSectionProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  xpPoints: number;
  dateIdeas: DateIdea[];
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onOpenDateIdeasWheel?: () => void;
  onOpenLexicon?: () => void;
}

interface CoupleVoucherDef {
  id: string;
  title: string;
  description: string;
  requiredXp: number;
  icon: string;
  color: string;
}

const DEFAULT_VOUCHERS: CoupleVoucherDef[] = [
  {
    id: 'vouch-1',
    title: 'Massage des Épaules',
    description: '15 minutes de massage relaxant des épaules et de la nuque, sans interruption.',
    requiredXp: 50,
    icon: '💆‍♀️',
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'vouch-2',
    title: 'Petit-Déjeuner au Lit',
    description: 'Café ou thé chaud, croissants ou tartines servis au lit avec un baiser.',
    requiredXp: 100,
    icon: '☕',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'vouch-3',
    title: 'Baiser Cinéma Langoureux',
    description: 'Un baiser passionné de 30 secondes chrono, n\'importe où, n\'importe quand.',
    requiredXp: 150,
    icon: '💋',
    color: 'from-rose-600 to-red-600',
  },
  {
    id: 'vouch-4',
    title: 'Choix du Film ou Série',
    description: 'Le détenteur de ce bon choisit le programme du soir sans aucune négociation !',
    requiredXp: 200,
    icon: '🎬',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'vouch-5',
    title: 'Câlin Illimité 10 Minutes',
    description: 'Dix minutes complètes blottis l\'un contre l\'autre les yeux fermés.',
    requiredXp: 250,
    icon: '🤗',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'vouch-6',
    title: 'Murmure en Anglais',
    description: 'Un compliment chuchoté en anglais avec accent suave au creux de l\'oreille.',
    requiredXp: 300,
    icon: '🇬🇧',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'vouch-7',
    title: 'Soirée Chandelles Surprise',
    description: 'Un dîner intime aux chandelles organisé de A à Z par ton amour.',
    requiredXp: 400,
    icon: '🕯️',
    color: 'from-pink-600 to-rose-700',
  },
];

export const LoveVouchersSection: React.FC<LoveVouchersSectionProps> = ({
  profile,
  activePartnerId,
  xpPoints,
  dateIdeas,
  onSendChatMessage,
  onOpenDateIdeasWheel,
  onOpenLexicon,
}) => {
  const [redeemedVoucherIds, setRedeemedVoucherIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('english_redeemed_vouchers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTabSub, setActiveTabSub] = useState<'vouchers' | 'dates'>('vouchers');

  // Date roulette state
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSpinningDateWheel, setIsSpinningDateWheel] = useState(false);
  const [dateWheelAngle, setDateWheelAngle] = useState(0);
  const safeDateIdeas = dateIdeas || [];
  const [pickedDate, setPickedDate] = useState<DateIdea | undefined>(safeDateIdeas[0]);

  const activePartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const handleClaimVoucherInChat = (vouch: CoupleVoucherDef) => {
    if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        content: `🎟️ *BON D'AMOUR UTILISÉ !*\n\n🎁 *${vouch.title}* ${vouch.icon}\n📜 ${vouch.description}\n\n❤️ Offert avec amour par ${activePartner.name} à ${otherPartner.name} !\n(Débloqué grâce à nos jeux de couple ! ✨)`,
      });
      soundEffects.playMessageSent();
      triggerCelebrationConfetti();
    }
  };

  const handleToggleRedeemed = (id: string) => {
    soundEffects.playSoftTap();
    setRedeemedVoucherIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('english_redeemed_vouchers', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const filteredDates = safeDateIdeas.filter((d) => {
    if (selectedBudget !== 'all' && d.budget !== selectedBudget) return false;
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    return true;
  });

  const handleSpinDateWheel = () => {
    if (isSpinningDateWheel) return;
    const pool = filteredDates.length > 0 ? filteredDates : safeDateIdeas;
    if (pool.length === 0) return;

    setIsSpinningDateWheel(true);
    soundEffects.playHeartPulse();

    const randomAngle = dateWheelAngle + 1440 + Math.floor(Math.random() * 360);
    setDateWheelAngle(randomAngle);

    setTimeout(() => {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      setPickedDate(chosen);
      setIsSpinningDateWheel(false);
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs: Vouchers vs Dates Roulette */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTabSub('vouchers')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation text-center ${
              activeTabSub === 'vouchers'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span className="truncate">Bons Débloqués</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSub('dates')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation text-center ${
              activeTabSub === 'dates'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Shuffle className="w-4 h-4 shrink-0" />
            <span className="truncate">Roue des Rencards</span>
          </button>
        </div>

        {onOpenLexicon && (
          <button
            type="button"
            onClick={onOpenLexicon}
            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer hidden sm:flex items-center gap-1 shrink-0"
          >
            <span>Notre Boîte à Mots Doux 💌</span>
          </button>
        )}
      </div>

      {/* View A: Love Vouchers */}
      {activeTabSub === 'vouchers' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 sm:p-7 rounded-3xl border border-rose-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-2xs">
                Récompenses de Couple
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-romantic">
                Bons d'Amour à Réclamer entre Nous
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
                Vos points de complicité débloquent de vraies récompenses romantiques ! Envoyez le bon directement dans le chat pour le réclamer à votre partenaire.
              </p>
            </div>

            <div className="bg-white/90 p-3.5 rounded-2xl border border-rose-200 shrink-0 text-center">
              <p className="text-xs text-stone-500 font-bold">Votre Cagnotte Duo</p>
              <p className="text-2xl font-extrabold text-amber-500 flex items-center justify-center gap-1">
                <Sparkles className="w-5 h-5 fill-amber-500" />
                <span>{xpPoints}</span>
                <span className="text-xs text-stone-600 font-normal">pts</span>
              </p>
            </div>
          </div>

          {/* Vouchers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_VOUCHERS.map((vouch) => {
              const isUnlocked = xpPoints >= vouch.requiredXp;
              const isRedeemed = redeemedVoucherIds.includes(vouch.id);

              return (
                <div
                  key={vouch.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                    !isUnlocked
                      ? 'bg-stone-50/80 border-stone-200 opacity-60'
                      : isRedeemed
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-rose-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{vouch.icon}</span>
                      {isUnlocked ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {isRedeemed ? 'Utilisé ✓' : 'Débloqué !'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{vouch.requiredXp} pts</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-stone-900 font-serif-romantic">
                        {vouch.title}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed mt-1">
                        {vouch.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    {isUnlocked ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleClaimVoucherInChat(vouch)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Réclamer au Chat 💌</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRedeemed(vouch.id)}
                          className={`p-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            isRedeemed
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                          }`}
                          title="Marquer comme déjà utilisé"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <p className="text-[11px] text-stone-400 font-medium">
                        Encore {vouch.requiredXp - xpPoints} points à gagner en jouant !
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View B: Date Picker Wheel */}
      {activeTabSub === 'dates' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="pb-3 border-b border-stone-100">
            <h3 className="text-xl font-bold text-stone-900 font-serif-romantic">
              La Roue des Rencards & Idées de Soirées
            </h3>
            <p className="text-xs text-stone-600">
              Ne cherchez plus pendant des heures quoi faire : laissez le destin amoureux choisir !
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Spinning disc */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
              <div className="relative w-52 h-52 sm:w-60 sm:h-60">
                <motion.div
                  animate={{ rotate: dateWheelAngle }}
                  transition={{
                    duration: isSpinningDateWheel ? 2 : 0.3,
                    ease: 'easeInOut',
                  }}
                  className="w-full h-full rounded-full border-8 border-rose-200 bg-gradient-to-tr from-rose-400 via-pink-400 to-amber-300 shadow-xl flex items-center justify-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div className="border-r border-b border-white/40 flex items-center justify-center text-2xl">
                      🎬
                    </div>
                    <div className="border-b border-white/40 flex items-center justify-center text-2xl">
                      🍝
                    </div>
                    <div className="border-r border-white/40 flex items-center justify-center text-2xl">
                      ✨
                    </div>
                    <div className="flex items-center justify-center text-2xl">
                      🕯️
                    </div>
                  </div>
                </motion.div>

                <button
                  type="button"
                  onClick={handleSpinDateWheel}
                  disabled={isSpinningDateWheel}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white text-rose-600 font-bold text-xs shadow-lg hover:scale-105 transition-transform flex flex-col items-center justify-center ring-4 ring-rose-300 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4 text-rose-500 mb-0.5" />
                  <span>{isSpinningDateWheel ? '...' : 'Tourner'}</span>
                </button>
              </div>
            </div>

            {/* Picked Idea Card */}
            <div className="md:col-span-7">
              {pickedDate ? (
                <div className="bg-gradient-to-br from-rose-50/80 to-amber-50/60 p-6 rounded-3xl border border-rose-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                      {pickedDate.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-stone-700 border border-stone-200">
                      {pickedDate.budget}
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-stone-900 font-serif-romantic">
                    {pickedDate.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                    {pickedDate.description}
                  </p>

                  {pickedDate.prepTip && (
                    <p className="text-xs text-rose-900 bg-white/80 p-2.5 rounded-xl border border-rose-100 font-medium">
                      💡 <strong>Conseil : </strong> {pickedDate.prepTip}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onSendChatMessage) {
                        onSendChatMessage({
                          senderId: activePartnerId,
                          content: `🎡 *Idée de Rencard tirée au sort* :\n\n🌹 "${pickedDate.title}"\n${pickedDate.description}\n\n(On se fait ça quand mon amour ? 💕)`,
                        });
                        soundEffects.playMessageSent();
                        triggerHeartConfetti();
                      }
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Proposer ce rencard dans le Chat 💌</span>
                  </button>
                </div>
              ) : (
                <div className="bg-stone-50/80 border border-stone-200 p-6 rounded-3xl text-center space-y-2">
                  <p className="text-stone-700 font-medium text-sm">Prêts pour votre prochain rendez-vous ?</p>
                  <p className="text-xs text-stone-500">Cliquez sur « Tourner » pour tirer au sort une idée romantique sur-mesure ! ✨</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
