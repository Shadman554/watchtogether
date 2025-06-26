// YouTube IFrame API utility functions
export function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      // Wait for the API to be ready
      const checkAPI = () => {
        if (window.YT && window.YT.Player) {
          resolve();
        } else {
          setTimeout(checkAPI, 100);
        }
      };
      checkAPI();
      return;
    }

    // Set up the callback
    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => reject(new Error('Failed to load YouTube API'));
    document.head.appendChild(script);
  });
}

export function extractYouTubeVideoId(url: string): string | null {
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const regex of regexes) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

export function createYouTubeEmbedUrl(videoId: string, options: Record<string, any> = {}): string {
  const params = new URLSearchParams({
    autoplay: '0',
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    ...options,
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
