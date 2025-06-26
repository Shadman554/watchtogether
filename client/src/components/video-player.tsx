import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, Film } from "lucide-react";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";

interface VideoPlayerProps {
  videoId: string;
  onSync: (currentTime: number, isPlaying: boolean, videoId?: string) => void;
  onPlaybackControl: (action: string, currentTime?: number, videoId?: string) => void;
  syncStatus: {
    isSync: boolean;
    latency: number;
    remoteTime: number;
    remoteIsPlaying: boolean;
  };
}

export default function VideoPlayer({ videoId, onSync, onPlaybackControl, syncStatus }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [syncMode, setSyncMode] = useState(true);
  const [reactions, setReactions] = useState<{ emoji: string; id: string; x: number; y: number }[]>([]);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number>();

  const { player, isReady } = useYouTubePlayer(videoId, {
    onPlay: () => {
      setIsPlaying(true);
      if (syncMode) {
        onPlaybackControl("play", currentTime, videoId);
      }
    },
    onPause: () => {
      setIsPlaying(false);
      if (syncMode) {
        onPlaybackControl("pause", currentTime, videoId);
      }
    },
    onTimeUpdate: (time: number) => {
      setCurrentTime(time);
      if (syncMode && Math.abs(time - syncStatus.remoteTime) > 1) {
        onSync(time, isPlaying, videoId);
      }
    },
    onDurationChange: setDuration,
  });

  // Sync with remote player
  useEffect(() => {
    if (!player || !syncMode) return;

    const timeDiff = Math.abs(currentTime - syncStatus.remoteTime);
    if (timeDiff > 1) {
      player.seekTo(syncStatus.remoteTime);
    }

    if (isPlaying !== syncStatus.remoteIsPlaying) {
      if (syncStatus.remoteIsPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [syncStatus, player, syncMode]);

  // Control visibility
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  const handlePlay = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleSeek = (values: number[]) => {
    const newTime = values[0];
    setCurrentTime(newTime);
    if (player) {
      player.seekTo(newTime);
      if (syncMode) {
        onPlaybackControl("seek", newTime, videoId);
      }
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
    }
  };

  const handleMute = () => {
    if (!player) return;
    
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainerRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show placeholder if no video
  if (!videoId) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Video Loaded</h3>
          <p className="text-gray-500">Use the Library button to load a YouTube video</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={playerContainerRef}
      className="absolute inset-0 flex items-center justify-center cursor-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="relative w-full h-full max-w-7xl max-h-full">
        {/* YouTube Player Container */}
        <div className="w-full h-full bg-cinema-dark rounded-lg overflow-hidden">
          <div id="youtube-player" className="w-full h-full" />
        </div>

        {/* Reactions Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {reactions.map((reaction) => (
            <div
              key={reaction.id}
              className="absolute text-4xl animate-bounce"
              style={{ left: reaction.x, top: reaction.y }}
            >
              {reaction.emoji}
            </div>
          ))}
        </div>

        {/* Video Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cinema-black/90 via-cinema-black/50 to-transparent p-6 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="relative">
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              {/* Sync indicators */}
              {syncMode && syncStatus.remoteTime > 0 && (
                <div 
                  className="absolute top-0 h-2 w-1 bg-accent-blue rounded-full animate-pulse" 
                  style={{ left: `${(syncStatus.remoteTime / duration) * 100}%` }}
                  title="Friend's position"
                />
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Main playback controls */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-accent-purple"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={handlePlay}
                className="bg-accent-purple hover:bg-accent-purple/80 rounded-full w-12 h-12 p-0"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-accent-purple"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMute}
                  className="text-white hover:text-accent-blue"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <div className="w-20">
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>

              {/* Sync Controls */}
              <div className="flex items-center space-x-2 bg-cinema-dark/80 backdrop-blur-sm rounded-full px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${syncMode ? 'bg-sync-green' : 'bg-gray-500'}`} />
                <span className="text-xs font-medium">Sync Mode</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSyncMode(!syncMode)}
                  className="w-8 h-4 p-0"
                >
                  <div className={`w-full h-full rounded-full transition-colors ${
                    syncMode ? 'bg-sync-green' : 'bg-gray-500'
                  }`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                      syncMode ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </div>
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300"
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-white hover:text-accent-purple"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
