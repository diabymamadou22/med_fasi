import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  MessageCircle,
  Dices,
  Flame,
  Settings2,
} from 'lucide-react';
import { CoupleProfile, PartnerId, LudoToken, LudoGameSession } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import { subscribeLudoGame, saveLudoGame } from '../../lib/firestoreService';

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

// Yard base coordinates (matching 4 white circle spots in the screenshot)
// P1 (Blue - Bottom-Left: Cols 0..5, Rows 9..14)
const P1_YARD_SPOTS: [number, number][] = [
  [1.8, 10.8],
  [4.2, 10.8],
  [1.8, 13.2],
  [4.2, 13.2],
];

// P2 (Green - Top-Right: Cols 9..14, Rows 0..5)
const P2_YARD_SPOTS: [number, number][] = [
  [10.8, 1.8],
  [13.2, 1.8],
  [10.8, 4.2],
  [13.2, 4.2],
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
}

export const LoveLudoGame: React.FC<LoveLudoGameProps> = ({
  profile,
  activePartnerId,
  onSendChatMessage,
}) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  // Settings: 4 pieces standard (can toggle to 2)
  const [tokensPerPlayer, setTokensPerPlayer] = useState<2 | 4>(4);
  const [gameMode, setGameMode] = useState<'local' | 'live' | 'ai'>('local');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Core Game State
  const [currentTurn, setCurrentTurn] = useState<PartnerId>('p1');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
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

  // Real-time broadcast and sync
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isSyncingFromRemote = useRef<boolean>(false);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
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

  const playableTokens = useMemo(() => {
    return getPlayableTokens(currentTurn, diceValue);
  }, [currentTurn, diceValue, getPlayableTokens]);

  const nextTurnPlayer = (player: PartnerId) => (player === 'p1' ? 'p2' : 'p1');

  // Handle dice rolling
  const handleRollDice = () => {
    if (isRolling || isMoving || winner) return;

    if (gameMode === 'ai' && currentTurn === 'p2') return;

    soundEffects.playDiceRoll();
    setIsRolling(true);
    setDiceValue(null);

    const finalRoll = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setIsRolling(false);
      setDiceValue(finalRoll);

      const nextSixCount = finalRoll === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(nextSixCount);

      const rollingPartnerName = currentTurn === 'p1' ? p1.name : p2.name;

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

      // Check legal moves
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
          }, 1100);
        } else {
          setLastEventText(`${rollingPartnerName} a fait un 6 ! Rejouez.`);
          syncSessionToCloud({
            diceValue: finalRoll,
            lastMoveText: `${rollingPartnerName} a fait un 6 ! Rejouez.`,
          });
        }
      } else if (availableMoves.length === 1) {
        // Exactly 1 move -> execute step-by-step
        const text = `${rollingPartnerName} a fait un ${finalRoll} !`;
        setLastEventText(text);
        syncSessionToCloud({ diceValue: finalRoll, lastMoveText: text });
        setTimeout(() => {
          handleStepByStepMove(availableMoves[0], finalRoll);
        }, 350);
      } else {
        const text = `Fait un ${finalRoll} ! Touchez un pion à déplacer.`;
        setLastEventText(text);
        syncSessionToCloud({ diceValue: finalRoll, lastMoveText: text });
      }
    }, 450);
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
  const handleStepByStepMove = (token: LudoToken, rollToUse?: number) => {
    const roll = rollToUse ?? diceValue;
    if (!roll || winner || isRolling || isMoving) return;

    const movingPlayer = token.player;
    if (movingPlayer !== currentTurn) return;

    // 1. If in yard (rolling 6), exit from yard to step 0
    if (token.state === 'yard') {
      if (roll !== 6) return;
      setIsMoving(true);
      soundEffects.playSoftTap();

      setTimeout(() => {
        const exitedToken: LudoToken = {
          ...token,
          state: 'path',
          step: 0,
        };
        updateSingleToken(exitedToken, movingPlayer);
        setIsMoving(false);

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
      }, 250);
      return;
    }

    // 2. Token is already on track or home stretch: move step-by-step!
    const startStep = token.step;
    const targetStep = startStep + roll;
    if (targetStep > 56) return; // Cannot overshoot

    setIsMoving(true);
    let currentStep = startStep;
    const stepInterval = 130; // 130ms per square -> smooth, fluid and tactile!

    const stepNext = () => {
      currentStep += 1;
      soundEffects.playSoftTap();

      const interimState =
        currentStep === 56 ? 'finished' : currentStep >= 51 ? 'home_run' : 'path';

      const interimToken: LudoToken = {
        ...token,
        step: currentStep,
        state: interimState,
      };

      updateSingleToken(interimToken, movingPlayer);

      if (currentStep < targetStep) {
        moveTimerRef.current = setTimeout(stepNext, stepInterval);
      } else {
        // Reached destination! Finalize move
        finalizeMove(interimToken, movingPlayer, roll);
      }
    };

    moveTimerRef.current = setTimeout(stepNext, stepInterval);
  };

  // Finalize move after step-by-step animation completes
  const finalizeMove = (finalToken: LudoToken, movingPlayer: PartnerId, roll: number) => {
    setIsMoving(false);

    let gotBonusTurn = roll === 6;
    let capturedOpponent = false;

    // Check arrival at center home
    if (finalToken.step === 56) {
      soundEffects.playSuccessSparkle();
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

      // Safe squares cannot be captured
      if (!SAFE_TRACK_INDEXES.has(finalTrackIndex)) {
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
          soundEffects.playVictoryChime();
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
        handleRollDice();
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
          handleStepByStepMove(chosen, diceValue);
        }
      }
    }, 850);

    return () => clearTimeout(timer);
  }, [gameMode, currentTurn, diceValue, winner, isRolling, isMoving, getPlayableTokens, tokensP1]);

  // Reset Game
  const handleResetGame = () => {
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
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
        [-9, -9],
        [9, -9],
        [-9, 9],
        [9, 9],
      ];
      offsetX = offsets[idxInSame % 4][0];
      offsetY = offsets[idxInSame % 4][1];
    }

    return { x: coord[0] * 100 + 50 + offsetX, y: coord[1] * 100 + 50 + offsetY };
  };

  const p1HomeCount = activeTokensP1.filter((t) => t.state === 'finished').length;
  const p2HomeCount = activeTokensP2.filter((t) => t.state === 'finished').length;
  const isP1 = currentTurn === 'p1';

  // Render 6-dot face on the Ludo King dice button
  const renderDiceDots = (value: number | null) => {
    if (!value) return null;
    const dot = 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-600 shadow-2xs shrink-0';

    switch (value) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-blue-600 shadow-xs" />
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
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-600 shadow-xs z-10" />
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

  // Render individual Ludo King Pin Pawn (matching the screenshot exactly)
  const renderPawn = (token: LudoToken, index: number) => {
    const isPlayer1 = token.player === 'p1';
    const pos = getTokenPosition(token, index);
    const isPlayable = playableTokens.some((pt) => pt.id === token.id);

    return (
      <g
        key={token.id}
        onClick={() => !isMoving && isPlayable && handleStepByStepMove(token)}
        onTouchEnd={(e) => {
          if (!isMoving && isPlayable) {
            e.preventDefault();
            handleStepByStepMove(token);
          }
        }}
        className={isPlayable && !isMoving ? 'cursor-pointer' : ''}
      >
        {/* Invisible touch target */}
        <circle cx={pos.x} cy={pos.y} r="48" fill="transparent" />

        {/* Contact shadow at base */}
        <ellipse
          cx={pos.x}
          cy={pos.y + 16}
          rx="22"
          ry="7"
          fill="#000000"
          opacity="0.35"
        />

        {/* Glowing Turn Halo (NO BOUNCING, just soft aura as requested) */}
        {isPlayable && !isMoving && (
          <>
            <circle
              cx={pos.x}
              cy={pos.y - 4}
              r="30"
              fill="none"
              stroke="#FACC15"
              strokeWidth="3.5"
              strokeDasharray="6 4"
              className="animate-spin"
              style={{
                animationDuration: '6s',
                transformOrigin: `${pos.x}px ${pos.y - 4}px`,
              }}
              opacity="0.95"
            />
            <circle
              cx={pos.x}
              cy={pos.y - 4}
              r="26"
              fill="#FEF08A"
              opacity="0.25"
              className="animate-pulse"
            />
          </>
        )}

        {/* 3D Pin Skirt / Flared Conical Body */}
        <path
          d={`M ${pos.x - 13} ${pos.y - 4} 
              C ${pos.x - 15} ${pos.y + 9}, ${pos.x - 18} ${pos.y + 14}, ${pos.x - 16} ${pos.y + 17}
              C ${pos.x - 9} ${pos.y + 20}, ${pos.x + 9} ${pos.y + 20}, ${pos.x + 16} ${pos.y + 17}
              C ${pos.x + 18} ${pos.y + 14}, ${pos.x + 15} ${pos.y + 9}, ${pos.x + 13} ${pos.y - 4}
              Z`}
          fill={isPlayer1 ? '#FFFFFF' : '#FFFFFF'}
          stroke={isPlayer1 ? '#1D4ED8' : '#047857'}
          strokeWidth="2.5"
        />

        {/* Base Rim Color Band */}
        <ellipse
          cx={pos.x}
          cy={pos.y + 16}
          rx="14"
          ry="4"
          fill={isPlayer1 ? '#2563EB' : '#10B981'}
        />

        {/* Head Outer Chrome Rim */}
        <circle
          cx={pos.x}
          cy={pos.y - 6}
          r="19"
          fill="#FFFFFF"
          stroke="#94A3B8"
          strokeWidth="2"
        />

        {/* Head Inner Jewel Circle */}
        <circle
          cx={pos.x}
          cy={pos.y - 6}
          r="13.5"
          fill={isPlayer1 ? '#2563EB' : '#10B981'}
        />

        {/* Glass Specular Glint Reflection */}
        <ellipse
          cx={pos.x}
          cy={pos.y - 11}
          rx="9"
          ry="4"
          fill="#FFFFFF"
          opacity="0.65"
        />

        {/* Center Eye Dot / Finished Star */}
        {token.state === 'finished' ? (
          <text
            x={pos.x}
            y={pos.y - 1}
            fill="#FEF08A"
            fontSize="15"
            fontWeight="bold"
            textAnchor="middle"
          >
            ★
          </text>
        ) : (
          <circle
            cx={pos.x}
            cy={pos.y - 5.5}
            r="5"
            fill="#FFFFFF"
            opacity="0.9"
          />
        )}
      </g>
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

      {/* THE AUTHENTIC LUDO KING BOARD CONTAINER */}
      <div className="relative w-full max-w-[min(84vw,48vh,400px)] aspect-square bg-[#0b2853] p-1.5 sm:p-2 rounded-2xl shadow-xl border-2 border-[#1e4982]">
        <svg
          viewBox="0 0 1500 1500"
          className="w-full h-full select-none"
          style={{ touchAction: 'manipulation' }}
        >
          {/* Base Background Surface */}
          <rect x="0" y="0" width="1500" height="1500" fill="#FFFFFF" />

          {/* 1. TOP-LEFT: RED BASE (with 4 red circular token spots) */}
          <rect x="0" y="0" width="600" height="600" fill="#DC2626" />
          <rect x="60" y="60" width="480" height="480" rx="30" fill="#FFFFFF" />
          {/* 4 Red circular spots */}
          <circle cx="210" cy="210" r="45" fill="#DC2626" />
          <circle cx="390" cy="210" r="45" fill="#DC2626" />
          <circle cx="210" cy="390" r="45" fill="#DC2626" />
          <circle cx="390" cy="390" r="45" fill="#DC2626" />

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
          <rect x="960" y="60" width="480" height="480" rx="30" fill="#FFFFFF" />
          {/* 4 Green circular spots */}
          <circle cx="1110" cy="210" r="45" fill="#16A34A" />
          <circle cx="1290" cy="210" r="45" fill="#16A34A" />
          <circle cx="1110" cy="390" r="45" fill="#16A34A" />
          <circle cx="1290" cy="390" r="45" fill="#16A34A" />

          {/* 3. BOTTOM-LEFT: BLUE BASE (You / Med) */}
          <rect x="0" y="900" width="600" height="600" fill="#2563EB" />
          <rect x="60" y="960" width="480" height="480" rx="30" fill="#FFFFFF" />
          {/* 4 Blue circular spots */}
          <circle cx="210" cy="1110" r="45" fill="#2563EB" />
          <circle cx="390" cy="1110" r="45" fill="#2563EB" />
          <circle cx="210" cy="1290" r="45" fill="#2563EB" />
          <circle cx="390" cy="1290" r="45" fill="#2563EB" />
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
          <rect x="960" y="960" width="480" height="480" rx="30" fill="#FFFFFF" />
          {/* 4 Yellow circular spots */}
          <circle cx="1110" cy="1110" r="45" fill="#EAB308" />
          <circle cx="1290" cy="1110" r="45" fill="#EAB308" />
          <circle cx="1110" cy="1290" r="45" fill="#EAB308" />
          <circle cx="1290" cy="1290" r="45" fill="#EAB308" />

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

          {/* 9. RENDER AUTHENTIC LUDO PIN PAWNS */}
          {/* Player 1 (Blue / You) */}
          {activeTokensP1.map((t, idx) => renderPawn(t, idx))}

          {/* Player 2 (Green / Com) */}
          {activeTokensP2.map((t, idx) => renderPawn(t, idx))}
        </svg>
      </div>

      {/* DOCK CONTROLLER (Matching the reference screenshot) */}
      <div className="w-full bg-[#0a1e3f] rounded-2xl border-2 border-amber-400 p-2 shadow-lg flex items-center justify-between gap-2 text-white">
        {/* Left: Player 1 (You / Med) */}
        <div
          className={`flex items-center gap-2 p-1.5 px-2.5 rounded-xl transition-all min-w-0 ${
            isP1 ? 'bg-blue-600/50 border border-blue-400 shadow-xs' : 'opacity-70'
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-xs overflow-hidden">
              {p1.avatar ? (
                <img src={p1.avatar} alt={p1.name} className="w-full h-full object-cover" />
              ) : (
                <span>📍</span>
              )}
            </div>
            {isP1 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-amber-300 text-xs truncate block leading-tight">
              {p1.name}
            </span>
            <span className="text-[10px] text-blue-200 block leading-tight">
              {p1HomeCount}/{tokensPerPlayer} 🏠
            </span>
          </div>
        </div>

        {/* Center: The Iconic Dice Button (Cream/White face, blue dots, amber rim) */}
        <div className="flex flex-col items-center shrink-0">
          <button
            type="button"
            disabled={isRolling || isMoving || (gameMode === 'ai' && currentTurn === 'p2')}
            onClick={handleRollDice}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E0F2FE] border-3 border-amber-300 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 relative overflow-hidden ${
              isP1
                ? 'ring-3 ring-blue-400/60 hover:scale-105'
                : 'ring-3 ring-emerald-400/60 hover:scale-105'
            }`}
          >
            {isRolling ? (
              <Dices className="w-7 h-7 text-blue-600 animate-spin" />
            ) : diceValue ? (
              <div className="w-full h-full p-2">{renderDiceDots(diceValue)}</div>
            ) : (
              <span className="text-2xl">🎲</span>
            )}
          </button>
        </div>

        {/* Right: Player 2 (Computer / Safi) */}
        <div
          className={`flex items-center gap-2 p-1.5 px-2.5 rounded-xl transition-all flex-row-reverse text-right min-w-0 ${
            !isP1 ? 'bg-emerald-600/50 border border-emerald-400 shadow-xs' : 'opacity-70'
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-xs overflow-hidden">
              {p2.avatar ? (
                <img src={p2.avatar} alt={p2.name} className="w-full h-full object-cover" />
              ) : (
                <span>📍</span>
              )}
            </div>
            {!isP1 && (
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-amber-300 text-xs truncate block leading-tight">
              {gameMode === 'ai' ? 'Computer' : p2.name}
            </span>
            <span className="text-[10px] text-emerald-200 block leading-tight">
              {p2HomeCount}/{tokensPerPlayer} 🏠
            </span>
          </div>
        </div>
      </div>

      {/* Narrative event text */}
      <p className="text-[11px] text-stone-500 text-center truncate max-w-xs px-2">
        {lastEventText}
      </p>

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
