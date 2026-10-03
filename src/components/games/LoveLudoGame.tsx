import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  MessageCircle,
  Dices,
  Flame,
  Settings2,
  Gauge,
} from 'lucide-react';
import { CoupleProfile, PartnerId, LudoToken, LudoGameSession, CoupleSettings, GameAnimationSpeed } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import { subscribeLudoGame, saveLudoGame, recordGameResult } from '../../lib/firestoreService';

// -------------------------------------------------------------
// 15x15 STANDARD LUDO TRACK COORDINATES (0 to 51 = 52 squares)
// Clockwise perimeter starting at Player 1 (Blue) start at [6, 13]
// Matching the authentic Ludo King layout in the reference screenshot
// -------------------------------------------------------------
const TRACK_COORDINATES: [number, number][] = [
  // 1. Bottom arm going UP on the left side (Blue side)
  [6, 13], // 0 - Blue Start (Star)
  [6, 12], // 1
  [6, 11], // 2
  [6, 10], // 3
  [6, 9],  // 4

  // 2. Left arm going LEFT (Bottom row of left arm)
  [5, 8],  // 5
  [4, 8],  // 6
  [3, 8],  // 7
  [2, 8],  // 8 - Safe Star
  [1, 8],  // 9
  [0, 8],  // 10

  // 3. Left arm turn
  [0, 7],  // 11 - Red Arrow [→] Entry
  [0, 6],  // 12

  // 4. Left arm going RIGHT (Red Start area)
  [1, 6],  // 13 - Red Start (Star)
  [2, 6],  // 14
  [3, 6],  // 15
  [4, 6],  // 16
  [5, 6],  // 17

  // 5. Top arm going UP on the left side
  [6, 5],  // 18
  [6, 4],  // 19
  [6, 3],  // 20
  [6, 2],  // 21 - Safe Star
  [6, 1],  // 22
  [6, 0],  // 23

  // 6. Top arm turn
  [7, 0],  // 24 - Green Arrow [↓] Entry
  [8, 0],  // 25

  // 7. Top arm going DOWN on the right side (Green Start area)
  [8, 1],  // 26 - Green Start (Star)
  [8, 2],  // 27
  [8, 3],  // 28
  [8, 4],  // 29
  [8, 5],  // 30

  // 8. Right arm going RIGHT (Top row of right arm)
  [9, 6],  // 31
  [10, 6], // 32
  [11, 6], // 33
  [12, 6], // 34 - Safe Star
  [13, 6], // 35
  [14, 6], // 36

  // 9. Right arm turn
  [14, 7], // 37 - Yellow Arrow [←] Entry
  [14, 8], // 38

  // 10. Right arm going LEFT (Yellow Start area)
  [13, 8], // 39 - Yellow Start (Star)
  [12, 8], // 40
  [11, 8], // 41
  [10, 8], // 42
  [9, 8],  // 43

  // 11. Bottom arm going DOWN on the right side
  [8, 9],  // 44
  [8, 10], // 45
  [8, 11], // 46
  [8, 12], // 47 - Safe Star
  [8, 13], // 48
  [8, 14], // 49

  // 12. Bottom arm turn
  [7, 14], // 50 - Blue Arrow [↑] Entry
  [6, 14], // 51
];

// Safe track indexes where pieces cannot be knocked out
const SAFE_TRACK_INDEXES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// P1 Blue Home Stretch (Col 7, Rows 13 down to 9 leading up into center)
const P1_BLUE_HOME_STRETCH: [number, number][] = [
  [7, 13], // 51
  [7, 12], // 52
  [7, 11], // 53
  [7, 10], // 54
  [7, 9],  // 55
];

// P2 Green Home Stretch (Col 7, Rows 1 up to 5 leading down into center)
const P2_GREEN_HOME_STRETCH: [number, number][] = [
  [7, 1], // 51
  [7, 2], // 52
  [7, 3], // 53
  [7, 4], // 54
  [7, 5], // 55
];

// Yard base coordinates (matching exact center of the 4 circle sockets: 210, 390)
// P1 (Blue - Bottom-Left: Cols 0..5, Rows 9..14)
const P1_YARD_SPOTS: [number, number][] = [
  [1.6, 10.6], // Spot 0: x=210, y=1110
  [3.4, 10.6], // Spot 1: x=390, y=1110
  [1.6, 12.4], // Spot 2: x=210, y=1290
  [3.4, 12.4], // Spot 3: x=390, y=1290
];

// P2 (Green - Top-Right: Cols 9..14, Rows 0..5)
const P2_YARD_SPOTS: [number, number][] = [
  [10.6, 1.6], // Spot 0: x=1110, y=210
  [12.4, 1.6], // Spot 1: x=1290, y=210
  [10.6, 3.4], // Spot 2: x=1110, y=390
  [12.4, 3.4], // Spot 3: x=1290, y=390
];

const LUDO_PLEDGES = [
  'Offrir un massage relaxant de 10 minutes à son partenaire',
  'Préparer le petit-déjeuner au lit le week-end prochain avec un mot doux',
  'Chuchoter 5 raisons d’aimer son partenaire les yeux dans les yeux',
  'Cuisiner le plat ou dessert préféré de l’autre ce soir',
  'Faire 10 doux baisers dans le cou sans s’arrêter',
  'Laisser son partenaire choisir le film ou la série de la soirée',
  'Offrir un joker câlin illimité valable toute la semaine',
];

interface LoveLudoGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSendChatMessage?: (msgData: {
    senderId: PartnerId;
    content: string;
    mediaType?: 'image' | 'audio' | 'video' | 'text';
  }) => void;
  animationSpeed?: GameAnimationSpeed;
  settings?: CoupleSettings;
  onSaveSettings?: (settings: CoupleSettings) => void;
  onOpenSettingsModal?: () => void;
}

