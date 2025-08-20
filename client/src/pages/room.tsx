import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageCircle, Mic, MicOff, Settings, Folder, Sparkles, Gamepad2, Users, Copy, Eye, EyeOff, Phone, PhoneOff, Volume2, Monitor, Star, Zap, Heart, Share2 } from "lucide-react";
import UniversalVideoPlayer from "@/components/universal-video-player";
import ChatPanel from "@/components/chat-panel";
import SyncStatus from "@/components/sync-status";

import { useWebSocket } from "@/hooks/use-websocket";

interface RoomPageProps {
  roomCode: string;
}

export default function Room({ roomCode }: RoomPageProps) {
  const [, setLocation] = useLocation();
  const [showChat, setShowChat] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isUrlInputVisible, setIsUrlInputVisible] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const { toast } = useToast();

  const userId = localStorage.getItem("userId") || "";
  const username = localStorage.getItem("username") || "";
  const isHost = localStorage.getItem("isHost") === "true";
  
  // Voice call state
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const {
    ws,
    isConnected,
    syncStatus,
    connectedUsers,
    messages,
    sendMessage,
    sendSync,
    sendPlaybackControl,
    sendWebRTCSignal,
  } = useWebSocket(roomCode, userId, username, isHost);

  // Show room code notification when connected
  useEffect(() => {
    if (isConnected && isHost) {
      toast({
        title: "Room Created Successfully!",
        description: `Room Code: ${roomCode} - Share this with your friend`,
        duration: 10000,
      });
    }
  }, [isConnected, isHost, roomCode, toast]);

  const handleBackToLobby = () => {
    setLocation("/");
  };

  const handleVideoLoad = (videoUrl: string) => {
    setCurrentVideoUrl(videoUrl);
    // Send video change to other user with video URL
    sendPlaybackControl("video_change", 0, videoUrl);
    // Also send initial sync
    setTimeout(() => {
      sendSync(0, false, videoUrl);
    }, 500);
  };

  const handleLoadVideo = () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL.",
        variant: "destructive",
      });
      return;
    }

    handleVideoLoad(videoUrl.trim());
    setVideoUrl("");
    setIsUrlInputVisible(false);
    toast({
      title: "Video Loaded",
      description: "Video loaded successfully!",
    });
  };

  const toggleVoiceCall = async () => {
    if (!isVoiceCallActive) {
      await startVoiceCall();
    } else {
      stopVoiceCall();
    }
  };

  const startVoiceCall = async () => {
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
      
      // Create peer connection for audio streaming
      await createPeerConnection(stream);
      
      setIsVoiceCallActive(true);
      
      toast({
        title: "Voice Chat Started!",
        description: "Microphone is active. Creating connection...",
      });
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Denied", 
        description: "Please allow microphone access to use voice chat.",
        variant: "destructive",
      });
    }
  };

  const createPeerConnection = async (stream: MediaStream) => {
    if (!ws || !connectedUsers.find(u => u.userId !== userId)) return;

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

    // Create and send offer
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

  const stopVoiceCall = () => {
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
    
    setIsVoiceCallActive(false);
    toast({
      title: "Voice Chat Stopped",
      description: "Microphone has been turned off.",
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

  // Auto-hide chat initially and ensure controls are visible
  useEffect(() => {
    setShowChat(false);
    setShowControls(true); // Always show controls by default
  }, []);

  // Listen for video URL changes from remote user
  useEffect(() => {
    const handleVideoUrlChange = (event: CustomEvent) => {
      const { videoUrl } = event.detail;
      console.log('Received video URL from remote user:', videoUrl);
      setCurrentVideoUrl(videoUrl);
      
      // Force a small delay to ensure the state updates
      setTimeout(() => {
        console.log('Current video URL updated to:', videoUrl);
      }, 100);
      
      toast({
        title: "Video Loaded by Host",
        description: "A new video has been loaded in the room!",
      });
    };

    window.addEventListener('videoUrlChange', handleVideoUrlChange as EventListener);
    
    return () => {
      window.removeEventListener('videoUrlChange', handleVideoUrlChange as EventListener);
    };
  }, [toast]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center animate-fade-up">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            Connecting to CineSync Duo...
          </h3>
          <p className="text-gray-300 mb-8 text-lg">Establishing secure connection</p>
          
          <div className="glass-dark rounded-2xl p-8 border border-purple-500/30 shadow-2xl max-w-md mx-auto animate-glow">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
              <span className="text-gray-300 font-medium">Room Code:</span>
            </div>
            <div className="font-black text-4xl md:text-5xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wider mb-2">
              {roomCode}
            </div>
            <p className="text-sm text-gray-400 mb-4">Share this code with your friend to join</p>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Secure • Private • Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Premium Header Bar - Mobile Responsive */}
      <div className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-purple-500/20">
        <div className="flex items-center justify-between p-3 md:p-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToLobby}
              className="glass hover:bg-purple-500/20 border border-purple-500/30 rounded-xl p-2 md:p-3 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </Button>
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h1 className="text-sm md:text-lg font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                CineSync Duo
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* Mobile Room Code Display */}
            <div className="glass rounded-lg md:rounded-xl px-2 py-1 md:px-4 md:py-2 border border-purple-500/30">
              <div className="flex items-center space-x-1 md:space-x-2">
                <span className="text-xs md:text-sm text-gray-400 hidden md:block">Room:</span>
                <span className="font-bold text-purple-400 text-sm md:text-lg tracking-wider">{roomCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                    toast({ title: "Copied!", description: "Room code copied to clipboard" });
                  }}
                  className="p-1 hover:bg-purple-500/20 rounded-lg transition-colors"
                >
                  <Copy className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
                </Button>
              </div>
            </div>
            
            {/* Mobile User Display */}
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="flex -space-x-2">
                {connectedUsers.map((user, index) => (
                  <div
                    key={user.userId}
                    className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      user.isHost 
                        ? 'bg-purple-500 border-purple-400 text-white' 
                        : 'bg-blue-500 border-blue-400 text-white'
                    }`}
                    title={user.username}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-xs md:text-sm text-gray-400">{connectedUsers.length}/2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player - Mobile Responsive */}
      <div className="pt-16 md:pt-20">
        <UniversalVideoPlayer
          videoUrl={currentVideoUrl}
          onSync={sendSync}
          onPlaybackControl={sendPlaybackControl}
          syncStatus={syncStatus}
        />
      </div>

      {/* Chat Panel */}
      <ChatPanel
        isVisible={showChat}
        messages={messages}
        onSendMessage={sendMessage}
        onClose={() => setShowChat(false)}
        currentUserId={userId}
      />

      {/* Modern Side Panel - Mobile Responsive */}
      {showSidePanel && (
        <div className="fixed left-2 top-4 md:left-4 md:top-24 bottom-32 md:bottom-auto z-40 animate-slide-up overflow-y-auto">
          <Card className="bg-cinema-dark/95 backdrop-blur-xl border-gray-700/50 shadow-2xl w-56 md:w-64">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                <Monitor className="w-4 h-4 mr-2 text-accent-purple" />
                Room Controls
              </h3>
              
              <div className="space-y-3">
                {/* Load Video */}
                <Button
                  variant="ghost"
                  onClick={() => setIsUrlInputVisible(true)}
                  className="w-full justify-start bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 hover:from-accent-blue/20 hover:to-accent-purple/20 border border-accent-blue/30 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent-blue/20 rounded-xl flex items-center justify-center group-hover:bg-accent-blue/30 transition-colors">
                      <Folder className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Load Video</div>
                      <div className="text-xs text-gray-400">YouTube, streaming sites, direct links</div>
                    </div>
                  </div>
                </Button>



                {/* AI Recommendations */}
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-gradient-to-r from-warning-orange/10 to-accent-purple/10 hover:from-warning-orange/20 hover:to-accent-purple/20 border border-warning-orange/30 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-warning-orange/20 rounded-xl flex items-center justify-center group-hover:bg-warning-orange/30 transition-colors">
                      <Sparkles className="w-5 h-5 text-warning-orange" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">AI Suggestions</div>
                      <div className="text-xs text-gray-400">Get movie recommendations</div>
                    </div>
                  </div>
                </Button>

                {/* Interactive Features */}
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-gradient-to-r from-sync-green/10 to-accent-blue/10 hover:from-sync-green/20 hover:to-accent-blue/20 border border-sync-green/30 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sync-green/20 rounded-xl flex items-center justify-center group-hover:bg-sync-green/30 transition-colors">
                      <Gamepad2 className="w-5 h-5 text-sync-green" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Interactive Mode</div>
                      <div className="text-xs text-gray-400">Games & polls during movies</div>
                    </div>
                  </div>
                </Button>

                {/* Room Stats */}
                <div className="mt-4 p-3 bg-cinema-gray/50 rounded-xl border border-gray-600/30">
                  <div className="text-xs text-gray-400 mb-2">Room Statistics</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Connected:</span>
                      <span className="text-sync-green">{connectedUsers.length}/2 users</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Sync Status:</span>
                      <span className={syncStatus.isSync ? 'text-sync-green' : 'text-red-400'}>
                        {syncStatus.isSync ? 'Synced' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Latency:</span>
                      <span className="text-accent-blue">±{syncStatus.latency}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile-Responsive URL Input Modal */}
      {isUrlInputVisible && (
        <div className="absolute inset-0 bg-cinema-black/95 backdrop-blur-xl flex items-center justify-center z-50 animate-slide-up p-2 md:p-0">
          <Card className="w-full max-w-lg mx-2 md:mx-4 bg-cinema-dark/95 backdrop-blur-xl border-gray-700/50 shadow-2xl">
            <CardContent className="p-4 md:p-8">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl flex items-center justify-center mr-3 md:mr-4">
                  <Folder className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Load Video Content</h3>
                  <p className="text-xs md:text-sm text-gray-400">From any streaming platform or direct link</p>
                </div>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Paste video URL here..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="bg-cinema-gray/50 border-gray-600/50 text-white placeholder-gray-500 focus:border-accent-blue focus:bg-cinema-gray/70 rounded-xl h-10 md:h-12 text-base md:text-lg"
                    autoFocus
                  />
                  
                  <div className="bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 rounded-xl p-3 md:p-4 border border-accent-blue/20">
                    <div className="text-xs md:text-sm text-gray-300 mb-2 font-medium">Supported Platforms:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 text-xs text-gray-400">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-accent-purple rounded-full"></div>
                        <span>YouTube</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-accent-blue rounded-full"></div>
                        <span>beenar.net</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-sync-green rounded-full"></div>
                        <span>streamtape</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-warning-orange rounded-full"></div>
                        <span>mixdrop</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-accent-purple rounded-full"></div>
                        <span>doodstream</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-accent-blue rounded-full"></div>
                        <span>Direct files (.mp4, .webm)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                  <Button
                    onClick={handleLoadVideo}
                    disabled={!videoUrl.trim()}
                    className="flex-1 bg-gradient-to-r from-accent-purple to-accent-blue hover:from-accent-purple/80 hover:to-accent-blue/80 text-white font-semibold py-3 rounded-xl transition-all"
                  >
                    Load Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUrlInputVisible(false);
                      setVideoUrl("");
                    }}
                    className="flex-1 border-gray-600/50 text-gray-300 hover:bg-cinema-gray/50 py-3 rounded-xl transition-all"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile-Optimized Bottom Toolbar */}
      <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:max-w-2xl z-30">
        <div className="glass-dark border border-purple-500/20 shadow-2xl rounded-2xl p-3 md:p-4">
          {/* Mobile Layout - Compact Single Row */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between space-x-2">
              <Button
                onClick={() => setIsUrlInputVisible(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white font-bold px-4 py-2 rounded-xl shadow-lg text-sm flex-1"
              >
                <Folder className="w-4 h-4 mr-2" />
                Load Video
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowChat(!showChat)}
                className={`rounded-xl px-3 py-2 ${
                  showChat 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' 
                    : 'bg-slate-700/50 text-gray-300 hover:bg-blue-500/10'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                onClick={toggleVoiceCall}
                className={`rounded-xl px-3 py-2 ${
                  isVoiceCallActive 
                    ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                    : 'bg-slate-700/50 text-gray-300 hover:bg-green-500/10'
                }`}
              >
                {isVoiceCallActive ? <Phone className="w-4 h-4" /> : <PhoneOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowSidePanel(!showSidePanel)}
                className={`rounded-xl px-3 py-2 ${
                  showSidePanel 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30' 
                    : 'bg-slate-700/50 text-gray-300 hover:bg-orange-500/10'
                }`}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Desktop Layout - Full Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={handleBackToLobby}
              className="bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-600/50 rounded-xl px-4 py-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            {/* Load Video Button */}
            <Button
              onClick={() => setIsUrlInputVisible(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
            >
              <Folder className="w-4 h-4 mr-2" />
              Load Video
            </Button>

            {/* Chat Toggle */}
            <Button
              variant="ghost"
              onClick={() => setShowChat(!showChat)}
              className={`rounded-xl px-4 py-3 ${
                showChat 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-400/30' 
                  : 'bg-gray-700/50 text-gray-300 hover:text-blue-400 hover:bg-blue-600/10'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>

            {/* Voice Call Toggle */}
            <Button
              variant="ghost"
              onClick={toggleVoiceCall}
              className={`rounded-xl px-4 py-3 ${
                isVoiceCallActive 
                  ? 'bg-green-600/20 text-green-400 border border-green-400/30' 
                  : 'bg-gray-700/50 text-gray-300 hover:text-green-400 hover:bg-green-600/10'
              }`}
            >
              {isVoiceCallActive ? <Phone className="w-4 h-4" /> : <PhoneOff className="w-4 h-4" />}
            </Button>

            {/* Settings Panel Toggle */}
            <Button
              variant="ghost"
              onClick={() => setShowSidePanel(!showSidePanel)}
              className={`rounded-xl px-4 py-3 ${
                showSidePanel 
                  ? 'bg-orange-600/20 text-orange-400 border border-orange-400/30' 
                  : 'bg-gray-700/50 text-gray-300 hover:text-orange-400 hover:bg-orange-600/10'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Room Code Display */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl px-4 py-3 border border-purple-400/30">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Room:</span>
                <span className="font-bold text-purple-400 text-sm tracking-wider">{roomCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                    toast({
                      title: "Room Code Copied",
                      description: "Share this code with your friend!",
                    });
                  }}
                  className="p-1 h-auto text-gray-400 hover:text-purple-400 rounded-lg"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for remote audio */}
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
    </div>
  );
}
