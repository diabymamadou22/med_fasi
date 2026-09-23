import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Mic,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  X,
  Search,
  CornerUpLeft,
  Heart,
  Play,
  Pause,
  Image as ImageIcon,
  ChevronDown,
  StopCircle,
  UserCheck,
  Sparkles,
  Palette,
  Filter,
  MessageSquareHeart,
  Volume2,
  Trash2,
  Pencil,
  CheckSquare,
  Square,
  SmilePlus,
  Copy,
  ArrowLeft,
  Type,
  Loader2,
  MoreVertical,
  Download,
  FileText,
  Bell,
  BellRing,
  Camera,
  Video,
  AudioWaveform,
  Square as SquareIcon,
  Sticker as StickerIcon,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { NotificationActivationBanner } from '../NotificationActivationBanner';
import { MobilePhotoViewer, PhotoViewerItem } from '../MobilePhotoViewer';
import { CameraCaptureModal } from '../modals/CameraCaptureModal';
import { useBackHandler } from '../../lib/backNavigation';
import { ChatVideoBubble } from '../chat/ChatVideoBubble';
import { ChatAudioBubble } from '../chat/ChatAudioBubble';
import { RomanticStickerPicker } from '../chat/RomanticStickerPicker';
import { RomanticSticker } from '../../lib/romanticStickers';
import { getSupportedAudioMimeType, formatAudioTime, audioBlobToDataUrl } from '../../lib/audioRecorderUtils';
import {
  extractVideoThumbnail,
  storeMediaBlob,
  uploadAndPersistMedia,
  formatVideoDuration,
} from '../../lib/videoUtils';
import {
  CoupleProfile,
  PartnerId,
  ChatMessage,
  MissYouPulse,
} from '../../types';
import {
  updateChatMessageReaction,
  updateChatMessageStatus,
  setChatTypingStatus,
  updatePartnerPresence,
  subscribeChatTypingStatus,
  deleteChatMessageFromDb,
  deleteMultipleChatMessagesFromDb,
  editChatMessageContent,
  updateMultipleChatMessagesReaction,
  updateMultipleChatMessagesReadStatus,
  PartnerPresenceInfo,
  isQuotaExhausted,
} from '../../lib/firestoreService';
import {
  sortChatMessagesChronologically,
  extractMessageTimestampMs,
  formatMessageTime,
} from '../../lib/chatUtils';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { processPhotoWithoutCropping, compressImageWithStats, formatBytes } from '../../lib/imageUtils';
import {
  sendTypingViaRelay,
  sendPresenceViaRelay,
  connectChatEvents,
} from '../../lib/chatRelayService';

export interface ChatViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSwitchPartner: (newPartnerId: PartnerId) => void;
  messages: ChatMessage[];
  onSendMessage: (msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'readStatus'>) => void;
  onSendMissYouPulse: (pulseData: Omit<MissYouPulse, 'id' | 'timestamp'>) => void;
  onDeleteMessages?: (ids: string[]) => Promise<void> | void;
  onClearChat?: () => Promise<void> | void;
  onExportChat?: (format?: 'txt' | 'json') => void;
  onEditMessage?: (id: string, newContent: string) => Promise<void> | void;
  onBack?: () => void;
  onOpenNotificationModal?: () => void;
  onRefreshChat?: () => Promise<void> | void;
}

export type ChatTheme = 'rose-powder' | 'velvet-night' | 'ivory-linen';
export type SentBubbleColor = 'rose-ruby' | 'emerald-whatsapp' | 'ocean-blue' | 'slate-dark';
export type ChatFontSize = 'normal' | 'large' | 'xlarge';
export type ChatPattern = 'hearts' | 'floral' | 'stars' | 'doodle' | 'none';
export type ChatPatternOpacity = 'subtle' | 'medium' | 'vibrant';

export interface ChatPatternInfo {
  id: ChatPattern;
  name: string;
  shortLabel: string;
  emoji: string;
  description: string;
}

export const CHAT_PATTERNS: ChatPatternInfo[] = [
  {
    id: 'hearts',
    name: 'Cœurs Tendres',
    shortLabel: 'Cœurs',
    emoji: '💖',
    description: 'Petits cœurs entrelacés & étincelles douces',
  },
  {
    id: 'floral',
    name: 'Pétales & Roses',
    shortLabel: 'Fleurs',
    emoji: '🌸',
    description: 'Roses romantiques, boutons fleuris & feuillage',
  },
  {
    id: 'stars',
    name: 'Nuit Étoilée',
    shortLabel: 'Étoiles',
    emoji: '✨',
    description: 'Constellations intimes & scintillements doux',
  },
  {
    id: 'doodle',
    name: 'Doodles Tendresse',
    shortLabel: 'Doodles',
    emoji: '💌',
    description: 'Billets doux, anneaux, tasses & infini',
  },
  {
    id: 'none',
    name: 'Épuré (Uni)',
    shortLabel: 'Uni',
    emoji: '🕊️',
    description: 'Fond dégradé épuré sans motif',
  },
];

export const getPatternSvgDataUri = (pattern: ChatPattern, theme: ChatTheme): string => {
  if (pattern === 'none') return '';

  const color =
    theme === 'velvet-night'
      ? '%23fb7185' // rose-400
      : theme === 'ivory-linen'
      ? '%23b45309' // amber-700
      : '%23e11d48'; // rose-600

  if (pattern === 'hearts') {
    // 76x76 seamless repeating tile with interlocking hearts, mini-hearts and subtle sparkles
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='76' height='76' viewBox='0 0 76 76'%3E%3Cpath fill='${color}' d='M20 14c-3.3 0-6 2.7-6 6 0 7 10 13 10 13s10-6 10-13c0-3.3-2.7-6-6-6-2.5 0-4.6 1.5-5.5 3.7-.9-2.2-3-3.7-5.5-3.7z'/%3E%3Cpath fill='${color}' d='M58 48c-2.4 0-4.4 2-4.4 4.4 0 5.2 7.4 9.6 7.4 9.6s7.4-4.4 7.4-9.6c0-2.4-2-4.4-4.4-4.4-1.9 0-3.4 1.1-4.1 2.8-.7-1.7-2.2-2.8-4.1-2.8z'/%3E%3Cpath fill='${color}' d='M62 16l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z'/%3E%3Cpath fill='${color}' d='M16 56l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z'/%3E%3Ccircle cx='40' cy='38' r='1.5' fill='${color}'/%3E%3Ccircle cx='70' cy='38' r='1.2' fill='${color}'/%3E%3Ccircle cx='10' cy='32' r='1.2' fill='${color}'/%3E%3C/svg%3E`;
  }

  if (pattern === 'floral') {
    // 84x84 seamless repeating tile of delicate flowers, leaves and petals
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cpath fill='${color}' d='M24 22c-2.5 0-5 2-4 5.5 1 3.5 5 7.5 8 9.5 3-2 7-6 8-9.5 1-3.5-1.5-5.5-4-5.5-2.2 0-3.6 1.5-4 2.5-.4-1-1.8-2.5-4-2.5z'/%3E%3Cpath fill='none' stroke='${color}' stroke-width='1.2' stroke-linecap='round' d='M28 37c-2 6-5 12-10 16'/%3E%3Cpath fill='${color}' d='M23 44c1-3 4-4 7-3-1 3-4 4-7 3z'/%3E%3Cpath fill='${color}' d='M64 58c-2 0-3.8 1.5-3 4.2.8 2.7 3.8 5.8 6 7.3 2.2-1.5 5.2-4.6 6-7.3.8-2.7-1-4.2-3-4.2-1.6 0-2.7 1.1-3 1.9-.3-.8-1.4-1.9-3-1.9z'/%3E%3Cpath fill='${color}' d='M58 20c2-1 5 0 6 3-2 1-5 0-6-3z'/%3E%3Ccircle cx='70' cy='24' r='1.5' fill='${color}'/%3E%3Ccircle cx='18' cy='70' r='1.5' fill='${color}'/%3E%3Cpath fill='${color}' d='M44 28l1 2 2 1-2 1-1 2-1-2-2-1 2-1z'/%3E%3C/svg%3E`;
  }

  if (pattern === 'stars') {
    // 78x78 seamless repeating tile of twinkling stars & cosmic hearts
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='78' height='78' viewBox='0 0 78 78'%3E%3Cpath fill='${color}' d='M24 16l2 5 5 2-5 2-2 5-2-5-5-2 5-2z'/%3E%3Cpath fill='${color}' d='M58 48l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z'/%3E%3Cpath fill='${color}' d='M40 32c-1.8 0-3.2 1.4-3.2 3.2 0 3.8 4.2 6.8 4.2 6.8s4.2-3 4.2-6.8c0-1.8-1.4-3.2-3.2-3.2-1.2 0-2.3 0.8-2.7 1.8-.4-1-1.5-1.8-2.7-1.8z'/%3E%3Ccircle cx='64' cy='18' r='1.8' fill='${color}'/%3E%3Ccircle cx='16' cy='58' r='1.6' fill='${color}'/%3E%3Ccircle cx='34' cy='68' r='1.2' fill='${color}'/%3E%3Ccircle cx='72' cy='70' r='1' fill='${color}'/%3E%3Ccircle cx='10' cy='24' r='1' fill='${color}'/%3E%3C/svg%3E`;
  }

  if (pattern === 'doodle') {
    // 92x92 seamless repeating tile of romantic love notes & cups
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='92' height='92' viewBox='0 0 92 92'%3E%3Crect x='14' y='16' width='20' height='14' rx='2' fill='none' stroke='${color}' stroke-width='1.2'/%3E%3Cpath d='M14 16l10 7 10-7' fill='none' stroke='${color}' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cpath d='M58 22c-2.5 0-4 1.6-5.2 3.2-1.2-1.6-2.8-3.2-5.2-3.2-3 0-5 2-5 5 0 5 10.2 9 10.2 9s10.2-4 10.2-9c0-3-2-5-5-5z' fill='${color}'/%3E%3Cpath d='M20 58h12v6a4 4 0 01-4 4h-4a4 4 0 01-4-4v-6z' fill='none' stroke='${color}' stroke-width='1.2'/%3E%3Cpath d='M32 60h2a2 2 0 010 4h-2' fill='none' stroke='${color}' stroke-width='1.2'/%3E%3Cpath d='M68 62c-1.8 0-3 1.2-3 3 0 3.5 4.5 6 4.5 6s4.5-2.5 4.5-6c0-1.8-1.2-3-3-3-1 0-1.7.6-2.1 1.4-.4-.8-1.1-1.4-2.1-1.4z' fill='${color}'/%3E%3Ccircle cx='76' cy='32' r='1.3' fill='${color}'/%3E%3Ccircle cx='12' cy='42' r='1.1' fill='${color}'/%3E%3Ccircle cx='48' cy='76' r='1.3' fill='${color}'/%3E%3C/svg%3E`;
  }

  return '';
};

export const getPatternOpacityValue = (opacity: ChatPatternOpacity, theme: ChatTheme): number => {
  const isDark = theme === 'velvet-night';
  switch (opacity) {
    case 'subtle':
      return isDark ? 0.08 : 0.06;
    case 'medium':
      return isDark ? 0.15 : 0.12;
    case 'vibrant':
      return isDark ? 0.25 : 0.20;
    default:
      return 0.12;
  }
};

export const getPatternTileSize = (pattern: ChatPattern): number => {
  switch (pattern) {
    case 'hearts':
      return 76;
    case 'floral':
      return 84;
    case 'stars':
      return 78;
    case 'doodle':
      return 92;
    default:
      return 80;
  }
};

export const SENT_BUBBLE_PRESETS: Record<
  SentBubbleColor,
  {
    name: string;
    description: string;
    bubbleClass: string;
    bubbleText: string;
    metaText: string;
    swatch: string;
  }
> = {
  'rose-ruby': {
    name: 'Rose Rubis',
    description: 'Vibrant, romantique & haut contraste',
    bubbleClass: 'bg-gradient-to-br from-rose-600 via-rose-600 to-rose-700 text-white shadow-sm shadow-rose-950/20 border border-rose-500/50',
    bubbleText: 'text-white font-normal antialiased',
    metaText: 'text-rose-100/95 font-medium',
    swatch: 'bg-rose-600',
  },
  'emerald-whatsapp': {
    name: 'Vert WhatsApp',
    description: 'Le standard mondial ultra-lisible',
    bubbleClass: 'bg-gradient-to-br from-[#005c4b] to-[#025344] text-white shadow-sm shadow-teal-950/25 border border-teal-700/60',
    bubbleText: 'text-white font-normal antialiased',
    metaText: 'text-emerald-100/95 font-medium',
    swatch: 'bg-[#005c4b]',
  },
  'ocean-blue': {
    name: 'Bleu Royal',
    description: 'Éclatant & confort visuel maximal',
    bubbleClass: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-950/20 border border-blue-500/50',
    bubbleText: 'text-white font-normal antialiased',
    metaText: 'text-blue-100/95 font-medium',
    swatch: 'bg-blue-600',
  },
  'slate-dark': {
    name: 'Gris Anthracite',
    description: 'Sobre, élégant & reposant',
    bubbleClass: 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-sm shadow-slate-950/30 border border-slate-700/60',
    bubbleText: 'text-white font-normal antialiased',
    metaText: 'text-slate-300 font-medium',
    swatch: 'bg-slate-800',
  },
};

