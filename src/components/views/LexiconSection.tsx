import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  Sparkles,
  Heart,
  Search,
  Plus,
  Send,
  Trash2,
  Edit3,
  Lightbulb,
  Check,
  RotateCcw,
  Languages,
  Layers,
  HelpCircle,
  X,
  Bookmark,
  Coffee,
  Plane,
  Utensils,
  Smile,
  Globe,
  Award,
} from 'lucide-react';
import {
  EnglishLexiconItem,
  CoupleProfile,
  PartnerId,
  ChatMessage,
} from '../../types';
import { speakEnglish, stopSpeech } from '../../lib/englishSpeech';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

interface LexiconSectionProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  lexicon?: EnglishLexiconItem[];
  words?: EnglishLexiconItem[];
  speechRate?: number;
  onSaveWord: (word: EnglishLexiconItem) => void;
  onDeleteWord: (wordId: string) => void;
  onToggleFavorite: (wordId: string, isFavorite: boolean) => void;
  onToggleMastered: (wordId: string, isMastered: boolean) => void;
  onSendChatMessage?: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  onAddXp?: (amount: number) => void;
  initialPrefillWord?: Partial<EnglishLexiconItem> | null;
  onClearPrefill?: () => void;
}

type LexiconSubView = 'list' | 'flashcards' | 'quiz';

const CATEGORIES: {
  key: EnglishLexiconItem['category'] | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { key: 'all', label: 'Tous les mots', icon: Layers, color: 'text-stone-700 bg-stone-100' },
  { key: 'romantique', label: 'Romantique & Doux', icon: Heart, color: 'text-rose-600 bg-rose-50' },
  { key: 'quotidien', label: 'Quotidien & Maison', icon: Coffee, color: 'text-amber-700 bg-amber-50' },
  { key: 'voyage', label: 'Voyage & Aventure', icon: Plane, color: 'text-sky-700 bg-sky-50' },
  { key: 'restaurant', label: 'Resto & Plaisirs', icon: Utensils, color: 'text-orange-700 bg-orange-50' },
  { key: 'humour', label: 'Humour & Délires', icon: Smile, color: 'text-emerald-700 bg-emerald-50' },
  { key: 'autre', label: 'Autres découvertes', icon: Globe, color: 'text-purple-700 bg-purple-50' },
];

