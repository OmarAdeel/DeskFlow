import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type CallSignal = {
  type: 'join' | 'leave' | 'offer' | 'answer' | 'ice' | 'media';
  from: string;
  to?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  mode?: 'audio' | 'video';
};

export interface CallParticipant {
  id: string;
  joinedAt: number;
  mode?: 'audio' | 'video';
}

interface UseWebRTCCallOptions {
  roomId: string | null;
  userId: string | null;
  mode: 'audio' | 'video';
  enabled: boolean;
}

const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

// Metered TURN REST endpoint. Credentials rotate, so we fetch fresh ICE servers
// at runtime and fall back to the verified static list below if the fetch fails.
const turnApiUrl = (import.meta.env.VITE_TURN_API_URL as string | undefined)
  || 'https://deskflow.metered.live/api/v1/turn/credentials?apiKey=fb2efde53df7659a5a0d8dac52ddfc8cbb1a';

const staticIceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'turn:global.relay.metered.ca:80', username: 'a53cc33a1ee36cdad1ad9831', credential: 'DtENpV1nUXPtgBBb' },
  { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: 'a53cc33a1ee36cdad1ad9831', credential: 'DtENpV1nUXPtgBBb' },
  { urls: 'turn:global.relay.metered.ca:443', username: 'a53cc33a1ee36cdad1ad9831', credential: 'DtENpV1nUXPtgBBb' },
  { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'a53cc33a1ee36cdad1ad9831', credential: 'DtENpV1nUXPtgBBb' },
  ...(turnUrl ? [{ urls: turnUrl, username: turnUsername, credential: turnCredential }] : [])
];

// Mutable so the dynamic fetch can swap in fresh, rotated credentials.
let currentIceServers: RTCIceServer[] = staticIceServers;

const rtcConfig = (): RTCConfiguration => ({ iceServers: currentIceServers });

// Fire-and-forget refresh of TURN credentials. Runs once on module load and is
// re-triggered before each call so long-lived sessions keep valid credentials.
let turnFetchPromise: Promise<void> | null = null;
function refreshIceServers(): Promise<void> {
  if (turnFetchPromise) return turnFetchPromise;
  turnFetchPromise = fetch(turnApiUrl)
    .then(res => (res.ok ? res.json() : Promise.reject(new Error(`TURN API ${res.status}`))))
    .then((servers: RTCIceServer[]) => {
      if (Array.isArray(servers) && servers.length > 0) currentIceServers = servers;
    })
    .catch(err => {
      console.warn('TURN credential fetch failed, using static fallback', err);
    })
    .finally(() => {
      turnFetchPromise = null;
    });
  return turnFetchPromise;
}

// Kick off an initial refresh at load so credentials are warm before the first call.
void refreshIceServers();

