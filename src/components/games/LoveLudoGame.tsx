import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  MessageCircle,
  Volume2,
  Crown,
  Heart,
  Bot,
  Users,
  Radio,
  Dices,
  Flame,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { CoupleProfile, PartnerId, LudoToken, LudoGameSession } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import { subscribeLudoGame, saveLudoGame } from '../../lib/firestoreService';

// Coordinates on 15x15 standard Ludo grid (0 to 14)
// Total 52 main perimeter squares in clockwise order
const TRACK_COORDINATES: [number, number][] = [
  [1, 8],  // 0 - P1 Start (Star)
  [2, 8],  // 1
  [3, 8],  // 2
  [4, 8],  // 3
  [5, 8],  // 4
  [6, 9],  // 5
  [6, 10], // 6
  [6, 11], // 7
  [6, 12], // 8 - Star
  [6, 13], // 9
  [6, 14], // 10
  [7, 14], // 11
  [8, 14], // 12
  [8, 13], // 13 - Star (P3 start)
  [8, 12], // 14
  [8, 11], // 15
  [8, 10], // 16
  [8, 9],  // 17
  [9, 8],  // 18
  [10, 8], // 19
  [11, 8], // 20
  [12, 8], // 21 - Star
  [13, 8], // 22
  [14, 8], // 23
  [14, 7], // 24
  [14, 6], // 25
  [13, 6], // 26 - P2 Start (Star)
  [12, 6], // 27
  [11, 6], // 28
  [10, 6], // 29
  [9, 6],  // 30
  [8, 5],  // 31
  [8, 4],  // 32
  [8, 3],  // 33
  [8, 2],  // 34 - Star
  [8, 1],  // 35
  [8, 0],  // 36
  [7, 0],  // 37
  [6, 0],  // 38
  [6, 1],  // 39 - Star (P4 start)
  [6, 2],  // 40
  [6, 3],  // 41
  [6, 4],  // 42
  [6, 5],  // 43
  [5, 6],  // 44
  [4, 6],  // 45
  [3, 6],  // 46
  [2, 6],  // 47 - Star
  [1, 6],  // 48
  [0, 6],  // 49
  [0, 7],  // 50
  [0, 8],  // 51
];

// Safe track indexes where pieces cannot be knocked out
const SAFE_TRACK_INDEXES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// P1 Home stretch coordinates (steps 51 to 55) -> step 56 is home finish
const P1_HOME_STRETCH: [number, number][] = [
  [1, 7], // 51
  [2, 7], // 52
  [3, 7], // 53
  [4, 7], // 54
  [5, 7], // 55
];

// P2 Home stretch coordinates (steps 51 to 55) -> step 56 is home finish
const P2_HOME_STRETCH: [number, number][] = [
  [13, 7], // 51
  [12, 7], // 52
  [11, 7], // 53
  [10, 7], // 54
  [9, 7],  // 55
];

// Yard base coordinates (visual positions inside the 6x6 corner box)
const P1_YARD_SPOTS: [number, number][] = [
  [1.5, 10.5],
  [4.5, 10.5],
  [1.5, 13.5],
  [4.5, 13.5],
];

const P2_YARD_SPOTS: [number, number][] = [
  [10.5, 1.5],
  [13.5, 1.5],
  [10.5, 4.5],
  [13.5, 4.5],
];

// Default romantic pledges
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
    mediaType?: 'image' | 'audio' | 'video';
  }) => void;
}

