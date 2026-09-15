// Native Web Speech API utility for pronouncing English words and sentences
// Specially tuned with slow rate (0.85x) for beginner French speakers

export const speakEnglish = (
  text: string,
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();

    // Clean text of emojis or quotes that might sound weird
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/[«»"“”…]+/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = options?.rate ?? 0.85; // slightly slower for clear beginner listening
    utterance.pitch = options?.pitch ?? 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Prefer high quality English voices if available
    const enVoice = voices.find(
      (v) =>
        (v.lang === 'en-US' || v.lang === 'en-GB') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Arthur'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (enVoice) {
      utterance.voice = enVoice;
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
      utterance.onerror = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis unavailable or blocked:', e);
  }
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
};
