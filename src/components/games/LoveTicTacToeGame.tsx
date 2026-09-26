import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  RotateCcw,
  Trophy,
  Flame,
  CheckCircle2,
  Bot,
  UserCheck,
  MessageCircle,
  Edit3,
  Wifi,
  Radio,
  Users,
  Smartphone,
  Send,
  RefreshCw,
} from 'lucide-react';
import { CoupleProfile, PartnerId, ChatMessage, MorpionGameSession } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import { subscribeMorpionGame, saveMorpionGame } from '../../lib/firestoreService';

type BoardState = (string | null)[];
type GameMode = 'live' | 'local' | 'ai';

const DEFAULT_PLEDGES = [
  'Offrir 10 baisers doux et lents dans le cou ou sur les joues',
  'Préparer la boisson préférée de l’autre avec un petit mot doux à côté',
  'Un massage des épaules et de la nuque de 5 minutes',
  'Faire la vaisselle ou ranger la table ce soir avec le sourire',
  'Écrire un message d’amour secret sur le miroir de la salle de bain',
  'Laisser l’autre choisir le film ou la série de ce soir sans râler',
  'Chanter le refrain de notre chanson de couple avec passion !',
  'Glisser un billet doux secret dans la poche de mon partenaire',
  'Préparer le petit-déjeuner au lit pour le prochain week-end',
];

const LOCAL_STORAGE_KEY = 'nid_amour_morpion_state';

interface LoveTicTacToeGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSendChatMessage?: (
    msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'readStatus'>
  ) => void;
}

