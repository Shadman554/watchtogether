import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageCircle, Mic, Settings, Folder, Sparkles, Gamepad2, Users } from "lucide-react";
import VideoPlayer from "@/components/video-player";
import ChatPanel from "@/components/chat-panel";
import SyncStatus from "@/components/sync-status";
import { useWebSocket } from "@/hooks/use-websocket";

interface RoomPageProps {
  roomCode: string;
}

export default function Room({ roomCode }: RoomPageProps) {
  const [, setLocation] = useLocation();
  const [showChat, setShowChat] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isUrlInputVisible, setIsUrlInputVisible] = useState(false);
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
  } = useWebSocket(roomCode, userId, username, isHost);

  const handleBackToLobby = () => {
    setLocation("/");
  };

  const handleVideoLoad = (videoId: string) => {
    setCurrentVideoId(videoId);
    // Send video change to other user
    sendPlaybackControl("seek", 0, videoId);
  };

  const handleLoadVideo = () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Extract YouTube video ID from URL
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = videoUrl.match(youtubeRegex);
    
    if (match && match[1]) {
      handleVideoLoad(match[1]);
      setVideoUrl("");
      setIsUrlInputVisible(false);
      toast({
        title: "Video Loaded",
        description: "Video loaded successfully!",
      });
    } else {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
    }
  };

  // Auto-show chat after 3 seconds for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChat(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-cinema-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Connecting...</h3>
          <p className="text-gray-400">Establishing connection to room {roomCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-black relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-cinema-black/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          {/* Room Info */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLobby}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-sync-green rounded-full animate-pulse-slow"></div>
              <span className="font-semibold">Room: {roomCode}</span>
            </div>
          </div>

          {/* Sync Status */}
          <SyncStatus syncStatus={syncStatus} />

          {/* User Avatars */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {connectedUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className={`w-8 h-8 rounded-full border-2 border-cinema-black flex items-center justify-center ${
                    user.isHost ? 'bg-accent-purple' : 'bg-accent-blue'
                  }`}
                >
                  <span className="text-xs font-bold">
                    {user.username.charAt(user.username.length - 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="bg-cinema-dark/80 backdrop-blur-sm hover:bg-cinema-gray"
            >
              <Mic className="w-4 h-4 text-sync-green" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="bg-cinema-dark/80 backdrop-blur-sm hover:bg-cinema-gray"
            >
              <MessageCircle className="w-4 h-4 text-accent-blue" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-cinema-dark/80 backdrop-blur-sm hover:bg-cinema-gray"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <VideoPlayer
        videoId={currentVideoId}
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

      {/* Side Control Panel */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40">
        <Card className="bg-cinema-dark/90 backdrop-blur-sm border-gray-700 p-3">
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUrlInputVisible(!isUrlInputVisible)}
              className="w-full bg-cinema-gray hover:bg-gray-600 rounded-xl p-3 transition-colors group"
            >
              <div className="flex flex-col items-center">
                <Folder className="w-5 h-5 text-accent-blue group-hover:text-accent-purple transition-colors mb-1" />
                <span className="text-xs font-medium">Library</span>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full bg-cinema-gray hover:bg-gray-600 rounded-xl p-3 transition-colors group"
            >
              <div className="flex flex-col items-center">
                <Sparkles className="w-5 h-5 text-warning-orange group-hover:text-accent-purple transition-colors mb-1" />
                <span className="text-xs font-medium">AI Pick</span>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full bg-cinema-gray hover:bg-gray-600 rounded-xl p-3 transition-colors group"
            >
              <div className="flex flex-col items-center">
                <Gamepad2 className="w-5 h-5 text-sync-green group-hover:text-accent-purple transition-colors mb-1" />
                <span className="text-xs font-medium">Games</span>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full bg-cinema-gray hover:bg-gray-600 rounded-xl p-3 transition-colors group"
            >
              <div className="flex flex-col items-center">
                <Users className="w-5 h-5 text-gray-400 group-hover:text-accent-purple transition-colors mb-1" />
                <span className="text-xs font-medium">Room</span>
              </div>
            </Button>
          </div>
        </Card>
      </div>

      {/* URL Input Modal */}
      {isUrlInputVisible && (
        <div className="absolute inset-0 bg-cinema-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-cinema-dark border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Load YouTube Video</h3>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter YouTube URL..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-cinema-gray border-gray-600 text-white placeholder-gray-500 focus:border-accent-blue"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleLoadVideo}
                    className="flex-1 bg-accent-purple hover:bg-accent-purple/80"
                  >
                    Load Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUrlInputVisible(false);
                      setVideoUrl("");
                    }}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-cinema-gray"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
