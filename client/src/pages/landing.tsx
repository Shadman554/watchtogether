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
      console.log('Creating room...');
      
      const response = await apiRequest("POST", "/api/rooms");
      console.log('Room creation response:', response.status);
      
      const data = await response.json();
      console.log('Room data received:', data);
      
      // Store user ID in localStorage for this session
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", `User-${data.userId.slice(0, 4)}`);
      localStorage.setItem("isHost", "true");
      
      toast({
        title: "Room Created!",
        description: `Room ${data.room.code} created successfully!`,
      });
      
      setLocation(`/room/${data.room.code}`);
    } catch (error) {
      console.error('Room creation error:', error);
      toast({
        title: "Error",
        description: `Failed to create room: ${error.message}`,
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
      console.log('Joining room:', roomCode);
      
      const response = await apiRequest("GET", `/api/rooms/${roomCode.toUpperCase()}`);
      console.log('Join room response:', response.status);
      
      const data = await response.json();
      console.log('Room join data:', data);
      
      // Store user ID in localStorage for this session
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", `User-${data.userId.slice(0, 4)}`);
      localStorage.setItem("isHost", "false");
      
      toast({
        title: "Joined Room!",
        description: `Successfully joined room ${data.room.code}!`,
      });
      
      setLocation(`/room/${data.room.code}`);
    } catch (error) {
      console.error('Room join error:', error);
      toast({
        title: "Room Not Found",
        description: `Error joining room: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl w-full mx-auto animate-fade-up py-4">
        {/* Mobile-First Hero Section */}
        <div className="text-center mb-6 md:mb-16">
          <div className="flex flex-col items-center mb-4 md:mb-8 animate-float">
            <div className="relative mb-3">
              <Film className="text-4xl md:text-6xl text-purple-400 animate-glow" />
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl md:text-7xl font-black bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
                CineSync Duo
              </h1>
              <div className="h-1 w-20 md:w-48 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto"></div>
            </div>
          </div>
          <p className="text-base md:text-2xl text-gray-300 px-4 mb-2">Watch movies together in perfect sync</p>
          <p className="text-xs md:text-base text-gray-400 px-4">Voice chat and universal platform support</p>
        </div>

        {/* Mobile-Optimized Action Cards */}
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 mb-6 md:mb-16">
          {/* Create Room Card */}
          <Card className="group glass-dark border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 animate-scale-in">
            <CardContent className="p-6 md:p-10">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="relative">
                  <Plus className="text-2xl md:text-3xl text-green-400 mr-3 md:mr-4 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                </div>
                <h3 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">Create Room</h3>
              </div>
              <p className="text-gray-300 mb-6 md:mb-8 text-sm md:text-lg leading-relaxed">Start a new sync session and invite your friend to watch together</p>
              <Button 
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
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
            <CardContent className="p-6 md:p-10">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="relative">
                  <LogIn className="text-2xl md:text-3xl text-blue-400 mr-3 md:mr-4 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                </div>
                <h3 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">Join Room</h3>
              </div>
              <p className="text-gray-300 mb-6 md:mb-8 text-sm md:text-lg leading-relaxed">Enter a room code to join an existing sync session</p>
              <div className="space-y-3 md:space-y-4">
                <Input
                  type="text"
                  placeholder="Enter room code..."
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl text-base md:text-lg font-mono tracking-wider transition-all duration-300"
                  maxLength={6}
                />
                <Button 
                  onClick={handleJoinRoom}
                  disabled={isJoining}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base"
                >
                  {isJoining ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          <Card className="group glass border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 animate-fade-up">
            <CardContent className="p-3 md:p-6 text-center">
              <div className="relative mb-2 md:mb-4">
                <FolderSync className="text-green-400 text-lg md:text-3xl mx-auto group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="font-semibold text-white mb-1 text-xs md:text-base">Perfect Sync</h4>
              <p className="text-xs text-gray-400 leading-relaxed hidden md:block">Millisecond-precise synchronization</p>
            </CardContent>
          </Card>
          
          <Card className="group glass border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 animate-fade-up [animation-delay:0.1s]">
            <CardContent className="p-3 md:p-6 text-center">
              <div className="relative mb-2 md:mb-4">
                <MessageCircle className="text-blue-400 text-lg md:text-3xl mx-auto group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="font-semibold text-white mb-1 text-xs md:text-base">Voice & Chat</h4>
              <p className="text-xs text-gray-400 leading-relaxed hidden md:block">Real-time communication</p>
            </CardContent>
          </Card>
          
          <Card className="group glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 animate-fade-up [animation-delay:0.2s]">
            <CardContent className="p-3 md:p-6 text-center">
              <div className="relative mb-2 md:mb-4">
                <Shield className="text-purple-400 text-lg md:text-3xl mx-auto group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="font-semibold text-white mb-1 text-xs md:text-base">Private Rooms</h4>
              <p className="text-xs text-gray-400 leading-relaxed hidden md:block">Secure & encrypted</p>
            </CardContent>
          </Card>
          
          <Card className="group glass border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 animate-fade-up [animation-delay:0.3s]">
            <CardContent className="p-3 md:p-6 text-center">
              <div className="relative mb-2 md:mb-4">
                <Sparkles className="text-orange-400 text-lg md:text-3xl mx-auto group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="font-semibold text-white mb-1 text-xs md:text-base">Universal Player</h4>
              <p className="text-xs text-gray-400 leading-relaxed hidden md:block">All platforms supported</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 md:mt-16 opacity-60 pb-8">
          <p className="text-xs md:text-sm text-gray-400">Built with modern web technologies for the best watching experience</p>
        </div>
      </div>
    </div>
  );
}
