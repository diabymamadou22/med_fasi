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
  Trash2,
  CornerUpLeft,
  Heart,
  Play,
  Pause,
  Image as ImageIcon,
  ChevronDown,
  Volume2,
  StopCircle,
  PhoneOff,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  ChatMessage,
  MissYouPulse,
} from '../../types';
import {
  saveChatMessage,
  deleteChatMessageFromDb,
  updateChatMessageReaction,
  updateChatMessageStatus,
  setChatTypingStatus,
  subscribeChatTypingStatus,
} from '../../lib/firestoreService';
import { soundEffects } from '../../lib/audio';
import { processPhotoWithoutCropping } from '../../lib/imageUtils';

interface WhatsAppChatViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSwitchPartner: (newPartnerId: PartnerId) => void;
  messages: ChatMessage[];
  onSendMessage: (msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>) => void;
  onSendMissYouPulse: (pulseData: Omit<MissYouPulse, 'id' | 'timestamp'>) => void;
}

export const WhatsAppChatView: React.FC<WhatsAppChatViewProps> = ({
  profile,
  activePartnerId,
  onSwitchPartner,
  messages,
  onSendMessage,
  onSendMissYouPulse,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const otherPartnerId: PartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';

  // Input states
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Audio / Call modals
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Lightbox for photos
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
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

  // Scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time typing status
  useEffect(() => {
    const unsub = subscribeChatTypingStatus((map) => {
      setTypingMap(map);
    });
    return () => unsub();
  }, []);

  // Mark other partner's messages as read when viewing chat
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.senderId === otherPartnerId && msg.status !== 'read') {
        updateChatMessageStatus(msg.id, 'read').catch(() => {});
      }
    });
  }, [messages, otherPartnerId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Notify Firestore typing
    setChatTypingStatus(activePartnerId, true).catch(() => {});

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setChatTypingStatus(activePartnerId, false).catch(() => {});
    }, 2500);
  };

  // Scroll listener
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isUp);
  };

  // Send message
  const handleSend = () => {
    if (!inputText.trim()) return;

    // Stop typing status
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setChatTypingStatus(activePartnerId, false).catch(() => {});

    onSendMessage({
      senderId: activePartnerId,
      content: inputText.trim(),
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderId: replyingTo.senderId,
            content: replyingTo.content || (replyingTo.mediaType === 'image' ? '📷 Photo' : '🎵 Note vocale'),
            mediaUrl: replyingTo.mediaUrl,
          }
        : undefined,
    });

    soundEffects.playMessageSent();
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
  };

  // Handle Photo selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await processPhotoWithoutCropping(file, 1200, 0.82);
      onSendMessage({
        senderId: activePartnerId,
        content: inputText.trim() || '📷 Photo partagée',
        mediaUrl: dataUrl,
        mediaType: 'image',
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              senderId: replyingTo.senderId,
              content: replyingTo.content,
              mediaUrl: replyingTo.mediaUrl,
            }
          : undefined,
      });
      soundEffects.playMessageSent();
      setInputText('');
      setReplyingTo(null);
      setShowAttachmentMenu(false);
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du traitement de la photo');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendMessage({
            senderId: activePartnerId,
            content: '🎵 Note vocale',
            mediaUrl: base64Audio,
            mediaType: 'audio',
            audioDuration: Math.max(1, recordSeconds),
          });
          soundEffects.playMessageSent();
        };
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      // Fallback: Simulated lovely audio message
      setIsRecording(true);
      setRecordSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    }
  };

  const stopAndSendRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Send simulated romantic audio memo
      onSendMessage({
        senderId: activePartnerId,
        content: '🎵 Note vocale d\'amour',
        mediaType: 'audio',
        audioDuration: Math.max(2, recordSeconds),
      });
      soundEffects.playMessageSent();
    }
  };

  const cancelRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Audio playback toggle
  const togglePlayAudio = (msg: ChatMessage) => {
    if (playingAudioId === msg.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msg.id);
      if (msg.mediaUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(msg.mediaUrl);
        } else {
          audioRef.current.src = msg.mediaUrl;
        }
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().catch(() => {});
        audioRef.current.onended = () => setPlayingAudioId(null);
      } else {
        // Play sweet chime tone for simulated audio memo
        soundEffects.playHeartPulse();
        setTimeout(() => setPlayingAudioId(null), (msg.audioDuration || 3) * 1000);
      }
    }
  };

  // Reactions
  const handleReaction = (messageId: string, emoji: string) => {
    updateChatMessageReaction(messageId, activePartnerId, emoji).catch(console.error);
    soundEffects.playSoftTap();
  };

  // Call simulation timer
  useEffect(() => {
    let timer: any;
    if (activeCallType) {
      soundEffects.playHeartPulse();
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCallType]);

  const isOtherPartnerTyping = typingMap[otherPartnerId]?.isTyping;

  // Filter messages by search query if search is active
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; items: ChatMessage[] }[] = [];
    filteredMessages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel = msgDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      });

      if (msgDate.toDateString() === today.toDateString()) {
        dateLabel = "Aujourd'hui";
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Hier';
      }

      const existingGroup = groups.find((g) => g.dateLabel === dateLabel);
      if (existingGroup) {
        existingGroup.items.push(msg);
      } else {
        groups.push({ dateLabel, items: [msg] });
      }
    });
    return groups;
  }, [filteredMessages]);

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const romanticEmojis = [
    '❤️', '😘', '🥰', '😍', '🌹', '💌', '💍', '✨',
    '🥺', '🔥', '😂', '💋', '💖', '🧸', '🍫', '🙏',
  ];

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-4 py-2 sm:py-4">
      {/* Hidden File Input for instant camera/gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main WhatsApp Window Card */}
      <div className="bg-[#efeae2] rounded-2xl sm:rounded-3xl shadow-xl border border-stone-300/80 overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-h-[820px] relative">
        
        {/* ================================================================= */}
        {/* 1. WHATSAPP TOP APP BAR (Green / Dark Slate authentic style) */}
        {/* ================================================================= */}
        <div className="bg-[#075e54] text-white px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Other Partner Avatar with active status */}
            <div className="relative cursor-pointer" onClick={() => onSwitchPartner(otherPartnerId)}>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white/80 bg-stone-200 shadow-xs">
                {otherPartner.avatarUrl ? (
                  <img
                    src={otherPartner.avatarUrl}
                    alt={otherPartner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-emerald-800 bg-emerald-100 text-sm">
                    {otherPartner.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full" />
            </div>

            {/* Partner Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base leading-tight truncate">
                  {otherPartner.name}
                </h2>
                <span className="text-[11px] bg-emerald-700/60 text-emerald-100 px-1.5 py-0.5 rounded-md font-mono hidden sm:inline">
                  Duo
                </span>
              </div>
              
              {/* Online or Typing Status */}
              <p className="text-xs text-emerald-100/90 leading-tight truncate flex items-center gap-1.5">
                {isOtherPartnerTyping ? (
                  <span className="text-amber-200 font-semibold flex items-center gap-1 animate-pulse">
                    <span>en train d'écrire...</span>
                    <Sparkles className="w-3 h-3 animate-spin" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping inline-block" />
                    <span>en ligne pour toi 💕</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Action Icons (Calls, Pulse, Switch Duo) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick Switch Duo Button (Perfect for tests or shared device) */}
            <button
              onClick={() => onSwitchPartner(otherPartnerId)}
              className="px-2 py-1 bg-emerald-700/80 hover:bg-emerald-600 rounded-lg text-xs font-semibold text-emerald-100 flex items-center gap-1 transition-colors cursor-pointer"
              title="Changer de perspective (Mamadou / Fatou)"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Moi :</span>
              <span className="font-bold text-white truncate max-w-[65px]">{currentPartner.name}</span>
            </button>

            {/* Video Call Simulation */}
            <button
              onClick={() => setActiveCallType('video')}
              className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Appel vidéo d'amour"
            >
              <Video className="w-5 h-5" />
            </button>

            {/* Audio Call Simulation */}
            <button
              onClick={() => setActiveCallType('audio')}
              className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Appel vocal d'amour"
            >
              <Phone className="w-4.5 h-4.5" />
            </button>

            {/* Miss You Quick Pulse */}
            <button
              onClick={() => {
                onSendMissYouPulse({
                  senderId: activePartnerId,
                  vibe: 'kiss',
                  message: 'Je pense fort à toi mon amour sur notre WhatsApp ❤️',
                });
                soundEffects.playHeartPulse();
              }}
              className="p-2 hover:bg-white/10 rounded-full text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
              title="Envoyer un bisou instantané"
            >
              <Heart className="w-5 h-5 fill-current" />
            </button>

            {/* Search Button */}
            <button
              onClick={() => setShowSearchBar(!showSearchBar)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showSearchBar ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Rechercher dans la discussion"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Optional Search Bar */}
        {showSearchBar && (
          <div className="bg-[#128c7e] px-4 py-2 flex items-center gap-2 text-white text-xs z-20">
            <Search className="w-4 h-4 text-emerald-200" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un mot doux, un souvenir..."
              className="flex-1 bg-white/20 text-white placeholder-emerald-200 px-3 py-1.5 rounded-lg text-xs outline-hidden focus:bg-white/30"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 hover:text-rose-200">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. CHAT WALLPAPER & MESSAGES FEED */}
        {/* ================================================================= */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 relative"
          style={{
            backgroundImage: `radial-gradient(#d1d7db 1px, transparent 1px), radial-gradient(#d1d7db 1px, #efeae2 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        >
          {/* Encryption & Romantic Disclaimer Pill */}
          <div className="flex justify-center my-2">
            <div className="bg-[#ffeecd] border border-[#f0dfba] text-[#54656f] text-[11px] px-3.5 py-1.5 rounded-lg text-center max-w-sm shadow-2xs">
              🔒 <span className="font-semibold">Discussion de couple protégée :</span> Vos messages, photos et notes vocales d'amour sont synchronisés en direct rien que pour vous deux.
            </div>
          </div>

          {/* Grouped Messages */}
          {groupedMessages.map((group) => (
            <div key={group.dateLabel} className="space-y-3">
              {/* Date divider badge */}
              <div className="flex justify-center">
                <span className="bg-white/90 backdrop-blur-xs text-stone-600 font-medium text-[11px] px-3 py-1 rounded-md shadow-2xs border border-stone-200">
                  {group.dateLabel}
                </span>
              </div>

              {/* Message items */}
              {group.items.map((msg) => {
                const isMe = msg.senderId === activePartnerId;
                const msgTime = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const senderName = isMe ? currentPartner.name : otherPartner.name;
                const reactionsList = Object.entries(msg.reactions || {});

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Message Bubble Container */}
                    <div
                      className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 sm:p-3 shadow-xs text-stone-900 ${
                        isMe
                          ? 'bg-[#d9fdd3] rounded-tr-xs border border-emerald-200/60'
                          : 'bg-white rounded-tl-xs border border-stone-200/80'
                      }`}
                    >
                      {/* Sender name on received message */}
                      {!isMe && (
                        <p className="text-[11px] font-bold text-emerald-700 mb-1">
                          {senderName}
                        </p>
                      )}

                      {/* Quoted Reply if present */}
                      {msg.replyTo && (
                        <div className="mb-2 p-2 rounded-lg bg-black/5 border-l-4 border-emerald-600 text-xs text-stone-700">
                          <p className="font-bold text-[11px] text-emerald-800">
                            {msg.replyTo.senderId === activePartnerId ? 'Vous' : otherPartner.name}
                          </p>
                          <p className="truncate text-stone-600 text-[11px]">{msg.replyTo.content}</p>
                        </div>
                      )}

                      {/* Photo Content */}
                      {msg.mediaType === 'image' && msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden mb-1.5 bg-stone-100 cursor-pointer">
                          <img
                            src={msg.mediaUrl}
                            alt="Photo souvenir"
                            onClick={() => setLightboxImage(msg.mediaUrl!)}
                            className="max-h-72 w-auto object-contain rounded-xl hover:opacity-95 transition-opacity"
                          />
                        </div>
                      )}

                      {/* Voice Note Content */}
                      {msg.mediaType === 'audio' && (
                        <div className="flex items-center gap-3 py-1 px-1 min-w-[200px] sm:min-w-[240px]">
                          <button
                            onClick={() => togglePlayAudio(msg)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all cursor-pointer ${
                              playingAudioId === msg.id ? 'bg-emerald-600 scale-105' : 'bg-emerald-500 hover:bg-emerald-600'
                            }`}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-5 h-5 fill-white" />
                            ) : (
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            )}
                          </button>

                          {/* Waveform graphic */}
                          <div className="flex-1">
                            <div className="flex items-center gap-1 h-6">
                              {[40, 70, 30, 85, 50, 95, 60, 45, 80, 65, 90, 40, 75, 55].map((height, i) => (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-full transition-all ${
                                    playingAudioId === msg.id ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-300'
                                  }`}
                                  style={{ height: `${height}%` }}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                              <span>{msg.audioDuration ? `0:${msg.audioDuration.toString().padStart(2, '0')}` : '0:05'}</span>
                              <button
                                onClick={() => {
                                  const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
                                  setPlaybackSpeed(nextSpeed);
                                  if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
                                }}
                                className="font-bold text-[10px] text-emerald-800 bg-emerald-100 px-1 rounded-md"
                              >
                                {playbackSpeed}x
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Text Content */}
                      {msg.content && msg.content !== '🎵 Note vocale' && msg.content !== '📷 Photo partagée' && (
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words pr-12">
                          {msg.content}
                        </p>
                      )}

                      {/* Bottom Info: Timestamp and Double Blue Checkmark */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-stone-500 float-right -mt-2 -mr-1">
                        <span>{msgTime}</span>
                        {isMe && (
                          <span>
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] stroke-[2.5]" title="Lu" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-stone-400 stroke-[2]" title="Distribué" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-stone-400 stroke-[2]" title="Envoyé" />
                            )}
                          </span>
                        )}
                      </div>

                      <div className="clear-both" />

                      {/* Reactions Badges underneath bubble */}
                      {reactionsList.length > 0 && (
                        <div className="absolute -bottom-2.5 left-2 bg-white border border-stone-200 rounded-full px-1.5 py-0.5 shadow-xs flex items-center gap-1 text-xs">
                          {reactionsList.map(([pId, emoji]) => (
                            <span key={pId} title={`Réaction de ${pId === 'p1' ? profile.partner1.name : profile.partner2.name}`}>
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Hover Action Bar (Reply, Reaction, Delete) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 text-stone-400 text-xs px-2">
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 hover:text-emerald-700 hover:bg-black/5 rounded-full"
                        title="Répondre"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '❤️')}
                        className="p-1 hover:scale-125 transition-transform"
                        title="Réagir avec un cœur"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '😂')}
                        className="p-1 hover:scale-125 transition-transform"
                        title="Réagir de rire"
                      >
                        😂
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '🥰')}
                        className="p-1 hover:scale-125 transition-transform"
                        title="Réagir avec amour"
                      >
                        🥰
                      </button>
                      {isMe && (
                        <button
                          onClick={() => deleteChatMessageFromDb(msg.id)}
                          className="p-1 hover:text-rose-600 hover:bg-black/5 rounded-full"
                          title="Supprimer pour moi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
              className="flex items-center gap-2 max-w-[120px] bg-white rounded-2xl rounded-tl-xs px-3.5 py-2.5 border border-stone-200 shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-20 right-5 bg-white text-stone-600 hover:text-emerald-700 p-2.5 rounded-full shadow-lg border border-stone-200 transition-all hover:scale-105 z-20 cursor-pointer"
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
              className="bg-[#e9edef] px-4 py-2 border-t border-stone-200 flex items-center justify-between text-xs z-10"
            >
              <div className="border-l-4 border-emerald-600 pl-2.5 truncate">
                <p className="font-bold text-emerald-800">
                  Réponse à {replyingTo.senderId === activePartnerId ? 'Vous-même' : otherPartner.name}
                </p>
                <p className="text-stone-600 truncate">{replyingTo.content}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 text-stone-500 hover:text-stone-800 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* 4. EMOJI DRAWER TRAY */}
        {/* ================================================================= */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white border-t border-stone-200 p-3 grid grid-cols-8 gap-2 z-10 shadow-inner max-h-36 overflow-y-auto"
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
        {/* 5. ATTACHMENT ACTION MENU (+ / Paperclip) */}
        {/* ================================================================= */}
        <AnimatePresence>
          {showAttachmentMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-16 left-12 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-30 flex flex-col gap-1 min-w-[190px]"
            >
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
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
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-rose-50 hover:text-rose-800 transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <span>Envoyer un mot tendre</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================= */}
        {/* 6. WHATSAPP BOTTOM INPUT BAR */}
        {/* ================================================================= */}
        <div className="bg-[#f0f2f5] px-2 sm:px-4 py-2 flex items-center gap-2 border-t border-stone-200 z-20 shrink-0">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachmentMenu(false);
            }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showEmojiPicker ? 'text-emerald-700 bg-emerald-100' : 'text-stone-500 hover:text-stone-700'
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
              showAttachmentMenu ? 'text-emerald-700 bg-emerald-100' : 'text-stone-500 hover:text-stone-700'
            }`}
            title="Joindre une photo ou surprise"
          >
            <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Voice recording in-progress display OR text input */}
          {isRecording ? (
            <div className="flex-1 bg-white rounded-2xl px-4 py-2 flex items-center justify-between shadow-2xs border border-rose-300">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Enregistrement en direct ({recordSeconds}s)...</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Envoyer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl px-3.5 py-1.5 border border-stone-200 shadow-2xs flex items-center">
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
                placeholder="Tapez un message d'amour..."
                className="w-full bg-transparent text-stone-800 text-xs sm:text-sm placeholder-stone-400 resize-none outline-hidden max-h-24"
              />
            </div>
          )}

          {/* Dynamic Send / Mic Button */}
          {inputText.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title="Envoyer le message"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={isRecording ? stopAndSendRecording : startRecording}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#00a884] hover:bg-[#008f6f] text-white'
              }`}
              title={isRecording ? 'Arrêter et envoyer' : 'Enregistrer une note vocale'}
            >
              {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 7. FULLSCREEN PHOTO LIGHTBOX */}
      {/* ================================================================= */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
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
      {/* 8. CALL SIMULATION MODAL (Romantic Video / Audio Call) */}
      {/* ================================================================= */}
      <AnimatePresence>
        {activeCallType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-[#0b141a] text-white rounded-3xl border border-stone-700/60 max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 via-transparent to-rose-950/40 pointer-events-none" />

              {/* Call Type Label */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-4">
                {activeCallType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                <span>{activeCallType === 'video' ? 'Appel Vidéo Duo' : 'Appel Audio Duo'}</span>
              </div>

              {/* Partner Avatar in Big Call View */}
              <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-400/80 shadow-xl mb-4 bg-stone-800">
                {otherPartner.avatarUrl ? (
                  <img
                    src={otherPartner.avatarUrl}
                    alt={otherPartner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-emerald-200">
                    {otherPartner.name.slice(0, 2)}
                  </div>
                )}
                <div className="absolute inset-0 ring-4 ring-emerald-400/30 animate-ping rounded-full pointer-events-none" />
              </div>

              <h3 className="font-serif-romantic text-xl font-bold mb-1">{otherPartner.name}</h3>
              <p className="text-xs text-emerald-400 font-mono mb-6 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>En communication : {formatCallTime(callDuration)}</span>
              </p>

              {/* Romantic quote */}
              <p className="text-xs text-stone-300 italic mb-6 px-4">
                « Même à distance, ta voix et ton regard font battre mon cœur... »
              </p>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    soundEffects.playHeartPulse();
                    onSendMessage({
                      senderId: activePartnerId,
                      content: '❤️ Je t\'envoie un bisou pendant notre appel !',
                    });
                  }}
                  className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-rose-400 transition-colors"
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
    </div>
  );
};
