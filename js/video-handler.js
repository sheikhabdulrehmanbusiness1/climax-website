/* Video Handler - Ensures reliable video playback across page reloads */

class VideoHandler {
  constructor() {
    this.videos = [];
    this.retryAttempts = 3;
    this.retryDelay = 500;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupVideos());
    } else {
      this.setupVideos();
    }
  }

  setupVideos() {
    // Find all videos on the page
    const videoElements = document.querySelectorAll('video');

    videoElements.forEach((video, index) => {
      this.videos.push({
        element: video,
        loaded: false,
        playing: false,
        attempts: 0
      });

      this.setupVideoListeners(video, index);
      this.ensureVideoPlays(video, index);
    });
  }

  setupVideoListeners(video, index) {
    // Handle successful load
    video.addEventListener('loadeddata', () => {
      this.videos[index].loaded = true;
      console.log(`Video ${index} loaded successfully`);
    });

    // Handle play event
    video.addEventListener('play', () => {
      this.videos[index].playing = true;
      console.log(`Video ${index} playing`);
    });

    // Handle pause event
    video.addEventListener('pause', () => {
      // Only retry if video should be autoplaying
      if (video.hasAttribute('autoplay') && !video.paused) {
        this.videos[index].playing = false;
        this.retryPlayback(video, index);
      }
    });

    // Handle errors
    video.addEventListener('error', (e) => {
      console.error(`Video ${index} error:`, e);
      this.handleVideoError(video, index);
    });

    // Handle stalled loading
    video.addEventListener('stalled', () => {
      console.warn(`Video ${index} stalled`);
      this.handleVideoStall(video, index);
    });

    // Handle suspend (when browser stops fetching media data)
    video.addEventListener('suspend', () => {
      if (!this.videos[index].loaded) {
        console.warn(`Video ${index} suspended before loading`);
        this.retryLoad(video, index);
      }
    });
  }

  ensureVideoPlays(video, index) {
    // Force load the video
    video.load();

    // For autoplay videos, ensure they start playing
    if (video.hasAttribute('autoplay')) {
      // Use a promise-based approach for better error handling
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`Video ${index} autoplay successful`);
            this.videos[index].playing = true;
          })
          .catch((error) => {
            console.warn(`Video ${index} autoplay prevented:`, error);
            // Retry after a short delay
            setTimeout(() => this.retryPlayback(video, index), this.retryDelay);
          });
      }
    }
  }

  retryPlayback(video, index) {
    const videoData = this.videos[index];

    if (videoData.attempts >= this.retryAttempts) {
      console.error(`Video ${index} failed after ${this.retryAttempts} attempts`);
      return;
    }

    videoData.attempts++;
    console.log(`Retrying video ${index} playback (attempt ${videoData.attempts})`);

    setTimeout(() => {
      video.load();
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`Video ${index} retry successful`);
            videoData.playing = true;
            videoData.attempts = 0; // Reset attempts on success
          })
          .catch((error) => {
            console.warn(`Video ${index} retry failed:`, error);
            if (videoData.attempts < this.retryAttempts) {
              this.retryPlayback(video, index);
            }
          });
      }
    }, this.retryDelay * videoData.attempts);
  }

  handleVideoError(video, index) {
    const videoData = this.videos[index];

    // Get the source element
    const source = video.querySelector('source');
    if (source) {
      const originalSrc = source.src;

      // Add cache-busting parameter
      const cacheBuster = `?t=${Date.now()}`;
      const newSrc = originalSrc.includes('?')
        ? `${originalSrc}&t=${Date.now()}`
        : `${originalSrc}${cacheBuster}`;

      console.log(`Reloading video ${index} with cache buster`);

      // Update source and reload
      source.src = newSrc;
      video.load();

      if (video.hasAttribute('autoplay')) {
        setTimeout(() => {
          video.play().catch(e => {
            console.error(`Video ${index} playback failed after reload:`, e);
          });
        }, 500);
      }
    }
  }

  handleVideoStall(video, index) {
    const videoData = this.videos[index];

    if (videoData.attempts >= this.retryAttempts) {
      return;
    }

    videoData.attempts++;
    console.log(`Handling stalled video ${index}`);

    // Wait a bit and try to continue
    setTimeout(() => {
      if (video.readyState < 2) { // HAVE_CURRENT_DATA
        video.load();
        if (video.hasAttribute('autoplay')) {
          video.play().catch(e => console.warn(`Video ${index} play after stall failed:`, e));
        }
      }
    }, 1000);
  }

  retryLoad(video, index) {
    const videoData = this.videos[index];

    if (videoData.attempts >= this.retryAttempts) {
      return;
    }

    videoData.attempts++;
    console.log(`Retrying load for video ${index}`);

    setTimeout(() => {
      video.load();
    }, this.retryDelay * videoData.attempts);
  }

  // Public method to manually restart all videos
  restartAllVideos() {
    console.log('Restarting all videos');
    this.videos.forEach((videoData, index) => {
      const video = videoData.element;
      video.currentTime = 0;
      video.load();

      if (video.hasAttribute('autoplay')) {
        video.play().catch(e => {
          console.warn(`Video ${index} restart failed:`, e);
        });
      }
    });
  }

  // Public method to check video health
  checkVideoHealth() {
    console.log('Video Health Check:');
    this.videos.forEach((videoData, index) => {
      const video = videoData.element;
      console.log(`Video ${index}:`, {
        loaded: videoData.loaded,
        playing: videoData.playing,
        paused: video.paused,
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error
      });
    });
  }
}

// Initialize video handler
window.videoHandler = new VideoHandler();

// Add visibility change handler to restart videos when tab becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.videoHandler) {
    // Give the page a moment to settle before restarting videos
    setTimeout(() => {
      window.videoHandler.restartAllVideos();
    }, 300);
  }
});

// Add page show event handler for back/forward cache
window.addEventListener('pageshow', (event) => {
  // If page was restored from cache
  if (event.persisted && window.videoHandler) {
    setTimeout(() => {
      window.videoHandler.restartAllVideos();
    }, 300);
  }
});
