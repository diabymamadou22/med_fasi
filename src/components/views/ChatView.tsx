import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Mic,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Phone,
  Video,
  X,
  Search,
  CornerUpLeft,
  Heart,
  Play,
  Pause,
  Image as ImageIcon,
  ChevronDown,
  StopCircle,
  PhoneOff,
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
  ArrowLeft,
} from 'lucide-react';
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
  subscribeChatTypingStatus,
  deleteChatMessageFromDb,
  deleteMultipleChatMessagesFromDb,
  editChatMessageContent,
  updateMultipleChatMessagesReaction,
  updateMultipleChatMessagesReadStatus,
} from '../../lib/firestoreService';
import {
  sortChatMessagesChronologically,
  extractMessageTimestampMs,
  formatMessageTime,
} from '../../lib/chatUtils';
import { soundEffects } from '../../lib/audio';
import { processPhotoWithoutCropping } from '../../lib/imageUtils';

export interface ChatViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSwitchPartner: (newPartnerId: PartnerId) => void;
  messages: ChatMessage[];
  onSendMessage: (msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'readStatus'>) => void;
  onSendMissYouPulse: (pulseData: Omit<MissYouPulse, 'id' | 'timestamp'>) => void;
  onDeleteMessages?: (ids: string[]) => Promise<void> | void;
  onEditMessage?: (id: string, newContent: string) => Promise<void> | void;
  onBack?: () => void;
}

