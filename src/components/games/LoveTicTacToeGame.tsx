import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { CoupleProfile, PartnerId, ChatMessage } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

type BoardState = (string | null)[];

const DEFAULT_PLEDGES = [
  'Offrir 10 baisers doux et lents dans le cou ou sur les joues',
  'Préparer la boisson préférée de l’autre avec un petit mot doux à côté',
  'Un massage des épaules et de la nuque de 5 minutes',
  'Faire la vaisselle ou ranger la table ce soir avec le sourire',
  'Écrire un message d’amour secret sur le miroir de la salle de bain',
  'Laisser l’autre choisir le film ou la série de ce soir sans râler',
  'Chanter le refrain de notre chanson de couple avec passion !',
];

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
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [isP1Turn, setIsP1Turn] = useState(true);
  const [vsAI, setVsAI] = useState(false);
  const [winner, setWinner] = useState<string | null>(null); // 'p1' | 'p2' | 'tie' | null
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);
  const [ties, setTies] = useState(0);
  const [selectedPledge, setSelectedPledge] = useState<string>(DEFAULT_PLEDGES[0]);
  const [pledgeFulfilled, setPledgeFulfilled] = useState(false);
  const [isEditingPledge, setIsEditingPledge] = useState(false);
  const [customPledgeText, setCustomPledgeText] = useState('');
  const [sentToChatToast, setSentToChatToast] = useState(false);

  const p1Symbol = '💖';
  const p2Symbol = '🌹';

  // Check lines
  const checkWinner = (squares: BoardState): { winner: string | null; line: number[] | null } => {
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
        return { winner: squares[a] === p1Symbol ? 'p1' : 'p2', line: [a, b, c] };
      }
    }

    if (squares.every((s) => s !== null)) {
      return { winner: 'tie', line: null };
    }

    return { winner: null, line: null };
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    soundEffects.playSoftTap();
    const currentSymbol = isP1Turn ? p1Symbol : p2Symbol;
    const newBoard = [...board];
    newBoard[index] = currentSymbol;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      handleEndGame(result.winner, result.line);
    } else {
      setIsP1Turn(!isP1Turn);
    }
  };

  // Bot AI move
  useEffect(() => {
    if (vsAI && !isP1Turn && !winner) {
      const timer = setTimeout(() => {
        const emptyIndices = board
          .map((val, idx) => (val === null ? idx : null))
          .filter((v): v is number => v !== null);

        if (emptyIndices.length > 0) {
          // Play smart or random
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          handleCellClick(randomIndex);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [vsAI, isP1Turn, winner, board]);

  const handleEndGame = (resultWinner: string, line: number[] | null) => {
    setWinner(resultWinner);
    setWinningLine(line);
    setPledgeFulfilled(false);

    if (resultWinner === 'p1') {
      setP1Wins((prev) => prev + 1);
      soundEffects.playVictoryChime();
      triggerCelebrationConfetti();
    } else if (resultWinner === 'p2') {
      setP2Wins((prev) => prev + 1);
      soundEffects.playVictoryChime();
      triggerCelebrationConfetti();
    } else {
      setTies((prev) => prev + 1);
      soundEffects.playHeartPulse();
    }
  };

  const resetGame = () => {
    soundEffects.playSoftTap();
    setBoard(Array(9).fill(null));
    setIsP1Turn(true);
    setWinner(null);
    setWinningLine(null);
    setPledgeFulfilled(false);
    // Pick new random pledge
    const randomPledge = DEFAULT_PLEDGES[Math.floor(Math.random() * DEFAULT_PLEDGES.length)];
    setSelectedPledge(randomPledge);
  };

  const getWinnerName = () => {
    if (winner === 'p1') return profile.partner1.name;
    if (winner === 'p2') return vsAI ? 'Cupidon IA' : profile.partner2.name;
    return 'Match Nul';
  };

  const getLoserName = () => {
    if (winner === 'p1') return vsAI ? 'Cupidon IA' : profile.partner2.name;
    if (winner === 'p2') return profile.partner1.name;
    return 'Personne';
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Duel Amoureux & Gages</span>
            </div>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
              ⚔️ Le Morpion des Gages Amoureux
            </h2>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              Alignez 3 symboles d'amour (💖 ou 🌹). Le vainqueur attribue un gage romantique au perdant !
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVsAI(!vsAI);
                resetGame();
              }}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {vsAI ? <UserCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              <span>{vsAI ? 'Pass & Play Duo' : 'Jouer vs Cupidon IA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Score Tracker */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs text-center">
          <div className="flex items-center justify-center gap-1 text-sm font-bold text-rose-600">
            <span>{p1Symbol}</span>
            <span className="truncate">{profile.partner1.name}</span>
          </div>
          <p className="text-2xl font-black text-stone-900 mt-1">{p1Wins}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs text-center">
          <span className="text-xs font-bold text-stone-500">Matchs Nuls</span>
          <p className="text-2xl font-black text-stone-600 mt-1">{ties}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs text-center">
          <div className="flex items-center justify-center gap-1 text-sm font-bold text-purple-600">
            <span>{p2Symbol}</span>
            <span className="truncate">{vsAI ? 'Cupidon' : profile.partner2.name}</span>
          </div>
          <p className="text-2xl font-black text-stone-900 mt-1">{p2Wins}</p>
        </div>
      </div>

      {/* Current Turn indicator */}
      {!winner && (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
            <span>Tour de :</span>
            <strong className="text-sm">
              {isP1Turn
                ? `${profile.partner1.name} (${p1Symbol})`
                : `${vsAI ? 'Cupidon IA' : profile.partner2.name} (${p2Symbol})`}
            </strong>
          </span>
        </div>
      )}

      {/* 3x3 Grid Board */}
      <div className="flex flex-col items-center justify-center">
        <div className="bg-white p-4 sm:p-6 rounded-3xl border-2 border-rose-200 shadow-sm">
          <div className="grid grid-cols-3 gap-3">
            {board.map((cell, idx) => {
              const isHighlight = winningLine?.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={cell !== null || winner !== null}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-all cursor-pointer select-none ${
                    isHighlight
                      ? 'bg-rose-100 border-2 border-rose-500 scale-105 shadow-md'
                      : cell
                      ? 'bg-stone-50 border border-stone-200'
                      : 'bg-stone-50/60 hover:bg-rose-50/50 border border-dashed border-stone-300 hover:border-rose-400'
                  }`}
                >
                  {cell && (
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="inline-block"
                    >
                      {cell}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset / Play again */}
        <div className="mt-5">
          <button
            onClick={resetGame}
            className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rejouer une manche</span>
          </button>
        </div>
      </div>

      {/* Winner & Pledge Card */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl p-6 border-2 border-rose-400 shadow-md max-w-lg mx-auto text-center space-y-4"
          >
            {winner === 'tie' ? (
              <div>
                <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-xl mb-2">
                  🤝
                </div>
                <h3 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Égalité Parfaite !
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Tous les deux gagnants ! Faites-vous un câlin pour célébrer cette belle harmonie.
                </p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xl mb-2">
                  👑
                </div>
                <h3 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Victoire de {getWinnerName()} !
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Le gage amoureux revient à <strong>{getLoserName()}</strong> :
                </p>

                {/* Selected Pledge Box */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-tr from-rose-50 via-white to-pink-50 border border-rose-200 text-left relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                      Gage Romantique
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
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (customPledgeText.trim()) {
                              setSelectedPledge(customPledgeText.trim());
                            }
                            setIsEditingPledge(false);
                            soundEffects.playSoftTap();
                          }}
                          className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-bold"
                        >
                          Valider ce gage
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif-romantic text-base sm:text-lg font-bold text-stone-800">
                      « {selectedPledge} »
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => {
                      setPledgeFulfilled(true);
                      soundEffects.playSuccessSparkle();
                      triggerHeartConfetti();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      pledgeFulfilled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{pledgeFulfilled ? 'Gage Accomplifié ! ❤️' : 'Valider le gage'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const next = DEFAULT_PLEDGES[Math.floor(Math.random() * DEFAULT_PLEDGES.length)];
                      setSelectedPledge(next);
                      soundEffects.playSoftTap();
                    }}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                  >
                    Changer de gage
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
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
