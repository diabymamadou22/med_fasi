import React from 'react';
import { PartnerId } from '../types';

interface PartnerAvatarProps {
  name: string;
  avatar?: string;
  partnerId?: PartnerId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ringColor?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

const sizeClasses = {
  xs: 'w-4 h-4 text-[9px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm font-bold',
  lg: 'w-11 h-11 sm:w-12 sm:h-12 text-base font-bold',
  xl: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl font-bold',
};

export const PartnerAvatar: React.FC<PartnerAvatarProps> = ({
  name,
  avatar,
  partnerId = 'p1',
  size = 'md',
  className = '',
  ringColor,
  onClick,
  title,
}) => {
  const isP1 = partnerId === 'p1';
  const initial = (name || (isP1 ? 'Safi' : 'Med')).charAt(0).toUpperCase();

  const baseGradient = isP1
    ? 'bg-gradient-to-tr from-rose-500 via-rose-400 to-pink-400 text-white'
    : 'bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-500 text-white';

  const defaultRing = ringColor || (isP1 ? 'ring-rose-400/60' : 'ring-sky-400/60');
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const hasPhoto = Boolean(avatar && avatar.trim().length > 0 && !avatar.includes('unsplash.com'));

  return (
    <div
      onClick={onClick}
      title={title || name}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none overflow-hidden ${sizeClass} ${defaultRing} ${className}`}
    >
      {hasPhoto ? (
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback to initials if photo fails to load
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center rounded-full tracking-wider shadow-inner ${baseGradient}`}
        >
          <span>{initial}</span>
        </div>
      )}
    </div>
  );
};
