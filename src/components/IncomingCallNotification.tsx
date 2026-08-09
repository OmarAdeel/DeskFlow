import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useWorkspace } from '../context';
import { supabase } from '../lib/supabase';
import { UserAvatar } from './UserAvatar';

type IncomingCall = {
  from: string;
  fromName?: string;
  fromAvatarUrl?: string;
  roomCode: string;
  video: boolean;
};

type CallResponse = 'rejected' | 'timeout';

export function IncomingCallNotification() {
  const { users, currentUser, activeHuddle, startGlobalHuddle, endGlobalHuddle } = useWorkspace();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const pendingRoomRef = useRef<string | null>(null);
  const handledRoomsRef = useRef<Set<string>>(new Set());
  const incomingCallRef = useRef<IncomingCall | null>(null);
  const activeHuddleRef = useRef(activeHuddle);
  const endGlobalHuddleRef = useRef(endGlobalHuddle);
  const ringtoneContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);
  const ringtoneOscillatorsRef = useRef<Set<OscillatorNode>>(new Set());

  incomingCallRef.current = incomingCall;
  activeHuddleRef.current = activeHuddle;
  endGlobalHuddleRef.current = endGlobalHuddle;

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current !== null) {
      window.clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    ringtoneOscillatorsRef.current.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may already have ended.
      }
      oscillator.disconnect();
    });
    ringtoneOscillatorsRef.current.clear();
    const context = ringtoneContextRef.current;
    ringtoneContextRef.current = null;
    if (context) void context.close().catch(() => undefined);
  };

  // A short, playful three-note "Skippy" chime instead of a plain beep.
  const playSkippyRingtone = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = ringtoneContextRef.current || new AudioContextClass();
      ringtoneContextRef.current = context;
      if (context.state === 'suspended') void context.resume().catch(() => undefined);

      const notes = [
        { frequency: 784, start: 0, duration: 0.16 },
        { frequency: 988, start: 0.13, duration: 0.16 },
        { frequency: 1175, start: 0.26, duration: 0.24 }
      ];
      notes.forEach(note => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + note.start;
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(note.frequency, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.11, startAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        ringtoneOscillatorsRef.current.add(oscillator);
        oscillator.addEventListener('ended', () => {
          ringtoneOscillatorsRef.current.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        }, { once: true });
        oscillator.start(startAt);
        oscillator.stop(startAt + note.duration + 0.03);
      });
    } catch {
      // Browser autoplay policies may block sound; the call popup remains usable.
    }
  };

  const startRingtone = () => {
    stopRingtone();
    playSkippyRingtone();
    ringtoneIntervalRef.current = window.setInterval(playSkippyRingtone, 1800);
  };

  const sendResponse = (toUserId: string, roomCode: string, response: CallResponse) => {
    const responseChannel = supabase.channel(`deskflow-call-response-${toUserId}`, {
      config: { broadcast: { self: false } }
    });
    responseChannel.subscribe(status => {
      if (status !== 'SUBSCRIBED') return;
      void responseChannel.send({
        type: 'broadcast',
        event: 'response',
        payload: { from: currentUser?.id, roomCode, response }
      });
      window.setTimeout(() => { void supabase.removeChannel(responseChannel); }, 1500);
    });
  };

  const clearIncomingCall = () => {
    pendingRoomRef.current = null;
    incomingCallRef.current = null;
    setIncomingCall(null);
    stopRingtone();
  };

  const answerCall = () => {
    const call = incomingCallRef.current;
    if (!call) return;
    handledRoomsRef.current.add(call.roomCode);
    clearIncomingCall();
    startGlobalHuddle(call.from, 'person', call.roomCode, call.video);
    window.dispatchEvent(new CustomEvent('workspace-navigate', { detail: { view: 'huddles' } }));
  };

  const rejectCall = () => {
    const call = incomingCallRef.current;
    if (!call) return;
    handledRoomsRef.current.add(call.roomCode);
    clearIncomingCall();
    sendResponse(call.from, call.roomCode, 'rejected');
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    const inviteChannel = supabase.channel(`deskflow-call-invite-${currentUser.id}`, {
      config: { broadcast: { self: false } }
    });
    inviteChannel.on('broadcast', { event: 'invite' }, ({ payload }: { payload?: IncomingCall }) => {
      if (!payload?.from || !payload.roomCode || payload.from === currentUser.id) return;
      if (activeHuddleRef.current.inCall) return;
      if (pendingRoomRef.current === payload.roomCode || handledRoomsRef.current.has(payload.roomCode)) return;
      pendingRoomRef.current = payload.roomCode;
      setIncomingCall({
        from: payload.from,
        fromName: payload.fromName,
        fromAvatarUrl: payload.fromAvatarUrl,
        roomCode: payload.roomCode,
        video: Boolean(payload.video)
      });
    }).subscribe();
    return () => { void supabase.removeChannel(inviteChannel); };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const responseChannel = supabase.channel(`deskflow-call-response-${currentUser.id}`, {
      config: { broadcast: { self: false } }
    });
    responseChannel.on('broadcast', { event: 'response' }, ({ payload }: { payload?: { roomCode?: string; response?: string } }) => {
      const active = activeHuddleRef.current;
      if (!payload?.roomCode || payload.roomCode !== active.code || !active.inCall) return;
      if (payload.response === 'rejected' || payload.response === 'timeout') {
        endGlobalHuddleRef.current();
      }
    }).subscribe();
    return () => { void supabase.removeChannel(responseChannel); };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!incomingCall) return;
    startRingtone();
    const timeout = window.setTimeout(() => {
      const call = incomingCallRef.current;
      if (!call) return;
      handledRoomsRef.current.add(call.roomCode);
      clearIncomingCall();
      sendResponse(call.from, call.roomCode, 'timeout');
    }, 45000);
    return () => {
      window.clearTimeout(timeout);
      stopRingtone();
    };
  }, [incomingCall]);

  useEffect(() => () => stopRingtone(), []);

  if (!incomingCall) return null;

  const caller = users.find(user => user.id === incomingCall.from);
  const callerName = caller?.name || incomingCall.fromName || 'Unknown caller';
  const callerUser = caller || { name: callerName, avatarUrl: incomingCall.fromAvatarUrl };

  return (
    <aside
      className="fixed right-4 top-4 z-[200] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-blue-400/30 bg-[#121317]/95 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur-xl animate-fade-in"
      role="alertdialog"
      aria-label={`Incoming ${incomingCall.video ? 'video' : 'voice'} call from ${callerName}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <UserAvatar
            user={callerUser}
            fallbackName={callerName}
            className="h-12 w-12 rounded-full border-2 border-blue-400 object-cover"
            alt={callerName}
          />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#121317] bg-emerald-500">
            {incomingCall.video ? <Video className="h-3 w-3 text-white" /> : <Phone className="h-3 w-3 text-white" />}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Incoming call</div>
          <div className="mt-1 truncate text-base font-bold">{callerName}</div>
          <div className="mt-0.5 text-xs text-gray-400">
            {incomingCall.video ? 'Incoming video call' : 'Incoming voice call'}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={rejectCall}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
        >
          <PhoneOff className="h-4 w-4" />
          Reject
        </button>
        <button
          type="button"
          onClick={answerCall}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500"
        >
          {incomingCall.video ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          Answer
        </button>
      </div>
    </aside>
  );
}
