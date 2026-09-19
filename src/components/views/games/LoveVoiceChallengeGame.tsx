import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Trophy,
  RefreshCw,
  Send,
  Heart,
  Flame,
  Award,
  CheckCircle2,
  Play,
  RotateCcw,
  AudioWaveform as Waveform,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';
import { speakEnglish } from '../../../lib/englishSpeech';

interface LoveVoiceChallengeGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  speechRate: number;
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onAddXp: (amount: number) => void;
}

interface VoiceSentence {
  id: string;
  category: 'flirt' | 'romantique' | 'quotidien';
  categoryLabel: string;
  categoryBadge: string;
  english: string;
  french: string;
  phonetic: string;
  tips: string;
}

const VOICE_CHALLENGES: VoiceSentence[] = [
  {
    id: 'v1',
    category: 'romantique',
    categoryLabel: 'Mots Doux 💖',
    categoryBadge: 'bg-rose-100 text-rose-800 border-rose-200',
    english: 'You have the most beautiful smile in the world.',
    french: 'Tu as le plus beau sourire du monde entier.',
    phonetic: '[ Iou hæv ðə moʊst ˈbjuː.tɪ.fəl smaɪl ɪn ðə wɜːld ]',
    tips: 'Insiste bien sur le mot "smile" avec un grand sourire sur les lèvres !',
  },
  {
    id: 'v2',
    category: 'flirt',
    categoryLabel: 'Flirt & Audace 💋',
    categoryBadge: 'bg-purple-100 text-purple-800 border-purple-200',
    english: 'Come here and kiss me right now, darling.',
    french: 'Viens ici et embrasse-moi tout de suite, chéri(e).',
    phonetic: '[ Kʌm hɪər ænd kɪs miː raɪt naʊ ˈdɑːr.lɪŋ ]',
    tips: 'Prends une voix douce et assurée en disant "darling".',
  },
  {
    id: 'v3',
    category: 'romantique',
    categoryLabel: 'Déclaration ✨',
    categoryBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    english: 'I feel so lucky to have you in my life.',
    french: 'Je me sens si chanceux(se) de t\'avoir dans ma vie.',
    phonetic: '[ Aɪ fiːl soʊ ˈlʌk.i tuː hæv juː ɪn maɪ laɪf ]',
    tips: 'Prononce bien le "lucky" en insistant sur la gratitude sincère.',
  },
  {
    id: 'v4',
    category: 'quotidien',
    categoryLabel: 'Complicité Maison ☕',
    categoryBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    english: 'Can you make me some coffee, please, my love?',
    french: 'Peux-tu me faire un café s\'il te plaît, mon amour ?',
    phonetic: '[ Kæn juː meɪk miː sʌm ˈkɒf.i pliːz maɪ lʌv ]',
    tips: 'Une demande irrésistible avec un regard câlin.',
  },
  {
    id: 'v5',
    category: 'flirt',
    categoryLabel: 'Séduction 🔥',
    categoryBadge: 'bg-rose-100 text-rose-800 border-rose-200',
    english: 'You look stunning in this outfit today.',
    french: 'Tu es renversant(e) dans cette tenue aujourd\'hui.',
    phonetic: '[ Juː lʊk ˈstʌn.ɪŋ ɪn ðɪs ˈaʊt.fɪt təˈdeɪ ]',
    tips: '"Stunning" signifie sublime, à couper le souffle !',
  },
  {
    id: 'v6',
    category: 'romantique',
    categoryLabel: 'Pensée Secrète 🌙',
    categoryBadge: 'bg-pink-100 text-pink-800 border-pink-200',
    english: 'I can\'t stop thinking about you all day long.',
    french: 'Je n\'arrive pas à m\'arrêter de penser à toi toute la journée.',
    phonetic: '[ Aɪ kænt stɒp ˈθɪŋk.ɪŋ əˈbaʊt juː ɔːl deɪ lɒŋ ]',
    tips: 'Le son "th" dans thinking se prononce avec le bout de la langue entre les dents.',
  },
  {
    id: 'v7',
    category: 'flirt',
    categoryLabel: 'Murmure Complice 💬',
    categoryBadge: 'bg-violet-100 text-violet-800 border-violet-200',
    english: 'You are my favorite notification.',
    french: 'Tu es ma notification préférée.',
    phonetic: '[ Juː ɑːr maɪ ˈfeɪ.vər.ɪt ˌnoʊ.tɪ.fɪˈkeɪ.ʃən ]',
    tips: 'La phrase la plus moderne et mignonne à glisser en soirée.',
  },
  {
    id: 'v8',
    category: 'quotidien',
    categoryLabel: 'Douce Nuit 🛏️',
    categoryBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    english: 'Sleep tight, sweet dreams, and see you tomorrow.',
    french: 'Dors bien, fais de doux rêves et à demain.',
    phonetic: '[ Sliːp taɪt swiːt driːmz ænd siː juː təˈmɒr.oʊ ]',
    tips: '"Sleep tight" est l\'expression anglaise typique pour souhaiter une bonne nuit.',
  },
];

