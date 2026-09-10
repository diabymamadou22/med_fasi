import confetti from 'canvas-confetti';

export function triggerHeartConfetti() {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#F43F5E', '#FB7185', '#FDA4AF', '#FFE4E6', '#FBBF24'],
    shapes: ['circle'],
    ticks: 200,
    gravity: 0.8,
    scalar: 1.2,
  });
}

export function triggerCelebrationConfetti() {
  const end = Date.now() + 1.2 * 1000;
  const colors = ['#F43F5E', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
