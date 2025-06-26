import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Film, Plus, LogIn, FolderSync, MessageCircle, Shield, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      const response = await apiRequest("POST", "/api/rooms");
      const data = await response.json();
      
      // Store user ID in localStorage for this session
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", `User-${data.userId.slice(0, 4)}`);
      localStorage.setItem("isHost", "true");
      
      setLocation(`/room/${data.room.code}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Invalid Room Code",
        description: "Please enter a valid room code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsJoining(true);
      const response = await apiRequest("GET", `/api/rooms/${roomCode.toUpperCase()}`);
      const data = await response.json();
      
      // Store user ID in localStorage for this session
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", `User-${data.userId.slice(0, 4)}`);
      localStorage.setItem("isHost", "false");
      
      setLocation(`/room/${data.room.code}`);
    } catch (error) {
      toast({
        title: "Room Not Found",
        description: "The room code you entered doesn't exist.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 py-8 md:py-4 overflow-y-auto md:flex md:items-center md:justify-center">
      <div className="max-w-6xl w-full animate-fade-up">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center mb-6 md:mb-8 animate-float">
            <div className="relative">
              <Film className="text-4xl md:text-6xl text-purple-400 mr-3 md:mr-6 animate-glow" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-7xl font-black bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
                CineSync Duo
              </h1>
              <div className="h-1 w-32 md:w-48 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto"></div>
            </div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 px-4 mb-4">Watch movies together in perfect sync, anywhere in the world</p>
          <p className="text-sm md:text-base text-gray-400 px-4">Experience seamless video synchronization with voice chat and universal platform support</p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          {/* Create Room Card */}
          <Card className="group glass-dark border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 animate-scale-in">
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <Plus className="text-3xl text-green-400 mr-4 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">Create Room</h3>
              </div>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">Start a new sync session and invite your friend to watch together with crystal-clear synchronization</p>
              <Button 
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group-hover:animate-glow"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  "Create New Room"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="group glass-dark border-blue-500/20 hover:border-blue-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 animate-scale-in [animation-delay:0.2s]">
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <LogIn className="text-3xl text-blue-400 mr-4 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">Join Room</h3>
              </div>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">Enter a room code to join an existing sync session and start watching instantly</p>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 6-digit room code..."
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 py-4 px-6 rounded-xl text-lg font-mono tracking-wider transition-all duration-300"
                  maxLength={6}
                />
                <Button 
                  onClick={handleJoinRoom}
                  disabled={isJoining}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group-hover:animate-glow"
                >
                  {isJoining ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Joining...
                    </div>
                  ) : (
                    "Join Room"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Features Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Card className="group glass border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 animate-fade-up">
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <FolderSync className="text-green-400 text-3xl mx-auto group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="font-semibold text-white mb-2">Perfect Sync</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Millisecond-precise synchronization</p>
            </CardContent>
          </Card>
          
          <Card className="group glass border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 animate-fade-up [animation-delay:0.1s]">
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <MessageCircle className="text-blue-400 text-3xl mx-auto group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="font-semibold text-white mb-2">Voice & Chat</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Real-time communication</p>
            </CardContent>
          </Card>
          
          <Card className="group glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 animate-fade-up [animation-delay:0.2s]">
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <Shield className="text-purple-400 text-3xl mx-auto group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="font-semibold text-white mb-2">Private Rooms</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Secure & encrypted</p>
            </CardContent>
          </Card>
          
          <Card className="group glass border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 animate-fade-up [animation-delay:0.3s]">
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <Sparkles className="text-orange-400 text-3xl mx-auto group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="font-semibold text-white mb-2">Universal Player</h4>
              <p className="text-xs text-gray-400 leading-relaxed">All platforms supported</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-12 md:mt-16 opacity-60">
          <p className="text-sm text-gray-400">Built with modern web technologies for the best watching experience</p>
        </div>
      </div>
    </div>
  );
}
