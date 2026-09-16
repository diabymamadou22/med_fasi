import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Sparkles,
  Volume2,
  CheckCircle2,
  Clock,
  Send,
  BookOpen,
  Calendar,
  Award,
  Flame,
  Plus,
  ChevronRight,
  MessageCircle,
  HelpCircle,
  Lightbulb,
  Check,
  Copy,
  Shuffle,
  Star,
  Users,
  X,
  Compass,
} from 'lucide-react';
import {
  WeeklyLearningChallenge,
  CoupleProfile,
  PartnerId,
  ChatMessage,
  EnglishLexiconItem,
} from '../../types';
import { speakEnglish } from '../../lib/englishSpeech';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import {
  getCurrentIsoWeekKey,
  getActiveOrCurrentWeekChallenge,
} from '../../data/initialWeeklyChallenges';

export interface WeeklyChallengesSectionProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  challenges: WeeklyLearningChallenge[];
  onSelectActiveChallenge: (challengeId: string) => void;
  onSaveChallenge: (challenge: WeeklyLearningChallenge) => void;
  onSaveLexiconWord?: (word: EnglishLexiconItem) => void;
  onSendChatMessage?: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  onOpenChatWithDraft?: (prefilledText: string) => void;
  onAddXp?: (amount: number) => void;
}

