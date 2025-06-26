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
    <div className="min-h-screen bg-gradient-to-br from-cinema-black via-cinema-dark to-accent-purple/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Film className="text-4xl text-accent-purple mr-4" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-accent-purple bg-clip-text text-transparent">
              CineSync Duo
            </h1>
          </div>
          <p className="text-xl text-gray-300">Watch movies together in perfect sync, anywhere in the world</p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Create Room Card */}
          <Card className="bg-cinema-dark/80 backdrop-blur-sm border-gray-700 hover:border-accent-purple transition-all duration-300 hover:shadow-lg hover:shadow-accent-purple/20">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <Plus className="text-2xl text-sync-green mr-3" />
                <h3 className="text-2xl font-semibold">Create Room</h3>
              </div>
              <p className="text-gray-400 mb-6">Start a new sync session and invite your friend to watch together</p>
              <Button 
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-sync-green to-accent-blue text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
              >
                {isCreating ? "Creating..." : "Create New Room"}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="bg-cinema-dark/80 backdrop-blur-sm border-gray-700 hover:border-accent-blue transition-all duration-300 hover:shadow-lg hover:shadow-accent-blue/20">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <LogIn className="text-2xl text-accent-blue mr-3" />
                <h3 className="text-2xl font-semibold">Join Room</h3>
              </div>
              <p className="text-gray-400 mb-6">Enter a room code to join an existing sync session</p>
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter room code..."
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-cinema-gray border-gray-600 text-white placeholder-gray-500 focus:border-accent-blue"
                  maxLength={6}
                />
                <Button 
                  onClick={handleJoinRoom}
                  disabled={isJoining}
                  className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
                >
                  {isJoining ? "Joining..." : "Join Room"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Card className="bg-cinema-dark/60 border-gray-700">
            <CardContent className="p-4">
              <FolderSync className="text-sync-green text-2xl mb-2 mx-auto" />
              <p className="text-sm text-gray-400">Perfect FolderSync</p>
            </CardContent>
          </Card>
          <Card className="bg-cinema-dark/60 border-gray-700">
            <CardContent className="p-4">
              <MessageCircle className="text-accent-blue text-2xl mb-2 mx-auto" />
              <p className="text-sm text-gray-400">Voice & Chat</p>
            </CardContent>
          </Card>
          <Card className="bg-cinema-dark/60 border-gray-700">
            <CardContent className="p-4">
              <Shield className="text-accent-purple text-2xl mb-2 mx-auto" />
              <p className="text-sm text-gray-400">Private Rooms</p>
            </CardContent>
          </Card>
          <Card className="bg-cinema-dark/60 border-gray-700">
            <CardContent className="p-4">
              <Sparkles className="text-warning-orange text-2xl mb-2 mx-auto" />
              <p className="text-sm text-gray-400">AI Suggestions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
