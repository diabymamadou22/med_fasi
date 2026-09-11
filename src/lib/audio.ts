// Web Audio API synthesized soft romantic sounds (no external audio files needed)

class RomanticSoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Soft romantic chime when sending/receiving "Tu me manques"
  playHeartPulse() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.35); // G5

      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(329.63, now + 0.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio effect error:', e);
    }
  }

  // Soft sparkle for capsule unlock or date wheel win
  playSuccessSparkle() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Envelope paper sound / gentle pop
  playEnvelopeOpen() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn(e);
    }
  }

  // Soft click / pin keypad tone
  playKeyTone(num: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 440 + num * 40;
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn(e);
    }
  }

  // Error buzz
  playErrorTone() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn(e);
    }
  }

  // Gentle soft click for interactive buttons
  playNoteClick() {
    this.playKeyTone(3);
  }

  playSoftTap() {
    this.playKeyTone(1);
  }

  playTrashDelete() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }
}

export const soundEffects = new RomanticSoundEffects();

// Ambient music generator using Web Audio API synthesis
class RomanticAmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timer: any = null;
  private isPlaying = false;
  private currentTrack: string = 'kora_serenade';
  private volume = 0.4;
  private audioEl: HTMLAudioElement | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
  }

  start(trackId: string, customAudioUrl?: string) {
    this.init();
    this.stop();
    this.isPlaying = true;
    this.currentTrack = trackId;

    if (customAudioUrl && customAudioUrl.trim()) {
      try {
        if (!this.audioEl) {
          this.audioEl = new Audio();
          this.audioEl.loop = true;
        }
        this.audioEl.src = customAudioUrl;
        this.audioEl.volume = this.volume;
        this.audioEl.play().catch((err) => console.warn('Custom audio playback error:', err));
        return;
      } catch (e) {
        console.warn('Fallback to synth ambiance', e);
      }
    }

    if (trackId === 'none') {
      this.isPlaying = false;
      return;
    }

    // Launch periodic ambient note generation
    this.playAmbientLoop();
    this.timer = setInterval(() => {
      if (this.isPlaying) {
        this.playAmbientLoop();
      }
    }, 4500);
  }

  private playAmbientLoop() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (this.currentTrack === 'kora_serenade') {
      // West African Mandé pentatonic scale (Kora / Balafon warm gentle plucks)
      const notes = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99]; // D major pentatonic
      const seqLength = 6;
      for (let i = 0; i < seqLength; i++) {
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const time = now + i * 0.55 + Math.random() * 0.15;
        this.createPluck(freq, time, 0.9, 'triangle');
      }
    } else if (this.currentTrack === 'river_breeze') {
      // Gentle breeze on the Djoliba river (chords + soothing flow)
      const chord = [220, 277.18, 329.63, 415.3]; // A major 7th warm pad
      chord.forEach((freq) => {
        this.createPad(freq, now, 4.2);
      });
    } else if (this.currentTrack === 'starry_night') {
      // Warm piano / bell chimes
      const chords = [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
      ];
      const selectedChord = chords[Math.floor(Math.random() * chords.length)];
      selectedChord.forEach((freq, idx) => {
        this.createPluck(freq, now + idx * 0.4, 2.5, 'sine');
      });
    } else if (this.currentTrack === 'soft_rain') {
      // Ambient warm rain and soft lullaby notes
      this.createNoisePad(now, 4.4);
      const gentleNote = [329.63, 392.0, 440.0][Math.floor(Math.random() * 3)];
      this.createPluck(gentleNote, now + 1.2, 1.8, 'sine');
    }
  }

  private createPluck(freq: number, time: number, duration: number, type: OscillatorType) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.12 * this.volume, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    } catch {
      // Ignored
    }
  }

  private createPad(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.04 * this.volume, time + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    } catch {
      // Ignored
    }
  }

  private createNoisePad(time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.03;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.03 * this.volume, time + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(time);
      noise.stop(time + duration);
    } catch {
      // Ignored
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

export const romanticAmbientEngine = new RomanticAmbientEngine();