type ChatTheme = 'rose-powder' | 'velvet-night' | 'ivory-linen';

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
  onEditMessage,
  onBack,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const otherPartnerId: PartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';

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

  const handleSelectTheme = (theme: ChatTheme) => {
    setChatTheme(theme);
    localStorage.setItem('nid_amour_chat_theme', theme);
    setShowThemePicker(false);
  };

  // Input states
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'audio' | 'loveNote'>('all');

  // Audio / Call modals
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Lightbox for photos
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioTotalDuration, setAudioTotalDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordIntervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Real-time typing status from Firestore
  const [typingMap, setTypingMap] = useState<Record<string, { isTyping: boolean; updatedAt: string }>>({});
  const typingTimeoutRef = useRef<any>(null);

  // Floating hearts particles
  const [particles, setParticles] = useState<FloatingHeartParticle[]>([]);

  // Scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time typing status
  useEffect(() => {
    const unsubTyping = subscribeChatTypingStatus((map) => {
      setTypingMap(map);
    });
    return () => {
      unsubTyping();
    };
  }, []);

  const isOtherPartnerTyping = Boolean(typingMap[otherPartnerId]?.isTyping);

  // Mark other partner's messages as read when viewing chat
  useEffect(() => {
    messages.forEach((msg) => {
      const isRead =
        msg.readStatus === 'read' ||
        msg.readStatus === true ||
        (!msg.readStatus && msg.status === 'read');
      if (msg.senderId === otherPartnerId && !isRead) {
        updateChatMessageStatus(msg.id, 'read').catch(() => {});
      }
    });
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

  // Call timer effect
  useEffect(() => {
    let interval: any = null;
    if (activeCallType) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCallType]);

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

  // Handle Input Change and broadcast typing status
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Broadcast typing signal
    setChatTypingStatus(activePartnerId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setChatTypingStatus(activePartnerId, false);
    }, 2500);
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
    }
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setChatTypingStatus(activePartnerId, false);
  };

  // Voice recording controls
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("L'enregistrement vocal n'est pas supporté par ce navigateur.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
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
        };
        reader.readAsDataURL(audioBlob);

        // Stop tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      soundEffects.playSoftTap();

      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err) {
      console.error('Erreur accès micro:', err);
      alert('Impossible d’accéder au microphone.');
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
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

  // Image Upload handler with compression
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await processPhotoWithoutCropping(file, 1280, 0.82);
      onSendMessage({
        senderId: activePartnerId,
        content: '📷 Photo partagée',
        mediaType: 'image',
        mediaUrl: dataUrl,
      });
      soundEffects.playMessageSent();
    } catch (err) {
      console.error('Erreur compression image chat:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const formatCallTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  // Theme styling helpers
  const themeStyles = {
    'rose-powder': {
      outerBg: 'bg-[#FFFDFD]',
      cardBg: 'bg-white',
      feedBg: 'bg-gradient-to-b from-[#FFFDFD] via-[#FAF5F5] to-[#FFF9F9]',
      headerBg: 'bg-white/95 backdrop-blur-md border-rose-100',
      myBubble: 'bg-gradient-to-br from-rose-500 via-rose-500 to-pink-600 text-white shadow-rose-200/50',
      myBubbleText: 'text-white',
      myBubbleMeta: 'text-rose-100',
      partnerBubble: 'bg-white border border-rose-100/90 text-stone-800 shadow-stone-200/40',
      inputBg: 'bg-stone-50 border-stone-200 focus-within:border-rose-300 focus-within:bg-white',
      accentColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-700',
    },
    'velvet-night': {
      outerBg: 'bg-slate-950',
      cardBg: 'bg-slate-900 border-rose-950',
      feedBg: 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
      headerBg: 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-white',
      myBubble: 'bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white shadow-rose-950/60',
      myBubbleText: 'text-white',
      myBubbleMeta: 'text-rose-200',
      partnerBubble: 'bg-slate-800/90 border border-slate-700/80 text-slate-100 shadow-black/40',
      inputBg: 'bg-slate-850 bg-slate-800/80 border-slate-700 text-white focus-within:border-rose-500 focus-within:bg-slate-800',
      accentColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/70 border-rose-800/60 text-rose-300',
    },
    'ivory-linen': {
      outerBg: 'bg-[#FBF9F5]',
      cardBg: 'bg-white border-amber-100',
      feedBg: 'bg-gradient-to-b from-[#FBF9F5] via-[#F6F2EA] to-[#FBF9F5]',
      headerBg: 'bg-[#FDFBF7]/95 backdrop-blur-md border-amber-200/60',
      myBubble: 'bg-gradient-to-br from-amber-700 via-rose-700 to-amber-800 text-white shadow-amber-900/20',
      myBubbleText: 'text-white',
      myBubbleMeta: 'text-amber-100',
      partnerBubble: 'bg-white border border-amber-200/70 text-stone-800 shadow-amber-100/50',
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

      {/* Hidden File Input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main Chat Window Card - edge to edge on mobile like WhatsApp / native chat apps */}
      <div className={`${themeStyles.cardBg} rounded-none sm:rounded-3xl shadow-none sm:shadow-xl border-0 sm:border overflow-hidden flex flex-col flex-1 min-h-0 h-full relative transition-colors duration-300`}>
        
        {/* ================================================================= */}
        {/* 1. CHAT TOP APP BAR & WHATSAPP-STYLE SELECTION BAR */}
        {/* ================================================================= */}
        {selectedMessageIds.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-3 sm:px-4 py-2.5 flex items-center justify-between border-b shadow-md z-20 shrink-0 ${
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
          <div className={`${themeStyles.headerBg} px-3 sm:px-4 py-2.5 flex items-center justify-between border-b shadow-2xs z-20 shrink-0 transition-colors duration-300`}>
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
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
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
              
              {/* Online or Typing Status */}
              <p className="text-xs leading-tight truncate flex items-center gap-1.5 mt-0.5">
                {isOtherPartnerTyping ? (
                  <span className="text-rose-500 font-semibold flex items-center gap-1 animate-pulse">
                    <span>en train d'écrire...</span>
                    <Sparkles className="w-3 h-3 animate-spin text-rose-500" />
                  </span>
                ) : (
                  <span className={`flex items-center gap-1.5 ${chatTheme === 'velvet-night' ? 'text-slate-400' : 'text-stone-500'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>en ligne avec toi 💕</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Action Icons (Theme, Calls, Heart Pulse, Switch Duo) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Perspective Switch Button */}
            <button
              onClick={() => onSwitchPartner(otherPartnerId)}
              className={`px-2.5 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${themeStyles.badgeBg}`}
              title="Changer de perspective"
            >
              <UserCheck className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline opacity-70">Moi :</span>
              <span className="font-bold truncate max-w-[65px]">{currentPartner.name}</span>
            </button>

            {/* Send Instant Heart Pulse Burst */}
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                spawnHeartBurst(rect.left + rect.width / 2, rect.top, 12);
                onSendMissYouPulse({
                  senderId: activePartnerId,
                  vibe: 'kiss',
                  message: 'Je pense fort à toi mon amour ❤️',
                });
                soundEffects.playHeartPulse();
              }}
              className="p-2 hover:bg-rose-50/20 rounded-full text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              title="Envoyer une pluie de cœurs et un battement"
            >
              <Heart className="w-5 h-5 fill-current animate-heartbeat" />
            </button>

            {/* Video Call Simulation */}
            <button
              onClick={() => setActiveCallType('video')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                chatTheme === 'velvet-night'
                  ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                  : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Appel vidéo intime"
            >
              <Video className="w-4.5 h-4.5" />
            </button>

            {/* Audio Call Simulation */}
            <button
              onClick={() => setActiveCallType('audio')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                chatTheme === 'velvet-night'
                  ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                  : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Appel vocal intime"
            >
              <Phone className="w-4.5 h-4.5" />
            </button>

            {/* Selection Mode Button */}
            <button
              onClick={() => {
                const nextMode = !isSelectionMode;
                setIsSelectionMode(nextMode);
                if (!nextMode) setSelectedMessageIds([]);
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isSelectionMode
                  ? 'bg-rose-500 text-white shadow-xs'
                  : chatTheme === 'velvet-night'
                  ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                  : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title={isSelectionMode ? "Quitter le mode sélection" : "Sélectionner des messages"}
            >
              <CheckSquare className="w-4.5 h-4.5" />
            </button>

            {/* Search Button */}
            <button
              onClick={() => setShowSearchBar(!showSearchBar)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showSearchBar
                  ? 'bg-rose-500 text-white'
                  : chatTheme === 'velvet-night'
                  ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                  : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Rechercher dans la discussion"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Theme / Ambiance Palette Selector */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  showThemePicker
                    ? 'bg-rose-100 text-rose-700'
                    : chatTheme === 'velvet-night'
                    ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                    : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Changer l'ambiance du chat"
              >
                <Palette className="w-4.5 h-4.5" />
              </button>

              <AnimatePresence>
                {showThemePicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-40 text-xs"
                  >
                    <p className="font-semibold text-stone-500 dark:text-slate-400 px-2 py-1 mb-1">
                      Ambiance du chat :
                    </p>
                    <button
                      onClick={() => handleSelectTheme('rose-powder')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer ${
                        chatTheme === 'rose-powder' ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-400 inline-block" />
                      <span>🌸 Douceur Poudrée</span>
                    </button>
                    <button
                      onClick={() => handleSelectTheme('velvet-night')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer ${
                        chatTheme === 'velvet-night' ? 'bg-slate-800 text-rose-400 font-bold' : 'hover:bg-slate-100 text-stone-700'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 inline-block" />
                      <span>🌙 Soirée Câline</span>
                    </button>
                    <button
                      onClick={() => handleSelectTheme('ivory-linen')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer ${
                        chatTheme === 'ivory-linen' ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-200 inline-block" />
                      <span>☁️ Cocon de Soie</span>
                    </button>
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
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 space-y-4 relative ${themeStyles.feedBg} transition-colors duration-300`}
        >
          {/* Private Intimate Space Indicator */}
          <div className="flex justify-center my-1">
            <div className={`backdrop-blur-xs border text-[11px] px-3.5 py-1.5 rounded-full text-center max-w-sm shadow-2xs ${
              chatTheme === 'velvet-night'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                : 'bg-white/90 border-rose-100 text-stone-600'
            }`}>
              🔒 <span className="font-semibold text-rose-500">Espace intime :</span> Messages, vocaux et photos synchronisés en tête-à-tête.
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

                      {/* Message Bubble Container with double tap and selection click listener */}
                      <div
                        onClick={(e) => {
                          if (isSelectionMode || selectedMessageIds.length > 0) {
                            e.stopPropagation();
                            toggleSelectMessage(msg.id);
                          } else {
                            handleMessageDoubleTap(e, msg);
                          }
                        }}
                        className={`relative max-w-[85%] sm:max-w-[76%] p-2.5 sm:p-3 shadow-xs transition-all select-none cursor-pointer ${bubbleCorners} ${
                          isMe
                            ? themeStyles.myBubble
                            : themeStyles.partnerBubble
                        } ${isLoveNote ? 'border-2 border-rose-300/80 bg-rose-50/90' : ''} ${
                          isSelected ? 'ring-2 ring-rose-500 ring-offset-2 scale-[1.01]' : ''
                        }`}
                      >
                        {/* Sender name on received message - ONLY ON FIRST IN BURST */}
                        {!isMe && isFirstInBurst && (
                          <p className="text-[11px] font-bold text-rose-500 mb-1 flex items-center gap-1">
                            <span>{senderName}</span>
                            <span className="text-[9px] opacity-70">💕</span>
                          </p>
                        )}

                      {/* Quoted Reply if present */}
                      {msg.replyTo && (
                        <div
                          className={`mb-2 p-2 rounded-xl text-xs ${
                            isMe
                              ? 'bg-black/15 border-l-3 border-white/90 text-white'
                              : chatTheme === 'velvet-night'
                              ? 'bg-slate-700/60 border-l-3 border-rose-400 text-slate-200'
                              : 'bg-rose-50/80 border-l-3 border-rose-400 text-stone-700'
                          }`}
                        >
                          <p className={`font-bold text-[11px] ${isMe ? 'text-white' : 'text-rose-500'}`}>
                            {msg.replyTo.senderId === activePartnerId ? 'Vous' : otherPartner.name}
                          </p>
                          <p className="truncate text-[11px] opacity-90">{msg.replyTo.content}</p>
                        </div>
                      )}

                      {/* Photo Content */}
                      {msg.mediaType === 'image' && msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden mb-1.5 bg-stone-100 cursor-pointer relative group/img">
                          <img
                            src={msg.mediaUrl}
                            alt="Photo partagée"
                            onClick={() => setLightboxImage(msg.mediaUrl!)}
                            className="max-h-72 w-auto object-contain rounded-xl hover:opacity-95 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none text-xs font-semibold">
                            🔍 Cliquer pour agrandir
                          </div>
                        </div>
                      )}

                      {/* Enhanced Voice Note Player */}
                      {msg.mediaType === 'audio' && (
                        <div className="flex items-center gap-3 py-1 px-1 min-w-[210px] sm:min-w-[250px]">
                          <button
                            onClick={() => togglePlayAudio(msg)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                              isMe
                                ? 'bg-white text-rose-600 hover:bg-rose-50'
                                : playingAudioId === msg.id
                                ? 'bg-rose-600 text-white scale-105 shadow-md'
                                : 'bg-rose-500 hover:bg-rose-600 text-white'
                            }`}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-5 h-5 fill-current" />
                            ) : (
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Animated Dancing Waveform Graphic */}
                          <div className="flex-1">
                            <div className="flex items-center gap-1 h-6">
                              {[35, 65, 30, 90, 55, 100, 70, 45, 85, 60, 95, 40, 80, 50].map((h, i) => {
                                const isCurrentPlaying = playingAudioId === msg.id;
                                return (
                                  <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-all duration-150 ${
                                      isMe
                                        ? isCurrentPlaying
                                          ? 'bg-white animate-pulse'
                                          : 'bg-white/60'
                                        : isCurrentPlaying
                                        ? 'bg-rose-500 animate-pulse'
                                        : chatTheme === 'velvet-night'
                                        ? 'bg-slate-600'
                                        : 'bg-rose-200'
                                    }`}
                                    style={{
                                      height: isCurrentPlaying
                                        ? `${Math.min(100, Math.max(25, (h * (1 + (i % 3) * 0.2))))}%`
                                        : `${h}%`,
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <div className={`flex items-center justify-between text-[10px] mt-1.5 ${isMe ? 'text-rose-100' : 'text-stone-500'}`}>
                              <span className="font-mono">
                                {playingAudioId === msg.id && audioCurrentTime > 0
                                  ? `0:${Math.floor(audioCurrentTime).toString().padStart(2, '0')}`
                                  : msg.audioDuration ? `0:${msg.audioDuration.toString().padStart(2, '0')}` : '0:05'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
                                  setPlaybackSpeed(nextSpeed);
                                  if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
                                }}
                                className={`font-bold text-[10px] px-1.5 py-0.5 rounded-md cursor-pointer ${
                                  isMe
                                    ? 'text-white bg-white/20 hover:bg-white/30'
                                    : 'text-rose-700 bg-rose-100 hover:bg-rose-200'
                                }`}
                              >
                                {playbackSpeed}x
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Love Note Card format */}
                      {isLoveNote ? (
                        <div className="py-1">
                          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs mb-1">
                            <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
                            <span>Billet doux pour toi</span>
                          </div>
                          <p className="font-serif-romantic italic text-stone-800 text-sm leading-relaxed pr-8">
                            {msg.content}
                          </p>
                        </div>
                      ) : (
                        /* Standard Text Content */
                        msg.content && msg.content !== '🎵 Note vocale' && msg.content !== '📷 Photo partagée' && (
                          <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words pr-12 ${
                            isMe
                              ? themeStyles.myBubbleText
                              : chatTheme === 'velvet-night'
                              ? 'text-slate-100'
                              : 'text-stone-800'
                          }`}>
                            {msg.content}
                          </p>
                        )
                      )}

                      {/* Bottom Info: Timestamp, WhatsApp-style Checkmarks & Edited tag */}
                      <div className={`flex items-center justify-end gap-1 text-[10px] float-right -mt-2 -mr-1 select-none ${
                        isMe
                          ? themeStyles.myBubbleMeta
                          : chatTheme === 'velvet-night'
                          ? 'text-slate-400'
                          : 'text-stone-400'
                      }`}>
                        {msg.isEdited && (
                          <span
                            className="text-[9px] italic opacity-85 mr-0.5"
                            title={msg.editedAt ? `Modifié à ${new Date(msg.editedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Modifié'}
                          >
                            modifié
                          </span>
                        )}
                        <span title={`Heure exacte d'arrivée : ${msgTime}`}>{msgTime}</span>
                        {isMe && (
                          <span className="inline-flex items-center ml-0.5">
                            {isMsgRead ? (
                              <CheckCheck
                                className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]"
                                title="Lu"
                              />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck
                                className="w-3.5 h-3.5 opacity-75 stroke-[2]"
                                title="Distribué"
                              />
                            ) : (
                              <Check
                                className="w-3.5 h-3.5 opacity-75 stroke-[2]"
                                title="Envoyé"
                              />
                            )}
                          </span>
                        )}
                      </div>

                      <div className="clear-both" />

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
            className={`absolute bottom-24 right-5 p-2.5 rounded-full shadow-lg border transition-all hover:scale-105 z-20 cursor-pointer ${
              chatTheme === 'velvet-night'
                ? 'bg-slate-800 text-slate-200 hover:text-rose-400 border-slate-700'
                : 'bg-white text-stone-600 hover:text-rose-600 border-rose-100'
            }`}
            title="Revenir aux derniers messages"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}

        {/* ================================================================= */}
        {/* 3. QUOTED REPLY BANNER */}
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
        {/* 5. EMOJI DRAWER TRAY */}
        {/* ================================================================= */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className={`border-t p-3 grid grid-cols-8 gap-2 z-10 shadow-inner max-h-36 overflow-y-auto no-scrollbar ${
                chatTheme === 'velvet-night'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-rose-100'
              }`}
            >
              {romanticEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setInputText((prev) => prev + emoji)}
                  className="text-xl sm:text-2xl p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
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
              className={`absolute bottom-16 left-12 rounded-2xl shadow-xl border p-2 z-30 flex flex-col gap-1 min-w-[210px] ${
                chatTheme === 'velvet-night'
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-white border-rose-100 text-stone-700'
              }`}
            >
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span>Envoyer une photo</span>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* 7. CHAT BOTTOM INPUT BAR */}
        {/* ================================================================= */}
        <div className={`${themeStyles.headerBg} px-2 sm:px-4 py-2.5 flex items-center gap-2 border-t z-20 shrink-0 transition-colors`}>
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachmentMenu(false);
            }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showEmojiPicker
                ? 'text-rose-600 bg-rose-100'
                : chatTheme === 'velvet-night'
                ? 'text-slate-400 hover:text-rose-400'
                : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title="Emojis d'amour"
          >
            <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(!showAttachmentMenu);
              setShowEmojiPicker(false);
            }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showAttachmentMenu
                ? 'text-rose-600 bg-rose-100'
                : chatTheme === 'velvet-night'
                ? 'text-slate-400 hover:text-rose-400'
                : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title="Joindre une photo ou mot doux"
          >
            <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Voice recording in-progress display OR text input */}
          {isRecording ? (
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 flex items-center justify-between shadow-2xs border border-rose-400">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Enregistrement vocal ({recordSeconds}s)...</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  className="px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-xs hover:scale-105"
                >
                  <Send className="w-3 h-3" />
                  <span>Envoyer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex-1 rounded-2xl px-3.5 py-1.5 border shadow-2xs flex items-center transition-all ${themeStyles.inputBg}`}>
              <textarea
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Tapez un mot doux, un souvenir..."
                className={`w-full bg-transparent text-xs sm:text-sm resize-none outline-hidden max-h-24 ${
                  chatTheme === 'velvet-night' ? 'text-white placeholder-slate-400' : 'text-stone-800 placeholder-stone-400'
                }`}
              />
            </div>
          )}

          {/* Dynamic Send / Mic Button */}
          {inputText.trim() ? (
            <button
              type="button"
              onClick={() => handleSend()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title="Envoyer le message"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={isRecording ? stopAndSendRecording : startRecording}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-md'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
              }`}
              title={isRecording ? 'Arrêter et envoyer' : 'Enregistrer une note vocale'}
            >
              {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 8. FULLSCREEN PHOTO LIGHTBOX */}
      {/* ================================================================= */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Agrandissement"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* 9. CALL SIMULATION MODAL (Romantic Video / Audio Call) */}
      {/* ================================================================= */}
      <AnimatePresence>
        {activeCallType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-b from-stone-950 via-rose-950 to-stone-900 text-white rounded-3xl border border-rose-800/40 max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden">
              {/* Call Type Label */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-rose-300 text-xs font-semibold mb-4">
                {activeCallType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                <span>{activeCallType === 'video' ? 'Appel Vidéo Intime' : 'Appel Audio Intime'}</span>
              </div>

              {/* Partner Avatar in Big Call View */}
              <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-rose-400/80 shadow-xl mb-4 bg-stone-800">
                {otherPartner.avatarUrl ? (
                  <img
                    src={otherPartner.avatarUrl}
                    alt={otherPartner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-rose-200">
                    {otherPartner.name.slice(0, 2)}
                  </div>
                )}
                <div className="absolute inset-0 ring-4 ring-rose-400/30 animate-ping rounded-full pointer-events-none" />
              </div>

              <h3 className="font-serif-romantic text-xl font-bold mb-1">{otherPartner.name}</h3>
              <p className="text-xs text-rose-300 font-mono mb-6 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>En communication : {formatCallTime(callDuration)}</span>
              </p>

              {/* Romantic quote */}
              <p className="text-xs text-rose-100/80 italic mb-6 px-4">
                « Même à distance, ta voix et ton regard font battre mon cœur... »
              </p>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    spawnHeartBurst(rect.left + rect.width / 2, rect.top, 8);
                    soundEffects.playHeartPulse();
                    onSendMessage({
                      senderId: activePartnerId,
                      content: '❤️ Je t\'envoie un bisou pendant notre appel !',
                    });
                  }}
                  className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-rose-300 transition-colors cursor-pointer"
                  title="Envoyer un bisou pendant l'appel"
                >
                  <Heart className="w-6 h-6 fill-current" />
                </button>

                {/* Hang up button */}
                <button
                  onClick={() => {
                    setActiveCallType(null);
                    soundEffects.playSoftTap();
                  }}
                  className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Raccrocher"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* 10. EDIT MESSAGE MODAL */}
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
    </div>
  );
};

export const WhatsAppChatView = ChatView;
export type WhatsAppChatViewProps = ChatViewProps;
