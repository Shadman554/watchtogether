import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, Film, Loader2, Wifi, WifiOff, Zap, RotateCcw, RotateCw } from "lucide-react";

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
  console.log('UniversalVideoPlayer received videoUrl:', videoUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [syncMode, setSyncMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedVideoUrl, setExtractedVideoUrl] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'extracting' | 'success' | 'failed'>('idle');

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
    
    // Streaming platforms (beenar.net, yourupload, myflixerz, etc.)
    if (url.includes('beenar.net') || url.includes('streamtape.com') || url.includes('mixdrop.co') || 
        url.includes('doodstream.com') || url.includes('upstream.to') || url.includes('fembed.com') ||
        url.includes('yourupload.com') || url.includes('myflixerz.to')) {
      return 'iframe';
    }
    
    // Default to iframe for other URLs
    return 'iframe';
  };

  const videoType = getVideoType(videoUrl);

  // Extract direct video URL from streaming sites
  const extractDirectVideoUrl = async (embedUrl: string): Promise<string | null> => {
    try {
      setExtractionStatus('extracting');
      
      if (embedUrl.includes('yourupload.com')) {
        // Extract yourupload video ID and construct direct URL
        const videoId = embedUrl.match(/embed\/([^?\/]+)/)?.[1];
        if (videoId) {
          try {
            const proxyUrl = `/api/extract-video?url=${encodeURIComponent(embedUrl)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.videoUrl) {
              setExtractionStatus('success');
              return data.videoUrl;
            }
          } catch (e) {
            console.log('Proxy extraction failed');
          }
        }
      }
      
      if (embedUrl.includes('myflixerz.to')) {
        // Try multiple extraction methods for myflixerz
        try {
          console.log('Attempting myflixerz extraction...');
          
          // Method 1: Direct HTML extraction
          const extractUrl = `/api/extract-video?url=${encodeURIComponent(embedUrl)}`;
          const response = await fetch(extractUrl);
          const data = await response.json();
          
          if (data.success && data.videoUrl) {
            console.log('HTML extraction successful:', data.videoUrl);
            setExtractionStatus('success');
            return data.videoUrl;
          }
          
          // Method 2: Try common myflixerz embed patterns
          const movieId = embedUrl.match(/watch-movie\/[^\/]+-(\d+)\./)?.[1];
          if (movieId) {
            const embedPatterns = [
              `https://myflixerz.to/ajax/embed/episode/${movieId}/servers`,
              `https://myflixerz.to/ajax/v2/episode/servers/${movieId}`,
              `https://myflixerz.to/embed/movie/${movieId}`,
              `https://myflixerz.to/v2/embed/movie/${movieId}`
            ];
            
            for (const pattern of embedPatterns) {
              try {
                const patternResponse = await fetch(`/api/extract-video?url=${encodeURIComponent(pattern)}`);
                const patternData = await patternResponse.json();
                
                if (patternData.success && patternData.videoUrl) {
                  console.log('Pattern extraction successful:', patternData.videoUrl);
                  setExtractionStatus('success');
                  return patternData.videoUrl;
                }
              } catch (e) {
                continue;
              }
            }
          }
          
          console.log('All myflixerz extraction methods failed');
        } catch (e) {
          console.log('Myflixerz extraction error:', e);
        }
      }
      
      setExtractionStatus('failed');
      return null;
      
    } catch (e) {
      console.log('Could not extract direct URL:', e);
      setExtractionStatus('failed');
      return null;
    }
  };

  // Attempt to extract direct video URL for iframe videos 
  useEffect(() => {
    if (videoType === 'iframe' && videoUrl && extractionStatus === 'idle') {
      // Enable extraction for supported sites
      extractDirectVideoUrl(videoUrl).then(directUrl => {
        if (directUrl) {
          setExtractedVideoUrl(directUrl);
          setExtractionStatus('success');
        } else {
          setExtractionStatus('failed');
        }
      });
    }
  }, [videoUrl, videoType, extractionStatus]);

  // Use extracted URL if available, otherwise fall back to original
  const effectiveVideoUrl = extractedVideoUrl || videoUrl;
  const effectiveVideoType = (extractedVideoUrl && extractionStatus === 'success') ? 'direct' : videoType;

  // Reset extraction status when videoUrl changes
  useEffect(() => {
    if (videoUrl) {
      setExtractedVideoUrl(null);
      setExtractionStatus('idle');
    }
  }, [videoUrl]);



  // Control visibility
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Keep controls visible longer on mobile (5 seconds vs 3 seconds)
    const timeout = window.innerWidth <= 768 ? 5000 : 3000;
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, timeout);
  };

  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  // Direct video controls (including extracted iframe videos)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || effectiveVideoType !== 'direct') return;

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

  // Combined sync system - prevents overlapping intervals that cause memory leaks
  useEffect(() => {
    if (!videoUrl || !syncMode) return;

    // Clear any existing interval to prevent memory leaks
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = undefined;
    }

    // Single interval for all video types - reduced frequency to prevent browser overload
    syncIntervalRef.current = window.setInterval(() => {
      try {
        // Only run if page is visible to prevent background resource usage
        if (document.visibilityState !== 'visible') return;

        if (effectiveVideoType === 'iframe' || effectiveVideoType === 'youtube') {
          // For iframe videos, manually update time when playing
          if (isPlaying) {
            setCurrentTime(prev => prev + 1);
            // Set a default duration for iframe videos if not available
            if (duration === 0) {
              setDuration(7200); // 2 hours default
            }
          }
          // Send sync for iframe videos using estimated time
          onSync(currentTime, isPlaying, videoUrl);
        } else {
          // For direct videos, use actual video element
          const video = videoRef.current;
          if (video && video.readyState >= 2) {
            // Send sync for both playing and paused states
            onSync(video.currentTime, !video.paused, videoUrl);
          }
        }
      } catch (error) {
        console.error('Sync interval error (clearing to prevent crashes):', error);
        // Clear the problematic interval immediately
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = undefined;
        }
      }
    }, 2500); // Increased from 1.5s to 2.5s to reduce CPU usage

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = undefined;
      }
    };
  }, [syncMode, videoType, videoUrl, onSync, effectiveVideoType, isPlaying, currentTime, duration]);

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
    const iframe = iframeRef.current;
    
    if (videoType === 'direct' && video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch(console.error);
      }
    } else if (effectiveVideoType === 'iframe') {
      // For iframe videos, provide user feedback and sync state
      const newPlayingState = !isPlaying;
      setIsPlaying(newPlayingState);
      
      // Try to control iframe (likely won't work due to CORS)
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage({
            action: newPlayingState ? 'play' : 'pause',
            currentTime: currentTime
          }, '*');
        } catch (e) {
          // Expected to fail for most streaming sites
        }
      }
      
      if (syncMode) {
        onPlaybackControl(newPlayingState ? "play" : "pause", currentTime, videoUrl);
      }
    } else if (videoType === 'youtube') {
      // For YouTube, try YouTube API control
      setIsPlaying(!isPlaying);
      if (syncMode) {
        onPlaybackControl(isPlaying ? "pause" : "play", currentTime, videoUrl);
      }
    }
  };

  const handleSeek = (values: number[]) => {
    const newTime = values[0];
    setCurrentTime(newTime);
    const video = videoRef.current;
    
    if (video && videoType === 'direct') {
      video.currentTime = newTime;
    }
    
    // Always send sync for seeking regardless of video type
    if (syncMode) {
      onPlaybackControl("seek", newTime, videoUrl);
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    const video = videoRef.current;
    if (video && videoType === 'direct') {
      video.volume = newVolume / 100;
    }
    // For iframe videos, we can't control volume directly, but we still update the UI
  };

  const handleMute = () => {
    const video = videoRef.current;
    
    if (video && videoType === 'direct') {
      if (isMuted) {
        video.muted = false;
        setIsMuted(false);
      } else {
        video.muted = true;
        setIsMuted(true);
      }
    } else {
      // For iframe videos, just toggle the UI state
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    const container = playerContainerRef.current;
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      } else {
        container.requestFullscreen().catch(console.error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  return (
    <div 
      ref={playerContainerRef}
      className="absolute inset-0 flex items-center justify-center cursor-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
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
              {effectiveVideoType === 'direct' && (
                <>
                  <video
                    ref={videoRef}
                    src={effectiveVideoUrl}
                    className="w-full h-full object-contain video-element-landscape"
                    crossOrigin="anonymous"
                    preload="metadata"
                    controls={false}
                  />
                  {extractionStatus === 'success' && extractedVideoUrl && (
                    <div className="absolute top-4 left-4 bg-green-600/80 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                        <span className="text-xs text-white">🎯 Iframe bypassed!</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {effectiveVideoType === 'youtube' && (
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}?autoplay=0&controls=0&enablejsapi=1&playsinline=1&rel=0&origin=${window.location.origin}`}
                  className="w-full h-full video-element-landscape"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              )}
              
              {videoType === 'iframe' && (
                <div className="relative w-full h-full">
                  <iframe
                    ref={iframeRef}
                    src={videoUrl}
                    className="w-full h-full video-element-landscape"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen; clipboard-read; clipboard-write"
                    referrerPolicy="no-referrer-when-downgrade"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    onLoad={() => console.log('Iframe loaded successfully')}
                    onError={(e) => console.error('Iframe failed to load:', e)}
                  />
                  

                  

                  
                  {/* Invisible overlay for iframe interaction */}
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      pointerEvents: showControls ? 'none' : 'auto',
                      zIndex: showControls ? -1 : 1
                    }}
                  />
                </div>
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



        {/* Clean Fullscreen Video - No Controls */}


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