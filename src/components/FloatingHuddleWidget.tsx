import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, Mic, MicOff, Video, VideoOff, MonitorUp, Hand, Circle, Square, 
  PhoneOff, Maximize2, Move, GripHorizontal, Volume2, Sparkles, Check, AlertCircle 
} from 'lucide-react';
import { useWorkspace } from '../context';
import { ViewType } from '../types';

interface FloatingHuddleWidgetProps {
  currentView: ViewType;
  onNavigate: (view: ViewType, channelId?: string) => void;
}

export function FloatingHuddleWidget({ currentView, onNavigate }: FloatingHuddleWidgetProps) {
  const { 
    activeHuddle, 
    endGlobalHuddle, 
    toggleHuddleMic, 
    toggleHuddleVideo, 
    toggleHuddleScreenShare, 
    toggleHuddleRecording, 
    toggleHuddleHand, 
    setHuddleMinimized,
    updateHuddlePosition,
    users, 
    channels, 
    userLanguage,
    recordingAnnouncementToast
  } = useWorkspace();

  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0
  });

  // Calculate default position if not set
  useEffect(() => {
    if (activeHuddle.inCall && activeHuddle.position.x === 0 && activeHuddle.position.y === 0) {
      const defaultX = Math.max(20, window.innerWidth - 360);
      const defaultY = Math.max(20, window.innerHeight - 200);
      updateHuddlePosition({ x: defaultX, y: defaultY });
    }
  }, [activeHuddle.inCall]);

  // Determine target name
  let targetName = isArabic ? 'اجتماع سريع' : 'Huddle';
  if (activeHuddle.targetType === 'person') {
    const u = users.find(x => x.id === activeHuddle.targetId);
    if (u) targetName = `@${u.name}`;
  } else if (activeHuddle.targetType === 'channel') {
    const c = channels.find(x => x.id === activeHuddle.targetId);
    if (c) targetName = `#${c.name}`;
  }

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent drag if clicking directly on a button
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: activeHuddle.position.x || Math.max(20, window.innerWidth - 360),
      initialY: activeHuddle.position.y || Math.max(20, window.innerHeight - 200)
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const newX = Math.max(10, Math.min(window.innerWidth - 330, dragStartRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 180, dragStartRef.current.initialY + deltaY));

      updateHuddlePosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch support for dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      initialX: activeHuddle.position.x || Math.max(20, window.innerWidth - 360),
      initialY: activeHuddle.position.y || Math.max(20, window.innerHeight - 200)
    };
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.mouseX;
      const deltaY = touch.clientY - dragStartRef.current.mouseY;

      const newX = Math.max(10, Math.min(window.innerWidth - 330, dragStartRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 180, dragStartRef.current.initialY + deltaY));

      updateHuddlePosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Don't render if call is not active
  if (!activeHuddle.inCall) return null;

  // Show floating widget if user is outside 'huddles' view OR if explicitly minimized
  const shouldShowFloating = currentView !== 'huddles' || activeHuddle.isMinimized;
  if (!shouldShowFloating) return null;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        left: `${activeHuddle.position.x || Math.max(20, window.innerWidth - 360)}px`,
        top: `${activeHuddle.position.y || Math.max(20, window.innerHeight - 200)}px`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`fixed z-[9999] w-[340px] max-w-[calc(100vw-24px)] bg-[#121317]/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden select-none transition-shadow ${
        isDragging ? 'cursor-grabbing shadow-blue-500/30 ring-2 ring-blue-500/50' : 'cursor-grab hover:border-blue-500/60'
      }`}
    >
      {/* Toast Notification Banner for Speech Announcement */}
      {recordingAnnouncementToast && (
        <div className="bg-gradient-to-r from-red-600 to-purple-600 px-3 py-1.5 text-white text-[11px] font-bold flex items-center justify-between animate-pulse border-b border-red-400/30">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
            <Volume2 className="h-3.5 w-3.5 shrink-0 animate-bounce" />
            <span className="truncate">{recordingAnnouncementToast}</span>
          </div>
          <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded uppercase font-mono">Audio</span>
        </div>
      )}

      {/* Header Bar with Drag Handle & Target */}
      <div className="bg-[#181A20] px-3.5 py-2.5 flex items-center justify-between border-b border-gray-800/80">
        <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
          <GripHorizontal className="h-4 w-4 text-gray-500 shrink-0 cursor-grab" />
          <div className="relative shrink-0">
            <Headphones className="h-4 w-4 text-blue-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs font-bold text-white truncate max-w-[130px]">{targetName}</span>
        </div>

        <div className="flex items-center space-x-1 rtl:space-x-reverse shrink-0">
          {/* Expand Button */}
          <button
            onClick={() => {
              setHuddleMinimized(false);
              onNavigate('huddles');
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
            title={isArabic ? 'توسيع الاجتماع' : 'Expand full huddle'}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={endGlobalHuddle}
            className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition cursor-pointer shadow"
            title={isArabic ? 'إنهاء الاجتماع' : 'End huddle'}
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body: Live Status & Controls */}
      <div className="p-3 space-y-3 bg-[#121317]">
        
        {/* Timer & Indicators */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="font-mono text-gray-300 font-bold">
              {formatTimer(activeHuddle.recordingSeconds)}
            </span>

            {activeHuddle.isRecording && (
              <span className="flex items-center space-x-1 rtl:space-x-reverse px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 fill-current" />
                <span>REC</span>
              </span>
            )}

            {activeHuddle.handRaised && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                ✋ {isArabic ? 'مرفوع' : 'Hand Raised'}
              </span>
            )}
          </div>

          {/* Dynamic Audio Level Ring */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            <Volume2 className="h-3.5 w-3.5 text-gray-400" />
            <div className="w-14 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
              <div 
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${activeHuddle.micEnabled ? activeHuddle.micLevel : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Action Control Bar */}
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse bg-[#181A20] p-2 rounded-xl border border-gray-800">
          {/* Mute/Unmute */}
          <button
            onClick={toggleHuddleMic}
            className={`p-2 rounded-xl transition cursor-pointer ${
              activeHuddle.micEnabled 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
            title={activeHuddle.micEnabled ? (isArabic ? 'كتم الصوت' : 'Mute') : (isArabic ? 'إلغاء الكتم' : 'Unmute')}
          >
            {activeHuddle.micEnabled ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleHuddleVideo}
            className={`p-2 rounded-xl transition cursor-pointer ${
              activeHuddle.videoEnabled 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
            title={isArabic ? 'الكاميرا' : 'Camera'}
          >
            {activeHuddle.videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleHuddleScreenShare}
            className={`p-2 rounded-xl transition cursor-pointer ${
              activeHuddle.screenSharing 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
            title={isArabic ? 'مشاركة الشاشة' : 'Share Screen'}
          >
            <MonitorUp className="h-4 w-4" />
          </button>

          {/* Record Button with Female Voice Announcement */}
          <button
            onClick={toggleHuddleRecording}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
              activeHuddle.isRecording 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-gray-800 hover:bg-gray-700 text-red-400'
            }`}
            title={activeHuddle.isRecording ? (isArabic ? 'إيقاف التسجيل' : 'Stop Recording') : (isArabic ? 'بدء التسجيل (مع تنبيه صوتي)' : 'Start Record (with female voice alert)')}
          >
            {activeHuddle.isRecording ? <Square className="h-4 w-4 fill-current" /> : <Circle className="h-4 w-4 fill-current" />}
          </button>

          {/* Hand Raise */}
          <button
            onClick={toggleHuddleHand}
            className={`p-2 rounded-xl transition cursor-pointer ${
              activeHuddle.handRaised 
                ? 'bg-amber-500 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
            title={isArabic ? 'رفع اليد' : 'Raise Hand'}
          >
            <Hand className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
