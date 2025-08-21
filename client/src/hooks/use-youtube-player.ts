import { useState, useEffect, useRef } from "react";
import { loadYouTubeAPI } from "@/lib/youtube-utils";

interface YouTubePlayerOptions {
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubePlayer(videoId: string, options: YouTubePlayerOptions = {}) {
  const [player, setPlayer] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (!videoId) return;

    const initializePlayer = async () => {
      try {
        await loadYouTubeAPI();
        
        const newPlayer = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
              setIsReady(true);
              
              // Start time tracking
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              
              intervalRef.current = window.setInterval(() => {
                try {
                  // Only update if page is visible to prevent background resource usage
                  if (document.visibilityState !== 'visible') return;
                  
                  if (event.target && typeof event.target.getCurrentTime === 'function') {
                    const currentTime = event.target.getCurrentTime();
                    const duration = event.target.getDuration();
                    
                    options.onTimeUpdate?.(currentTime);
                    if (duration !== options.onDurationChange) {
                      options.onDurationChange?.(duration);
                    }
                  }
                } catch (error) {
                  console.error('YouTube interval error (clearing to prevent crashes):', error);
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = undefined;
                  }
                }
              }, 1000); // Reduced from 500ms to 1000ms to prevent CPU overload
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                options.onPlay?.();
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                options.onPause?.();
              }
            },
          },
        });
      } catch (error) {
        console.error('Failed to initialize YouTube player:', error);
      }
    };

    initializePlayer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }, [player]);

  return { player, isReady };
}
