import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { soundEffects } from '../../lib/audio';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  itemType?: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message = 'Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cet élément ?',
  itemType,
  itemName,
  onConfirm,
  onCancel,
  confirmLabel = 'Supprimer définitivement',
  cancelLabel = 'Annuler',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl border border-rose-200/80 max-w-md w-full p-6 shadow-2xl relative text-left"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => {
              soundEffects.playNoteClick();
              onCancel();
            }}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif-romantic text-xl font-bold text-stone-900 leading-tight">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                {message}
              </p>
              {itemName && (
                <div className="mt-2.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 truncate max-w-xs">
                  « {itemName} »
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                soundEffects.playNoteClick();
                onCancel();
              }}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs sm:text-sm font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playTrashDelete();
                onConfirm();
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmLabel}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