export function useWebRTCCall({ roomId, userId, mode, enabled }: UseWebRTCCallOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingIceRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef(roomId);
  const userIdRef = useRef(userId);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const sendSignal = useCallback((signal: Omit<CallSignal, 'from'>) => {
    const channel = channelRef.current;
    const from = userIdRef.current;
    if (!channel || !from) return;
    void channel.send({ type: 'broadcast', event: 'signal', payload: { ...signal, from } });
  }, []);

  const removePeer = useCallback((peerId: string) => {
    peersRef.current[peerId]?.close();
    delete peersRef.current[peerId];
    setRemoteStreams(previous => {
      const next = { ...previous };
      delete next[peerId];
      return next;
    });
    setParticipants(previous => previous.filter(participant => participant.id !== peerId));
  }, []);

  const createPeer = useCallback((peerId: string, initiator: boolean) => {
    const existing = peersRef.current[peerId];
    if (existing) return existing;
    const peer = new RTCPeerConnection(rtcConfig());
    peersRef.current[peerId] = peer;
    localStreamRef.current?.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current as MediaStream));
    peer.onicecandidate = event => {
      if (event.candidate) sendSignal({ type: 'ice', to: peerId, candidate: event.candidate.toJSON() });
    };
    peer.ontrack = event => {
      const stream = event.streams[0];
      if (!stream) return;
      setRemoteStreams(previous => ({ ...previous, [peerId]: stream }));
      setParticipants(previous => previous.some(item => item.id === peerId) ? previous : [...previous, { id: peerId, joinedAt: Date.now(), mode: modeRef.current }]);
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setConnectionState('connected');
        setError(null);
      }
      if (peer.connectionState === 'failed') {
        setConnectionState('failed');
        setError('The call could not establish a media connection. Please try again.');
        removePeer(peerId);
      } else if (['closed', 'disconnected'].includes(peer.connectionState)) {
        removePeer(peerId);
      }
    };
    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'failed') {
        // Force an ICE restart before tearing the peer down; helps recover on
        // flaky networks or when the first relay path fails to negotiate.
        try { peer.restartIce(); } catch { /* not supported */ }
      }
    };
    if (initiator) {
      void peer.createOffer().then(offer => peer.setLocalDescription(offer)).then(() => {
        if (peer.localDescription) sendSignal({ type: 'offer', to: peerId, sdp: peer.localDescription.toJSON() });
      });
    }
    return peer;
  }, [removePeer, sendSignal]);

  useEffect(() => {
    roomIdRef.current = roomId;
    userIdRef.current = userId;
  }, [roomId, userId]);

  useEffect(() => {
    if (!enabled || !roomId || !userId) return;
    let cancelled = false;
    setError(null);
    const roomChannel = supabase.channel(`deskflow-call-${roomId}`, { config: { broadcast: { self: false } } });
    channelRef.current = roomChannel;
    setConnectionState('connecting');

    const handleSignal = async ({ payload }: { payload: CallSignal }) => {
      if (cancelled || payload.from === userId || (payload.to && payload.to !== userId)) return;
      if (payload.type === 'join') {
        setParticipants(previous => previous.some(item => item.id === payload.from) ? previous : [...previous, { id: payload.from, joinedAt: Date.now(), mode: payload.mode }]);
        // Deterministic initiator avoids offer glare in the mesh.
        if (userId < payload.from) createPeer(payload.from, true);
        return;
      }
      if (payload.type === 'leave') {
        removePeer(payload.from);
        return;
      }
      if (payload.type === 'offer' && payload.sdp) {
        const peer = createPeer(payload.from, false);
        await peer.setRemoteDescription(payload.sdp);
        const queuedCandidates = pendingIceRef.current[payload.from] || [];
        delete pendingIceRef.current[payload.from];
        await Promise.all(queuedCandidates.map(candidate => peer.addIceCandidate(candidate).catch(() => undefined)));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        if (peer.localDescription) sendSignal({ type: 'answer', to: payload.from, sdp: peer.localDescription.toJSON() });
        return;
      }
      const peer = peersRef.current[payload.from];
      if (payload.type === 'ice' && payload.candidate) {
        if (!peer || !peer.remoteDescription) {
          pendingIceRef.current[payload.from] = [...(pendingIceRef.current[payload.from] || []), payload.candidate];
          return;
        }
        await peer.addIceCandidate(payload.candidate).catch(() => undefined);
        return;
      }
      if (!peer) return;
      if (payload.type === 'answer' && payload.sdp) {
        await peer.setRemoteDescription(payload.sdp);
        const queuedCandidates = pendingIceRef.current[payload.from] || [];
        delete pendingIceRef.current[payload.from];
        await Promise.all(queuedCandidates.map(candidate => peer.addIceCandidate(candidate).catch(() => undefined)));
      }
    };

    roomChannel.on('broadcast', { event: 'signal' }, handleSignal).subscribe(async status => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (!cancelled) {
          setConnectionState('failed');
          setError('Could not connect to the call server. Check your network and try again.');
        }
        return;
      }
      if (status !== 'SUBSCRIBED' || cancelled) return;
      // Make sure TURN credentials are fresh before we start negotiating.
      await refreshIceServers();
      if (cancelled) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: modeRef.current === 'video', audio: true });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        stream.getVideoTracks().forEach(track => { track.enabled = modeRef.current === 'video'; });
        // Broadcast several joins because realtime broadcasts are not durable;
        // this covers the other user's call view mounting after the invite.
        sendSignal({ type: 'join', mode: modeRef.current });
        const joinRetryTimer = window.setInterval(() => {
          if (!cancelled) sendSignal({ type: 'join', mode: modeRef.current });
        }, 1000);
        window.setTimeout(() => window.clearInterval(joinRetryTimer), 10000);
      } catch (mediaError) {
        const name = (mediaError as DOMException)?.name;
        setConnectionState('failed');
        setError(
          name === 'NotAllowedError'
            ? 'Microphone/camera permission was blocked. Allow access in your browser and rejoin.'
            : name === 'NotFoundError'
              ? 'No microphone or camera was found on this device.'
              : 'Could not access your microphone or camera.'
        );
      }
    });

    return () => {
      cancelled = true;
      sendSignal({ type: 'leave' });
      Object.keys(peersRef.current).forEach(removePeer);
      pendingIceRef.current = {};
      channelRef.current = null;
      void supabase.removeChannel(roomChannel);
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStreams({});
      setParticipants([]);
      setConnectionState('idle');
      setError(null);
    };
  }, [createPeer, enabled, removePeer, roomId, sendSignal, userId]);

  const setMicEnabled = useCallback((enabledValue: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = enabledValue; });
  }, []);

  const setCameraEnabled = useCallback(async (enabledValue: boolean) => {
    if (!enabledValue) {
      localStreamRef.current?.getVideoTracks().forEach(track => { track.enabled = false; });
      return;
    }
    if (!localStreamRef.current) return;
    let videoTracks = localStreamRef.current.getVideoTracks();
    if (!videoTracks.length && navigator.mediaDevices?.getUserMedia) {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        if (cameraTrack) {
          localStreamRef.current.addTrack(cameraTrack);
          videoTracks = [cameraTrack];
          Object.values(peersRef.current as Record<string, RTCPeerConnection>).forEach((peer: RTCPeerConnection) => peer.addTrack(cameraTrack, localStreamRef.current as MediaStream));
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }
      } catch {
        return;
      }
    }
    videoTracks.forEach(track => { track.enabled = true; });
  }, []);

  return { localStream, remoteStreams, participants, connectionState, error, setMicEnabled, setCameraEnabled };
}
