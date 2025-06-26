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
}

export default function VoiceCall({ isActive, onToggle, roomCode, userId, remoteUserId }: VoiceCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useToast();

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const startVoiceCall = async () => {
    try {
      setConnectionStatus('connecting');
      
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

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream;
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(console.error);
        }
        
        setConnectionStatus('connected');
        toast({
          title: "Voice Call Connected",
          description: "You can now talk with your friend!",
        });
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setConnectionStatus('connected');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionStatus('disconnected');
        }
      };

      setConnectionStatus('connected');
      toast({
        title: "Voice Call Started",
        description: "Microphone access granted. Waiting for your friend...",
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
      
      {/* Voice Call Status Card */}
      <div className="absolute bottom-4 left-4 z-40 animate-slide-up">
        <Card className="bg-cinema-dark/95 backdrop-blur-xl border-gray-700/50 shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
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