export const LoveTicTacToeGame: React.FC<LoveTicTacToeGameProps> = ({
  profile,
  activePartnerId,
  onSendChatMessage,
}) => {
  const [gameMode, setGameMode] = useState<GameMode>('live');
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<PartnerId>('p1');
  const [winner, setWinner] = useState<PartnerId | 'tie' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);
  const [ties, setTies] = useState(0);
  const [selectedPledge, setSelectedPledge] = useState<string>(DEFAULT_PLEDGES[0]);
  const [pledgeFulfilled, setPledgeFulfilled] = useState(false);
  const [isEditingPledge, setIsEditingPledge] = useState(false);
  const [customPledgeText, setCustomPledgeText] = useState('');
  const [sentToChatToast, setSentToChatToast] = useState(false);
  const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const p1Symbol = '💖';
  const p2Symbol = '🌹';

  const mySymbol = activePartnerId === 'p1' ? p1Symbol : p2Symbol;
  const otherPartnerId: PartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;

  const isMyTurn = currentTurn === activePartnerId;

  // Broadcast channel for multi-tab instantaneous local testing
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcastChannelRef.current = new BroadcastChannel('nid_amour_morpion_live');
        broadcastChannelRef.current.onmessage = (event) => {
          if (event.data && typeof event.data === 'object' && gameMode === 'live') {
            applySessionUpdate(event.data as MorpionGameSession, false);
          }
        };
      }
    } catch {}

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [gameMode]);

  // Check victory logic
  const checkWinner = (squares: BoardState): { winner: PartnerId | 'tie' | null; line: number[] | null } => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return {
          winner: squares[a] === p1Symbol ? 'p1' : 'p2',
          line: [a, b, c],
        };
      }
    }

    if (squares.every((s) => s !== null)) {
      return { winner: 'tie', line: null };
    }

    return { winner: null, line: null };
  };

  // Helper to apply incoming session updates
  const applySessionUpdate = useCallback(
    (session: MorpionGameSession, playSound = true) => {
      if (!session) return;
      if (Array.isArray(session.board)) {
        setBoard(session.board);
      }
      if (session.currentTurn) {
        setCurrentTurn(session.currentTurn);
      }
      setWinner(session.winner ?? null);
      setWinningLine(session.winningLine ?? null);
      if (typeof session.p1Wins === 'number') setP1Wins(session.p1Wins);
      if (typeof session.p2Wins === 'number') setP2Wins(session.p2Wins);
      if (typeof session.ties === 'number') setTies(session.ties);
      if (session.selectedPledge) setSelectedPledge(session.selectedPledge);
      if (typeof session.pledgeFulfilled === 'boolean') {
        setPledgeFulfilled(session.pledgeFulfilled);
      }
      if (typeof session.lastMoveIndex === 'number') {
        setLastMoveIndex(session.lastMoveIndex);
      }

      // Sounds if another partner made a move
      if (playSound && session.lastMoveBy && session.lastMoveBy !== activePartnerId) {
        if (session.winner && session.winner !== 'tie') {
          soundEffects.playVictoryChime();
          triggerCelebrationConfetti();
        } else if (session.winner === 'tie') {
          soundEffects.playHeartPulse();
        } else {
          soundEffects.playSoftTap();
        }
      }
    },
    [activePartnerId]
  );

  // Real-time subscription to Live Morpion game via Firestore
  useEffect(() => {
    if (gameMode !== 'live') return;

    let isMounted = true;
    const unsubscribe = subscribeMorpionGame(
      (session) => {
        if (!isMounted) return;
        setIsLiveConnected(true);
        if (session) {
          applySessionUpdate(session, true);
        } else {
          // Initialize empty live session if not exists
          const initialSession: MorpionGameSession = {
            id: 'morpion_live',
            board: Array(9).fill(null),
            currentTurn: 'p1',
            p1Symbol,
            p2Symbol,
            winner: null,
            winningLine: null,
            p1Wins: 0,
            p2Wins: 0,
            ties: 0,
            selectedPledge: DEFAULT_PLEDGES[0],
            pledgeFulfilled: false,
            lastUpdated: new Date().toISOString(),
          };
          saveMorpionGame(initialSession).catch(() => {});
        }
      },
      (err) => {
        console.warn('[Morpion Live] Firestore sync fallback:', err);
        setIsLiveConnected(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [gameMode, applySessionUpdate]);

  // AI move when in AI mode
  useEffect(() => {
    if (gameMode === 'ai' && currentTurn === 'p2' && !winner) {
      const timer = setTimeout(() => {
        const emptyIndices = board
          .map((val, idx) => (val === null ? idx : null))
          .filter((v): v is number => v !== null);

        if (emptyIndices.length > 0) {
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          executeMove(randomIndex, 'p2');
        }
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [gameMode, currentTurn, winner, board]);

  // Core move execution
  const executeMove = (index: number, player: PartnerId) => {
    if (board[index] || winner) return;

    soundEffects.playSoftTap();
    const symbol = player === 'p1' ? p1Symbol : p2Symbol;
    const newBoard = [...board];
    newBoard[index] = symbol;

    const nextTurn: PartnerId = player === 'p1' ? 'p2' : 'p1';
    const result = checkWinner(newBoard);

    let nextP1Wins = p1Wins;
    let nextP2Wins = p2Wins;
    let nextTies = ties;

    if (result.winner === 'p1') {
      nextP1Wins += 1;
      soundEffects.playVictoryChime();
      triggerCelebrationConfetti();
    } else if (result.winner === 'p2') {
      nextP2Wins += 1;
      soundEffects.playVictoryChime();
      triggerCelebrationConfetti();
    } else if (result.winner === 'tie') {
      nextTies += 1;
      soundEffects.playHeartPulse();
    }

    setBoard(newBoard);
    setCurrentTurn(nextTurn);
    setWinner(result.winner);
    setWinningLine(result.line);
    setP1Wins(nextP1Wins);
    setP2Wins(nextP2Wins);
    setTies(nextTies);
    setLastMoveIndex(index);
    setPledgeFulfilled(false);

    // If live mode, sync to Firestore and BroadcastChannel
    if (gameMode === 'live') {
      setIsSyncing(true);
      const updatedSession: MorpionGameSession = {
        id: 'morpion_live',
        board: newBoard,
        currentTurn: nextTurn,
        p1Symbol,
        p2Symbol,
        winner: result.winner,
        winningLine: result.line,
        p1Wins: nextP1Wins,
        p2Wins: nextP2Wins,
        ties: nextTies,
        selectedPledge,
        pledgeFulfilled: false,
        lastMoveBy: player,
        lastMoveIndex: index,
        lastUpdated: new Date().toISOString(),
      };

      try {
        broadcastChannelRef.current?.postMessage(updatedSession);
      } catch {}

      saveMorpionGame(updatedSession)
        .catch(console.error)
        .finally(() => setIsSyncing(false));
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    if (gameMode === 'live') {
      if (!isMyTurn) {
        soundEffects.playSoftTap();
        return;
      }
      executeMove(index, activePartnerId);
    } else if (gameMode === 'local') {
      executeMove(index, currentTurn);
    } else if (gameMode === 'ai') {
      if (currentTurn === 'p1') {
        executeMove(index, 'p1');
      }
    }
  };

  // Reset or play again
  const handleResetGame = () => {
    soundEffects.playSoftTap();
    const emptyBoard = Array(9).fill(null);
    const nextStartPlayer: PartnerId = winner === 'p1' ? 'p2' : 'p1';
    const randomPledge = DEFAULT_PLEDGES[Math.floor(Math.random() * DEFAULT_PLEDGES.length)];

    setBoard(emptyBoard);
    setCurrentTurn(nextStartPlayer);
    setWinner(null);
    setWinningLine(null);
    setPledgeFulfilled(false);
    setSelectedPledge(randomPledge);
    setLastMoveIndex(null);

    if (gameMode === 'live') {
      setIsSyncing(true);
      const sessionUpdate: MorpionGameSession = {
        id: 'morpion_live',
        board: emptyBoard,
        currentTurn: nextStartPlayer,
        p1Symbol,
        p2Symbol,
        winner: null,
        winningLine: null,
        p1Wins,
        p2Wins,
        ties,
        selectedPledge: randomPledge,
        pledgeFulfilled: false,
        lastMoveBy: null,
        lastMoveIndex: null,
        lastUpdated: new Date().toISOString(),
      };

      try {
        broadcastChannelRef.current?.postMessage(sessionUpdate);
      } catch {}

      saveMorpionGame(sessionUpdate)
        .catch(console.error)
        .finally(() => setIsSyncing(false));
    }
  };

  // Reset complete score
  const handleResetScores = () => {
    setP1Wins(0);
    setP2Wins(0);
    setTies(0);
    if (gameMode === 'live') {
      saveMorpionGame({
        id: 'morpion_live',
        p1Wins: 0,
        p2Wins: 0,
        ties: 0,
      }).catch(console.error);
    }
  };

  // Pledge customization sync
  const handleSaveCustomPledge = (newPledge: string) => {
    if (!newPledge.trim()) return;
    const trimmed = newPledge.trim();
    setSelectedPledge(trimmed);
    setIsEditingPledge(false);
    soundEffects.playSoftTap();

    if (gameMode === 'live') {
      saveMorpionGame({
        id: 'morpion_live',
        selectedPledge: trimmed,
      }).catch(console.error);
    }
  };

  // Fulfill pledge sync
  const handleTogglePledgeFulfilled = () => {
    const nextState = !pledgeFulfilled;
    setPledgeFulfilled(nextState);
    if (nextState) {
      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
    } else {
      soundEffects.playSoftTap();
    }

    if (gameMode === 'live') {
      saveMorpionGame({
        id: 'morpion_live',
        pledgeFulfilled: nextState,
      }).catch(console.error);
    }
  };

  // Winner & Loser display helpers
  const getWinnerName = () => {
    if (winner === 'p1') return profile.partner1.name;
    if (winner === 'p2') return gameMode === 'ai' ? 'Cupidon IA' : profile.partner2.name;
    return 'Match Nul';
  };

  const getLoserName = () => {
    if (winner === 'p1') return gameMode === 'ai' ? 'Cupidon IA' : profile.partner2.name;
    if (winner === 'p2') return profile.partner1.name;
    return 'Personne';
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. Header Banner Épuré */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-romantic text-xl sm:text-2xl font-bold tracking-tight">
                Morpion & Gages
              </h2>
              {gameMode === 'live' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400 text-stone-900 text-[10px] font-extrabold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse" />
                  En Direct
                </span>
              )}
            </div>
            <p className="text-white/90 text-xs mt-0.5">
              Alignez 3 symboles complices pour remporter le gage
            </p>
          </div>

          {/* Mode Selector Dropdown / Buttons */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl backdrop-blur-md">
            <button
              onClick={() => {
                setGameMode('live');
                handleResetGame();
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                gameMode === 'live'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Jouer en temps réel en duo"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>En Direct</span>
            </button>

            <button
              onClick={() => {
                setGameMode('local');
                handleResetGame();
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                gameMode === 'local'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Jouer sur le même écran"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Même Écran</span>
            </button>

            <button
              onClick={() => {
                setGameMode('ai');
                handleResetGame();
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Jouer contre l'IA Cupidon"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live Status Badge & Partner Roles */}
      {gameMode === 'live' && (
        <div className="bg-white/95 rounded-2xl p-3 border border-rose-100 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-stone-700">
              Session en direct synchronisée avec <strong>{otherPartner.name}</strong>
            </span>
            {isSyncing && (
              <RefreshCw className="w-3 h-3 text-rose-500 animate-spin ml-1" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-medium border border-rose-200/80 flex items-center gap-1.5">
              <span className="opacity-70">Moi :</span>
              <strong>{currentPartner.name}</strong>
              <span className="text-sm">{mySymbol}</span>
            </div>
            <span className="text-stone-300">vs</span>
            <div className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-medium border border-purple-200/80 flex items-center gap-1.5">
              <strong>{otherPartner.name}</strong>
              <span className="text-sm">{otherPartnerId === 'p1' ? p1Symbol : p2Symbol}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Score Tracker */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className={`p-3 rounded-2xl bg-white border text-center transition-all ${
          currentTurn === 'p1' && !winner ? 'border-rose-400 ring-2 ring-rose-200/80 shadow-xs' : 'border-rose-100'
        }`}>
          <div className="flex items-center justify-center gap-1 text-xs sm:text-sm font-bold text-rose-600 truncate">
            <span>{p1Symbol}</span>
            <span className="truncate">{profile.partner1.name}</span>
            {activePartnerId === 'p1' && <span className="text-[10px] text-stone-400 font-normal">(Moi)</span>}
          </div>
          <p className="text-2xl font-black text-stone-900 mt-0.5">{p1Wins}</p>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-stone-200 text-center">
          <span className="text-[11px] font-bold text-stone-500">Matchs Nuls</span>
          <p className="text-2xl font-black text-stone-600 mt-0.5">{ties}</p>
        </div>

        <div className={`p-3 rounded-2xl bg-white border text-center transition-all ${
          currentTurn === 'p2' && !winner ? 'border-purple-400 ring-2 ring-purple-200/80 shadow-xs' : 'border-purple-100'
        }`}>
          <div className="flex items-center justify-center gap-1 text-xs sm:text-sm font-bold text-purple-600 truncate">
            <span>{p2Symbol}</span>
            <span className="truncate">{gameMode === 'ai' ? 'Cupidon' : profile.partner2.name}</span>
            {gameMode !== 'ai' && activePartnerId === 'p2' && <span className="text-[10px] text-stone-400 font-normal">(Moi)</span>}
          </div>
          <p className="text-2xl font-black text-stone-900 mt-0.5">{p2Wins}</p>
        </div>
      </div>

      {/* 4. Current Turn Banner */}
      {!winner && (
        <div className="text-center">
          {gameMode === 'live' ? (
            isMyTurn ? (
              <motion.div
                initial={{ scale: 0.96 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md text-xs font-bold"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>C'est à votre tour de jouer, {currentPartner.name} ! Déposez votre {mySymbol}</span>
              </motion.div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-600">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>En attente du coup de {otherPartner.name} ({otherPartnerId === 'p1' ? p1Symbol : p2Symbol})...</span>
              </div>
            )
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
              <span>Tour de :</span>
              <strong className="text-sm">
                {currentTurn === 'p1'
                  ? `${profile.partner1.name} (${p1Symbol})`
                  : `${gameMode === 'ai' ? 'Cupidon IA' : profile.partner2.name} (${p2Symbol})`}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* 5. 3x3 Grid Board */}
      <div className="flex flex-col items-center justify-center">
        <div className={`p-4 sm:p-6 rounded-3xl border-2 transition-all shadow-sm ${
          gameMode === 'live' && isMyTurn && !winner
            ? 'bg-gradient-to-b from-white to-rose-50/40 border-rose-300 ring-4 ring-rose-100'
            : 'bg-white border-stone-200'
        }`}>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            {board.map((cell, idx) => {
              const isHighlight = winningLine?.includes(idx);
              const isLastMove = lastMoveIndex === idx;
              const canClick = !cell && !winner && (gameMode !== 'live' || isMyTurn);

              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={!canClick}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-all cursor-pointer select-none relative ${
                    isHighlight
                      ? 'bg-rose-100 border-2 border-rose-500 scale-105 shadow-md z-10'
                      : cell
                      ? 'bg-stone-50 border border-stone-200'
                      : canClick
                      ? 'bg-white hover:bg-rose-50 border border-dashed border-rose-300 hover:border-rose-400 hover:scale-102 active:scale-95'
                      : 'bg-stone-50/50 border border-stone-200/60 cursor-not-allowed opacity-80'
                  }`}
                  title={
                    cell
                      ? undefined
                      : gameMode === 'live' && !isMyTurn
                      ? `En attente du coup de ${otherPartner.name}`
                      : 'Cliquer pour placer votre symbole'
                  }
                >
                  {cell && (
                    <motion.span
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                      className="inline-block"
                    >
                      {cell}
                    </motion.span>
                  )}
                  {isLastMove && !winner && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls below grid */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleResetGame}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Réinitialiser la grille pour une nouvelle manche"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rejouer une manche</span>
          </button>

          {(p1Wins > 0 || p2Wins > 0 || ties > 0) && (
            <button
              onClick={handleResetScores}
              className="px-3 py-2 rounded-xl border border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50 text-[11px] font-medium transition-colors cursor-pointer"
              title="Remettre les scores à zéro"
            >
              Réinitialiser les scores
            </button>
          )}
        </div>
      </div>

      {/* 6. Winner & Pledge Card Modal / Box */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-rose-400 shadow-lg text-center space-y-4"
          >
            {winner === 'tie' ? (
              <div>
                <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-xl mb-2">
                  🤝
                </div>
                <h3 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Égalité Parfaite !
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Aucun perdant cette fois-ci ! Un câlin réciproque de 30 secondes pour célébrer votre belle harmonie.
                </p>
                <button
                  onClick={handleResetGame}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  Nouvelle manche revanche ⚔️
                </button>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xl mb-2 shadow-xs">
                  👑
                </div>
                <h3 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Victoire de {getWinnerName()} !
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Le gage amoureux revient à <strong>{getLoserName()}</strong> :
                </p>

                {/* Selected Pledge Box */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-tr from-rose-50 via-white to-pink-50 border border-rose-200 text-left relative shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>Gage Romantique en Direct</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPledgeText(selectedPledge);
                        setIsEditingPledge(!isEditingPledge);
                      }}
                      className="text-[10px] text-stone-500 hover:text-rose-600 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingPledge ? 'Annuler' : 'Personnaliser'}</span>
                    </button>
                  </div>

                  {isEditingPledge ? (
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        value={customPledgeText}
                        onChange={(e) => setCustomPledgeText(e.target.value)}
                        placeholder="Écrivez un gage inventé avec amour..."
                        className="w-full text-xs p-2 rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-400 bg-white"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveCustomPledge(customPledgeText)}
                          className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Valider pour les deux
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif-romantic text-base sm:text-lg font-bold text-stone-800 mt-1">
                      « {selectedPledge} »
                    </p>
                  )}
                </div>

                {/* Action Buttons for Winner & Pledge */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleTogglePledgeFulfilled}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      pledgeFulfilled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs active:scale-95'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{pledgeFulfilled ? 'Gage Accompli ! ❤️' : 'Valider le gage'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const next = DEFAULT_PLEDGES[Math.floor(Math.random() * DEFAULT_PLEDGES.length)];
                      handleSaveCustomPledge(next);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                  >
                    Autre gage au hasard
                  </button>

                  {/* Send to chat button */}
                  {onSendChatMessage && (
                    <button
                      type="button"
                      onClick={() => {
                        const winnerName = getWinnerName();
                        const loserName = getLoserName();
                        const msg = `⚔️ *Morpion des Gages : Victoire de ${winnerName} !* 👑\nLe gage amoureux pour ${loserName} est :\n« ${selectedPledge} » 🌹`;
                        onSendChatMessage({
                          senderId: activePartnerId,
                          text: msg,
                          type: 'text',
                        });
                        soundEffects.playSuccessSparkle();
                        triggerHeartConfetti();
                        setSentToChatToast(true);
                        setTimeout(() => setSentToChatToast(false), 3000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{sentToChatToast ? 'Envoyé dans le chat ! 💌' : 'Envoyer dans le chat'}</span>
                    </button>
                  )}

                  <button
                    onClick={handleResetGame}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revanche en direct !</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
