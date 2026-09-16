import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  Sparkles,
  Send,
  Heart,
  PartyPopper,
  MessageCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';
import { speakEnglish } from '../../../lib/englishSpeech';
import { ENGLISH_DIALOGUES } from '../../../data/englishCourseData';

interface LoveRoleplayGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  speechRate: number;
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onAddXp: (amount: number) => void;
}

export const LoveRoleplayGame: React.FC<LoveRoleplayGameProps> = ({
  profile,
  activePartnerId,
  speechRate,
  onSendChatMessage,
  onAddXp,
}) => {
  const [activeDialogueId, setActiveDialogueId] = useState<string>(ENGLISH_DIALOGUES[0].id);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);

  const activeDialogue =
    ENGLISH_DIALOGUES.find((d) => d.id === activeDialogueId) || ENGLISH_DIALOGUES[0];

  const handlePlayAudio = (phrase: string) => {
    soundEffects.playSoftTap();
    speakEnglish(phrase, { rate: speechRate });
  };

  const handleSendLineToChat = (speakerName: string, english: string, french: string) => {
    if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        content: `🎭 *Réplique de ${speakerName}* :\n\n🇬🇧 "${english}"\n🇫🇷 ${french}\n\n(Extrait de notre jeu de rôle complice ! 💕)`,
      });
      soundEffects.playMessageSent();
      triggerHeartConfetti();
    }
  };

  const handleCompleteScenario = () => {
    if (completedScenarios.includes(activeDialogue.id)) return;
    setCompletedScenarios((prev) => [...prev, activeDialogue.id]);
    onAddXp(35);
    soundEffects.playSuccessSparkle();
    triggerCelebrationConfetti();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 text-7xl sm:text-8xl opacity-15 select-none pointer-events-none">
          🎭
        </div>
        <div className="relative z-10 max-w-2xl space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] sm:text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>JEU DE RÔLE THÉÂTRAL À DEUX</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-serif-romantic tracking-tight">
            Scénarios Complices & Jeux d'Acteurs
          </h2>
          <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
            Chacun son rôle, chacun son avatar ! Donnez vie à des dialogues romantiques en anglais en y mettant tout votre charme, vos sourires et vos accents !
          </p>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {ENGLISH_DIALOGUES.map((diag) => {
          const isSelected = activeDialogueId === diag.id;
          const isDone = completedScenarios.includes(diag.id);
          return (
            <button
              key={diag.id}
              type="button"
              onClick={() => {
                setActiveDialogueId(diag.id);
                soundEffects.playSoftTap();
              }}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 min-h-[50px] touch-manipulation ${
                isSelected
                  ? 'bg-white border-rose-500 shadow-sm ring-2 ring-rose-400/20'
                  : 'bg-white/90 border-stone-200 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0">{diag.icon}</span>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                    {diag.frenchTitle}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">{diag.situation}</p>
                </div>
              </div>
              {isDone && (
                <span className="text-emerald-600 shrink-0 text-[10px] sm:text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Joué ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Roleplay Stage View */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 border border-stone-200 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-stone-100">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              Scène en Duo
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-romantic leading-snug">
              🇫🇷 {activeDialogue.frenchTitle} <span className="text-xs sm:text-sm font-sans font-medium text-stone-500">({activeDialogue.title})</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">{activeDialogue.situation}</p>
          </div>

          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCompleteScenario}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] touch-manipulation ${
                completedScenarios.includes(activeDialogue.id)
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {completedScenarios.includes(activeDialogue.id)
                  ? 'Scénario Validé ! (+35 pts)'
                  : 'Valider notre Scène (+35 pts)'}
              </span>
            </button>
          </div>
        </div>

        {/* Script Bubbles */}
        <div className="space-y-3.5 sm:space-y-5 max-w-2xl mx-auto py-1">
          {activeDialogue.lines.map((line, lIdx) => {
            const isP1 = line.speaker === 'partner1';
            const speakerPartner = isP1 ? profile.partner1 : profile.partner2;

            return (
              <motion.div
                key={`diag-line-${lIdx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: lIdx * 0.08 }}
                className={`flex gap-2 sm:gap-3.5 items-start ${
                  isP1 ? 'justify-start' : 'justify-end flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {speakerPartner.avatar ? (
                    <img
                      src={speakerPartner.avatar}
                      alt={speakerPartner.name}
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-rose-300 shadow-2xs"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center font-bold text-rose-700 text-xs sm:text-sm shadow-2xs">
                      {speakerPartner.name[0]}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-[8px] sm:text-[9px] font-bold bg-white px-1 sm:px-1.5 rounded-full border border-stone-200">
                    {speakerPartner.name}
                  </span>
                </div>

                {/* Speech Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[82%] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl space-y-1.5 sm:space-y-2 shadow-2xs ${
                    isP1
                      ? 'bg-rose-50/90 border border-rose-200/80 rounded-tl-xs'
                      : 'bg-amber-50/90 border border-amber-200/80 rounded-tr-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs font-bold text-stone-800">
                      🎭 {speakerPartner.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(line.english)}
                      className="p-1.5 rounded-xl hover:bg-white text-rose-600 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                      title="Écouter la réplique prononcée"
                    >
                      <Volume2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-stone-900 leading-snug break-words">
                    "{line.english}"
                  </p>

                  <p className="text-[11px] sm:text-xs font-mono font-medium text-rose-600 break-words">
                    {line.phonetic}
                  </p>

                  <div className="flex items-start gap-1.5 pt-1.5 border-t border-black/5">
                    <span className="text-xs shrink-0">🇫🇷</span>
                    <p className="text-xs text-stone-700 font-medium leading-relaxed break-words">
                      {line.french}
                    </p>
                  </div>

                  <div className="pt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleSendLineToChat(speakerPartner.name, line.english, line.french)
                      }
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer hover:underline py-1 touch-manipulation min-h-[32px]"
                    >
                      <Send className="w-3 h-3 shrink-0" />
                      <span>Envoyer au Chat</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