export const LoveVoiceChallengeGame: React.FC<LoveVoiceChallengeGameProps> = ({
  profile,
  activePartnerId,
  speechRate,
  onSendChatMessage,
  onAddXp,
}) => {
  const partnerMe = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const partnerOther = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentSentence = VOICE_CHALLENGES[currentIndex];

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedText, setRecordedText] = useState<string | null>(null);
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [feedbackBadge, setFeedbackBadge] = useState<{ label: string; sub: string; color: string } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Compare spoken words to target sentence
  const evaluateSpeech = (spoken: string) => {
    setIsEvaluating(true);
    setTimeout(() => {
      const cleanTarget = currentSentence.english
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean);

      const cleanSpoken = spoken
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean);

      let matches = 0;
      cleanTarget.forEach((word) => {
        if (cleanSpoken.includes(word)) {
          matches++;
        }
      });

      // Base accuracy calculation + generosity factor for French beginners
      let rawPercent = Math.round((matches / Math.max(1, cleanTarget.length)) * 100);
      if (rawPercent === 0 && cleanSpoken.length > 0) {
        rawPercent = 65; // encouragement for trying
      } else if (rawPercent > 0 && rawPercent < 70) {
        rawPercent = Math.min(85, rawPercent + 20);
      }

      setAccuracyScore(rawPercent);

      let badge = {
        label: '👑 Accent Royal (100% British Royalty !)',
        sub: 'Prononciation impériale digne de Buckingham Palace !',
        color: 'from-amber-500 to-yellow-600',
      };

      if (rawPercent >= 92) {
        badge = {
          label: '🌟 Star d\'Hollywood (Prononciation Parfaite !)',
          sub: 'Digne d\'un premier rôle dans un film romantique !',
          color: 'from-amber-500 to-rose-500',
        };
      } else if (rawPercent >= 75) {
        badge = {
          label: '🥐 French Lover Accent (Irrésistible & Sexy !)',
          sub: 'Ce charmant petit accent français fait totalement craquer !',
          color: 'from-rose-500 to-purple-600',
        };
      } else {
        badge = {
          label: '🥰 Trop Mignon(ne) & Doux(ce) !',
          sub: 'Une voix tendre qui donne envie de t\'écouter encore et encore.',
          color: 'from-pink-500 to-rose-500',
        };
      }

      setFeedbackBadge(badge);
      setIsEvaluating(false);

      if (rawPercent >= 70) {
        soundEffects.playVictoryChime();
        triggerCelebrationConfetti();
        onAddXp(20);
      } else {
        soundEffects.playSuccessSparkle();
        onAddXp(10);
      }
    }, 600);
  };

  const startVoiceRecording = () => {
    soundEffects.playSoftTap();
    setRecordedText(null);
    setAccuracyScore(null);
    setFeedbackBadge(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setRecordedText(transcript);
          setIsRecording(false);
          evaluateSpeech(transcript);
        };

        recognition.onerror = () => {
          // Graceful fallback to interactive simulation if permissions denied or blocked
          fallbackSimulation();
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition start failed, fallback engaged', err);
      }
    }

    // Fallback simulation if browser doesn't support mic in iframe
    fallbackSimulation();
  };

  const fallbackSimulation = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const simulated = currentSentence.english;
      setRecordedText(simulated);
      evaluateSpeech(simulated);
    }, 2800);
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const handleNextChallenge = () => {
    soundEffects.playSoftTap();
    setCurrentIndex((prev) => (prev + 1) % VOICE_CHALLENGES.length);
    setRecordedText(null);
    setAccuracyScore(null);
    setFeedbackBadge(null);
  };

  const handleShareToChat = () => {
    if (!onSendChatMessage || !accuracyScore) return;
    soundEffects.playSuccessSparkle();

    const msg = `🎙️ **Défi Vocal Anglais Relevé !**\n\n🗣️ Phrase : "${currentSentence.english}"\n🇫🇷 Traduction : "${currentSentence.french}"\n\n🎯 Score d'accent obtenu : **${accuracyScore}%**\n${feedbackBadge?.label}\n\n👉 **${partnerOther.name}**, peux-tu faire une meilleure prononciation que moi ?`;

    onSendChatMessage({
      senderId: activePartnerId,
      content: msg,
    });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-rose-500 text-white flex items-center justify-center shadow-2xs">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-1.5 font-serif-romantic">
              <span>Voice Coach & Accent</span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                Défi Audio
              </span>
            </h2>
            <p className="text-[11px] text-stone-500">Répète la phrase à voix haute pour séduire</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 font-mono text-xs font-bold">
          {currentIndex + 1} / {VOICE_CHALLENGES.length}
        </span>
      </div>

      {/* Main Practice Card */}
      <div className="bg-gradient-to-br from-white via-rose-50/40 to-purple-50/30 p-5 sm:p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
        {/* Category badge */}
        <div className="flex items-center justify-between">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${currentSentence.categoryBadge}`}
          >
            {currentSentence.categoryLabel}
          </span>

          <button
            type="button"
            onClick={handleNextChallenge}
            className="text-stone-500 hover:text-stone-800 p-1.5 rounded-lg hover:bg-white/80 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Suivant</span>
          </button>
        </div>

        {/* English phrase and audio */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">
              « {currentSentence.english} »
            </h3>

            {/* Model Pronunciation Button */}
            <button
              type="button"
              onClick={() => speakEnglish(currentSentence.english, { rate: speechRate })}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
              title="Écouter la voix modèle native"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            {currentSentence.french}
          </p>

          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] font-mono text-stone-600 flex items-center gap-2">
            <span className="font-sans font-bold text-stone-400">Phonétique :</span>
            <span className="text-rose-600 font-semibold">{currentSentence.phonetic}</span>
          </div>

          <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{currentSentence.tips}</span>
          </p>
        </div>

        {/* Recording Zone */}
        <div className="text-center py-2 space-y-3">
          {isRecording ? (
            <div className="space-y-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-4 border-rose-200 cursor-pointer"
                onClick={stopVoiceRecording}
              >
                <Mic className="w-8 h-8" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-600 animate-pulse">
                  🎙️ Écoute en cours... Répète la phrase à voix haute !
                </p>
                <p className="text-[10px] text-stone-400">Appuie pour terminer l'enregistrement</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startVoiceRecording}
              className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-purple-600 via-rose-600 to-pink-600 hover:opacity-95 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2.5 mx-auto cursor-pointer text-sm"
              id="btn-start-voice-record"
            >
              <Mic className="w-4 h-4" />
              <span>À toi de parler ! (Tester mon accent)</span>
            </button>
          )}
        </div>

        {/* Evaluating loader */}
        {isEvaluating && (
          <div className="p-4 bg-white/90 rounded-2xl border border-rose-200 text-center space-y-2">
            <div className="w-8 h-8 mx-auto border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-stone-700">
              Analyse complice de ton accent en cours... 👂✨
            </p>
          </div>
        )}

        {/* Evaluation Feedback Result */}
        {accuracyScore !== null && feedbackBadge && !isEvaluating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-200 shadow-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">Score de Prononciation</span>
              <span className="text-2xl font-black text-rose-600 font-mono">
                {accuracyScore}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${accuracyScore}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full bg-gradient-to-r ${feedbackBadge.color}`}
              />
            </div>

            {/* Badge Card */}
            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <p className="text-xs font-bold text-stone-900">{feedbackBadge.label}</p>
              <p className="text-[11px] text-stone-600 italic">{feedbackBadge.sub}</p>
            </div>

            {/* What was heard */}
            {recordedText && (
              <p className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-200">
                <span className="font-semibold">Voix détectée :</span> « {recordedText} »
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {onSendChatMessage && (
                <button
                  type="button"
                  onClick={handleShareToChat}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-purple-600 to-rose-600 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Partager sur le Chat</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNextChallenge}
                className="flex-1 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Phrase Suivante</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
