import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Ticket,
  Sparkles,
  Heart,
  Plus,
  CheckCircle2,
  Tv,
  Coffee,
  ShieldCheck,
  HeartHandshake,
  Check,
  Flame,
  Calendar,
  Compass,
  DollarSign,
  Gift,
  FolderHeart,
} from 'lucide-react';
import { CoupleProfile, PartnerId, LoveVoucher, BucketItem } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

interface VouchersAndBucketViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  vouchers: LoveVoucher[];
  bucketList: BucketItem[];
  onRedeemVoucher: (voucherId: string) => void;
  onOpenAddVoucherModal: () => void;
  onOpenAddBucketModal: () => void;
  onUpdateBucketStatus: (itemId: string, status: BucketItem['status']) => void;
}

export const VouchersAndBucketView: React.FC<VouchersAndBucketViewProps> = ({
  profile,
  activePartnerId,
  vouchers,
  bucketList,
  onRedeemVoucher,
  onOpenAddVoucherModal,
  onOpenAddBucketModal,
  onUpdateBucketStatus,
}) => {
  const [subTab, setSubTab] = useState<'vouchers' | 'bucket'>('vouchers');
  const [voucherFilter, setVoucherFilter] = useState<'all' | 'available' | 'used'>('available');
  const [bucketFilter, setBucketFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    if (voucherFilter === 'available') return !v.isRedeemed;
    if (voucherFilter === 'used') return v.isRedeemed;
    return true;
  });

  // Filter bucket list
  const filteredBucket = bucketList.filter((b) => {
    if (bucketFilter === 'all') return true;
    return b.status === bucketFilter;
  });

  const completedBucketCount = bucketList.filter((b) => b.status === 'done').length;
  const bucketProgressPct = Math.round(
    (completedBucketCount / Math.max(1, bucketList.length)) * 100
  );

  const getVoucherIcon = (name: string) => {
    switch (name) {
      case 'Tv':
        return <Tv className="w-5 h-5" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const handleUseVoucher = (v: LoveVoucher) => {
    if (v.isRedeemed) return;
    onRedeemVoucher(v.id);
    soundEffects.playSuccessSparkle();
    triggerCelebrationConfetti();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Sub Navigation */}
      <div className="flex items-center justify-between sm:justify-start gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs">
        <button
          onClick={() => setSubTab('vouchers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subTab === 'vouchers'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="subtab-vouchers"
        >
          <Ticket className="w-4 h-4" />
          <span>Chéquier d'Amour & Bons ({vouchers.filter((v) => !v.isRedeemed).length} dispo)</span>
        </button>

        <button
          onClick={() => setSubTab('bucket')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subTab === 'bucket'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="subtab-bucket"
        >
          <FolderHeart className="w-4 h-4" />
          <span>Bucket List Partagée ({completedBucketCount}/{bucketList.length})</span>
        </button>
      </div>

      {/* 1. LOVE VOUCHERS / CHÉQUIER DU CŒUR */}
      {subTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 mb-1">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Coupons Romantiques</span>
                </span>
                <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Le Chéquier des Petits Privilèges d'Amour
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Des bons virtuels sans date de péremption à dégainer à tout moment !
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddVoucherModal}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  id="btn-add-voucher"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer un bon pour {otherPartner.name}</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-6 text-xs">
              <button
                onClick={() => setVoucherFilter('available')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  voucherFilter === 'available'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Disponibles ({vouchers.filter((v) => !v.isRedeemed).length})
              </button>
              <button
                onClick={() => setVoucherFilter('used')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  voucherFilter === 'used'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Déjà utilisés ({vouchers.filter((v) => v.isRedeemed).length})
              </button>
              <button
                onClick={() => setVoucherFilter('all')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  voucherFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Tous ({vouchers.length})
              </button>
            </div>

            {/* Vouchers Grid Styled Like Vintage/Modern Tickets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredVouchers.map((v) => {
                const giver =
                  v.giverId === 'p1' ? profile.partner1 : profile.partner2;
                const receiver =
                  v.receiverId === 'p1' ? profile.partner1 : profile.partner2;

                return (
                  <div
                    key={v.id}
                    className={`relative rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                      v.isRedeemed
                        ? 'bg-stone-100/90 border-stone-200 opacity-75'
                        : 'bg-white border-rose-200'
                    }`}
                  >
                    {/* Voucher Top Header */}
                    <div
                      className={`p-4 bg-gradient-to-r ${v.color} text-white flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
                          {getVoucherIcon(v.icon)}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                            Bon d'Amour Officiel
                          </span>
                          <h3 className="font-serif-romantic text-base sm:text-lg font-bold leading-tight">
                            {v.title}
                          </h3>
                        </div>
                      </div>
                      <Heart className="w-5 h-5 fill-white/30 text-white" />
                    </div>

                    {/* Perforated Divider */}
                    <div className="relative border-b-2 border-dashed border-stone-200 my-1">
                      <div className="absolute -left-3 -top-2 w-4 h-4 rounded-full bg-[#FAF7F5] border-r border-stone-200" />
                      <div className="absolute -right-3 -top-2 w-4 h-4 rounded-full bg-[#FAF7F5] border-l border-stone-200" />
                    </div>

                    {/* Voucher Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                          {v.description}
                        </p>
                        {v.customTerms && (
                          <p className="text-[11px] text-rose-700 italic mt-1 font-semibold">
                            Note : {v.customTerms}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="text-[11px] text-stone-500">
                          Offert par <strong>{giver.name}</strong> à{' '}
                          <strong>{receiver.name}</strong>
                        </div>

                        {v.isRedeemed ? (
                          <div className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 rotate-[-4deg] text-[11px] uppercase tracking-wider shadow-2xs">
                            Tamponné le {v.redeemedAt || 'récemment'}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUseVoucher(v)}
                            className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            Utiliser ce bon maintenant !
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. BUCKET LIST PARTAGÉE */}
      {subTab === 'bucket' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Nos Projets & Rêves Communs</span>
                </span>
                <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Notre Bucket List à Deux
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Tous les voyages, projets et folies qu'on veut accomplir ensemble.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddBucketModal}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  id="btn-add-bucket"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un rêve</span>
                </button>
              </div>
            </div>

            {/* Progress Bar Header */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800 mb-2">
                <span>Progression de nos rêves : {bucketProgressPct}% accomplis</span>
                <span>
                  {completedBucketCount} sur {bucketList.length} projets réalisés
                </span>
              </div>
              <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${bucketProgressPct}%` }}
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-6 text-xs">
              <button
                onClick={() => setBucketFilter('all')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  bucketFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Tous les souhaits ({bucketList.length})
              </button>
              <button
                onClick={() => setBucketFilter('todo')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  bucketFilter === 'todo'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                À faire ({bucketList.filter((b) => b.status === 'todo').length})
              </button>
              <button
                onClick={() => setBucketFilter('in_progress')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  bucketFilter === 'in_progress'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                En cours ({bucketList.filter((b) => b.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setBucketFilter('done')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  bucketFilter === 'done'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Réalisés 🎉 ({completedBucketCount})
              </button>
            </div>

            {/* Bucket List Items */}
            <div className="space-y-3.5">
              {filteredBucket.map((item) => {
                const addedByPartner =
                  item.addedBy === 'p1' ? profile.partner1 : profile.partner2;

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      item.status === 'done'
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-white border-stone-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          item.status === 'done'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {item.status === 'done' ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Compass className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                            {item.category}
                          </span>
                          {item.targetDate && (
                            <span className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3" />
                              {item.targetDate}
                            </span>
                          )}
                          {item.budgetEstimate && (
                            <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                              {item.budgetEstimate}
                            </span>
                          )}
                        </div>

                        <h3
                          className={`font-serif-romantic text-base sm:text-lg font-bold mt-1 ${
                            item.status === 'done'
                              ? 'line-through text-stone-500'
                              : 'text-stone-900'
                          }`}
                        >
                          {item.title}
                        </h3>

                        {item.notes && (
                          <p className="text-xs text-stone-600 mt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Select / Switch */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <select
                        value={item.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as BucketItem['status'];
                          onUpdateBucketStatus(item.id, newStatus);
                          if (newStatus === 'done') {
                            soundEffects.playSuccessSparkle();
                            triggerCelebrationConfetti();
                          }
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          item.status === 'done'
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : item.status === 'in_progress'
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <option value="todo">À faire ⏳</option>
                        <option value="in_progress">En cours 🚀</option>
                        <option value="done">Réalisé ! 🎉</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