export const WeeklyChallengesSection: React.FC<WeeklyChallengesSectionProps> = ({
  profile,
  activePartnerId,
  challenges,
  onSelectActiveChallenge,
  onSaveChallenge,
  onSaveLexiconWord,
  onSendChatMessage,
  onOpenChatWithDraft,
  onAddXp,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'all' | 'word' | 'grammar' | 'expression'
  >('all');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [copiedSentenceIndex, setCopiedSentenceIndex] = useState<number | null>(null);
  const [savedToLexiconSuccess, setSavedToLexiconSuccess] = useState(false);

  // New custom challenge form state
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<'word' | 'grammar' | 'expression'>('grammar');
  const [customTargetEnglish, setCustomTargetEnglish] = useState('');
  const [customTargetFrench, setCustomTargetFrench] = useState('');
  const [customPhonetic, setCustomPhonetic] = useState('');
  const [customGrammarRule, setCustomGrammarRule] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customTips, setCustomTips] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');
  const [customExampleEn, setCustomExampleEn] = useState('');
  const [customExampleFr, setCustomExampleFr] = useState('');

  const currentIsoWeek = getCurrentIsoWeekKey();
  const activeChallenge = getActiveOrCurrentWeekChallenge(challenges);

  const activePartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const otherPartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';

  // Stats
  const totalCompletedChallenges = challenges.filter((c) => c.bothCompleted).length;
  const totalCompletedByAny = challenges.filter(
    (c) => c.partner1Completed || c.partner2Completed
  ).length;
  const totalPointsEarned = challenges.reduce((acc, c) => {
    let pts = 0;
    if (c.partner1Completed) pts += c.pointsReward;
    if (c.partner2Completed) pts += c.pointsReward;
    if (c.bothCompleted) pts += c.duoBonusPoints;
    return acc + pts;
  }, 0);

  // Play audio
  const handlePronounce = (text: string) => {
    soundEffects.playSoftTap();
    speakEnglish(text, { rate: 0.85 });
  };

  // Copy sentence or draft to chat
  const handleUseSentenceInChat = (sentenceEn: string, idx?: number) => {
    soundEffects.playSoftTap();
    if (idx !== undefined) {
      setCopiedSentenceIndex(idx);
      setTimeout(() => setCopiedSentenceIndex(null), 2000);
    }
    if (onOpenChatWithDraft) {
      onOpenChatWithDraft(sentenceEn);
    } else if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        content: sentenceEn,
        mediaType: 'text',
      });
      triggerHeartConfetti();
    }
  };

  // One click save to couple lexicon
  const handleSaveActiveToLexicon = () => {
    if (!onSaveLexiconWord) return;
    soundEffects.playSoftTap();

    const newLexiconItem: EnglishLexiconItem = {
      id: `lex-chal-${activeChallenge.id}-${Date.now()}`,
      english: activeChallenge.targetEnglish,
      french: activeChallenge.targetFrench,
      phonetic: activeChallenge.phonetic,
      definition: activeChallenge.description,
      contextSentence: activeChallenge.exampleSentences[0]?.english || '',
      contextSentenceFrench: activeChallenge.exampleSentences[0]?.french || '',
      personalMemory: `Défi hebdo ${activeChallenge.weekKey} : ${activeChallenge.title}`,
      category:
        activeChallenge.category === 'word'
          ? 'romantique'
          : activeChallenge.category === 'grammar'
          ? 'quotidien'
          : 'romantique',
      isFavorite: true,
      isMastered: false,
      addedBy: activePartnerId,
      createdAt: new Date().toISOString(),
    };

    onSaveLexiconWord(newLexiconItem);
    setSavedToLexiconSuccess(true);
    triggerCelebrationConfetti();
    setTimeout(() => setSavedToLexiconSuccess(false), 3500);
  };

  // Submit custom challenge
  const handleCreateCustomChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTargetEnglish.trim() || !customTargetFrench.trim()) return;

    const keywords = customKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    if (keywords.length === 0) {
      keywords.push(customTargetEnglish.trim().toLowerCase());
    }

    const newChallenge: WeeklyLearningChallenge = {
      id: `custom-chal-${Date.now()}`,
      weekKey: currentIsoWeek,
      weekNumber: parseInt(currentIsoWeek.split('-W')[1] || '1', 10),
      title: customTitle.trim() || `Défi : ${customTargetEnglish}`,
      category: customCategory,
      targetEnglish: customTargetEnglish.trim(),
      targetFrench: customTargetFrench.trim(),
      phonetic: customPhonetic.trim() || undefined,
      grammarRule: customGrammarRule.trim() || undefined,
      description:
        customDescription.trim() ||
        `Utilisez '${customTargetEnglish}' dans vos messages d'amour cette semaine.`,
      tips: customTips.trim() || 'À utiliser spontanément dans une phrase tendre du chat.',
      detectionKeywords: keywords,
      exampleSentences: [
        {
          english: customExampleEn.trim() || `I really want to say: ${customTargetEnglish}!`,
          french: customExampleFr.trim() || `Je veux vraiment dire : ${customTargetFrench} !`,
        },
      ],
      pointsReward: 50,
      duoBonusPoints: 100,
      partner1Completed: false,
      partner2Completed: false,
      bothCompleted: false,
      isActive: true,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    onSaveChallenge(newChallenge);
    onSelectActiveChallenge(newChallenge.id);
    setShowCustomModal(false);
    triggerCelebrationConfetti();
    soundEffects.playSuccessSparkle();

    // Reset form
    setCustomTitle('');
    setCustomTargetEnglish('');
    setCustomTargetFrench('');
    setCustomPhonetic('');
    setCustomGrammarRule('');
    setCustomDescription('');
    setCustomTips('');
    setCustomKeywords('');
    setCustomExampleEn('');
    setCustomExampleFr('');
  };

  // Filtered challenges list for the archive
  const filteredArchive = challenges.filter((c) => {
    if (selectedCategoryFilter === 'all') return true;
    return c.category === selectedCategoryFilter;
  });

  const getCategoryBadge = (cat: 'word' | 'grammar' | 'expression') => {
    switch (cat) {
      case 'word':
        return {
          label: 'Mot Romantique',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'grammar':
        return {
          label: 'Structure Grammaticale',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'expression':
        return {
          label: 'Expression Complice',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-rose-900 via-rose-800 to-stone-900 text-white p-4 sm:p-6 shadow-md border border-rose-700/40">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] sm:text-xs font-semibold text-rose-200 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>MISSION SECRÈTE DE LA SEMAINE 💌</span>
              <span className="text-white/40">•</span>
              <span className="text-amber-200 font-mono">{activeChallenge.weekKey}</span>
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug">
              Votre Mission Complice : Glissez cette phrase dans le chat !
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/80 leading-relaxed">
              Un mot doux ou une tournure complice à placer naturellement dans vos messages pour surprendre votre partenaire et débloquer vos cœurs de couple !
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white/15 self-start md:self-auto shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 font-bold text-base sm:text-lg shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-rose-200 font-medium">Points de Couple Gagnés</div>
              <div className="text-base sm:text-xl font-extrabold text-amber-300 tracking-tight">
                +{totalPointsEarned} <span className="text-[10px] sm:text-xs font-semibold text-white/80">pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini progress tracker */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
          <div className="bg-black/20 rounded-lg p-2 sm:p-2.5">
            <span className="text-rose-200/80 block text-[10px] sm:text-[11px]">Défi actuel</span>
            <span className="font-semibold text-white truncate block text-xs">
              {activeChallenge.targetEnglish}
            </span>
          </div>
          <div className="bg-black/20 rounded-lg p-2 sm:p-2.5">
            <span className="text-rose-200/80 block text-[10px] sm:text-[11px]">Défis duo réussis</span>
            <span className="font-semibold text-amber-300 text-xs">
              {totalCompletedChallenges} semaine(s) 🏆
            </span>
          </div>
          <div className="bg-black/20 rounded-lg p-2 sm:p-2.5">
            <span className="text-rose-200/80 block text-[10px] sm:text-[11px]">Gain par partenaire</span>
            <span className="font-semibold text-rose-200 text-xs">
              +{activeChallenge.pointsReward} pts chacun
            </span>
          </div>
          <div className="bg-black/20 rounded-lg p-2 sm:p-2.5">
            <span className="text-rose-200/80 block text-[10px] sm:text-[11px]">Bonus Duo</span>
            <span className="font-semibold text-emerald-300 text-xs">
              +{activeChallenge.duoBonusPoints} pts en duo
            </span>
          </div>
        </div>
      </div>

      {/* Hero: Active Challenge Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Top bar with category & week */}
        <div className="bg-stone-50/80 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border ${
                getCategoryBadge(activeChallenge.category).bg
              }`}
            >
              {getCategoryBadge(activeChallenge.category).label}
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-stone-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Semaine {activeChallenge.weekNumber} ({activeChallenge.weekKey})
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 transition-colors shadow-2xs min-h-[36px] touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5 text-rose-500" />
              <span>Proposer un défi</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Spotlight Word / Grammar Structure */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-stone-100">
            <div className="space-y-1.5">
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Objectif de la semaine à utiliser dans le chat</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight break-words">
                  {activeChallenge.targetEnglish}
                </h3>
                <button
                  type="button"
                  onClick={() => handlePronounce(activeChallenge.targetEnglish)}
                  title="Écouter la prononciation anglaise"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors shadow-2xs border border-rose-200/80 shrink-0 active:scale-95"
                >
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              {activeChallenge.phonetic && (
                <div className="text-xs font-mono font-medium text-rose-700/80 bg-rose-50/60 inline-block px-2.5 py-0.5 rounded-md">
                  {activeChallenge.phonetic}
                </div>
              )}
              <div className="text-sm sm:text-lg font-medium text-stone-700 pt-1 flex items-center gap-1.5">
                <span className="text-base shrink-0">🇫🇷</span>
                <span className="font-semibold text-stone-900">{activeChallenge.targetFrench}</span>
              </div>
            </div>

            {/* Quick Reward Badge */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-center w-full sm:w-auto sm:min-w-[170px] self-start">
              <div className="text-[11px] sm:text-xs font-semibold text-amber-800 uppercase tracking-wide">
                Récompense
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                +{activeChallenge.pointsReward}{' '}
                <span className="text-xs font-bold text-amber-700">pts/pers.</span>
              </div>
              <div className="text-[11px] font-medium text-amber-700/90 mt-1 border-t border-amber-200/60 pt-1">
                🏆 +{activeChallenge.duoBonusPoints} pts bonus à deux
              </div>
            </div>
          </div>

          {/* Grammar formula & Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {activeChallenge.grammarRule && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-1.5">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>RÈGLE & STRUCTURE SYNTAXIQUE</span>
                </div>
                <p className="text-xs font-mono font-semibold text-amber-950 bg-white/80 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed break-words">
                  {activeChallenge.grammarRule}
                </p>
              </div>
            )}

            <div className="p-3.5 sm:p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
              <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>POURQUOI C'EST TOUCHANT EN COUPLE</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed break-words">
                {activeChallenge.description}
              </p>
              {activeChallenge.tips && (
                <div className="text-[11px] text-rose-700 bg-rose-50/60 px-2 py-1 rounded-md mt-1 font-medium break-words">
                  💡 <span className="font-semibold">Conseil complice :</span> {activeChallenge.tips}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Examples to practice & send in Chat */}
          <div className="space-y-2.5 sm:space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Exemples prêts à être envoyés dans votre conversation</span>
              </div>
              <span className="text-[11px] text-stone-500 italic hidden sm:inline">
                Cliquez pour insérer directement dans le chat
              </span>
            </div>

            <div className="space-y-2.5">
              {activeChallenge.exampleSentences.map((ex, idx) => (
                <div
                  key={idx}
                  className="group p-3 sm:p-3.5 rounded-xl bg-stone-50/80 hover:bg-rose-50/40 border border-stone-200 hover:border-rose-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handlePronounce(ex.english)}
                        title="Écouter la phrase"
                        className="w-7 h-7 rounded-full bg-white text-stone-600 hover:text-rose-600 flex items-center justify-center shrink-0 border border-stone-200 shadow-2xs mt-0.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-rose-950 transition-colors break-words">
                        "{ex.english}"
                      </p>
                    </div>
                    <div className="flex items-start gap-1.5 pl-9 pt-0.5">
                      <span className="text-xs shrink-0">🇫🇷</span>
                      <p className="text-[11px] sm:text-xs text-stone-500 italic break-words">
                        "{ex.french}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto sm:self-auto shrink-0 pl-9 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => handleUseSentenceInChat(ex.english, idx)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors min-h-[38px] touch-manipulation cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {copiedSentenceIndex === idx ? 'Inséré !' : 'Utiliser dans le Chat'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Status of Both Partners */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-50 via-rose-50/30 to-amber-50/30 border border-rose-100 space-y-3.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-600 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                  Progression du Couple pour ce défi
                </h4>
              </div>
              {activeChallenge.bothCompleted ? (
                <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] sm:text-xs flex items-center gap-1 border border-emerald-300">
                  🏆 DUO VALIDÉ (+100 PTS BONUS)
                </span>
              ) : (
                <span className="text-[11px] sm:text-xs text-stone-500 font-medium">
                  {activeChallenge.partner1Completed || activeChallenge.partner2Completed
                    ? '1/2 partenaire a validé le mot'
                    : 'En attente d’utilisation dans le chat'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
              {/* Partner 1 Card */}
              <div
                className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                  activeChallenge.partner1Completed
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center text-xs overflow-hidden border border-rose-300 shadow-2xs shrink-0">
                      {profile.partner1.avatar ? (
                        <img
                          src={profile.partner1.avatar}
                          alt={profile.partner1.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        profile.partner1.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {profile.partner1.name}
                      </div>
                      <div className="text-[11px]">
                        {activeChallenge.partner1Completed ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Défi relevé (+{activeChallenge.pointsReward} pts)
                          </span>
                        ) : (
                          <span className="text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            Pas encore utilisé cette semaine
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {activeChallenge.partner1Snippet && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/60 text-[11px] italic text-emerald-900 break-words">
                    « {activeChallenge.partner1Snippet} »
                  </div>
                )}
              </div>

              {/* Partner 2 Card */}
              <div
                className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                  activeChallenge.partner2Completed
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center text-xs overflow-hidden border border-indigo-300 shadow-2xs shrink-0">
                      {profile.partner2.avatar ? (
                        <img
                          src={profile.partner2.avatar}
                          alt={profile.partner2.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        profile.partner2.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {profile.partner2.name}
                      </div>
                      <div className="text-[11px]">
                        {activeChallenge.partner2Completed ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Défi relevé (+{activeChallenge.pointsReward} pts)
                          </span>
                        ) : (
                          <span className="text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            Pas encore utilisé cette semaine
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {activeChallenge.partner2Snippet && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/60 text-[11px] italic text-emerald-900 break-words">
                    « {activeChallenge.partner2Snippet} »
                  </div>
                )}
              </div>
            </div>

            {/* Bottom action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveActiveToLexicon}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs min-h-[42px] touch-manipulation cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  {savedToLexiconSuccess
                    ? '✓ Ajouté à Notre Lexique !'
                    : 'Ajouter à Notre Lexique de couple'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleUseSentenceInChat(activeChallenge.exampleSentences[0]?.english || activeChallenge.targetEnglish)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-sm transition-all min-h-[42px] touch-manipulation cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Ouvrir le Chat pour relever le défi</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Archive / List of Other Weekly Challenges */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-stone-200 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0" />
              <span>Calendrier & Archives des Défis Hebdomadaires</span>
            </h3>
            <p className="text-xs text-stone-500">
              Changez de défi actif ou explorez les semaines passées et à venir
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs overflow-x-auto scrollbar-none touch-pan-x w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[34px] shrink-0 ${
                selectedCategoryFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tous ({challenges.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('word')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[34px] shrink-0 ${
                selectedCategoryFilter === 'word'
                  ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mots
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('grammar')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[34px] shrink-0 ${
                selectedCategoryFilter === 'grammar'
                  ? 'bg-white text-amber-800 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Grammaire
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('expression')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[34px] shrink-0 ${
                selectedCategoryFilter === 'expression'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Expressions
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 pt-2">
          {filteredArchive.map((chal) => {
            const isCurrentActive = chal.id === activeChallenge.id;
            const badge = getCategoryBadge(chal.category);

            return (
              <div
                key={chal.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isCurrentActive
                    ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-300/40 shadow-xs'
                    : 'bg-white hover:bg-stone-50/70 border-stone-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      Sem. {chal.weekNumber}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-1.5">
                      <span>{chal.targetEnglish}</span>
                    </h4>
                    <p className="text-xs text-stone-600 font-medium">
                      {chal.targetFrench}
                    </p>
                  </div>

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {chal.title} — {chal.description}
                  </p>
                </div>

                {/* Status & selection button */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[11px]">
                    {chal.bothCompleted ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        ✓ Validé à deux 🏆
                      </span>
                    ) : chal.partner1Completed || chal.partner2Completed ? (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        1/2 complété
                      </span>
                    ) : (
                      <span className="text-stone-400">Non commencé</span>
                    )}
                  </div>

                  {isCurrentActive ? (
                    <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-[11px]">
                      Défi actif
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectActiveChallenge(chal.id);
                        soundEffects.playSoftTap();
                      }}
                      className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-rose-100 hover:text-rose-700 transition-colors min-h-[32px] touch-manipulation cursor-pointer"
                    >
                      Activer cette semaine
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Challenge Creation Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-stone-200"
            >
              <div className="p-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-stone-900">
                    Proposer notre propre défi de couple
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomChallenge} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                    Type de Défi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['word', 'grammar', 'expression'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCustomCategory(cat)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          customCategory === cat
                            ? 'bg-rose-50 border-rose-500 text-rose-800'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        {cat === 'word' ? 'Mot' : cat === 'grammar' ? 'Grammaire' : 'Expression'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                      🇬🇧 Mot ou Structure en Anglais *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: breathtaking ou I can't wait to..."
                      value={customTargetEnglish}
                      onChange={(e) => setCustomTargetEnglish(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                      🇫🇷 Traduction en Français *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: à couper le souffle"
                      value={customTargetFrench}
                      onChange={(e) => setCustomTargetFrench(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                      Prononciation phonétique (optionnelle)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: [ BRETH-teï-king ]"
                      value={customPhonetic}
                      onChange={(e) => setCustomPhonetic(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                      Règle de syntaxe ou formule
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Sujet + can't wait to + Verbe"
                      value={customGrammarRule}
                      onChange={(e) => setCustomGrammarRule(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                    🇬🇧 Exemple de phrase anglaise romantique
                  </label>
                  <input
                    type="text"
                    placeholder="ex: You are simply breathtaking tonight, my love."
                    value={customExampleEn}
                    onChange={(e) => setCustomExampleEn(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 mb-2"
                  />
                  <input
                    type="text"
                    placeholder="🇫🇷 Traduction française de la phrase..."
                    value={customExampleFr}
                    onChange={(e) => setCustomExampleFr(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                    Mots-clés de détection dans le chat
                  </label>
                  <input
                    type="text"
                    placeholder="séparés par des virgules (ex: breathtaking, breath taking)"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Dès que l'un de ces mots est écrit dans le chat, le défi est automatiquement validé !
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                  >
                    Lancer ce défi hebdomadaire
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
