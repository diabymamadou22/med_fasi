import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, Share, PlusSquare, X, Check, Heart, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { soundEffects } from '../../lib/audio';

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    soundEffects.playSuccessSparkle();
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 overflow-hidden text-stone-800"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App Icon Showcase */}
          <div className="flex flex-col items-center text-center mt-1">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl ring-4 ring-rose-100/80 mb-3 border border-rose-200">
                <img
                  src="/app-icon.png"
                  alt="Icône de l'application NID"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow-xs">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </span>
            </div>

            <h3 className="font-serif-romantic text-xl font-bold text-stone-900 mt-1">
              Installer NID
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-[260px] leading-relaxed">
              Ajoutez l'icône dorée et romantique directement sur l'écran d'accueil de votre téléphone !
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-4 p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100/80 space-y-2 text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Accès en 1 clic sans barre de navigation</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Superbe icône luxueuse sur votre téléphone</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Synchronisation directe et instantanée en couple</span>
            </div>
          </div>

          {/* Installation Action based on platform */}
          <div className="mt-5">
            {installSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center justify-center gap-2 font-medium text-xs">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Application installée avec succès !</span>
              </div>
            ) : isInstalled ? (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 flex items-center justify-center gap-2 font-medium text-xs">
                <Check className="w-4 h-4 text-rose-600" />
                <span>Application déjà installée sur votre écran</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Installer sur mon téléphone</span>
              </button>
            ) : isIOS ? (
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-stone-800 text-xs space-y-2">
                <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>Sur iPhone / iPad (Safari) :</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-stone-600">
                  <span className="font-bold text-rose-600">1.</span>
                  <span>Touchez le bouton <strong>Partager</strong> <Share className="w-3 h-3 inline text-blue-600" /> en bas de l'écran.</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-stone-600">
                  <span className="font-bold text-rose-600">2.</span>
                  <span>Sélectionnez <strong>« Sur l'écran d'accueil »</strong> <PlusSquare className="w-3 h-3 inline text-stone-700" />.</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-stone-600">
                  <span className="font-bold text-rose-600">3.</span>
                  <span>Appuyez sur <strong>Ajouter</strong> en haut à droite !</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 bg-stone-100 rounded-2xl text-stone-600 text-xs text-center">
                  <p className="font-medium text-stone-800">
                    Ouvrez le menu de votre navigateur (les 3 points en haut)
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    et cliquez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
