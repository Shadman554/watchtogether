import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleVoiceProps {
  isActive: boolean;
  onToggle: () => void;
  roomCode: string;
  userId: string;
  remoteUserId: string | null;
  ws: WebSocket | null;
}

export default function SimpleVoice({ isActive, onToggle, roomCode, userId, remoteUserId, ws }: SimpleVoiceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const { toast } = useToast();

  // Start simple microphone with immediate peer connection
  const startMicrophone = async () => {
    try {
      console.log('Getting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      localStreamRef.current = stream;
      setMicReady(true);
      
      // Create immediate peer connection for audio streaming
      await createPeerConnection(stream);
      
      console.log('Microphone ready - you can now talk!');
      
      toast({
        title: "Microphone Ready!",
        description: "You can now talk - others will hear you instantly.",
      });
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Denied", 
        description: "Please allow microphone access to use voice chat.",
        variant: "destructive",
      });
      onToggle();
    }
  };

  // Create simple peer connection for direct audio streaming
  const createPeerConnection = async (stream: MediaStream) => {
    if (!ws || !remoteUserId) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    peerConnectionRef.current = pc;

    // Add audio track
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log('Added audio track to peer connection');
    });

    // Handle incoming audio
    pc.ontrack = (event) => {
      console.log('Received remote audio stream!');
      const [remoteStream] = event.streams;
      
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(console.error);
      }
      
      setPeerConnected(true);
      toast({
        title: "Voice Connected!",
        description: "You can now hear each other!",
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && ws) {
        ws.send(JSON.stringify({
          type: 'voice_ice',
          payload: { candidate: event.candidate },
          timestamp: Date.now(),
        }));
      }
    };

    // Create and send offer immediately
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (ws) {
        ws.send(JSON.stringify({
          type: 'voice_offer',
          payload: { offer },
          timestamp: Date.now(),
        }));
      }
      
      console.log('Sent voice offer to peer');
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Stop microphone and close connection
  const stopMicrophone = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    
    setMicReady(false);
    setPeerConnected(false);
    
    toast({
      title: "Voice Stopped",
      description: "Voice chat has been turned off.",
    });
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
        setIsMuted(!isMuted);
        
        toast({
          title: isMuted ? "Unmuted" : "Muted",
          description: isMuted ? "Others can now hear you" : "Others cannot hear you",
        });
      }
    }
  };

  // Toggle deafen
  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
    
    toast({
      title: isDeafened ? "Undeafened" : "Deafened", 
      description: isDeafened ? "You can now hear others" : "You cannot hear others",
    });
  };

  // Handle WebSocket messages for voice
  useEffect(() => {
    if (!ws) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'voice_offer' && peerConnectionRef.current) {
          console.log('Received voice offer');
          const pc = peerConnectionRef.current;
          
          await pc.setRemoteDescription(new RTCSessionDescription(message.payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          ws.send(JSON.stringify({
            type: 'voice_answer',
            payload: { answer },
            timestamp: Date.now(),
          }));
          
          console.log('Sent voice answer');
        } else if (message.type === 'voice_answer' && peerConnectionRef.current) {
          console.log('Received voice answer');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.payload.answer));
        } else if (message.type === 'voice_ice' && peerConnectionRef.current) {
          console.log('Received ICE candidate');
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.payload.candidate));
        }
      } catch (error) {
        console.error('Error handling voice message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  // Handle activation
  useEffect(() => {
    if (isActive && !micReady) {
      startMicrophone();
    } else if (!isActive && micReady) {
      stopMicrophone();
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

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Main Voice Toggle */}
      <div className="mb-2">
        <Button
          onClick={onToggle}
          variant={isActive ? "destructive" : "default"}
          size="sm"
          className={`glass-dark border-purple-500/20 transition-all duration-300 ${
            isActive 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200' 
              : 'bg-green-500/20 hover:bg-green-500/30 text-green-200'
          }`}
        >
          {isActive ? (
            <>
              <PhoneOff className="w-4 h-4 mr-1" />
              End Voice
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 mr-1" />
              Start Voice
            </>
          )}
        </Button>
      </div>

      {/* Voice Controls (when active) */}
      {isActive && (
        <div className="flex flex-col space-y-2">
          {/* Mute Button */}
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className={`glass-dark border-purple-500/20 transition-all duration-300 ${
              isMuted 
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200' 
                : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200'
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="w-4 h-4 mr-1" />
                Muted
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-1" />
                {micReady ? 'Live' : 'Ready'}
              </>
            )}
          </Button>

          {/* Deafen Button */}
          <Button
            onClick={toggleDeafen}
            variant="ghost"
            size="sm"
            className={`glass-dark border-purple-500/20 transition-all duration-300 ${
              isDeafened 
                ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-200' 
                : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200'
            }`}
          >
            {isDeafened ? (
              <>
                <VolumeX className="w-4 h-4 mr-1" />
                Deafened
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-1" />
                Hearing
              </>
            )}
          </Button>

          {/* Connection Status */}
          <div className="text-xs text-center glass-dark px-2 py-1 rounded border border-purple-500/20">
            <div className={`flex items-center justify-center space-x-1 ${
              peerConnected ? 'text-green-300' : micReady ? 'text-yellow-300' : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                peerConnected ? 'bg-green-400' : micReady ? 'bg-yellow-400' : 'bg-gray-400'
              } ${peerConnected ? 'animate-pulse' : ''}`}></div>
              <span>
                {peerConnected ? 'Connected' : micReady ? 'Ready' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for remote audio */}
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
    </div>
  );
}