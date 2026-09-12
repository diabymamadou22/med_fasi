// Audio & Sound Effects: Clean and silent for optimal mobile performance and lightweight execution

class RomanticSoundEffects {
  playHeartPulse() {}
  playSuccessSparkle() {}
  playEnvelopeOpen() {}
  playKeyTone(_num: number) {}
  playErrorTone() {}
  playNoteClick() {}
  playSoftTap() {}
  playTrashDelete() {}
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
