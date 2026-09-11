import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Heart, Delete, HelpCircle, ShieldCheck } from 'lucide-react';
import { CoupleProfile } from '../../types';
import { soundEffects } from '../../lib/audio';
import { PartnerAvatar } from '../PartnerAvatar';

interface PinLockModalProps {
  correctPin: string;
  profile: CoupleProfile;
  onUnlock: () => void;
  onForgotPin?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  correctPin,
  profile,
  onUnlock,
  onForgotPin,
}) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [showRecoveryHint, setShowRecoveryHint] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoveryError, setRecoveryError] = useState(false);

  const handleKeyPress = (num: number) => {
    if (pin.length >= 4) return;
    soundEffects.playKeyTone(num);
    const nextPin = pin + num;
    setPin(nextPin);

    if (nextPin.length === 4) {
      if (nextPin === correctPin) {
        soundEffects.playSuccessSparkle();
        onUnlock();
      } else {
        soundEffects.playErrorTone();
        setIsError(true);
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 550);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      soundEffects.playKeyTone(0);
      setPin(pin.slice(0, -1));
    }
  };

  const handleClear = () => {
    soundEffects.playKeyTone(0);
    setPin('');
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Verify anniversary date
    if (recoveryInput.trim() === profile.anniversaryDate) {
      soundEffects.playSuccessSparkle();
      alert(`Code PIN récupéré avec succès : votre code PIN est ${correctPin}`);
      onUnlock();
    } else {
      soundEffects.playErrorTone();
      setRecoveryError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#1C1917]/95 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-stone-900/90 border border-stone-800 rounded-3xl p-5 sm:p-8 text-center text-white shadow-2xl relative max-h-[95vh] overflow-y-auto"
      >
        {/* Couple Avatars */}
        <div className="flex items-center justify-center -space-x-3 mb-4">
          <PartnerAvatar
            name={profile.partner1.name}
            avatar={profile.partner1.avatar}
            partnerId="p1"
            size="lg"
            className="border-2 border-stone-800 shadow-md ring-2 ring-rose-500/80"
          />
          <PartnerAvatar
            name={profile.partner2.name}
            avatar={profile.partner2.avatar}
            partnerId="p2"
            size="lg"
            className="border-2 border-stone-800 shadow-md ring-2 ring-sky-500/80"
          />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-rose-400 mb-1">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Espace Privé & Intime</span>
        </div>

        <h2 className="font-serif-romantic text-xl sm:text-2xl font-bold text-white mb-1">
          {profile.relationshipTitle}
        </h2>
        <p className="text-xs text-stone-400 mb-6">
          Entrez votre code secret à 4 chiffres pour accéder à votre nid d'amour.
        </p>

        {/* PIN dots */}
        <div
          className={`flex items-center justify-center gap-4 mb-8 transition-transform ${
            isError ? 'animate-bounce text-red-400' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: pin.length > index ? 1.25 : 1,
                borderColor: isError ? '#F87171' : pin.length > index ? '#FB7185' : '#57534E',
              }}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > index
                  ? isError
                    ? 'bg-red-500'
                    : 'bg-rose-500 shadow-sm shadow-rose-500/50'
                  : 'bg-stone-800'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-stone-800/80 hover:bg-stone-700/80 active:bg-rose-500 active:scale-95 text-lg font-bold text-stone-100 transition-all shadow-xs flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-stone-800/40 hover:bg-stone-800 active:scale-95 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-all flex items-center justify-center cursor-pointer"
          >
            Effacer
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress(0)}
            className="h-14 rounded-2xl bg-stone-800/80 hover:bg-stone-700/80 active:bg-rose-500 active:scale-95 text-lg font-bold text-stone-100 transition-all shadow-xs flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-stone-800/40 hover:bg-stone-800 active:scale-95 text-stone-400 hover:text-stone-200 transition-all flex items-center justify-center cursor-pointer"
            title="Effacer le dernier chiffre"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Recovery hint */}
        {!showRecoveryHint ? (
          <button
            type="button"
            onClick={() => setShowRecoveryHint(true)}
            className="text-xs text-stone-400 hover:text-rose-400 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Code PIN oublié ?</span>
          </button>
        ) : (
          <form onSubmit={handleRecoverySubmit} className="mt-4 p-3.5 bg-stone-800/80 rounded-2xl border border-stone-700 text-left space-y-2">
            <p className="text-xs text-stone-300 font-medium">
              Question secrète : quelle est la date de votre anniversaire de couple ?
            </p>
            <input
              type="date"
              value={recoveryInput}
              onChange={(e) => {
                setRecoveryInput(e.target.value);
                setRecoveryError(false);
              }}
              className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white"
              required
            />
            {recoveryError && (
              <p className="text-[11px] text-red-400">Date incorrecte, veuillez réessayer.</p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRecoveryHint(false)}
                className="text-[11px] text-stone-400 hover:text-stone-200"
              >
                Fermer
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold"
              >
                Déverrouiller
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
