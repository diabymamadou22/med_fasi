// Audio & Sound Effects: Clean and silent for optimal mobile performance and lightweight execution

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

class RomanticSoundEffects {
  playHeartPulse() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }
  playSuccessSparkle() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.2);
      });
    } catch {}
  }
  playWheelTick() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }
  playDiceRoll() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Son doux & feutré de dé en bois roulant sur tapis de velours
      const rollMoments = [0, 0.08, 0.17, 0.27, 0.38, 0.50, 0.63, 0.77, 0.90];
      rollMoments.forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Onde sinusoïdale pure très douce filtrée passe-bas
        osc.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime + t);

        // Fréquences douces et graves (marimba feutré / bois doux)
        const baseFreq = 220 + ((i * 18) % 60);
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, ctx.currentTime + t + 0.045);

        // Volume très doux, atténué et apaisant
        const volume = Math.max(0.015, 0.035 - i * 0.002);
        gain.gain.setValueAtTime(volume, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + t + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.045);
      });
    } catch {}
  }

  playDiceSettle() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Son doux & feutré d'arrêt du dé (petit « toc » boisé velouté et très doux)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);

      osc.frequency.setValueAtTime(190, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  // Effet sonore dynamique pour la capture d'un pion adverse
  playPawnCapture() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // 1. Percussive punch impact (whack!)
      const punchOsc = ctx.createOscillator();
      const punchGain = ctx.createGain();
      punchOsc.type = 'triangle';
      punchOsc.frequency.setValueAtTime(260, ctx.currentTime);
      punchOsc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
      punchGain.gain.setValueAtTime(0.22, ctx.currentTime);
      punchGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      punchOsc.connect(punchGain);
      punchGain.connect(ctx.destination);
      punchOsc.start(ctx.currentTime);
      punchOsc.stop(ctx.currentTime + 0.12);

      // 2. High-energy comic swoosh / zap as the captured pawn is ejected
      const zapOsc = ctx.createOscillator();
      const zapGain = ctx.createGain();
      zapOsc.type = 'sawtooth';
      zapOsc.frequency.setValueAtTime(980, ctx.currentTime + 0.04);
      zapOsc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.28);
      zapGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.04);
      zapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      zapOsc.connect(zapGain);
      zapGain.connect(ctx.destination);
      zapOsc.start(ctx.currentTime + 0.04);
      zapOsc.stop(ctx.currentTime + 0.28);

      // 3. Yard return landing bounce (thud!)
      const bounceOsc = ctx.createOscillator();
      const bounceGain = ctx.createGain();
      bounceOsc.type = 'sine';
      bounceOsc.frequency.setValueAtTime(320, ctx.currentTime + 0.26);
      bounceOsc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.38);
      bounceGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.26);
      bounceGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
      bounceOsc.connect(bounceGain);
      bounceGain.connect(ctx.destination);
      bounceOsc.start(ctx.currentTime + 0.26);
      bounceOsc.stop(ctx.currentTime + 0.38);
    } catch {}
  }

  // Effet sonore triomphant pour l'arrivée à la maison (Case 56)
  playPawnHome() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Warm celebratory base chord (C3 + G3)
      [130.81, 196.0].forEach((freq) => {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(freq, ctx.currentTime);
        bassGain.gain.setValueAtTime(0.1, ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(ctx.currentTime);
        bassOsc.stop(ctx.currentTime + 0.6);
      });

      // Joyful ascending golden chime arpeggio: C5 -> E5 -> G5 -> C6 -> E6
      const fanfareNotes = [
        { freq: 523.25, time: 0 },
        { freq: 659.25, time: 0.08 },
        { freq: 783.99, time: 0.16 },
        { freq: 1046.5, time: 0.25 },
        { freq: 1318.51, time: 0.35 },
      ];

      fanfareNotes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        gain.gain.setValueAtTime(0.14, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.5);

        // Harmonic shimmer overtone
        const harm = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harm.type = 'triangle';
        harm.frequency.setValueAtTime(freq * 2, ctx.currentTime + time);
        harmGain.gain.setValueAtTime(0.04, ctx.currentTime + time);
        harmGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.3);
        harm.connect(harmGain);
        harmGain.connect(ctx.destination);
        harm.start(ctx.currentTime + time);
        harm.stop(ctx.currentTime + time + 0.3);
      });
    } catch {}
  }

  // Son agréable et scintillant lorsqu'un pion se pose sur une étoile (case refuge sécurisée ★)
  playStarLanding() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Fond sonore doux et enveloppant (note chaude fondamentale E4)
      const baseOsc = ctx.createOscillator();
      const baseGain = ctx.createGain();
      baseOsc.type = 'sine';
      baseOsc.frequency.setValueAtTime(329.63, ctx.currentTime);
      baseGain.gain.setValueAtTime(0.06, ctx.currentTime);
      baseGain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.55);
      baseOsc.connect(baseGain);
      baseGain.connect(ctx.destination);
      baseOsc.start(ctx.currentTime);
      baseOsc.stop(ctx.currentTime + 0.55);

      // Doux carillon céleste scintillant : notes cristallines très mélodieuses et agréables
      const starNotes = [
        { freq: 659.25, time: 0 }, // E5
        { freq: 987.77, time: 0.07 }, // B5
        { freq: 1318.51, time: 0.15 }, // E6
        { freq: 1661.22, time: 0.24 }, // G#6
      ];

      starNotes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + time + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.45);

        // Petit éclat d'étoile doré
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.type = 'triangle';
        sparkle.frequency.setValueAtTime(freq * 1.5, ctx.currentTime + time);
        sparkleGain.gain.setValueAtTime(0.02, ctx.currentTime + time);
        sparkleGain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + time + 0.22);
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        sparkle.start(ctx.currentTime + time);
        sparkle.stop(ctx.currentTime + time + 0.22);
      });
    } catch {}
  }
  playVictoryChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const chords = [
        { freq: 440, time: 0 },
        { freq: 554.37, time: 0.1 },
        { freq: 659.25, time: 0.2 },
        { freq: 880, time: 0.3 },
      ];
      chords.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.4);
      });
    } catch {}
  }
  playEnvelopeOpen() {}
  playKeyTone(_num: number) {}
  playErrorTone() {}
  playNoteClick() {}
  playSoftTap() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }
  playPawnStep(stepIndex = 1) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      // Pleasant marimba woodblock pitch rising with step count
      const baseFreq = 420 + Math.min(stepIndex, 6) * 45;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {}
  }
  playCountdownTick() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }
  playCameraShutter() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // First click
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1200, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.04);

      // Mechanical release click
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, ctx.currentTime + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.11);
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.06);
      osc2.stop(ctx.currentTime + 0.11);
    } catch {}
  }
  playTrashDelete() {}

  // WhatsApp-style sound effects
  playMessageSent() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1150, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {}
  }

  playMessageReceived() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }
}

export const soundEffects = new RomanticSoundEffects();

// Silent ambient engine stub maintaining compatibility without background audio
class RomanticAmbientEngine {
  setVolume(_vol: number) {}
  start(_trackId: string, _customAudioUrl?: string) {}
  stop() {}
  getIsPlaying() {
    return false;
  }
}

export const romanticAmbientEngine = new RomanticAmbientEngine();
