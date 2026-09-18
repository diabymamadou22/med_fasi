import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Volume2,
  Vibrate,
  X,
  Sparkles,
  Share2,
  PlusSquare,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../types';
import {
  areNotificationsSupported,
  isPushSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestPushNotification,
  getPushStatus,
} from '../../lib/notificationService';
import { soundEffects } from '../../lib/audio';

interface NotificationAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CoupleProfile;
  activePartnerId: PartnerId;
}

export const NotificationAlertModal: React.FC<NotificationAlertModalProps> = ({
  isOpen,
  onClose,
  profile,
  activePartnerId,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; partnerSubscriptions: { p1: number; p2: number } }>({
    total: 0,
    partnerSubscriptions: { p1: 0, p2: 0 },
  });
  const [showIosGuide, setShowIosGuide] = useState(false);

  const activePartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone);

  const refreshStatus = async () => {
    setPermission(getNotificationPermission());
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch {
        setIsSubscribed(false);
      }
    }
    const pushStats = await getPushStatus(activePartnerId);
    setStats({
      total: pushStats.total,
      partnerSubscriptions: pushStats.partnerSubscriptions,
    });
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
      setTestResult(null);
    }
  }, [isOpen, activePartnerId]);

  if (!isOpen) return null;

  const handleActivate = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await subscribeToPushNotifications(activePartnerId);
      if (res.success) {
        soundEffects.playMessageReceived();
        setTestResult("✅ Alertes activées avec succès ! Vous recevrez désormais vos messages même l'écran éteint.");
        await refreshStatus();
      } else {
        setTestResult(`⚠️ ${res.error || "Impossible d'activer les notifications."}`);
      }
    } catch (err: any) {
      setTestResult(`⚠️ Erreur : ${err?.message || 'Erreur inattendue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await unsubscribeFromPushNotifications();
      await refreshStatus();
      setTestResult("Abonnement push désactivé sur cet appareil.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      soundEffects.playMessageReceived();
      const res = await sendTestPushNotification(activePartnerId, activePartner.name);
      if (res.success) {
        setTestResult("🔔 Alerte de test envoyée ! Regardez la barre de notifications de votre téléphone ou écran.");
      } else {
        setTestResult(`Alerte sonore et vibration jouées. (Push serveur: ${res.message || 'Appareil en attente d\'activation'})`);
      }
    } catch (err: any) {
      setTestResult(`Test local effectué. Erreur push: ${err?.message}`);
    } finally {
      setTesting(false);
    }
  };

  const isFullyActive = permission === 'granted' && isSubscribed;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                {isFullyActive ? (
                  <BellRing className="w-5 h-5 text-amber-200 animate-pulse" />
                ) : (
                  <Bell className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight">
                  Alertes de Messages en Direct
                </h3>
                <p className="text-xs text-rose-100 font-sans">
                  Pour ne manquer aucun mot doux de {otherPartner.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-stone-800">
            {/* Status Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isFullyActive
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : permission === 'denied'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {isFullyActive ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : permission === 'denied' ? (
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  ) : (
                    <Bell className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm sm:text-base">
                      {isFullyActive
                        ? 'Système d’alerte 100% actif'
                        : permission === 'denied'
                        ? 'Notifications bloquées dans votre navigateur'
                        : 'Alertes non activées sur cet appareil'}
                    </h4>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        isFullyActive
                          ? 'bg-emerald-200/80 text-emerald-800'
                          : permission === 'denied'
                          ? 'bg-rose-200/80 text-rose-800'
                          : 'bg-amber-200/80 text-amber-800'
                      }`}
                    >
                      {isFullyActive ? 'Actif' : permission === 'denied' ? 'Bloqué' : 'En attente'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed">
                    {isFullyActive
                      ? `Votre téléphone/ordinateur est connecté. Vous recevrez une alerte avec son et vibration dès que ${otherPartner.name} vous envoie un message, même lorsque l'application ou l'écran est éteint (connexion internet requise).`
                      : permission === 'denied'
                      ? "Vous avez bloqué les notifications. Pour les autoriser, cliquez sur l'icône du cadenas dans la barre d'adresse de votre navigateur et autorisez les notifications."
                      : `Activez le service ci-dessous pour être averti(e) instantanément quand ${otherPartner.name} vous écrit, même si vous n'êtes pas sur l'application.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Test result message */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-900 flex items-center justify-between gap-2"
              >
                <span>{testResult}</span>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-stone-400 hover:text-stone-600 text-xs shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Main Action Buttons */}
            <div className="space-y-2.5">
              {!isFullyActive ? (
                <button
                  onClick={handleActivate}
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base active:scale-[0.99] disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <BellRing className="w-5 h-5 animate-bounce" />
                  )}
                  <span>Activer les alertes de messages en 1 clic</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleTestAlert}
                    disabled={testing}
                    className="py-3 px-4 bg-rose-100/90 hover:bg-rose-200 text-rose-800 font-medium rounded-2xl transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.99] disabled:opacity-60"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{testing ? 'Envoi du test...' : "Tester l'alerte maintenant"}</span>
                  </button>

                  <button
                    onClick={handleDeactivate}
                    disabled={loading}
                    className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium rounded-2xl transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.99] disabled:opacity-60"
                  >
                    <BellOff className="w-4 h-4" />
                    <span>Désactiver sur cet appareil</span>
                  </button>
                </div>
              )}

              {isFullyActive && (
                <button
                  onClick={handleTestAlert}
                  disabled={testing}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-medium rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Tester le son et la vibration (cliquez pour entendre le carillon)</span>
                </button>
              )}
            </div>

            {/* Devices overview */}
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-rose-500" />
                  Appareils connectés au couple
                </span>
                <button
                  onClick={refreshStatus}
                  className="text-stone-400 hover:text-stone-700 flex items-center gap-1 normal-case font-normal"
                >
                  <RefreshCw className="w-3 h-3" />
                  Actualiser
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-stone-100 flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      stats.partnerSubscriptions.p1 > 0 ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{profile.partner1.name}</p>
                    <p className="text-[11px] text-stone-500">
                      {stats.partnerSubscriptions.p1 > 0
                        ? `${stats.partnerSubscriptions.p1} appareil(s) prêt(s)`
                        : 'Non abonné'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-stone-100 flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      stats.partnerSubscriptions.p2 > 0 ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{profile.partner2.name}</p>
                    <p className="text-[11px] text-stone-500">
                      {stats.partnerSubscriptions.p2 > 0
                        ? `${stats.partnerSubscriptions.p2} appareil(s) prêt(s)`
                        : 'Non abonné'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works info */}
            <div className="space-y-2 text-xs text-stone-600 leading-relaxed bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100/60">
              <p className="font-semibold text-rose-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                Répondre aux messages étant hors de l'application :
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-stone-700">
                <li>
                  <strong className="text-stone-900">Bouton « 💌 Répondre » :</strong> Sur les appareils compatibles (Android, ordinateurs), vous pouvez taper directement votre réponse dans le champ de la notification sans ouvrir l'application.
                </li>
                <li>
                  <strong className="text-stone-900">Accès immédiat sur iPhone & tout écran :</strong> En touchant simplement la notification ou le bouton « Ouvrir la discussion », vous êtes téléporté en une seconde directement dans le chat, clavier prêt pour taper.
                </li>
                <li>
                  <strong className="text-stone-900">Raccourci écran d'accueil :</strong> Restez appuyé sur l'icône de l'application NID sur votre écran d'accueil pour sélectionner le raccourci instantané « Chat Intime » ou « Billet Doux ».
                </li>
              </ul>
            </div>

            {/* iPhone / iOS Guide Toggle */}
            {isIos && (
              <div className="border border-sky-200 bg-sky-50/70 rounded-2xl p-3.5 text-xs text-sky-950">
                <button
                  onClick={() => setShowIosGuide(!showIosGuide)}
                  className="w-full flex items-center justify-between font-semibold text-sky-900"
                >
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-sky-600" />
                    Astuce iPhone & iPad (iOS 16.4+)
                  </span>
                  <span className="text-sky-600 underline">
                    {showIosGuide ? 'Masquer' : 'Afficher le guide'}
                  </span>
                </button>

                {showIosGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2.5 pt-2.5 border-t border-sky-200/60 space-y-1.5 text-sky-900"
                  >
                    <p>Pour recevoir les notifications push écran éteint sur iPhone :</p>
                    <ol className="list-decimal list-inside space-y-1 text-sky-950/90">
                      <li>Ouvrez le site dans Safari.</li>
                      <li>
                        Touchez le bouton de <strong>Partage</strong> (icône carré avec une flèche vers le haut).
                      </li>
                      <li>
                        Faites défiler vers le bas et touchez <strong>« Sur l'écran d'accueil »</strong>.
                      </li>
                      <li>Ouvrez l'icône ainsi créée depuis votre écran d'accueil et activez les alertes !</li>
                    </ol>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">NID • Alertes Web Push PWA</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
