import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageCircle, Mic, MicOff, Folder, Users, Copy, Eye, EyeOff, Phone, PhoneOff, Volume2, Star, Zap, Heart, Share2 } from "lucide-react";
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
  
  // Auto-close URL input dialog when video is loaded
  useEffect(() => {
    if (currentVideoUrl) {
      setIsUrlInputVisible(false);
    }
  }, [currentVideoUrl]);
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
    setIsUrlInputVisible(false); // Close the dialog
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

    try {
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
          remoteAudioRef.current.play().catch(error => {
            console.error('Failed to play remote audio:', error);
          });
        }
        
        toast({
          title: "Voice Connected!",
          description: "You can now hear each other!",
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && ws) {
          try {
            ws.send(JSON.stringify({
              type: 'voice_ice',
              payload: { candidate: event.candidate },
              timestamp: Date.now(),
            }));
          } catch (error) {
            console.error('Failed to send ICE candidate:', error);
          }
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
    } catch (error) {
      console.error('Error creating peer connection:', error);
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
          
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(message.payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            ws.send(JSON.stringify({
              type: 'voice_answer',
              payload: { answer },
              timestamp: Date.now(),
            }));
            
            console.log('Sent voice answer');
          } catch (voiceError) {
            console.error('Voice offer handling failed:', voiceError);
          }
        } else if (message.type === 'voice_answer' && peerConnectionRef.current) {
          console.log('Received voice answer');
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.payload.answer));
          } catch (voiceError) {
            console.error('Voice answer handling failed:', voiceError);
          }
        } else if (message.type === 'voice_ice' && peerConnectionRef.current) {
          console.log('Received ICE candidate');
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.payload.candidate));
          } catch (voiceError) {
            console.error('ICE candidate handling failed:', voiceError);
          }
        }
      } catch (error) {
        console.error('Error handling voice message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => {
      if (ws) {
        ws.removeEventListener('message', handleMessage);
      }
    };
  }, [ws]);

  // Auto-hide chat initially, ensure controls are visible, and recover session
  useEffect(() => {
    setShowChat(false);
    setShowControls(true); // Always show controls by default
    
    // Try to recover session after page refresh
    const recoverSession = () => {
      try {
        const sessionData = localStorage.getItem(`cinesync_session_${roomCode}`);
        if (sessionData) {
          const { currentVideoUrl: savedUrl, currentTime, timestamp } = JSON.parse(sessionData);
          
          // Only recover if session is recent (within 10 minutes)
          const sessionAge = Date.now() - timestamp;
          if (savedUrl && sessionAge < 10 * 60 * 1000) {
            console.log('Recovering video session:', savedUrl, 'at time:', currentTime);
            setCurrentVideoUrl(savedUrl);
            
            // Always show recovery notification
            toast({
              title: "🎬 Session Recovered",
              description: currentTime > 0 
                ? `Resumed video from ${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`
                : "Your video session has been restored",
              duration: 4000,
            });
            
            // Restore video position after a short delay
            setTimeout(() => {
              const video = document.querySelector('video') as HTMLVideoElement;
              if (video && currentTime > 0) {
                video.currentTime = currentTime;
                console.log(`Video position restored to ${currentTime} seconds`);
              }
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Failed to recover session:', error);
      }
    };
    
    // Recover session after connection is established
    setTimeout(recoverSession, 1000);
  }, [roomCode, toast]);

  // Listen for video URL changes from remote user
  useEffect(() => {
    const handleVideoUrlChange = (event: CustomEvent) => {
      try {
        const { videoUrl } = event.detail;
        console.log('Received video URL from remote user:', videoUrl);
        
        // Only update and show notification if it's actually a different video
        if (videoUrl && videoUrl !== currentVideoUrl) {
          setCurrentVideoUrl(videoUrl);
          
          // Force a small delay to ensure the state updates
          setTimeout(() => {
            console.log('Current video URL updated to:', videoUrl);
          }, 100);
          
          toast({
            title: "Video Loaded by Host",
            description: "A new video has been loaded in the room!",
          });
        } else {
          console.log('Ignoring duplicate or empty video URL change:', videoUrl);
        }
      } catch (error) {
        console.error('Error handling video URL change:', error);
      }
    };

    window.addEventListener('videoUrlChange', handleVideoUrlChange as EventListener);
    
    return () => {
      try {
        window.removeEventListener('videoUrlChange', handleVideoUrlChange as EventListener);
      } catch (error) {
        console.error('Error removing event listener:', error);
      }
    };
  }, [toast, currentVideoUrl]);

  // Enhanced session persistence - save video position to prevent data loss on refresh
  useEffect(() => {
    const saveVideoPosition = () => {
      try {
        const video = document.querySelector('video') as HTMLVideoElement;
        const sessionData = {
          roomCode,
          currentVideoUrl,
          currentTime: video?.currentTime || 0,
          isPlaying: video ? !video.paused : false,
          timestamp: Date.now()
        };
        localStorage.setItem(`cinesync_session_${roomCode}`, JSON.stringify(sessionData));
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    };

    if (currentVideoUrl) {
      // Save every 3 seconds for better recovery
      const interval = setInterval(saveVideoPosition, 3000);
      
      // Also save on page visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          saveVideoPosition();
          console.log('Session saved before page became hidden');
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Show initial save confirmation
      setTimeout(() => {
        console.log('Session protection active - your video position is being saved automatically');
      }, 1000);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        saveVideoPosition(); // Final save on cleanup
        console.log('Session saved before component cleanup');
      };
    }
  }, [roomCode, currentVideoUrl]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden room-container">
      {/* Premium Header Bar - Mobile Responsive */}
      <div className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-purple-500/20 header-landscape">
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

      {/* Video Player - Full Screen */}
      <div className="fixed top-16 md:top-20 bottom-20 md:bottom-24 left-0 right-0 z-20 video-container-landscape">
        <UniversalVideoPlayer
          videoUrl={currentVideoUrl}
          onSync={sendSync}
          onPlaybackControl={sendPlaybackControl}
          syncStatus={syncStatus}
        />
      </div>

      {/* Chat Panel */}
      <div className="chat-panel-landscape">
        <ChatPanel
          isVisible={showChat}
          messages={messages}
          onSendMessage={sendMessage}
          onClose={() => setShowChat(false)}
          currentUserId={userId}
        />
      </div>


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
              
              <div className="space-y-6">
                <Input
                  type="text"
                  placeholder="Paste video URL here..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-2xl h-14 text-lg px-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-slate-700/50"
                  autoFocus
                />
                
                <div className="flex space-x-4">
                  <Button
                    onClick={handleLoadVideo}
                    disabled={!videoUrl.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 hover:from-purple-500 hover:via-purple-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/25 disabled:hover:scale-100 disabled:opacity-50 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Folder className="w-5 h-5 mr-2 relative z-10" />
                    <span className="relative z-10">Load Video</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setIsUrlInputVisible(false);
                      setVideoUrl("");
                    }}
                    className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 border-2 border-slate-600/50 hover:border-slate-500/50 text-gray-300 hover:text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
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
      <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:max-w-2xl z-30 bottom-controls-landscape">
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
