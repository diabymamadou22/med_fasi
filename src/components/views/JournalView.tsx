import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Heart,
  Sparkles,
  Plus,
  Send,
  Calendar,
  Lock,
  Unlock,
  Star,
  Flame,
  Feather,
  Smile,
  Quote,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CoupleProfile, PartnerId, SweetNote, DailyGratitude } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { PartnerAvatar } from '../PartnerAvatar';

interface JournalViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  notes: SweetNote[];
  gratitudes: DailyGratitude[];
  onOpenWriteNoteModal: () => void;
  onMarkNoteAsRead: (noteId: string) => void;
  onToggleFavoriteNote: (noteId: string) => void;
  onReactNote: (noteId: string, emoji: string) => void;
  onAddGratitude: (content: string) => void;
  onLikeGratitude: (gratitudeId: string) => void;
  onEditNote?: (note: SweetNote) => void;
  onDeleteNote?: (noteId: string) => void;
  onDeleteGratitude?: (gratitudeId: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  profile,
  activePartnerId,
  notes,
  gratitudes,
  onOpenWriteNoteModal,
  onMarkNoteAsRead,
  onToggleFavoriteNote,
  onReactNote,
  onAddGratitude,
  onLikeGratitude,
  onEditNote,
  onDeleteNote,
  onDeleteGratitude,
}) => {
  const [selectedNote, setSelectedNote] = useState<SweetNote | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'received' | 'favorites'>('all');
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [envelopeOpenAnim, setEnvelopeOpenAnim] = useState(false);

  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Most recent unread note for the current partner
  const latestUnreadNote = notes.find(
    (n) => n.recipientId === activePartnerId && !n.isRead
  );

  const filteredNotes = notes.filter((n) => {
    if (filterMode === 'received') return n.recipientId === activePartnerId;
    if (filterMode === 'favorites') return n.isFavorite;
    return true;
  });

  const handleOpenEnvelope = (note: SweetNote) => {
    soundEffects.playEnvelopeOpen();
    setEnvelopeOpenAnim(true);
    setTimeout(() => {
      setSelectedNote(note);
      onMarkNoteAsRead(note.id);
      triggerHeartConfetti();
      setEnvelopeOpenAnim(false);
    }, 450);
  };

  const handleCreateGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gratitudeInput.trim()) return;
    onAddGratitude(gratitudeInput.trim());
    setGratitudeInput('');
    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
  };

  const backgroundStyles = {
    cream: 'bg-[#FFFDF9] border-[#F1E8DF] text-stone-800',
    rose: 'bg-rose-50/80 border-rose-200/80 text-rose-950',
    terracotta: 'bg-amber-50/80 border-amber-200/70 text-amber-950',
    lavender: 'bg-purple-50/80 border-purple-200/70 text-purple-950',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-8">
      {/* 1. Daily Sweet Note Spotlight / Envelope */}
      <section className="bg-gradient-to-br from-rose-50/80 via-white to-orange-50/60 rounded-3xl border border-rose-100 p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 mb-2">
              <Mail className="w-3.5 h-3.5" />
              <span>Billet Doux du Jour</span>
            </span>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold text-stone-900">
              Mots d'Amour & Petites Attentions
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Un mot secret laissé par ton partenaire à découvrir chaque matin ou soir.
            </p>
          </div>

          <button
            onClick={onOpenWriteNoteModal}
            className="px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
            id="btn-write-note-main"
          >
            <Feather className="w-4 h-4" />
            <span>Écrire un billet pour {otherPartner.name}</span>
          </button>
        </div>

        {/* Unread Sealed Envelope Banner if there's an unread note */}
        {latestUnreadNote ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-rose-300 p-6 sm:p-8 text-center relative overflow-hidden my-4 shadow-sm">
            <div className="max-w-md mx-auto space-y-3">
              <div className="relative inline-block cursor-pointer" onClick={() => handleOpenEnvelope(latestUnreadNote)}>
                <motion.div
                  animate={{ rotate: [0, -3, 3, -2, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-rose-500 to-pink-400 rounded-3xl mx-auto flex items-center justify-center text-white shadow-lg ring-4 ring-rose-200/70"
                >
                  <Mail className="w-10 h-10" />
                </motion.div>
                <div className="absolute -bottom-2 -right-1 bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full text-[10px] shadow-sm flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Cachet Scellé</span>
                </div>
              </div>

              <div>
                <h3 className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900">
                  {otherPartner.name} t'a écrit un nouveau billet doux !
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Envoyé {latestUnreadNote.date}. Touche l'enveloppe pour briser le cachet de cire.
                </p>
              </div>

              <button
                onClick={() => handleOpenEnvelope(latestUnreadNote)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                id="btn-open-sealed-envelope"
              >
                Briser le sceau & Lire la lettre
              </button>
            </div>
          </div>
        ) : null}

        {/* Read Selected Note Modal / Expand */}
        <AnimatePresence>
          {selectedNote && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="my-4 p-6 sm:p-8 bg-[#FFFDF9] rounded-3xl border border-rose-200 shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-rose-100">
                <div className="flex items-center gap-3">
                  <PartnerAvatar
                    name={
                      selectedNote.senderId === 'p1'
                        ? profile.partner1.name
                        : profile.partner2.name
                    }
                    avatar={
                      selectedNote.senderId === 'p1'
                        ? profile.partner1.avatar
                        : profile.partner2.avatar
                    }
                    partnerId={selectedNote.senderId}
                    size="md"
                    className="border-2 border-rose-300"
                  />
                  <div>
                    <p className="font-semibold text-xs text-rose-950">
                      De{' '}
                      {selectedNote.senderId === 'p1'
                        ? profile.partner1.name
                        : profile.partner2.name}
                    </p>
                    <p className="text-[11px] text-stone-500">{selectedNote.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleFavoriteNote(selectedNote.id)}
                    className={`p-2 rounded-full transition-colors ${
                      selectedNote.isFavorite
                        ? 'text-amber-500 bg-amber-50'
                        : 'text-stone-400 hover:text-amber-500'
                    }`}
                    title="Mettre en favori"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedNote.isFavorite ? 'fill-amber-400' : ''
                      }`}
                    />
                  </button>

                  {onEditNote && (
                    <button
                      type="button"
                      onClick={() => {
                        const noteToEdit = selectedNote;
                        setSelectedNote(null);
                        onEditNote(noteToEdit);
                      }}
                      className="p-2 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Modifier ce mot doux"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  {onDeleteNote && (
                    <button
                      type="button"
                      onClick={() => {
                        const idToDelete = selectedNote.id;
                        setSelectedNote(null);
                        onDeleteNote(idToDelete);
                      }}
                      className="p-2 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Supprimer ce mot doux"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedNote(null)}
                    className="px-3 py-1 text-xs font-semibold bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              {/* Letter Content with Romantic Handwriting */}
              <div className="py-6 px-2 sm:px-6">
                <Quote className="w-8 h-8 text-rose-200 mb-2" />
                <p className="font-handwriting text-2xl sm:text-3xl text-stone-800 leading-relaxed">
                  {selectedNote.content}
                </p>
                <div className="text-right mt-6">
                  <p className="font-serif-romantic italic text-rose-800 text-base">
                    Pour toujours avec toi ❤️
                  </p>
                </div>
              </div>

              {/* Love Reactions on Note */}
              <div className="pt-4 border-t border-rose-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-stone-500 mr-1">
                    Réagir :
                  </span>
                  {['💖', '🥰', '🔥', '🥺', '✨'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReactNote(selectedNote.id, emoji)}
                      className={`px-2 py-1 rounded-full text-base hover:scale-125 transition-transform ${
                        selectedNote.reaction === emoji
                          ? 'bg-rose-100 ring-2 ring-rose-400'
                          : 'bg-white border border-stone-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  {selectedNote.reaction && (
                    <span className="text-xs text-rose-600 font-semibold ml-1">
                      Réaction envoyée !
                    </span>
                  )}
                </div>

                <button
                  onClick={onOpenWriteNoteModal}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                >
                  <Feather className="w-3.5 h-3.5" />
                  <span>Répondre avec un mot doux</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Pills & Archive of Sweet Notes */}
        <div className="mt-6 pt-4 border-t border-rose-100/70">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tous nos billets ({notes.length})
              </button>
              <button
                onClick={() => setFilterMode('received')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'received'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Pour moi ({notes.filter((n) => n.recipientId === activePartnerId).length})
              </button>
              <button
                onClick={() => setFilterMode('favorites')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'favorites'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Coups de cœur ({notes.filter((n) => n.isFavorite).length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredNotes.map((note) => {
              const isSenderMe = note.senderId === activePartnerId;
              const sender =
                note.senderId === 'p1' ? profile.partner1 : profile.partner2;

              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 relative group ${
                    backgroundStyles[note.backgroundStyle] || backgroundStyles.cream
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <PartnerAvatar
                        name={sender.name}
                        avatar={sender.avatar}
                        partnerId={note.senderId}
                        size="xs"
                      />
                      <span className="text-[11px] font-semibold text-stone-700">
                        {isSenderMe ? 'Écrit par toi' : `De ${sender.name}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {note.isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      )}
                      {note.reaction && (
                        <span className="text-xs">{note.reaction}</span>
                      )}
                      {!note.isRead && note.recipientId === activePartnerId && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </div>
                  </div>

                  <p className="font-handwriting text-xl text-stone-800 line-clamp-3 my-1">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-stone-400 mt-3 pt-2 border-t border-stone-200/50">
                    <span>{note.date}</span>
                    <div className="flex items-center gap-1.5">
                      {onEditNote && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditNote(note);
                          }}
                          className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors cursor-pointer"
                          title="Modifier ce mot doux"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteNote && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                          }}
                          className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors cursor-pointer"
                          title="Supprimer ce mot doux"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-rose-600 font-semibold group-hover:underline ml-1">
                        Ouvrir →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Shared Gratitude Journal Section */}
      <section className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Journal de Gratitude Partagé</span>
            </span>
            <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
              Ce que j'adore chez toi aujourd'hui
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Noter chaque jour une petite attention ou qualité pour nourrir l'amour et la complicité.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>Flamme de Gratitude : {gratitudes.length} pensées</span>
          </div>
        </div>

        {/* Input for daily gratitude */}
        <form onSubmit={handleCreateGratitude} className="mb-6">
          <div className="relative">
            <textarea
              value={gratitudeInput}
              onChange={(e) => setGratitudeInput(e.target.value)}
              placeholder={`Écris ce pour quoi tu remercies ${otherPartner.name} aujourd'hui... (Ex: Merci pour ton sourire au réveil, ton soutien pour ma réunion...)`}
              rows={2}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white resize-none pr-24"
              id="input-daily-gratitude"
            />
            <button
              type="submit"
              disabled={!gratitudeInput.trim()}
              className="absolute right-3 bottom-3 px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              id="btn-submit-gratitude"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publier</span>
            </button>
          </div>
        </form>

        {/* Gratitude Timeline items */}
        <div className="space-y-3">
          {gratitudes.map((grat) => {
            const author =
              grat.authorId === 'p1' ? profile.partner1 : profile.partner2;
            const hasLiked = grat.likes.includes(activePartnerId);

            return (
              <div
                key={grat.id}
                className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 hover:bg-rose-50/30 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <PartnerAvatar
                    name={author.name}
                    avatar={author.avatar}
                    partnerId={grat.authorId}
                    size="md"
                    className="mt-0.5 border border-stone-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-stone-800">
                        {author.name}
                      </p>
                      <span className="text-[10px] text-stone-400">• {grat.date}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 mt-1 leading-relaxed">
                      {grat.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onLikeGratitude(grat.id)}
                    className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                      hasLiked
                        ? 'text-rose-600 bg-rose-100/70'
                        : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title="Aimer cette gratitude"
                  >
                    <Heart
                      className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                    <span>{grat.likes.length}</span>
                  </button>

                  {onDeleteGratitude && (
                    <button
                      type="button"
                      onClick={() => onDeleteGratitude(grat.id)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Supprimer cette gratitude"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
