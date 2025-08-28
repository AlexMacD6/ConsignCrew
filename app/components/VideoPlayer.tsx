"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  duration?: number;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  showCustomControls?: boolean;
}

/**
 * A robust video player component with comprehensive error handling and fallback mechanisms.
 * Designed to work seamlessly with TreasureHub's CloudFront video delivery system.
 *
 * Features:
 * - Automatic retry on load failures
 * - Multiple video source validation
 * - Graceful degradation with error states
 * - Custom controls with accessibility support
 * - Progress tracking and seeking
 * - Fullscreen support
 * - Responsive design
 */
export default function VideoPlayer({
  src,
  poster,
  duration,
  title = "Video",
  className = "",
  autoPlay = false,
  controls = true,
  showCustomControls = false,
}: VideoPlayerProps) {
  // Debug logging for props
  console.log("🎥 VideoPlayer initialized with props:");
  console.log("  - src:", src);
  console.log("  - poster:", poster);
  console.log("  - duration:", duration);
  console.log("  - title:", title);
  console.log("  - hasSrc:", !!src);
  console.log("  - srcType:", typeof src);
  console.log("  - srcLength:", src?.length || 0);
  // Core video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for better UX
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [videoRequested, setVideoRequested] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  /**
   * Validates and normalizes the video source URL
   */
  const normalizeVideoUrl = (url: string): string | null => {
    if (!url || typeof url !== "string" || url.trim() === "") {
      console.log("🚫 Invalid URL provided:", {
        url,
        type: typeof url,
        empty: url === "",
      });
      return null;
    }

    // Check for valid video file extensions
    const validExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );

    // Check if it's not an image file
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const isImageFile = imageExtensions.some((ext) =>
      url.toLowerCase().endsWith(ext)
    );

    // Check if URL contains expected video path patterns
    const isVideoPath = url.includes("/videos/") || url.includes("/processed/");

    if (!hasValidExtension || isImageFile || !isVideoPath) {
      return null;
    }

    // Normalize URL - add https:// if missing protocol
    let normalizedUrl = url.trim();
    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    return normalizedUrl;
  };

  /**
   * Generates error message based on error type and context
   */
  const getErrorMessage = (error: MediaError | null, src: string): string => {
    if (!error) return "Unknown video error occurred";

    const baseMessage = (() => {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          return "Video playback was aborted";
        case MediaError.MEDIA_ERR_NETWORK:
          return "Network error occurred while loading video";
        case MediaError.MEDIA_ERR_DECODE:
          return "Video format is not supported or corrupted";
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          return "Video source not found or format not supported";
        default:
          return `Video error (code: ${error.code})`;
      }
    })();

    // Add context based on the source URL
    if (src.includes("/processed/videos/")) {
      if (
        error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
        error.code === MediaError.MEDIA_ERR_NETWORK
      ) {
        return "Video is still being processed. Please try the 'Reprocess' button or check back in a few minutes.";
      }
      return `${baseMessage}. The video may still be processing.`;
    }

    return baseMessage;
  };

  /**
   * Retry video loading with exponential backoff
   */
  const retryVideoLoad = async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS || isRetrying) return;

    setIsRetrying(true);
    setHasError(false);
    setErrorMessage("");

    // Wait before retry with exponential backoff
    const delay = RETRY_DELAY * Math.pow(2, retryCount);
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (videoRef.current) {
      videoRef.current.load();
      setRetryCount((prev) => prev + 1);
    }

    setIsRetrying(false);
  };

  /**
   * Handle video errors with comprehensive logging and retry logic
   */
  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const video = e.currentTarget;
    const error = video.error;

    const errorDetails = {
      originalSrc: src,
      normalizedSrc,
      errorCode: error?.code,
      errorMessage: error?.message,
      retryCount,
      networkState: video.networkState,
      readyState: video.readyState,
      currentSrc: video.currentSrc,
      videoExists: video.currentSrc !== "",
      videoTagSrc: video.src,
      hasError: !!error,
    };

    console.log("🔥 VideoPlayer Error Details:");
    console.log("  - originalSrc:", src);
    console.log("  - normalizedSrc:", normalizedSrc);
    console.log("  - errorCode:", error?.code);
    console.log("  - errorMessage:", error?.message);
    console.log("  - retryCount:", retryCount);
    console.log("  - networkState:", video.networkState);
    console.log("  - readyState:", video.readyState);
    console.log("  - currentSrc:", video.currentSrc);
    console.log("  - videoTagSrc:", video.src);
    console.log("  - hasError:", !!error);
    console.log("🔥 Raw MediaError object:", error);
    console.log("🔥 Video element details:");
    console.log("  - tagName:", video.tagName);
    console.log("  - paused:", video.paused);
    console.log("  - ended:", video.ended);

    const message = getErrorMessage(error, normalizedSrc);
    setErrorMessage(message);
    setHasError(true);
    setIsLoading(false);

    // Auto-retry if under limit
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      console.log(
        `Auto-retrying video load (attempt ${
          retryCount + 1
        }/${MAX_RETRY_ATTEMPTS})`
      );
      setTimeout(() => retryVideoLoad(), 1000);
    }
  };

  /**
   * Handle successful video data loading
   */
  const handleLoadedData = () => {
    if (!videoRef.current) return;

    console.log("Video loaded successfully:", {
      src,
      duration: videoRef.current.duration,
      videoWidth: videoRef.current.videoWidth,
      videoHeight: videoRef.current.videoHeight,
    });

    setVideoDuration(videoRef.current.duration);
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0); // Reset retry count on success
  };

  /**
   * Handle video metadata loading
   */
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration);
  };

  /**
   * Handle time updates during playback
   */
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  /**
   * Handle initial click to load and play video
   */
  const handleVideoClick = async () => {
    if (!videoRequested) {
      console.log("🎬 Video requested by user click - loading video");
      setVideoRequested(true);
      setIsLoading(true);
      return;
    }

    // If video is already loaded, toggle play/pause
    handlePlayPause();
  };

  /**
   * Toggle play/pause state
   */
  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Error toggling video playback:", error);
    }
  };

  /**
   * Toggle mute state
   */
  const handleMute = () => {
    if (!videoRef.current) return;
    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  /**
   * Handle volume changes
   */
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);

    // Automatically unmute if volume is changed from 0
    if (newVolume > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  /**
   * Handle seeking to specific time
   */
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  /**
   * Request fullscreen mode
   */
  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  /**
   * Restart video from beginning
   */
  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  /**
   * Manual retry function for error state
   */
  const handleManualRetry = () => {
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
    setErrorMessage("");

    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  /**
   * Trigger video reprocessing
   */
  const handleReprocess = async () => {
    const videoIdMatch = normalizedSrc.match(
      /\/processed\/videos\/([^\.]+)\.mp4/
    );
    if (!videoIdMatch) {
      console.error("Could not extract video ID from URL:", normalizedSrc);
      return;
    }

    const videoId = videoIdMatch[1];
    console.log("🔄 Attempting to reprocess video:", videoId);

    try {
      const response = await fetch("/api/upload/video/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (response.ok) {
        console.log("✅ Video reprocessing started");
        alert(
          "Video reprocessing started. Please wait a few minutes and refresh the page."
        );
      } else {
        console.error("❌ Failed to start video reprocessing");
        alert("Failed to start video reprocessing. Please try again later.");
      }
    } catch (error) {
      console.error("Error triggering video reprocessing:", error);
      alert("Error triggering video reprocessing. Please try again later.");
    }
  };

  /**
   * Format time for display (MM:SS)
   */
  const formatTime = (time: number): string => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Normalize and validate video source
  const [normalizedSrc, setNormalizedSrc] = useState<string>("");

  // Validate and normalize video source on mount and prop changes
  useEffect(() => {
    const normalized = normalizeVideoUrl(src);
    if (!normalized) {
      console.error("Invalid video URL provided:", src);
      setHasError(true);
      setErrorMessage("Invalid video source provided");
      setIsLoading(false);
      setNormalizedSrc("");
      return;
    }

    console.log("🎬 Video URL normalized:");
    console.log("  - original:", src);
    console.log("  - normalized:", normalized);
    console.log("  - hasProtocol:", normalized.startsWith("http"));
    console.log("  - isValid:", !!normalized);
    setNormalizedSrc(normalized);

    // Reset states when src changes
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    setErrorMessage("");
  }, [src]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "KeyM":
          e.preventDefault();
          handleMute();
          break;
        case "KeyF":
          e.preventDefault();
          handleFullscreen();
          break;
        case "KeyR":
          e.preventDefault();
          handleRestart();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying]);

  // Error state display
  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={`relative bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] ${className}`}
      >
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Video Unavailable
          </h3>
          <p className="text-gray-600 text-sm mb-4">{errorMessage}</p>

          {normalizedSrc.includes("/processed/videos/") && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-xs">
                <strong>Note:</strong> This appears to be a processed video URL.
                The raw video should be available and load instead.
              </p>
            </div>
          )}

          {retryCount < MAX_RETRY_ATTEMPTS && (
            <p className="text-gray-500 text-xs mb-4">
              {isRetrying
                ? "Retrying..."
                : `Retry attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}`}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#b8932f] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRetrying ? "Retrying..." : "Retry"}
            </button>

            {normalizedSrc.includes("/processed/videos/") && (
              <button
                onClick={handleReprocess}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Reprocess Video
              </button>
            )}
          </div>

          <p className="text-gray-400 text-xs mt-4">
            Press <kbd className="bg-gray-200 px-1 rounded">Space</kbd> to play,
            <kbd className="bg-gray-200 px-1 rounded ml-1">M</kbd> to mute,
            <kbd className="bg-gray-200 px-1 rounded ml-1">F</kbd> for
            fullscreen
          </p>
        </div>
      </div>
    );
  }

  // Don't render if there's no valid source
  if (!normalizedSrc) {
    return (
      <div
        ref={containerRef}
        className={`relative bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] ${className}`}
      >
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Video Source
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            No valid video source was provided.
          </p>
          <p className="text-gray-400 text-xs">
            Original source: {src || "null"}
          </p>
        </div>
      </div>
    );
  }

  // Show click-to-load preview before video is requested
  if (!videoRequested) {
    return (
      <div className={`w-full max-w-sm mx-auto ${className}`}>
        {/* iPhone-style video container */}
        <div
          ref={containerRef}
          className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl overflow-hidden cursor-pointer shadow-2xl ring-1 ring-white/10 hover:ring-[#D4AF3D]/30 transition-all duration-300 hover:shadow-[#D4AF3D]/20 hover:shadow-xl group"
          style={{ aspectRatio: "9/16" }} // iPhone video aspect ratio
          onClick={handleVideoClick}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleVideoClick();
            }
          }}
          aria-label={`Click to load video: ${title}`}
        >
          {/* Always show TH logo instead of poster for consistent branding */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white p-6">
              {/* TreasureHub Logo */}
              <div className="mb-6">
                <img
                  src="/TreasureHubLogo.png"
                  alt="TreasureHub"
                  className="w-48 h-48 mx-auto opacity-90 group-hover:opacity-100 transition-opacity object-contain"
                  onError={(e) => {
                    console.log("Logo failed to load, showing fallback");
                    // Replace with TH text fallback if logo fails
                    e.currentTarget.outerHTML = `<div class="w-24 h-24 mx-auto opacity-90 group-hover:opacity-100 transition-opacity bg-[#D4AF3D]/30 rounded-xl flex items-center justify-center border border-[#D4AF3D]/40"><span class="text-[#D4AF3D] font-bold text-2xl">TH</span></div>`;
                  }}
                />
              </div>

              <div className="bg-[#D4AF3D]/20 rounded-full p-4 mb-4 group-hover:bg-[#D4AF3D]/30 transition-colors inline-block">
                <Play className="h-12 w-12 text-[#D4AF3D] group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-lg font-semibold mb-2">Click to Play Video</p>
            </div>
          </div>

          {/* Elegant play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-black/40 backdrop-blur-md rounded-full p-6 ring-2 ring-white/20 group-hover:ring-[#D4AF3D]/50 transition-all duration-300 group-hover:scale-110">
              <Play className="h-8 w-8 text-white ml-1 drop-shadow-lg" />
            </div>
          </div>

          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-mono ring-1 ring-white/10">
              {formatTime(duration)}
            </div>
          )}

          {/* Subtle border glow */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />
        </div>
      </div>
    );
  }

  // Main video player
  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      {/* iPhone-style video player */}
      <div
        ref={containerRef}
        className="relative group bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-[#D4AF3D] transition-all duration-300"
        style={{ aspectRatio: "9/16" }} // iPhone video aspect ratio
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={normalizedSrc}
          poster={poster}
          className="w-full h-full object-contain"
          controls={controls && !showCustomControls}
          autoPlay={autoPlay}
          muted={true} // Always start muted
          preload="metadata"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedData={handleLoadedData}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          style={{ pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Video: ${title}`}
        >
          Your browser does not support the video tag.
        </video>

        {/* Enhanced loading overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-white">
              <div className="bg-[#D4AF3D]/20 rounded-full p-4 mb-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#D4AF3D]" />
              </div>
              <p className="text-sm font-medium">Loading video...</p>
              <p className="text-xs opacity-75 mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* Custom controls overlay */}
        {showCustomControls && !isLoading && !hasError && (
          <div className="absolute inset-0 bg-transparent">
            {/* Play/Pause overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={handleVideoClick}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {!isPlaying && (
                <div className="bg-black/60 rounded-full p-4 group-hover:bg-black/80 transition-all transform group-hover:scale-110">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
              )}
            </div>

            {/* Enhanced controls bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-[#D4AF3D] transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={handleMute}
                  className="text-white hover:text-[#D4AF3D] transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                {/* Volume slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-12 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  aria-label="Volume"
                />

                {/* Progress bar */}
                <div className="flex-1 mx-2">
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer hover:bg-white/50 transition-colors"
                    aria-label="Video progress"
                  />
                </div>

                {/* Time display */}
                <span className="text-white text-xs font-mono min-w-[60px] text-right">
                  {formatTime(currentTime)}/{formatTime(videoDuration)}
                </span>

                <button
                  onClick={handleFullscreen}
                  className="text-white hover:text-[#D4AF3D] transition-colors"
                  aria-label="Fullscreen"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced duration badge for non-custom controls */}
        {duration && !showCustomControls && (
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-mono ring-1 ring-white/10">
            {formatTime(duration)}
          </div>
        )}

        {/* Subtle border glow */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />
      </div>
    </div>
  );
}
