import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Mic,
  Paperclip,
  Check,
  CheckCheck,
  X,
  Search,
  CornerUpLeft,
  Image as ImageIcon,
  ChevronDown,
  Trash2,
  Copy,
  ArrowLeft,
  MoreVertical,
  Download,
  Bell,
  Camera,
  Video,
  RefreshCw,
  Share2,
  UserCheck,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { MobilePhotoViewer, PhotoViewerItem } from '../MobilePhotoViewer';
import { CameraCaptureModal } from '../modals/CameraCaptureModal';
import { useBackHandler } from '../../lib/backNavigation';
import { ChatVideoBubble } from '../chat/ChatVideoBubble';
import { ChatAudioBubble } from '../chat/ChatAudioBubble';
import { getSupportedAudioMimeType, formatAudioTime, audioBlobToDataUrl } from '../../lib/audioRecorderUtils';
import { uploadAndPersistMedia } from '../../lib/videoUtils';
import { CoupleProfile, PartnerId, ChatMessage, MissYouPulse } from '../../types';
import {
  updateChatMessageReaction,
  updateChatMessageStatus,
  setChatTypingStatus,
  updatePartnerPresence,
  subscribeChatTypingStatus,
  deleteMultipleChatMessagesFromDb,
  PartnerPresenceInfo,
} from '../../lib/firestoreService';
import {
  sortChatMessagesChronologically,
  extractMessageTimestampMs,
  formatMessageTime,
} from '../../lib/chatUtils';
import { soundEffects } from '../../lib/audio';
import { compressImageWithStats } from '../../lib/imageUtils';
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
  onSendMissYouPulse?: (pulseData: Omit<MissYouPulse, 'id' | 'timestamp'>) => void;
  onDeleteMessages?: (ids: string[]) => Promise<void> | void;
  onClearChat?: () => Promise<void> | void;
  onExportChat?: (format?: 'txt' | 'json') => void;
  onEditMessage?: (id: string, newContent: string) => Promise<void> | void;
  onBack?: () => void;
  onOpenNotificationModal?: () => void;
  onRefreshChat?: () => Promise<void> | void;
  weeklyChallenge?: any;
  onOpenWeeklyChallengeHub?: () => void;
  draftText?: string;
  onClearDraftText?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  profile,
  activePartnerId,
  onSwitchPartner,
  messages,
  onSendMessage,
  onDeleteMessages,
  onClearChat,
  onExportChat,
  onBack,
  onOpenNotificationModal,
  onRefreshChat,
  draftText,
  onClearDraftText,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const otherPartnerId: PartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';

  // Check if user has explicitly confirmed their identity on this device
  const [hasConfirmedPartner, setHasConfirmedPartner] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nid_partner_confirmed') === 'true';
    }
    return true;
  });

  // State
  const [inputText, setInputText] = useState(draftText || '');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showClearChatModal, setShowClearChatModal] = useState<boolean>(false);
  const [chatToastFeedback, setChatToastFeedback] = useState<string | null>(null);
  const [isRefreshingChat, setIsRefreshingChat] = useState<boolean>(false);

  // Selected message for contextual action sheet
  const [activeMessageSheet, setActiveMessageSheet] = useState<ChatMessage | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageIdsToDelete, setMessageIdsToDelete] = useState<string[]>([]);

  // Mobile & Desktop Lightbox
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);

  // Presence & Typing State
  const [presenceMap, setPresenceMap] = useState<Record<string, PartnerPresenceInfo>>({});
  const typingTimeoutRef = useRef<any>(null);
  const otherPartnerPresence = presenceMap[otherPartnerId];
  const isOtherPartnerOnline = Boolean(otherPartnerPresence?.isOnline);
  const isOtherPartnerTyping = Boolean(otherPartnerPresence?.isTyping);

  // Back Navigation Handlers
  useBackHandler(Boolean(activeMessageSheet), () => setActiveMessageSheet(null), 'chat-sheet');
  useBackHandler(showAttachmentMenu, () => setShowAttachmentMenu(false), 'chat-attach');
  useBackHandler(showSearchBar, () => setShowSearchBar(false), 'chat-search');
  useBackHandler(isSelectionMode, () => {
    setIsSelectionMode(false);
    setSelectedMessageIds([]);
  }, 'chat-select');

  // Handle draft text update
  useEffect(() => {
    if (draftText) {
      setInputText(draftText);
      if (onClearDraftText) onClearDraftText();
    }
  }, [draftText, onClearDraftText]);

  // Real-time Firestore & Relay Presence
  useEffect(() => {
    const unsubPresence = subscribeChatTypingStatus((map) => {
      setPresenceMap((prev) => ({ ...prev, ...map }));
    });
    return () => unsubPresence();
  }, []);

  useEffect(() => {
    const unsubEvents = connectChatEvents({
      partnerId: activePartnerId,
      onPresence: (presence) => {
        const converted: Record<string, PartnerPresenceInfo> = {};
        Object.entries(presence).forEach(([k, v]) => {
          converted[k] = {
            partnerId: v.partnerId,
            isTyping: v.isTyping,
            isOnline: v.isOnline,
            lastSeen: v.lastSeen,
            updatedAt: v.updatedAt,
          };
        });
        setPresenceMap((prev) => ({ ...prev, ...converted }));
      },
    });
    return () => unsubEvents();
  }, [activePartnerId]);

  // Online Heartbeat
  useEffect(() => {
    updatePartnerPresence(activePartnerId, true).catch(() => {});
    sendPresenceViaRelay(activePartnerId, true).catch(() => {});
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        updatePartnerPresence(activePartnerId, true).catch(() => {});
        sendPresenceViaRelay(activePartnerId, true).catch(() => {});
      }
    }, 20000);
    return () => {
      clearInterval(interval);
      updatePartnerPresence(activePartnerId, false).catch(() => {});
      sendPresenceViaRelay(activePartnerId, false).catch(() => {});
    };
  }, [activePartnerId]);

  // Auto-scroll to bottom on load and new messages
  const scrollToBottom = useCallback((smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(false), 60);
    return () => clearTimeout(timer);
  }, [messages.length, scrollToBottom]);

  // Mark unread messages as read
  useEffect(() => {
    const unreadIds = messages
      .filter((m) => m.senderId === otherPartnerId && m.readStatus !== 'read')
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      unreadIds.forEach((id) => {
        updateChatMessageStatus(id, 'read').catch(() => {});
      });
    }
  }, [messages, otherPartnerId]);

  // Manual chat refresh
  const handleManualRefresh = async () => {
    if (isRefreshingChat) return;
    setIsRefreshingChat(true);
    soundEffects.playSoftTap();
    try {
      if (onRefreshChat) {
        await onRefreshChat();
      }
    } finally {
      setTimeout(() => setIsRefreshingChat(false), 500);
    }
  };

  // Lightbox Items
  const mediaItems: PhotoViewerItem[] = useMemo(() => {
    return messages
      .filter((m) => (m.mediaType === 'image' || m.mediaType === 'video') && m.mediaUrl)
      .map((m) => ({
        id: m.id,
        url: m.mediaUrl || '',
        title: m.content || (m.mediaType === 'video' ? 'Vidéo partagée' : 'Photo partagée'),
        date: m.timestamp,
        authorName: m.senderId === 'p1' ? profile.partner1.name : profile.partner2.name,
        mediaType: m.mediaType === 'video' ? 'video' : 'image',
        onDelete: onDeleteMessages ? () => onDeleteMessages([m.id]) : undefined,
      }));
  }, [messages, profile, onDeleteMessages]);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    const sorted = sortChatMessagesChronologically(messages);
    let list = sorted;
    if (mediaFilter === 'image') {
      list = list.filter((m) => m.mediaType === 'image');
    } else if (mediaFilter === 'video') {
      list = list.filter((m) => m.mediaType === 'video');
    } else if (mediaFilter === 'audio') {
      list = list.filter((m) => m.mediaType === 'audio');
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((m) => m.content && m.content.toLowerCase().includes(q));
  }, [messages, searchQuery, mediaFilter]);

  // Group messages by day
  const groupedMessages = useMemo(() => {
    const groups: { dateKey: string; dateLabel: string; items: ChatMessage[] }[] = [];
    filteredMessages.forEach((msg) => {
      const timeMs = extractMessageTimestampMs(msg);
      const msgDate = new Date(timeMs || Date.now());
      const dateKey = `${msgDate.getFullYear()}-${String(msgDate.getMonth() + 1).padStart(2, '0')}-${String(msgDate.getDate()).padStart(2, '0')}`;

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateLabel = msgDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (msgDate.toDateString() === today.toDateString()) {
        dateLabel = "Aujourd'hui";
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Hier';
      }

      const existing = groups.find((g) => g.dateKey === dateKey);
      if (existing) {
        existing.items.push(msg);
      } else {
        groups.push({ dateKey, dateLabel, items: [msg] });
      }
    });
    return groups;
  }, [filteredMessages]);

  // Send text message
  const handleSend = (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text) return;
    onSendMessage({
      senderId: activePartnerId,
      content: text,
      mediaType: 'text',
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderId: replyingTo.senderId,
            content: replyingTo.content || (replyingTo.mediaType === 'image' ? '📷 Photo' : '🎵 Message vocal'),
          }
        : undefined,
    });
    soundEffects.playMessageSent();
    setInputText('');
    setReplyingTo(null);
    setShowAttachmentMenu(false);
    setChatTypingStatus(activePartnerId, false).catch(() => {});
    sendTypingViaRelay(activePartnerId, false).catch(() => {});
    setTimeout(() => scrollToBottom(true), 50);
  };

  // Textarea input & typing broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setChatTypingStatus(activePartnerId, true).catch(() => {});
    sendTypingViaRelay(activePartnerId, true).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setChatTypingStatus(activePartnerId, false).catch(() => {});
      sendTypingViaRelay(activePartnerId, false).catch(() => {});
    }, 2500);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      soundEffects.playSoftTap();
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert("Microphone non disponible ou non autorisé.");
    }
  };

  const cancelRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    setRecordSeconds(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    const recSecs = Math.max(1, recordSeconds);
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setRecordSeconds(0);
      if (blob.size > 0) {
        const base64 = await audioBlobToDataUrl(blob);
        if (base64) {
          onSendMessage({
            senderId: activePartnerId,
            content: '🎵 Message vocal',
            mediaType: 'audio',
            mediaUrl: base64,
            audioDuration: recSecs,
          });
          soundEffects.playMessageSent();
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    };
    mediaRecorderRef.current.stop();
  };

  // Multiple Photo / Video selection handler
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    setUploadStatusText("Envoi en cours...");
    setShowAttachmentMenu(false);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/')) {
        try {
          setUploadStatusText(`Envoi vidéo ${i + 1}/${files.length}...`);
          const res = await uploadAndPersistMedia(file);
          onSendMessage({
            senderId: activePartnerId,
            content: `🎬 Vidéo (${res.formattedDuration})`,
            mediaType: 'video',
            mediaUrl: res.serverUrl,
            videoUrl: res.serverUrl,
            videoDuration: res.duration,
            videoThumbnail: res.thumbnail,
          });
        } catch {
          console.warn('Erreur envoi vidéo');
        }
      } else if (file.type.startsWith('image/')) {
        try {
          setUploadStatusText(`Envoi photo ${i + 1}/${files.length}...`);
          const compressed = await compressImageWithStats(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.85,
          });
          onSendMessage({
            senderId: activePartnerId,
            content: '📷 Photo partagée',
            mediaType: 'image',
            mediaUrl: compressed.dataUrl,
          });
        } catch {
          console.warn('Erreur envoi photo');
        }
      }
    }
    setIsUploadingMedia(false);
    setUploadStatusText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    soundEffects.playMessageSent();
    setTimeout(() => scrollToBottom(true), 50);
  };

  // Camera Capture
  const handlePhotoCapturedFromCamera = (dataUrl: string) => {
    onSendMessage({
      senderId: activePartnerId,
      content: '📷 Photo en direct',
      mediaType: 'image',
      mediaUrl: dataUrl,
    });
    soundEffects.playMessageSent();
    setShowCameraModal(false);
    setTimeout(() => scrollToBottom(true), 50);
  };

  // Toggle selection
  const toggleSelectMessage = (id: string) => {
    setSelectedMessageIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((i) => i !== id) : [...prev, id];
      if (next.length === 0) setIsSelectionMode(false);
      else setIsSelectionMode(true);
      return next;
    });
  };

  // Delete modal confirmation
  const handleConfirmDelete = async () => {
    if (messageIdsToDelete.length === 0) return;
    try {
      if (onDeleteMessages) {
        await onDeleteMessages(messageIdsToDelete);
      } else {
        await deleteMultipleChatMessagesFromDb(messageIdsToDelete);
      }
      soundEffects.playSoftTap();
      setShowDeleteModal(false);
      setMessageIdsToDelete([]);
      setSelectedMessageIds([]);
      setIsSelectionMode(false);
      setActiveMessageSheet(null);
    } catch {
      console.warn('Erreur suppression messages');
    }
  };

  // Quick reaction
  const handleReaction = async (msgId: string, emoji: string) => {
    soundEffects.playSoftTap();
    await updateChatMessageReaction(msgId, activePartnerId, emoji);
    setActiveMessageSheet(null);
  };

  // Copy partner URL to share
  const handleCopyPartnerLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const partnerLink = `${origin}/?tab=chat&partner=${otherPartnerId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(partnerLink).catch(() => {});
    }
    soundEffects.playSoftTap();
    setShowMoreMenu(false);
    setChatToastFeedback(`Lien copié pour ${otherPartner.name} ! Envoyez-lui par WhatsApp/SMS`);
    setTimeout(() => setChatToastFeedback(null), 3500);
  };

  // Confirm identity choice
  const handleConfirmIdentity = (partnerId: PartnerId) => {
    onSwitchPartner(partnerId);
    setHasConfirmedPartner(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nid_partner_confirmed', 'true');
    }
    soundEffects.playSoftTap();
  };

  // Export chat
  const handleExport = (format: 'txt' | 'json' = 'txt') => {
    if (onExportChat) {
      onExportChat(format);
      setShowMoreMenu(false);
      return;
    }
    const txt = messages
      .map((m) => `[${m.timestamp}] ${m.senderId === 'p1' ? profile.partner1.name : profile.partner2.name}: ${m.content || ''}`)
      .join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discussion_${profile.partner1.name}_${profile.partner2.name}.txt`;
    a.click();
    setShowMoreMenu(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-slate-100/90 dark:bg-slate-950 select-none overflow-hidden relative font-sans">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Floating feedback toast */}
      <AnimatePresence>
        {chatToastFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold rounded-full shadow-xl pointer-events-none flex items-center gap-2 border border-white/10"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>{chatToastFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploading progress indicator */}
      {isUploadingMedia && (
        <div className="bg-slate-800 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 shadow-sm shrink-0 z-30">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <span>{uploadStatusText}</span>
        </div>
      )}

      {/* 1. TOP APP BAR - MODERN MESSENGER STYLE */}
      <header className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
              title="Retour"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Partner Avatar with Online Indicator */}
          <div
            className="relative cursor-pointer group shrink-0"
            onClick={() => onSwitchPartner(otherPartnerId)}
            title={`Connecté(e) avec ${otherPartner.name}. Cliquez pour basculer sur ${otherPartner.name}`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm shadow-xs ring-1 ring-slate-300 dark:ring-slate-700">
              {otherPartner.avatarUrl ? (
                <img src={otherPartner.avatarUrl} alt={otherPartner.name} className="w-full h-full object-cover" />
              ) : (
                otherPartner.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${
                isOtherPartnerOnline ? 'bg-emerald-500 ring-1 ring-emerald-500/20' : 'bg-slate-400 dark:bg-slate-600'
              }`}
            />
          </div>

          {/* Partner Name & Real-Time Status */}
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate">
              {otherPartner.name}
            </h2>

            {/* Status Line */}
            <p className="text-[11px] sm:text-xs leading-tight truncate flex items-center gap-1 mt-0.5">
              {isOtherPartnerTyping ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span>en train d'écrire</span>
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </span>
              ) : isOtherPartnerOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>En ligne</span>
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">
                  {otherPartnerPresence?.lastSeen
                    ? `Vu à ${formatMessageTime(otherPartnerPresence.lastSeen)}`
                    : 'Hors ligne'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Top Actions & Profile Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Identity Pill */}
          <button
            type="button"
            onClick={() => onSwitchPartner(otherPartnerId)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title={`Vous êtes connecté en tant que: ${currentPartner.name}. Cliquez pour basculer sur ${otherPartner.name}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 font-normal">Moi :</span>
            <strong className="truncate max-w-[70px] sm:max-w-none">{currentPartner.name}</strong>
            <span className="text-slate-400">⇄</span>
          </button>

          {/* Share Partner Link Button */}
          <button
            type="button"
            onClick={handleCopyPartnerLink}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title={`Copier le lien pour ${otherPartner.name}`}
            aria-label="Partager lien"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            type="button"
            onClick={() => setShowSearchBar((prev) => !prev)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showSearchBar
                ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Rechercher"
            aria-label="Rechercher"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Refresh button */}
          {onRefreshChat && (
            <button
              type="button"
              onClick={handleManualRefresh}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Synchroniser"
              aria-label="Synchroniser"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingChat ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          )}

          {/* 3-Dots Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Options"
              aria-label="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 top-10 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-40 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchPartner(otherPartnerId);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Basculer sur <strong>{otherPartner.name}</strong></span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPartnerLink}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copier le lien pour {otherPartner.name}</span>
                    </div>
                  </button>

                  {onOpenNotificationModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        onOpenNotificationModal();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-slate-500" />
                        <span>Notifications push</span>
                      </div>
                    </button>
                  )}

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={() => handleExport('txt')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>Exporter la discussion</span>
                    </div>
                  </button>

                  {onClearChat && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowClearChatModal(true);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Trash2 className="w-4 h-4" />
                        <span>Effacer la conversation</span>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. DEVICE IDENTITY PROMPT (IF UNCONFIRMED) */}
      {!hasConfirmedPartner && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0 z-20 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Qui utilise cet appareil ?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleConfirmIdentity('p1')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                activePartnerId === 'p1' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Je suis {profile.partner1.name}
            </button>
            <button
              type="button"
              onClick={() => handleConfirmIdentity('p2')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                activePartnerId === 'p2' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Je suis {profile.partner2.name}
            </button>
          </div>
        </div>
      )}

      {/* 3. SEARCH BAR (COLLAPSIBLE) */}
      <AnimatePresence>
        {showSearchBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2 shrink-0 z-20"
          >
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans la discussion..."
                className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white"
                autoFocus
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="p-0.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Media Filter Pills */}
            <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'image', label: '📷 Photos' },
                { id: 'video', label: '🎬 Vidéos' },
                { id: 'audio', label: '🎵 Vocaux' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMediaFilter(f.id as any)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    mediaFilter === f.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MESSAGES FEED */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 space-y-2.5 relative z-10"
        onScroll={(e) => {
          const el = e.currentTarget;
          const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
          setShowScrollBottom(!isAtBottom);
        }}
      >
        {/* Empty State */}
        {groupedMessages.length === 0 ? (
          <div className="flex-1 h-full min-h-[350px] flex flex-col items-center justify-center text-center p-6 select-none my-auto">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-3 shadow-xs">
              <MessageSquare className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Discussion avec {otherPartner.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              Vos messages, photos et notes vocales sont synchronisés en direct.
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.dateKey} className="flex flex-col space-y-2">
              {/* Date Header Chip */}
              <div className="flex justify-center my-2 sticky top-1 z-10 select-none">
                <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-3 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-xs">
                  {group.dateLabel}
                </span>
              </div>

              {/* Message Bubbles */}
              {group.items.map((msg, index) => {
                const isMe = msg.senderId === activePartnerId;
                const prevMsg = group.items[index - 1];
                const isFirstInBurst = !prevMsg || prevMsg.senderId !== msg.senderId;
                const isSelected = selectedMessageIds.includes(msg.id);
                const isRead = msg.readStatus === 'read' || msg.status === 'read';
                const timeStr = formatMessageTime(msg.timestamp);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} ${
                      isFirstInBurst ? 'mt-2' : 'mt-0.5'
                    }`}
                  >
                    <div className={`flex items-center gap-2 max-w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Selection checkbox */}
                      {isSelectionMode && (
                        <button
                          type="button"
                          onClick={() => toggleSelectMessage(msg.id)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isSelected ? 'bg-slate-900 dark:bg-white border-slate-900 text-white dark:text-slate-900' : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      )}

                      {/* Bubble */}
                      <div
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleSelectMessage(msg.id);
                          } else {
                            setActiveMessageSheet(msg);
                          }
                        }}
                        className={`relative max-w-[85%] sm:max-w-[75%] px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xs cursor-pointer select-none transition-transform active:scale-[0.99] flex flex-col ${
                          isMe
                            ? 'bg-slate-900 dark:bg-slate-800 text-white rounded-2xl rounded-tr-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs'
                        } ${isSelected ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-2' : ''}`}
                      >
                        {/* Quoted reply banner */}
                        {msg.replyTo && (
                          <div
                            className={`mb-1.5 p-2 rounded-xl text-xs border-l-3 ${
                              isMe
                                ? 'bg-white/10 border-white text-white/90'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-900 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <p className="font-bold text-[10.5px]">
                              {msg.replyTo.senderId === activePartnerId ? 'Moi' : otherPartner.name}
                            </p>
                            <p className="truncate text-[11px] opacity-80">{msg.replyTo.content}</p>
                          </div>
                        )}

                        {/* Media: Photo */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div
                            className="rounded-xl overflow-hidden mb-1 cursor-pointer max-w-sm max-h-72"
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = mediaItems.findIndex((item) => item.id === msg.id);
                              if (idx >= 0) setActiveLightboxIndex(idx);
                            }}
                          >
                            <img
                              src={msg.mediaUrl}
                              alt="Photo"
                              className="w-full h-full object-cover rounded-xl hover:opacity-95 transition-opacity"
                            />
                          </div>
                        )}

                        {/* Media: Video */}
                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="rounded-xl overflow-hidden mb-1 max-w-sm">
                            <ChatVideoBubble message={msg} isMe={isMe} />
                          </div>
                        )}

                        {/* Media: Audio (Voice Note) */}
                        {msg.mediaType === 'audio' && msg.mediaUrl && (
                          <div className="mb-1 min-w-[200px]">
                            <ChatAudioBubble message={msg} isMe={isMe} />
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.content && msg.mediaType === 'text' && (
                          <p className="text-[13.5px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        {msg.content && msg.mediaType !== 'text' && !msg.content.startsWith('📷 Photo') && !msg.content.startsWith('🎵 Message') && !msg.content.startsWith('🎬 Vidéo') && (
                          <p className="text-[12px] sm:text-xs leading-relaxed whitespace-pre-wrap break-words mt-1 opacity-90">
                            {msg.content}
                          </p>
                        )}

                        {/* Time & Double Check Status */}
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMe ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          <span>{timeStr}</span>
                          {isMe && (
                            <span className="ml-0.5">
                              {isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-white/70" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Emoji Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="absolute -bottom-2 right-2 flex items-center gap-0.5 bg-white dark:bg-slate-800 rounded-full px-1.5 py-0.5 shadow-xs border border-slate-200 dark:border-slate-700 text-xs">
                            {Object.entries(msg.reactions).map(([partner, emoji]) => (
                              <span key={partner}>{emoji}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 right-4 z-20 p-2.5 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Aller en bas"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 5. ATTACHMENT MENU */}
      <AnimatePresence>
        {showAttachmentMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowAttachmentMenu(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-16 left-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-40 flex flex-col gap-1 w-56 text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu(false);
                  setShowCameraModal(true);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="font-medium">Appareil photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="font-medium">Photos & Galerie</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  videoInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <span className="font-medium">Vidéos</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 6. BOTTOM INPUT BAR (MINIMALIST & SLEEK) */}
      <footer className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 z-20">
        {/* Reply Quote Banner */}
        {replyingTo && (
          <div className="mb-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 truncate">
              <CornerUpLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
              <span className="truncate">
                Répondre à <strong>{replyingTo.senderId === activePartnerId ? 'Moi' : otherPartner.name}</strong> : {replyingTo.content}
              </span>
            </div>
            <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => setShowAttachmentMenu((prev) => !prev)}
            className="p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Joindre un fichier"
            aria-label="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5 -rotate-45" />
          </button>

          {/* Text Input OR Voice Recording Capsule */}
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-full border border-slate-300/80 dark:border-slate-700 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {formatAudioTime(recordSeconds)}
                </span>
                <span className="text-xs text-slate-500">Enregistrement audio...</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-0.5 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  className="p-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-xs cursor-pointer"
                  title="Envoyer la note vocale"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-700 focus-within:bg-white dark:focus-within:bg-slate-850 transition-all min-w-0">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message..."
                className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white text-xs sm:text-sm resize-none max-h-24 leading-relaxed"
              />
            </div>
          )}

          {/* Action Button: Send OR Mic */}
          {!isRecording && (
            inputText.trim() ? (
              <button
                type="button"
                onClick={() => handleSend()}
                className="p-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-xs cursor-pointer transition-transform active:scale-95 shrink-0"
                title="Envoyer"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                title="Enregistrer un message vocal"
                aria-label="Enregistrer un message vocal"
              >
                <Mic className="w-5 h-5" />
              </button>
            )
          )}
        </div>
      </footer>

      {/* 7. CONTEXT ACTION SHEET (ON MESSAGE TAP) */}
      <AnimatePresence>
        {activeMessageSheet && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={() => setActiveMessageSheet(null)} />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 inset-x-0 sm:max-w-md sm:mx-auto bg-white dark:bg-slate-900 rounded-t-3xl p-4 shadow-2xl z-50 text-xs flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800"
            >
              {/* Quick Reactions Bar */}
              <div className="flex items-center justify-around py-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {['❤️', '👍', '😂', '😍', '🔥', '🙏'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReaction(activeMessageSheet.id, emoji)}
                    className="text-2xl p-1.5 hover:scale-125 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(activeMessageSheet);
                    setActiveMessageSheet(null);
                    textareaRef.current?.focus();
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-medium cursor-pointer"
                >
                  <CornerUpLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>Répondre</span>
                </button>

                {activeMessageSheet.content && (
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(activeMessageSheet.content || '').catch(() => {});
                      }
                      setActiveMessageSheet(null);
                      setChatToastFeedback("Texte copié");
                      setTimeout(() => setChatToastFeedback(null), 2000);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-medium cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copier le texte</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMessageIdsToDelete([activeMessageSheet.id]);
                    setActiveMessageSheet(null);
                    setShowDeleteModal(true);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-medium cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer ce message</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 8. CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-center"
            >
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                Supprimer le{messageIdsToDelete.length > 1 ? 's' : ''} message{messageIdsToDelete.length > 1 ? 's' : ''} ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Cette action supprimera définitivement le message de vos deux appareils.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. CLEAR CHAT MODAL */}
      <AnimatePresence>
        {showClearChatModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-center"
            >
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                Effacer toute la discussion ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Tous les messages seront effacés pour vous et votre partenaire.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearChatModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (onClearChat) await onClearChat();
                    setShowClearChatModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Effacer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. LIGHTBOX MODAL */}
      {activeLightboxIndex !== null && mediaItems.length > 0 && (
        <MobilePhotoViewer
          items={mediaItems}
          initialIndex={activeLightboxIndex}
          onClose={() => setActiveLightboxIndex(null)}
        />
      )}

      {/* 11. LIVE CAMERA CAPTURE MODAL */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={handlePhotoCapturedFromCamera}
        title="Prendre une photo"
        subtitle="Partagez un moment en direct"
      />
    </div>
  );
};
