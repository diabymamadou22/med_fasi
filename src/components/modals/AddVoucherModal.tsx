import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Ticket, Sparkles, Heart, Trash2 } from 'lucide-react';
import { CoupleProfile, PartnerId, LoveVoucher } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti } from '../../lib/confetti';

interface AddVoucherModalProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onClose: () => void;
  onAddVoucher?: (voucher: Omit<LoveVoucher, 'id' | 'isRedeemed'>) => void;
  initialVoucher?: LoveVoucher | null;
  onUpdateVoucher?: (voucher: LoveVoucher) => void;
  onDeleteVoucher?: (voucherId: string) => void;
}

export const AddVoucherModal: React.FC<AddVoucherModalProps> = ({
  profile,
  activePartnerId,
  onClose,
  onAddVoucher,
  initialVoucher,
  onUpdateVoucher,
  onDeleteVoucher,
}) => {
  const isEditing = Boolean(initialVoucher);
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const receiverPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const [title, setTitle] = useState(initialVoucher?.title || '');
  const [description, setDescription] = useState(initialVoucher?.description || '');
  const [icon, setIcon] = useState(initialVoucher?.icon || 'Sparkles');
  const [colorGradient, setColorGradient] = useState(
    initialVoucher?.color || 'from-rose-500 to-pink-600'
  );
  const [customTerms, setCustomTerms] = useState(initialVoucher?.customTerms || '');

  const presetIdeas = [
    { title: 'Bon pour un massage aux huiles (30 min)', desc: 'Valable sans contestation possible, musique douce incluse.' },
    { title: 'Joker Soirée Restaurant Chic', desc: 'L\'autre s\'occupe de réserver et d\'offrir le resto surprise.' },
    { title: 'Bon pour une grasse matinée royale', desc: 'L\'autre gère tout le matin sans bruit avec thé au lit.' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (isEditing && initialVoucher && onUpdateVoucher) {
      onUpdateVoucher({
        ...initialVoucher,
        title: title.trim(),
        description: description.trim(),
        icon,
        color: colorGradient,
        customTerms: customTerms.trim() || undefined,
      });
      soundEffects.playSuccessSparkle();
    } else if (onAddVoucher) {
      onAddVoucher({
        title: title.trim(),
        description: description.trim(),
        icon,
        color: colorGradient,
        giverId: activePartnerId,
        receiverId: receiverPartner.id,
        customTerms: customTerms.trim() || undefined,
      });
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();
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
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
              {isEditing ? 'Modifier le Bon d\'Amour' : 'Créer un Bon d\'Amour'}
            </h3>
            <p className="text-xs text-stone-500">
              {isEditing
                ? 'Mettre à jour ce privilège romantique'
                : `Offert par ${currentPartner.name} à ${receiverPartner.name}`}
            </p>
          </div>
        </div>

        {/* Preset chips */}
        <div className="mb-3">
          <span className="text-[11px] font-bold text-stone-500 block mb-1">Idées rapides :</span>
          <div className="flex flex-col gap-1.5">
            {presetIdeas.map((idea) => (
              <button
                key={idea.title}
                type="button"
                onClick={() => {
                  setTitle(idea.title);
                  setDescription(idea.desc);
                }}
                className="text-left text-xs p-2 rounded-xl bg-stone-50 hover:bg-rose-50 text-stone-700 hover:text-rose-900 border border-stone-200 transition-colors"
              >
                <strong>{idea.title}</strong>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Titre du bon *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bon pour un câlin d'urgence, Joker vaisselle..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Description & Conditions *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Valable quand tu veux, sans poser de question..."
              rows={2}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Couleur du ticket :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'from-rose-500 to-pink-600', label: 'Rose Rubis' },
                { id: 'from-amber-500 to-orange-600', label: 'Ambre' },
                { id: 'from-emerald-500 to-teal-600', label: 'Émeraude' },
                { id: 'from-sky-500 to-indigo-600', label: 'Bleu Ciel' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorGradient(c.id)}
                  className={`py-2 rounded-xl text-[11px] font-bold text-white bg-gradient-to-r ${c.id} transition-all ${
                    colorGradient === c.id
                      ? 'ring-4 ring-stone-900 scale-105 shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
            {isEditing && initialVoucher && onDeleteVoucher ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteVoucher(initialVoucher.id);
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
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Enregistrer les modifications' : 'Offrir ce Bon d\'Amour'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
