import React, { useState, useRef, useEffect } from 'react';
import { 
  Headphones, Video, MonitorUp, Mic, MicOff, VideoOff, PhoneOff, Users, AlertCircle, 
  ExternalLink, X, ChevronDown, ChevronUp, MoreVertical, Plus, Hash, Lock, Search, Sparkles, 
  Volume2, ShieldAlert, Activity, Image, Sliders, Check, Settings, Ear, HelpCircle, 
  Info, Circle, Play, Pause, Download, Share2, FileText, CornerUpRight, Hand, MessageSquare, 
  Grid, Layout, Smile, Wand2, ShieldCheck, Flame, Zap, Minimize2, Copy, LogOut
} from 'lucide-react';
import { canAccessChannel, useWorkspace, RecordedHuddle } from '../../context';
import { getTranslation } from '../../utils/i18n';
import { UserAvatar } from '../UserAvatar';
import { useWebRTCCall } from '../../hooks/useWebRTCCall';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-converter';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

export function HuddlesView() {
  const { 
    users, channels, userLanguage, currentUser,
    activeHuddle, startGlobalHuddle, endGlobalHuddle,
    toggleHuddleMic, toggleHuddleVideo, toggleHuddleScreenShare, toggleHuddleRecording, toggleHuddleHand,
    setHuddleNotes, setLayoutMode, setShowNotesDrawer, setMicLevel,
    savedRecordings, setSavedRecordings, setHuddleMinimized, huddleLogs, activeOrganizationId
  } = useWorkspace();
  const isArabic = userLanguage.includes('Arabic') || userLanguage.includes('العربية');
  const visibleChannels = channels.filter(channel => canAccessChannel(channel, currentUser, activeOrganizationId));

  // Destructure activeHuddle for ease of use
  const { 
    inCall, videoEnabled, micEnabled, screenSharing, isRecording, recordingSeconds,
    handRaised, showNotesDrawer, huddleNotes, layoutMode, micLevel, targetId: huddleTargetId, targetType: huddleTargetType
  } = activeHuddle;

  const callRoomUrl = `${window.location.origin}${window.location.pathname}?view=huddles&call=${encodeURIComponent(activeHuddle.code || '')}`;
  const { localStream, remoteStreams, participants: liveParticipants, connectionState, setMicEnabled, setCameraEnabled } = useWebRTCCall({
    roomId: inCall ? activeHuddle.code : null,
    userId: currentUser?.id || null,
    mode: videoEnabled ? 'video' : 'audio',
    enabled: inCall
  });
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  // Floating reactions state
  const [activeReactions, setActiveReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);

  const [selectedVaultRec, setSelectedVaultRec] = useState<RecordedHuddle | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlayingVaultRec, setIsPlayingVaultRec] = useState(false);

  // Error alert state
  const [errorMsg, setErrorMsg] = useState<{ title: string; text: string } | null>(null);

  // Media Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

    // Video background & filters
  const [selectedBlurEffect, setSelectedBlurEffect] = useState<'none' | 'subtle' | 'vignette'>('none');
  const [selectedVirtualBackground, setSelectedVirtualBackground] = useState<string>('none');
  const [activeColorFilter, setActiveColorFilter] = useState<string>('none');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmenterRef = useRef<any>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    let active = true;
    const loadModel = async () => {
      try {
        const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
        const segmenterConfig = {
          runtime: 'tfjs' as const,
          modelType: 'general' as const,
        };
        const segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
        if (active) segmenterRef.current = segmenter;
      } catch (err) {
        console.error("Failed to load segmenter", err);
      }
    };
    loadModel();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const renderFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !segmenterRef.current) {
        requestRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (video.readyState < 2 || video.videoWidth === 0) {
        requestRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      if ((selectedVirtualBackground !== 'none' || selectedBlurEffect !== 'none') && videoEnabled && !screenSharing) {
        try {
          const segmentation = await segmenterRef.current.segmentPeople(video);
          
          if (!segmentation || segmentation.length === 0) {
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            requestRef.current = requestAnimationFrame(renderFrame);
            return;
          }

          if (selectedBlurEffect !== 'none') {
             const blurAmount = selectedBlurEffect === 'subtle' ? 8 : 16;
             await bodySegmentation.drawBokehEffect(canvas, video, segmentation, 0.5, blurAmount);
          } else {
             const foregroundColor = {r: 255, g: 255, b: 255, a: 255};
             const backgroundColor = {r: 0, g: 0, b: 0, a: 0};
             const mask = await bodySegmentation.toBinaryMask(segmentation, foregroundColor, backgroundColor);
             
             ctx?.clearRect(0, 0, canvas.width, canvas.height);
             if (mask && mask.width > 0 && mask.height > 0 && ctx) {
               // Soften mask edges for better isolation
               const offCanvas = document.createElement('canvas');
               offCanvas.width = canvas.width;
               offCanvas.height = canvas.height;
               const offCtx = offCanvas.getContext('2d');
               if (offCtx) {
                 offCtx.putImageData(mask, 0, 0);
                 ctx.filter = 'blur(4px)'; // Blur the mask
                 ctx.drawImage(offCanvas, 0, 0);
                 ctx.filter = 'none';
                 ctx.globalCompositeOperation = 'source-in';
                 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                 ctx.globalCompositeOperation = 'source-over';
               } else {
                 // Fallback if offscreen canvas fails
                 ctx.putImageData(mask, 0, 0);
                 ctx.globalCompositeOperation = 'source-in';
                 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                 ctx.globalCompositeOperation = 'source-over';
               }
             }
          }
        } catch (e) {
          console.error("Segmentation error", e);
        }
      } else {
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      requestRef.current = requestAnimationFrame(renderFrame);
    };
    
    requestRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [selectedVirtualBackground, selectedBlurEffect, videoEnabled, screenSharing]);

  // Studio Panel States
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [effectsTab, setEffectsTab] = useState<'audio' | 'video'>('audio');

  // Audio DSP & Noise Cancellation
  const [echoCancellationActive, setEchoCancellationActive] = useState(true);
  const [noiseSuppressionActive, setNoiseSuppressionActive] = useState(true);
  const [aiKrispNoiseCancel, setAiKrispNoiseCancel] = useState(true);
  const [autoGainControlActive, setAutoGainControlActive] = useState(true);
  const [studioVoiceFilter, setStudioVoiceFilter] = useState(true);
  const [hearMyself, setHearMyself] = useState(false);



  // Web Audio Context & Analyzer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioIntervalRef = useRef<number | null>(null);

  // New Huddle Device Selectors & Controls (matching DeskFlow/Meet control bar)
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('MacBook Pro Microphone (Built-in)');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('MacBook Pro Speakers (Built-in)');
  const [showMicDropdown, setShowMicDropdown] = useState(false);
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState(false);
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [showAudioSettingsModal, setShowAudioSettingsModal] = useState(false);
  const [showClosedCaptions, setShowClosedCaptions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [liveCaptionText, setLiveCaptionText] = useState("Testing the audio feed... Krisp AI noise cancel active.");
  
  // Google Meet layout header state & details
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const meetingCode = activeHuddle.code || "sef-kdkv-jhx";
  const liveParticipantUsers = [
    ...(currentUser ? [{ id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, isLocal: true }] : []),
    ...liveParticipants.map(participant => {
      const user = users.find(item => item.id === participant.id);
      return { id: participant.id, name: user?.name || 'Guest', avatarUrl: user?.avatarUrl, isLocal: false };
    })
  ].filter((user, index, list) => list.findIndex(item => item.id === user.id) === index);
  const inviteableUsers = users.filter(user => user.id !== currentUser?.id && !liveParticipantUsers.some(participant => participant.id === user.id) && user.name.toLowerCase().includes(inviteSearch.toLowerCase()));
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showClosedCaptions) return;
    const captions = [
      "Testing the audio feed... Krisp AI noise cancel active.",
      "Workspace sync completed. Sharing project roadmap updates.",
      "Please feel free to raise hand or drop notes in the collaborative canvas.",
      "Reviewing action items for the upcoming sprint release."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % captions.length;
      setLiveCaptionText(captions[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [showClosedCaptions]);

  // Dashboard Tab state: 'recent' | 'recordings'
  const [mainTab, setMainTab] = useState<'recent' | 'recordings'>('recent');

  // New Huddle Modal states
  const [isNewHuddleModalOpen, setIsNewHuddleModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'channels'>('people');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'person' | 'channel' | null>(null);

  // Active Huddle Target tracking
  // (removed local huddleTargetId/Type, using activeHuddle)

  // Filter dropdown toggle states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showWithDropdown, setShowWithDropdown] = useState(false);
  const [showInDropdown, setShowInDropdown] = useState(false);

  // Dashboard filters state
  const [activeFilterType, setActiveFilterType] = useState<'all' | 'audio' | 'video'>('all');
  const [activeFilterWith, setActiveFilterWith] = useState<string>('all');
  const [activeFilterIn, setActiveFilterIn] = useState<string>('all');

  const huddlesData = [
    { id: '1', userId: '2', date: '4 days ago', duration: '1 minute', type: 'audio', location: 'direct' },
    { id: '2', userId: '2', date: '4 days ago', duration: '8 minutes', type: 'audio', location: '4' },
    { id: '3', userId: '5', date: '5 days ago', duration: 'Less than a minute', type: 'audio', location: 'direct' },
    { id: '4', userId: '3', date: '9 days ago', duration: '1 minute', type: 'audio', location: '4' },
    { id: '5', userId: '6', date: '10 days ago', duration: '1 minute', type: 'audio', location: 'direct' },
    { id: '6', userId: '2', date: '14 days ago', duration: '8 minutes', type: 'audio', location: 'direct' },
    { id: '7', userId: '7', date: '16 days ago', duration: '9 minutes', type: 'audio', location: '4' },
  ];

  const getBackgroundUrl = (bgId: string) => {
    switch (bgId) {
      case 'office':
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';
      case 'living':
        return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80';
      case 'cyber':
        return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
      case 'beach':
        return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
      case 'fluid':
        return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
      default:
        return '';
    }
  };

  const getColorGradeFilter = (filterId: string) => {
    switch (filterId) {
      case 'noir':
        return 'grayscale(1) contrast(1.1)';
      case 'warm':
        return 'sepia(0.35) contrast(1.05) saturate(1.12)';
      case 'neon':
        return 'hue-rotate(150deg) saturate(1.5)';
      case 'vintage':
        return 'contrast(1.1) brightness(1.05) sepia(0.15) saturate(1.15)';
      default:
        return 'none';
    }
  };

  const triggerEmojiReaction = (emoji: string) => {
    const newId = `emoji-${Date.now()}-${Math.random()}`;
    const randomLeft = Math.floor(Math.random() * 60) + 20; // 20% to 80% width
    setActiveReactions(prev => [...prev, { id: newId, emoji, left: randomLeft }]);
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== newId));
    }, 2500);
  };

  const handleStartModalHuddle = () => {
    if (selectedId && selectedType) {
      setIsNewHuddleModalOpen(false);
      startGlobalHuddle(selectedId, selectedType);
    }
  };

  useEffect(() => {
    const handleSharedHuddle = (event: Event) => {
      const code = (event as CustomEvent<{ code?: string }>).detail?.code;
      if (!code || activeHuddle.inCall) return;
      const fallbackTarget = visibleChannels[0]?.id || currentUser?.id || 'shared-room';
      startGlobalHuddle(fallbackTarget, visibleChannels[0]?.id ? 'channel' : 'person', code);
    };
    window.addEventListener('start-shared-huddle', handleSharedHuddle);
    return () => window.removeEventListener('start-shared-huddle', handleSharedHuddle);
  }, [activeHuddle.inCall, currentUser?.id, startGlobalHuddle, visibleChannels]);

  const stopAllMedia = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (!inCall) {
      stopAllMedia();
    }
  }, [inCall]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setupWebAudio = (stream: MediaStream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      let lastNode: AudioNode = source;

      if (studioVoiceFilter || aiKrispNoiseCancel) {
        const hpFilter = audioCtx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.value = aiKrispNoiseCancel ? 200 : 150;

        const bpFilter = audioCtx.createBiquadFilter();
        bpFilter.type = 'peaking';
        bpFilter.frequency.value = 1600;
        bpFilter.Q.value = 1.0;
        bpFilter.gain.value = 5.0;

        const lpFilter = audioCtx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.value = aiKrispNoiseCancel ? 3200 : 3500;

        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 25;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.2;

        lastNode.connect(hpFilter);
        hpFilter.connect(bpFilter);
        bpFilter.connect(lpFilter);
        lpFilter.connect(compressor);
        lastNode = compressor;
      }

      lastNode.connect(analyser);

      if (hearMyself && micEnabled) {
        analyser.connect(audioCtx.destination);
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (audioIntervalRef.current) {
        window.clearInterval(audioIntervalRef.current);
      }

      audioIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current || !micEnabled) {
          setMicLevel(0);
          return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setMicLevel(Math.min(100, Math.round((average / 130) * 100)));
      }, 50);

    } catch (e) {
      console.warn("Web Audio API failed in preview frame:", e);
    }
  };

  const startAudioStream = async () => {
    try {
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(t => t.stop());
      }
      
      const constraints = {
        audio: {
          echoCancellation: echoCancellationActive,
          noiseSuppression: noiseSuppressionActive || aiKrispNoiseCancel,
          autoGainControl: autoGainControlActive,
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      microphoneStreamRef.current = stream;
      
      stream.getAudioTracks().forEach(track => {
        track.enabled = micEnabled;
      });

      setupWebAudio(stream);
    } catch (err) {
      console.warn("Microphone access rejected or unavailable", err);
    }
  };

  const stopAudioStream = () => {
    if (audioIntervalRef.current) {
      window.clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(t => t.stop());
      microphoneStreamRef.current = null;
    }
    setMicLevel(0);
  };

  useEffect(() => {
    if (inCall) {
      startAudioStream();
    } else {
      stopAudioStream();
    }
    return () => stopAudioStream();
  }, [inCall, echoCancellationActive, noiseSuppressionActive, aiKrispNoiseCancel, autoGainControlActive]);

  useEffect(() => {
    setMicEnabled(micEnabled);
  }, [micEnabled, setMicEnabled]);

  useEffect(() => {
    setCameraEnabled(videoEnabled);
  }, [videoEnabled, setCameraEnabled]);

  useEffect(() => {
    if (inCall && microphoneStreamRef.current) {
      microphoneStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = micEnabled;
      });
      setupWebAudio(microphoneStreamRef.current);
    }
  }, [studioVoiceFilter, hearMyself, micEnabled]);

  useEffect(() => {
    return () => {
      stopAllMedia();
      stopAudioStream();
    };
  }, []);

  // Simultaneous Camera + Screen Share Video element binding logic
  useEffect(() => {
    if (localStream && videoRef.current && videoEnabled && !screenSharing) {
      videoRef.current.srcObject = localStream;
    }
    if (localStream && pipVideoRef.current && videoEnabled) {
      pipVideoRef.current.srcObject = localStream;
    }
    if (inCall) {
      if (screenSharing && screenStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = screenStreamRef.current;
      } else if (videoEnabled && cameraStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
      }

      // Picture in picture video element for camera when both are active
      if (screenSharing && videoEnabled && cameraStreamRef.current && pipVideoRef.current) {
        pipVideoRef.current.srcObject = cameraStreamRef.current;
      }
    }
  }, [inCall, videoEnabled, screenSharing, activeHuddle.isMinimized]);

  useEffect(() => {
    const handleVideoSync = async () => {
      if (videoEnabled && !cameraStreamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          cameraStreamRef.current = stream;
          setErrorMsg(null);
        } catch (err) {
          console.warn("Camera access denied", err);
          setErrorMsg({
            title: isArabic ? "تعذر الوصول للكاميرا" : "Camera Access Refused",
            text: isArabic 
              ? "تم رفض الإذن للكاميرا داخل الإطار المعاين. انقر على 'فتح في تبويب جديد' بالزاوية العلوية لتفعيل الإذن."
              : "Camera access was denied inside iframe permissions. Open app in new tab to enable camera feed."
          });
          if (activeHuddle.videoEnabled) {
             toggleHuddleVideo(); // Revert on failure
          }
        }
      } else if (!videoEnabled && cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
    };
    handleVideoSync();
  }, [videoEnabled]);

  useEffect(() => {
    const handleScreenSync = async () => {
      if (screenSharing && !screenStreamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = stream;
          
          stream.getVideoTracks()[0].onended = () => {
            if (activeHuddle.screenSharing) {
              toggleHuddleScreenShare();
            }
          };
          setErrorMsg(null);
        } catch (err) {
          console.warn("Screen share denied", err);
          setErrorMsg({
            title: isArabic ? "تعذر مشاركة الشاشة" : "Screen Share Restricted",
            text: isArabic 
              ? "مشاركة الشاشة غير متاحة في إطار المعاينة الداخلي. قم بفتح التطبيق في تبويب جديد لبدء مشاركة الشاشة."
              : "Screen sharing is restricted inside cross-origin preview iframe. Open in new tab to capture display."
          });
          if (activeHuddle.screenSharing) {
             toggleHuddleScreenShare(); // Revert on failure
          }
        }
      } else if (!screenSharing && screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
    };
    handleScreenSync();
  }, [screenSharing]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowTypeDropdown(false);
      setShowWithDropdown(false);
      setShowInDropdown(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredHuddles = huddlesData.filter(item => {
    if (activeFilterType !== 'all' && item.type !== activeFilterType) return false;
    if (activeFilterWith !== 'all' && item.userId !== activeFilterWith) return false;
    if (activeFilterIn !== 'all') {
      if (activeFilterIn === 'direct' && item.location !== 'direct') return false;
      if (activeFilterIn !== 'direct' && item.location !== activeFilterIn) return false;
    }
    return true;
  });

  // ------------------- MAIN DASHBOARD VIEW (NOT IN CALL) -------------------
  if (!inCall || activeHuddle.isMinimized) {
    return (
      <div className="flex flex-col h-full bg-[#1A1D21] text-gray-300 w-full overflow-hidden">
        {/* Header with "+ New Huddle" button */}
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-800 bg-[#121317] shrink-0 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 rtl:space-x-reverse select-none">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-100">{getTranslation(userLanguage, 'huddles')}</h2>
              <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-1">
                {isArabic ? 'اجتماعات الصوت والفيديو السريعة بمزايا DeskFlow و Google Meet' : 'DeskFlow & Google Meet powered audio & video workspace calls'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedId(null);
              setSelectedType(null);
              setIsNewHuddleModalOpen(true);
            }}
            id="new-huddle-header-btn"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 sm:px-4 py-2 text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse cursor-pointer shadow-lg transition-all ml-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{isArabic ? 'اجتماع جديد' : 'New Huddle'}</span>
          </button>
        </div>

        {/* Dashboard Navigation Tabs: Recent Huddles vs Saved Recordings Vault */}
        <div className="flex border-b border-gray-800 bg-[#14161B] px-3 sm:px-6 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMainTab('recent')}
            className={`py-3 text-xs font-bold transition border-b-2 mr-4 sm:mr-6 rtl:ml-4 sm:rtl:ml-6 flex items-center space-x-2 rtl:space-x-reverse cursor-pointer whitespace-nowrap ${
              mainTab === 'recent'
                ? 'border-blue-500 text-white font-extrabold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Headphones className="h-4 w-4" />
            <span>{isArabic ? 'الاجتماعات الأخيرة' : 'Recent Huddles'}</span>
          </button>

          <button
            onClick={() => setMainTab('recordings')}
            className={`py-3 text-xs font-bold transition border-b-2 flex items-center space-x-2 rtl:space-x-reverse cursor-pointer whitespace-nowrap ${
              mainTab === 'recordings'
                ? 'border-purple-500 text-white font-extrabold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Circle className="h-4 w-4 text-red-500 fill-red-500/30" />
            <span>{isArabic ? 'مكتبة التسجيلات (Vault)' : 'Huddle Vault'}</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30 font-mono">
              {savedRecordings.length}
            </span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {mainTab === 'recent' ? (
            <div className="p-3 sm:p-6 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 select-none">
              
              {/* Dashboard Header Banner Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Card 1: Huddled with Esraa Soliman */}
                <div 
                  onClick={() => {
                    startGlobalHuddle('2', 'person');
                  }}
                  className="border border-gray-800/80 bg-[#121317]/60 hover:bg-[#121317]/90 hover:border-blue-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all duration-300 cursor-pointer min-h-[190px] shadow-lg"
                >
                  <div className="flex justify-center -space-x-3.5 mb-4 rtl:space-x-reverse">
                    <img 
                      className="w-12 h-12 rounded-full border-2 border-[#121317] object-cover bg-gray-800" 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abdallah&backgroundColor=b6e3f4" 
                      alt="Me" 
                      referrerPolicy="no-referrer"
                    />
                    <img 
                      className="w-12 h-12 rounded-full border-2 border-[#121317] object-cover bg-gray-800" 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=EsraaSoliman&backgroundColor=b6e3f4" 
                      alt="Esraa Soliman" 
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-white font-semibold text-sm flex items-center justify-center gap-1.5 group-hover:text-blue-400 transition-colors">
                      <Headphones className="h-4 w-4 text-blue-500 animate-pulse" /> 
                      <span>{isArabic ? 'بدء اجتماع سريع مع إسراء سليمان؟' : 'Start a huddle with Esraa Soliman?'}</span>
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto mt-1">
                      {isArabic ? 'اجتمعت مع إسراء مرتين خلال الأسبوع الماضي' : 'You huddled with Esraa Soliman 2 times in the last week'}
                    </div>
                  </div>
                </div>

                {/* Card 2: Huddled with Omar Adel */}
                <div 
                  onClick={() => {
                    startGlobalHuddle('5', 'person');
                  }}
                  className="border border-dashed border-gray-800/80 bg-[#121317]/30 hover:bg-[#121317] hover:border-blue-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all duration-300 cursor-pointer min-h-[190px] shadow-lg"
                >
                  <div className="flex justify-center -space-x-3.5 mb-4 rtl:space-x-reverse">
                    <img 
                      className="w-12 h-12 rounded-full border-2 border-[#121317] object-cover bg-gray-800" 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abdallah&backgroundColor=b6e3f4" 
                      alt="Me" 
                      referrerPolicy="no-referrer"
                    />
                    <img 
                      className="w-12 h-12 rounded-full border-2 border-[#121317] object-cover bg-gray-800" 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=OmarAdel&backgroundColor=b6e3f4" 
                      alt="Omar Adel" 
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-white font-semibold text-sm flex items-center justify-center gap-1.5 group-hover:text-blue-400 transition-colors">
                      <Headphones className="h-4 w-4 text-blue-500 animate-pulse" /> 
                      <span>{isArabic ? 'بدء اجتماع سريع مع عمر عادل؟' : 'Start a huddle with Omar Adel?'}</span>
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto mt-1">
                      {isArabic ? 'اجتمعت مع عمر مرة واحدة هذا الأسبوع' : 'You huddled with Omar Adel 1 time in the last week'}
                    </div>
                  </div>
                </div>

              </div>

              {/* Section: Recent Huddles */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-100 px-1">{isArabic ? 'سجل الاجتماعات السابقة' : 'Recent huddles'}</h3>

                {/* Search/Filters bar */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  
                  {/* Filter 1: Type selection */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setShowTypeDropdown(!showTypeDropdown);
                        setShowWithDropdown(false);
                        setShowInDropdown(false);
                      }}
                      className={`px-3 py-1.5 hover:bg-[#2A2D31] text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        showTypeDropdown ? 'bg-[#2A2D31] border-gray-600 ring-2 ring-blue-500/20' : 'bg-[#222529] border-gray-800/80 hover:border-gray-700'
                      }`}
                    >
                      <span>{activeFilterType === 'all' ? (isArabic ? 'جميع الاجتماعات' : 'All huddles') : activeFilterType === 'audio' ? (isArabic ? 'اجتماعات صوتية' : 'Audio huddles') : (isArabic ? 'اجتماعات فيديو' : 'Video huddles')}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    {showTypeDropdown && (
                      <div className="absolute left-0 rtl:left-auto rtl:right-0 mt-1 w-44 rounded-xl bg-[#121317] border border-gray-800 shadow-2xl z-50 py-1 text-xs outline-none">
                        <button 
                          onClick={() => {
                            setActiveFilterType('all');
                            setShowTypeDropdown(false);
                          }}
                          className={`w-full text-left rtl:text-right px-3.5 py-2 hover:bg-gray-800/60 transition-colors ${activeFilterType === 'all' ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}
                        >
                          <span>{isArabic ? 'جميع الاجتماعات' : 'All huddles'}</span>
                        </button>
                        <button 
                          onClick={() => {
                            setActiveFilterType('audio');
                            setShowTypeDropdown(false);
                          }}
                          className={`w-full text-left rtl:text-right px-3.5 py-2 hover:bg-gray-800/60 transition-colors ${activeFilterType === 'audio' ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}
                        >
                          <span>{isArabic ? 'صوتية فقط' : 'Audio huddles'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filter 2: Participant selection */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setShowWithDropdown(!showWithDropdown);
                        setShowTypeDropdown(false);
                        setShowInDropdown(false);
                      }}
                      className={`px-3 py-1.5 hover:bg-[#2A2D31] text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        showWithDropdown ? 'bg-[#2A2D31] border-gray-600 ring-2 ring-blue-500/20' : 'bg-[#222529] border-gray-800/80 hover:border-gray-700'
                      }`}
                    >
                      <span>
                        {activeFilterWith === 'all' ? (isArabic ? 'مع شخص' : 'With') : `${users.find(u => u.id === activeFilterWith)?.name}`}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    {showWithDropdown && (
                      <div className="absolute left-0 rtl:left-auto rtl:right-0 mt-1 w-52 rounded-xl bg-[#121317] border border-gray-800 shadow-2xl z-50 py-1 text-xs max-h-64 overflow-y-auto w-full">
                        <button 
                          onClick={() => {
                            setActiveFilterWith('all');
                            setShowWithDropdown(false);
                          }}
                          className={`w-full text-left rtl:text-right px-3.5 py-2 hover:bg-gray-800/60 transition-colors ${activeFilterWith === 'all' ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}
                        >
                          <span>{isArabic ? 'جميع الأعضاء' : 'All members'}</span>
                        </button>
                        {users.map(u => (
                          <button 
                            key={u.id}
                            onClick={() => {
                              setActiveFilterWith(u.id);
                              setShowWithDropdown(false);
                            }}
                            className={`w-full text-left rtl:text-right px-3.5 py-2 hover:bg-gray-800/60 transition-colors ${activeFilterWith === u.id ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}
                          >
                            <span className="truncate">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {huddleLogs.length > 0 && (
                  <div className="mb-8 bg-[#121317] border border-gray-800/80 rounded-2xl divide-y divide-[#1A1D21] overflow-hidden shadow-xl">
                    <div className="px-4 py-3 bg-[#1A1D21] border-b border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold text-gray-200 text-sm">{isArabic ? 'سجل الاجتماعات' : 'Huddle History Logs'}</h3>
                    </div>
                    {huddleLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-[#121317] hover:bg-[#1A1D21]/50 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-[#1A1D21] rounded-xl flex items-center justify-center border border-gray-800 text-purple-400">
                            <Headphones className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-200 text-sm">
                              {log.targetName} <span className="ml-2 text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-mono">Code: {log.code}</span>
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                              <span>{new Date(log.startedAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                              <span>{log.duration} sec</span>
                              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                              <span>{log.participants.join(', ')}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List block */}
                <div className="bg-[#121317] border border-gray-800/80 rounded-2xl divide-y divide-[#1A1D21] overflow-hidden shadow-xl">
                  {filteredHuddles.length === 0 ? (
                    <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                      <Headphones className="h-8 w-8 text-gray-700 animate-pulse" />
                      <p className="text-sm font-medium">{isArabic ? 'لا يوجد اجتماعات مطابقة للفلاتر.' : 'No recent huddles match your filters.'}</p>
                    </div>
                  ) : (
                    filteredHuddles.map(item => {
                      const user = users.find(u => u.id === item.userId);
                      if (!user) return null;
                      return (
                        <div 
                          key={item.id}
                          onClick={() => {
                            startGlobalHuddle(item.userId, item.location === 'direct' ? 'person' : 'channel');
                          }}
                          className="flex items-center justify-between p-4 bg-[#121317] hover:bg-[#1A1D21]/50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-[#1A1D21] rounded-xl flex items-center justify-center border border-gray-800 group-hover:border-gray-700 text-gray-400 group-hover:text-blue-400">
                              <Headphones className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-200 text-sm group-hover:text-white transition-colors">
                                {user.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                <span>{item.date}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>{item.duration}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex -space-x-1.5 rtl:space-x-reverse">
                              <UserAvatar
                                user={currentUser}
                                fallbackName="Abdallah"
                                className="w-7 h-7 rounded-full border border-gray-900 object-cover bg-gray-800"
                                alt="Me"
                              />
                              <UserAvatar
                                user={user}
                                className="w-7 h-7 rounded-full border border-gray-900 object-cover bg-gray-800"
                                alt={user.name}
                              />
                            </div>
                            <button 
                              onClick={() => {
                                startGlobalHuddle(item.userId, item.location === 'direct' ? 'person' : 'channel');
                              }}
                              className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              {isArabic ? 'انضمام' : 'Re-join'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          ) : (
            /* RECORDINGS VAULT TAB */
            <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2 rtl:space-x-reverse">
                    <Circle className="h-4 w-4 text-red-500 fill-red-500" />
                    <span>{isArabic ? 'مكتبة اجتماعات Huddle المسجلة' : 'Recorded Huddle Vault & AI Summaries'}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isArabic 
                      ? 'جميع التسجيلات تحتوي على تفريغ نصي تلقائي واستخراج النقاط المهمة وتقليل الضوضاء.'
                      : 'All recorded huddles include AI transcriptions, key takeaway summaries, and Krisp audio cleanup.'
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedRecordings.map(rec => (
                  <div key={rec.id} className="bg-[#14161B] p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition shadow-lg space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {rec.channelOrPerson}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">{rec.title}</h4>
                        <span className="text-xs text-gray-500">{rec.date} • {rec.duration}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rec.noiseReducedDb} Noise Cleaned
                      </span>
                    </div>

                    <div className="bg-[#1A1D21] p-3 rounded-xl border border-gray-800 text-xs text-gray-300">
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-purple-400 font-bold mb-1">
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>{isArabic ? 'ملخص DeskFlow AI:' : 'DeskFlow AI Summary:'}</span>
                      </div>
                      <p className="text-gray-300">{rec.summary}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => {
                            setSelectedVaultRec(rec);
                            setIsPlayingVaultRec(true);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer shadow"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>{isArabic ? 'استماع وتفريغ نصي' : 'Play & Transcript'}</span>
                        </button>
                      </div>

                      <button 
                        onClick={() => alert(isArabic ? 'جاري تحميل ملف التسجيل والصوت...' : 'Downloading recording media file...')}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
                        title={isArabic ? 'تحميل' : 'Download recording'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Player Modal for Vault item */}
              {selectedVaultRec && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#121317] border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                    <div className="flex items-start justify-between border-b border-gray-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{selectedVaultRec.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{selectedVaultRec.date} • {selectedVaultRec.duration}</p>
                      </div>
                      <button onClick={() => setSelectedVaultRec(null)} className="text-gray-400 hover:text-white p-1">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Simulated Waveform / Audio Player bar */}
                    <div className="bg-[#1A1D21] p-4 rounded-xl border border-gray-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <button 
                            onClick={() => setIsPlayingVaultRec(!isPlayingVaultRec)}
                            className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer shadow-lg"
                          >
                            {isPlayingVaultRec ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                          </button>
                          <div className="text-xs text-gray-300 font-mono">01:14 / {selectedVaultRec.duration}</div>
                        </div>

                        {/* Speed controller */}
                        <div className="flex items-center space-x-1 text-xs font-mono">
                          {[1, 1.25, 1.5, 2].map(speed => (
                            <button
                              key={speed}
                              onClick={() => setPlaybackSpeed(speed)}
                              className={`px-2 py-0.5 rounded cursor-pointer ${playbackSpeed === speed ? 'bg-purple-600 text-white font-bold' : 'bg-gray-800 text-gray-400'}`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-4 flex items-center space-x-1 rtl:space-x-reverse">
                        {Array.from({ length: 40 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 rounded transition-all ${i < 18 ? 'bg-purple-500 h-full' : 'bg-gray-800 h-1/2'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Transcript List */}
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar p-1">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5 rtl:space-x-reverse">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span>{isArabic ? 'التفريغ النصي المباشر (Transcript)' : 'Timestamped Transcript'}</span>
                      </h4>

                      <div className="space-y-2">
                        {selectedVaultRec.transcript.map((line, i) => (
                          <div key={i} className="bg-[#1A1D21] p-3 rounded-lg border border-gray-800 text-xs flex items-start space-x-3 rtl:space-x-reverse">
                            <span className="font-mono text-purple-400 text-[11px] shrink-0 mt-0.5">{line.time}</span>
                            <div>
                              <strong className="text-white block text-[11px]">{line.speaker}</strong>
                              <p className="text-gray-300 mt-0.5">{line.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Start a Huddle Modal */}
        {isNewHuddleModalOpen && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
              className="w-full max-w-[460px] bg-[#121317] border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] relative text-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{isArabic ? 'بدء اجتماع سريع' : 'Start a Huddle'}</h3>
                  <p className="text-sm text-gray-400 mt-1">{isArabic ? 'اختر شخصاً أو قناة لبدء الاجتماع' : 'Find a person or channel to huddle with'}</p>
                </div>
                <button 
                  onClick={() => setIsNewHuddleModalOpen(false)}
                  className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-gray-800/60 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative mt-5">
                <input
                  type="text"
                  placeholder={isArabic ? 'بحث بالاسم...' : 'Search by name'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#22D3EE]/30 focus:border-[#22D3EE] focus:ring-4 focus:ring-[#22D3EE]/15 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150"
                  autoFocus
                />
              </div>

              <div className="flex border-b border-gray-800 mt-5 shrink-0">
                <button
                  onClick={() => {
                    setActiveTab('people');
                    setSelectedId(null);
                    setSelectedType(null);
                  }}
                  className={`pb-2.5 text-sm font-semibold transition-all border-b-2 text-center px-4 cursor-pointer select-none ${
                    activeTab === 'people' 
                      ? 'border-[#22D3EE] text-white font-bold' 
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {isArabic ? 'الأعضاء' : 'People'}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('channels');
                    setSelectedId(null);
                    setSelectedType(null);
                  }}
                  className={`pb-2.5 text-sm font-semibold transition-all border-b-2 text-center px-4 cursor-pointer select-none ${
                    activeTab === 'channels' 
                      ? 'border-[#22D3EE] text-white font-bold' 
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {isArabic ? 'القنوات' : 'Channels'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 py-1 space-y-1.5 max-h-[290px] pr-1.5 custom-scrollbar">
                {activeTab === 'people' ? (
                  users.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase())).map(user => {
                    const isSelected = selectedId === user.id && selectedType === 'person';
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedId(user.id);
                          setSelectedType('person');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left rtl:text-right cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600/10 border-blue-500/40 text-white' 
                            : 'border-transparent hover:bg-[#1A1D21]/60 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            user={user}
                            className="w-10 h-10 rounded-full object-cover bg-gray-800 shrink-0 border border-gray-700"
                            alt={user.name}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate text-gray-100">{user.name}</div>
                            <div className="text-xs text-gray-500 truncate font-normal mt-0.5">{user.title || user.role}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  visibleChannels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(channel => {
                    const isSelected = selectedId === channel.id && selectedType === 'channel';
                    const ChannelIcon = channel.isPrivate ? Lock : Hash;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setSelectedId(channel.id);
                          setSelectedType('channel');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left rtl:text-right cursor-pointer ${
                          isSelected 
                            ? 'bg-[#22D3EE]/10 border-[#22D3EE]/40 text-white' 
                            : 'border-transparent hover:bg-[#1A1D21]/60 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 bg-[#1A1D21] rounded-xl flex items-center justify-center border border-gray-800 shrink-0 text-gray-400">
                            <ChannelIcon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate text-gray-100">#{channel.name}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-800 shrink-0">
                <button
                  onClick={() => setIsNewHuddleModalOpen(false)}
                  className="px-4 py-2 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-semibold border border-gray-800 transition cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  disabled={!selectedId}
                  onClick={handleStartModalHuddle}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  {isArabic ? 'بدء الاجتماع الان' : 'Start a Huddle'}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------- LIVE HUDDLE CALL INTERFACE (IN CALL) -------------------
  return (
    <div className="flex flex-col h-full w-full bg-[#1A1D21] text-gray-300 relative overflow-hidden select-none">
      
      {/* Floating Emoji Physics Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {activeReactions.map(r => (
          <div 
            key={r.id}
            className="absolute bottom-20 text-4xl animate-bounce transition-all duration-1000 transform -translate-y-48 opacity-90"
            style={{ left: `${r.left}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Header Bar matching Google Meet screenshot */}
      <div className="h-12 bg-[#1A1D21] px-2.5 sm:px-4 flex items-center justify-between text-xs text-gray-300 border-b border-gray-800/60 z-40 shrink-0">
        
        {/* Top Left: Time | Room Code [Door Icon] (i) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 rtl:space-x-reverse">
          <span className="font-semibold text-white tracking-wide text-[11px] sm:text-xs">{currentTimeStr}</span>
          <span className="hidden sm:inline text-gray-600 font-mono">|</span>
          <span className="font-mono text-gray-200 text-[11px] sm:text-xs font-medium truncate max-w-[90px] sm:max-w-none">{meetingCode}</span>
          
          {/* Orange Door / Room Exit Icon */}
          <div className="w-5 h-5 rounded bg-amber-600/20 text-amber-500 border border-amber-500/40 flex items-center justify-center shrink-0" title="Meeting Room">
            <LogOut className="h-3 w-3 rotate-180" />
          </div>

          {/* Info Icon (i) button */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-5 h-5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Meeting Details"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Top Right: Participants Badge + Whiteboard/Sparkles Pen Icon */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse">
          {/* Participant count button with stacked avatars & badge */}
          <button
            onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
            className="flex items-center space-x-1.5 bg-[#282B34] hover:bg-[#323642] px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold text-gray-200 transition border border-gray-700/60 cursor-pointer"
            title={`Participants (${Math.max(1, liveParticipantUsers.length)})`}
          >
            <div className="flex -space-x-1.5 rtl:space-x-reverse">
              {liveParticipantUsers.slice(0, 3).map(participant => (
                <span key={participant.id}><UserAvatar user={users.find(user => user.id === participant.id) || { id: participant.id, name: participant.name, email: '', role: 'Member', avatarUrl: participant.avatarUrl }} className="w-4 h-4 rounded-full border border-gray-900 object-cover" alt={participant.name} /></span>
              ))}
            </div>
            <span className="text-[11px] font-bold text-white">{Math.max(1, liveParticipantUsers.length)}</span>
          </button>
        </div>
      </div>

      {/* Main Call Stage Canvas */}
      <div className="flex-1 flex flex-col p-2 sm:p-4 relative overflow-hidden bg-[#1A1D21]">
        
        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-50 bg-red-950/95 border border-red-500/40 p-3 sm:p-4 rounded-xl shadow-2xl backdrop-blur-md text-white flex items-start justify-between">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-200">{errorMsg.title}</h4>
                <p className="text-xs text-red-300 mt-1">{errorMsg.text}</p>
              </div>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Outer Slate/Grayish Tile Stage Container */}
        <div className="flex-1 rounded-2xl sm:rounded-3xl bg-[#394346] border border-[#485356] relative overflow-hidden flex items-center justify-center p-2 sm:p-4 shadow-2xl">
          
          {/* Virtual Background backdrop if enabled */}
          {selectedVirtualBackground !== 'none' && (videoEnabled || screenSharing) && (
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-300"
              style={{ backgroundImage: `url(${getBackgroundUrl(selectedVirtualBackground)})` }}
            />
          )}

          {/* Remote participant tiles received over the WebRTC mesh */}
          {Object.entries(remoteStreams).map(([participantId, stream]) => {
            const participant = users.find(user => user.id === participantId);
            return (
              <div key={participantId} className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 w-36 h-24 sm:w-52 sm:h-32 rounded-xl overflow-hidden border border-emerald-400/50 bg-black shadow-2xl">
                <video ref={node => { if (node) node.srcObject = stream; }} autoPlay playsInline className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">{participant?.name || 'Participant'}</span>
              </div>
            );
          })}

          {/* Main Stage Video Feed (Camera or Screen Share) */}
          {(videoEnabled || screenSharing) ? (
            <>
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 rounded-2xl sm:rounded-3xl ${
                  (selectedVirtualBackground !== 'none' || selectedBlurEffect !== 'none') && !screenSharing 
                    ? 'opacity-0 pointer-events-none' 
                    : 'bg-black'
                }`}
                style={{
                  transform: (videoEnabled && !screenSharing) ? 'scaleX(-1)' : undefined,
                  filter: getColorGradeFilter(activeColorFilter),
                }}
              />
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 rounded-2xl sm:rounded-3xl ${
                  (selectedVirtualBackground !== 'none' || selectedBlurEffect !== 'none') && !screenSharing 
                    ? 'opacity-100' 
                    : 'opacity-0 pointer-events-none'
                }`}
                style={{
                  transform: (videoEnabled && !screenSharing) ? 'scaleX(-1)' : undefined,
                  filter: getColorGradeFilter(activeColorFilter),
                }}
              />
            </>
          ) : (
            /* Main Participant Stage Card (Mohammed Dwidar avatar & name tag) */
            <div className="flex flex-col items-center justify-center select-none animate-fade-in relative z-10">
              <div className="relative mb-3">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300" 
                  alt="Mohammed Dwidar"
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-2 border-white/20 shadow-2xl object-cover bg-gray-800"
                />
                {micLevel > 15 && (
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
                )}
              </div>
            </div>
          )}

          {/* Bottom-Left Name Tag on Main Stage Tile */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20">
            <span className="text-[11px] sm:text-xs md:text-sm text-white font-medium px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-md tracking-wide">
              Mohammed Dwidar
            </span>
          </div>

          {/* Bottom-Right Self View Picture-in-Picture (PiP) Tile */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-28 h-20 sm:w-40 sm:h-28 md:w-60 md:h-36 rounded-xl sm:rounded-2xl bg-[#3f4534] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center z-20 group">
            {videoEnabled ? (
              <video 
                ref={pipVideoRef}
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" 
                alt="abdallah mohamed"
                className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border border-white/20 object-cover shadow-lg"
              />
            )}
            {/* Bottom-Left Name Label inside Self View PiP Box */}
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-30">
              <span className="text-[9px] sm:text-[11px] text-white font-medium px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-md truncate max-w-[80px] sm:max-w-none block">
                abdallah mohamed
              </span>
            </div>
          </div>

        </div>

        {/* Closed Captions Subtitles Overlay */}
        {showClosedCaptions && (
          <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 bg-[#121418]/90 backdrop-blur-md border border-blue-500/40 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-medium text-white shadow-2xl flex items-center space-x-2 sm:space-x-3 z-30 animate-fade-in max-w-[90%] sm:max-w-xl">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
            <span className="text-blue-400 font-bold shrink-0">{currentUser?.name || "abdallah mohamed"}:</span>
            <span className="truncate text-gray-200 font-sans">"{liveCaptionText}"</span>
          </div>
        )}

      </div>

      {/* Floating Bottom Controls Dock (Google Meet exact layout) */}
      <div className="py-2 sm:py-3 px-2 sm:px-4 flex items-center justify-center relative z-40 bg-[#1A1D21] w-full">
        
        <div className="bg-[#1f2124] rounded-full px-2 sm:px-4 py-1.5 sm:py-2 flex items-center space-x-1.5 sm:space-x-2.5 md:space-x-3 shadow-2xl border border-gray-800/80 max-w-full overflow-x-auto no-scrollbar">
          
          {/* 1. Device options / 3 dots overflow trigger */}
          <button 
            onClick={() => setShowMicDropdown(!showMicDropdown)}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4e52] text-gray-200 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Audio & Device Settings"
          >
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          {/* 2. Microphone Mute / Unmute Button */}
          <button 
            onClick={toggleHuddleMic}
            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              micEnabled ? 'bg-[#3c4043] hover:bg-[#4a4e52] text-white' : 'bg-[#ea4335] text-white hover:bg-[#d93025]'
            }`}
            title={micEnabled ? "Mute Mic" : "Unmute Mic"}
          >
            {micEnabled ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {/* 3. Split Camera Button (matching screenshot soft pink when off) */}
          <div className="flex items-center rounded-full overflow-hidden shrink-0">
            <button
              onClick={() => setShowCameraDropdown(!showCameraDropdown)}
              className="h-8 sm:h-10 md:h-11 px-1.5 sm:px-2 bg-[#3c4043] hover:bg-[#4a4e52] text-gray-300 flex items-center justify-center transition cursor-pointer"
              title="Camera Options"
            >
              <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <button 
              onClick={toggleHuddleVideo}
              className={`h-8 sm:h-10 md:h-11 px-2.5 sm:px-3 md:px-3.5 flex items-center justify-center transition cursor-pointer ${
                videoEnabled 
                  ? 'bg-[#3c4043] hover:bg-[#4a4e52] text-white' 
                  : 'bg-[#fce8e6] text-[#c5221f] font-bold hover:bg-[#f8d7d4]'
              }`}
              title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
            >
              {videoEnabled ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5 text-[#c5221f]" />}
            </button>
          </div>

          {/* 4. Screen Share Button */}
          <button 
            onClick={toggleHuddleScreenShare}
            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              screenSharing ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
            }`}
            title={screenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Minimize Button */}
          <button 
            onClick={() => setHuddleMinimized(true)}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4e52] text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title="Minimize Huddle"
          >
            <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* 5. Emoji Reaction Button */}
          <div className="relative group shrink-0">
            <button 
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4e52] text-white flex items-center justify-center transition cursor-pointer"
              title="Send Reaction"
            >
              <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center space-x-1 bg-[#121317] border border-gray-700 p-1.5 sm:p-2 rounded-2xl shadow-2xl z-50">
              {['👏', '🔥', '❤️', '💡', '😂', '🎉', '✨', '👍'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => triggerEmojiReaction(emoji)}
                  className="text-base sm:text-lg hover:scale-125 transition-transform p-0.5 sm:p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Subtitles Button (CC) */}
          <button 
            onClick={() => setShowClosedCaptions(!showClosedCaptions)}
            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              showClosedCaptions ? 'bg-blue-600 text-white font-bold' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
            }`}
            title="Closed Captions (CC)"
          >
            <span className="font-mono text-[10px] sm:text-xs font-black">CC</span>
          </button>

          {/* 7. Raise Hand Button */}
          <button 
            onClick={toggleHuddleHand}
            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              handRaised ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
            }`}
            title="Raise Hand"
          >
            <Hand className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* 8. More Options (3 Vertical Dots) */}
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4e52] text-white flex items-center justify-center transition cursor-pointer"
              title="More Options"
            >
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {showMoreMenu && (
              <div className="absolute bottom-12 sm:bottom-14 right-0 w-56 sm:w-64 bg-[#121418] border border-gray-700 rounded-2xl shadow-2xl z-50 py-2 text-xs space-y-1">
                <button
                  onClick={() => { setLayoutMode(layoutMode === 'grid' ? 'spotlight' : 'grid'); setShowMoreMenu(false); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-gray-800 text-gray-200 flex items-center space-x-2.5 cursor-pointer"
                >
                  <Grid className="h-4 w-4 text-gray-400" />
                  <span>Layout: {layoutMode === 'grid' ? 'Spotlight View' : 'Grid View'}</span>
                </button>
                <button
                  onClick={() => { toggleHuddleRecording(); setShowMoreMenu(false); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-gray-800 text-gray-200 flex items-center space-x-2.5 cursor-pointer"
                >
                  <Circle className={`h-4 w-4 ${isRecording ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                  <span>{isRecording ? 'Stop Recording' : 'Record Meeting'}</span>
                </button>
                <button
                  onClick={() => { setShowEffectsPanel(true); setShowMoreMenu(false); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-gray-800 text-cyan-400 flex items-center space-x-2.5 cursor-pointer font-medium"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>AI Krisp & Backdrops</span>
                </button>
                <button
                  onClick={() => { setShowAudioSettingsModal(true); setShowMoreMenu(false); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-gray-800 text-gray-200 flex items-center space-x-2.5 cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  <span>Audio & Video Device Settings</span>
                </button>
              </div>
            )}
          </div>

          {/* 9. End Call Red Pill Button */}
          <button 
            onClick={endGlobalHuddle}
            className="w-10 h-8 sm:w-14 sm:h-10 md:w-16 md:h-11 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white flex items-center justify-center transition cursor-pointer shadow-lg shrink-0"
            title="End Call"
          >
            <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

        </div>

        {/* Far Right Corner Buttons: Chat & Whiteboard (Hidden on small screens to avoid overlapping controls) */}
        <div className="hidden lg:flex absolute right-4 items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className="w-10 h-10 rounded-full bg-[#1f2124] hover:bg-[#282b34] text-gray-300 hover:text-white border border-gray-800 flex items-center justify-center transition cursor-pointer"
            title="Chat / Workspace Notes"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowEffectsPanel(true)}
            className="w-10 h-10 rounded-full bg-[#1f2124] hover:bg-[#282b34] text-cyan-400 hover:text-cyan-300 border border-gray-800 flex items-center justify-center transition cursor-pointer"
            title="Whiteboard / AI Effects"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* Meeting Details Info Modal (Triggered by (i) button) */}
      {showInfoModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181A1F] border border-gray-800 w-full max-w-sm rounded-2xl p-5 text-gray-200 shadow-2xl space-y-4 animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Info className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Meeting Details</h3>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Joining Info</p>
                <div className="bg-[#111215] border border-gray-800 p-2.5 rounded-xl font-mono text-[11px] text-blue-400 break-all flex items-center justify-between">
                  <span>{callRoomUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(callRoomUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-1 text-gray-400 hover:text-white transition cursor-pointer shrink-0 ml-1"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#111215] rounded-xl border border-gray-800">
                <span className="text-gray-400 font-medium">Meeting Code:</span>
                <span className="font-mono font-bold text-white tracking-widest">{meetingCode}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#111215] rounded-xl border border-gray-800">
                <span className="text-gray-400 font-medium">Host:</span>
                <span className="font-bold text-emerald-400">Mohammed Dwidar</span>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Drawer (Triggered by Participants badge click) */}
      {showParticipantsDrawer && (
        <div className="absolute inset-y-0 right-0 w-80 bg-[#14161A] border-l border-gray-800 z-50 p-4 flex flex-col shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">People ({Math.max(1, liveParticipantUsers.length)})</h3>
            </div>
            <button onClick={() => setShowParticipantsDrawer(false)} className="text-gray-400 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {liveParticipantUsers.map(participant => (
              <div key={participant.id} className="p-2.5 bg-[#1C1E23] rounded-xl border border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                  <UserAvatar user={users.find(user => user.id === participant.id) || { id: participant.id, name: participant.name, email: '', role: 'Member', avatarUrl: participant.avatarUrl }} className="w-8 h-8 rounded-full object-cover" alt={participant.name} />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{participant.name} {participant.isLocal ? '(You)' : ''}</h4>
                    <span className="text-[10px] text-gray-400">{participant.isLocal ? (connectionState === 'connected' ? 'Connected' : 'Connecting…') : 'Live participant'}</span>
                  </div>
                </div>
                {participant.isLocal && (micEnabled ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-red-400" />)}
              </div>
            ))}
            {liveParticipantUsers.length <= 1 && <p className="text-xs text-gray-500 text-center py-4">Share the call link to invite teammates.</p>}
          </div>
          <div className="border-t border-gray-800 pt-3 mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <input value={inviteSearch} onChange={event => setInviteSearch(event.target.value)} placeholder="Find people to invite" className="min-w-0 flex-1 bg-[#1C1E23] border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500" />
              <button onClick={() => { navigator.clipboard.writeText(callRoomUrl); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 1800); }} className="shrink-0 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white" title="Copy invite link">{inviteCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}</button>
            </div>
            {inviteSearch && inviteableUsers.slice(0, 4).map(user => (
              <button key={user.id} onClick={() => { navigator.clipboard.writeText(callRoomUrl); setInviteSearch(''); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 1800); }} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 text-left">
                <UserAvatar user={user} className="w-6 h-6 rounded-full" alt={user.name} />
                <span className="text-xs text-gray-200 truncate">Invite {user.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shared Canvas Notes Drawer */}
      {showNotesDrawer && (
        <div className="w-[320px] h-full bg-[#121317] border-l border-gray-800 flex flex-col shrink-0 p-4 space-y-3 z-35 animate-slide-in">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 rtl:space-x-reverse">
              <FileText className="h-4 w-4 text-purple-400" />
              <span>{isArabic ? 'ملاحظات وأجندة الاجتماع' : 'Huddle Collaborative Canvas'}</span>
            </h4>
            <button onClick={() => setShowNotesDrawer(false)} className="text-gray-400 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={huddleNotes}
            onChange={(e) => setHuddleNotes(e.target.value)}
            placeholder={isArabic ? 'اكتب ملاحظات النقاش هنا...' : 'Type huddle action items and agenda...'}
            className="flex-1 w-full p-3 bg-[#1A1D21] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono resize-none"
          />
        </div>
      )}

      {/* Studio Noise Cancellation & Virtual Background FX Panel */}
      {showEffectsPanel && (
        <div className="w-[360px] h-full bg-[#121317] border-l border-gray-800/80 flex flex-col shrink-0 text-gray-300 relative z-35 select-none animate-slide-in">
          <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#22D3EE] animate-pulse" />
              <span className="font-bold text-white text-[15px]">{isArabic ? 'إعدادات الصوت والخلفيات' : 'Studio FX & Audio Controls'}</span>
            </div>
            <button 
              onClick={() => setShowEffectsPanel(false)}
              className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex border-b border-gray-800 bg-[#17191E]/50 shrink-0">
            <button
              onClick={() => setEffectsTab('audio')}
              className={`flex-1 py-3 text-xs font-semibold select-none text-center cursor-pointer border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                effectsTab === 'audio' 
                  ? 'border-[#22D3EE] text-white bg-gray-800/10 font-bold' 
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Volume2 className="h-4 w-4" />
              <span>{isArabic ? 'عزل وإلغاء الضوضاء' : 'Audio Isolation'}</span>
            </button>
            <button
              onClick={() => setEffectsTab('video')}
              className={`flex-1 py-3 text-xs font-semibold select-none text-center cursor-pointer border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                effectsTab === 'video' 
                  ? 'border-[#22D3EE] text-white bg-gray-800/10 font-bold' 
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Image className="h-4 w-4" />
              <span>{isArabic ? 'خلفيات الفيديو' : 'Video Backdrops'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {effectsTab === 'audio' ? (
              <div className="space-y-6">
                
                {/* Real-time Level Meter */}
                <div className="bg-[#1A1D21] border border-gray-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4.5 w-4.5 text-[#22D3EE]" />
                      <span className="text-xs font-semibold text-gray-200">{isArabic ? 'مستوى التقاط الميكروفون' : 'Microphone Input Level'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase bg-[#121317] px-1.5 py-0.5 rounded border border-gray-800">
                      {micEnabled ? 'Live' : 'Muted'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#121317] p-2 rounded-lg border border-gray-800 h-9">
                    {Array.from({ length: 14 }).map((_, idx) => {
                      const threshold = (idx / 14) * 100;
                      const isActive = micLevel > threshold;
                      let barColor = "bg-gray-800/50";
                      if (isActive) {
                        if (idx < 9) barColor = "bg-[#22D3EE] shadow-[0_0_8px_rgba(34,211,238,0.4)]";
                        else if (idx < 12) barColor = "bg-yellow-500";
                        else barColor = "bg-red-500";
                      }
                      return (
                        <div key={idx} className={`flex-1 h-full rounded transition-all duration-75 ${barColor}`} />
                      );
                    })}
                  </div>
                </div>

                {/* AI Krisp Noise Suppressor Toggle */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{isArabic ? 'قواعد الفلترة وتقليل الضجيج' : 'Acoustic Isolation Rules'}</h4>

                  <div className="flex items-start justify-between bg-[#1A1D21] border border-gray-800 p-3.5 rounded-xl">
                    <div className="space-y-1 pr-3 rtl:pl-3 rtl:pr-0">
                      <div className="flex items-center gap-1.5">
                        <Wand2 className="h-4 w-4 text-[#22D3EE]" />
                        <span className="text-xs font-semibold text-gray-100">{isArabic ? 'تقنية Krisp الذكية لإلغاء الضوضاء' : 'AI Krisp Noise Suppression'}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-500 leading-relaxed">
                        {isArabic 
                          ? 'تصفية الأصوات المحيطة وضوضاء لوحة المفاتيح وحركة المرور فورياً.'
                          : 'Filters ambient room noise, typing clicks, and fan hums in real-time.'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => setAiKrispNoiseCancel(!aiKrispNoiseCancel)}
                      className={`w-10 h-6 shrink-0 rounded-full transition-all relative cursor-pointer ${aiKrispNoiseCancel ? 'bg-[#22D3EE]' : 'bg-gray-800'}`}
                    >
                      <div className={`w-4.5 h-4.5 bg-slate-950 rounded-full absolute top-[3.75px] transition-all ${aiKrispNoiseCancel ? 'left-[21px] rtl:right-[21px]' : 'left-1 rtl:right-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between bg-[#1A1D21] border border-gray-800 p-3.5 rounded-xl">
                    <div className="space-y-1 pr-3 rtl:pl-3 rtl:pr-0">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-semibold text-gray-100">{isArabic ? 'مانع الصدى والارتجاع (Echo Cancel)' : 'Hardware Echo Cancellation'}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-500 leading-relaxed">
                        {isArabic ? 'يمنع صدى الصوت الناتج عن مكبرات الصوت.' : 'Eliminates acoustic loop feedback from speakers.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setEchoCancellationActive(!echoCancellationActive)}
                      className={`w-10 h-6 shrink-0 rounded-full transition-all relative cursor-pointer ${echoCancellationActive ? 'bg-purple-500' : 'bg-gray-800'}`}
                    >
                      <div className={`w-4.5 h-4.5 bg-slate-950 rounded-full absolute top-[3.75px] transition-all ${echoCancellationActive ? 'left-[21px] rtl:right-[21px]' : 'left-1 rtl:right-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between bg-[#1A1D21] border border-gray-800 p-3.5 rounded-xl">
                    <div className="space-y-1 pr-3 rtl:pl-3 rtl:pr-0">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-gray-100">{isArabic ? 'الاستماع لصوتي (Monitor Mic)' : 'Monitor My Voice'}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-500 leading-relaxed">
                        {isArabic ? 'سماع صوتك للتأكد من جودته أثناء الحديث.' : 'Loops mic output so you hear what others hear.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setHearMyself(!hearMyself)}
                      className={`w-10 h-6 shrink-0 rounded-full transition-all relative cursor-pointer ${hearMyself ? 'bg-emerald-400' : 'bg-gray-800'}`}
                    >
                      <div className={`w-4.5 h-4.5 bg-slate-950 rounded-full absolute top-[3.75px] transition-all ${hearMyself ? 'left-[21px] rtl:right-[21px]' : 'left-1 rtl:right-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Background Blur selections */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{isArabic ? 'مستوى ضبابية الخلفية' : 'Background Blur'}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: isArabic ? 'بدون' : 'None', desc: 'Raw feed' },
                      { id: 'subtle', label: isArabic ? 'خفيف' : 'Subtle', desc: 'Soft edges' },
                      { id: 'vignette', label: isArabic ? 'قوي' : 'Strong', desc: 'Deep blur' },
                    ].map(blurOpt => (
                      <button
                        key={blurOpt.id}
                        onClick={() => {
                          setSelectedBlurEffect(blurOpt.id as any);
                          setSelectedVirtualBackground('none');
                        }}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                          selectedBlurEffect === blurOpt.id && selectedVirtualBackground === 'none'
                            ? 'bg-[#22D3EE]/15 border-[#22D3EE] text-white font-bold'
                            : 'bg-[#1A1D21] border-gray-800 hover:border-gray-700 text-gray-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{blurOpt.label}</span>
                        <span className="text-[9px] text-gray-400 mt-0.5">{blurOpt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Virtual Background Rooms */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{isArabic ? 'خلفيات افتراضية HD' : 'HD Virtual Backdrops'}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'none', name: isArabic ? 'الغرفة الحقيقية' : 'Raw Default', desc: 'Real room bg', img: null },
                      { id: 'office', name: isArabic ? 'مكتب زجاجي' : 'Glass Office', desc: 'Modern workplace', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=150&q=80' },
                      { id: 'living', name: isArabic ? 'استوديو مريح' : 'Cozy Studio', desc: 'Warm living area', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80' },
                      { id: 'cyber', name: isArabic ? 'سايبر نيون' : 'Cyber Neon', desc: 'Gaming grid lounge', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
                      { id: 'beach', name: isArabic ? 'شاطئ الغروب' : 'Sunset Beach', desc: 'Tropical coast', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=150&q=80' },
                      { id: 'fluid', name: isArabic ? 'ألوان مجردة' : 'Pastel Gradient', desc: 'Fluid shapes', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' },
                    ].map(bgItem => {
                      const isSelected = selectedVirtualBackground === bgItem.id;
                      return (
                        <div 
                          key={bgItem.id}
                          onClick={() => {
                            setSelectedVirtualBackground(bgItem.id);
                            setSelectedBlurEffect('none');
                          }}
                          className={`group relative h-20 rounded-xl overflow-hidden cursor-pointer border shadow-md transition-all ${
                            isSelected ? 'border-[#22D3EE] scale-[1.02]' : 'border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {bgItem.img ? (
                            <img 
                              src={bgItem.img} 
                              alt={bgItem.name} 
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[#1A1D21] opacity-75" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121317]/95 via-transparent to-transparent flex flex-col justify-end p-2 z-10">
                            <span className="text-[10px] font-bold text-white truncate">{bgItem.name}</span>
                            <span className="text-[8px] text-gray-400 truncate">{bgItem.desc}</span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 h-4 w-4 rounded-full bg-[#22D3EE] text-slate-950 flex items-center justify-center shadow-md z-20">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Color grade filters */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{isArabic ? 'مرشحات الألوان السينمائية' : 'Color Filters'}</h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'none', label: isArabic ? 'الطبيعي (Default)' : 'Standard Feed' },
                      { id: 'noir', label: isArabic ? 'أبيض وأسود (Noir)' : 'Grayscale Film Noir' },
                      { id: 'warm', label: isArabic ? 'دافئ (Warm Amber)' : 'Warm Sunset Amber' },
                      { id: 'neon', label: isArabic ? 'نيون سايبر (Cyberpunk)' : 'Cyberpunk Cyan & Violet' },
                      { id: 'vintage', label: isArabic ? 'كوداك كلاسيكي (Vintage)' : 'Sophisticated Kodak Vintage' },
                    ].map(colorFilt => {
                      const isSelected = activeColorFilter === colorFilt.id;
                      return (
                        <button
                          key={colorFilt.id}
                          onClick={() => setActiveColorFilter(colorFilt.id)}
                          className={`w-full text-left rtl:text-right px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#22D3EE]/15 border-[#22D3EE] text-white font-bold' 
                              : 'bg-[#1A1D21] border-transparent hover:bg-gray-800 text-gray-300'
                          }`}
                        >
                          <span>{colorFilt.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-[#22D3EE] stroke-[3.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio & Video Device Settings Modal */}
      {showAudioSettingsModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#14161A] border border-gray-800 w-full max-w-md rounded-2xl p-6 text-gray-200 shadow-2xl relative space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Settings className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  {isArabic ? 'إعدادات الأجهزة والصوت' : 'Audio & Video Device Settings'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAudioSettingsModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Input device */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1.5">
                <Mic className="h-3.5 w-3.5 text-blue-400" />
                <span>{isArabic ? 'جهاز إدخال الميكروفون' : 'Microphone Input'}</span>
              </label>
              <select
                value={selectedMicrophone}
                onChange={(e) => setSelectedMicrophone(e.target.value)}
                className="w-full bg-[#1C1E23] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="MacBook Pro Microphone (Built-in)">MacBook Pro Microphone (Built-in)</option>
                <option value="AirPods Pro (Bluetooth Audio)">AirPods Pro (Bluetooth Audio)</option>
                <option value="Krisp Virtual Microphone (Noise Canceled)">Krisp Virtual Microphone (Noise Canceled)</option>
                <option value="Studio USB Condenser Microphone">Studio USB Condenser Microphone</option>
              </select>
            </div>

            {/* Output device */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1.5">
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isArabic ? 'جهاز إخراج الصوت' : 'Speaker Output'}</span>
              </label>
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className="w-full bg-[#1C1E23] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="MacBook Pro Speakers (Built-in)">MacBook Pro Speakers (Built-in)</option>
                <option value="AirPods Pro (Bluetooth Audio)">AirPods Pro (Bluetooth Audio)</option>
                <option value="External Headphones (3.5mm Jack)">External Headphones (3.5mm Jack)</option>
                <option value="Display Audio (USB-C Monitor)">Display Audio (USB-C Monitor)</option>
              </select>
            </div>

            {/* Input Meter & Test Audio */}
            <div className="p-3 bg-[#1C1E23] rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Mic Input Test Meter</span>
                <span className="text-emerald-400 font-mono font-bold">{micEnabled ? `${micLevel}%` : 'Muted'}</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${micEnabled ? micLevel : 0}%` }}
                />
              </div>
            </div>

            {/* Krisp Noise Suppression toggle */}
            <div className="flex items-center justify-between p-3 bg-[#1C1E23] rounded-xl border border-gray-800">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Krisp AI Noise Cancellation</h4>
                  <p className="text-[10px] text-gray-400">Filters out background noise (-26 dB)</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiKrispNoiseCancel}
                onChange={(e) => setAiKrispNoiseCancel(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAudioSettingsModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                {isArabic ? 'حفظ وإغلاق' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
