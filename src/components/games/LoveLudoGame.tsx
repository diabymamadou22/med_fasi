import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  MessageCircle,
  Dices,
  Flame,
  Settings2,
  Trophy,
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

// Yard base coordinates
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

  // Settings (Default: 4 pieces as requested, pass-and-play local)
  const [tokensPerPlayer, setTokensPerPlayer] = useState<2 | 4>(4);
  const [gameMode, setGameMode] = useState<'local' | 'live' | 'ai'>('local');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Core Game State
  const [currentTurn, setCurrentTurn] = useState<PartnerId>('p1');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [winner, setWinner] = useState<PartnerId | null>(null);
  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [selectedPledge, setSelectedPledge] = useState<string>(LUDO_PLEDGES[0]);
  const [lastEventText, setLastEventText] = useState<string>('À Med de lancer le dé !');
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
    if (isRolling || winner) return;

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
        const text = `3 fois 6 d'affilée ! Le tour passe à ${nextPlayer === 'p1' ? p1.name : p2.name}.`;
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
        const text = `${rollingPartnerName} a fait un ${finalRoll} !`;
        setLastEventText(text);
        syncSessionToCloud({ diceValue: finalRoll, lastMoveText: text });
        setTimeout(() => {
          handleMoveToken(availableMoves[0], finalRoll);
        }, 500);
      } else {
        const text = `Fait un ${finalRoll} ! Choisissez un pion à déplacer.`;
        setLastEventText(text);
        syncSessionToCloud({ diceValue: finalRoll, lastMoveText: text });
      }
    }, 450);
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
      gotBonusTurn = true;
    } else {
      newStep = token.step + roll;
      if (newStep > 56) return;

      if (newStep === 56) {
        newState = 'finished';
        soundEffects.playSuccessSparkle();
        triggerHeartConfetti();
        gotBonusTurn = true;
      } else if (newStep >= 51) {
        newState = 'home_run';
      } else {
        newState = 'path';
      }
    }

    const movingTrackIndex =
      newState === 'path'
        ? movingPlayer === 'p1'
          ? newStep
          : (26 + newStep) % 52
        : null;

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
        capturedOpponent = true;
        gotBonusTurn = true;
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
    if (newState === 'finished') {
      moveMsg = `🎉 ${moverName} a rentré un pion ! Rejouez !`;
    } else if (capturedOpponent) {
      moveMsg = `💥 Pion adverse capturé ! Rejouez !`;
    } else if (roll === 6) {
      moveMsg = `🎲 Un 6 ! ${moverName} rejoue !`;
    }

    setLastEventText(moveMsg);

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
          const chosen = moves[Math.floor(Math.random() * moves.length)];
          handleMoveToken(chosen, diceValue);
        }
      }
    }, 800);

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
    setLastEventText('Nouvelle partie ! À Med de lancer.');

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

    // 2. Finished in Home Center
    if (token.state === 'finished') {
      const offset = (indexInPlayer - 1.5) * 22;
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

    // Check multiple tokens on same square to offset cleanly
    const allSamePlayerTokens = isP1 ? tokensP1 : tokensP2;
    const sameSquareTokens = allSamePlayerTokens.filter(
      (t) => t.state === token.state && t.step === token.step
    );
    let offsetX = 0;
    let offsetY = 0;
    if (sameSquareTokens.length > 1) {
      const idxInSame = sameSquareTokens.findIndex((t) => t.id === token.id);
      const offsets = [
        [-10, -10],
        [10, -10],
        [-10, 10],
        [10, 10],
      ];
      offsetX = offsets[idxInSame % 4][0];
      offsetY = offsets[idxInSame % 4][1];
    }

    return { x: coord[0] * 100 + 50 + offsetX, y: coord[1] * 100 + 50 + offsetY };
  };

  const p1HomeCount = activeTokensP1.filter((t) => t.state === 'finished').length;
  const p2HomeCount = activeTokensP2.filter((t) => t.state === 'finished').length;
  const isP1 = currentTurn === 'p1';

  return (
    <div className="w-full max-w-md mx-auto box-border select-none flex flex-col items-center gap-2 overflow-hidden px-1">
      {/* 1. Header Ultra-Compact & Élégant (Sans fioritures) */}
      <div className="w-full flex items-center justify-between py-1 px-2 bg-white/90 backdrop-blur-xs rounded-xl border border-stone-200/70 shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">🎲</span>
          <span className="font-bold text-xs text-stone-900 tracking-tight">Ludo MS</span>
          <span className="text-[10px] text-stone-400 font-medium truncate">
            {p1Wins}-{p2Wins}
          </span>
        </div>

        {/* Action icons: Settings & Reset */}
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

      {/* Settings popdown (hidden by default to avoid screen overflow) */}
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
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  gameMode === 'local' ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                1 Écran
              </button>
              <button
                type="button"
                onClick={() => setGameMode('live')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  gameMode === 'live' ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                Direct ⚡
              </button>
              <button
                type="button"
                onClick={() => setGameMode('ai')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  gameMode === 'ai' ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                IA 🤖
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
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  tokensPerPlayer === 4 ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                4
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokensPerPlayer(2);
                  handleResetGame();
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  tokensPerPlayer === 2 ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                2
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Barre de Duel Intégrée (Ultra-plate, affiche les deux joueurs et le tour) */}
      <div className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white rounded-xl border border-stone-200/80 shadow-2xs gap-2">
        {/* Med (Rouge) */}
        <div
          className={`flex items-center gap-1.5 transition-all ${
            isP1 ? 'font-bold text-rose-600' : 'text-stone-400 opacity-70'
          }`}
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden border border-white shadow-2xs">
              {p1.avatar ? (
                <img src={p1.avatar} alt={p1.name} className="w-full h-full object-cover" />
              ) : (
                <span>{p1.name.charAt(0)}</span>
              )}
            </div>
            {isP1 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs truncate block max-w-[70px]">{p1.name}</span>
            <span className="text-[9px] text-stone-500 font-semibold block leading-none">
              {p1HomeCount}/{tokensPerPlayer} 🏠
            </span>
          </div>
        </div>

        {/* Statut Tour au centre */}
        <div className="flex flex-col items-center text-center px-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${
              isP1 ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isP1 ? `Tour de ${p1.name}` : `Tour de ${gameMode === 'ai' ? 'Cupidon' : p2.name}`}
          </span>
          <span className="text-[9px] text-stone-400 truncate max-w-[130px] mt-0.5">
            {isRolling
              ? '🎲 Roulement...'
              : diceValue
              ? `Dé : ${diceValue} ${diceValue === 6 ? '🔥 Rejoue' : ''}`
              : 'Touchez le dé'}
          </span>
        </div>

        {/* Safi (Vert) */}
        <div
          className={`flex items-center gap-1.5 flex-row-reverse text-right transition-all ${
            !isP1 ? 'font-bold text-emerald-600' : 'text-stone-400 opacity-70'
          }`}
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden border border-white shadow-2xs">
              {p2.avatar ? (
                <img src={p2.avatar} alt={p2.name} className="w-full h-full object-cover" />
              ) : (
                <span>{p2.name.charAt(0)}</span>
              )}
            </div>
            {!isP1 && (
              <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs truncate block max-w-[70px]">
              {gameMode === 'ai' ? 'Cupidon' : p2.name}
            </span>
            <span className="text-[9px] text-stone-500 font-semibold block leading-none">
              {p2HomeCount}/{tokensPerPlayer} 🏠
            </span>
          </div>
        </div>
      </div>

      {/* 3. Plateau SVG Ludo MS : Équilibré et Proportionné (Ne déborde JAMAIS de l'écran) */}
      <div className="relative w-full max-w-[min(82vw,46vh,380px)] aspect-square bg-[#FAF7F2] rounded-2xl p-1 border border-stone-200/90 shadow-xs box-border overflow-hidden">
        <svg
          viewBox="0 0 1500 1500"
          className="w-full h-full select-none"
          style={{ touchAction: 'manipulation' }}
        >
          {/* Luxury 3D Pawn & Visual Defs */}
          <defs>
            {/* Real 3D Drop Shadow */}
            <filter id="pawn-drop-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.38" />
            </filter>

            {/* Shimmering Golden Glow Aura */}
            <filter id="gold-aura" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Med - 3D Royal Ruby Gem Radial Gradient */}
            <radialGradient id="p1-ruby-gem" cx="30%" cy="26%" r="75%">
              <stop offset="0%" stopColor="#FFF1F2" />
              <stop offset="18%" stopColor="#FB7185" />
              <stop offset="48%" stopColor="#E11D48" />
              <stop offset="82%" stopColor="#9F1239" />
              <stop offset="100%" stopColor="#4C0519" />
            </radialGradient>

            {/* Safi - 3D Royal Emerald Gem Radial Gradient */}
            <radialGradient id="p2-emerald-gem" cx="30%" cy="26%" r="75%">
              <stop offset="0%" stopColor="#F0FDF4" />
              <stop offset="18%" stopColor="#34D399" />
              <stop offset="48%" stopColor="#059669" />
              <stop offset="82%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#022C22" />
            </radialGradient>

            {/* Royal Gold Beveled Rim */}
            <linearGradient id="royal-gold-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="25%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="75%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            {/* Glass Curved Glint Specular Overlay */}
            <linearGradient id="glass-glint" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Surface */}
          <rect x="0" y="0" width="1500" height="1500" fill="#FAF7F2" rx="30" />

          {/* 1. Base Joueur 1 (Bas-Gauche : Rouge poudré) */}
          <rect x="0" y="900" width="600" height="600" fill="#FFE4E6" />
          <rect
            x="50"
            y="950"
            width="500"
            height="500"
            rx="30"
            fill="#FFF1F3"
            stroke="#FECDD3"
            strokeWidth="3"
          />
          <text x="300" y="1015" fill="#E11D48" fontSize="28" fontWeight="bold" textAnchor="middle">
            {p1.name} 🔴
          </text>
          {P1_YARD_SPOTS.map((s, idx) => (
            <g key={`p1_spot_${idx}`}>
              <circle
                cx={s[0] * 100 + 50}
                cy={s[1] * 100 + 50}
                r="44"
                fill="#FFE4E6"
                stroke="#FDA4AF"
                strokeWidth="2"
                opacity="0.8"
              />
              <circle
                cx={s[0] * 100 + 50}
                cy={s[1] * 100 + 50}
                r="38"
                fill="#FFF1F3"
                stroke="#FECDD3"
                strokeWidth="1.5"
              />
              <text
                x={s[0] * 100 + 50}
                y={s[1] * 100 + 57}
                fill="#FDA4AF"
                fontSize="18"
                fontWeight="900"
                textAnchor="middle"
                opacity="0.65"
              >
                M{idx + 1}
              </text>
            </g>
          ))}

          {/* 2. Base Joueur 2 (Haut-Droit : Menthe poudré) */}
          <rect x="900" y="0" width="600" height="600" fill="#D1FAE5" />
          <rect
            x="950"
            y="50"
            width="500"
            height="500"
            rx="30"
            fill="#F0FDF4"
            stroke="#A7F3D0"
            strokeWidth="3"
          />
          <text x="1200" y="115" fill="#059669" fontSize="28" fontWeight="bold" textAnchor="middle">
            {p2.name} 🟢
          </text>
          {P2_YARD_SPOTS.map((s, idx) => (
            <g key={`p2_spot_${idx}`}>
              <circle
                cx={s[0] * 100 + 50}
                cy={s[1] * 100 + 50}
                r="44"
                fill="#D1FAE5"
                stroke="#6EE7B7"
                strokeWidth="2"
                opacity="0.8"
              />
              <circle
                cx={s[0] * 100 + 50}
                cy={s[1] * 100 + 50}
                r="38"
                fill="#F0FDF4"
                stroke="#A7F3D0"
                strokeWidth="1.5"
              />
              <text
                x={s[0] * 100 + 50}
                y={s[1] * 100 + 57}
                fill="#6EE7B7"
                fontSize="18"
                fontWeight="900"
                textAnchor="middle"
                opacity="0.65"
              >
                S{idx + 1}
              </text>
            </g>
          ))}

          {/* 3. Cadran Haut-Gauche neutre et apaisant */}
          <rect x="0" y="0" width="600" height="600" fill="#F5EFEB" />
          <rect
            x="50"
            y="50"
            width="500"
            height="500"
            rx="30"
            fill="#FAF8F5"
            stroke="#EAE4DC"
            strokeWidth="2"
          />
          <text x="300" y="280" fill="#B8AEA3" fontSize="38" textAnchor="middle">
            👑
          </text>
          <text
            x="300"
            y="350"
            fill="#8C8275"
            fontSize="26"
            fontWeight="bold"
            letterSpacing="2"
            textAnchor="middle"
          >
            Ludo MS
          </text>

          {/* 4. Cadran Bas-Droit neutre et apaisant */}
          <rect x="900" y="900" width="600" height="600" fill="#F5EFEB" />
          <rect
            x="950"
            y="950"
            width="500"
            height="500"
            rx="30"
            fill="#FAF8F5"
            stroke="#EAE4DC"
            strokeWidth="2"
          />
          <text x="1200" y="1180" fill="#B8AEA3" fontSize="38" textAnchor="middle">
            ❤️
          </text>
          <text
            x="1200"
            y="1250"
            fill="#8C8275"
            fontSize="24"
            fontWeight="bold"
            letterSpacing="1"
            textAnchor="middle"
          >
            {p1.name} & {p2.name}
          </text>

          {/* 5. Centre d'Arrivée (Triangles) */}
          <rect x="600" y="600" width="300" height="300" fill="#FAF7F2" />
          <polygon points="600,600 750,750 600,900" fill="#FB7185" />
          <polygon points="900,600 750,750 900,900" fill="#34D399" />
          <polygon points="600,600 750,750 900,600" fill="#EDE7DF" />
          <polygon points="600,900 750,750 900,900" fill="#EDE7DF" />

          {/* Cercle central */}
          <circle cx="750" cy="750" r="36" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
          <text x="750" y="763" fill="#B45309" fontSize="26" textAnchor="middle">
            👑
          </text>

          {/* 6. Cases du parcours */}
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
                  strokeWidth="1.5"
                  rx="6"
                />
                {isSafe && (
                  <text
                    x={c[0] * 100 + 50}
                    y={c[1] * 100 + 64}
                    fill={isP1Start ? '#E11D48' : isP2Start ? '#059669' : '#D97706'}
                    fontSize="32"
                    textAnchor="middle"
                  >
                    ★
                  </text>
                )}
              </g>
            );
          })}

          {/* Coulées d'arrivée sécurisées */}
          {P1_HOME_STRETCH.map((c, idx) => (
            <rect
              key={`p1_home_${idx}`}
              x={c[0] * 100}
              y={c[1] * 100}
              width="100"
              height="100"
              fill="#FDA4AF"
              stroke="#F43F5E"
              strokeWidth="1.5"
              rx="6"
            />
          ))}

          {P2_HOME_STRETCH.map((c, idx) => (
            <rect
              key={`p2_home_${idx}`}
              x={c[0] * 100}
              y={c[1] * 100}
              width="100"
              height="100"
              fill="#6EE7B7"
              stroke="#10B981"
              strokeWidth="1.5"
              rx="6"
            />
          ))}

          {/* 7. Pions Royaux Joueur 1 (Med - Rubis & Or) */}
          {activeTokensP1.map((t, idx) => {
            const pos = getTokenPosition(t, idx);
            const isPlayable = playableTokens.some((pt) => pt.id === t.id);

            return (
              <g
                key={t.id}
                onClick={() => isPlayable && handleMoveToken(t)}
                onTouchEnd={(e) => {
                  if (isPlayable) {
                    e.preventDefault();
                    handleMoveToken(t);
                  }
                }}
                className={`group ${isPlayable ? 'cursor-pointer' : ''}`}
              >
                {/* Touch target invisible */}
                <circle cx={pos.x} cy={pos.y} r="48" fill="transparent" />

                {/* Shimmering Golden Aura ring when playable */}
                {isPlayable && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="44"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3.5"
                      strokeDasharray="8 6"
                      className="animate-spin"
                      style={{
                        animationDuration: '8s',
                        transformOrigin: `${pos.x}px ${pos.y}px`,
                      }}
                      opacity="0.9"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="38"
                      fill="#FEF3C7"
                      opacity="0.3"
                      className="animate-pulse"
                    />
                  </>
                )}

                {/* 3D Realistic Drop Shadow */}
                <ellipse
                  cx={pos.x}
                  cy={pos.y + 10}
                  rx="28"
                  ry="10"
                  fill="#0F172A"
                  opacity="0.35"
                />

                {/* Golden Metallic Beveled Rim Base */}
                <circle cx={pos.x} cy={pos.y + 2.5} r="30" fill="url(#royal-gold-rim)" />
                <circle cx={pos.x} cy={pos.y + 1} r="27.5" fill="#4C0519" opacity="0.3" />

                {/* 3D Domed Ruby Jewel Body */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="27"
                  fill="url(#p1-ruby-gem)"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className={isPlayable ? 'animate-bounce' : ''}
                />

                {/* Glossy Specular Glint Crescent */}
                <ellipse
                  cx={pos.x}
                  cy={pos.y - 10}
                  rx="16"
                  ry="7"
                  fill="url(#glass-glint)"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Center Royal Medallion Ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y + 4}
                  r="14"
                  fill="#FFFFFF"
                  fillOpacity="0.18"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  strokeOpacity="0.8"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Royal Crown or Finished Star */}
                {t.state === 'finished' ? (
                  <text
                    x={pos.x}
                    y={pos.y + 8}
                    fill="#FDE68A"
                    fontSize="20"
                    textAnchor="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    ⭐
                  </text>
                ) : (
                  <>
                    <text
                      x={pos.x}
                      y={pos.y}
                      fill="#FEF3C7"
                      fontSize="10"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      👑
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 12}
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="900"
                      textAnchor="middle"
                      style={{
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      M{idx + 1}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* 8. Pions Royaux Joueur 2 (Safi - Émeraude & Or) */}
          {activeTokensP2.map((t, idx) => {
            const pos = getTokenPosition(t, idx);
            const isPlayable = playableTokens.some((pt) => pt.id === t.id);

            return (
              <g
                key={t.id}
                onClick={() => isPlayable && handleMoveToken(t)}
                onTouchEnd={(e) => {
                  if (isPlayable) {
                    e.preventDefault();
                    handleMoveToken(t);
                  }
                }}
                className={`group ${isPlayable ? 'cursor-pointer' : ''}`}
              >
                {/* Touch target invisible */}
                <circle cx={pos.x} cy={pos.y} r="48" fill="transparent" />

                {/* Shimmering Golden Aura ring when playable */}
                {isPlayable && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="44"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3.5"
                      strokeDasharray="8 6"
                      className="animate-spin"
                      style={{
                        animationDuration: '8s',
                        transformOrigin: `${pos.x}px ${pos.y}px`,
                      }}
                      opacity="0.9"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="38"
                      fill="#FEF3C7"
                      opacity="0.3"
                      className="animate-pulse"
                    />
                  </>
                )}

                {/* 3D Realistic Drop Shadow */}
                <ellipse
                  cx={pos.x}
                  cy={pos.y + 10}
                  rx="28"
                  ry="10"
                  fill="#0F172A"
                  opacity="0.35"
                />

                {/* Golden Metallic Beveled Rim Base */}
                <circle cx={pos.x} cy={pos.y + 2.5} r="30" fill="url(#royal-gold-rim)" />
                <circle cx={pos.x} cy={pos.y + 1} r="27.5" fill="#022C22" opacity="0.3" />

                {/* 3D Domed Emerald Jewel Body */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="27"
                  fill="url(#p2-emerald-gem)"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className={isPlayable ? 'animate-bounce' : ''}
                />

                {/* Glossy Specular Glint Crescent */}
                <ellipse
                  cx={pos.x}
                  cy={pos.y - 10}
                  rx="16"
                  ry="7"
                  fill="url(#gloss-glint)"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Center Royal Medallion Ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y + 4}
                  r="14"
                  fill="#FFFFFF"
                  fillOpacity="0.18"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  strokeOpacity="0.8"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Royal Crown or Finished Star */}
                {t.state === 'finished' ? (
                  <text
                    x={pos.x}
                    y={pos.y + 8}
                    fill="#FDE68A"
                    fontSize="20"
                    textAnchor="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    ⭐
                  </text>
                ) : (
                  <>
                    <text
                      x={pos.x}
                      y={pos.y}
                      fill="#FEF3C7"
                      fontSize="10"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      👑
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 12}
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="900"
                      textAnchor="middle"
                      style={{
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      S{idx + 1}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. Console de Lancer Unique et Compacte (Tout-en-un, zéro encombrement) */}
      <div className="w-full flex flex-col items-center gap-1.5 px-2">
        <div className="flex items-center justify-center gap-3">
          {/* Dé interactif tactile */}
          <button
            type="button"
            disabled={isRolling || (gameMode === 'ai' && currentTurn === 'p2')}
            onClick={handleRollDice}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-xs transition-all cursor-pointer select-none active:scale-95 ${
              isP1
                ? 'bg-rose-500 text-white ring-2 ring-rose-300 hover:bg-rose-600'
                : 'bg-emerald-600 text-white ring-2 ring-emerald-300 hover:bg-emerald-700'
            }`}
          >
            {isRolling ? (
              <Dices className="w-6 h-6 animate-spin" />
            ) : diceValue ? (
              <span>{diceValue}</span>
            ) : (
              <span>🎲</span>
            )}
          </button>

          {/* Bouton d'action direct */}
          <button
            type="button"
            disabled={isRolling || (gameMode === 'ai' && currentTurn === 'p2')}
            onClick={handleRollDice}
            className={`px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer text-white ${
              isP1 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRolling
              ? 'Lancement...'
              : diceValue
              ? `Dé : ${diceValue} (Relancer)`
              : `Lancer le dé (${isP1 ? p1.name : p2.name})`}
          </button>
        </div>

        {/* Boutons rapides pour déplacer les pions jouables (s'affiche seulement si nécessaire) */}
        {diceValue && playableTokens.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-full">
            {playableTokens.map((token) => {
              const tokenIdx = (currentTurn === 'p1' ? tokensP1 : tokensP2).findIndex(
                (t) => t.id === token.id
              );
              const isYard = token.state === 'yard';
              return (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => handleMoveToken(token)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold shadow-2xs active:scale-95 cursor-pointer transition-all ${
                    isP1
                      ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {isYard ? `🚀 Sortir Pion ${tokenIdx + 1}` : `🎯 Pion ${tokenIdx + 1} (+${diceValue})`}
                </button>
              );
            })}
          </div>
        )}

        {/* Message d'événement discret (1 seule ligne) */}
        <p className="text-[11px] text-stone-500 text-center truncate max-w-xs px-2">
          {lastEventText}
        </p>
      </div>

      {/* 5. Modale Gagnant & Gage Romantique */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-stone-200 text-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white mx-auto flex items-center justify-center text-2xl shadow-md">
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

              {/* Boutons d'action */}
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
                  className="w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs shadow-xs cursor-pointer"
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
