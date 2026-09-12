import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Feather, X, Sparkles, Bot, Send, Heart, Trash2 } from 'lucide-react';
import { CoupleProfile, PartnerId, SweetNote } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';

interface WriteNoteModalProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onClose: () => void;
  onSendNote?: (note: Omit<SweetNote, 'id' | 'isRead' | 'isFavorite'>) => void;
  initialNote?: SweetNote | null;
  onUpdateNote?: (note: SweetNote) => void;
  onDeleteNote?: (noteId: string) => void;
}

export const WriteNoteModal: React.FC<WriteNoteModalProps> = ({
  profile,
  activePartnerId,
  onClose,
  onSendNote,
  initialNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const isEditing = Boolean(initialNote);
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const recipientPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const [content, setContent] = useState(initialNote?.content || '');
  const [backgroundStyle, setBackgroundStyle] = useState<SweetNote['backgroundStyle']>(
    initialNote?.backgroundStyle || 'rose'
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [tone, setTone] = useState('Doux & Poétique');

  const prompts = [
    'Ce matin, en te regardant...',
    'Merci d\'être cette personne qui...',
    'J\'ai tellement hâte qu\'on...',
    'Ton sourire me donne...',
  ];

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/gemini/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: recipientPartner.name,
          senderName: currentPartner.name,
          tone,
          occasion: 'Billet doux spontaneous',
          details: 'Rappeler combien tu es précieux(se) et unique pour moi',
        }),
      });
      const data = await res.json();
      if (data.data?.note) {
        setContent(data.data.note);
        triggerHeartConfetti();
      } else {
        // Fallback romantic generator
        const fallbacks = [
          `Juste un petit mot pour illuminer ta journée : penser à toi me donne le sourire à chaque seconde. Merci d'être toi, mon amour.`,
          `Chaque jour passé à tes côtés me confirme qu'on est faits pour rire et voyager ensemble. Hâte de te serrer dans mes bras ce soir !`,
          `Tu as cette façon unique de rendre chaque moment magique. Je t'aime plus que les mots ne peuvent l'écrire.`,
        ];
        setContent(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      }
    } catch (e) {
      setContent(
        `Mon amour, une petite pensée tendre pour te rappeler à quel point tu comptes pour moi. Belle journée !`
      );
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (isEditing && initialNote && onUpdateNote) {
      onUpdateNote({
        ...initialNote,
        content: content.trim(),
        backgroundStyle,
      });
      soundEffects.playHeartPulse();
    } else if (onSendNote) {
      onSendNote({
        senderId: activePartnerId,
        recipientId: recipientPartner.id,
        date: "Aujourd'hui à " + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        content: content.trim(),
        backgroundStyle,
      });
      soundEffects.playHeartPulse();
      triggerHeartConfetti();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-rose-200 max-w-lg w-full p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
            <Feather className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
              {isEditing ? 'Modifier le Billet Doux' : 'Écrire un Billet Doux'}
            </h3>
            <p className="text-xs text-stone-500">
              {isEditing
                ? 'Mettez à jour vos mots secrets'
                : `De ${currentPartner.name} pour ${recipientPartner.name}`}
            </p>
          </div>
        </div>
        {/* AI Assistant Quick Generator */}
        <div className="mb-4 p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-purple-900 font-medium">
            <Bot className="w-4 h-4 text-purple-600" />
            <span>Assistant Poétique Gemini :</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-white px-2 py-0.5 rounded-lg border border-purple-200 text-xs font-bold text-purple-800"
            >
              <option value="Doux & Poétique">Doux & Poétique</option>
              <option value="Drôle & Complice">Drôle & Complice</option>
              <option value="Passionné">Passionné</option>
              <option value="Réconfortant">Réconfortant</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingAI ? 'Inspiration...' : 'M\'inspirer'}</span>
          </button>
        </div>

        {/* Preset Prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 text-[11px]">
          <span className="text-stone-400 font-medium shrink-0">Début :</span>
          {prompts.map((p, pIdx) => (
            <button
              key={`prompt-chip-${pIdx}-${p.slice(0, 10)}`}
              type="button"
              onClick={() => setContent((prev) => (prev ? `${prev} ${p}` : p))}
              className="px-2.5 py-1 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 rounded-full shrink-0 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écris ton mot secret d'amour ici..."
              rows={5}
              className="w-full p-4 bg-[#FFFDF9] border border-rose-200 rounded-2xl font-handwriting text-2xl text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 resize-none leading-relaxed"
              required
            />
          </div>

          {/* Paper style picker */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5">
              Style du papier à lettre :
            </label>
            <div className="flex gap-2">
              {[
                { id: 'rose', label: 'Rose Poudré', bg: 'bg-rose-100 border-rose-300' },
                { id: 'cream', label: 'Crème Vintage', bg: 'bg-[#FFFDF9] border-[#E8DFD5]' },
                { id: 'terracotta', label: 'Terracotta', bg: 'bg-amber-100 border-amber-300' },
                { id: 'lavender', label: 'Lavande', bg: 'bg-purple-100 border-purple-300' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setBackgroundStyle(style.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    style.bg
                  } ${
                    backgroundStyle === style.id
                      ? 'ring-2 ring-rose-500 font-bold'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
            {isEditing && initialNote && onDeleteNote ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteNote(initialNote.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Enregistrer les modifications' : 'Sceller & Envoyer le Billet'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
