import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, Film } from "lucide-react";

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

  // Heartbeat sync system - sends sync updates every 2 seconds
  useEffect(() => {
    if (!syncMode || videoType !== 'direct') return;

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        onSync(video.currentTime, !video.paused, videoUrl);
      }
    }, 2000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncMode, videoType, videoUrl, onSync]);

  // Sync with remote player
  useEffect(() => {
    if (!syncMode || !syncStatus.isSync) return;

    const video = videoRef.current;
    if (video && videoType === 'direct' && syncStatus.remoteTime > 0) {
      const timeDiff = Math.abs(currentTime - syncStatus.remoteTime);
      
      // Only sync if difference is significant
      if (timeDiff > 2) {
        video.currentTime = syncStatus.remoteTime;
        console.log('Syncing video time:', syncStatus.remoteTime);
      }

      // Sync play/pause state
      if (isPlaying !== syncStatus.remoteIsPlaying) {
        if (syncStatus.remoteIsPlaying && video.paused) {
          video.play().catch(console.error);
          console.log('Remote play triggered');
        } else if (!syncStatus.remoteIsPlaying && !video.paused) {
          video.pause();
          console.log('Remote pause triggered');
        }
      }
    }
  }, [syncStatus, syncMode, currentTime, isPlaying, videoType]);

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
        {/* Video Player Container */}
        <div className="w-full h-full bg-cinema-dark rounded-lg overflow-hidden">
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
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-cinema-black/50 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Video Controls - Only show for direct videos */}
        {videoType === 'direct' && (
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