import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceCallProps {
  isActive: boolean;
  onToggle: () => void;
  roomCode: string;
  userId: string;
  remoteUserId?: string;
  sendWebRTCSignal: (type: string, data: any) => void;
}

interface WebRTCSignalMessage {
  type: string;
  payload: {
    type: 'offer' | 'answer' | 'ice-candidate';
    data: any;
    userId: string;
  };
}

export default function VoiceCall({ isActive, onToggle, roomCode, userId, remoteUserId, sendWebRTCSignal }: VoiceCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  
  const { toast } = useToast();
  
  // Determine if this user should be the caller (create offers)
  const isCallerRef = useRef<boolean>(false);
  const isInitiatorRef = useRef<boolean>(false);

  // WebRTC configuration with more STUN servers for better connectivity
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    iceCandidatePoolSize: 10
  };

  // Use existing WebSocket for signaling
  const setupWebRTCSignaling = () => {
    // Listen for WebRTC signaling messages on the window
    const handleWebRTCMessage = (event: CustomEvent) => {
      handleSignalingMessage(event.detail);
    };

    window.addEventListener('webrtc_signal', handleWebRTCMessage as EventListener);
    
    return () => {
      window.removeEventListener('webrtc_signal', handleWebRTCMessage as EventListener);
    };
  };

  // Send signaling message using the passed function
  const sendSignalingMessage = (type: string, data: any) => {
    sendWebRTCSignal(type, data);
  };

  // Handle incoming signaling messages with simplified logic
  const handleSignalingMessage = async (payload: any) => {
    if (!payload || !payload.type || !payload.data) {
      console.error('Invalid signaling message:', payload);
      return;
    }

    // If we don't have a peer connection and we're receiving an offer, start voice call as answerer
    if (!peerConnectionRef.current && payload.type === 'call_offer' && payload.data.type === 'offer') {
      console.log('Received offer but no connection - starting as answerer');
      setConnectionStatus('connecting');
      await initializeAnswererConnection();
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('No peer connection available after initialization');
      return;
    }

    try {
      console.log('Handling WebRTC signal:', payload.type, 'signalingState:', pc.signalingState, 'isInitiator:', isInitiatorRef.current);
      
      switch (payload.type) {
        case 'call_offer':
          // Only handle offer if we haven't initiated the call
          if (payload.data.type === 'offer' && !isInitiatorRef.current) {
            console.log('Received offer, creating answer');
            await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
            
            // Process queued candidates
            for (const candidate of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(candidate);
              } catch (e) {
                console.error('Error adding queued candidate:', e);
              }
            }
            pendingCandidatesRef.current = [];
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignalingMessage('call_answer', answer);
            console.log('Sent answer');
          }
          break;

        case 'call_answer':
          // Only handle answer if we initiated the call
          if (payload.data.type === 'answer' && isInitiatorRef.current) {
            console.log('Received answer, setting remote description');
            await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
            
            // Process queued candidates
            for (const candidate of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(candidate);
              } catch (e) {
                console.error('Error adding queued candidate:', e);
              }
            }
            pendingCandidatesRef.current = [];
            console.log('Remote description set with answer');
          }
          break;

        case 'ice-candidate':
          if (payload.data && payload.data.candidate) {
            const candidate = new RTCIceCandidate(payload.data);
            if (pc.remoteDescription) {
              try {
                await pc.addIceCandidate(candidate);
                console.log('Added ICE candidate');
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            } else {
              console.log('Queueing ICE candidate');
              pendingCandidatesRef.current.push(candidate);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error, payload);
    }
  };

  const startVoiceCall = async () => {
    try {
      console.log('Starting simple voice streaming...', { userId, remoteUserId });
      setConnectionStatus('connecting');
      
      // Get user media immediately for instant mic access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      localStreamRef.current = stream;
      console.log('Microphone access granted - ready to broadcast');
      
      // Set to connected immediately - no complex handshaking
      setConnectionStatus('connected');
      
      toast({
        title: "Microphone Ready!",
        description: "You can now broadcast your voice. Others will hear you instantly.",
      });
      
      return;
      
      // Clean up any existing connections first
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Set up WebRTC signaling
      const cleanup = setupWebRTCSignaling();
      
      // Get user media with simplified constraints for better compatibility
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      console.log('Got local media stream:', stream.getTracks().length, 'tracks');
      localStreamRef.current = stream;
      
      // Create peer connection
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event);
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream;
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(console.error);
        }
        
        setConnectionStatus('connected');
        toast({
          title: "Voice Connected!",
          description: "You can now hear and talk to your friend.",
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage('ice-candidate', event.candidate);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state changed:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setConnectionStatus('connected');
          toast({
            title: "Voice Connected!",
            description: "Voice call is now active.",
          });
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionStatus('disconnected');
          toast({
            title: "Voice Disconnected",
            description: "Voice call connection lost.",
            variant: "destructive",
          });
        }
      };

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state changed:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          console.log('Voice call successfully connected!');
          setConnectionStatus('connected');
          setRetryCount(0);
        } else if (pc.iceConnectionState === 'disconnected') {
          console.log('Voice call disconnected');
          setConnectionStatus('disconnected');
        } else if (pc.iceConnectionState === 'failed') {
          console.log('Voice call failed, retrying...');
          setConnectionStatus('disconnected');
          // Retry connection after failure
          if (retryCount < 2) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              if (isActive) {
                console.log('Retrying voice call due to connection failure');
                startVoiceCall();
              }
            }, 3000);
          }
        }
      };

      // Initiator creates offer after a brief delay
      setTimeout(async () => {
        try {
          if (pc.signalingState === 'stable' && isInitiatorRef.current) {
            console.log('Creating offer as initiator...');
            
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false
            });
            await pc.setLocalDescription(offer);
            sendSignalingMessage('call_offer', offer);
            console.log('Sent offer to peer');
          }
        } catch (error) {
          console.error('Error creating offer:', error);
          setConnectionStatus('disconnected');
        }
      }, 1500);

      // Set up connection timeout and retry mechanism
      setTimeout(() => {
        if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
          console.log('Connection timeout after 10s, current state:', pc.iceConnectionState);
          if (retryCount < 2) {
            console.log('Retrying connection...');
            setRetryCount(prev => prev + 1);
            // Retry by creating a new offer
            if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer') {
              pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false
              }).then(offer => {
                pc.setLocalDescription(offer);
                sendSignalingMessage('offer', offer);
                console.log('Sent retry offer');
              }).catch(console.error);
            }
          } else {
            console.log('Max retries reached, connection failed');
            setConnectionStatus('disconnected');
            toast({
              title: "Connection Failed",
              description: "Unable to establish voice connection. Please try again.",
              variant: "destructive",
            });
          }
        }
      }, 10000);

      toast({
        title: "Voice Call Starting",
        description: "Connecting to your friend...",
      });

    } catch (error) {
      console.error('Error starting voice call:', error);
      setConnectionStatus('disconnected');
      toast({
        title: "Microphone Access Denied", 
        description: "Please allow microphone access to use voice chat.",
        variant: "destructive",
      });
      onToggle(); // Turn off call if failed
    }
  };

  // Initialize connection for answerer (when receiving an offer)
  const initializeAnswererConnection = async () => {
    try {
      console.log('Initializing answerer connection...');
      
      // Clean up any existing connections first
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Set up WebRTC signaling
      const cleanup = setupWebRTCSignaling();
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      localStreamRef.current = stream;
      
      // Create peer connection
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track (answerer):', event);
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream;
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(console.error);
        }
        
        setConnectionStatus('connected');
        toast({
          title: "Voice Connected!",
          description: "You can now hear and talk to your friend.",
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate (answerer)');
          sendSignalingMessage('ice-candidate', event.candidate);
        }
      };

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state changed (answerer):', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setConnectionStatus('connected');
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setConnectionStatus('disconnected');
        }
      };

      console.log('Answerer connection initialized, ready to receive offer');
    } catch (error) {
      console.error('Error initializing answerer connection:', error);
      setConnectionStatus('disconnected');
    }
  };

  const endVoiceCall = () => {
    setConnectionStatus('disconnected');
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear remote stream
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;

    toast({
      title: "Voice Call Ended",
      description: "Voice call has been disconnected.",
    });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        
        toast({
          title: isMuted ? "Microphone Unmuted" : "Microphone Muted",
          description: isMuted ? "Your friend can now hear you" : "Your friend cannot hear you",
        });
      }
    }
  };

  const toggleDeafen = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isDeafened;
      setIsDeafened(!isDeafened);
      
      toast({
        title: isDeafened ? "Audio Enabled" : "Audio Disabled",
        description: isDeafened ? "You can now hear your friend" : "You cannot hear your friend",
      });
    }
  };

  // Effect to handle call state changes
  useEffect(() => {
    if (isActive && connectionStatus === 'disconnected') {
      startVoiceCall();
    } else if (!isActive && connectionStatus !== 'disconnected') {
      endVoiceCall();
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  if (!isActive) {
    return null;
  }

  return (
    <>
      {/* Hidden audio elements for WebRTC */}
      <audio ref={localAudioRef} muted />
      <audio ref={remoteAudioRef} autoPlay />
      
      {/* Mobile-Responsive Voice Call Status Card */}
      <div className="fixed bottom-20 left-2 md:bottom-4 md:left-4 z-40 animate-slide-up">
        <Card className="bg-cinema-dark/95 backdrop-blur-xl border-gray-700/50 shadow-2xl">
          <CardContent className="p-2 md:p-4">
            {/* Mobile Layout - Stacked */}
            <div className="block md:hidden space-y-2">
              {/* Connection Status */}
              <div className="flex items-center justify-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-sync-green animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-warning-orange animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="text-xs font-medium text-white">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Disconnected'}
                </span>
              </div>

              {/* Voice Controls */}
              <div className="flex items-center justify-center space-x-1">
                {/* Mute Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className={`rounded-lg p-1.5 ${
                    isMuted 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-sync-green/20 text-sync-green'
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </Button>

                {/* Deafen Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDeafen}
                  className={`rounded-lg p-1.5 ${
                    isDeafened 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-accent-blue/20 text-accent-blue'
                  }`}
                  title={isDeafened ? "Enable Audio" : "Disable Audio"}
                >
                  {isDeafened ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </Button>

                {/* End Call Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="bg-red-500/20 text-red-400 rounded-lg p-1.5"
                  title="End Call"
                >
                  <PhoneOff className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout - Horizontal */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-sync-green animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-warning-orange animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="text-sm font-medium text-white">
                  {connectionStatus === 'connected' ? 'Voice Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Disconnected'}
                </span>
              </div>

              {/* Voice Controls */}
              <div className="flex items-center space-x-2">
                {/* Mute Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className={`rounded-xl transition-all ${
                    isMuted 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-sync-green/20 text-sync-green hover:bg-sync-green/30'
                  }`}
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                {/* Deafen Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDeafen}
                  className={`rounded-xl transition-all ${
                    isDeafened 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30'
                  }`}
                  title={isDeafened ? "Enable Audio" : "Disable Audio"}
                >
                  {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                {/* End Call Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-all"
                  title="End Voice Call"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}