export const LoveLudoGame: React.FC<LoveLudoGameProps> = ({
  profile,
  activePartnerId,
  onSendChatMessage,
}) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  // Settings
  const [tokensPerPlayer, setTokensPerPlayer] = useState<2 | 4>(2);
  const [gameMode, setGameMode] = useState<'live' | 'local' | 'ai'>('live');

  // Core Game State
  const [currentTurn, setCurrentTurn] = useState<PartnerId>('p1');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [winner, setWinner] = useState<PartnerId | null>(null);
  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [selectedPledge, setSelectedPledge] = useState<string>(LUDO_PLEDGES[0]);
  const [lastEventText, setLastEventText] = useState<string>('Lancez le dé pour commencer la partie !');
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
  const activeTokensP1 = useMemo(() => tokensP1.slice(0, tokensPerPlayer), [tokensP1, tokensPerPlayer]);
  const activeTokensP2 = useMemo(() => tokensP2.slice(0, tokensPerPlayer), [tokensP2, tokensPerPlayer]);

  // Real-time broadcast and sync
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isSyncingFromRemote = useRef<boolean>(false);

  // Synchronisation BroadcastChannel
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel('ludo_king_channel');
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
    setCurrentTurn(session.currentTurn);
    setDiceValue(session.diceValue);
    setIsRolling(session.isRolling);
    setConsecutiveSixes(session.consecutiveSixes);
    setWinner(session.winner);
    if (typeof session.p1Wins === 'number') setP1Wins(session.p1Wins);
    if (typeof session.p2Wins === 'number') setP2Wins(session.p2Wins);
    if (session.selectedPledge) setSelectedPledge(session.selectedPledge);
    if (session.lastMoveText) setLastEventText(session.lastMoveText);
    if (session.tokensPerPlayer) setTokensPerPlayer(session.tokensPerPlayer);

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
        // If on path or home stretch, cannot overshoot 56
        return t.step + roll <= 56;
      });
    },
    [activeTokensP1, activeTokensP2]
  );

  const playableTokens = useMemo(() => {
    return getPlayableTokens(currentTurn, diceValue);
  }, [currentTurn, diceValue, getPlayableTokens]);

  // Turn management helper
  const nextTurnPlayer = (player: PartnerId) => (player === 'p1' ? 'p2' : 'p1');

  // Handle dice rolling
  const handleRollDice = () => {
    if (isRolling || winner) return;

    // Turn check for live mode
    if (gameMode === 'live' && currentTurn !== activePartnerId) {
      soundEffects.playSoftTap();
      return;
    }

    // AI turn check
    if (gameMode === 'ai' && currentTurn === 'p2') return;

    soundEffects.playDiceRoll();
    setIsRolling(true);
    setDiceValue(null);

    // Random roll
    const finalRoll = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setIsRolling(false);
      setDiceValue(finalRoll);

      const nextSixCount = finalRoll === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(nextSixCount);

      const rollingPartnerName = currentTurn === 'p1' ? p1.name : p2.name;

      // 3 consecutive 6s rule -> pass turn!
      if (nextSixCount >= 3) {
        soundEffects.playSoftTap();
        const nextPlayer = nextTurnPlayer(currentTurn);
        const text = `3 fois 6 d'affilée pour ${rollingPartnerName} ! Le tour passe à ${nextPlayer === 'p1' ? p1.name : p2.name}.`;
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
        // No moves possible -> automatic turn pass
        const nextPlayer = nextTurnPlayer(currentTurn);
        const text = `${rollingPartnerName} a fait un ${finalRoll}. Aucun coup possible !`;
        setLastEventText(text);

        // If not a 6, pass turn
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
          // Rolled 6 with no moves (all finished or overshooting), player gets to roll again!
          setLastEventText(`${rollingPartnerName} a fait un 6 ! Rejouez.`);
          syncSessionToCloud({
            diceValue: finalRoll,
            lastMoveText: `${rollingPartnerName} a fait un 6 ! Rejouez.`,
          });
        }
      } else if (availableMoves.length === 1) {
        // Exactly one move -> auto execute after brief visual feedback
        const text = `${rollingPartnerName} a fait un ${finalRoll} !`;
        setLastEventText(text);
        syncSessionToCloud({ diceValue: finalRoll, lastMoveText: text });
        setTimeout(() => {
          handleMoveToken(availableMoves[0], finalRoll);
        }, 600);
      } else {
        const text = `${rollingPartnerName} a fait un ${finalRoll} ! Choisissez un pion à déplacer.`;
        setLastEventText(text);
        syncSessionToCloud({ diceValue: finalRoll, lastMoveText: text });
      }
    }, 600);
  };

  // Move token logic
  const handleMoveToken = (token: LudoToken, rollToUse?: number) => {
    const roll = rollToUse ?? diceValue;
    if (!roll || winner || isRolling) return;

    const movingPlayer = token.player;
    if (movingPlayer !== currentTurn) return;

    soundEffects.playSoftTap();

    let newStep = token.step;
    let newState = token.state;
    let gotBonusTurn = false;
    let capturedOpponent = false;

    // 1. Moving out of Yard
    if (token.state === 'yard') {
      if (roll !== 6) return;
      newState = 'path';
      newStep = 0;
      gotBonusTurn = true; // Rolling a 6 gives another roll
    } else {
      // 2. Advancing along path / home run
      newStep = token.step + roll;
      if (newStep > 56) return; // Overshoot guard

      if (newStep === 56) {
        newState = 'finished';
        soundEffects.playSuccessSparkle();
        triggerHeartConfetti();
        gotBonusTurn = true; // Reaching home gives bonus turn
      } else if (newStep >= 51) {
        newState = 'home_run';
      } else {
        newState = 'path';
      }
    }

    // Compute board track index if on main path
    const movingTrackIndex =
      newState === 'path'
        ? movingPlayer === 'p1'
          ? newStep
          : (26 + newStep) % 52
        : null;

    // Check for CAPTURE of opponent's token!
    let nextP1Tokens = [...tokensP1];
    let nextP2Tokens = [...tokensP2];

    if (movingTrackIndex !== null && !SAFE_TRACK_INDEXES.has(movingTrackIndex)) {
      const opponentPlayer = nextTurnPlayer(movingPlayer);
      const opponentTokens = opponentPlayer === 'p1' ? nextP1Tokens : nextP2Tokens;

      const capturedIdx = opponentTokens.findIndex((op) => {
        if (op.state !== 'path') return false;
        const opTrackIdx = opponentPlayer === 'p1' ? op.step : (26 + op.step) % 52;
        return opTrackIdx === movingTrackIndex;
      });

      if (capturedIdx >= 0) {
        // KNOCKOUT / CAPTURE !
        capturedOpponent = true;
        gotBonusTurn = true; // Capturing gives another roll
        soundEffects.playVictoryChime();
        triggerHeartConfetti();

        const updatedOpponent = {
          ...opponentTokens[capturedIdx],
          state: 'yard' as const,
          step: 0,
        };

        if (opponentPlayer === 'p1') {
          nextP1Tokens[capturedIdx] = updatedOpponent;
        } else {
          nextP2Tokens[capturedIdx] = updatedOpponent;
        }
      }
    }

    // Apply token move
    const updatedMoverToken: LudoToken = {
      ...token,
      step: newStep,
      state: newState,
    };

    if (movingPlayer === 'p1') {
      const idx = nextP1Tokens.findIndex((t) => t.id === token.id);
      if (idx >= 0) nextP1Tokens[idx] = updatedMoverToken;
      setTokensP1(nextP1Tokens);
    } else {
      const idx = nextP2Tokens.findIndex((t) => t.id === token.id);
      if (idx >= 0) nextP2Tokens[idx] = updatedMoverToken;
      setTokensP2(nextP2Tokens);
    }

    // Check WIN condition
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

      const winText = `🏆 VICTOIRE ÉCLATANTE DE ${winnerName.toUpperCase()} AU LUDO ! 🎉`;
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

    // Event text
    const moverName = movingPlayer === 'p1' ? p1.name : p2.name;
    let moveMsg = `${moverName} a avancé son pion !`;
    if (newState === 'finished') {
      moveMsg = `🎉 ${moverName} a rentré un pion à la maison ! Rejouez !`;
    } else if (capturedOpponent) {
      moveMsg = `💥 BINGO ! ${moverName} a capturé un pion adverse ! Rejouez !`;
    } else if (roll === 6) {
      moveMsg = `🎲 Un 6 ! ${moverName} rejoue !`;
    }

    setLastEventText(moveMsg);

    // Next turn determination: rolling a 6, capturing, or reaching home grants an extra roll
    if (gotBonusTurn || roll === 6) {
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
    if (gameMode !== 'ai' || currentTurn !== 'p2' || winner || isRolling) return;

    const timer = setTimeout(() => {
      if (diceValue === null) {
        handleRollDice();
      } else {
        const moves = getPlayableTokens('p2', diceValue);
        if (moves.length > 0) {
          // AI strategy: Prioritize capturing > moving home > advancing
          const chosen = moves[Math.floor(Math.random() * moves.length)];
          handleMoveToken(chosen, diceValue);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameMode, currentTurn, diceValue, winner, isRolling, getPlayableTokens]);

  // Reset Game
  const handleResetGame = () => {
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
    setConsecutiveSixes(0);
    setCurrentTurn('p1');
    setLastEventText('Nouvelle partie lancée ! À toi de jouer.');

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

    const summary = `🎲 *Ludo King Complice : Victoire de ${winnerName} !* 👑\nScore de la session : ${p1.name} ${p1Wins} - ${p2Wins} ${p2.name}\n\n🌹 Le gage amoureux pour ${loserName} :\n« ${selectedPledge} » ❤️`;

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

    // 2. Finished in Home Center
    if (token.state === 'finished') {
      // Offset slightly inside finish triangle
      const offset = (indexInPlayer - 1.5) * 20;
      if (isP1) {
        return { x: 700, y: 750 + offset };
      }
      return { x: 800, y: 750 + offset };
    }

    // 3. In Home Stretch
    if (token.state === 'home_run') {
      const stretchIdx = Math.min(Math.max(token.step - 51, 0), 4);
      const coord = isP1 ? P1_HOME_STRETCH[stretchIdx] : P2_HOME_STRETCH[stretchIdx];
      return { x: coord[0] * 100 + 50, y: coord[1] * 100 + 50 };
    }

    // 4. On main track (0..50)
    const trackIndex = isP1 ? token.step : (26 + token.step) % 52;
    const coord = TRACK_COORDINATES[trackIndex] || [1, 8];
    return { x: coord[0] * 100 + 50, y: coord[1] * 100 + 50 };
  };

  const isMyTurn = gameMode === 'local' || (gameMode === 'live' && currentTurn === activePartnerId) || (gameMode === 'ai' && currentTurn === 'p1');

  return (
    <div className="space-y-3.5 max-w-xl mx-auto box-border select-none">
      {/* 1. Header Minimal & Sélecteur de Mode */}
      <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            🎲
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-xs sm:text-sm text-stone-900 truncate flex items-center gap-1.5 font-serif-romantic">
              <span>Ludo King à Deux</span>
              {gameMode === 'live' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Direct
                </span>
              )}
            </h2>
            <p className="text-[10px] text-stone-500 truncate">
              {p1.name} (Rouge) vs {p2.name} (Vert)
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setGameMode('live')}
            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
              gameMode === 'live' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Direct ⚡
          </button>
          <button
            type="button"
            onClick={() => setGameMode('local')}
            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
              gameMode === 'local' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Local 👥
          </button>
          <button
            type="button"
            onClick={() => setGameMode('ai')}
            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
              gameMode === 'ai' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            IA Cupidon 🤖
          </button>
        </div>
      </div>

      {/* 2. Top Player HUD: Safi (Player 2 - Vert/Emeraude) */}
      <div
        className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${
          currentTurn === 'p2'
            ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/50'
            : 'bg-white border-stone-200/80 opacity-80'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-xs border-2 border-white overflow-hidden">
              {p2.avatar ? (
                <img src={p2.avatar} alt={p2.name} className="w-full h-full object-cover" />
              ) : (
                <span>{p2.name.charAt(0)}</span>
              )}
            </div>
            {currentTurn === 'p2' && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-xs">
                ★
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">{p2.name}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                Vert 🟢
              </span>
            </div>
            <p className="text-[10px] text-stone-500">
              {activeTokensP2.filter((t) => t.state === 'finished').length} / {tokensPerPlayer} pions rentrés
            </p>
          </div>
        </div>

        {/* Dice Tray for Player 2 */}
        <div className="flex items-center gap-2 shrink-0">
          {currentTurn === 'p2' && diceValue && (
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-emerald-400 text-emerald-600 font-black text-lg flex items-center justify-center shadow-xs animate-bounce">
              {diceValue}
            </div>
          )}
          <button
            type="button"
            disabled={currentTurn !== 'p2' || isRolling || (!isMyTurn && gameMode === 'live')}
            onClick={handleRollDice}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold transition-all shadow-xs cursor-pointer ${
              currentTurn === 'p2'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white ring-2 ring-emerald-300 active:scale-95 animate-pulse'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            {isRolling && currentTurn === 'p2' ? (
              <Dices className="w-5 h-5 animate-spin" />
            ) : diceValue && currentTurn === 'p2' ? (
              <span>{diceValue}</span>
            ) : (
              <span>🎲</span>
            )}
          </button>
        </div>
      </div>

      {/* 3. The Authentic 15x15 Ludo King SVG Board */}
      <div className="relative w-full aspect-square bg-[#FAF6F0] rounded-3xl p-1.5 sm:p-2.5 border-4 border-amber-800/80 shadow-md box-border overflow-hidden">
        <svg
          viewBox="0 0 1500 1500"
          className="w-full h-full select-none"
          style={{ touchAction: 'manipulation' }}
        >
          {/* Base Grid Background */}
          <rect x="0" y="0" width="1500" height="1500" fill="#FFFDF8" />

          {/* 1. Player 1 Yard (Bottom-Left: Rows 9..14, Cols 0..5 -> Red/Rose) */}
          <rect x="0" y="900" width="600" height="600" fill="#F43F5E" />
          <rect x="60" y="960" width="480" height="480" rx="30" fill="#FFF1F2" />
          <text x="300" y="1030" fill="#E11D48" fontSize="32" fontWeight="bold" textAnchor="middle">
            {p1.name} (Rouge)
          </text>
          {P1_YARD_SPOTS.map((s, idx) => (
            <circle
              key={`p1_spot_${idx}`}
              cx={s[0] * 100 + 50}
              cy={s[1] * 100 + 50}
              r="40"
              fill="#F43F5E"
              opacity="0.25"
            />
          ))}

          {/* 2. Player 2 Yard (Top-Right: Rows 0..5, Cols 9..14 -> Green/Emerald) */}
          <rect x="900" y="0" width="600" height="600" fill="#10B981" />
          <rect x="960" y="60" width="480" height="480" rx="30" fill="#ECFDF5" />
          <text x="1200" y="130" fill="#047857" fontSize="32" fontWeight="bold" textAnchor="middle">
            {p2.name} (Vert)
          </text>
          {P2_YARD_SPOTS.map((s, idx) => (
            <circle
              key={`p2_spot_${idx}`}
              cx={s[0] * 100 + 50}
              cy={s[1] * 100 + 50}
              r="40"
              fill="#10B981"
              opacity="0.25"
            />
          ))}

          {/* 3. Decorative Top-Left Yard (Yellow/Amber) */}
          <rect x="0" y="0" width="600" height="600" fill="#F59E0B" />
          <rect x="60" y="60" width="480" height="480" rx="30" fill="#FEF3C7" />
          <text x="300" y="290" fill="#D97706" fontSize="48" textAnchor="middle">
            👑
          </text>
          <text x="300" y="360" fill="#B45309" fontSize="30" fontWeight="bold" textAnchor="middle">
            Ludo King
          </text>

          {/* 4. Decorative Bottom-Right Yard (Blue/Indigo) */}
          <rect x="900" y="900" width="600" height="600" fill="#3B82F6" />
          <rect x="960" y="960" width="480" height="480" rx="30" fill="#EFF6FF" />
          <text x="1200" y="1190" fill="#2563EB" fontSize="48" textAnchor="middle">
            💖
          </text>
          <text x="1200" y="1260" fill="#1D4ED8" fontSize="28" fontWeight="bold" textAnchor="middle">
            Med & Safi
          </text>

          {/* 5. Center Home Finish Triangles (Cols 6..8, Rows 6..8) */}
          <rect x="600" y="600" width="300" height="300" fill="#FFFFFF" />
          {/* P1 Red Finish Triangle */}
          <polygon points="600,600 750,750 600,900" fill="#F43F5E" />
          {/* P2 Green Finish Triangle */}
          <polygon points="900,600 750,750 900,900" fill="#10B981" />
          {/* Top Yellow Finish Triangle */}
          <polygon points="600,600 750,750 900,600" fill="#F59E0B" />
          {/* Bottom Blue Finish Triangle */}
          <polygon points="600,900 750,750 900,900" fill="#3B82F6" />

          {/* Central Gold Trophy / Crown */}
          <circle cx="750" cy="750" r="38" fill="#FBBF24" stroke="#D97706" strokeWidth="4" />
          <text x="750" y="763" fill="#78350F" fontSize="30" textAnchor="middle">
            🏆
          </text>

          {/* 6. Perimeter Path Squares & Home Stretches */}
          {TRACK_COORDINATES.map((c, idx) => {
            const isP1Start = idx === 0;
            const isP2Start = idx === 26;
            const isSafe = SAFE_TRACK_INDEXES.has(idx);

            let fill = '#FFFFFF';
            if (isP1Start) fill = '#FFE4E6';
            if (isP2Start) fill = '#D1FAE5';

            return (
              <g key={`track_${idx}`}>
                <rect
                  x={c[0] * 100}
                  y={c[1] * 100}
                  width="100"
                  height="100"
                  fill={fill}
                  stroke="#E2E8F0"
                  strokeWidth="2"
                />
                {isSafe && (
                  <text
                    x={c[0] * 100 + 50}
                    y={c[1] * 100 + 64}
                    fill={isP1Start ? '#E11D48' : isP2Start ? '#059669' : '#94A3B8'}
                    fontSize="36"
                    textAnchor="middle"
                  >
                    ★
                  </text>
                )}
              </g>
            );
          })}

          {/* P1 Red Home Stretch (Cols 1..5, Row 7) */}
          {P1_HOME_STRETCH.map((c, idx) => (
            <rect
              key={`p1_home_${idx}`}
              x={c[0] * 100}
              y={c[1] * 100}
              width="100"
              height="100"
              fill="#F43F5E"
              stroke="#BE123C"
              strokeWidth="2"
            />
          ))}

          {/* P2 Green Home Stretch (Cols 9..13, Row 7) */}
          {P2_HOME_STRETCH.map((c, idx) => (
            <rect
              key={`p2_home_${idx}`}
              x={c[0] * 100}
              y={c[1] * 100}
              width="100"
              height="100"
              fill="#10B981"
              stroke="#047857"
              strokeWidth="2"
            />
          ))}

          {/* 7. Animated Playable Tokens */}
          {/* Player 1 Tokens (Red) */}
          {activeTokensP1.map((t, idx) => {
            const pos = getTokenPosition(t, idx);
            const isPlayable = playableTokens.some((pt) => pt.id === t.id);

            return (
              <g
                key={t.id}
                onClick={() => isPlayable && handleMoveToken(t)}
                className={isPlayable ? 'cursor-pointer' : ''}
              >
                {/* Glow ring if playable */}
                {isPlayable && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="44"
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="6"
                    className="animate-ping"
                    opacity="0.8"
                  />
                )}
                {/* Token Outer Shadow & Base */}
                <circle cx={pos.x} cy={pos.y + 3} r="32" fill="#9F1239" opacity="0.3" />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="30"
                  fill="#E11D48"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  className={isPlayable ? 'animate-bounce' : ''}
                />
                <circle cx={pos.x} cy={pos.y} r="18" fill="#FFF1F2" />
                <text
                  x={pos.x}
                  y={pos.y + 6}
                  fill="#9F1239"
                  fontSize="18"
                  fontWeight="900"
                  textAnchor="middle"
                >
                  {p1.name.charAt(0) || 'M'}
                </text>
              </g>
            );
          })}

          {/* Player 2 Tokens (Green) */}
          {activeTokensP2.map((t, idx) => {
            const pos = getTokenPosition(t, idx);
            const isPlayable = playableTokens.some((pt) => pt.id === t.id);

            return (
              <g
                key={t.id}
                onClick={() => isPlayable && handleMoveToken(t)}
                className={isPlayable ? 'cursor-pointer' : ''}
              >
                {/* Glow ring if playable */}
                {isPlayable && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="44"
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="6"
                    className="animate-ping"
                    opacity="0.8"
                  />
                )}
                <circle cx={pos.x} cy={pos.y + 3} r="32" fill="#065F46" opacity="0.3" />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="30"
                  fill="#059669"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  className={isPlayable ? 'animate-bounce' : ''}
                />
                <circle cx={pos.x} cy={pos.y} r="18" fill="#ECFDF5" />
                <text
                  x={pos.x}
                  y={pos.y + 6}
                  fill="#065F46"
                  fontSize="18"
                  fontWeight="900"
                  textAnchor="middle"
                >
                  {p2.name.charAt(0) || 'S'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. Bottom Player HUD: Med (Player 1 - Rouge/Rose) */}
      <div
        className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${
          currentTurn === 'p1'
            ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/50'
            : 'bg-white border-stone-200/80 opacity-80'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-sm shadow-xs border-2 border-white overflow-hidden">
              {p1.avatar ? (
                <img src={p1.avatar} alt={p1.name} className="w-full h-full object-cover" />
              ) : (
                <span>{p1.name.charAt(0)}</span>
              )}
            </div>
            {currentTurn === 'p1' && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] shadow-xs">
                ★
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">{p1.name}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                Rouge 🔴
              </span>
            </div>
            <p className="text-[10px] text-stone-500">
              {activeTokensP1.filter((t) => t.state === 'finished').length} / {tokensPerPlayer} pions rentrés
            </p>
          </div>
        </div>

        {/* Dice Tray for Player 1 */}
        <div className="flex items-center gap-2 shrink-0">
          {currentTurn === 'p1' && diceValue && (
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-rose-400 text-rose-600 font-black text-lg flex items-center justify-center shadow-xs animate-bounce">
              {diceValue}
            </div>
          )}
          <button
            type="button"
            disabled={currentTurn !== 'p1' || isRolling || (!isMyTurn && gameMode === 'live')}
            onClick={handleRollDice}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold transition-all shadow-xs cursor-pointer ${
              currentTurn === 'p1'
                ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white ring-2 ring-rose-300 active:scale-95 animate-pulse'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            {isRolling && currentTurn === 'p1' ? (
              <Dices className="w-5 h-5 animate-spin" />
            ) : diceValue && currentTurn === 'p1' ? (
              <span>{diceValue}</span>
            ) : (
              <span>🎲</span>
            )}
          </button>
        </div>
      </div>

      {/* 5. Live Match Commentary & Action Banner */}
      <div className="bg-stone-900 text-white rounded-2xl px-3.5 py-2.5 shadow-xs flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">📢</span>
          <span className="font-semibold text-stone-200 truncate">{lastEventText}</span>
        </div>
        <button
          type="button"
          onClick={handleResetGame}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
          title="Recommencer la partie"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 6. Settings Controls: 2 pions vs 4 pions & Reset Scores */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 font-medium text-[11px]">Format :</span>
          <button
            type="button"
            onClick={() => {
              setTokensPerPlayer(2);
              handleResetGame();
            }}
            className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer transition-colors ${
              tokensPerPlayer === 2
                ? 'bg-rose-500 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            2 Pions (Rapide ⚡)
          </button>
          <button
            type="button"
            onClick={() => {
              setTokensPerPlayer(4);
              handleResetGame();
            }}
            className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer transition-colors ${
              tokensPerPlayer === 4
                ? 'bg-rose-500 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            4 Pions (Classique 👑)
          </button>
        </div>

        <span className="text-[11px] font-bold text-stone-600">
          Victoires : {p1.name} {p1Wins} - {p2Wins} {p2.name}
        </span>
      </div>

      {/* 7. Winner Modal & Pledge Dialog */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border-2 border-amber-300 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white mx-auto flex items-center justify-center text-3xl shadow-lg">
                👑
              </div>

              <div>
                <h3 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Victoire de {winner === 'p1' ? p1.name : p2.name} !
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Tous les pions sont rentrés victorieusement au centre du Ludo !
                </p>
              </div>

              {/* Gage Box */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-left space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600" />
                  <span>Gage Amoureux pour {winner === 'p1' ? p2.name : p1.name}</span>
                </span>
                <p className="text-xs font-semibold text-stone-800 font-serif-romantic italic">
                  « {selectedPledge} »
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {onSendChatMessage && (
                  <button
                    type="button"
                    onClick={handleShareResultToChat}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{sentToChatToast ? 'Envoyé dans le chat ! 💌' : 'Partager dans le chat'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetGame}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  Revanche immédiate ! ⚔️
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
