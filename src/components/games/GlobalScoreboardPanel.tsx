import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Crown,
  Sparkles,
  X,
  RotateCcw,
  MessageCircle,
  Plus,
  Play,
  Flame,
  Swords,
  History,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { CoupleProfile, PartnerId, GlobalGamesScoreboard, GameScoreRecord } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import { recordGameResult, resetGlobalGameScores } from '../../lib/firestoreService';

interface GlobalScoreboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  scoreboard: GlobalGamesScoreboard;
  onSelectGame?: (gameId: string) => void;
  onSendChatMessage?: (msgData: {
    senderId: PartnerId;
    content: string;
    mediaType?: 'image' | 'audio' | 'video' | 'text';
  }) => void;
}

export const GlobalScoreboardPanel: React.FC<GlobalScoreboardPanelProps> = ({
  isOpen,
  onClose,
  profile,
  activePartnerId,
  scoreboard,
  onSelectGame,
  onSendChatMessage,
}) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  const [activeTab, setActiveTab] = useState<'by_game' | 'recent' | 'quick_add'>('by_game');
  const [selectedQuickGame, setSelectedQuickGame] = useState<string>('ludo');
  const [selectedQuickWinner, setSelectedQuickWinner] = useState<PartnerId | 'tie'>('p1');
  const [quickPledge, setQuickPledge] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalP1Wins = scoreboard.totalP1Wins || 0;
  const totalP2Wins = scoreboard.totalP2Wins || 0;
  const totalTies = scoreboard.totalTies || 0;
  const totalPlayed = scoreboard.totalPlayed || (totalP1Wins + totalP2Wins + totalTies);

  const p1WinRate = totalPlayed > 0 ? Math.round((totalP1Wins / totalPlayed) * 100) : 0;
  const p2WinRate = totalPlayed > 0 ? Math.round((totalP2Wins / totalPlayed) * 100) : 0;

  const leader: 'p1' | 'p2' | 'tie' =
    totalP1Wins > totalP2Wins ? 'p1' : totalP2Wins > totalP1Wins ? 'p2' : 'tie';

  const gamesList: GameScoreRecord[] = Object.values(scoreboard.games || {});

  // Handle manual win quick record
  const handleRecordQuickWin = async () => {
    soundEffects.playVictoryChime();
    triggerCelebrationConfetti();

    const gameRecord = scoreboard.games[selectedQuickGame];
    const gameTitle = gameRecord?.gameTitle || selectedQuickGame;
    const winnerName =
      selectedQuickWinner === 'p1' ? p1.name : selectedQuickWinner === 'p2' ? p2.name : 'Égalité';

    await recordGameResult({
      gameId: selectedQuickGame,
      gameTitle,
      winner: selectedQuickWinner,
      winnerName,
      pledge: quickPledge.trim() || undefined,
    });

    setQuickPledge('');
    setActiveTab('by_game');
  };

  // Share score recap to Chat
  const handleShareToChat = () => {
    if (!onSendChatMessage) return;

    const leaderText =
      leader === 'p1'
        ? `👑 ${p1.name} est en tête du classement !`
        : leader === 'p2'
        ? `👑 ${p2.name} est en tête du classement !`
        : '🤝 Égalité parfaite entre amoureux !';

    const gameSummaries = gamesList
      .filter((g) => g.totalPlayed > 0)
      .map((g) => `• *${g.gameTitle}* : ${p1.name} ${g.p1Wins} - ${g.p2Wins} ${p2.name}`)
      .join('\n');

    const message = `🏆 *HISTORIQUE DES DUELS DU COUPLE* ⚔️\n\n${leaderText}\n\n📊 *Score Global :*\n${p1.name} : ${totalP1Wins} victoires (${p1WinRate}%)\n${p2.name} : ${totalP2Wins} victoires (${p2WinRate}%)\nÉgalités : ${totalTies}\nTotal duels : ${totalPlayed}\n\n🎮 *Détail par jeu :*\n${
      gameSummaries || 'Aucune partie enregistrée pour le moment'
    }\n\nPrêts pour une nouvelle revanche ? ❤️`;

    onSendChatMessage({
      senderId: activePartnerId,
      content: message,
      mediaType: 'text',
    });

    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 3000);
  };

  // Reset scores with safety confirmation
  const handleReset = async () => {
    soundEffects.playSoftTap();
    await resetGlobalGameScores();
    setShowResetConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-xs">
              🏆
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif-romantic tracking-tight flex items-center gap-2">
                <span>Scores & Victoires Globaux</span>
                <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-sans font-bold">
                  {totalPlayed} parties
                </span>
              </h2>
              <p className="text-xs text-rose-100">
                Historique des victoires et défaites par jeu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary Podium Banner */}
        <div className="bg-stone-50 border-b border-stone-200 p-3 sm:p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Partner 1 Card (Blue) */}
            <div
              className={`flex-1 p-2.5 sm:p-3 rounded-2xl border transition-all ${
                leader === 'p1'
                  ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 border border-white text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden">
                    {p1.avatar ? (
                      <img src={p1.avatar} alt={p1.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{p1.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block leading-tight">
                      {p1.name}
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold block">
                      {p1WinRate}% de succès
                    </span>
                  </div>
                </div>
                {leader === 'p1' && <Crown className="w-5 h-5 text-amber-500 animate-pulse" />}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs text-stone-500 font-medium">Bilan :</span>
                <span className="text-xs font-black text-stone-900">
                  <span className="text-emerald-600 font-bold">{totalP1Wins}V</span> /{' '}
                  <span className="text-rose-600 font-bold">{totalP2Wins}D</span>
                </span>
              </div>
            </div>

            {/* Center VS */}
            <div className="text-center shrink-0 flex flex-col items-center">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest">
                VS
              </span>
              <span className="text-[10px] text-stone-400">
                {totalTies > 0 ? `${totalTies} Nul` : 'En direct'}
              </span>
            </div>

            {/* Partner 2 Card (Pink/Emerald) */}
            <div
              className={`flex-1 p-2.5 sm:p-3 rounded-2xl border transition-all ${
                leader === 'p2'
                  ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 border border-white text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden">
                    {p2.avatar ? (
                      <img src={p2.avatar} alt={p2.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{p2.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block leading-tight">
                      {p2.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block">
                      {p2WinRate}% de succès
                    </span>
                  </div>
                </div>
                {leader === 'p2' && <Crown className="w-5 h-5 text-amber-500 animate-pulse" />}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs text-stone-500 font-medium">Bilan :</span>
                <span className="text-xs font-black text-stone-900">
                  <span className="text-emerald-600 font-bold">{totalP2Wins}V</span> /{' '}
                  <span className="text-rose-600 font-bold">{totalP1Wins}D</span>
                </span>
              </div>
            </div>
          </div>

          {/* Comparative win-bar */}
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-stone-200 overflow-hidden flex">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${totalPlayed > 0 ? (totalP1Wins / totalPlayed) * 100 : 50}%` }}
                title={`${p1.name}: ${totalP1Wins} victoires`}
              />
              <div
                className="h-full bg-stone-400 transition-all duration-500"
                style={{ width: `${totalPlayed > 0 ? (totalTies / totalPlayed) * 100 : 0}%` }}
                title={`${totalTies} égalités`}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${totalPlayed > 0 ? (totalP2Wins / totalPlayed) * 100 : 50}%` }}
                title={`${p2.name}: ${totalP2Wins} victoires`}
              />
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 px-3 sm:px-4 bg-white gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('by_game')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'by_game'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Scores par Jeu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'recent'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique Récent</span>
            {scoreboard.recentHistory?.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 font-bold">
                {scoreboard.recentHistory.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quick_add')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quick_add'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une victoire</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {/* TAB 1: Scores par Jeu */}
          {activeTab === 'by_game' && (
            <div className="space-y-2.5">
              {gamesList.map((g) => {
                const gameLeader =
                  g.p1Wins > g.p2Wins ? 'p1' : g.p2Wins > g.p1Wins ? 'p2' : 'tie';

                return (
                  <div
                    key={g.gameId}
                    className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:border-rose-200 hover:shadow-xs transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-lg shrink-0">
                        {g.gameId === 'ludo'
                          ? '🎲'
                          : g.gameId === 'tic_tac_toe'
                          ? '⭕'
                          : g.gameId === 'roulette'
                          ? '🎯'
                          : g.gameId === 'who_most_likely'
                          ? '👥'
                          : g.gameId === 'speed_match'
                          ? '⚡'
                          : g.gameId === 'wordle'
                          ? '🔤'
                          : g.gameId === 'trivia'
                          ? '🎧'
                          : g.gameId === 'sixty_seconds'
                          ? '⏱️'
                          : '🧩'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                            {g.gameTitle}
                          </h4>
                          {g.totalPlayed > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-stone-100 text-stone-600">
                              {g.totalPlayed} {g.totalPlayed > 1 ? 'duels' : 'duel'}
                            </span>
                          )}
                        </div>

                        {/* Status text */}
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {g.totalPlayed === 0 ? (
                            <span className="text-stone-400 italic">Aucune partie encore jouée</span>
                          ) : gameLeader === 'tie' ? (
                            <span className="text-amber-700 font-semibold">🤝 Égalité parfaite</span>
                          ) : (
                            <span className="font-semibold text-rose-600 flex items-center gap-1">
                              👑 En tête : {gameLeader === 'p1' ? p1.name : p2.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Detailed scores & action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      {/* Victoires / Défaites P1 & P2 */}
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-xl bg-blue-50 border border-blue-200 text-center">
                          <span className="text-[9px] text-blue-700 font-bold block truncate max-w-[50px]">
                            {p1.name}
                          </span>
                          <span className="text-xs font-black text-blue-900">
                            {g.p1Wins}V - {g.p1Losses}D
                          </span>
                        </div>

                        <div className="px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <span className="text-[9px] text-emerald-700 font-bold block truncate max-w-[50px]">
                            {p2.name}
                          </span>
                          <span className="text-xs font-black text-emerald-900">
                            {g.p2Wins}V - {g.p2Losses}D
                          </span>
                        </div>
                      </div>

                      {/* Launch game button */}
                      {onSelectGame && (
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playNoteClick();
                            onClose();
                            onSelectGame(g.gameId);
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                          title={`Jouer à ${g.gameTitle}`}
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Historique Récent */}
          {activeTab === 'recent' && (
            <div className="space-y-2">
              {scoreboard.recentHistory && scoreboard.recentHistory.length > 0 ? (
                scoreboard.recentHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">
                          {item.winner === 'p1' ? '🔵' : item.winner === 'p2' ? '🟢' : '🤝'}
                        </span>
                        <span className="text-xs font-bold text-stone-900">
                          {item.gameTitle}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(item.timestamp).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-stone-600">Résultat :</span>
                      <span
                        className={`font-extrabold px-1.5 py-0.2 rounded-sm text-[10px] ${
                          item.winner === 'p1'
                            ? 'bg-blue-100 text-blue-800'
                            : item.winner === 'p2'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        Victoire de {item.winnerName}
                      </span>
                    </div>

                    {item.pledge && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Gage : « {item.pledge} »</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                  <p className="text-2xl">📜</p>
                  <h4 className="font-bold text-xs text-stone-800">Aucune partie récente</h4>
                  <p className="text-[11px] text-stone-500">
                    Les prochaines victoires sur Ludo MS, Morpion ou autres jeux apparaîtront ici automatiquement !
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Ajouter manuellement une victoire */}
          {activeTab === 'quick_add' && (
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3.5">
              <div>
                <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>Enregistrer une victoire hors-ligne ou sur table</span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Ajoutez un duel gagné lors d'une soirée complice pour enrichir votre palmarès.
                </p>
              </div>

              {/* Select Game */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  Jeu concerné :
                </label>
                <select
                  value={selectedQuickGame}
                  onChange={(e) => setSelectedQuickGame(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                >
                  {gamesList.map((g) => (
                    <option key={g.gameId} value={g.gameId}>
                      {g.gameTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Winner */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  Vainqueur du duel :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuickWinner('p1')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedQuickWinner === 'p1'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    🔵 {p1.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedQuickWinner('p2')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedQuickWinner === 'p2'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    🟢 {p2.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedQuickWinner('tie')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedQuickWinner === 'tie'
                        ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    🤝 Nul
                  </button>
                </div>
              </div>

              {/* Gage éventuel */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  Gage ou mot complice (facultatif) :
                </label>
                <input
                  type="text"
                  value={quickPledge}
                  onChange={(e) => setQuickPledge(e.target.value)}
                  placeholder="Ex: Cuisiner le dîner, 10 baisers doux..."
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleRecordQuickWin}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs shadow-xs hover:from-rose-600 hover:to-pink-700 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Enregistrer ce résultat 🏆</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 border-t border-stone-200 p-3 sm:p-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onSendChatMessage && (
              <button
                type="button"
                onClick={handleShareToChat}
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Partager au chat"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{sharedToast ? 'Partagé ! 💌' : 'Partager au chat'}</span>
              </button>
            )}

            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                title="Réinitialiser tous les scores"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold"
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-1 rounded-lg bg-stone-200 text-stone-700 text-[11px] font-bold"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};
