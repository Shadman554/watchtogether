import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, Film, Loader2, Wifi, WifiOff, Zap } from "lucide-react";

interface UniversalVideoPlayerProps {
  videoUrl: string;
  onSync: (currentTime: number, isPlaying: boolean, videoUrl?: string) => void;
  onPlaybackControl: (action: string, currentTime?: number, videoUrl?: string) => void;
  syncStatus: {
    isSync: boolean;
    latency: number;
    remoteTime: number;
    remoteIsPlaying: boolean;
  };
}

export default function UniversalVideoPlayer({ videoUrl, onSync, onPlaybackControl, syncStatus }: UniversalVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [syncMode, setSyncMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number>();
  const syncIntervalRef = useRef<number>();

  // Detect video type
  const getVideoType = (url: string) => {
    if (!url) return 'none';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    
    // Direct video files
    if (url.match(/\.(mp4|webm|ogg|avi|mov|mkv)(\?|$)/i)) {
      return 'direct';
    }
    
    // Streaming platforms (beenar.net, etc.)
    if (url.includes('beenar.net') || url.includes('streamtape.com') || url.includes('mixdrop.co') || 
        url.includes('doodstream.com') || url.includes('upstream.to') || url.includes('fembed.com')) {
      return 'iframe';
    }
    
    // Default to iframe for other URLs
    return 'iframe';
  };

  const videoType = getVideoType(videoUrl);

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

  // Direct video controls
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoType !== 'direct') return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const newTime = video.currentTime;
      setCurrentTime(newTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      console.log('Video play event - sending to remote');
      if (syncMode) {
        onPlaybackControl("play", video.currentTime, videoUrl);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      console.log('Video pause event - sending to remote');
      if (syncMode) {
        onPlaybackControl("pause", video.currentTime, videoUrl);
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [videoUrl, videoType, syncMode, onSync, onPlaybackControl, syncStatus.remoteTime]);

  // Enhanced heartbeat sync system - sends sync updates every 1.5 seconds
  useEffect(() => {
    if (!syncMode || videoType !== 'direct') return;

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      if (video) {
        // Send sync for both playing and paused states
        onSync(video.currentTime, !video.paused, videoUrl);
      }
    }, 1500);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncMode, videoType, videoUrl, onSync]);

  // Enhanced sync with remote player - better tolerance and quicker response
  useEffect(() => {
    if (!syncMode || !syncStatus.isSync) return;

    const video = videoRef.current;
    if (video && videoType === 'direct') {
      const timeDiff = Math.abs(currentTime - syncStatus.remoteTime);
      
      // More aggressive sync - sync if difference is greater than 1 second
      if (syncStatus.remoteTime > 0 && timeDiff > 1) {
        video.currentTime = syncStatus.remoteTime;
        console.log(`Syncing video time: ${syncStatus.remoteTime} (diff: ${timeDiff}s)`);
      }

      // Sync play/pause state with debouncing
      if (syncStatus.remoteTime > 0) {
        if (syncStatus.remoteIsPlaying && video.paused) {
          video.play().catch(console.error);
          console.log('Remote play triggered - syncing playback');
        } else if (!syncStatus.remoteIsPlaying && !video.paused) {
          video.pause();
          console.log('Remote pause triggered - syncing playback');
        }
      }
    }
  }, [syncStatus.remoteTime, syncStatus.remoteIsPlaying, syncStatus.isSync, syncMode, currentTime, videoType]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video || videoType !== 'direct') return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  };

  const handleSeek = (values: number[]) => {
    const newTime = values[0];
    setCurrentTime(newTime);
    const video = videoRef.current;
    if (video && videoType === 'direct') {
      video.currentTime = newTime;
      if (syncMode) {
        onPlaybackControl("seek", newTime, videoUrl);
      }
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    const video = videoRef.current;
    if (video && videoType === 'direct') {
      video.volume = newVolume / 100;
    }
  };

  const handleMute = () => {
    const video = videoRef.current;
    if (!video || videoType !== 'direct') return;
    
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    } else {
      video.muted = true;
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
  if (!videoUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Video Loaded</h3>
          <p className="text-gray-500">Use the Library button to load a video from any streaming site</p>
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
        {/* Premium Video Player Container */}
        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20">
          {!videoUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center animate-fade-up">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6 mx-auto animate-float">
                  <Film className="w-16 h-16 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Watch</h3>
                <p className="text-gray-400 mb-6">Load a video to start your synchronized viewing experience</p>
                <div className="glass rounded-xl p-4 border border-purple-500/30">
                  <p className="text-sm text-gray-300 mb-2">Supported platforms:</p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">YouTube</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg">Streaming Sites</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg">Direct Videos</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {videoType === 'direct' && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  preload="metadata"
                  controls={false}
                />
              )}
              
              {videoType === 'youtube' && (
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}?autoplay=0&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0`}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              )}
              
              {videoType === 'iframe' && (
                <iframe
                  ref={iframeRef}
                  src={videoUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              )}
            </>
          )}
        </div>

        {/* Premium Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 glass-dark flex items-center justify-center animate-fade-up">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Loading premium experience...</p>
            </div>
          </div>
        )}

        {/* Connection Status Indicator */}
        {videoUrl && (
          <div className="absolute top-4 right-4 z-10">
            <div className={`glass rounded-xl px-3 py-2 border ${
              syncStatus.isSync 
                ? 'border-green-500/30 bg-green-500/10' 
                : 'border-red-500/30 bg-red-500/10'
            }`}>
              <div className="flex items-center space-x-2">
                {syncStatus.isSync ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs font-medium ${
                  syncStatus.isSync ? 'text-green-400' : 'text-red-400'
                }`}>
                  {syncStatus.isSync ? 'Synced' : 'Offline'}
                </span>
                {syncStatus.isSync && (
                  <span className="text-xs text-gray-400">±{syncStatus.latency}ms</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Premium Video Controls - Only show for direct videos */}
        {videoType === 'direct' && videoUrl && (
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 transition-all duration-500 ${
              showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {/* Enhanced Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-200 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{formatTime(currentTime)}</span>
                  {syncMode && (
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-400">Sync</span>
                    </div>
                  )}
                </div>
                <span className="font-mono">{formatTime(duration)}</span>
              </div>
              <div className="relative group">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full [&_.bg-purple-600]:bg-gradient-to-r [&_.bg-purple-600]:from-purple-500 [&_.bg-purple-600]:to-blue-500"
                />
                {/* Enhanced Sync indicators */}
                {syncMode && syncStatus.remoteTime > 0 && (
                  <div 
                    className="absolute top-0 h-3 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg animate-pulse group-hover:animate-bounce" 
                    style={{ left: `${(syncStatus.remoteTime / duration) * 100}%` }}
                    title="Friend's position"
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Friend
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Skip back */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSeek([Math.max(0, currentTime - 10)])}
                  className="text-white hover:text-purple-400 hover:bg-purple-500/20 rounded-xl p-3 transition-all duration-300 hover:scale-105"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                {/* Main play/pause */}
                <Button
                  onClick={handlePlay}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 rounded-full w-14 h-14 p-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-110 group"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Play className="w-7 h-7 ml-1 group-hover:scale-110 transition-transform" />
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
        )}

        {/* Universal sync status for all video types */}
        <div className="absolute top-4 right-4 bg-cinema-dark/80 backdrop-blur-sm rounded-full px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${syncMode ? 'bg-sync-green animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs font-medium text-white">
              {videoType === 'iframe' ? 'Embedded Player' : 'Native Player'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string {
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const regex of regexes) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return '';
}