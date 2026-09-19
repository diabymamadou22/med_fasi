import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  Volume2,
  RefreshCw,
  Send,
  Heart,
  Laugh,
  CheckCircle2,
  FileText,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';
import { speakEnglish } from '../../../lib/englishSpeech';

interface RomanticMadLibsGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  speechRate: number;
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onAddXp: (amount: number) => void;
}

interface BlankField {
  key: string;
  labelFr: string;
  hintEn: string;
  suggestions: { en: string; fr: string }[];
}

interface MadLibStory {
  id: string;
  titleEn: string;
  titleFr: string;
  category: string;
  icon: string;
  blanks: BlankField[];
  templateEn: (answers: Record<string, string>, p1: string, p2: string) => string;
  templateFr: (answers: Record<string, string>, p1: string, p2: string) => string;
}

const MAD_LIBS_STORIES: MadLibStory[] = [
  {
    id: 'story-1',
    titleEn: 'Our Secret Midnight Trip to London',
    titleFr: 'Notre Escapade Secrète de Minuit à Londres',
    category: 'Aventure Romantique ✈️',
    icon: '🇬🇧',
    blanks: [
      {
        key: 'adj1',
        labelFr: 'Un adjectif romantique ou fou',
        hintEn: 'Adjective (e.g. wild, magical, spicy)',
        suggestions: [
          { en: 'magical', fr: 'magique' },
          { en: 'wild', fr: 'sauvage/fou' },
          { en: 'spicy', fr: 'piquant/épicé' },
          { en: 'breathtaking', fr: 'à couper le souffle' },
        ],
      },
      {
        key: 'place',
        labelFr: 'Un endroit insolite',
        hintEn: 'A place (e.g. rooftop, vintage phone booth)',
        suggestions: [
          { en: 'a vintage red phone booth', fr: 'une cabine téléphonique rouge' },
          { en: 'a secret rooftop', fr: 'un toit secret' },
          { en: 'a cozy pub', fr: 'un pub chaleureux' },
          { en: 'Buckingham Palace garden', fr: 'les jardins du palais' },
        ],
      },
      {
        key: 'food',
        labelFr: 'Une nourriture ou boisson',
        hintEn: 'Food or drink (e.g. hot chocolate, pancakes)',
        suggestions: [
          { en: 'hot chocolate with extra cream', fr: 'chocolat chaud chantilly' },
          { en: 'warm glazed donuts', fr: 'donuts chauds et sucrés' },
          { en: 'sparkling champagne', fr: 'champagne pétillant' },
          { en: 'crispy waffles', fr: 'gaufres croustillantes' },
        ],
      },
      {
        key: 'verbPast',
        labelFr: 'Un verbe au passé d\'action',
        hintEn: 'Verb in past (e.g. danced, whispered, kissed)',
        suggestions: [
          { en: 'danced passionately', fr: 'dansé avec passion' },
          { en: 'whispered love secrets', fr: 'chuchoté des secrets d\'amour' },
          { en: 'kissed under the rain', fr: 's\'embrasser sous la pluie' },
          { en: 'laughed hysterically', fr: 'rigolé comme des fous' },
        ],
      },
      {
        key: 'bodyPart',
        labelFr: 'Une partie du corps',
        hintEn: 'Body part (e.g. lips, hands, shoulders)',
        suggestions: [
          { en: 'soft lips', fr: 'lèvres douces' },
          { en: 'warm hands', fr: 'mains chaudes' },
          { en: 'sparkling eyes', fr: 'yeux scintillants' },
          { en: 'delicate neck', fr: 'cou délicat' },
        ],
      },
      {
        key: 'nickname',
        labelFr: 'Un surnom d\'amour mignon en anglais',
        hintEn: 'Love nickname (e.g. sweetheart, honey bunny)',
        suggestions: [
          { en: 'my sweet honey bunny', fr: 'mon petit lapin en sucre' },
          { en: 'my glorious queen/king', fr: 'ma reine/mon roi sublime' },
          { en: 'my gorgeous angel', fr: 'mon ange magnifique' },
          { en: 'my cute dumpling', fr: 'mon petit ravioli d\'amour' },
        ],
      },
    ],
    templateEn: (a, p1, p2) =>
      `It was a ${a.adj1 || 'magical'} Friday evening when ${p1} suddenly grabbed ${p2}'s hand and whispered: "Pack your bags, we are taking the night train to London!" When they arrived, the rain was pouring gently, so they took shelter inside ${a.place || 'a cozy pub'}. Hungry from the trip, they shared delicious ${a.food || 'hot chocolate'} while staring into each other's eyes. Suddenly, without warning, ${p1} ${a.verbPast || 'kissed'} right on ${p2}'s ${a.bodyPart || 'soft lips'}. The locals cheered, and ${p2} smiled blushing: "I love you forever, ${a.nickname || 'my sweetheart'}!"`,
    templateFr: (a, p1, p2) =>
      `C'était un vendredi soir ${a.adj1 || 'magique'} quand ${p1} a soudainement attrapé la main de ${p2} et lui a chuchoté : "Fais ta valise, on prend le train de nuit pour Londres !" À leur arrivée, une pluie douce tombait, alors ils se sont abrités dans ${a.place || 'un pub chaleureux'}. Affamés par le voyage, ils ont partagé de délicieux ${a.food || 'chocolat chaud'} les yeux dans les yeux. Tout à coup, sans prévenir, ${p1} a ${a.verbPast || 'embrassé'} directement ${p2} sur ses ${a.bodyPart || 'lèvres douces'}. Les passants ont applaudi, et ${p2} a souri en rougissant : "Je t'aime pour toujours, ${a.nickname || 'mon petit cœur'} !"`,
  },
  {
    id: 'story-2',
    titleEn: 'The Breakfast in Bed Disaster & Romance',
    titleFr: 'Petit-Déjeuner au Lit Mouvementé & Romantique',
    category: 'Maison & Fous Rires 🥞',
    icon: '🥐',
    blanks: [
      {
        key: 'adj1',
        labelFr: 'Un adjectif surprenant',
        hintEn: 'Adjective (e.g. gigantic, clumsy, heavenly)',
        suggestions: [
          { en: 'gigantic', fr: 'gigantesque' },
          { en: 'clumsy', fr: 'maladroit(e)' },
          { en: 'heavenly', fr: 'céleste / divin' },
          { en: 'ridiculously romantic', fr: 'ridiculement romantique' },
        ],
      },
      {
        key: 'food',
        labelFr: 'Un plat de petit-déjeuner',
        hintEn: 'Food (e.g. blueberry pancakes, crispy bacon)',
        suggestions: [
          { en: 'blueberry pancakes with maple syrup', fr: 'pancakes myrtilles sirop d\'érable' },
          { en: 'toasted buttery croissants', fr: 'croissants chauds au beurre' },
          { en: 'scrambled eggs with truffle', fr: 'œufs brouillés à la truffe' },
          { en: 'chocolate strawberry crepes', fr: 'crêpes fraise chocolat' },
        ],
      },
      {
        key: 'verbPast',
        labelFr: 'Une action catastrophe au passé',
        hintEn: 'Action in past (e.g. slipped, dropped the tray)',
        suggestions: [
          { en: 'tripped over the bedsheet', fr: 'trébuché sur le drap' },
          { en: 'spilled the coffee on the pillow', fr: 'renversé le café sur l\'oreiller' },
          { en: 'did an acrobatic dive', fr: 'fait un plongeon acrobatique' },
          { en: 'landed directly into a hug', fr: 'atterri direct dans un câlin' },
        ],
      },
      {
        key: 'bodyPart',
        labelFr: 'Une partie du corps à chatouiller',
        hintEn: 'Body part (e.g. nose, feet, belly)',
        suggestions: [
          { en: 'cute little nose', fr: 'mignon petit nez' },
          { en: 'ticklish belly', fr: 'ventre chatouilleux' },
          { en: 'cheeks', fr: 'joues roses' },
          { en: 'forehead', fr: 'front' },
        ],
      },
      {
        key: 'nickname',
        labelFr: 'Un surnom drôle et doux en anglais',
        hintEn: 'Funny nickname (e.g. sugar pie, sleepy bear)',
        suggestions: [
          { en: 'sleepy teddy bear', fr: 'nounours endormi' },
          { en: 'sugar plum', fr: 'mon petit sucre d\'orge' },
          { en: 'darling cutie pie', fr: 'adorable petit chou' },
          { en: 'my little sunshine', fr: 'mon petit rayon de soleil' },
        ],
      },
    ],
    templateEn: (a, p1, p2) =>
      `This morning, ${p1} woke up with a ${a.adj1 || 'ridiculously romantic'} plan: cooking a luxury breakfast in bed for ${p2}. In the kitchen, ${p1} carefully prepared ${a.food || 'blueberry pancakes'}. But while entering the bedroom with the heavy tray, ${p1} ${a.verbPast || 'tripped over the bedsheet'}! Half the butter flew across the room and landed right on ${p2}'s ${a.bodyPart || 'cute little nose'}! Both burst into uncontrollable laughter under the blankets. ${p1} kissed the butter away and whispered: "Good morning, ${a.nickname || 'my sleepy teddy bear'}! You are my forever favorite disaster!"`,
    templateFr: (a, p1, p2) =>
      `Ce matin, ${p1} s'est réveillé(e) avec une idée ${a.adj1 || 'ridiculement romantique'} : préparer un petit-déjeuner de luxe au lit pour ${p2}. En cuisine, ${p1} a concocté de délicieux ${a.food || 'pancakes'}. Mais en entrant dans la chambre avec le plateau, ${p1} a ${a.verbPast || 'trébuché'} ! La moitié du beurre a volé à travers la pièce et a atterri pile sur ${p2} au niveau de son ${a.bodyPart || 'petit nez'} ! Tous les deux ont éclaté d'un fou rire incontrôlable sous la couette. ${p1} a effacé le beurre d'un baiser et chuchoté : "Bonjour ${a.nickname || 'mon nounours endormi'} ! Tu es ma catastrophe préférée pour toujours !"`,
  },
];