export const CHAT_FONT_SIZES: Record<
  ChatFontSize,
  { label: string; textClass: string; inputClass: string }
> = {
  normal: {
    label: 'Normal (15px)',
    textClass: 'text-[14.5px] sm:text-[15.5px]',
    inputClass: 'text-[16px] sm:text-[15px]',
  },
  large: {
    label: 'Grand (17px)',
    textClass: 'text-[16.5px] sm:text-[17.5px]',
    inputClass: 'text-[16px] sm:text-[16.5px]',
  },
  xlarge: {
    label: 'Très grand (19px)',
    textClass: 'text-[18.5px] sm:text-[19.5px]',
    inputClass: 'text-[17.5px] sm:text-[18px]',
  },
};

interface FloatingHeartParticle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  size: number;
}

export const ChatView: React.FC<ChatViewProps> = ({
  profile,
  activePartnerId,
  onSwitchPartner,
  messages,
  onSendMessage,
  onSendMissYouPulse,
  onDeleteMessages,
  onClearChat,
  onExportChat,
  onEditMessage,
  onBack,
  onOpenNotificationModal,
  onRefreshChat,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const otherPartnerId: PartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';

  // Manual chat refresh state
  const [isRefreshingChat, setIsRefreshingChat] = useState<boolean>(false);
  const handleManualRefresh = async () => {
    if (isRefreshingChat) return;
    setIsRefreshingChat(true);
    soundEffects.playSoftTap();
    try {
      if (onRefreshChat) {
        await onRefreshChat();
      }
    } finally {
      setTimeout(() => setIsRefreshingChat(false), 600);
    }
  };

  // Multi-selection state
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // Single message editing state
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editInputText, setEditInputText] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Deletion modal state (single or bulk)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [messageIdsToDelete, setMessageIdsToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Bulk actions modal state
  const [showBulkActionModal, setShowBulkActionModal] = useState<boolean>(false);

  // Theme selection stored in state
  const [chatTheme, setChatTheme] = useState<ChatTheme>(() => {
    return (localStorage.getItem('nid_amour_chat_theme') as ChatTheme) || 'rose-powder';
  });
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [showClearChatModal, setShowClearChatModal] = useState<boolean>(false);
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [chatToastFeedback, setChatToastFeedback] = useState<string | null>(null);

  const handleExportChat = (format: 'txt' | 'json' = 'txt') => {
    if (onExportChat) {
      onExportChat(format);
      setShowMoreMenu(false);
      setShowExportOptions(false);
      return;
    }

    if (messages.length === 0) {
      setChatToastFeedback("Aucun message à exporter pour le moment 💕");
      setTimeout(() => setChatToastFeedback(null), 3000);
      setShowMoreMenu(false);
      setShowExportOptions(false);
      return;
    }

    const p1Name = profile.partner1?.name || 'Partenaire 1';
    const p2Name = profile.partner2?.name || 'Partenaire 2';
    const today = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      const chatExportData = {
        title: "NID - Discussion de couple",
        couple: `${p1Name} & ${p2Name}`,
        exportedAt: new Date().toISOString(),
        totalMessages: messages.length,
        messages: messages,
      };
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(chatExportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `nid_messages_${p1Name.toLowerCase()}_${p2Name.toLowerCase()}_${today}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      let txtContent = `╔════════════════════════════════════════════════════════════════════╗\n`;
      txtContent += `║                   💕 NID - JOURNAL DE CONVERSATION 💕                ║\n`;
      txtContent += `║                    ${p1Name} & ${p2Name}                           ║\n`;
      txtContent += `║      Exporté avec amour le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}          ║\n`;
      txtContent += `╚════════════════════════════════════════════════════════════════════╝\n\n`;
      txtContent += `Total de messages échangés : ${messages.length}\n`;
      txtContent += `────────────────────────────────────────────────────────────────────\n\n`;

      messages.forEach((msg) => {
        const authorName = msg.senderId === 'p1' ? p1Name : p2Name;
        let timeStr = msg.timestamp;
        try {
          const d = new Date(msg.timestamp);
          if (!isNaN(d.getTime())) {
            timeStr = d.toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        } catch {
          // fallback
        }

        let extra = '';
        if (msg.mediaType === 'image') {
          extra = ' [📷 Photo jointe]';
        } else if (msg.mediaType === 'audio') {
          extra = ` [🎙️ Note vocale ${msg.audioDuration ? `(${msg.audioDuration}s)` : ''}]`;
        }
        if (msg.reaction) {
          extra += ` (Réaction : ${msg.reaction})`;
        }

        txtContent += `[${timeStr}] ${authorName} : ${msg.content || ''}${extra}\n`;
      });

      txtContent += `\n────────────────────────────────────────────────────────────────────\n`;
      txtContent += `Fin du journal d'amour. Conservez précieusement ces doux souvenirs ❤️\n`;

      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute(
        'download',
        `nid_damour_journal_${p1Name.toLowerCase()}_${p2Name.toLowerCase()}_${today}.txt`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    }

    soundEffects.playSuccessSparkle();
    setShowMoreMenu(false);
    setShowExportOptions(false);
    setChatToastFeedback(`Discussion exportée (${messages.length} messages) 💕`);
    setTimeout(() => setChatToastFeedback(null), 3500);
  };

  const handleClearChatConfirm = async () => {
    if (messages.length === 0) {
      setShowClearChatModal(false);
      return;
    }
    setIsDeleting(true);
    try {
      if (onClearChat) {
        await onClearChat();
      } else if (onDeleteMessages) {
        const allIds = messages.map((m) => m.id);
        await onDeleteMessages(allIds);
      } else {
        const allIds = messages.map((m) => m.id);
        await deleteMultipleChatMessagesFromDb(allIds);
      }
      soundEffects.playSoftTap();
      setShowClearChatModal(false);
      setChatToastFeedback('Conversation effacée avec succès 🌸');
      setTimeout(() => setChatToastFeedback(null), 3000);
    } catch (err) {
      console.error('Erreur effacement discussion:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectTheme = (theme: ChatTheme) => {
    setChatTheme(theme);
    localStorage.setItem('nid_amour_chat_theme', theme);
  };

  // Sent bubble color preference
  const [sentBubbleColor, setSentBubbleColor] = useState<SentBubbleColor>(() => {
    return (localStorage.getItem('nid_amour_sent_bubble_color') as SentBubbleColor) || 'rose-ruby';
  });

  const handleSelectSentBubbleColor = (color: SentBubbleColor) => {
    setSentBubbleColor(color);
    localStorage.setItem('nid_amour_sent_bubble_color', color);
  };

  // Chat font size preference for maximum readability
  const [chatFontSize, setChatFontSize] = useState<ChatFontSize>(() => {
    return (localStorage.getItem('nid_amour_chat_font_size') as ChatFontSize) || 'normal';
  });

  const handleSelectChatFontSize = (size: ChatFontSize) => {
    setChatFontSize(size);
    localStorage.setItem('nid_amour_chat_font_size', size);
  };

  // Subtle repeating romantic background pattern state
  const [chatPattern, setChatPattern] = useState<ChatPattern>(() => {
    return (localStorage.getItem('nid_amour_chat_pattern') as ChatPattern) || 'hearts';
  });

  const [chatPatternOpacity, setChatPatternOpacity] = useState<ChatPatternOpacity>(() => {
    return (localStorage.getItem('nid_amour_chat_pattern_opacity') as ChatPatternOpacity) || 'medium';
  });

  const handleSelectChatPattern = (pattern: ChatPattern) => {
    setChatPattern(pattern);
    localStorage.setItem('nid_amour_chat_pattern', pattern);
    soundEffects.playSoftTap();
    const info = CHAT_PATTERNS.find((p) => p.id === pattern);
    if (info) {
      setChatToastFeedback(`Motif : ${info.emoji} ${info.name}`);
      setTimeout(() => setChatToastFeedback(null), 2500);
    }
  };

  const handleSelectChatPatternOpacity = (opacity: ChatPatternOpacity) => {
    setChatPatternOpacity(opacity);
    localStorage.setItem('nid_amour_chat_pattern_opacity', opacity);
    soundEffects.playSoftTap();
  };

  // Input states
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'loveNote'>('all');

  // Romantic sticker selection handler
  const handleSelectRomanticSticker = (sticker: RomanticSticker) => {
    onSendMessage({
      senderId: activePartnerId,
      content: `Sticker ${sticker.name}`,
      mediaType: 'image',
      mediaUrl: sticker.svgDataUri,
    });
    soundEffects.playMessageSent();
    setShowStickerPicker(false);
  };

  // Mobile & Desktop Swipeable Photo Lightbox
  const [activeChatPhotoIndex, setActiveChatPhotoIndex] = useState<number | null>(null);

  // Compile all chat image and video messages into swipeable photo items
  const chatPhotoItems: PhotoViewerItem[] = useMemo(() => {
    return messages
      .filter(
        (m) =>
          ((m.mediaType === 'image' || m.mediaType === 'video') && (m.mediaUrl || m.videoUrl))
      )
      .map((m) => {
        const sender = m.senderId === 'p1' ? profile.partner1 : profile.partner2;
        let dateStr = '';
        try {
          const d = new Date(m.timestamp);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        } catch {}

        const isVideo = m.mediaType === 'video' || Boolean(m.videoUrl);

        return {
          id: m.id,
          photoUrl: m.videoThumbnail || m.mediaUrl!,
          videoUrl: isVideo ? (m.videoUrl || m.mediaUrl) : undefined,
          mediaType: isVideo ? 'video' : 'image',
          videoDuration: m.videoDuration,
          title: m.text
            ? m.text
            : isVideo
            ? `Vidéo partagée par ${sender?.name || 'mon amour'}`
            : `Photo partagée par ${sender?.name || 'mon amour'}`,
          description: m.text || undefined,
          date: dateStr,
          badgeLabel: isVideo ? 'Vidéo Privée' : 'Salon Privé',
          badgeBg: isVideo
            ? 'bg-purple-500/30 text-purple-200 border-purple-400/40'
            : 'bg-rose-500/30 text-rose-200 border-rose-400/40',
          authorId: m.senderId,
          authorName: sender?.name,
          authorAvatar: sender?.avatar,
        };
      });
  }, [messages, profile.partner1, profile.partner2]);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioTotalDuration, setAudioTotalDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordingAudioLevels, setRecordingAudioLevels] = useState<number[]>([30, 45, 60, 40, 70, 50, 80]);
  const recordIntervalRef = useRef<any>(null);
  const audioAnimationIntervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Real-time presence & typing status from Firestore
  const [presenceMap, setPresenceMap] = useState<Record<string, PartnerPresenceInfo>>({});
  const typingTimeoutRef = useRef<any>(null);
  const lastTypingBroadcastRef = useRef<number>(0);
  const markedAsReadRef = useRef<Set<string>>(new Set());

  // Floating hearts particles
  const [particles, setParticles] = useState<FloatingHeartParticle[]>([]);

  // Photo/Video compression and batch status banner state
  const [compressingStats, setCompressingStats] = useState<{
    isCompressing: boolean;
    filename?: string;
    originalSize?: number;
    compressedSize?: number;
    reduction?: number;
    customMessage?: string;
  } | null>(null);

  // Drag & drop state for chat
  const [isChatDragOver, setIsChatDragOver] = useState<boolean>(false);

  // Scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Phone back button handlers for Chat overlays and modals
  useBackHandler(Boolean(editingMessage), () => setEditingMessage(null), 'chat-edit-modal');
  useBackHandler(showDeleteConfirmModal, () => setShowDeleteConfirmModal(false), 'chat-delete-confirm');
  useBackHandler(showClearChatModal, () => setShowClearChatModal(false), 'chat-clear-confirm');
  useBackHandler(showBulkActionModal, () => setShowBulkActionModal(false), 'chat-bulk-actions');
  useBackHandler(showCameraModal, () => setShowCameraModal(false), 'chat-camera-modal');
  useBackHandler(showStickerPicker, () => setShowStickerPicker(false), 'chat-sticker-picker');
  useBackHandler(showEmojiPicker, () => setShowEmojiPicker(false), 'chat-emoji-picker');
  useBackHandler(showAttachmentMenu, () => setShowAttachmentMenu(false), 'chat-attachment-menu');
  useBackHandler(showSearchBar, () => setShowSearchBar(false), 'chat-search-bar');

  const handlePhotoCapturedFromCamera = (dataUrl: string, caption?: string) => {
    onSendMessage({
      senderId: activePartnerId,
      content: caption && caption.trim() ? caption.trim() : '📷 Photo partagée en direct',
      mediaType: 'image',
      mediaUrl: dataUrl,
    });
    soundEffects.playMessageSent();
  };

  // Subscribe to real-time presence and typing status from Firestore (mount-only)
  useEffect(() => {
    const unsubTyping = subscribeChatTypingStatus((map) => {
      setPresenceMap((prev) => ({ ...prev, ...map }));
    });
    return () => {
      unsubTyping();
    };
  }, []);

  // SSE direct relay connection
  useEffect(() => {
    const disconnectSse = connectChatEvents({
      partnerId: activePartnerId,
      onPresence: (remoteMap) => {
        if (remoteMap) {
          setPresenceMap((prev) => {
            const next = { ...prev };
            Object.entries(remoteMap).forEach(([pid, info]) => {
              next[pid] = {
                partnerId: info.partnerId as any,
                isTyping: info.isTyping,
                isOnline: info.isOnline,
                lastSeen: info.lastSeen,
                updatedAt: info.updatedAt,
              };
            });
            return next;
          });
        }
      },
    });

    return () => {
      disconnectSse();
    };
  }, [activePartnerId]);

  // Presence heartbeat & disconnect detection
  useEffect(() => {
    sendPresenceViaRelay(activePartnerId, true);
    if (!isQuotaExhausted()) {
      updatePartnerPresence(activePartnerId, true);
    }

    // Heartbeat every 45 seconds (direct relay) and Firestore when quota permits
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendPresenceViaRelay(activePartnerId, true);
        if (!isQuotaExhausted()) {
          updatePartnerPresence(activePartnerId, true);
        }
      }
    }, 45000);

    // Immediate visibility change detection (tab hidden/active)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendTypingViaRelay(activePartnerId, false);
        sendPresenceViaRelay(activePartnerId, false);
        if (!isQuotaExhausted()) {
          setChatTypingStatus(activePartnerId, false);
          updatePartnerPresence(activePartnerId, false);
        }
      } else {
        sendPresenceViaRelay(activePartnerId, true);
        if (!isQuotaExhausted()) {
          updatePartnerPresence(activePartnerId, true);
        }
      }
    };

    // Before unload / pagehide: immediate offline broadcast
    const handleDisconnect = () => {
      sendTypingViaRelay(activePartnerId, false);
      sendPresenceViaRelay(activePartnerId, false);
      if (!isQuotaExhausted()) {
        setChatTypingStatus(activePartnerId, false);
        updatePartnerPresence(activePartnerId, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleDisconnect);
    window.addEventListener('pagehide', handleDisconnect);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleDisconnect);
      window.removeEventListener('pagehide', handleDisconnect);
      sendTypingViaRelay(activePartnerId, false);
      sendPresenceViaRelay(activePartnerId, false);
      if (!isQuotaExhausted()) {
        setChatTypingStatus(activePartnerId, false);
        updatePartnerPresence(activePartnerId, false);
      }
    };
  }, [activePartnerId]);

  const otherPartnerPresence = presenceMap[otherPartnerId];
  const isOtherPartnerTyping = Boolean(otherPartnerPresence?.isTyping);
  const isOtherPartnerOnline = Boolean(otherPartnerPresence?.isOnline);

  const formatLastSeen = (isoStr?: string) => {
    if (!isoStr) return 'En ligne récemment';
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return isToday ? `Vu aujourd'hui à ${timeStr}` : `Vu le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${timeStr}`;
    } catch {
      return 'En ligne récemment';
    }
  };

  // Close MoreVertical options menu when clicking anywhere outside or pressing Escape
  useEffect(() => {
    if (!showMoreMenu) return;

    const handlePointerDownOutside = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;

      // Do nothing if click is inside the menu itself or on the toggle button
      if (
        moreMenuRef.current?.contains(target) ||
        moreButtonRef.current?.contains(target)
      ) {
        return;
      }

      setShowMoreMenu(false);
      setShowExportOptions(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMoreMenu(false);
        setShowExportOptions(false);
      }
    };

    // Attach to document with capture phase to detect any click anywhere on the screen
    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    document.addEventListener('mousedown', handlePointerDownOutside, true);
    document.addEventListener('touchstart', handlePointerDownOutside, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside, true);
      document.removeEventListener('mousedown', handlePointerDownOutside, true);
      document.removeEventListener('touchstart', handlePointerDownOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMoreMenu]);

  // Mark other partner's messages as read when viewing chat
  useEffect(() => {
    if (isQuotaExhausted()) return;

    const unreadIds: string[] = [];
    messages.forEach((msg) => {
      if (markedAsReadRef.current.has(msg.id)) return;
      const isRead =
        msg.readStatus === 'read' ||
        msg.readStatus === true ||
        (!msg.readStatus && msg.status === 'read');
      if (msg.senderId === otherPartnerId && !isRead) {
        unreadIds.push(msg.id);
        markedAsReadRef.current.add(msg.id);
      }
    });

    if (unreadIds.length > 0) {
      updateMultipleChatMessagesReadStatus(unreadIds, 'read').catch(() => {});
    }
  }, [messages, otherPartnerId]);

  // Auto-scroll on new messages & initial mount (WhatsApp behavior)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isOtherPartnerTyping]);

  useEffect(() => {
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 60);
    return () => clearTimeout(t);
  }, []);

  // Spawn heart burst animation
  const spawnHeartBurst = (x: number, y: number, count = 8) => {
    const emojis = ['❤️', '💖', '🥰', '✨', '💋', '🌹'];
    const newParticles: FloatingHeartParticle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `p_${Date.now()}_${Math.random()}`,
        x: x + (Math.random() * 80 - 40),
        y: y + (Math.random() * 40 - 20),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: Math.floor(Math.random() * 14) + 18,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);

    // Clean up particles after 2 seconds
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 2200);
  };

  // Double tap to love message
  const lastTapRef = useRef<{ [msgId: string]: number }>({});
  const handleMessageDoubleTap = (e: React.MouseEvent, msg: ChatMessage) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[msg.id] || 0;
    if (now - lastTap < 320) {
      // Double tap detected!
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      spawnHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 6);
      handleReaction(msg.id, '❤️');
      soundEffects.playHeartPulse();
      lastTapRef.current[msg.id] = 0;
    } else {
      lastTapRef.current[msg.id] = now;
    }
  };

  // =========================================================================
  // Mobile / iPhone Long-Press Action Sheet & Context Menu
  // =========================================================================
  const [messageActionSheet, setMessageActionSheet] = useState<ChatMessage | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  const openMessageActionSheet = (msg: ChatMessage) => {
    setMessageActionSheet(msg);
    soundEffects.playSoftTap();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(45);
      } catch {
        // ignore
      }
    }
  };

  const handleMessageTouchStart = (msg: ChatMessage, e: React.TouchEvent) => {
    // If user is in multi-selection mode, simple tap handles selection
    if (isSelectionMode || selectedMessageIds.length > 0) return;

    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTriggeredRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // 400ms is the responsive standard threshold for iOS Safari and Android long-press
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      openMessageActionSheet(msg);
    }, 400);
  };

  const handleMessageTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // If user scrolled finger by more than 8 pixels, cancel long press
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleMessageTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
    if (longPressTriggeredRef.current) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleMessageContextMenu = (msg: ChatMessage, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openMessageActionSheet(msg);
  };

  // Handle Input Change and broadcast typing status with auto-expanding height
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Auto-resize textarea height smoothly up to max height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(130, Math.max(38, textareaRef.current.scrollHeight));
      textareaRef.current.style.height = `${newHeight}px`;
    }

    // Broadcast instantané via relais Express (SSE rapide) et Firestore si quota disponible
    const now = Date.now();
    if (!lastTypingBroadcastRef.current || now - lastTypingBroadcastRef.current > 3000) {
      lastTypingBroadcastRef.current = now;
      sendTypingViaRelay(activePartnerId, true);
      if (!isQuotaExhausted()) {
        setChatTypingStatus(activePartnerId, true);
      }
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      lastTypingBroadcastRef.current = 0;
      sendTypingViaRelay(activePartnerId, false);
      if (!isQuotaExhausted()) {
        setChatTypingStatus(activePartnerId, false);
      }
    }, 3000);
  };

  // Send message handler
  const handleSend = (customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputText;
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    onSendMessage({
      senderId: activePartnerId,
      content: trimmed,
      mediaType: 'text',
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content || (replyingTo.mediaType === 'image' ? '📷 Photo' : '🎵 Note vocale'),
            senderId: replyingTo.senderId,
          }
        : undefined,
    });

    soundEffects.playMessageSent();
    if (customText === undefined) {
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '38px';
      }
    }
    setReplyingTo(null);
    setShowEmojiPicker(false);
    sendTypingViaRelay(activePartnerId, false);
    if (!isQuotaExhausted()) {
      setChatTypingStatus(activePartnerId, false);
    }
  };

  // Voice recording controls optimized for iOS Safari, Android Chrome & Desktop
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("L'enregistrement vocal n'est pas supporté par ce navigateur.");
        return;
      }

      // iOS Safari and Android require sampleRate & noiseSuppression constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      recordingStreamRef.current = stream;

      // Select optimal audio MIME type (audio/mp4 on iOS Safari, audio/webm on Android Chrome)
      const { mimeType } = getSupportedAudioMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clear animated audio levels
        if (audioAnimationIntervalRef.current) {
          clearInterval(audioAnimationIntervalRef.current);
        }

        const finalMime = mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });

        if (audioBlob.size > 0) {
          try {
            const base64Audio = await audioBlobToDataUrl(audioBlob);
            if (base64Audio) {
              onSendMessage({
                senderId: activePartnerId,
                content: '🎵 Note vocale',
                mediaType: 'audio',
                mediaUrl: base64Audio,
                audioDuration: Math.max(1, recordSeconds),
              });
              soundEffects.playMessageSent();
            }
          } catch (err) {
            console.error('Erreur lecture du vocal:', err);
          }
        }

        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      };

      // Request data in chunks every 250ms for maximum reliability on mobile
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);
      soundEffects.playSoftTap();

      // Timer counter
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);

      // Live waveform visualizer animation for recorder UI
      if (audioAnimationIntervalRef.current) clearInterval(audioAnimationIntervalRef.current);
      audioAnimationIntervalRef.current = setInterval(() => {
        setRecordingAudioLevels([
          Math.floor(Math.random() * 50) + 30,
          Math.floor(Math.random() * 65) + 35,
          Math.floor(Math.random() * 80) + 20,
          Math.floor(Math.random() * 90) + 30,
          Math.floor(Math.random() * 75) + 25,
          Math.floor(Math.random() * 85) + 30,
          Math.floor(Math.random() * 60) + 40,
        ]);
      }, 140);
    } catch (err) {
      console.error('Erreur accès micro:', err);
      alert('Impossible d’accéder au microphone. Veuillez autoriser l\'accès micro dans les réglages.');
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (audioAnimationIntervalRef.current) clearInterval(audioAnimationIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Discard recorded chunks
      audioChunksRef.current = [];
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
      }
      mediaRecorderRef.current = null;
      setIsRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (audioAnimationIntervalRef.current) clearInterval(audioAnimationIntervalRef.current);
      setRecordSeconds(0);
      soundEffects.playSoftTap();
    }
  };

  // Audio Playback with scrubbing
  const togglePlayAudio = (msg: ChatMessage) => {
    if (!msg.mediaUrl) return;

    if (playingAudioId === msg.id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(msg.mediaUrl);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setAudioCurrentTime(audio.currentTime);
        setAudioTotalDuration(audio.duration || msg.audioDuration || 0);
      };

      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioCurrentTime(0);
      };

      audio.play().catch(() => {});
      setPlayingAudioId(msg.id);
    }
  };

  // Unified Multiple Media Upload handler (supports multiple photos, multiple videos, or mixed)
  const handleMultipleMediaFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const total = files.length;
    let successCount = 0;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');

        setCompressingStats({
          isCompressing: true,
          filename: file.name,
          originalSize: file.size,
          customMessage:
            total > 1
              ? `Importation de ${i + 1}/${total} (${isVideo ? 'vidéo' : 'photo'})...`
              : isVideo
              ? 'Traitement et sécurisation de la vidéo...'
              : 'Optimisation de la photo mobile...',
        });

        try {
          if (isVideo) {
            const uploadResult = await uploadAndPersistMedia(file, 'vid_chat', (status) => {
              setCompressingStats((prev) => ({
                ...(prev || {
                  filename: file.name,
                  originalSize: file.size,
                }),
                isCompressing: true,
                customMessage: status,
              }));
            });

            onSendMessage({
              senderId: activePartnerId,
              content: `🎬 Vidéo partagée (${uploadResult.formattedDuration})`,
              mediaType: 'video',
              mediaUrl: uploadResult.serverUrl,
              videoUrl: uploadResult.serverUrl,
              videoThumbnail: uploadResult.thumbnailDataUrl,
              videoDuration: uploadResult.duration,
            });
          } else {
            const result = await compressImageWithStats(file, {
              maxDimension: 1280,
              maxSizeBytes: 280 * 1024,
              initialQuality: 0.82,
            });

            onSendMessage({
              senderId: activePartnerId,
              content: '📷 Photo partagée',
              mediaType: 'image',
              mediaUrl: result.dataUrl,
            });
          }

          successCount++;
          soundEffects.playMessageSent();

          // Small stagger between messages to maintain neat chronological order
          if (total > 1 && i < total - 1) {
            await new Promise((r) => setTimeout(r, 200));
          }
        } catch (itemErr) {
          console.error(`Erreur d'importation sur ${file.name}:`, itemErr);
        }
      }

      if (successCount > 0) {
        triggerHeartConfetti();
        setCompressingStats({
          isCompressing: false,
          customMessage:
            total > 1
              ? `${successCount} médias partagés avec succès ! ❤️`
              : undefined,
        });

        setTimeout(() => {
          setCompressingStats(null);
        }, 3500);
      } else {
        setCompressingStats(null);
        alert("Impossible d'importer les fichiers sélectionnés.");
      }
    } catch (err: any) {
      console.error('Erreur importation médias chat:', err);
      setCompressingStats(null);
      alert("Une erreur est survenue lors de l'importation de vos médias.");
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVideoFile = async (file: File) => {
    await handleMultipleMediaFiles([file]);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleMediaFiles(e.target.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleMediaFiles(e.target.files);
    }
  };

  // Drag & drop handlers for chat area
  const handleChatDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatDragOver(true);
  };

  const handleChatDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatDragOver(false);
  };

  const handleChatDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleMediaFiles(e.dataTransfer.files);
    }
  };

  // Add Emoji reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    soundEffects.playSoftTap();
    await updateChatMessageReaction(messageId, activePartnerId, emoji);
  };

  // Helper to reliably parse message sending/arrival timestamp in milliseconds
  const getMsgTimestamp = (m: ChatMessage | null | undefined): number => {
    return extractMessageTimestampMs(m);
  };

  // Strictly sort messages chronologically (oldest at top, newest at bottom down to the exact second) and filter
  const filteredMessages = useMemo(() => {
    const sorted = sortChatMessagesChronologically(messages);

    let list = sorted;

    // Filter by media
    if (mediaFilter === 'image') {
      list = list.filter((m) => m.mediaType === 'image');
    } else if (mediaFilter === 'audio') {
      list = list.filter((m) => m.mediaType === 'audio');
    } else if (mediaFilter === 'loveNote') {
      list = list.filter((m) => m.content && (m.content.startsWith('💌') || m.content.toLowerCase().includes('amour')));
    }

    // Filter by query
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (m) =>
        (m.content && m.content.toLowerCase().includes(q)) ||
        (m.mediaType === 'image' && 'photo'.includes(q)) ||
        (m.mediaType === 'audio' && 'vocal'.includes(q))
    );
  }, [messages, searchQuery, mediaFilter]);

  // Group messages by date in strict chronological sequence (like WhatsApp)
  const groupedMessages = useMemo(() => {
    const groups: { dateKey: string; dateLabel: string; dateSortTime: number; items: ChatMessage[] }[] = [];

    filteredMessages.forEach((msg) => {
      const timeMs = extractMessageTimestampMs(msg);
      const msgDate = new Date(timeMs || Date.now());
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const dateKey = `${msgDate.getFullYear()}-${String(msgDate.getMonth() + 1).padStart(2, '0')}-${String(msgDate.getDate()).padStart(2, '0')}`;
      const dateSortTime = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate()).getTime();

      let dateLabel = msgDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });

      if (msgDate.toDateString() === today.toDateString()) {
        dateLabel = "Aujourd'hui";
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Hier';
      }

      let group = groups.find((g) => g.dateKey === dateKey);
      if (!group) {
        group = { dateKey, dateLabel, dateSortTime, items: [] };
        groups.push(group);
      }
      group.items.push(msg);
    });

    // Ensure groups follow exact chronological order (oldest days first, today last)
    groups.sort((a, b) => a.dateSortTime - b.dateSortTime);

    // Ensure all items within each day strictly follow arrival second ascending
    groups.forEach((g) => {
      g.items = sortChatMessagesChronologically(g.items);
    });

    return groups;
  }, [filteredMessages]);

  // Selection helpers
  const toggleSelectMessage = (id: string) => {
    setSelectedMessageIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      if (next.length === 0) {
        setIsSelectionMode(false);
      } else {
        setIsSelectionMode(true);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedMessageIds.length === filteredMessages.length) {
      setSelectedMessageIds([]);
      setIsSelectionMode(false);
    } else {
      setSelectedMessageIds(filteredMessages.map((m) => m.id));
      setIsSelectionMode(true);
    }
  };

  const openEditModal = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setEditInputText(msg.content || '');
  };

  const executeSaveEdit = async () => {
    if (!editingMessage || !editInputText.trim()) return;
    setIsSavingEdit(true);
    try {
      const trimmed = editInputText.trim();
      if (onEditMessage) {
        await onEditMessage(editingMessage.id, trimmed);
      } else {
        await editChatMessageContent(editingMessage.id, trimmed);
      }
      soundEffects.playSoftTap();
      setEditingMessage(null);
      setEditInputText('');
    } catch (err) {
      console.error('Erreur modification message:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const executeDeleteMessages = async () => {
    if (messageIdsToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      if (onDeleteMessages) {
        await onDeleteMessages(messageIdsToDelete);
      } else {
        await deleteMultipleChatMessagesFromDb(messageIdsToDelete);
      }
      soundEffects.playSoftTap();
      setSelectedMessageIds((prev) => prev.filter((id) => !messageIdsToDelete.includes(id)));
      if (selectedMessageIds.length <= messageIdsToDelete.length) {
        setIsSelectionMode(false);
      }
      setShowDeleteConfirmModal(false);
      setMessageIdsToDelete([]);
    } catch (err) {
      console.error('Erreur suppression messages:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const executeBulkReaction = async (emoji: string) => {
    if (selectedMessageIds.length === 0) return;
    try {
      await updateMultipleChatMessagesReaction(selectedMessageIds, activePartnerId, emoji);
      soundEffects.playHeartPulse();
      setShowBulkActionModal(false);
      setSelectedMessageIds([]);
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Erreur réaction groupée:', err);
    }
  };

  const executeBulkMarkAsRead = async () => {
    if (selectedMessageIds.length === 0) return;
    try {
      await updateMultipleChatMessagesReadStatus(selectedMessageIds, 'read');
      soundEffects.playSoftTap();
      setShowBulkActionModal(false);
      setSelectedMessageIds([]);
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Erreur marquage lu groupé:', err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBottom(!isAtBottom);
  };

  const romanticEmojis = [
    '❤️', '😘', '🥰', '😍', '🌹', '💌', '💍', '✨',
    '🥺', '🔥', '😂', '💋', '💖', '🧸', '🍫', '🙏',
  ];

  const quickLovePhrases = [
    { text: "Je t'aime de tout mon cœur ❤️", label: "Je t'aime ❤️" },
    { text: "Tu me manques tellement 🥺", label: "Tu me manques 🥺" },
    { text: "Gros câlin tout doux mon amour 🧸", label: "Gros câlin 🧸" },
    { text: "Plein de bisous tendres pour toi 💋", label: "Plein de bisous 💋" },
    { text: "Tu es absolument magnifique ✨", label: "Tu es sublime ✨" },
    { text: "Hâte de te retrouver dans mes bras 🥰", label: "Hâte de te voir 🥰" },
  ];

  // Active sent bubble preset for readability
  const activeSentPreset = SENT_BUBBLE_PRESETS[sentBubbleColor] || SENT_BUBBLE_PRESETS['rose-ruby'];

  // Theme styling helpers
  const themeStyles = {
    'rose-powder': {
      outerBg: 'bg-[#FFFDFD]',
      cardBg: 'bg-white',
      feedBg: 'bg-gradient-to-b from-[#FFFDFD] via-[#FAF5F5] to-[#FFF9F9]',
      headerBg: 'bg-white/95 backdrop-blur-md border-rose-100',
      myBubble: activeSentPreset.bubbleClass,
      myBubbleText: activeSentPreset.bubbleText,
      myBubbleMeta: activeSentPreset.metaText,
      partnerBubble: 'bg-white border border-stone-200/90 text-stone-900 shadow-xs',
      inputBg: 'bg-stone-50 border-stone-200 focus-within:border-rose-300 focus-within:bg-white',
      accentColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-700',
    },
    'velvet-night': {
      outerBg: 'bg-slate-950',
      cardBg: 'bg-slate-900 border-rose-950',
      feedBg: 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
      headerBg: 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-white',
      myBubble: activeSentPreset.bubbleClass,
      myBubbleText: activeSentPreset.bubbleText,
      myBubbleMeta: activeSentPreset.metaText,
      partnerBubble: 'bg-slate-800/95 border border-slate-700/80 text-slate-100 shadow-xs',
      inputBg: 'bg-slate-850 bg-slate-800/80 border-slate-700 text-white focus-within:border-rose-500 focus-within:bg-slate-800',
      accentColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/70 border-rose-800/60 text-rose-300',
    },
    'ivory-linen': {
      outerBg: 'bg-[#FBF9F5]',
      cardBg: 'bg-white border-amber-100',
      feedBg: 'bg-gradient-to-b from-[#FBF9F5] via-[#F6F2EA] to-[#FBF9F5]',
      headerBg: 'bg-[#FDFBF7]/95 backdrop-blur-md border-amber-200/60',
      myBubble: activeSentPreset.bubbleClass,
      myBubbleText: activeSentPreset.bubbleText,
      myBubbleMeta: activeSentPreset.metaText,
      partnerBubble: 'bg-white border border-stone-200 text-stone-900 shadow-xs',
      inputBg: 'bg-stone-50 border-stone-200 focus-within:border-amber-400 focus-within:bg-white',
      accentColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    },
  }[chatTheme];

  return (
    <div className="w-full h-full max-w-5xl mx-auto p-0 sm:px-4 sm:py-2 flex-1 flex flex-col min-h-0 relative">
      {/* Floating Hearts Particles Burst */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-50 floating-heart"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            fontSize: `${p.size}px`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Main Chat Window Card - edge to edge on mobile like WhatsApp / native chat apps */}
      <div
        onDragOver={handleChatDragOver}
        onDragLeave={handleChatDragLeave}
        onDrop={handleChatDrop}
        className={`${themeStyles.cardBg} rounded-none sm:rounded-3xl shadow-none sm:shadow-xl border-0 sm:border overflow-hidden flex flex-col flex-1 min-h-0 h-full relative transition-colors duration-300`}
      >
        {/* Chat Drag & Drop Overlay */}
        {isChatDragOver && (
          <div className="absolute inset-0 z-50 bg-rose-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white pointer-events-none transition-all">
            <div className="p-8 rounded-3xl bg-white/10 border-2 border-dashed border-rose-300 text-center max-w-sm shadow-2xl">
              <Upload className="w-12 h-12 text-rose-300 mx-auto mb-3 animate-bounce" />
              <h3 className="text-lg font-bold font-serif-romantic">
                Déposez vos photos et vidéos ici
              </h3>
              <p className="text-xs text-rose-200 mt-1">
                Elles seront toutes partagées ensemble dans votre salon d'amoureux ❤️
              </p>
            </div>
          </div>
        )}
        
        {/* Floating Chat Notification Toast */}
        <AnimatePresence>
          {chatToastFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-stone-900/90 dark:bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-2 border border-rose-500/40 pointer-events-none"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-pulse shrink-0" />
              <span>{chatToastFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* 1. CHAT TOP APP BAR & WHATSAPP-STYLE SELECTION BAR */}
        {/* ================================================================= */}
        {selectedMessageIds.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-3 sm:px-4 py-2.5 pt-[max(0.65rem,env(safe-area-inset-top,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] flex items-center justify-between border-b shadow-md z-20 shrink-0 ${
              chatTheme === 'velvet-night'
                ? 'bg-slate-900 border-rose-900/60 text-white'
                : 'bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 border-rose-600 text-white shadow-rose-200/50'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setSelectedMessageIds([]);
                  setIsSelectionMode(false);
                }}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                title="Annuler la sélection"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <span className="font-bold text-sm sm:text-base tracking-wide">
                  {selectedMessageIds.length} sélectionné{selectedMessageIds.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={toggleSelectAll}
                className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ml-1 sm:ml-2"
                title={selectedMessageIds.length === filteredMessages.length ? 'Désélectionner tout' : 'Sélectionner tous les messages'}
              >
                {selectedMessageIds.length === filteredMessages.length ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Désélectionner tout</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tout sélectionner</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* If 1 message selected: Modifier button */}
              {selectedMessageIds.length === 1 && (
                <button
                  onClick={() => {
                    const msgToEdit = messages.find((m) => m.id === selectedMessageIds[0]);
                    if (msgToEdit) openEditModal(msgToEdit);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Modifier le texte du message"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Modifier</span>
                </button>
              )}

              {/* Bulk Actions Button (Reaction, Mark Read) */}
              {selectedMessageIds.length > 1 && (
                <button
                  onClick={() => setShowBulkActionModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Actions groupées (Réactions, Lu)"
                >
                  <SmilePlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Actions</span>
                </button>
              )}

              {/* Bulk Delete Button */}
              <button
                onClick={() => {
                  setMessageIdsToDelete([...selectedMessageIds]);
                  setShowDeleteConfirmModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Supprimer la sélection"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Supprimer ({selectedMessageIds.length})</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <div className={`${themeStyles.headerBg} px-3 sm:px-4 py-2.5 pt-[max(0.65rem,env(safe-area-inset-top,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] flex items-center justify-between border-b shadow-2xs z-20 shrink-0 transition-colors duration-300`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back Button (Phone & Fullscreen UI - returns to Journal/other tabs) */}
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 -ml-1 rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                  chatTheme === 'velvet-night'
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-stone-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Retour au menu & aux autres onglets"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Other Partner Avatar with active status & glowing pulse */}
            <div
              className="relative cursor-pointer group shrink-0"
              onClick={() => onSwitchPartner(otherPartnerId)}
              title={`Basculer sur ${otherPartner.name}`}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-2 ring-rose-400/80 ring-offset-2 ring-offset-white shadow-xs group-hover:scale-105 transition-transform">
                {otherPartner.avatarUrl ? (
                  <img
                    src={otherPartner.avatarUrl}
                    alt={otherPartner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-rose-700 bg-rose-100 text-sm">
                    {otherPartner.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full transition-colors ${
                  isOtherPartnerOnline ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-300/60' : 'bg-stone-300'
                }`}
              />
            </div>

            {/* Partner Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={`font-bold text-sm sm:text-base leading-tight truncate ${chatTheme === 'velvet-night' ? 'text-white' : 'text-stone-900'}`}>
                  {otherPartner.name}
                </h2>
                <span className={`text-[11px] border px-2 py-0.5 rounded-full font-medium hidden sm:inline ${themeStyles.badgeBg}`}>
                  Mon Amour
                </span>
              </div>
              
              {/* Online, Typing or Last Seen Status */}
              <p className="text-xs leading-tight truncate flex items-center gap-1.5 mt-0.5">
                {isOtherPartnerTyping ? (
                  <span className="text-rose-500 font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="flex gap-0.5 items-center">
                      <span className="w-1 h-1 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span>en train d'écrire...</span>
                  </span>
                ) : isOtherPartnerOnline ? (
                  <span className={`flex items-center gap-1.5 ${chatTheme === 'velvet-night' ? 'text-emerald-400' : 'text-emerald-600 font-medium'}`}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>en ligne</span>
                  </span>
                ) : (
                  <span className={`flex items-center gap-1.5 ${chatTheme === 'velvet-night' ? 'text-slate-400' : 'text-stone-500'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 inline-block" />
                    <span>{formatLastSeen(otherPartnerPresence?.lastSeen)}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Header Action Buttons: Direct Theme & Motif button + Refresh + More Options */}
          <div className="flex items-center gap-1">
            {onRefreshChat && (
              <button
                type="button"
                onClick={handleManualRefresh}
                className={`p-2 rounded-full transition-colors cursor-pointer relative ${
                  chatTheme === 'velvet-night'
                    ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                    : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Actualiser les messages en direct"
                aria-label="Actualiser les messages"
              >
                <RefreshCw
                  className={`w-4 h-4 transition-transform duration-500 ${
                    isRefreshingChat ? 'animate-spin text-rose-500' : ''
                  }`}
                />
              </button>
            )}

            {onOpenNotificationModal && (
              <button
                type="button"
                onClick={onOpenNotificationModal}
                className={`p-2 rounded-full transition-colors cursor-pointer relative ${
                  chatTheme === 'velvet-night'
                    ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                    : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Gérer les alertes & notifications push hors-ligne"
                aria-label="Alertes de messages"
              >
                <Bell className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowThemePicker(true);
                setShowMoreMenu(false);
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer relative ${
                showThemePicker
                  ? 'bg-rose-100 text-rose-700 dark:bg-slate-800 dark:text-rose-400'
                  : chatTheme === 'velvet-night'
                  ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                  : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Personnaliser les couleurs, bulles & motifs de fond"
              aria-label="Thème et motif de fond"
            >
              <Palette className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                ref={moreButtonRef}
                onClick={() => setShowMoreMenu((prev) => !prev)}
                className={`p-2 rounded-full transition-colors cursor-pointer relative ${
                  showMoreMenu
                    ? 'bg-rose-100 text-rose-700 dark:bg-slate-800 dark:text-rose-400'
                    : chatTheme === 'velvet-night'
                    ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                    : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Options du chat"
                aria-label="Options du chat"
              >
                <MoreVertical className="w-5 h-5" />
                {showSearchBar && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

            {/* Backdrop for closing dropdown */}
            {showMoreMenu && (
              <div
                className="fixed inset-0 z-30"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowExportOptions(false);
                }}
              />
            )}

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  ref={moreMenuRef}
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-rose-200/80 dark:border-rose-900/40 rounded-2xl shadow-xl shadow-rose-950/10 p-2 z-40 text-xs"
                >
                  {/* Switch Duo Profile */}
                  <div className="p-2 border-b border-rose-100/70 dark:border-slate-800 mb-1.5 bg-rose-50/40 dark:bg-slate-800/40 rounded-xl">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-slate-500 mb-1.5 flex items-center justify-between">
                      <span>Profil actif</span>
                      <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchPartner(otherPartnerId);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition-colors cursor-pointer ${themeStyles.badgeBg} hover:opacity-90`}
                      title={`Basculer sur ${otherPartner.name}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <UserCheck className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold text-stone-800 dark:text-slate-200 truncate">
                          Moi : <strong className="font-bold">{currentPartner.name}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-rose-600 font-bold ml-2 shrink-0">
                        Basculer ➔
                      </span>
                    </button>

                    {onOpenNotificationModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          onOpenNotificationModal();
                        }}
                        className="w-full mt-1.5 flex items-center justify-between p-2 rounded-xl border border-rose-200/80 bg-rose-50/70 hover:bg-rose-100 text-xs font-semibold text-rose-900 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <BellRing className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Alertes & Notifications push</span>
                        </div>
                        <span className="text-[10px] text-rose-700 bg-white px-1.5 py-0.5 rounded-full font-bold">
                          Ouvrir
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Section: Actions Discussion (Clear Chat & Export) */}
                  <div className="py-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-rose-400 dark:text-rose-500/80 px-2.5 py-1 flex items-center gap-1">
                      <span>Actions du chat</span>
                    </p>

                    {/* Export Chat */}
                    <div className="rounded-xl overflow-hidden transition-colors">
                      <button
                        type="button"
                        onClick={() => setShowExportOptions((prev) => !prev)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-rose-50/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-rose-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Exporter la discussion</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-150 ${
                                showExportOptions ? 'rotate-180 text-rose-500' : ''
                              }`}
                            />
                          </div>
                          <p className="text-[10px] text-stone-400 dark:text-slate-500 truncate">
                            Sauvegarder en journal texte ou JSON
                          </p>
                        </div>
                      </button>

                      <AnimatePresence>
                        {showExportOptions && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-7 pr-2 py-1 space-y-1 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl my-1 border border-rose-100 dark:border-rose-900/30"
                          >
                            <button
                              type="button"
                              onClick={() => handleExportChat('txt')}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold">Journal d'amour (.txt)</span>
                                <p className="text-[9px] text-stone-400 dark:text-slate-400">
                                  Format doux à lire & imprimer
                                </p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExportChat('json')}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold">Sauvegarde brute (.json)</span>
                                <p className="text-[9px] text-stone-400 dark:text-slate-400">
                                  Données complètes restaurables
                                </p>
                              </div>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Clear Chat */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowClearChatModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer mt-0.5"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Effacer la discussion</span>
                          {messages.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold">
                              {messages.length}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-rose-400/90 dark:text-rose-400/70 truncate">
                          Vider l'historique du fil de chat
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Section: Outils & Recherche */}
                  <div className="pt-1 border-t border-rose-100/70 dark:border-slate-800 my-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-slate-500 px-2.5 py-1">
                      Outils
                    </p>

                    {/* Search in chat */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowSearchBar((prev) => !prev);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer ${
                        showSearchBar
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold'
                          : 'text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Search className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="flex-1">Rechercher dans le chat</span>
                      {showSearchBar && (
                        <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                          Actif
                        </span>
                      )}
                    </button>

                    {/* Selection Mode */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectionMode(true);
                        setSelectedMessageIds([]);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="flex-1">Sélectionner des messages</span>
                    </button>
                  </div>

                  {/* Section: Apparence */}
                  <div className="pt-1 border-t border-rose-100/70 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowThemePicker(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Palette className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="flex-1">Thème & Lisibilité</span>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500">Bulles, fond & motifs</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Backdrop for Theme Picker */}
            {showThemePicker && (
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowThemePicker(false)}
              />
            )}

            {/* Theme / Ambiance & Readability Palette Selector */}
            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  className="absolute right-0 top-11 w-80 sm:w-96 max-h-[85vh] overflow-y-auto no-scrollbar bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-40 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100 dark:border-slate-800 sticky -top-4 -mt-4 pt-3.5 pb-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                    <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-slate-200 text-xs">
                      <Palette className="w-4 h-4 text-rose-500" />
                      <span>Personnalisation du Chat</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowThemePicker(false)}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
                      title="Fermer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Section 1: Sent Bubble Color */}
                  <div className="mb-3.5">
                    <p className="font-semibold text-stone-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Couleur de mes messages :</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                        {SENT_BUBBLE_PRESETS[sentBubbleColor]?.name}
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(SENT_BUBBLE_PRESETS) as SentBubbleColor[]).map((key) => {
                        const preset = SENT_BUBBLE_PRESETS[key];
                        const isSelected = sentBubbleColor === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectSentBubbleColor(key)}
                            className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 ring-1 ring-rose-500'
                                : 'border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-850'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full shrink-0 shadow-2xs ${preset.swatch}`} />
                            <div className="min-w-0">
                              <p className="font-bold text-[11px] text-stone-800 dark:text-slate-200 truncate">
                                {preset.name}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Text Size for Readability */}
                  <div className="mb-3.5">
                    <p className="font-semibold text-stone-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Taille du texte :</span>
                      <span className="text-[10px] text-stone-500 dark:text-slate-400">
                        {CHAT_FONT_SIZES[chatFontSize]?.label}
                      </span>
                    </p>
                    <div className="grid grid-cols-3 gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl">
                      {(['normal', 'large', 'xlarge'] as ChatFontSize[]).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSelectChatFontSize(size)}
                          className={`py-1.5 px-2 rounded-lg text-center font-semibold text-[11px] transition-all cursor-pointer ${
                            chatFontSize === size
                              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                          }`}
                        >
                          {size === 'normal' ? 'Standard' : size === 'large' ? 'Grand' : 'Confort +'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Background Theme */}
                  <div className="mb-3.5">
                    <p className="font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                      Ambiance générale de fond :
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectTheme('rose-powder')}
                        className={`text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                          chatTheme === 'rose-powder' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200/80' : 'hover:bg-stone-50 text-stone-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-rose-400 inline-block shrink-0" />
                        <span className="truncate">🌸 Poudrée</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTheme('velvet-night')}
                        className={`text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                          chatTheme === 'velvet-night' ? 'bg-slate-800 text-rose-400 font-bold border border-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 inline-block shrink-0" />
                        <span className="truncate">🌙 Câline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTheme('ivory-linen')}
                        className={`text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                          chatTheme === 'ivory-linen' ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200' : 'hover:bg-stone-50 text-stone-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-200 inline-block shrink-0" />
                        <span className="truncate">☁️ Ivoire</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 4: Romantic Background Motif / Pattern */}
                  <div className="pt-3 border-t border-stone-100 dark:border-slate-800">
                    <p className="font-semibold text-stone-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                        <span>Motif romantique de fond :</span>
                      </span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        {CHAT_PATTERNS.find((p) => p.id === chatPattern)?.shortLabel}
                      </span>
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2.5">
                      {CHAT_PATTERNS.map((pat) => {
                        const isSelected = chatPattern === pat.id;
                        return (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => handleSelectChatPattern(pat.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                              isSelected
                                ? 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/60 ring-1 ring-rose-500 shadow-2xs'
                                : 'border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-sm shrink-0">{pat.emoji}</span>
                              <span className="font-bold text-[11px] text-stone-800 dark:text-slate-200 truncate">
                                {pat.shortLabel}
                              </span>
                            </div>
                            <span className="text-[9px] text-stone-400 dark:text-slate-400 line-clamp-1">
                              {pat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Pattern Opacity / Intensity selector & Live Preview */}
                    {chatPattern !== 'none' && (
                      <div className="p-2.5 bg-stone-50 dark:bg-slate-850 rounded-xl border border-stone-200/80 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300">
                            Intensité du motif :
                          </span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                            {chatPatternOpacity === 'subtle'
                              ? 'Discret (Subtil)'
                              : chatPatternOpacity === 'medium'
                              ? 'Doux (Recommandé)'
                              : 'Marqué (Accent)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 bg-white/90 dark:bg-slate-800/90 p-0.5 rounded-lg border border-stone-200/60 dark:border-slate-700/60">
                          {(
                            [
                              { id: 'subtle', label: 'Subtil' },
                              { id: 'medium', label: 'Doux' },
                              { id: 'vibrant', label: 'Marqué' },
                            ] as { id: ChatPatternOpacity; label: string }[]
                          ).map((op) => (
                            <button
                              key={op.id}
                              type="button"
                              onClick={() => handleSelectChatPatternOpacity(op.id)}
                              className={`py-1 px-1.5 rounded-md text-center font-semibold text-[10px] transition-all cursor-pointer ${
                                chatPatternOpacity === op.id
                                  ? 'bg-rose-500 text-white shadow-2xs font-bold'
                                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                              }`}
                            >
                              {op.label}
                            </button>
                          ))}
                        </div>

                        {/* Live mini sample preview */}
                        <div className="relative h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-700 flex items-center justify-center">
                          <div className={`absolute inset-0 ${themeStyles.feedBg}`} />
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `url("${getPatternSvgDataUri(chatPattern, chatTheme)}")`,
                              backgroundRepeat: 'repeat',
                              backgroundSize: `${getPatternTileSize(chatPattern) * 0.75}px ${getPatternTileSize(chatPattern) * 0.75}px`,
                              opacity: getPatternOpacityValue(chatPatternOpacity, chatTheme) * 1.3,
                            }}
                          />
                          <div className="relative z-1 px-2.5 py-0.5 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs text-[10px] font-semibold text-stone-700 dark:text-slate-200 shadow-2xs border border-rose-200/50">
                            Aperçu du papier peint intime
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      )}

        {/* Optional Search & Media Filter Bar */}
        <AnimatePresence>
          {showSearchBar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-b px-4 py-2.5 text-xs z-20 transition-colors ${
                chatTheme === 'velvet-night'
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : 'bg-rose-50/90 border-rose-100 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-rose-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un mot doux, un moment..."
                  className={`flex-1 border px-3 py-1.5 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-rose-300 ${
                    chatTheme === 'velvet-night'
                      ? 'bg-slate-850 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-rose-200 text-stone-800 placeholder-stone-400'
                  }`}
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-1 hover:text-rose-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Media Filters Pill Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                <span className="opacity-60 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" /> Filtrer :
                </span>
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'image', label: '📷 Photos' },
                  { id: 'audio', label: '🎵 Vocaux' },
                  { id: 'loveNote', label: '💌 Mots doux' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMediaFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                      mediaFilter === tab.id
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : chatTheme === 'velvet-night'
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white/80 text-stone-600 hover:bg-white border border-rose-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* 2. CHAT CANVAS & MESSAGES FEED */}
        {/* ================================================================= */}
        <div className={`flex-1 relative min-h-0 overflow-hidden flex flex-col ${themeStyles.feedBg} transition-colors duration-300`}>
          {/* Subtle Repeating Romantic Background Wallpaper Pattern Layer */}
          {chatPattern !== 'none' && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-0"
              style={{
                backgroundImage: `url("${getPatternSvgDataUri(chatPattern, chatTheme)}")`,
                backgroundRepeat: 'repeat',
                backgroundSize: `${getPatternTileSize(chatPattern)}px ${getPatternTileSize(chatPattern)}px`,
                opacity: getPatternOpacityValue(chatPatternOpacity, chatTheme),
              }}
              aria-hidden="true"
            />
          )}

          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 space-y-4 relative z-10 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
          {/* Notification Activation Banner (shown if push alerts not yet enabled on this device) */}
          <NotificationActivationBanner
            profile={profile}
            activePartnerId={activePartnerId}
            onOpenSettingsModal={onOpenNotificationModal}
          />

          {/* Private Intimate Space Indicator */}
          <div className="flex justify-center my-0.5">
            <div className={`backdrop-blur-xs border text-[11px] px-3 py-1 rounded-full text-center shadow-2xs flex items-center gap-1.5 ${
              chatTheme === 'velvet-night'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                : 'bg-white/90 border-rose-100 text-stone-600'
            }`}>
              <span>🔒</span>
              <span className="font-semibold text-rose-500">Espace intime</span>
              <span className="text-stone-400">•</span>
              <span>Synchronisé à deux</span>
            </div>
          </div>

          {/* Grouped Messages in WhatsApp chronological flow */}
          {groupedMessages.map((group) => (
            <div key={group.dateKey} className="flex flex-col">
              {/* WhatsApp-style Date divider badge */}
              <div className="flex justify-center my-3 sticky top-1 z-10 select-none">
                <span className={`backdrop-blur-md font-semibold text-[11px] px-3.5 py-1 rounded-lg shadow-2xs border ${
                  chatTheme === 'velvet-night'
                    ? 'bg-slate-900/90 text-slate-300 border-slate-800'
                    : 'bg-white/90 text-stone-600 border-rose-100/80'
                }`}>
                  {group.dateLabel}
                </span>
              </div>

              {/* Message items strictly ordered by sending time */}
              {group.items.map((msg, index) => {
                const prevMsg = index > 0 ? group.items[index - 1] : null;
                const nextMsg = index < group.items.length - 1 ? group.items[index + 1] : null;
                const isMe = msg.senderId === activePartnerId;

                const timeCurrent = getMsgTimestamp(msg);
                const timePrev = prevMsg ? getMsgTimestamp(prevMsg) : 0;
                const timeNext = nextMsg ? getMsgTimestamp(nextMsg) : 0;

                // WhatsApp-like clustering: consecutive messages from same sender within 5 mins
                const isFirstInBurst = !prevMsg || prevMsg.senderId !== msg.senderId || (timeCurrent - timePrev > 5 * 60 * 1000);
                const isLastInBurst = !nextMsg || nextMsg.senderId !== msg.senderId || (timeNext - timeCurrent > 5 * 60 * 1000);

                const msgDate = new Date(timeCurrent || Date.now());
                const msgTime = !isNaN(msgDate.getTime())
                  ? msgDate.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '';
                const senderName = isMe ? currentPartner.name : otherPartner.name;
                const reactionsList = Object.entries(msg.reactions || {});
                const isMsgRead =
                  msg.readStatus === 'read' ||
                  msg.readStatus === true ||
                  (!msg.readStatus && msg.status === 'read');
                const isLoveNote = Boolean(msg.content && (msg.content.startsWith('💌') || msg.content.includes('Mot doux')));

                // WhatsApp bubble corners
                const bubbleCorners = isMe
                  ? isFirstInBurst
                    ? 'rounded-2xl rounded-tr-xs'
                    : 'rounded-2xl rounded-tr-md'
                  : isFirstInBurst
                  ? 'rounded-2xl rounded-tl-xs'
                  : 'rounded-2xl rounded-tl-md';

                const isSelected = selectedMessageIds.includes(msg.id);
                const isTextEditable = Boolean(msg.content && msg.content !== '🎵 Note vocale' && msg.content !== '📷 Photo partagée');

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} ${
                      isFirstInBurst ? 'mt-3 sm:mt-3.5' : 'mt-1 sm:mt-1.5'
                    }`}
                  >
                    <div className={`flex items-center gap-2 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {/* Selection checkbox when in selection mode (partner message) */}
                      {(isSelectionMode || selectedMessageIds.length > 0) && !isMe && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectMessage(msg.id);
                          }}
                          className="p-1 shrink-0 cursor-pointer transition-transform hover:scale-110"
                          title={isSelected ? 'Désélectionner' : 'Sélectionner'}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-rose-500 text-white shadow-xs scale-105'
                                : 'border-2 border-stone-300 dark:border-slate-600 hover:border-rose-400 bg-white/80 dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      )}

                      {/* Message Bubble Container with long-press, double tap, and selection listener */}
                      <div
                        onTouchStart={(e) => handleMessageTouchStart(msg, e)}
                        onTouchMove={handleMessageTouchMove}
                        onTouchEnd={handleMessageTouchEnd}
                        onTouchCancel={handleMessageTouchEnd}
                        onContextMenu={(e) => handleMessageContextMenu(msg, e)}
                        onClick={(e) => {
                          if (longPressTriggeredRef.current) {
                            e.stopPropagation();
                            e.preventDefault();
                            longPressTriggeredRef.current = false;
                            return;
                          }
                          if (isSelectionMode || selectedMessageIds.length > 0) {
                            e.stopPropagation();
                            toggleSelectMessage(msg.id);
                          } else {
                            handleMessageDoubleTap(e, msg);
                          }
                        }}
                        style={{
                          WebkitTouchCallout: 'none',
                          WebkitUserSelect: 'none',
                          userSelect: 'none',
                          touchAction: 'manipulation',
                        }}
                        className={`relative max-w-[85%] sm:max-w-[76%] px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-sm transition-all select-none cursor-pointer flex flex-col ${bubbleCorners} ${
                          msg.content?.startsWith('Sticker ') && msg.mediaType === 'image'
                            ? (isMe
                                ? 'bg-rose-500/10 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50'
                                : 'bg-white/90 dark:bg-slate-800/90 border border-stone-200/60 dark:border-slate-700/50')
                            : (isMe
                                ? themeStyles.myBubble
                                : themeStyles.partnerBubble)
                        } ${isLoveNote ? 'border-2 border-rose-300/80 bg-rose-50/90' : ''} ${
                          isSelected ? 'ring-2 ring-rose-500 ring-offset-2 scale-[1.01]' : ''
                        } ${
                          messageActionSheet?.id === msg.id
                            ? 'ring-2 ring-rose-400 dark:ring-rose-300 shadow-md scale-[1.015]'
                            : ''
                        }`}
                      >
                        {/* Sender name on received message - ONLY ON FIRST IN BURST */}
                        {!isMe && isFirstInBurst && (
                          <p className="text-[11.5px] font-bold text-rose-500 mb-1 flex items-center gap-1">
                            <span>{senderName}</span>
                            <span className="text-[9.5px] opacity-70">💕</span>
                          </p>
                        )}

                        {/* Quoted Reply if present */}
                        {msg.replyTo && (
                          <div
                            className={`mb-2 p-2.5 rounded-xl text-xs ${
                              isMe
                                ? 'bg-black/25 backdrop-blur-xs border-l-[3.5px] border-white text-white'
                                : chatTheme === 'velvet-night'
                                ? 'bg-slate-700/60 border-l-[3.5px] border-rose-400 text-slate-200'
                                : 'bg-rose-50/90 border-l-[3.5px] border-rose-400 text-stone-800'
                            }`}
                          >
                            <p className={`font-bold text-[11.5px] ${isMe ? 'text-white' : 'text-rose-600'}`}>
                              {msg.replyTo.senderId === activePartnerId ? 'Vous' : otherPartner.name}
                            </p>
                            <p className="truncate text-[12px] opacity-90 leading-snug">{msg.replyTo.content}</p>
                          </div>
                        )}

                        {/* Photo or Romantic Sticker Content */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          msg.content?.startsWith('Sticker ') ? (
                            <div className="flex flex-col items-center justify-center p-1 my-1">
                              <div className="w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center drop-shadow-md hover:scale-105 transition-transform">
                                <img
                                  src={msg.mediaUrl}
                                  alt={msg.content}
                                  className="w-full h-full object-contain pointer-events-none"
                                />
                              </div>
                              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 opacity-90">
                                {msg.content.replace('Sticker ', '')}
                              </span>
                            </div>
                          ) : (
                            <div className="rounded-xl overflow-hidden mb-2 bg-black/10 cursor-pointer relative group/img border border-white/15">
                              <img
                                src={msg.mediaUrl}
                                alt="Photo partagée"
                                onClick={() => {
                                  const idx = chatPhotoItems.findIndex(
                                    (p) => p.id === msg.id || p.photoUrl === msg.mediaUrl
                                  );
                                  setActiveChatPhotoIndex(idx >= 0 ? idx : 0);
                                }}
                                className="max-h-72 w-auto object-contain rounded-xl hover:opacity-95 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none text-xs font-semibold">
                                🔍 Cliquer pour agrandir
                              </div>
                            </div>
                          )
                        )}

                        {/* Video Content */}
                        {(msg.mediaType === 'video' || msg.videoUrl) && (
                          <ChatVideoBubble
                            message={msg}
                            isMe={isMe}
                            chatTheme={chatTheme}
                            onOpenFullscreen={() => {
                              const idx = chatPhotoItems.findIndex(
                                (p) =>
                                  p.id === msg.id ||
                                  p.videoUrl === (msg.videoUrl || msg.mediaUrl) ||
                                  p.photoUrl === msg.videoThumbnail
                              );
                              setActiveChatPhotoIndex(idx >= 0 ? idx : 0);
                            }}
                          />
                        )}

                        {/* Enhanced Cross-Platform Voice Note Player */}
                        {msg.mediaType === 'audio' && (
                          <ChatAudioBubble
                            message={msg}
                            isMe={isMe}
                            chatTheme={chatTheme}
                          />
                        )}

                        {/* Love Note Card format */}
                        {isLoveNote ? (
                          <div className="py-1">
                            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs mb-1">
                              <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
                              <span>Billet doux pour toi</span>
                            </div>
                            <p className={`font-serif-romantic italic text-stone-900 leading-relaxed ${CHAT_FONT_SIZES[chatFontSize].textClass}`}>
                              {msg.content}
                            </p>
                          </div>
                        ) : (
                          /* Standard Text Content with customizable comfortable font size and contrast */
                          msg.content && msg.content !== '🎵 Note vocale' && msg.content !== '📷 Photo partagée' && !msg.content.startsWith('Sticker ') && (
                            <p className={`leading-[1.55] whitespace-pre-wrap break-words tracking-[0.01em] ${CHAT_FONT_SIZES[chatFontSize].textClass} ${
                              isMe
                                ? themeStyles.myBubbleText
                                : chatTheme === 'velvet-night'
                                ? 'text-slate-100 font-normal antialiased'
                                : 'text-stone-900 font-normal antialiased'
                            }`}>
                              {msg.content}
                            </p>
                          )
                        )}

                        {/* Bottom Info: Timestamp, WhatsApp-style Checkmarks & Edited tag */}
                        <div className={`flex items-center justify-end gap-1.5 text-[11px] mt-1 select-none self-end ${
                          isMe
                            ? themeStyles.myBubbleMeta
                            : chatTheme === 'velvet-night'
                            ? 'text-slate-400'
                            : 'text-stone-400'
                        }`}>
                          {msg.isEdited && (
                            <span
                              className="text-[9.5px] italic opacity-90 mr-0.5"
                              title={msg.editedAt ? `Modifié à ${new Date(msg.editedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Modifié'}
                            >
                              modifié
                            </span>
                          )}
                          <span title={`Heure exacte d'arrivée : ${msgTime}`} className="tracking-tight">
                            {msgTime}
                          </span>
                          {isMe && (
                            <span className="inline-flex items-center ml-0.5">
                              {isMsgRead ? (
                                <CheckCheck
                                  className="w-3.5 h-3.5 text-sky-300 stroke-[2.5]"
                                  title="Lu"
                                />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck
                                  className="w-3.5 h-3.5 text-white/90 stroke-[2.2]"
                                  title="Distribué"
                                />
                              ) : (
                                <Check
                                  className="w-3.5 h-3.5 text-white/80 stroke-[2.2]"
                                  title="Envoyé"
                                />
                              )}
                            </span>
                          )}
                        </div>

                      {/* Reactions Badges underneath bubble */}
                      {reactionsList.length > 0 && (
                        <div className="absolute -bottom-2.5 left-2 bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700 rounded-full px-1.5 py-0.5 shadow-xs flex items-center gap-1 text-xs">
                          {reactionsList.map(([pId, emoji]) => (
                            <span key={pId} title={`Réaction de ${pId === 'p1' ? profile.partner1.name : profile.partner2.name}`}>
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selection checkbox when in selection mode (my message) */}
                    {(isSelectionMode || selectedMessageIds.length > 0) && isMe && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectMessage(msg.id);
                        }}
                        className="p-1 shrink-0 cursor-pointer transition-transform hover:scale-110 ml-1"
                        title={isSelected ? 'Désélectionner' : 'Sélectionner'}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-rose-500 text-white shadow-xs scale-105'
                              : 'border-2 border-stone-300 dark:border-slate-600 hover:border-rose-400 bg-white/80 dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    )}
                  </div>

                    {/* Quick Hover Action Bar (Select, Edit, Delete, Reply, Reactions) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 text-stone-400 text-xs px-2">
                      <span className="text-[9px] text-stone-400 hidden sm:inline mr-1">
                        (Double-clic pour ❤️)
                      </span>

                      {/* Options / Action sheet trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMessageActionSheet(msg);
                        }}
                        className="p-1 rounded-full cursor-pointer hover:bg-rose-50 dark:hover:bg-slate-800 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Options du message (modifier, supprimer, copier...)"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Select for multi-action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSelectionMode(true);
                          toggleSelectMessage(msg.id);
                        }}
                        className={`p-1 rounded-full cursor-pointer hover:bg-rose-50 dark:hover:bg-slate-800 ${
                          isSelected ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                        }`}
                        title="Sélectionner pour action groupée"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit single message */}
                      {isTextEditable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(msg);
                          }}
                          className="p-1 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                          title="Modifier le texte de ce message"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete single message */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageIdsToDelete([msg.id]);
                          setShowDeleteConfirmModal(true);
                        }}
                        className="p-1 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                        title="Supprimer ce message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 hover:text-rose-600 hover:bg-rose-50/50 rounded-full cursor-pointer"
                        title="Répondre"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '❤️')}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        title="Réagir avec un cœur"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '🥰')}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        title="Réagir avec amour"
                      >
                        🥰
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '💋')}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        title="Réagir avec un bisou"
                      >
                        💋
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Typing Indicator Bubble */}
          {isOtherPartnerTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 max-w-[120px] rounded-2xl rounded-tl-xs px-3.5 py-2.5 border shadow-xs ${
                chatTheme === 'velvet-night'
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white border-rose-100 text-stone-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </motion.div>
          )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className={`absolute bottom-4 right-5 p-2.5 rounded-full shadow-lg border transition-all hover:scale-105 z-20 cursor-pointer ${
                chatTheme === 'velvet-night'
                  ? 'bg-slate-800 text-slate-200 hover:text-rose-400 border-slate-700'
                  : 'bg-white text-stone-600 hover:text-rose-600 border-rose-100'
              }`}
              title="Revenir aux derniers messages"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ================================================================= */}
        {/* 3. QUOTED REPLY & PHOTO COMPRESSION BANNERS */}
        {/* ================================================================= */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-t px-4 py-2 flex items-center justify-between text-xs z-10 ${
                chatTheme === 'velvet-night'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-rose-50/90 border-rose-100'
              }`}
            >
              <div className="border-l-4 border-rose-500 pl-2.5 truncate">
                <p className="font-bold text-rose-500">
                  Réponse à {replyingTo.senderId === activePartnerId ? 'Vous-même' : otherPartner.name}
                </p>
                <p className={`truncate ${chatTheme === 'velvet-night' ? 'text-slate-300' : 'text-stone-600'}`}>
                  {replyingTo.content}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {compressingStats && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className={`border-t px-3.5 py-2 flex items-center justify-between text-xs z-10 ${
                compressingStats.isCompressing
                  ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {compressingStats.isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                    <span className="truncate">
                      {compressingStats.customMessage ||
                        `Optimisation de la photo mobile (${formatBytes(compressingStats.originalSize || 0)})...`}
                    </span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {compressingStats.customMessage || (
                        <>
                          Photo optimisée : {formatBytes(compressingStats.originalSize || 0)} ➔ {formatBytes(compressingStats.compressedSize || 0)}{' '}
                          <strong className="text-emerald-700">(-{compressingStats.reduction}%)</strong>
                        </>
                      )}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => setCompressingStats(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* 4. QUICK LOVE PHRASES EXPRESS RIBBON */}
        {/* ================================================================= */}
        {showQuickPhrases && (
          <div className={`px-3 py-1.5 border-t flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar ${
            chatTheme === 'velvet-night'
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-rose-50/60 border-rose-100/70'
          }`}>
            <span className="text-rose-500 font-semibold flex items-center gap-1 shrink-0">
              <MessageSquareHeart className="w-3.5 h-3.5" /> Mots doux :
            </span>
            {quickLovePhrases.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(phrase.text)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all hover:scale-105 cursor-pointer font-medium shadow-2xs ${
                  chatTheme === 'velvet-night'
                    ? 'bg-slate-800 text-rose-300 hover:bg-slate-700 border border-slate-700'
                    : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200/80'
                }`}
              >
                {phrase.label}
              </button>
            ))}
          </div>
        )}

        {/* ================================================================= */}
        {/* 5. UNIFIED STICKERS & EMOJIS DRAWER TRAY */}
        {/* ================================================================= */}
        <AnimatePresence>
          {showStickerPicker && (
            <RomanticStickerPicker
              isOpen={showStickerPicker}
              onClose={() => setShowStickerPicker(false)}
              onSelectSticker={handleSelectRomanticSticker}
              onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
              chatTheme={chatTheme}
              initialMode="stickers"
            />
          )}
        </AnimatePresence>

        {/* Legacy emoji picker drawer fallback */}
        <AnimatePresence>
          {showEmojiPicker && !showStickerPicker && (
            <RomanticStickerPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onSelectSticker={handleSelectRomanticSticker}
              onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
              chatTheme={chatTheme}
              initialMode="emojis"
            />
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* 6. ATTACHMENT ACTION MENU */}
        {/* ================================================================= */}
        <AnimatePresence>
          {showAttachmentMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={`absolute bottom-16 left-3 sm:left-6 rounded-2xl shadow-xl border p-2 z-30 flex flex-col gap-1 min-w-[220px] ${
                chatTheme === 'velvet-night'
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-white border-rose-100 text-stone-700'
              }`}
            >
              <button
                onClick={() => {
                  soundEffects.playSoftTap();
                  setShowCameraModal(true);
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <Camera className="w-4 h-4" />
                </div>
                <span>Prendre une photo en direct</span>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">Photos & Vidéos (multiples)</div>
                  <div className="text-[10px] text-stone-500 font-normal">Importer plusieurs photos et vidéos à la fois</div>
                </div>
              </button>

              <button
                onClick={() => {
                  videoInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-purple-500/10 hover:text-purple-600 transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">Vidéos (multiples)</div>
                  <div className="text-[10px] text-stone-500 font-normal">Importer plusieurs vidéos souvenirs</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSendMessage({
                    senderId: activePartnerId,
                    content: `💌 Mot doux : Tu es la plus belle chose qui me soit arrivée dans ma vie ❤️`,
                  });
                  soundEffects.playMessageSent();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-pink-500/10 hover:text-pink-500 transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-pink-100 text-pink-600">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <span>Billet doux pour toi</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playSoftTap();
                  setShowStickerPicker(true);
                  setShowAttachmentMenu(false);
                  setShowEmojiPicker(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <StickerIcon className="w-4 h-4" />
                </div>
                <span>Stickers romantiques</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* 7. CHAT BOTTOM INPUT BAR (WHATSAPP-STYLE UNIFIED PILL CAPSULE) */}
        {/* ================================================================= */}
        <div className={`px-2.5 sm:px-4 py-2 pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] z-20 shrink-0 border-t transition-colors ${
          chatTheme === 'velvet-night'
            ? 'bg-slate-950/85 border-slate-800/80 backdrop-blur-md'
            : 'bg-stone-100/80 border-rose-100/60 backdrop-blur-md'
        }`}>
          {/* Main Capsule Container */}
          <div className={`w-full max-w-4xl mx-auto rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 shadow-xs transition-all border ${
            chatTheme === 'velvet-night'
              ? 'bg-slate-900 border-slate-700/80 text-slate-100 focus-within:border-rose-500/50 focus-within:shadow-rose-950/30'
              : 'bg-white border-stone-200/90 text-stone-800 focus-within:border-stone-300 focus-within:shadow-xs'
          }`}>
            {/* 1. Attachment Paperclip Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setShowAttachmentMenu(!showAttachmentMenu);
                setShowEmojiPicker(false);
                setShowStickerPicker(false);
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
                showAttachmentMenu
                  ? 'text-rose-600 bg-rose-50 dark:bg-slate-800'
                  : 'text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
              title="Joindre un fichier ou mot doux"
              aria-label="Pièce jointe"
              id="chat-paperclip-btn"
            >
              <Paperclip className="w-5 h-5 -rotate-45" />
            </button>

            {/* 2. Emoji & Stickers Smile Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                if (showStickerPicker || showEmojiPicker) {
                  setShowStickerPicker(false);
                  setShowEmojiPicker(false);
                } else {
                  setShowStickerPicker(true);
                }
                setShowAttachmentMenu(false);
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
                showStickerPicker || showEmojiPicker
                  ? 'text-rose-600 bg-rose-50 dark:bg-slate-800'
                  : 'text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
              title="Stickers et Emojis"
              aria-label="Stickers et Emojis"
              id="chat-sticker-emoji-btn"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* 3. Text Input OR Recording in-progress inside the capsule */}
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between gap-2 min-w-0 px-2 py-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <div className="flex items-center gap-0.5 sm:gap-1 h-5 shrink-0">
                    {recordingAudioLevels.map((lvl, i) => (
                      <span
                        key={i}
                        className="w-1 bg-rose-500 rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(20, Math.min(100, lvl))}%` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-[13px] font-bold text-rose-500 font-mono tracking-tight shrink-0">
                    {formatAudioTime(recordSeconds)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="px-2.5 py-1 text-stone-500 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-full text-xs font-medium cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white cursor-pointer shadow-xs transition-transform hover:scale-105 active:scale-95"
                    title="Envoyer la note vocale"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center min-w-0">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onFocus={() => {
                    setShowEmojiPicker(false);
                    setShowStickerPicker(false);
                    setShowAttachmentMenu(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Entrez un message"
                  style={{ minHeight: '38px', maxHeight: '120px' }}
                  className={`w-full bg-transparent ${CHAT_FONT_SIZES[chatFontSize].inputClass} py-2 px-1 leading-normal resize-none outline-none border-none overflow-y-auto no-scrollbar transition-all ${
                    chatTheme === 'velvet-night'
                      ? 'text-white placeholder-slate-400'
                      : 'text-stone-800 placeholder-stone-400'
                  }`}
                  id="chat-message-input"
                />
                {inputText.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText('');
                      if (textareaRef.current) {
                        textareaRef.current.style.height = '38px';
                      }
                    }}
                    className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 cursor-pointer rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    title="Effacer le texte"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* 4. Far Right Action inside capsule: Send or Mic */}
            {!isRecording && (
              inputText.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-xs"
                  title="Envoyer le message"
                  aria-label="Envoyer"
                  id="chat-send-btn"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2 text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white rounded-full transition-colors cursor-pointer shrink-0 hover:bg-stone-100 dark:hover:bg-slate-800"
                  title="Enregistrer une note vocale"
                  aria-label="Enregistrer une note vocale"
                  id="chat-mic-btn"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Hidden inputs for batch image and video uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleVideoSelect}
          className="hidden"
        />
      </div>

      {/* ================================================================= */}
      {/* 8. FULLSCREEN PHOTO VIEWER (SWIPE & PINCH-TO-ZOOM LIKE PHONE) */}
      {/* ================================================================= */}
      <MobilePhotoViewer
        items={chatPhotoItems}
        initialIndex={activeChatPhotoIndex ?? 0}
        isOpen={activeChatPhotoIndex !== null}
        onClose={() => setActiveChatPhotoIndex(null)}
        onIndexChange={(newIdx) => setActiveChatPhotoIndex(newIdx)}
      />

      {/* ================================================================= */}
      {/* 8.5. LONG-PRESS / OPTIONS ACTION SHEET (MOBILE & IPHONE FIRST) */}
      {/* ================================================================= */}
      <AnimatePresence>
        {messageActionSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4"
            onClick={() => setMessageActionSheet(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-stone-200/80 dark:border-slate-800 p-4 sm:p-5 flex flex-col gap-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              {/* Drag handle pill for mobile */}
              <div className="w-10 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden shrink-0" />

              {/* Quick Reactions Bar */}
              <div className="flex items-center justify-between gap-1 p-2 bg-rose-50/70 dark:bg-slate-800/80 rounded-2xl border border-rose-100/80 dark:border-slate-700/60 overflow-x-auto no-scrollbar shrink-0">
                {['❤️', '🥰', '😘', '😂', '🥺', '🔥', '👍', '🌹'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      handleReaction(messageActionSheet.id, emoji);
                      soundEffects.playHeartPulse();
                      setMessageActionSheet(null);
                    }}
                    className="text-2xl p-1.5 hover:scale-125 active:scale-95 transition-transform cursor-pointer rounded-xl hover:bg-white/60 dark:hover:bg-slate-700 shrink-0"
                    title={`Réagir avec ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Message Snippet Card Preview */}
              <div className="p-3 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border border-stone-100 dark:border-slate-800/80 flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                  messageActionSheet.senderId === activePartnerId
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-emerald-500 text-white shadow-xs'
                }`}>
                  {(messageActionSheet.senderId === activePartnerId ? currentPartner.avatar : otherPartner.avatar) ? (
                    <img
                      src={messageActionSheet.senderId === activePartnerId ? currentPartner.avatar : otherPartner.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{messageActionSheet.senderId === activePartnerId ? 'Vous'[0] : otherPartner.name[0]?.toUpperCase() || 'A'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {messageActionSheet.senderId === activePartnerId ? 'Votre message' : otherPartner.name}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-slate-400 shrink-0">
                      {formatMessageTime(messageActionSheet.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed break-words">
                    {messageActionSheet.content || (
                      messageActionSheet.mediaType === 'image' ? '📷 Photo partagée' :
                      messageActionSheet.mediaType === 'video' ? '🎬 Vidéo partagée' :
                      messageActionSheet.mediaType === 'audio' ? '🎙️ Note vocale' : 'Message'
                    )}
                  </p>
                </div>
              </div>

              {/* Action Menu List */}
              <div className="flex flex-col divide-y divide-stone-100 dark:divide-slate-800 rounded-2xl bg-stone-50/50 dark:bg-slate-800/40 border border-stone-100 dark:border-slate-800 overflow-hidden">
                {/* 1. Edit (Modifier) - if sender is me and has editable text */}
                {messageActionSheet.senderId === activePartnerId &&
                  Boolean(messageActionSheet.content) &&
                  !messageActionSheet.content.startsWith('Sticker ') &&
                  messageActionSheet.mediaType !== 'audio' && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = messageActionSheet;
                      setMessageActionSheet(null);
                      openEditModal(target);
                    }}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-rose-50/80 dark:hover:bg-slate-800 transition-colors cursor-pointer group text-stone-700 dark:text-slate-200"
                    id="action-sheet-edit-btn"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <Pencil className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          Modifier le message
                        </p>
                        <p className="text-[11px] text-stone-400 dark:text-slate-400">
                          Corriger une faute ou changer le texte
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* 2. Reply (Répondre) */}
                <button
                  type="button"
                  onClick={() => {
                    const target = messageActionSheet;
                    setMessageActionSheet(null);
                    setReplyingTo(target);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-stone-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer group text-stone-700 dark:text-slate-200"
                  id="action-sheet-reply-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <CornerUpLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Répondre
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-slate-400">
                        Citer ce message dans votre réponse
                      </p>
                    </div>
                  </div>
                </button>

                {/* 3. Copy (Copier le texte) */}
                {messageActionSheet.content && (
                  <button
                    type="button"
                    onClick={() => {
                      if (messageActionSheet.content) {
                        navigator.clipboard.writeText(messageActionSheet.content);
                        setChatToastFeedback("Texte copié dans le presse-papiers ! 📋");
                        setTimeout(() => setChatToastFeedback(null), 2500);
                        soundEffects.playSoftTap();
                      }
                      setMessageActionSheet(null);
                    }}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-stone-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer group text-stone-700 dark:text-slate-200"
                    id="action-sheet-copy-btn"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Copy className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          Copier le texte
                        </p>
                        <p className="text-[11px] text-stone-400 dark:text-slate-400">
                          Copier dans le presse-papiers
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* 4. Select (Sélectionner pour action groupée) */}
                <button
                  type="button"
                  onClick={() => {
                    const targetId = messageActionSheet.id;
                    setMessageActionSheet(null);
                    setIsSelectionMode(true);
                    if (!selectedMessageIds.includes(targetId)) {
                      setSelectedMessageIds((prev) => [...prev, targetId]);
                    }
                  }}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-stone-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer group text-stone-700 dark:text-slate-200"
                  id="action-sheet-select-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Sélectionner
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-slate-400">
                        Sélectionner pour action groupée
                      </p>
                    </div>
                  </div>
                </button>

                {/* 5. Delete (Supprimer) */}
                <button
                  type="button"
                  onClick={() => {
                    const targetId = messageActionSheet.id;
                    setMessageActionSheet(null);
                    setMessageIdsToDelete([targetId]);
                    setShowDeleteConfirmModal(true);
                  }}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer group text-rose-600 dark:text-rose-400"
                  id="action-sheet-delete-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        Supprimer ce message
                      </p>
                      <p className="text-[11px] text-rose-500/80 dark:text-rose-400/70">
                        Effacer de la conversation
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => setMessageActionSheet(null)}
                className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* 9. EDIT MESSAGE MODAL */}
      {/* ================================================================= */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setEditingMessage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-stone-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-100 font-bold">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <span>Modifier le message</span>
                </div>
                <button
                  onClick={() => setEditingMessage(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Modifiez le contenu de votre message ci-dessous :
                </p>
                <textarea
                  value={editInputText}
                  onChange={(e) => setEditInputText(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder="Tapez le nouveau texte..."
                  className="w-full text-sm rounded-2xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 p-3.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-400 resize-none transition-all"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingMessage(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSavingEdit || !editInputText.trim()}
                  onClick={executeSaveEdit}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isSavingEdit ? (
                    <span>Enregistrement...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* 11. DELETE CONFIRMATION MODAL */}
      {/* ================================================================= */}
      <AnimatePresence>
        {showDeleteConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteConfirmModal(false);
                setMessageIdsToDelete([]);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-slate-800 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
                {messageIdsToDelete.length > 1
                  ? `Supprimer ${messageIdsToDelete.length} messages ?`
                  : 'Supprimer ce message ?'}
              </h4>
              <p className="text-xs text-stone-500 dark:text-slate-400 mb-5 leading-relaxed">
                {messageIdsToDelete.length > 1
                  ? `Ces ${messageIdsToDelete.length} messages seront définitivement effacés de votre conversation pour vous deux.`
                  : 'Ce message sera définitivement effacé de la conversation pour vous deux.'}
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setMessageIdsToDelete([]);
                  }}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDeleteMessages}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isDeleting ? (
                    <span>Suppression...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* 11.5. CLEAR ENTIRE CHAT CONFIRMATION MODAL */}
      {/* ================================================================= */}
      <AnimatePresence>
        {showClearChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => {
              if (!isDeleting) setShowClearChatModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-100 dark:border-slate-800 text-center relative overflow-hidden"
            >
              {/* Soft romantic glow decoration */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-200/40 dark:bg-rose-950/40 rounded-full blur-2xl pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3.5 shadow-xs border border-rose-200/60 dark:border-rose-900/50">
                <Trash2 className="w-7 h-7" />
              </div>

              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1.5 flex items-center justify-center gap-1.5">
                <span>Effacer la discussion ?</span>
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500 inline" />
              </h4>

              <p className="text-xs text-stone-600 dark:text-slate-300 mb-3 leading-relaxed">
                {messages.length > 0 ? (
                  <>
                    Vous êtes sur le point d'effacer les{' '}
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">{messages.length} messages</strong> de votre
                    conversation. L'historique sera réinitialisé pour vous deux.
                  </>
                ) : (
                  'La conversation ne contient aucun message pour le moment.'
                )}
              </p>

              {messages.length > 0 && (
                <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-3 mb-4 text-left">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-stone-700 dark:text-slate-300">
                      <span className="font-semibold text-rose-700 dark:text-rose-300">Gardez un souvenir !</span>
                      <p className="mt-0.5 text-stone-500 dark:text-slate-400">
                        Téléchargez votre journal de conversation avant d'effacer les messages.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleExportChat('txt')}
                        className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 underline flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exporter maintenant (.txt)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowClearChatModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Conserver
                </button>
                <button
                  type="button"
                  disabled={isDeleting || messages.length === 0}
                  onClick={handleClearChatConfirm}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isDeleting ? (
                    <span>Effacement...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Effacer tout</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* 12. BULK ACTION MODAL */}
      {/* ================================================================= */}
      <AnimatePresence>
        {showBulkActionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowBulkActionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 dark:border-slate-800">
                <div className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                  Actions groupées ({selectedMessageIds.length})
                </div>
                <button
                  onClick={() => setShowBulkActionModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Emoji reactions */}
                <div>
                  <p className="text-xs font-medium text-stone-600 dark:text-slate-300 mb-2">
                    Réagir à toute la sélection :
                  </p>
                  <div className="flex items-center justify-around bg-stone-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-stone-100 dark:border-slate-700/60">
                    {['❤️', '😍', '😂', '🥺', '🔥', '💋', '👏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => executeBulkReaction(emoji)}
                        className="text-2xl hover:scale-125 transition-transform p-1 cursor-pointer"
                        title={`Réagir avec ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mark as read */}
                <button
                  onClick={executeBulkMarkAsRead}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                  <span>Marquer tout comme lu</span>
                </button>

                {/* Delete button from modal */}
                <button
                  onClick={() => {
                    setShowBulkActionModal(false);
                    setMessageIdsToDelete([...selectedMessageIds]);
                    setShowDeleteConfirmModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer les {selectedMessageIds.length} messages</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live In-App Camera Viewfinder Modal for Chat */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={handlePhotoCapturedFromCamera}
        title="Prendre une photo pour le chat"
        subtitle="Capturez et envoyez directement votre photo à votre moitié"
        submitLabel="Envoyer dans le chat"
        allowCaption={true}
      />
    </div>
  );
};

export const WhatsAppChatView = ChatView;
export type WhatsAppChatViewProps = ChatViewProps;
