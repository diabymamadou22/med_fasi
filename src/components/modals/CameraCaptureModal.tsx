import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Send,
  Timer,
  AlertCircle,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { processPhotoWithoutCropping } from '../../lib/imageUtils';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (dataUrl: string, caption?: string) => void;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  allowCaption?: boolean;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  title = 'Prendre une photo',
  subtitle = 'Capturez cet instant complice',
  submitLabel = 'Valider',
  allowCaption = true,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(
    async (mode: 'user' | 'environment') => {
      stopCamera();
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("La caméra en direct n'est pas supportée dans ce navigateur. Utilisez la capture directe ci-dessous.");
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('Erreur accès caméra:', err);
        let msg = "Impossible d'accéder à la caméra.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = "L'accès à la caméra a été refusé. Veuillez autoriser la caméra dans votre navigateur ou utiliser l'option appareil photo direct.";
        } else if (err.name === 'NotFoundError') {
          msg = 'Aucune caméra détectée sur cet appareil.';
        }
        setCameraError(msg);
      }
    },
    [stopCamera]
  );

  // Initialize camera when opening
  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      setCaption('');
      setCountdown(null);
      startCamera(facingMode);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedPhoto, facingMode, startCamera, stopCamera]);

  // Connect video element to stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Clean exit
  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    setCaption('');
    setCountdown(null);
    onClose();
  };

  // Flip camera (front <-> back)
  const toggleCameraFacing = () => {
    soundEffects.playSoftTap();
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Snap photo from video frame
  const takeSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger flash animation & sound
    setIsFlashing(true);
    soundEffects.playCameraShutter();
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;
    const maxDim = 1280;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if selfie camera
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setCapturedPhoto(rawDataUrl);
    stopCamera();
    soundEffects.playSuccessSparkle();
  };

  // Handle shutter click with optional 3s timer
  const handleShutterClick = () => {
    if (timerSeconds === 0) {
      takeSnapshot();
      return;
    }

    // Run 3s countdown
    soundEffects.playSoftTap();
    let current = 3;
    setCountdown(current);

    const interval = setInterval(() => {
      current -= 1;
      if (current > 0) {
        soundEffects.playSoftTap();
        setCountdown(current);
      } else {
        clearInterval(interval);
        setCountdown(null);
        takeSnapshot();
      }
    }, 1000);
  };

  // Native device camera fallback / direct mobile capture
  const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const optimizedUrl = await processPhotoWithoutCropping(file, 1280, 0.82);
      setCapturedPhoto(optimizedUrl);
      soundEffects.playCameraShutter();
      soundEffects.playSuccessSparkle();
    } catch (err: any) {
      alert(err?.message || "Erreur lors de la capture de l'image.");
    } finally {
      setIsProcessing(false);
      if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
    }
  };

  // Retake photo
  const handleRetake = () => {
    soundEffects.playSoftTap();
    setCapturedPhoto(null);
    setCaption('');
    setCountdown(null);
    startCamera(facingMode);
  };

  // Confirm and send/add photo
  const handleConfirm = () => {
    if (!capturedPhoto) return;
    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
    onPhotoCaptured(capturedPhoto, caption.trim());
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative my-auto flex flex-col text-white"
      >
        {/* Hidden Canvas & Native Fallback Input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraCapture}
          className="hidden"
        />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-900/90 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-white">{title}</h3>
              <p className="text-xs text-stone-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer la caméra"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-black flex items-center justify-center overflow-hidden">
          {/* Shutter White Flash Animation */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150" />
          )}

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-7xl sm:text-8xl font-black text-rose-500 font-mono drop-shadow-2xl"
              >
                {countdown}
              </motion.div>
            </div>
          )}

          {capturedPhoto ? (
            /* PREVIEW OF CAPTURED PHOTO */
            <div className="relative w-full h-full flex items-center justify-center bg-stone-950 p-2">
              <img
                src={capturedPhoto}
                alt="Aperçu de la photo prise"
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Photo capturée</span>
              </div>
            </div>
          ) : cameraError ? (
            /* CAMERA ERROR / RESTRICTION FALLBACK */
            <div className="p-6 text-center max-w-xs space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Ouvrir l'appareil photo du téléphone</span>
              </button>
            </div>
          ) : (
            /* LIVE CAMERA STREAM */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? '-scale-x-100' : ''
                }`}
              />

              {/* Viewfinder Target Framing */}
              <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-rose-400 rounded-tl-sm" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-rose-400 rounded-tr-sm" />
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-rose-400 rounded-bl-sm" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-rose-400 rounded-br-sm" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 space-y-3">
          {capturedPhoto ? (
            /* ACTIONS AFTER CAPTURE */
            <div className="space-y-3">
              {allowCaption && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ajouter un mot doux ou une légende... (optionnel)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800/90 border border-stone-700 text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    maxLength={140}
                  />
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-stone-700"
                >
                  <RotateCcw className="w-4 h-4 text-stone-400" />
                  <span>Reprendre</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitLabel}</span>
                </button>
              </div>
            </div>
          ) : (
            /* CAMERA SHOOTING CONTROLS */
            <div className="flex items-center justify-between px-2">
              {/* Timer toggle */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setTimerSeconds((prev) => (prev === 0 ? 3 : 0));
                }}
                className={`p-2.5 rounded-full transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                  timerSeconds > 0
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
                }`}
                title="Minuteur (3 secondes)"
              >
                <Timer className="w-4 h-4" />
                <span>{timerSeconds > 0 ? '3s' : '0s'}</span>
              </button>

              {/* Big Circular Shutter Button */}
              <button
                type="button"
                onClick={handleShutterClick}
                disabled={Boolean(cameraError) || countdown !== null}
                className="w-16 h-16 rounded-full bg-white text-stone-900 border-4 border-rose-500 hover:scale-105 active:scale-90 transition-transform shadow-xl flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Déclencher la photo"
                aria-label="Prendre la photo"
              >
                <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center shadow-inner">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Flip camera / switch facing mode */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                disabled={Boolean(cameraError)}
                className="p-2.5 rounded-full bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 transition-all cursor-pointer disabled:opacity-40"
                title="Basculer caméra avant / arrière"
                aria-label="Basculer caméra"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Quick link to native phone camera */}
          {!capturedPhoto && !cameraError && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="text-[11px] text-stone-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Utiliser l'appareil photo natif du smartphone</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
