import React, { useState } from 'react';
import {
  Ticket,
  Sparkles,
  Heart,
  Plus,
  Tv,
  Coffee,
  ShieldCheck,
  HeartHandshake,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CoupleProfile, PartnerId, LoveVoucher, BucketItem } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti } from '../../lib/confetti';

interface VouchersAndBucketViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  vouchers: LoveVoucher[];
  bucketList?: BucketItem[];
  onRedeemVoucher: (voucherId: string) => void;
  onOpenAddVoucherModal: () => void;
  onOpenAddBucketModal?: () => void;
  onUpdateBucketStatus?: (itemId: string, status: BucketItem['status']) => void;
  onEditVoucher?: (voucher: LoveVoucher) => void;
  onDeleteVoucher?: (voucherId: string) => void;
  onEditBucketItem?: (item: BucketItem) => void;
  onDeleteBucketItem?: (itemId: string) => void;
  onRemoveBucketPhoto?: (itemId: string) => void;
}

export const VouchersAndBucketView: React.FC<VouchersAndBucketViewProps> = ({
  profile,
  activePartnerId,
  vouchers,
  onRedeemVoucher,
  onOpenAddVoucherModal,
  onEditVoucher,
  onDeleteVoucher,
}) => {
  const [voucherFilter, setVoucherFilter] = useState<'all' | 'available' | 'used'>('available');

  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    if (voucherFilter === 'available') return !v.isRedeemed;
    if (voucherFilter === 'used') return v.isRedeemed;
    return true;
  });

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
      {/* LOVE VOUCHERS / CHÉQUIER DU CŒUR */}
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
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                voucherFilter === 'available'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Disponibles ({vouchers.filter((v) => !v.isRedeemed).length})
            </button>
            <button
              onClick={() => setVoucherFilter('used')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                voucherFilter === 'used'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Déjà utilisés ({vouchers.filter((v) => v.isRedeemed).length})
            </button>
            <button
              onClick={() => setVoucherFilter('all')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
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
            {filteredVouchers.map((v, vIdx) => {
              const giver =
                v.giverId === 'p1' ? profile.partner1 : profile.partner2;
              const receiver =
                v.receiverId === 'p1' ? profile.partner1 : profile.partner2;

              return (
                <div
                  key={v.id ? `${v.id}-${vIdx}` : `vouch-${vIdx}`}
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
                    <div className="flex items-center gap-1.5">
                      {onEditVoucher && (
                        <button
                          type="button"
                          onClick={() => onEditVoucher(v)}
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                          title="Modifier ce bon"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteVoucher && (
                        <button
                          type="button"
                          onClick={() => onDeleteVoucher(v.id)}
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                          title="Supprimer ce bon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Heart className="w-5 h-5 fill-white/30 text-white ml-1" />
                    </div>
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
                          className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
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
    </div>
  );
};