export const LexiconSection: React.FC<LexiconSectionProps> = ({
  profile,
  activePartnerId,
  lexicon,
  words,
  speechRate = 0.85,
  onSaveWord,
  onDeleteWord,
  onToggleFavorite,
  onToggleMastered,
  onSendChatMessage,
  onAddXp,
  initialPrefillWord,
  onClearPrefill,
}) => {
  const actualLexicon = words || lexicon || [];
  // Navigation inside Lexicon
  const [subView, setSubView] = useState<LexiconSubView>('list');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'favorites' | 'to_review' | 'mastered'>('all');
  const [authorFilter, setAuthorFilter] = useState<'all' | 'p1' | 'p2'>('all');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<EnglishLexiconItem | null>(null);

  // Form Fields
  const [formEnglish, setFormEnglish] = useState('');
  const [formFrench, setFormFrench] = useState('');
  const [formPhonetic, setFormPhonetic] = useState('');
  const [formDefinition, setFormDefinition] = useState('');
  const [formContextSentence, setFormContextSentence] = useState('');
  const [formContextSentenceFrench, setFormContextSentenceFrench] = useState('');
  const [formPersonalMemory, setFormPersonalMemory] = useState('');
  const [formCategory, setFormCategory] = useState<EnglishLexiconItem['category']>('romantique');

  // Audio Playback Tracking
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);

  // Quiz state
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<string | null>(null);
  const [quizHasAnswered, setQuizHasAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Handle prefilled word trigger from lessons
  useEffect(() => {
    if (initialPrefillWord) {
      setEditingWord(null);
      setFormEnglish(initialPrefillWord.english || '');
      setFormFrench(initialPrefillWord.french || '');
      setFormPhonetic(initialPrefillWord.phonetic || '');
      setFormDefinition(initialPrefillWord.definition || '');
      setFormContextSentence(initialPrefillWord.contextSentence || '');
      setFormContextSentenceFrench(initialPrefillWord.contextSentenceFrench || '');
      setFormPersonalMemory(initialPrefillWord.personalMemory || '');
      setFormCategory(initialPrefillWord.category || 'romantique');
      setIsModalOpen(true);
      if (onClearPrefill) onClearPrefill();
    }
  }, [initialPrefillWord, onClearPrefill]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Play word or phrase pronunciation
  const handlePlayAudio = (text: string, id: string) => {
    setPlayingAudioId(id);
    speakEnglish(text, {
      rate: speechRate,
      onEnd: () => setPlayingAudioId(null),
    });
  };

  // Open modal to add new word
  const handleOpenAddModal = () => {
    setEditingWord(null);
    setFormEnglish('');
    setFormFrench('');
    setFormPhonetic('');
    setFormDefinition('');
    setFormContextSentence('');
    setFormContextSentenceFrench('');
    setFormPersonalMemory('');
    setFormCategory('romantique');
    setIsModalOpen(true);
  };

  // Open modal to edit existing word
  const handleOpenEditModal = (item: EnglishLexiconItem) => {
    setEditingWord(item);
    setFormEnglish(item.english);
    setFormFrench(item.french);
    setFormPhonetic(item.phonetic || '');
    setFormDefinition(item.definition || '');
    setFormContextSentence(item.contextSentence || '');
    setFormContextSentenceFrench(item.contextSentenceFrench || '');
    setFormPersonalMemory(item.personalMemory || '');
    setFormCategory(item.category || 'romantique');
    setIsModalOpen(true);
  };

  // Submit word form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEnglish.trim() || !formFrench.trim()) {
      showToast('⚠️ Le mot en anglais et sa traduction sont obligatoires !');
      return;
    }

    const now = new Date().toISOString();
    const wordToSave: EnglishLexiconItem = {
      id: editingWord ? editingWord.id : `lex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      english: formEnglish.trim(),
      french: formFrench.trim(),
      phonetic: formPhonetic.trim() || undefined,
      definition: formDefinition.trim() || undefined,
      contextSentence: formContextSentence.trim() || undefined,
      contextSentenceFrench: formContextSentenceFrench.trim() || undefined,
      personalMemory: formPersonalMemory.trim() || undefined,
      category: formCategory,
      isFavorite: editingWord ? editingWord.isFavorite : false,
      isMastered: editingWord ? editingWord.isMastered : false,
      addedBy: editingWord ? editingWord.addedBy : activePartnerId,
      createdAt: editingWord ? editingWord.createdAt : now,
      updatedAt: now,
    };

    onSaveWord(wordToSave);
    setIsModalOpen(false);
    soundEffects.playSuccessSparkle();

    if (!editingWord) {
      if (onAddXp) onAddXp(15);
      triggerCelebrationConfetti();
      showToast('🎉 Nouveau mot ajouté à Notre Lexique ! +15 XP');
    } else {
      showToast('✏️ Mot mis à jour avec succès !');
    }
  };

  // Filtered Lexicon Items
  const filteredLexicon = useMemo(() => {
    return actualLexicon.filter((item) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesEnglish = item.english.toLowerCase().includes(q);
        const matchesFrench = item.french.toLowerCase().includes(q);
        const matchesDef = item.definition?.toLowerCase().includes(q) || false;
        const matchesContext = item.contextSentence?.toLowerCase().includes(q) || false;
        const matchesMemory = item.personalMemory?.toLowerCase().includes(q) || false;
        if (!matchesEnglish && !matchesFrench && !matchesDef && !matchesContext && !matchesMemory) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Status
      if (statusFilter === 'favorites' && !item.isFavorite) return false;
      if (statusFilter === 'to_review' && item.isMastered) return false;
      if (statusFilter === 'mastered' && !item.isMastered) return false;

      // 4. Author
      if (authorFilter !== 'all' && item.addedBy !== authorFilter) return false;

      return true;
    });
  }, [actualLexicon, searchQuery, selectedCategory, statusFilter, authorFilter]);

  // Statistics
  const totalCount = actualLexicon.length;
  const masteredCount = actualLexicon.filter((w) => w.isMastered).length;
  const favoriteCount = actualLexicon.filter((w) => w.isFavorite).length;
  const p1Count = actualLexicon.filter((w) => w.addedBy === 'p1').length;
  const p2Count = actualLexicon.filter((w) => w.addedBy === 'p2').length;
  const masteryPercentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  // Send to chat
  const handleSendToChat = (item: EnglishLexiconItem) => {
    if (onSendChatMessage) {
      const activePartnerName = activePartnerId === 'p1' ? profile.partner1.name : profile.partner2.name;
      let text = `📖 Notre Lexique d'Anglais :\n🇬🇧 "${item.english}"\n🇫🇷 ${item.french}`;

      if (item.phonetic) {
        text += `\n🗣️ Prononciation : ${item.phonetic}`;
      }
      if (item.definition) {
        text += `\n💡 Définition : ${item.definition}`;
      }
      if (item.contextSentence) {
        text += `\n✨ Exemple : "${item.contextSentence}"`;
        if (item.contextSentenceFrench) {
          text += ` (${item.contextSentenceFrench})`;
        }
      }
      if (item.personalMemory) {
        text += `\n💭 Notre souvenir : ${item.personalMemory}`;
      }
      text += `\n\nPartagé avec amour par ${activePartnerName} ❤️`;

      onSendChatMessage({
        senderId: activePartnerId,
        content: text,
      });
      soundEffects.playMessageSent();
      triggerHeartConfetti();
      showToast('💌 Partagé dans le Chat de couple !');
    } else {
      navigator.clipboard?.writeText(`${item.english} - ${item.french}`);
      showToast('📋 Copié dans le presse-papier !');
    }
  };

  // Quick Flashcard Navigation
  const currentFlashcard = filteredLexicon[flashcardIndex] || filteredLexicon[0];

  // Quick Quiz Generator based on user words
  const quizQuestions = useMemo(() => {
    if (lexicon.length < 2) return [];
    return lexicon.map((correctItem) => {
      // Pick 3 distractors from lexicon or generic
      const otherWords = lexicon.filter((w) => w.id !== correctItem.id);
      const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random());
      const distractorFrench = shuffledOthers.slice(0, 3).map((w) => w.french);
      const options = [...distractorFrench, correctItem.french].sort(() => 0.5 - Math.random());

      return {
        item: correctItem,
        question: `Que signifie le mot anglais « ${correctItem.english} » ?`,
        options,
        correctAnswer: correctItem.french,
      };
    });
  }, [lexicon]);

  const currentQuiz = quizQuestions[quizQuestionIndex] || quizQuestions[0];

  return (
    <div className="space-y-6" id="notre-lexique-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl border border-stone-700/60 text-xs sm:text-sm font-semibold flex items-center gap-2 max-w-sm text-center"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header & Overview Stats */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                <span>Notre Lexique d'Amour</span>
              </span>
              <span className="text-xs font-semibold text-stone-500">
                {totalCount} mot{totalCount > 1 ? 's' : ''} enregistré{totalCount > 1 ? 's' : ''}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-romantic">
              Le Dictionnaire Intime de notre Duo
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mt-1 leading-relaxed">
              Conservez ici tous les mots et expressions d'anglais que vous apprenez ensemble.
              Associez-y votre propre définition ou une phrase de contexte intime pour les retenir à vie.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
              id="btn-add-lexicon-word"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau mot</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Mots Totaux</p>
              <p className="text-lg font-bold text-stone-900 font-serif-romantic">{totalCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-stone-200/70 flex items-center justify-center text-stone-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Maîtrisés</p>
              <p className="text-lg font-bold text-emerald-900 font-serif-romantic">
                {masteredCount} <span className="text-xs font-normal text-emerald-700 font-sans">({masteryPercentage}%)</span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Favoris Cœur</p>
              <p className="text-lg font-bold text-rose-900 font-serif-romantic">{favoriteCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-200/60 flex items-center justify-center text-rose-700">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Contributions</p>
              <p className="text-xs font-bold text-purple-900">
                {profile.partner1.name} ({p1Count}) • {profile.partner2.name} ({p2Count})
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-200/60 flex items-center justify-center text-purple-800">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector: List / Flashcards / Quiz */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-2xl border border-stone-200/80 max-w-md">
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setSubView('list');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subView === 'list'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-500" />
            <span>Fiches & Définitions</span>
          </button>

          <button
            type="button"
            disabled={lexicon.length === 0}
            onClick={() => {
              soundEffects.playSoftTap();
              setFlashcardIndex(0);
              setIsFlashcardFlipped(false);
              setSubView('flashcards');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
              subView === 'flashcards'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>Mode Flashcard</span>
          </button>

          <button
            type="button"
            disabled={lexicon.length < 2}
            onClick={() => {
              soundEffects.playSoftTap();
              setQuizQuestionIndex(0);
              setQuizSelectedAnswer(null);
              setQuizHasAnswered(false);
              setSubView('quiz');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
              subView === 'quiz'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Quiz du Lexique</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: LIST & INTERACTIVE CARDS */}
      {/* ========================================================================= */}
      {subView === 'list' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par mot anglais, traduction, définition ou phrase contextuelle..."
                className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm outline-hidden focus:border-rose-400 focus:bg-white transition-all text-stone-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={`cat-filter-${cat.key}`}
                    type="button"
                    onClick={() => {
                      soundEffects.playSoftTap();
                      setSelectedCategory(cat.key);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Filters: Status & Author */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-stone-500 text-[11px] mr-1">Statut :</span>
                {(
                  [
                    { key: 'all', label: 'Tous' },
                    { key: 'favorites', label: 'Favoris ❤️' },
                    { key: 'to_review', label: 'À réviser 🔄' },
                    { key: 'mastered', label: 'Maîtrisés ✓' },
                  ] as const
                ).map((st) => (
                  <button
                    key={`status-${st.key}`}
                    type="button"
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      statusFilter === st.key
                        ? 'bg-stone-900 text-white font-bold'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-500 text-[11px] mr-1">Ajouté par :</span>
                <select
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value as any)}
                  className="bg-stone-100 text-stone-800 text-xs font-medium py-1 px-2.5 rounded-lg border border-stone-200 outline-hidden"
                >
                  <option value="all">Les deux</option>
                  <option value="p1">{profile.partner1.name}</option>
                  <option value="p2">{profile.partner2.name}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lexicon Items Grid */}
          {filteredLexicon.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-stone-800 font-serif-romantic">
                {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'Aucun mot ne correspond à votre recherche'
                  : 'Votre Lexique est encore tout neuf !'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'Essayez de réinitialiser vos filtres ou de chercher un autre terme.'
                  : 'Commencez à ajouter vos premiers mots complices en anglais pour enrichir votre vocabulaire de couple.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter notre premier mot</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLexicon.map((item) => {
                const isPlaying = playingAudioId === item.id;
                const author = item.addedBy === 'p1' ? profile.partner1 : profile.partner2;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-3xl p-5 border transition-all flex flex-col justify-between bg-white shadow-xs hover:shadow-md ${
                      item.isMastered
                        ? 'border-emerald-200/90 ring-1 ring-emerald-400/20'
                        : 'border-stone-200/90'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Bar of the Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                              {item.english}
                            </h3>

                            {/* Pronunciation Audio Button */}
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(item.english, item.id)}
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                isPlaying
                                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                                  : 'bg-rose-50 text-rose-600 border-rose-200/80 hover:bg-rose-100'
                              }`}
                              title={`Écouter la prononciation (${speechRate}x)`}
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            {/* Category Badge */}
                            {item.category && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                                {item.category}
                              </span>
                            )}
                          </div>

                          {/* Phonetic guide */}
                          {item.phonetic && (
                            <p className="text-xs font-mono text-rose-600 font-medium">
                              {item.phonetic}
                            </p>
                          )}
                        </div>

                        {/* Favorite Heart & Mastered Badges */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(item.id, !item.isFavorite)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              item.isFavorite
                                ? 'text-rose-500 hover:text-rose-600 bg-rose-50'
                                : 'text-stone-300 hover:text-rose-400 bg-stone-50'
                            }`}
                            title={item.isFavorite ? 'Retirer des favoris' : 'Marquer comme favori'}
                          >
                            <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-500' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = !item.isMastered;
                              onToggleMastered(item.id, newStatus);
                              soundEffects.playSoftTap();
                              if (newStatus) {
                                triggerHeartConfetti();
                                if (onAddXp) onAddXp(10);
                                showToast('✨ Mot maîtrisé ! +10 XP');
                              }
                            }}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              item.isMastered
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-stone-50 text-stone-400 hover:text-stone-700'
                            }`}
                            title={item.isMastered ? 'Maîtrisé ✓' : 'Marquer comme maîtrisé'}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* French Translation */}
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🇫🇷</span>
                          <p className="text-xs sm:text-sm font-bold text-stone-800">
                            {item.french}
                          </p>
                        </div>
                      </div>

                      {/* Definition / Explanation (if present) */}
                      {item.definition && (
                        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            <span>Définition & Nuance</span>
                          </div>
                          <p className="text-xs text-stone-700 leading-relaxed">
                            {item.definition}
                          </p>
                        </div>
                      )}

                      {/* Contextual Personal Sentence (if present) */}
                      {item.contextSentence && (
                        <div className="p-3 rounded-2xl bg-sky-50/50 border border-sky-200/70 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1">
                              <span>✨ Phrase de contexte</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(item.contextSentence!, `${item.id}-sentence`)}
                              className="p-1 rounded-md text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer"
                              title="Écouter la phrase complète"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="text-xs font-semibold text-stone-900 italic leading-snug">
                            "{item.contextSentence}"
                          </p>

                          {item.contextSentenceFrench && (
                            <p className="text-[11px] text-stone-600 border-t border-sky-100/80 pt-1">
                              🇫🇷 {item.contextSentenceFrench}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Personal Memory Note (if present) */}
                      {item.personalMemory && (
                        <div className="text-[11px] text-stone-500 italic flex items-center gap-1.5 px-1">
                          <span>💭</span>
                          <span>Notre note : {item.personalMemory}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                      {/* Author Tag */}
                      <span className="text-[11px] text-stone-400 font-medium">
                        Ajouté par <strong className="text-stone-600">{author.name}</strong>
                      </span>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSendToChat(item)}
                          className="px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Envoyer dans le Chat du couple"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">Dans le Chat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Voulez-vous vraiment retirer « ${item.english} » de votre lexique ?`)) {
                              onDeleteWord(item.id);
                              soundEffects.playTrashDelete();
                              showToast('🗑️ Mot supprimé du lexique');
                            }
                          }}
                          className="p-1.5 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: FLASHCARD REVISION MODE */}
      {/* ========================================================================= */}
      {subView === 'flashcards' && currentFlashcard && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6 max-w-xl mx-auto text-center">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-bold">
              Carte {flashcardIndex + 1} sur {filteredLexicon.length}
            </span>
            <button
              type="button"
              onClick={() => setSubView('list')}
              className="text-rose-600 font-bold hover:underline cursor-pointer"
            >
              Retour à la liste
            </button>
          </div>

          {/* Flip Card Stage */}
          <motion.div
            key={currentFlashcard.id + (isFlashcardFlipped ? '-back' : '-front')}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
            className="min-h-72 p-6 rounded-3xl bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 border-2 border-rose-200/80 shadow-sm flex flex-col justify-between cursor-pointer select-none"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span className="uppercase font-bold tracking-wider">
                {isFlashcardFlipped ? 'Verso (Sens & Contexte)' : 'Recto (Mot en Anglais)'}
              </span>
              <span className="text-rose-500 font-semibold">Toucher pour retourner 🔄</span>
            </div>

            {/* Card Content Body */}
            <div className="py-4 space-y-3">
              {!isFlashcardFlipped ? (
                <>
                  <h3 className="text-3xl sm:text-4xl font-bold text-stone-900 font-serif-romantic">
                    {currentFlashcard.english}
                  </h3>
                  {currentFlashcard.phonetic && (
                    <p className="text-sm font-mono text-rose-500 font-medium">
                      {currentFlashcard.phonetic}
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio(currentFlashcard.english, currentFlashcard.id);
                      }}
                      className="px-4 py-2 rounded-2xl bg-white border border-stone-200 hover:border-rose-400 text-rose-600 text-xs font-bold inline-flex items-center gap-2 shadow-2xs cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Écouter la prononciation</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3 text-left">
                  <div className="p-3 rounded-2xl bg-white border border-stone-200">
                    <p className="text-base font-bold text-stone-900">
                      🇫🇷 {currentFlashcard.french}
                    </p>
                  </div>

                  {currentFlashcard.definition && (
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-stone-700 leading-relaxed">
                      <strong className="block text-amber-900 mb-0.5">💡 Définition :</strong>
                      {currentFlashcard.definition}
                    </div>
                  )}

                  {currentFlashcard.contextSentence && (
                    <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs text-stone-800 leading-relaxed">
                      <strong className="block text-sky-900 mb-0.5">✨ Phrase contextuelle :</strong>
                      "{currentFlashcard.contextSentence}"
                      {currentFlashcard.contextSentenceFrench && (
                        <span className="block text-[11px] text-stone-600 mt-1">
                          🇫🇷 {currentFlashcard.contextSentenceFrench}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Status */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-500">
                {currentFlashcard.isMastered ? '✓ Déjà acquis' : "🔄 En cours d'apprentissage"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newStatus = !currentFlashcard.isMastered;
                  onToggleMastered(currentFlashcard.id, newStatus);
                  if (newStatus) {
                    triggerHeartConfetti();
                    showToast('🎉 Marqué comme acquis !');
                  }
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                  currentFlashcard.isMastered
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                {currentFlashcard.isMastered ? 'Acquis ✓' : 'Marquer acquis'}
              </button>
            </div>
          </motion.div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={flashcardIndex === 0}
              onClick={() => {
                setIsFlashcardFlipped(false);
                setFlashcardIndex((i) => Math.max(0, i - 1));
              }}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
            >
              Précédent
            </button>

            <button
              type="button"
              onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
            >
              Retourner la carte 🔄
            </button>

            <button
              type="button"
              disabled={flashcardIndex === filteredLexicon.length - 1}
              onClick={() => {
                setIsFlashcardFlipped(false);
                setFlashcardIndex((i) => Math.min(filteredLexicon.length - 1, i + 1));
              }}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: CUSTOM QUIZ ON OUR LEXICON */}
      {/* ========================================================================= */}
      {subView === 'quiz' && currentQuiz && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs text-stone-500 pb-3 border-b border-stone-100">
            <span className="font-bold">
              Question {quizQuestionIndex + 1} sur {quizQuestions.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-700 font-bold">Score : {quizScore} pts</span>
              <button
                type="button"
                onClick={() => setSubView('list')}
                className="text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Quitter le quiz
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-tr from-rose-50/70 via-white to-amber-50/50 border border-rose-100 text-center space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">
              Quiz de Notre Lexique
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-romantic">
              {currentQuiz.question}
            </h3>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => handlePlayAudio(currentQuiz.item.english, currentQuiz.item.id)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 text-rose-600 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-rose-50 cursor-pointer shadow-2xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Écouter le mot</span>
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {currentQuiz.options.map((option, idx) => {
              const isSelected = quizSelectedAnswer === option;
              const isCorrect = option === currentQuiz.correctAnswer;

              let btnStyle = 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200';
              if (quizHasAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-xs';
                } else {
                  btnStyle = 'bg-stone-50 opacity-40 text-stone-600 border-stone-200';
                }
              }

              return (
                <button
                  key={`quiz-opt-${idx}`}
                  type="button"
                  disabled={quizHasAnswered}
                  onClick={() => {
                    if (quizHasAnswered) return;
                    setQuizSelectedAnswer(option);
                    setQuizHasAnswered(true);
                    if (option === currentQuiz.correctAnswer) {
                      soundEffects.playSuccessSparkle();
                      triggerHeartConfetti();
                      setQuizScore((s) => s + 10);
                      if (onAddXp) onAddXp(10);
                      showToast('🎉 Bonne réponse ! +10 XP');
                    } else {
                      soundEffects.playErrorTone();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left font-semibold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span>{option}</span>
                  {quizHasAnswered && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 fill-white text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quiz Feedback and Next */}
          {quizHasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3"
            >
              {currentQuiz.item.definition && (
                <p className="text-xs text-stone-700">
                  <strong className="text-stone-900">💡 Rappel :</strong> {currentQuiz.item.definition}
                </p>
              )}
              {currentQuiz.item.contextSentence && (
                <p className="text-xs text-stone-700 italic">
                  <strong className="not-italic text-stone-900">✨ Exemple :</strong> "{currentQuiz.item.contextSentence}"
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (quizQuestionIndex < quizQuestions.length - 1) {
                      setQuizQuestionIndex((i) => i + 1);
                      setQuizSelectedAnswer(null);
                      setQuizHasAnswered(false);
                    } else {
                      triggerCelebrationConfetti();
                      showToast('🏆 Quiz du Lexique terminé ! Bravo à vous deux !');
                      setSubView('list');
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
                >
                  {quizQuestionIndex < quizQuestions.length - 1 ? 'Question suivante →' : 'Terminer le quiz'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT WORD IN LEXICON */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4 my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-900 font-serif-romantic">
                      {editingWord ? 'Modifier le mot du Lexique' : 'Ajouter un mot à Notre Lexique'}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Renseignez une définition ou une phrase de contexte pour ancrer le mot.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Word Form */}
              <form onSubmit={handleSaveForm} className="space-y-3.5">
                {/* 1. English Word & French Translation in Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      🇬🇧 Mot en Anglais <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formEnglish}
                      onChange={(e) => setFormEnglish(e.target.value)}
                      placeholder="Ex: Cozy, Serendipity..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold outline-hidden focus:border-rose-400 focus:bg-white text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      🇫🇷 Traduction Française <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formFrench}
                      onChange={(e) => setFormFrench(e.target.value)}
                      placeholder="Ex: Douillet, chaleureux..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold outline-hidden focus:border-rose-400 focus:bg-white text-stone-900"
                    />
                  </div>
                </div>

                {/* 2. Phonetic Guide & Audio Test */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-800">
                      🗣️ Prononciation phonétique (facultatif)
                    </label>
                    {formEnglish.trim() && (
                      <button
                        type="button"
                        onClick={() => speakEnglish(formEnglish, { rate: speechRate })}
                        className="text-[11px] text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Tester l'audio ({speechRate}x)</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formPhonetic}
                    onChange={(e) => setFormPhonetic(e.target.value)}
                    placeholder="Ex: [ Ko-zi ], [ Sé-rèn-di-pi-ti ]..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono outline-hidden focus:border-rose-400 focus:bg-white text-stone-800"
                  />
                </div>

                {/* 3. Personalized Definition or Explanation */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>Définition ou Explication personnelle</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">Très conseillé pour retenir</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formDefinition}
                    onChange={(e) => setFormDefinition(e.target.value)}
                    placeholder="Ex: Décrit un endroit où l'on se sent merveilleusement bien et au chaud ensemble un dimanche de pluie..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm outline-hidden focus:border-rose-400 focus:bg-white resize-none text-stone-800"
                  />
                </div>

                {/* 4. Contextual Sentence (English + French translation) */}
                <div className="p-3 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-sky-900 mb-1">
                      ✨ Phrase contextuelle personnelle (en Anglais)
                    </label>
                    <input
                      type="text"
                      value={formContextSentence}
                      onChange={(e) => setFormContextSentence(e.target.value)}
                      placeholder="Ex: Let's have a cozy evening together wrapped in blankets."
                      className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs sm:text-sm outline-hidden focus:border-sky-400 text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      🇫🇷 Traduction française de votre phrase
                    </label>
                    <input
                      type="text"
                      value={formContextSentenceFrench}
                      onChange={(e) => setFormContextSentenceFrench(e.target.value)}
                      placeholder="Ex: Passons une soirée douillette emmitouflés dans un plaid."
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs outline-hidden focus:border-stone-400 text-stone-700"
                    />
                  </div>
                </div>

                {/* 5. Personal Couple Memory / Note */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    💭 Notre note ou souvenir intime de couple (facultatif)
                  </label>
                  <input
                    type="text"
                    value={formPersonalMemory}
                    onChange={(e) => setFormPersonalMemory(e.target.value)}
                    placeholder="Ex: Entendu dans notre film préféré à Noël, ou notre rituel du matin."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:border-rose-400 focus:bg-white text-stone-800"
                  />
                </div>

                {/* 6. Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Catégorie du mot :
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { key: 'romantique', label: 'Romantique' },
                        { key: 'quotidien', label: 'Quotidien' },
                        { key: 'voyage', label: 'Voyage' },
                        { key: 'restaurant', label: 'Resto & Miam' },
                        { key: 'humour', label: 'Humour' },
                        { key: 'autre', label: 'Autre' },
                      ] as const
                    ).map((c) => (
                      <button
                        key={`form-cat-${c.key}`}
                        type="button"
                        onClick={() => setFormCategory(c.key)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                          formCategory === c.key
                            ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {editingWord ? 'Enregistrer les modifications' : 'Ajouter au Lexique (+15 XP)'}
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