export const LoveLudoGame: React.FC<LoveLudoGameProps> = ({
  profile,
  activePartnerId,
  onSendChatMessage,
  animationSpeed = 'normal',
  settings,
  onSaveSettings,
  onOpenSettingsModal,
}) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  // Animation speed: controlled via ProfileModal or local live toggle
  const [localSpeed, setLocalSpeed] = useState<GameAnimationSpeed | null>(null);
  const currentSpeed: GameAnimationSpeed =
    localSpeed || settings?.gameAnimationSpeed || animationSpeed || 'normal';

  const speedPacing = useMemo(() => {
    switch (currentSpeed) {
      case 'slow':
        return {
          label: 'Douce',
          badge: 'Accessible',
          emoji: '🐢',
          stepInterval: 440,
          yardExit: 480,
          aiDelay: 1100,
          transitionCss: '0.28s',
        };
      case 'fast':
        return {
          label: 'Rapide',
          badge: 'Compétitive',
          emoji: '⚡',
          stepInterval: 140,
          yardExit: 180,
          aiDelay: 450,
          transitionCss: '0.10s',
        };
      case 'ultra':
        return {
          label: 'Éclair',
          badge: 'Express',
          emoji: '🚀',
          stepInterval: 65,
          yardExit: 80,
          aiDelay: 220,
          transitionCss: '0.05s',
        };
      case 'normal':
      default:
        return {
          label: 'Standard',
          badge: 'Équilibrée',
          emoji: '⚖️',
          stepInterval: 280,
          yardExit: 320,
          aiDelay: 800,
          transitionCss: '0.18s',
        };
    }
  }, [currentSpeed]);

  // Settings: 4 pieces standard (can toggle to 2)
  const [tokensPerPlayer, setTokensPerPlayer] = useState<2 | 4>(4);
  const [gameMode, setGameMode] = useState<'local' | 'live' | 'ai'>('local');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Core Game State
  const [currentTurn, setCurrentTurn] = useState<PartnerId>('p1');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollingFace, setRollingFace] = useState<number>(1);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [movingTokenId, setMovingTokenId] = useState<string | null>(null);
  const [stepRipple, setStepRipple] = useState<{
    x: number;
    y: number;
    color: string;
    key: number;
  } | null>(null);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [winner, setWinner] = useState<PartnerId | null>(null);
  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [selectedPledge, setSelectedPledge] = useState<string>(LUDO_PLEDGES[0]);
  const [lastEventText, setLastEventText] = useState<string>(
    `À ${p1.name} (Bleu) de lancer le dé !`
  );
  const [sentToChatToast, setSentToChatToast] = useState<boolean>(false);

  // Tokens state
  const [tokensP1, setTokensP1] = useState<LudoToken[]>(() =>
    Array.from({ length: 4 }, (_, idx) => ({
      id: `p1_${idx}`,
      player: 'p1' as PartnerId,
      state: 'yard' as const,
      step: 0,
    }))
  );

  const [tokensP2, setTokensP2] = useState<LudoToken[]>(() =>
    Array.from({ length: 4 }, (_, idx) => ({
      id: `p2_${idx}`,
      player: 'p2' as PartnerId,
      state: 'yard' as const,
      step: 0,
    }))
  );

  // Active subset depending on 2 or 4 tokens mode
  const activeTokensP1 = useMemo(
    () => tokensP1.slice(0, tokensPerPlayer),
    [tokensP1, tokensPerPlayer]
  );
  const activeTokensP2 = useMemo(
    () => tokensP2.slice(0, tokensPerPlayer),
    [tokensP2, tokensPerPlayer]
  );

  // Combine and sort active tokens so the currently moving token always renders on top
  const allActiveTokens = useMemo(() => {
    const p1List = activeTokensP1.map((t, idx) => ({ token: t, index: idx }));
    const p2List = activeTokensP2.map((t, idx) => ({ token: t, index: idx }));
    const combined = [...p1List, ...p2List];
    return combined.sort((a, b) => {
      if (a.token.id === movingTokenId) return 1;
      if (b.token.id === movingTokenId) return -1;
      return 0;
    });
  }, [activeTokensP1, activeTokensP2, movingTokenId]);

  // Real-time broadcast and sync
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isSyncingFromRemote = useRef<boolean>(false);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rollRevealedAtRef = useRef<number>(0);
  const moveDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (moveDelayTimerRef.current) clearTimeout(moveDelayTimerRef.current);
    };
  }, []);

  // Synchronisation BroadcastChannel
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel('ludo_ms_channel');
      channelRef.current.onmessage = (event) => {
        if (event.data && gameMode === 'live') {
          handleIncomingSession(event.data);
        }
      };
    } catch {}

    return () => {
      channelRef.current?.close();
    };
  }, [gameMode]);

  // Synchronisation Firestore
  useEffect(() => {
    if (gameMode !== 'live') return;

    const unsub = subscribeLudoGame((session) => {
      if (session) {
        handleIncomingSession(session);
      }
    });

    return () => {
      unsub();
    };
  }, [gameMode]);

  const handleIncomingSession = (session: LudoGameSession) => {
    isSyncingFromRemote.current = true;
    if (session.currentTurn) setCurrentTurn(session.currentTurn);
    setDiceValue(session.diceValue ?? null);
    setIsRolling(Boolean(session.isRolling));
    setConsecutiveSixes(session.consecutiveSixes || 0);
    setWinner(session.winner || null);
    if (typeof session.p1Wins === 'number') setP1Wins(session.p1Wins);
    if (typeof session.p2Wins === 'number') setP2Wins(session.p2Wins);
    if (session.selectedPledge) setSelectedPledge(session.selectedPledge);
    if (session.lastMoveText) setLastEventText(session.lastMoveText);
    if (session.tokensPerPlayer) setTokensPerPlayer(session.tokensPerPlayer as 2 | 4);

    if (session.tokens?.p1) setTokensP1(session.tokens.p1);
    if (session.tokens?.p2) setTokensP2(session.tokens.p2);

    setTimeout(() => {
      isSyncingFromRemote.current = false;
    }, 50);
  };

  const syncSessionToCloud = useCallback(
    (customState?: Partial<LudoGameSession>) => {
      if (gameMode !== 'live' || isSyncingFromRemote.current) return;

      const session: LudoGameSession = {
        id: 'ludo_live',
        currentTurn,
        diceValue,
        isRolling,
        consecutiveSixes,
        tokens: {
          p1: tokensP1,
          p2: tokensP2,
        },
        winner,
        p1Wins,
        p2Wins,
        selectedPledge,
        tokensPerPlayer,
        lastMoveBy: activePartnerId,
        lastMoveText: lastEventText,
        lastUpdated: new Date().toISOString(),
        ...customState,
      };

      try {
        channelRef.current?.postMessage(session);
      } catch {}

      saveLudoGame(session).catch(console.error);
    },
    [
      gameMode,
      currentTurn,
      diceValue,
      isRolling,
      consecutiveSixes,
      tokensP1,
      tokensP2,
      winner,
      p1Wins,
      p2Wins,
      selectedPledge,
      tokensPerPlayer,
      lastEventText,
      activePartnerId,
    ]
  );

  // Check which tokens can legally move with current diceValue
  const getPlayableTokens = useCallback(
    (player: PartnerId, roll: number | null): LudoToken[] => {
      if (!roll) return [];
      const tokens = player === 'p1' ? activeTokensP1 : activeTokensP2;

      return tokens.filter((t) => {
        if (t.state === 'finished') return false;
        if (t.state === 'yard') {
          return roll === 6; // Requires a 6 to exit yard
        }
        return t.step + roll <= 56;
      });
    },
    [activeTokensP1, activeTokensP2]
  );

  const isMyTurn = useMemo(() => {
    if (gameMode === 'local') return true;
    if (gameMode === 'ai') return currentTurn === 'p1';
    return currentTurn === activePartnerId;
  }, [gameMode, currentTurn, activePartnerId]);

  const playableTokens = useMemo(() => {
    // In live mode: Nobody can play or move tokens when it is not their turn!
    if (gameMode === 'live' && currentTurn !== activePartnerId) {
      return [];
    }
    // In AI mode: Human cannot touch AI tokens
    if (gameMode === 'ai' && currentTurn === 'p2') {
      return [];
    }
    return getPlayableTokens(currentTurn, diceValue);
  }, [currentTurn, diceValue, getPlayableTokens, gameMode, activePartnerId]);

  const nextTurnPlayer = (player: PartnerId) => (player === 'p1' ? 'p2' : 'p1');

  // Handle dice rolling with interactive roll animation
  const handleRollDice = (isAiTrigger = false) => {
    if (isRolling || isMoving || winner) return;

    // Strict Live Turn Check: You cannot roll if it is not your turn!
    if (gameMode === 'live' && currentTurn !== activePartnerId) {
      const activeName = currentTurn === 'p1' ? p1.name : p2.name;
      setLastEventText(`⏳ Au tour de ${activeName} de lancer le dé !`);
      return;
    }

    if (gameMode === 'ai' && currentTurn === 'p2' && !isAiTrigger) return;

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

    soundEffects.playDiceRoll();
    setIsRolling(true);
    setDiceValue(null);

    const rollingPartnerName = currentTurn === 'p1' ? p1.name : p2.name;
    setLastEventText(`🎲 ${rollingPartnerName} secoue et lance le dé...`);

    // Animation de roulement interactive de 1 seconde avec défilement rapide des faces 1 à 6
    const ROLL_DURATION_MS = 1000;

    rollIntervalRef.current = setInterval(() => {
      setRollingFace(Math.floor(Math.random() * 6) + 1);
    }, 50);

    const finalRoll = Math.floor(Math.random() * 6) + 1;

    // Durée de l'animation de rotation rapide et flou : 1 seconde
    setTimeout(() => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }

      setIsRolling(false);
      setDiceValue(finalRoll);
      rollRevealedAtRef.current = Date.now();
      soundEffects.playDiceSettle();

      const nextSixCount = finalRoll === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(nextSixCount);

      // 3 consecutive 6s rule -> pass turn
      if (nextSixCount >= 3) {
        soundEffects.playSoftTap();
        const nextPlayer = nextTurnPlayer(currentTurn);
        const text = `3 fois 6 d'affilée ! Le tour passe à ${
          nextPlayer === 'p1' ? p1.name : p2.name
        }.`;
        setLastEventText(text);
        setCurrentTurn(nextPlayer);
        setDiceValue(null);
        setConsecutiveSixes(0);
        syncSessionToCloud({
          currentTurn: nextPlayer,
          diceValue: null,
          consecutiveSixes: 0,
          lastMoveText: text,
        });
        return;
      }

      // Check legal moves (limite les déplacements autorisés pour le tour en cours)
      const availableMoves = getPlayableTokens(currentTurn, finalRoll);

      if (availableMoves.length === 0) {
        const nextPlayer = nextTurnPlayer(currentTurn);
        const text = `${rollingPartnerName} a fait un ${finalRoll}. Aucun coup possible !`;
        setLastEventText(text);

        if (finalRoll !== 6) {
          setTimeout(() => {
            setCurrentTurn(nextPlayer);
            setDiceValue(null);
            syncSessionToCloud({
              currentTurn: nextPlayer,
              diceValue: null,
              lastMoveText: text,
            });
          }, 1200);
        } else {
          setLastEventText(`${rollingPartnerName} a fait un 6 ! Rejouez.`);
          syncSessionToCloud({
            diceValue: finalRoll,
            lastMoveText: `${rollingPartnerName} a fait un 6 ! Rejouez.`,
          });
        }
      } else if (availableMoves.length === 1) {
        // Court délai de 100ms pour laisser le joueur visualiser le résultat du dé avant que l'action ne commence
        const text = finalRoll === 6
          ? `${rollingPartnerName} a fait un 6 ! 1 seul déplacement possible.`
          : `${rollingPartnerName} a fait un ${finalRoll} ! Déplacement de ${finalRoll} case${finalRoll > 1 ? 's' : ''}.`;
        setLastEventText(text);
        syncSessionToCloud({ diceValue: finalRoll, lastMoveText: text });
        if (moveDelayTimerRef.current) clearTimeout(moveDelayTimerRef.current);
        moveDelayTimerRef.current = setTimeout(() => {
          handleStepByStepMove(availableMoves[0], finalRoll, true);
        }, 100);
      } else {
        const isCurrentMyTurn =
          gameMode === 'local' ||
          (gameMode === 'live' && currentTurn === activePartnerId) ||
          (gameMode === 'ai' && currentTurn === 'p1');
        const text = isCurrentMyTurn
          ? finalRoll === 6
            ? `Tu as fait un 6 ! Sors un pion de la base ou avance de 6 cases.`
            : `Tu as fait un ${finalRoll} ! Choisis parmi tes ${availableMoves.length} pions autorisés.`
          : `${rollingPartnerName} a fait un ${finalRoll} ! En attente de son choix...`;
        setLastEventText(text);
        syncSessionToCloud({ diceValue: finalRoll, lastMoveText: text });
      }
    }, 650);
  };

  // Helper to update a single token in tokens state
  const updateSingleToken = (updated: LudoToken, player: PartnerId) => {
    if (player === 'p1') {
      setTokensP1((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      setTokensP2((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  // STEP-BY-STEP MOVEMENT ("passe de pas a pas au lieu de sauter")
  const handleStepByStepMove = (token: LudoToken, rollToUse?: number, isAutoMove = false) => {
    const roll = rollToUse ?? diceValue;
    if (!roll || winner || isRolling || isMoving) return;

    // Délai de 100ms garanti entre l'affichage du dé et le mouvement effectif du pion
    const elapsedSinceRoll = Date.now() - (rollRevealedAtRef.current || 0);
    if (elapsedSinceRoll < 100) {
      const remainingDelay = 100 - elapsedSinceRoll;
      if (moveDelayTimerRef.current) clearTimeout(moveDelayTimerRef.current);
      moveDelayTimerRef.current = setTimeout(() => {
        handleStepByStepMove(token, rollToUse, isAutoMove);
      }, remainingDelay);
      return;
    }

    // Strict Live Security Check: Med cannot play for Safi, and Safi cannot play for Med!
    if (gameMode === 'live') {
      if (currentTurn !== activePartnerId) {
        const activeName = currentTurn === 'p1' ? p1.name : p2.name;
        setLastEventText(`⏳ Au tour de ${activeName} de jouer !`);
        return;
      }
      if (token.player !== activePartnerId) {
        return; // Cannot touch or move partner's piece!
      }
    }

    // In AI mode, player cannot touch AI tokens
    if (gameMode === 'ai' && currentTurn === 'p2' && !isAutoMove) return;

    const movingPlayer = token.player;
    if (movingPlayer !== currentTurn) return;

    // 1. If in yard (rolling 6), exit from yard to step 0
    if (token.state === 'yard') {
      if (roll !== 6) return;
      setIsMoving(true);
      setMovingTokenId(token.id);
      soundEffects.playPawnStep(1);

      // Yard exit animation with ripple on step 0
      const startPos = movingPlayer === 'p1' ? { x: 650, y: 1350 } : { x: 850, y: 150 };
      setStepRipple({
        x: startPos.x,
        y: startPos.y,
        color: movingPlayer === 'p1' ? '#3B82F6' : '#10B981',
        key: Date.now(),
      });

      setTimeout(() => {
        const exitedToken: LudoToken = {
          ...token,
          state: 'path',
          step: 0,
        };
        updateSingleToken(exitedToken, movingPlayer);
        setIsMoving(false);
        setMovingTokenId(null);
        setTimeout(() => setStepRipple(null), 500);
        soundEffects.playStarLanding();

        // Rolling 6 grants bonus roll!
        const msg = `🎉 ${movingPlayer === 'p1' ? p1.name : p2.name} a sorti un pion ! Rejouez.`;
        setLastEventText(msg);
        setDiceValue(null);

        const nextTokens =
          movingPlayer === 'p1'
            ? { p1: tokensP1.map((t) => (t.id === exitedToken.id ? exitedToken : t)), p2: tokensP2 }
            : { p1: tokensP1, p2: tokensP2.map((t) => (t.id === exitedToken.id ? exitedToken : t)) };

        syncSessionToCloud({
          tokens: nextTokens,
          diceValue: null,
          lastMoveText: msg,
        });
      }, speedPacing.yardExit);
      return;
    }

    // 2. Token is already on track or home stretch: move step-by-step!
    const startStep = token.step;
    const targetStep = startStep + roll;
    if (targetStep > 56) return; // Cannot overshoot

    setIsMoving(true);
    setMovingTokenId(token.id);
    let currentStep = startStep;
    // Pacing dynamisé selon les réglages de vitesse (Accessibilité ou Compétition)
    const stepInterval = speedPacing.stepInterval;

    const stepNext = () => {
      currentStep += 1;
      const stepIndex = currentStep - startStep;
      soundEffects.playPawnStep(stepIndex);

      const interimState =
        currentStep === 56 ? 'finished' : currentStep >= 51 ? 'home_run' : 'path';

      const interimToken: LudoToken = {
        ...token,
        step: currentStep,
        state: interimState,
      };

      // Trigger visual ripple on board
      const indexInPlayer = movingPlayer === 'p1'
        ? tokensP1.findIndex((t) => t.id === token.id)
        : tokensP2.findIndex((t) => t.id === token.id);
      const pos = getTokenPosition(interimToken, Math.max(0, indexInPlayer));

      setStepRipple({
        x: pos.x,
        y: pos.y,
        color: movingPlayer === 'p1' ? '#3B82F6' : '#10B981',
        key: Date.now() + currentStep,
      });

      updateSingleToken(interimToken, movingPlayer);

      if (currentStep < targetStep) {
        moveTimerRef.current = setTimeout(stepNext, stepInterval);
      } else {
        // Reached destination! Finalize move smoothly
        setTimeout(() => {
          finalizeMove(interimToken, movingPlayer, roll);
        }, 120);
      }
    };

    moveTimerRef.current = setTimeout(stepNext, stepInterval);
  };

  // Finalize move after step-by-step animation completes
  const finalizeMove = (finalToken: LudoToken, movingPlayer: PartnerId, roll: number) => {
    setIsMoving(false);
    setMovingTokenId(null);
    setTimeout(() => setStepRipple(null), 500);

    let gotBonusTurn = roll === 6;
    let capturedOpponent = false;

    // Check arrival at center home
    if (finalToken.step === 56) {
      soundEffects.playPawnHome();
      triggerHeartConfetti();
      gotBonusTurn = true; // Entering home grants bonus turn!
    }

    // Check capture on main path (steps 0..50)
    let nextP1Tokens =
      movingPlayer === 'p1'
        ? tokensP1.map((t) => (t.id === finalToken.id ? finalToken : t))
        : [...tokensP1];
    let nextP2Tokens =
      movingPlayer === 'p2'
        ? tokensP2.map((t) => (t.id === finalToken.id ? finalToken : t))
        : [...tokensP2];

    if (finalToken.state === 'path') {
      const finalTrackIndex =
        movingPlayer === 'p1' ? finalToken.step : (26 + finalToken.step) % 52;

      // Safe squares with stars (★) - Son très agréable de protection sous l'étoile
      if (SAFE_TRACK_INDEXES.has(finalTrackIndex)) {
        soundEffects.playStarLanding();
      } else {
        // Normal squares: check if opponent can be captured
        const opponentPlayer = nextTurnPlayer(movingPlayer);
        const opponentTokens = opponentPlayer === 'p1' ? nextP1Tokens : nextP2Tokens;

        const capturedIdx = opponentTokens.findIndex((op) => {
          if (op.state !== 'path') return false;
          const opTrackIdx = opponentPlayer === 'p1' ? op.step : (26 + op.step) % 52;
          return opTrackIdx === finalTrackIndex;
        });

        if (capturedIdx >= 0) {
          capturedOpponent = true;
          gotBonusTurn = true; // Capturing grants another roll!
          soundEffects.playPawnCapture();
          triggerHeartConfetti();

          const updatedOpponent: LudoToken = {
            ...opponentTokens[capturedIdx],
            state: 'yard',
            step: 0,
          };

          if (opponentPlayer === 'p1') {
            nextP1Tokens[capturedIdx] = updatedOpponent;
            setTokensP1([...nextP1Tokens]);
          } else {
            nextP2Tokens[capturedIdx] = updatedOpponent;
            setTokensP2([...nextP2Tokens]);
          }
        }
      }
    }

    // Check WIN condition (all active tokens reached home)
    const p1Active = nextP1Tokens.slice(0, tokensPerPlayer);
    const p2Active = nextP2Tokens.slice(0, tokensPerPlayer);

    const p1Won = p1Active.every((t) => t.state === 'finished');
    const p2Won = p2Active.every((t) => t.state === 'finished');

    if (p1Won || p2Won) {
      const gameWinner: PartnerId = p1Won ? 'p1' : 'p2';
      const winnerName = gameWinner === 'p1' ? p1.name : p2.name;
      const nextP1Wins = p1Won ? p1Wins + 1 : p1Wins;
      const nextP2Wins = p2Won ? p2Wins + 1 : p2Wins;

      setWinner(gameWinner);
      setP1Wins(nextP1Wins);
      setP2Wins(nextP2Wins);
      soundEffects.playVictoryChime();
      triggerCelebrationConfetti();

      const winText = `🏆 VICTOIRE DE ${winnerName.toUpperCase()} ! 🎉`;
      setLastEventText(winText);

      // Enregistrement dans l'historique des scores globaux du couple
      recordGameResult({
        gameId: 'ludo',
        gameTitle: 'Ludo MS',
        category: 'duo',
        winner: gameWinner,
        winnerName,
        pledge: selectedPledge,
      }).catch(console.error);

      syncSessionToCloud({
        winner: gameWinner,
        p1Wins: nextP1Wins,
        p2Wins: nextP2Wins,
        tokens: { p1: nextP1Tokens, p2: nextP2Tokens },
        lastMoveText: winText,
      });
      return;
    }

    const moverName = movingPlayer === 'p1' ? p1.name : p2.name;
    let moveMsg = `${moverName} a avancé son pion !`;
    if (finalToken.state === 'finished') {
      moveMsg = `🎉 ${moverName} a rentré un pion ! Rejouez !`;
    } else if (capturedOpponent) {
      moveMsg = `💥 Pion adverse capturé ! Rejouez !`;
    } else if (roll === 6) {
      moveMsg = `🎲 Un 6 ! ${moverName} rejoue !`;
    }

    setLastEventText(moveMsg);

    if (gotBonusTurn) {
      setDiceValue(null);
      syncSessionToCloud({
        tokens: { p1: nextP1Tokens, p2: nextP2Tokens },
        diceValue: null,
        lastMoveText: moveMsg,
      });
    } else {
      const next = nextTurnPlayer(movingPlayer);
      setCurrentTurn(next);
      setDiceValue(null);
      setConsecutiveSixes(0);
      syncSessionToCloud({
        currentTurn: next,
        tokens: { p1: nextP1Tokens, p2: nextP2Tokens },
        diceValue: null,
        consecutiveSixes: 0,
        lastMoveText: `${moveMsg} Au tour de ${next === 'p1' ? p1.name : p2.name}.`,
      });
    }
  };

  // AI Cupid automated turn
  useEffect(() => {
    if (gameMode !== 'ai' || currentTurn !== 'p2' || winner || isRolling || isMoving) return;

    const timer = setTimeout(() => {
      if (diceValue === null) {
        handleRollDice(true);
      } else {
        const moves = getPlayableTokens('p2', diceValue);
        if (moves.length > 0) {
          // AI strategy: prioritize capture, then home, then forward
          const captureMove = moves.find((m) => {
            const nextTrack = (26 + m.step + diceValue) % 52;
            return (
              !SAFE_TRACK_INDEXES.has(nextTrack) &&
              tokensP1.some((p1t) => p1t.state === 'path' && p1t.step === nextTrack)
            );
          });
          const homeMove = moves.find((m) => m.step + diceValue === 56);
          const yardMove = moves.find((m) => m.state === 'yard' && diceValue === 6);

          const chosen = captureMove || homeMove || yardMove || moves[0];
          handleStepByStepMove(chosen, diceValue, true);
        }
      }
    }, speedPacing.aiDelay);

    return () => clearTimeout(timer);
  }, [gameMode, currentTurn, diceValue, winner, isRolling, isMoving, getPlayableTokens, tokensP1]);

  // Reset Game
  const handleResetGame = () => {
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    if (moveDelayTimerRef.current) clearTimeout(moveDelayTimerRef.current);
    soundEffects.playSoftTap();

    const freshP1: LudoToken[] = Array.from({ length: 4 }, (_, idx) => ({
      id: `p1_${idx}`,
      player: 'p1',
      state: 'yard',
      step: 0,
    }));
    const freshP2: LudoToken[] = Array.from({ length: 4 }, (_, idx) => ({
      id: `p2_${idx}`,
      player: 'p2',
      state: 'yard',
      step: 0,
    }));

    setTokensP1(freshP1);
    setTokensP2(freshP2);
    setWinner(null);
    setDiceValue(null);
    setIsRolling(false);
    setIsMoving(false);
    setConsecutiveSixes(0);
    setCurrentTurn('p1');
    setLastEventText(`Nouvelle partie ! À ${p1.name} (Bleu) de lancer.`);

    syncSessionToCloud({
      tokens: { p1: freshP1, p2: freshP2 },
      winner: null,
      diceValue: null,
      isRolling: false,
      consecutiveSixes: 0,
      currentTurn: 'p1',
      lastMoveText: 'Nouvelle partie lancée !',
    });
  };

  // Share result to Chat
  const handleShareResultToChat = () => {
    if (!onSendChatMessage) return;
    const winnerName = winner === 'p1' ? p1.name : p2.name;
    const loserName = winner === 'p1' ? p2.name : p1.name;

    const summary = `🎲 *Ludo MS : Victoire de ${winnerName} !* 👑\nScore : ${p1.name} ${p1Wins} - ${p2Wins} ${p2.name}\n\n🌹 Gage amoureux pour ${loserName} :\n« ${selectedPledge} » ❤️`;

    onSendChatMessage({
      senderId: activePartnerId,
      content: summary,
      mediaType: 'text',
    });

    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
    setSentToChatToast(true);
    setTimeout(() => setSentToChatToast(false), 3000);
  };

  // Calculate pixel position of a token on the SVG 1500x1500px board
  const getTokenPosition = (token: LudoToken, indexInPlayer: number) => {
    const isP1 = token.player === 'p1';

    // 1. In Yard
    if (token.state === 'yard') {
      const spot = isP1 ? P1_YARD_SPOTS[indexInPlayer] : P2_YARD_SPOTS[indexInPlayer];
      return { x: spot[0] * 100 + 50, y: spot[1] * 100 + 50 };
    }

    // 2. Finished in Home Center (inside respective colored triangle)
    if (token.state === 'finished') {
      const offset = (indexInPlayer - 1.5) * 22;
      if (isP1) {
        // Blue bottom triangle
        return { x: 750 + offset, y: 810 };
      }
      // Green top triangle
      return { x: 750 + offset, y: 690 };
    }

    // 3. In Home Stretch (steps 51 to 55)
    if (token.state === 'home_run') {
      const stretchIdx = Math.min(Math.max(token.step - 51, 0), 4);
      const coord = isP1
        ? P1_BLUE_HOME_STRETCH[stretchIdx]
        : P2_GREEN_HOME_STRETCH[stretchIdx];
      return { x: coord[0] * 100 + 50, y: coord[1] * 100 + 50 };
    }

    // 4. On main perimeter track (steps 0 to 50)
    const trackIndex = isP1 ? token.step : (26 + token.step) % 52;
    const coord = TRACK_COORDINATES[trackIndex] || [6, 13];

    // Offset multiple tokens on the same square
    const allSamePlayerTokens = isP1 ? tokensP1 : tokensP2;
    const sameSquareTokens = allSamePlayerTokens.filter(
      (t) => t.state === token.state && t.step === token.step
    );
    let offsetX = 0;
    let offsetY = 0;
    if (sameSquareTokens.length > 1) {
      const idxInSame = sameSquareTokens.findIndex((t) => t.id === token.id);
      const offsets = [
        [-13, -13],
        [13, -13],
        [-13, 13],
        [13, 13],
      ];
      offsetX = offsets[idxInSame % 4][0];
      offsetY = offsets[idxInSame % 4][1];
    }

    return { x: coord[0] * 100 + 50 + offsetX, y: coord[1] * 100 + 50 + offsetY };
  };

  const p1HomeCount = activeTokensP1.filter((t) => t.state === 'finished').length;
  const p2HomeCount = activeTokensP2.filter((t) => t.state === 'finished').length;
  const isP1 = currentTurn === 'p1';

  // Render 6-dot face on the Ludo King dice button (colored to match active partner's turn)
  const renderDiceDots = (value: number | null) => {
    if (!value) return null;
    const dotColor = isP1 ? 'bg-blue-600' : 'bg-emerald-600';
    const dot = `w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor} shadow-2xs shrink-0`;

    switch (value) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ${dotColor} shadow-xs`} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full p-1.5 flex justify-between">
            <span className={dot} />
            <span className={`${dot} self-end`} />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full p-1.5 flex justify-between">
            <span className={dot} />
            <span className={`${dot} self-center`} />
            <span className={`${dot} self-end`} />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full p-1.5 grid grid-cols-2 gap-2 content-between">
            <span className={dot} />
            <span className={dot} />
            <span className={dot} />
            <span className={dot} />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full p-1.5 relative flex items-center justify-center">
            <div className="absolute inset-1.5 grid grid-cols-2 gap-2 content-between">
              <span className={dot} />
              <span className={dot} />
              <span className={dot} />
              <span className={dot} />
            </div>
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor} shadow-xs z-10`} />
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full p-1.5 grid grid-cols-2 gap-x-2.5 content-between justify-items-center">
            <span className={dot} />
            <span className={dot} />
            <span className={dot} />
            <span className={dot} />
            <span className={dot} />
            <span className={dot} />
          </div>
        );
      default:
        return <span>{value}</span>;
    }
  };

  // Render individual Luxury 3D Royal Pawn with fluid framer-motion positioning, jumping & self-rotation
  const renderPawn = (token: LudoToken, index: number) => {
    const isPlayer1 = token.player === 'p1';
    const pos = getTokenPosition(token, index);
    const isPlayable = playableTokens.some((pt) => pt.id === token.id);
    const isThisTokenMoving = movingTokenId === token.id;
    const isCurrentPlayerToken = token.player === currentTurn;

    // Seuls les pions SORTIS de case ('path' ou 'home_run') peuvent tourner sur eux-mêmes.
    // RÈGLE : Les pions ne doivent PAS tourner avant d'avoir cliqué sur le carré du dé (diceValue !== null) !
    const isExitedFromYard = token.state === 'path' || token.state === 'home_run';

    const shouldSpin =
      !isMoving &&
      !isRolling &&
      diceValue !== null &&
      isExitedFromYard &&
      isCurrentPlayerToken &&
      isMyTurn &&
      isPlayable;

    // Si on a fait un 6 après avoir cliqué sur le dé : les pions en case ('yard') SAUTENT sur place !
    const shouldJumpInYard =
      !isMoving &&
      !isRolling &&
      diceValue === 6 &&
      token.state === 'yard' &&
      isCurrentPlayerToken &&
      isMyTurn;

    // Vitesse adaptée selon le pacing choisi (stepInterval)
    const stepDuration = Math.max(0.08, (speedPacing.stepInterval / 1000) * 0.95);

    return (
      <motion.g
        key={token.id}
        initial={false}
        animate={{
          x: pos.x,
          y: pos.y,
        }}
        transition={{
          x: {
            type: 'spring',
            stiffness: speedPacing.stepInterval < 100 ? 650 : speedPacing.stepInterval < 200 ? 460 : 340,
            damping: 26,
            mass: 0.5,
          },
          y: {
            type: 'spring',
            stiffness: speedPacing.stepInterval < 100 ? 650 : speedPacing.stepInterval < 200 ? 460 : 340,
            damping: 26,
            mass: 0.5,
          },
        }}
        onClick={() => !isMoving && isPlayable && handleStepByStepMove(token)}
        onTouchEnd={(e) => {
          if (!isMoving && isPlayable) {
            e.preventDefault();
            handleStepByStepMove(token);
          }
        }}
        className={isPlayable && !isMoving ? 'cursor-pointer' : ''}
        whileHover={isPlayable && !isMoving ? { scale: 1.1 } : undefined}
        whileTap={isPlayable && !isMoving ? { scale: 0.94 } : undefined}
      >
        {/* Generous touch target for effortless tapping on mobile */}
        <circle cx={0} cy={0} r="88" fill="transparent" />

        {/* Global Pawn Scale Wrapper (+35% larger for bold, effortless visibility) */}
        <g transform="scale(1.35) translate(0, -6)">
          {/* 1. Multi-layered Ground Contact Shadows (Stable on ground at y=28, breathing during moves & jumps) */}
        <motion.ellipse
          cx={0}
          cy={28}
          rx={isThisTokenMoving ? 48 : 42}
          ry={isThisTokenMoving ? 15 : 12}
          fill="url(#pawn-contact-shadow)"
          animate={
            isThisTokenMoving
              ? { scale: [1, 0.75, 1], opacity: [0.9, 0.45, 0.9] }
              : shouldJumpInYard
              ? { scale: [1, 0.65, 1], opacity: [0.95, 0.4, 0.95] }
              : shouldSpin
              ? { scale: [1, 0.92, 1], opacity: [0.95, 0.8, 0.95] }
              : { scale: 1, opacity: 0.95 }
          }
          transition={
            isThisTokenMoving
              ? { repeat: Infinity, duration: stepDuration, ease: 'easeInOut' }
              : shouldJumpInYard
              ? { repeat: Infinity, duration: 0.55, ease: 'easeInOut' }
              : shouldSpin
              ? { repeat: Infinity, duration: isPlayable ? 1.4 : 2.2, ease: 'easeInOut' }
              : { duration: 0.25 }
          }
        />
        <ellipse
          cx={0}
          cy={27}
          rx={isThisTokenMoving ? 30 : 26}
          ry={isThisTokenMoving ? 8.5 : 7}
          fill="#000000"
          opacity="0.38"
        />

        {/* 2. Effet Balise Rotative 360° au sol (exclusivement pour les pions sortis de case) */}
        {shouldSpin && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Halo lumineux doré doux au sol */}
            <ellipse
              cx={0}
              cy={28}
              rx="48"
              ry="15"
              fill="url(#pawn-floor-glow)"
              opacity="0.95"
            />
            {/* Anneau doré rotatif 360° en continu sur lui-même */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isPlayable ? 2.4 : 3.6, ease: 'linear' }}
              style={{ transformOrigin: '0px 28px' }}
            >
              <ellipse
                cx={0}
                cy={28}
                rx="42"
                ry="13"
                fill="none"
                stroke="#FACC15"
                strokeWidth="3"
                strokeDasharray="9 4 3 4"
              />
              <circle cx={-42} cy={28} r="3.2" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />
              <circle cx={42} cy={28} r="3.2" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />
              <circle cx={0} cy={15} r="2.6" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />
              <circle cx={0} cy={41} r="2.6" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />
            </motion.g>
          </g>
        )}

        {/* Halo doré dynamique et pulsant pour les pions en case qui SAUTENT quand on a fait un 6 */}
        {shouldJumpInYard && (
          <g style={{ pointerEvents: 'none' }}>
            <ellipse
              cx={0}
              cy={28}
              rx="46"
              ry="14"
              fill="url(#pawn-floor-glow)"
              opacity="0.95"
            />
            <motion.ellipse
              cx={0}
              cy={28}
              rx="40"
              ry="12"
              fill="none"
              stroke="#FACC15"
              strokeWidth="3.2"
              strokeDasharray="6 3"
              animate={{ scale: [1, 1.15, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ repeat: Infinity, duration: 0.55, ease: 'easeInOut' }}
            />
          </g>
        )}

        {/* Repère doré fixe si un pion en case est jouable (hors saut 6) */}
        {!shouldSpin && !shouldJumpInYard && isPlayable && !isMoving && token.state === 'yard' && (
          <g style={{ pointerEvents: 'none' }}>
            <circle
              cx={0}
              cy={28}
              r="38"
              fill="none"
              stroke="#FACC15"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              opacity="0.9"
            />
          </g>
        )}

        {/* 3. Effet Pion en Mouvement : Aérien, net et réactif */}
        {isThisTokenMoving && (
          <g style={{ pointerEvents: 'none' }}>
            <circle
              cx={0}
              cy={-15}
              r="46"
              fill="none"
              stroke="#FDE047"
              strokeWidth="3"
              opacity="0.9"
            />
          </g>
        )}

        {/* 4. Corps Principal du Pion avec Animation Fluide (Saute si en case avec un 6, tourne si sorti de case, sautille si en marche) */}
        <motion.g
          animate={
            isThisTokenMoving
              ? {
                  y: [-2, -22, -2],
                  scaleX: 1,
                }
              : shouldJumpInYard
              ? {
                  y: [0, -28, 0],
                  scaleY: [1, 1.08, 0.93, 1],
                  scaleX: 1, // Ne tourne pas, mais saute joyeusement !
                }
              : shouldSpin
              ? {
                  scaleX: [1, 0.12, -1, 0.12, 1],
                  y: isPlayable ? [0, -8, 0] : [0, -3, 0],
                }
              : {
                  scaleX: 1,
                  y: 0,
                }
          }
          transition={
            isThisTokenMoving
              ? {
                  y: {
                    repeat: Infinity,
                    duration: stepDuration,
                    ease: 'easeInOut',
                  },
                }
              : shouldJumpInYard
              ? {
                  y: {
                    repeat: Infinity,
                    duration: 0.55,
                    ease: 'easeInOut',
                  },
                  scaleY: {
                    repeat: Infinity,
                    duration: 0.55,
                    ease: 'easeInOut',
                  },
                }
              : shouldSpin
              ? {
                  scaleX: {
                    repeat: Infinity,
                    duration: isPlayable ? 1.6 : 2.4,
                    ease: 'easeInOut',
                  },
                  y: {
                    repeat: Infinity,
                    duration: isPlayable ? 0.8 : 1.2,
                    ease: 'easeInOut',
                  },
                }
              : { duration: 0.25 }
          }
          style={{ transformOrigin: '0px 28px' }}
        >
          {/* Auréole rotative 360° étincelante autour de la tête quand le pion tourne sur lui-même */}
          {shouldSpin && (
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isPlayable ? 2.0 : 3.0, ease: 'linear' }}
              style={{ transformOrigin: '0px -25px' }}
            >
              <circle
                cx={0}
                cy={-25}
                r="38"
                fill="none"
                stroke="#FDE047"
                strokeWidth="2.2"
                strokeDasharray="6 6"
                opacity="0.95"
              />
              <circle cx={-38} cy={-25} r="3" fill="#FFFFFF" opacity="0.95" />
              <circle cx={38} cy={-25} r="3" fill="#FFFFFF" opacity="0.95" />
              <circle cx={0} cy={-63} r="3" fill="#FFFFFF" opacity="0.95" />
              <circle cx={0} cy={13} r="3" fill="#FFFFFF" opacity="0.95" />
            </motion.g>
          )}

          {/* Socle Lourd à Double Biseau Agrandie (Finition Or Impérial 24k) */}
          <ellipse
            cx={0}
            cy={28}
            rx="39"
            ry="11.5"
            fill="url(#gold-polished)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <ellipse
            cx={0}
            cy={25.5}
            rx="34.5"
            ry="9.5"
            fill={isPlayer1 ? 'url(#p1-royal-body)' : 'url(#p2-royal-body)'}
          />
          <ellipse
            cx={0}
            cy={20.5}
            rx="27.5"
            ry="7.5"
            fill="url(#gold-polished)"
            stroke="#78350F"
            strokeWidth="1"
          />
          <ellipse
            cx={0}
            cy={18.5}
            rx="23.5"
            ry="6"
            fill={isPlayer1 ? '#1E40AF' : '#047857'}
          />

          {/* Silhouette Sculptée Évasée et Agrandie en Laque Royale 3D */}
          <path
            d="M -14 -7 C -11 4, -26 14, -30 21 Q 0 27, 30 21 C 26 14, 11 4, 14 -7 Z"
            fill={isPlayer1 ? 'url(#p1-royal-body)' : 'url(#p2-royal-body)'}
            stroke={isPlayer1 ? '#1E3A8A' : '#064E3B'}
            strokeWidth="1.8"
          />

          {/* Reflet Glacé Céramique sur le Flanc Gauche */}
          <path
            d="M -8 -6 C -7 4, -14 14, -20 20 L -15 20 C -10 14, -2 4, -4 -6 Z"
            fill="url(#stem-specular)"
            style={{ pointerEvents: 'none' }}
          />

          {/* Bague Médiane Dorée Filigrane */}
          <ellipse
            cx={0}
            cy={8}
            rx="18.5"
            ry="5"
            fill="none"
            stroke="url(#gold-polished)"
            strokeWidth="2.2"
          />

          {/* Collerette d'Or au Cou */}
          <ellipse
            cx={0}
            cy={-7}
            rx="19.5"
            ry="6"
            fill="url(#gold-polished)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <ellipse
            cx={0}
            cy={-8}
            rx="16"
            ry="4.2"
            fill="#FEF08A"
          />

          {/* Dôme de la Tête : Sertissage d'Or Majestueux Agrandie */}
          <circle
            cx={0}
            cy={-25}
            r="33"
            fill="url(#gold-bezel-radial)"
            stroke="#78350F"
            strokeWidth="1.6"
          />

          {/* Sphère de Cristal Joyau 3D Agrandie (Diamètre 56px) */}
          <circle
            cx={0}
            cy={-25}
            r="28"
            fill={isPlayer1 ? 'url(#p1-sapphire-gem)' : 'url(#p2-emerald-gem)'}
            stroke="#FFFFFF"
            strokeWidth="1.4"
          />

          {/* Facettes Intérieures du Cristal */}
          <circle
            cx={0}
            cy={-25}
            r="22.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
            opacity="0.45"
            strokeDasharray="4 2"
            style={{ pointerEvents: 'none' }}
          />

          {/* Arc de Reflet Verre Cristallin */}
          <ellipse
            cx={-9}
            cy={-35}
            rx="16"
            ry="7.5"
            transform="rotate(-25 -9 -35)"
            fill="url(#glass-specular)"
            style={{ pointerEvents: 'none' }}
          />

          {/* Éclat d'Étoile Éblouissant */}
          <circle
            cx={-11}
            cy={-35.5}
            r="3.4"
            fill="#FFFFFF"
            opacity="0.95"
            style={{ pointerEvents: 'none' }}
          />

          {/* Médaillon Central : Badge Chic Initiale & Numéro Agrandie */}
          {token.state === 'finished' ? (
            <text
              x={0}
              y={-16}
              fill="#FEF08A"
              fontSize="28"
              fontWeight="900"
              textAnchor="middle"
              style={{
                pointerEvents: 'none',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
              }}
            >
              👑
            </text>
          ) : (
            <>
              <circle
                cx={0}
                cy={-24.5}
                r="15"
                fill="rgba(15, 23, 42, 0.7)"
                stroke="url(#gold-polished)"
                strokeWidth="1.8"
                style={{ pointerEvents: 'none' }}
              />
              <text
                x={0}
                y={-18.5}
                fill="#FEF08A"
                fontSize="17"
                fontWeight="900"
                textAnchor="middle"
                style={{
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.95))',
                  letterSpacing: '-0.3px',
                }}
              >
                {isPlayer1 ? 'M' : 'S'}{index + 1}
              </text>
            </>
          )}

          {/* Perle de Faîte Impériale */}
          <circle
            cx={0}
            cy={-56}
            r="5.5"
            fill="url(#gold-polished)"
            stroke="#78350F"
            strokeWidth="1"
          />
          <circle
            cx={-1.5}
            cy={-57.8}
            r="1.8"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </motion.g>
        </g>
      </motion.g>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto box-border select-none flex flex-col items-center gap-2 overflow-hidden px-1">
      {/* Top Bar with Mode, Piece count and Reset */}
      <div className="w-full flex items-center justify-between py-1 px-2.5 bg-white/95 rounded-xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">🎲</span>
          <span className="font-bold text-xs text-stone-900 tracking-tight">Ludo MS</span>
          <span className="text-[10px] text-stone-500 font-semibold truncate">
            {p1Wins} - {p2Wins}
          </span>
          {gameMode === 'live' && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200 truncate">
              ⚡ Direct ({activePartnerId === 'p1' ? p1.name : p2.name})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-lg text-stone-500 hover:text-stone-800 transition-colors cursor-pointer ${
              showSettings ? 'bg-stone-200 text-stone-900' : 'hover:bg-stone-100'
            }`}
            title="Options du jeu"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetGame}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Recommencer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Options Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full overflow-hidden bg-white rounded-xl p-2 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-500 font-semibold">Mode :</span>
              <button
                type="button"
                onClick={() => setGameMode('local')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  gameMode === 'local' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                1 Écran
              </button>
              <button
                type="button"
                onClick={() => setGameMode('live')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  gameMode === 'live' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                Direct ⚡
              </button>
              <button
                type="button"
                onClick={() => setGameMode('ai')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  gameMode === 'ai' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                Vs IA 🤖
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-500 font-semibold">Pions :</span>
              <button
                type="button"
                onClick={() => {
                  setTokensPerPlayer(4);
                  handleResetGame();
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  tokensPerPlayer === 4 ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                4 Pions
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokensPerPlayer(2);
                  handleResetGame();
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  tokensPerPlayer === 2 ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                2 Pions
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE AUTHENTIC LUDO KING BOARD CONTAINER (Zone de jeu avec bordure nette & aura lumineuse stable) */}
      <div className="relative w-full max-w-[min(84vw,48vh,400px)] aspect-square flex items-center justify-center">
        {/* Halo néon doux autour de la zone de jeu indiquant le partenaire actif (fixe et sans clignotement) */}
        <div
          className={`absolute -inset-1 sm:-inset-1.5 rounded-3xl blur-md opacity-60 transition-all duration-500 pointer-events-none ${
            currentTurn === 'p1'
              ? 'bg-gradient-to-tr from-blue-600 via-sky-400 to-indigo-500 shadow-[0_0_25px_rgba(59,130,246,0.5)]'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-400 to-green-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
          }`}
        />

        <div
          className={`relative w-full h-full bg-[#0b2853] p-1.5 sm:p-2 rounded-2xl shadow-2xl transition-all duration-300 ${
            currentTurn === 'p1'
              ? 'border-2 sm:border-3 border-blue-400 ring-2 sm:ring-4 ring-blue-400/80 shadow-[inset_0_0_20px_rgba(59,130,246,0.35)]'
              : 'border-2 sm:border-3 border-emerald-400 ring-2 sm:ring-4 ring-emerald-400/80 shadow-[inset_0_0_20px_rgba(16,185,129,0.35)]'
          }`}
        >
          <svg
            viewBox="0 0 1500 1500"
            className="w-full h-full select-none"
            style={{ touchAction: 'manipulation' }}
          >
          {/* Luxury 3D Pawn & Material Defs */}
          <defs>
            {/* Real 3D Soft Drop Shadow for Pawns */}
            <filter id="pawn-soft-shadow" x="-50%" y="-30%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#020617" floodOpacity="0.5" />
            </filter>

            {/* Glowing Golden Aura for Active Pawns */}
            <filter id="pawn-gold-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Player 1 (Blue / Med) Royal 3D Lacquer Body */}
            <linearGradient id="p1-royal-body" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="15%" stopColor="#1D4ED8" />
              <stop offset="35%" stopColor="#60A5FA" />
              <stop offset="52%" stopColor="#93C5FD" />
              <stop offset="70%" stopColor="#2563EB" />
              <stop offset="90%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Player 2 (Green / Safi) Royal 3D Lacquer Body */}
            <linearGradient id="p2-royal-body" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="15%" stopColor="#059669" />
              <stop offset="35%" stopColor="#34D399" />
              <stop offset="52%" stopColor="#A7F3D0" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="90%" stopColor="#047857" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>

            {/* 24k Polished Imperial Gold Metal Gradient */}
            <linearGradient id="gold-polished" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="20%" stopColor="#FDE047" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="85%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>

            {/* Concentric Gold Bezel Gradient */}
            <radialGradient id="gold-bezel-radial" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="75%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </radialGradient>

            {/* Blue (Player 1) 3D Royal Sapphire Jewel Sphere */}
            <radialGradient id="p1-sapphire-gem" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#DBEAFE" />
              <stop offset="20%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="75%" stopColor="#1E40AF" />
              <stop offset="92%" stopColor="#172554" />
              <stop offset="100%" stopColor="#0B132B" />
            </radialGradient>

            {/* Green (Player 2) 3D Royal Emerald Jewel Sphere */}
            <radialGradient id="p2-emerald-gem" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#D1FAE5" />
              <stop offset="20%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="75%" stopColor="#047857" />
              <stop offset="92%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#022C22" />
            </radialGradient>

            {/* Ground Contact Shadow Gradient */}
            <radialGradient id="pawn-contact-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#020617" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>

            {/* Playable Pulsing Floor Ring Glow */}
            <radialGradient id="pawn-floor-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
            </radialGradient>

            {/* Glass Curved Glint Specular Overlay */}
            <linearGradient id="glass-specular" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Glossy Stem Reflection */}
            <linearGradient id="stem-specular" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Base Background Surface */}
          <rect x="0" y="0" width="1500" height="1500" fill="#FFFFFF" />

          {/* 1. TOP-LEFT: RED BASE (with 4 luxury indented red sockets) */}
          <rect x="0" y="0" width="600" height="600" fill="#DC2626" />
          <rect x="60" y="60" width="480" height="480" rx="30" fill="#FFFFFF" stroke="#B91C1C" strokeWidth="4" />
          {/* 4 Red circular sockets */}
          <g>
            <circle cx="210" cy="210" r="48" fill="#FCA5A5" opacity="0.3" />
            <circle cx="210" cy="210" r="42" fill="#DC2626" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="210" cy="210" r="30" fill="none" stroke="#FEE2E2" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="390" cy="210" r="48" fill="#FCA5A5" opacity="0.3" />
            <circle cx="390" cy="210" r="42" fill="#DC2626" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="390" cy="210" r="30" fill="none" stroke="#FEE2E2" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="210" cy="390" r="48" fill="#FCA5A5" opacity="0.3" />
            <circle cx="210" cy="390" r="42" fill="#DC2626" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="210" cy="390" r="30" fill="none" stroke="#FEE2E2" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="390" cy="390" r="48" fill="#FCA5A5" opacity="0.3" />
            <circle cx="390" cy="390" r="42" fill="#DC2626" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="390" cy="390" r="30" fill="none" stroke="#FEE2E2" strokeWidth="2" strokeDasharray="4 3" />
          </g>

          {/* 2. TOP-RIGHT: GREEN BASE (Computer / Safi) */}
          <rect x="900" y="0" width="600" height="600" fill="#16A34A" />
          <text
            x="1200"
            y="48"
            fill="#FFFFFF"
            fontSize="34"
            fontWeight="bold"
            textAnchor="middle"
          >
            {gameMode === 'ai' ? 'Computer' : p2.name}
          </text>
          <rect
            x="960"
            y="60"
            width="480"
            height="480"
            rx="30"
            fill="#FFFFFF"
            stroke={currentTurn === 'p2' ? '#FACC15' : '#15803D'}
            strokeWidth={currentTurn === 'p2' ? '8' : '4'}
          />
          {/* Elegant stable golden aura on active Green base (SANS clignotement) */}
          {currentTurn === 'p2' && (
            <rect
              x="950"
              y="50"
              width="500"
              height="500"
              rx="35"
              fill="none"
              stroke="#FACC15"
              strokeWidth="5"
              opacity="0.9"
            />
          )}
          {/* 4 Green circular sockets */}
          <g>
            <circle cx="1110" cy="210" r="48" fill="#86EFAC" opacity="0.3" />
            <circle cx="1110" cy="210" r="42" fill="#16A34A" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="1110" cy="210" r="30" fill="none" stroke="#DCFCE7" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="1290" cy="210" r="48" fill="#86EFAC" opacity="0.3" />
            <circle cx="1290" cy="210" r="42" fill="#16A34A" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="1290" cy="210" r="30" fill="none" stroke="#DCFCE7" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="1110" cy="390" r="48" fill="#86EFAC" opacity="0.3" />
            <circle cx="1110" cy="390" r="42" fill="#16A34A" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="1110" cy="390" r="30" fill="none" stroke="#DCFCE7" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="1290" cy="390" r="48" fill="#86EFAC" opacity="0.3" />
            <circle cx="1290" cy="390" r="42" fill="#16A34A" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="1290" cy="390" r="30" fill="none" stroke="#DCFCE7" strokeWidth="2" strokeDasharray="4 3" />
          </g>

          {/* 3. BOTTOM-LEFT: BLUE BASE (You / Med) */}
          <rect x="0" y="900" width="600" height="600" fill="#2563EB" />
          <rect
            x="60"
            y="960"
            width="480"
            height="480"
            rx="30"
            fill="#FFFFFF"
            stroke={currentTurn === 'p1' ? '#FACC15' : '#1D4ED8'}
            strokeWidth={currentTurn === 'p1' ? '8' : '4'}
          />
          {/* Elegant stable golden aura on active Blue base (SANS clignotement) */}
          {currentTurn === 'p1' && (
            <rect
              x="50"
              y="950"
              width="500"
              height="500"
              rx="35"
              fill="none"
              stroke="#FACC15"
              strokeWidth="5"
              opacity="0.9"
            />
          )}
          {/* 4 Blue circular sockets */}
          <g>
            <circle cx="210" cy="1110" r="48" fill="#93C5FD" opacity="0.3" />
            <circle cx="210" cy="1110" r="42" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="210" cy="1110" r="30" fill="none" stroke="#DBEAFE" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="390" cy="1110" r="48" fill="#93C5FD" opacity="0.3" />
            <circle cx="390" cy="1110" r="42" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="390" cy="1110" r="30" fill="none" stroke="#DBEAFE" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="210" cy="1290" r="48" fill="#93C5FD" opacity="0.3" />
            <circle cx="210" cy="1290" r="42" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="210" cy="1290" r="30" fill="none" stroke="#DBEAFE" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="390" cy="1290" r="48" fill="#93C5FD" opacity="0.3" />
            <circle cx="390" cy="1290" r="42" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="390" cy="1290" r="30" fill="none" stroke="#DBEAFE" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <text
            x="300"
            y="1485"
            fill="#FFFFFF"
            fontSize="34"
            fontWeight="bold"
            textAnchor="middle"
          >
            {p1.name} (You)
          </text>

          {/* 4. BOTTOM-RIGHT: YELLOW BASE */}
          <rect x="900" y="900" width="600" height="600" fill="#EAB308" />
          <rect x="960" y="960" width="480" height="480" rx="30" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="4" />
          {/* 4 Yellow circular sockets */}
          <g>
            <circle cx="1110" cy="1110" r="48" fill="#FDE047" opacity="0.3" />
            <circle cx="1110" cy="1110" r="42" fill="#EAB308" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="1110" cy="1110" r="30" fill="none" stroke="#FEF9C3" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="1290" cy="1110" r="48" fill="#FDE047" opacity="0.3" />
            <circle cx="1290" cy="1110" r="42" fill="#EAB308" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="1290" cy="1110" r="30" fill="none" stroke="#FEF9C3" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="1110" cy="1290" r="48" fill="#FDE047" opacity="0.3" />
            <circle cx="1110" cy="1290" r="42" fill="#EAB308" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="1110" cy="1290" r="30" fill="none" stroke="#FEF9C3" strokeWidth="2" strokeDasharray="4 3" />
          </g>
          <g>
            <circle cx="1290" cy="1290" r="48" fill="#FDE047" opacity="0.3" />
            <circle cx="1290" cy="1290" r="42" fill="#EAB308" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="1290" cy="1290" r="30" fill="none" stroke="#FEF9C3" strokeWidth="2" strokeDasharray="4 3" />
          </g>

          {/* 5. 52 MAIN PERIMETER SQUARES */}
          {TRACK_COORDINATES.map((c, idx) => {
            const isBlueStart = idx === 0;
            const isRedStart = idx === 13;
            const isGreenStart = idx === 26;
            const isYellowStart = idx === 39;
            const isSafe = SAFE_TRACK_INDEXES.has(idx);

            // Starting squares have player color
            let fill = '#FFFFFF';
            if (isBlueStart) fill = '#2563EB';
            if (isRedStart) fill = '#DC2626';
            if (isGreenStart) fill = '#16A34A';
            if (isYellowStart) fill = '#EAB308';

            const px = c[0] * 100;
            const py = c[1] * 100;

            return (
              <g key={`track_${idx}`}>
                <rect
                  x={px}
                  y={py}
                  width="100"
                  height="100"
                  fill={fill}
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                />

                {/* Safe Star (☆) outlined 5-pointed star matching screenshot */}
                {isSafe && (
                  <polygon
                    points={`${px + 50},${py + 20} ${px + 59},${py + 37} ${px + 78},${py + 40} ${px + 64},${py + 54} ${px + 67},${py + 73} ${px + 50},${py + 63} ${px + 33},${py + 73} ${px + 36},${py + 54} ${px + 22},${py + 40} ${px + 41},${py + 37}`}
                    fill="none"
                    stroke={
                      isBlueStart || isRedStart || isGreenStart || isYellowStart
                        ? '#FFFFFF'
                        : '#475569'
                    }
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            );
          })}

          {/* 6. COLORED HOME STRETCHES (Rows/Cols leading to center) */}
          {/* Blue Home Stretch (Cols 7, Rows 13 down to 9 leading up into center) */}
          {P1_BLUE_HOME_STRETCH.map((c, idx) => (
            <rect
              key={`blue_home_${idx}`}
              x={c[0] * 100}
              y={c[1] * 100}
              width="100"
              height="100"
              fill="#2563EB"
              stroke="#1D4ED8"
              strokeWidth="1.5"
            />
          ))}

          {/* Green Home Stretch (Cols 7, Rows 1 up to 5 leading down into center) */}
          {P2_GREEN_HOME_STRETCH.map((c, idx) => (
            <rect
              key={`green_home_${idx}`}
              x={c[0] * 100}
              y={c[1] * 100}
              width="100"
              height="100"
              fill="#16A34A"
              stroke="#15803D"
              strokeWidth="1.5"
            />
          ))}

          {/* Red Home Stretch (Row 7, Cols 1 up to 5 leading right into center) */}
          {[1, 2, 3, 4, 5].map((col) => (
            <rect
              key={`red_home_${col}`}
              x={col * 100}
              y={700}
              width="100"
              height="100"
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth="1.5"
            />
          ))}

          {/* Yellow Home Stretch (Row 7, Cols 13 down to 9 leading left into center) */}
          {[13, 12, 11, 10, 9].map((col) => (
            <rect
              key={`yellow_home_${col}`}
              x={col * 100}
              y={700}
              width="100"
              height="100"
              fill="#EAB308"
              stroke="#CA8A04"
              strokeWidth="1.5"
            />
          ))}

          {/* 7. ENTRY ARROWS (Matching screenshot) */}
          {/* Red arrow [→] at [0, 7] */}
          <text x="50" y="768" fill="#475569" fontSize="48" fontWeight="bold" textAnchor="middle">
            →
          </text>

          {/* Green arrow [↓] at [7, 0] */}
          <text x="750" y="68" fill="#475569" fontSize="48" fontWeight="bold" textAnchor="middle">
            ↓
          </text>

          {/* Yellow arrow [←] at [14, 7] */}
          <text x="1450" y="768" fill="#475569" fontSize="48" fontWeight="bold" textAnchor="middle">
            ←
          </text>

          {/* Blue arrow [↑] at [7, 14] */}
          <text x="750" y="1468" fill="#475569" fontSize="48" fontWeight="bold" textAnchor="middle">
            ↑
          </text>

          {/* 8. CENTER FINISH: 4 COLORED TRIANGLES MEETING IN THE CENTER */}
          {/* Top Triangle: Green */}
          <polygon points="600,600 900,600 750,750" fill="#16A34A" />
          {/* Left Triangle: Red */}
          <polygon points="600,600 600,900 750,750" fill="#DC2626" />
          {/* Bottom Triangle: Blue */}
          <polygon points="600,900 900,900 750,750" fill="#2563EB" />
          {/* Right Triangle: Yellow */}
          <polygon points="900,600 900,900 750,750" fill="#EAB308" />

          {/* Center Border Lines */}
          <line x1="600" y1="600" x2="900" y2="900" stroke="#0F172A" strokeWidth="2" />
          <line x1="600" y1="900" x2="900" y2="600" stroke="#0F172A" strokeWidth="2" />

          {/* 9. STEP RIPPLE WAVE EFFECT (Onde lumineuse à chaque pas du pion) */}
          {stepRipple && (
            <g key={stepRipple.key} style={{ pointerEvents: 'none' }}>
              {/* Outer expanding ripple ring */}
              <circle
                cx={stepRipple.x}
                cy={stepRipple.y}
                r="40"
                fill="none"
                stroke={stepRipple.color}
                strokeWidth="4"
                opacity="0.8"
                className="animate-ping"
                style={{ animationDuration: '0.6s' }}
              />
              {/* Glowing inner golden footprint ring */}
              <circle
                cx={stepRipple.x}
                cy={stepRipple.y}
                r="26"
                fill="none"
                stroke="#FACC15"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                opacity="0.9"
              />
              <circle
                cx={stepRipple.x}
                cy={stepRipple.y}
                r="16"
                fill={stepRipple.color}
                opacity="0.3"
                className="animate-pulse"
              />
              <circle
                cx={stepRipple.x}
                cy={stepRipple.y}
                r="5"
                fill="#FFFFFF"
                opacity="0.95"
              />
            </g>
          )}

          {/* 10. RENDER AUTHENTIC LUDO PIN PAWNS (Sorted to keep moving token on top) */}
          {allActiveTokens.map(({ token, index }) => renderPawn(token, index))}
        </svg>
      </div>
    </div>

    {/* DOCK CONTROLLER: DÉ TOTALEMENT FIXE ENTRE MS ET ST (SANS AUCUN VA-ET-VIENT) */}
    <div
      className={`w-full bg-[#0a1e3f] rounded-2xl border-2 p-2 sm:p-2.5 shadow-lg flex items-center justify-between gap-1.5 text-white transition-colors duration-300 ${
        isP1
          ? 'border-blue-400/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
          : 'border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
      }`}
    >
      {/* Left: Player 1 (MS - Bleu) - Totalement stable sans transform scale */}
      <div
        className={`flex-1 min-w-0 max-w-[135px] sm:max-w-[150px] flex items-center gap-1.5 sm:gap-2 p-1.5 px-2 rounded-xl transition-colors duration-200 ${
          isP1
            ? 'bg-blue-600/70 border-2 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)] ring-2 ring-blue-400/50'
            : 'bg-blue-950/40 border border-blue-900/50 opacity-60'
        }`}
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-xs overflow-hidden">
            {p1.avatar ? (
              <img src={p1.avatar} alt={p1.name} className="w-full h-full object-cover" />
            ) : (
              <span>MS</span>
            )}
          </div>
          {isP1 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-300 ring-2 ring-white shadow-xs" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-amber-300 text-xs truncate block leading-tight">
              {p1.name || 'MS'}
            </span>
            {gameMode === 'live' && activePartnerId === 'p1' && (
              <span className="text-[8px] bg-blue-400/30 text-blue-200 border border-blue-400/40 px-1 rounded-sm font-semibold shrink-0">
                Toi
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-blue-200 block leading-tight shrink-0">
              {p1HomeCount}/{tokensPerPlayer} 🏠
            </span>
            {gameMode === 'live' ? (
              <span
                className={`text-[8px] font-bold px-1 rounded-sm shrink-0 ${
                  currentTurn === 'p1'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {currentTurn === 'p1' ? '🟢 Tour' : 'Attente'}
              </span>
            ) : (
              isP1 && (
                <span className="text-[8px] font-extrabold px-1 rounded-sm bg-blue-500 text-white shadow-2xs shrink-0">
                  Au tour
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Center: DÉ TOTALEMENT FIXE (SANS AUCUN VA-ET-VIENT, NI SAUT, NI DÉPLACEMENT) */}
      <div className="w-[84px] shrink-0 flex flex-col items-center justify-center">
        <button
          type="button"
          disabled={isRolling || isMoving || Boolean(winner) || !isMyTurn}
          onClick={() => handleRollDice()}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden select-none border-2 sm:border-3 transition-colors duration-200 ${
            !isMyTurn
              ? 'opacity-50 cursor-not-allowed grayscale-30 ring-1 ring-stone-600 bg-stone-100 border-stone-400'
              : isP1
              ? 'bg-gradient-to-b from-white via-blue-50 to-blue-100 border-blue-500 ring-2 sm:ring-3 ring-blue-400/80 shadow-[0_0_16px_rgba(59,130,246,0.6)] cursor-pointer'
              : 'bg-gradient-to-b from-white via-emerald-50 to-emerald-100 border-emerald-500 ring-2 sm:ring-3 ring-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.6)] cursor-pointer'
          }`}
          title={
            !isMyTurn
              ? `En attente du tour de ${currentTurn === 'p1' ? (p1.name || 'MS') : (p2.name || 'ST')}`
              : `Au tour de ${currentTurn === 'p1' ? (p1.name || 'MS') : (p2.name || 'ST')} - Cliquez pour lancer le dé`
          }
        >
          {isRolling ? (
            <motion.div
              key={`rolling-${rollingFace}`}
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 0.22, repeat: Infinity, ease: 'linear' }}
              className="w-full h-full p-2 flex items-center justify-center filter blur-[1px]"
            >
              {renderDiceDots(rollingFace)}
            </motion.div>
          ) : diceValue ? (
            <div className="w-full h-full p-2 flex items-center justify-center">
              {renderDiceDots(diceValue)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1">
              <span className="text-2xl leading-none">🎲</span>
              {isMyTurn && !isMoving ? (
                <span
                  className={`text-[9px] font-black uppercase tracking-wider mt-0.5 leading-none ${
                    isP1 ? 'text-blue-700' : 'text-emerald-700'
                  }`}
                >
                  Lancer
                </span>
              ) : (
                <span className="text-[8px] font-bold text-stone-500 mt-0.5 leading-none">
                  {isP1 ? 'MS' : 'ST'}
                </span>
              )}
            </div>
          )}
        </button>

        {/* Turn status badge under the fixed dice - Stable et sans déplacement */}
        <div
          className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center justify-center gap-1 shadow-xs transition-colors duration-200 whitespace-nowrap ${
            isP1
              ? 'bg-blue-500/25 text-blue-200 border border-blue-400/50 ring-1 ring-blue-400/40'
              : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 ring-1 ring-emerald-400/40'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isP1 ? 'bg-blue-400' : 'bg-emerald-400'
            }`}
          />
          <span className="truncate max-w-[70px]">
            {isRolling
              ? 'Lancer...'
              : diceValue
              ? `Dé : ${diceValue}`
              : isP1
              ? `${p1.name || 'MS'} au tour`
              : `${p2.name || 'ST'} au tour`}
          </span>
        </div>
      </div>

      {/* Right: Player 2 (ST - Vert) - Totalement stable sans transform scale */}
      <div
        className={`flex-1 min-w-0 max-w-[135px] sm:max-w-[150px] flex items-center gap-1.5 sm:gap-2 p-1.5 px-2 rounded-xl transition-colors duration-200 flex-row-reverse text-right ${
          !isP1
            ? 'bg-emerald-600/70 border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/50'
            : 'bg-emerald-950/40 border border-emerald-900/50 opacity-60'
        }`}
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-xs overflow-hidden">
            {p2.avatar ? (
              <img src={p2.avatar} alt={p2.name} className="w-full h-full object-cover" />
            ) : (
              <span>ST</span>
            )}
          </div>
          {!isP1 && (
            <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-white shadow-xs" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-end gap-1">
            {gameMode === 'live' && activePartnerId === 'p2' && (
              <span className="text-[8px] bg-emerald-400/30 text-emerald-200 border border-emerald-400/40 px-1 rounded-sm font-semibold shrink-0">
                Toi
              </span>
            )}
            <span className="font-extrabold text-amber-300 text-xs truncate block leading-tight">
              {gameMode === 'ai' ? 'ST (IA)' : p2.name || 'ST'}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            {gameMode === 'live' ? (
              <span
                className={`text-[8px] font-bold px-1 rounded-sm shrink-0 ${
                  currentTurn === 'p2'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {currentTurn === 'p2' ? '🟢 Tour' : 'Attente'}
              </span>
            ) : (
              !isP1 && (
                <span className="text-[8px] font-extrabold px-1 rounded-sm bg-emerald-500 text-white shadow-2xs shrink-0">
                  Au tour
                </span>
              )
            )}
            <span className="text-[10px] text-emerald-200 block leading-tight shrink-0">
              {p2HomeCount}/{tokensPerPlayer} 🏠
            </span>
          </div>
        </div>
      </div>
    </div>

      {/* Narrative event text with interactive roll feedback */}
      <div className="flex items-center justify-center gap-1.5 min-h-[22px] px-2 max-w-sm">
        {diceValue && (
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] font-black text-white shadow-xs shrink-0 ${
              isP1 ? 'bg-blue-600' : 'bg-emerald-600'
            }`}
          >
            Dé : {diceValue}
          </span>
        )}
        <p className="text-[11px] font-medium text-stone-600 text-center truncate">
          {lastEventText}
        </p>
      </div>

      {/* Winner Celebration Modal */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-stone-200 text-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-blue-500 text-white mx-auto flex items-center justify-center text-2xl shadow-md">
                👑
              </div>

              <div>
                <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
                  Victoire de {winner === 'p1' ? p1.name : p2.name} !
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Tous les pions sont rentrés victorieusement !
                </p>
              </div>

              {/* Gage Box */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600" />
                  <span>Gage pour {winner === 'p1' ? p2.name : p1.name}</span>
                </span>
                <p className="text-xs font-semibold text-stone-800 italic">
                  « {selectedPledge} »
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-1.5 pt-1">
                {onSendChatMessage && (
                  <button
                    type="button"
                    onClick={handleShareResultToChat}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{sentToChatToast ? 'Envoyé ! 💌' : 'Partager au chat'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetGame}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  Revanche ! ⚔️
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
