import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageCircle, Mic, MicOff, Settings, Folder, Sparkles, Gamepad2, Users, Copy, Eye, EyeOff, Phone, PhoneOff, Volume2, Monitor } from "lucide-react";
import UniversalVideoPlayer from "@/components/universal-video-player";
import ChatPanel from "@/components/chat-panel";
import SyncStatus from "@/components/sync-status";
import VoiceCall from "@/components/voice-call";
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

  const {
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

  const toggleVoiceCall = () => {
    setIsVoiceCallActive(!isVoiceCallActive);
    if (!isVoiceCallActive) {
      // Starting voice call is now handled by the VoiceCall component
      toast({
        title: "Voice Call Starting",
        description: "Requesting microphone access...",
      });
    } else {
      toast({
        title: "Voice Call Ended",
        description: "Voice call has been disconnected.",
      });
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-cinema-black via-cinema-dark to-accent-purple/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Connecting to CineSync Duo...</h3>
          <p className="text-gray-400">Establishing secure connection</p>
          <div className="mt-6 bg-cinema-dark/90 backdrop-blur-sm rounded-xl p-6 border border-accent-purple/30 shadow-xl">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-accent-purple rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Room Code:</span>
              <span className="font-bold text-accent-purple text-3xl tracking-wider">{roomCode}</span>
            </div>
            <p className="text-xs text-gray-500">Share this code with your friend to join</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 relative overflow-hidden">
      {/* Mobile-Responsive Top Control Bar */}
      {showControls && (
        <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-50">
          <div className="bg-black/90 backdrop-blur-xl border border-gray-700/50 shadow-2xl rounded-xl md:rounded-2xl p-2 md:p-4">
            {/* Mobile Layout - Stacked */}
            <div className="block md:hidden space-y-2">
              {/* Top Row - Navigation & Room Code */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToLobby}
                    className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg p-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg px-2 py-1 border border-purple-400/30">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
                        className="p-1 h-auto text-gray-400 hover:text-purple-400 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowControls(!showControls)}
                  className="bg-gray-700/50 text-gray-400 hover:bg-orange-600/20 hover:text-orange-400 rounded-lg p-2"
                  title="Hide UI"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>

              {/* Bottom Row - Controls and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {/* Connected Users */}
                  <div className="flex -space-x-1 mr-2">
                    {connectedUsers.map((user) => (
                      <div
                        key={user.userId}
                        className={`w-6 h-6 rounded-full border border-black flex items-center justify-center shadow-lg ${
                          user.isHost ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-blue-600 to-green-600'
                        }`}
                        title={`${user.username} ${user.isHost ? '(Host)' : '(Guest)'}`}
                      >
                        <span className="text-xs font-bold text-white">
                          {user.username.charAt(0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Control Buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleVoiceCall}
                    className={`rounded-lg p-1.5 ${
                      isVoiceCallActive 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-gray-700/50 text-gray-400'
                    }`}
                  >
                    {isVoiceCallActive ? <Phone className="w-3 h-3" /> : <PhoneOff className="w-3 h-3" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(!showChat)}
                    className={`rounded-lg p-1.5 ${
                      showChat 
                        ? 'bg-blue-600/20 text-blue-400' 
                        : 'bg-gray-700/50 text-gray-400'
                    }`}
                  >
                    <MessageCircle className="w-3 h-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidePanel(!showSidePanel)}
                    className="bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white rounded-lg p-1.5"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>

                {/* Mobile Sync Status */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    syncStatus.isSync ? 'bg-sync-green animate-pulse' : 'bg-warning-orange'
                  }`}></div>
                  <span className="text-xs text-gray-400">
                    {syncStatus.isSync ? 'Synced' : 'Out of Sync'}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Layout - Original */}
            <div className="hidden md:flex items-center justify-between">
              {/* Left Section - Navigation & Room Info */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToLobby}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-3 border border-purple-400/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Room:</span>
                        <span className="font-bold text-purple-400 text-lg tracking-wider">{roomCode}</span>
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
                      <span className="text-xs text-gray-500">Connected Users: {connectedUsers.length}/2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Section - Sync Status */}
              <SyncStatus syncStatus={syncStatus} />

              {/* Right Section - User Controls */}
              <div className="flex items-center space-x-2">
                {/* Connected Users */}
                <div className="flex -space-x-2 mr-3">
                  {connectedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center shadow-lg ${
                        user.isHost ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-blue-600 to-green-600'
                      }`}
                      title={`${user.username} ${user.isHost ? '(Host)' : '(Guest)'}`}
                    >
                      <span className="text-sm font-bold text-white">
                        {user.username.charAt(user.username.length - 1)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Voice Call Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleVoiceCall}
                  className={`rounded-xl transition-all ${
                    isVoiceCallActive 
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                      : 'bg-gray-700/50 text-gray-400 hover:bg-purple-600/20 hover:text-purple-400'
                  }`}
                >
                  {isVoiceCallActive ? <Phone className="w-4 h-4" /> : <PhoneOff className="w-4 h-4" />}
                </Button>

                {/* Chat Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className={`rounded-xl transition-all ${
                    showChat 
                      ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                      : 'bg-gray-700/50 text-gray-400 hover:bg-blue-600/20 hover:text-blue-400'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>

                {/* Settings */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidePanel(!showSidePanel)}
                  className="bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white rounded-xl"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                {/* UI Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowControls(!showControls)}
                  className="bg-gray-700/50 text-gray-400 hover:bg-orange-600/20 hover:text-orange-400 rounded-xl"
                  title="Hide UI"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Always Visible Access Button - Mobile Responsive */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowControls(!showControls)}
        className="fixed top-2 right-2 md:top-4 md:right-4 z-[100] bg-purple-600/80 backdrop-blur-sm hover:bg-purple-600 text-white rounded-full w-10 h-10 md:w-12 md:h-12 p-0 shadow-lg border-2 border-white/20"
        title={showControls ? "Hide Controls" : "Show Controls"}
      >
        {showControls ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
      </Button>

      {/* Video Player */}
      <UniversalVideoPlayer
        videoUrl={currentVideoUrl}
        onSync={sendSync}
        onPlaybackControl={sendPlaybackControl}
        syncStatus={syncStatus}
      />

      {/* Chat Panel */}
      <ChatPanel
        isVisible={showChat}
        messages={messages}
        onSendMessage={sendMessage}
        onClose={() => setShowChat(false)}
        currentUserId={userId}
      />

      {/* Modern Side Panel - Mobile Responsive */}
      {showSidePanel && showControls && (
        <div className="absolute left-2 top-20 md:left-4 md:top-24 z-40 animate-slide-up">
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

                {/* Voice Settings */}
                <Button
                  variant="ghost"
                  onClick={toggleVoiceCall}
                  className={`w-full justify-start border rounded-xl p-4 transition-all group ${
                    isVoiceCallActive 
                      ? 'bg-gradient-to-r from-sync-green/10 to-accent-blue/10 border-sync-green/30' 
                      : 'bg-gradient-to-r from-gray-600/10 to-gray-500/10 border-gray-600/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isVoiceCallActive ? 'bg-sync-green/20' : 'bg-gray-600/20'
                    }`}>
                      {isVoiceCallActive ? <Mic className="w-5 h-5 text-sync-green" /> : <MicOff className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">
                        {isVoiceCallActive ? 'Voice Chat Active' : 'Start Voice Chat'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {isVoiceCallActive ? 'Click to disconnect' : 'Talk with your friend'}
                      </div>
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

      {/* Simplified Mobile-Responsive Bottom Toolbar */}
      <div className="fixed bottom-2 left-2 right-2 md:bottom-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-[90]">
        <div className="bg-black/90 backdrop-blur-xl border border-gray-700/50 shadow-2xl rounded-xl md:rounded-2xl p-2 md:p-4">
          {/* Mobile Layout - Single Row for Load Video Only */}
          <div className="block md:hidden">
            <div className="flex items-center justify-center">
              <Button
                onClick={() => setIsUrlInputVisible(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg text-sm w-full max-w-xs"
              >
                <Folder className="w-4 h-4 mr-2" />
                Load Video
              </Button>
            </div>
          </div>

          {/* Desktop Layout - Full Controls */}
          <div className="hidden md:flex items-center space-x-3">
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

      {/* Voice Call Component */}
      <VoiceCall
        isActive={isVoiceCallActive}
        onToggle={toggleVoiceCall}
        roomCode={roomCode}
        userId={userId}
        remoteUserId={connectedUsers.find(u => u.userId !== userId)?.userId}
        sendWebRTCSignal={sendWebRTCSignal}
      />
    </div>
  );
}