export const RomanticMadLibsGame: React.FC<RomanticMadLibsGameProps> = ({
  profile,
  activePartnerId,
  speechRate,
  onSendChatMessage,
  onAddXp,
}) => {
  const p1Name = profile.partner1.name;
  const p2Name = profile.partner2.name;

  const [storyIndex, setStoryIndex] = useState<number>(0);
  const story = MAD_LIBS_STORIES[storyIndex];

  // User input answers
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [showFrench, setShowFrench] = useState<boolean>(false);
  const [activeBlankKey, setActiveBlankKey] = useState<string | null>(story.blanks[0]?.key || null);

  const handleSelectSuggestion = (key: string, enVal: string) => {
    soundEffects.playSoftTap();
    setAnswers((prev) => ({ ...prev, [key]: enVal }));

    // Auto-advance to next blank
    const currentIndex = story.blanks.findIndex((b) => b.key === key);
    if (currentIndex < story.blanks.length - 1) {
      setActiveBlankKey(story.blanks[currentIndex + 1].key);
    }
  };

  const handleRevealStory = () => {
    soundEffects.playVictoryChime();
    triggerCelebrationConfetti();
    triggerHeartConfetti();
    setIsRevealed(true);
    onAddXp(25);
  };

  const handleResetStory = () => {
    soundEffects.playSoftTap();
    setAnswers({});
    setIsRevealed(false);
    setShowFrench(false);
    setActiveBlankKey(story.blanks[0]?.key || null);
  };

  const completedEn = story.templateEn(answers, p1Name, p2Name);
  const completedFr = story.templateFr(answers, p1Name, p2Name);

  const handleShareToChat = () => {
    if (!onSendChatMessage) return;
    soundEffects.playSuccessSparkle();

    const text = `📖 **Notre Histoire Délirante en Anglais !**\n\n✨ *${story.titleEn}*\n\n"${completedEn}"\n\n🇫🇷 *Version française :*\n"${completedFr}"`;

    onSendChatMessage({
      senderId: activePartnerId,
      content: text,
    });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-1.5 font-serif-romantic">
              <span>Romantic Mad Libs</span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                Texte à Trous
              </span>
            </h2>
            <p className="text-[11px] text-stone-500">Remplis les mots en anglais sans voir l'histoire</p>
          </div>
        </div>

        {/* Story switcher */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setStoryIndex((prev) => (prev + 1) % MAD_LIBS_STORIES.length);
            handleResetStory();
          }}
          className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="Changer d'histoire"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Autre histoire</span>
        </button>
      </div>

      {/* Step 1: Inputting Blanks */}
      {!isRevealed ? (
        <div className="bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30 p-5 sm:p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-rose-600 border border-rose-200 shadow-2xs">
              <span>{story.icon}</span>
              <span>{story.titleFr}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif-romantic">
              Choisis ou tape tes mots secrets en anglais 🤫
            </h3>
            <p className="text-xs text-stone-600">
              Chaque mot complétera une aventure surprise sur vous deux !
            </p>
          </div>

          {/* Form fields for blanks */}
          <div className="space-y-3 pt-1">
            {story.blanks.map((blank, bIdx) => {
              const currentValue = answers[blank.key] || '';
              const isActive = activeBlankKey === blank.key;

              return (
                <div
                  key={blank.key}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-white border-rose-400 shadow-sm'
                      : currentValue
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-white/80 border-stone-200'
                  }`}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setActiveBlankKey(blank.key)}
                  >
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center justify-center">
                        {bIdx + 1}
                      </span>
                      <span>{blank.labelFr}</span>
                    </label>

                    {currentValue && (
                      <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md">
                        {currentValue}
                      </span>
                    )}
                  </div>

                  {/* Suggestions Chips & Input Field */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2.5 pt-2 border-t border-rose-100 space-y-2"
                    >
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [blank.key]: e.target.value }))
                        }
                        placeholder={blank.hintEn}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                      />

                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Idées prêtes à l'emploi (clique pour choisir) :
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {blank.suggestions.map((sug) => (
                            <button
                              key={sug.en}
                              type="button"
                              onClick={() => handleSelectSuggestion(blank.key, sug.en)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer text-left ${
                                currentValue === sug.en
                                  ? 'bg-rose-500 text-white border-rose-600 font-bold'
                                  : 'bg-stone-50 hover:bg-rose-50 text-stone-700 border-stone-200'
                              }`}
                            >
                              <strong>{sug.en}</strong>{' '}
                              <span className="text-[10px] opacity-75">({sug.fr})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reveal button */}
          <button
            type="button"
            onClick={handleRevealStory}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Révéler notre Histoire Délirante !</span>
          </button>
        </div>
      ) : (
        /* Step 2: Revealed Story Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-amber-50/80 via-rose-50/50 to-white p-5 sm:p-7 rounded-3xl border border-amber-200 shadow-md space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-600 font-mono">
                {story.category}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-romantic">
                {story.titleEn}
              </h3>
            </div>

            {/* Read aloud in English */}
            <button
              type="button"
              onClick={() => speakEnglish(completedEn, { rate: speechRate })}
              className="p-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Écouter l'histoire en anglais"
            >
              <Volume2 className="w-4 h-4" />
              <span>Écouter</span>
            </button>
          </div>

          {/* Story Body Letter */}
          <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-xs text-xs sm:text-sm text-stone-800 leading-relaxed font-serif-romantic space-y-2">
            <p>{completedEn}</p>
          </div>

          {/* Toggle French Translation */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowFrench(!showFrench)}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {showFrench ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showFrench ? 'Masquer la traduction' : 'Voir la traduction en français'}</span>
            </button>

            <AnimatePresence>
              {showFrench && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-100 text-xs text-stone-700 leading-relaxed italic">
                    {completedFr}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onSendChatMessage && (
              <button
                type="button"
                onClick={handleShareToChat}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer l'histoire sur le Chat</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetStory}
              className="py-3 px-4 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-2xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réécrire une histoire</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
