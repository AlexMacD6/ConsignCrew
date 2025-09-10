"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

interface VideoData {
  id: string;
  src: string;
  poster?: string;
  title?: string;
  duration?: number;
}

interface VideoCarouselProps {
  videos: VideoData[];
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  showCustomControls?: boolean;
  maxHeight?: string;
  isAdmin?: boolean;
}

export default function VideoCarousel({
  videos = [],
  className = "",
  autoPlay = false,
  controls = true,
  showCustomControls = false,
  maxHeight = "500px",
  isAdmin = false,
}: VideoCarouselProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [posterError, setPosterError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Return early if no videos
  if (!videos || videos.length === 0) {
    return (
      <div className={`w-full max-w-sm mx-auto ${className}`}>
        <div
          className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex items-center justify-center"
          style={{ aspectRatio: "9/16", minHeight: "300px" }}
        >
          <div className="text-center text-white p-6">
            <div className="text-gray-400 mb-4">
              <Play className="h-16 w-16 mx-auto opacity-50" />
            </div>
            <p className="text-lg font-medium opacity-75">
              No videos available
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  // Helper function to validate poster URL
  const isValidPosterUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return (
        url.startsWith("http") &&
        (url.includes(".jpg") ||
          url.includes(".jpeg") ||
          url.includes(".png") ||
          url.includes(".webp"))
      );
    } catch {
      return false;
    }
  };

  // Handle click to load video
  const handleVideoClick = () => {
    if (!showVideo) {
      console.log("🎬 Loading video for the first time");
      setShowVideo(true);
      return;
    }

    // If video is already loaded, toggle play/pause
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Navigation functions
  const goToPrevious = () => {
    if (currentVideoIndex > 0) {
      const newIndex = currentVideoIndex - 1;
      console.log("🎬 Going to previous video:", newIndex);
      setCurrentVideoIndex(newIndex);
      setShowVideo(false); // Reset to overlay for new video
      setIsPlaying(false);
      setPosterError(false); // Reset poster error state
    }
  };

  const goToNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      console.log("🎬 Going to next video:", newIndex);
      setCurrentVideoIndex(newIndex);
      setShowVideo(false); // Reset to overlay for new video
      setIsPlaying(false);
      setPosterError(false); // Reset poster error state
    }
  };

  // State to track if we should auto-play when video loads
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  const goToVideo = (index: number, autoPlay: boolean = false) => {
    console.log("🎬 Going to video:", index, autoPlay ? "(auto-play)" : "");
    setCurrentVideoIndex(index);

    if (autoPlay) {
      // If auto-play is requested, load the video and mark for auto-play
      setShowVideo(true);
      setShouldAutoPlay(true);
    } else {
      // Default behavior - reset to overlay for new video
      setShowVideo(false);
      setIsPlaying(false);
      setShouldAutoPlay(false);
    }

    setPosterError(false); // Reset poster error state
  };

  // Auto-play effect when video loads
  useEffect(() => {
    if (shouldAutoPlay && showVideo && videoRef.current) {
      console.log("🎬 Auto-playing video");
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setShouldAutoPlay(false); // Reset flag
        })
        .catch(console.error);
    }
  }, [shouldAutoPlay, showVideo, currentVideoIndex]);

  // Video event handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Download video function (admin only)
  const handleDownloadVideo = async () => {
    if (!isAdmin || !currentVideo) return;

    try {
      console.log("🎬 Downloading video:", currentVideo.id);

      // Create download URL with video info
      const downloadUrl = `/api/admin/download-video?videoId=${encodeURIComponent(
        currentVideo.id
      )}&videoUrl=${encodeURIComponent(currentVideo.src)}`;

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `video-${currentVideo.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("🎬 Download initiated");
    } catch (error) {
      console.error("Error downloading video:", error);
      alert("Failed to download video. Please try again.");
    }
  };

  console.log("🎬 VideoCarousel render:", {
    videosLength: videos.length,
    currentVideoIndex,
    showVideo,
    currentVideoSrc: currentVideo?.src,
    currentVideoPoster: currentVideo?.poster,
    isValidPoster: isValidPosterUrl(currentVideo?.poster),
    posterError,
    showCustomControls,
    shouldShowNavigation: videos.length > 1,
    allVideoIds: videos.map((v) => v.id),
  });

  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative group bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-[#D4AF3D] transition-all duration-300"
        style={{ aspectRatio: "9/16" }}
        tabIndex={0}
      >
        {!showVideo ? (
          /* Overlay State - Show logo and click to play */
          <div
            className="relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 cursor-pointer flex items-center justify-center"
            onClick={handleVideoClick}
          >
            {/* Poster image if available and valid */}
            {isValidPosterUrl(currentVideo?.poster) && !posterError && (
              <>
                <img
                  src={currentVideo.poster}
                  alt={currentVideo.title || `Video ${currentVideoIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    console.log(
                      "Poster image failed to load:",
                      currentVideo.poster
                    );
                    setPosterError(true);
                  }}
                  onLoad={() => {
                    console.log(
                      "Poster image loaded successfully:",
                      currentVideo.poster
                    );
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              </>
            )}

            {/* Overlay content */}
            <div className="relative z-10 text-center text-white p-6">
              {/* TreasureHub Logo */}
              <div className="mb-6">
                <img
                  src="/TreasureHubLogo.png"
                  alt="TreasureHub"
                  className="w-32 h-32 mx-auto opacity-90 group-hover:opacity-100 transition-opacity object-contain"
                  onError={(e) => {
                    console.log("Logo failed to load, showing fallback");
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = document.createElement("div");
                    fallback.className =
                      "w-32 h-32 mx-auto opacity-90 group-hover:opacity-100 transition-opacity bg-[#D4AF3D]/30 rounded-xl flex items-center justify-center border border-[#D4AF3D]/40";
                    fallback.innerHTML =
                      '<span class="text-[#D4AF3D] font-bold text-4xl">TH</span>';
                    target.parentNode?.insertBefore(fallback, target);
                  }}
                />
              </div>

              {/* Play button */}
              <div className="bg-[#D4AF3D]/20 rounded-full p-4 mb-4 group-hover:bg-[#D4AF3D]/30 transition-colors inline-block">
                <Play className="h-12 w-12 text-[#D4AF3D] group-hover:scale-110 transition-transform" />
              </div>

              <p className="text-lg font-semibold mb-2">Click to Play Video</p>

              {/* Video counter */}
              {videos.length > 1 && (
                <p className="text-sm text-gray-300">
                  Video {currentVideoIndex + 1} of {videos.length}
                </p>
              )}
            </div>

            {/* Hover play overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-md rounded-full p-6 ring-2 ring-white/20 group-hover:ring-[#D4AF3D]/50 transition-all duration-300 group-hover:scale-110">
                <Play className="h-8 w-8 text-white ml-1 drop-shadow-lg" />
              </div>
            </div>
          </div>
        ) : (
          /* Video State - Show actual video */
          <>
            <video
              ref={videoRef}
              src={currentVideo?.src}
              poster={currentVideo?.poster}
              className="w-full h-full object-contain"
              controls={controls && !showCustomControls}
              autoPlay={autoPlay}
              muted={isMuted}
              preload="metadata"
              playsInline
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={showCustomControls ? handleVideoClick : undefined}
              style={{ pointerEvents: showCustomControls ? "none" : "auto" }}
            >
              Your browser does not support the video tag.
            </video>

            {/* Custom controls overlay */}
            {showCustomControls && (
              <div className="absolute inset-0 bg-transparent">
                {/* Play/Pause overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={handleVideoClick}
                >
                  {!isPlaying && (
                    <div className="bg-black/60 rounded-full p-4 group-hover:bg-black/80 transition-all transform group-hover:scale-110">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  )}
                </div>

                {/* Controls bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={handleVideoClick}
                      className="text-white hover:text-[#D4AF3D] transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />

                    <span className="text-white text-xs font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <button
                      onClick={handleMute}
                      className="text-white hover:text-[#D4AF3D] transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />

                    <button
                      onClick={handleFullscreen}
                      className="text-white hover:text-[#D4AF3D] transition-colors"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {/* Overlay Navigation Arrows - Similar to Image Carousel */}
        {videos.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              disabled={currentVideoIndex === 0}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-30 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              disabled={currentVideoIndex === videos.length - 1}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-30 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next video"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Video Counter Overlay */}
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {currentVideoIndex + 1} / {videos.length}
            </div>

            {/* Dots Indicator - Similar to Image Carousel */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToVideo(index, true); // Auto-play when clicking dots
                  }}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentVideoIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to video ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigation Controls - Always show if multiple videos */}
      {videos.length > 1 &&
        (() => {
          console.log(
            "🎬 Rendering navigation controls for",
            videos.length,
            "videos"
          );
          return (
            <div className="mt-4">
              {/* Previous/Next buttons */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={goToPrevious}
                  disabled={currentVideoIndex === 0}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="text-sm text-gray-600 font-medium">
                  {currentVideoIndex + 1} of {videos.length}
                </span>

                <button
                  onClick={goToNext}
                  disabled={currentVideoIndex === videos.length - 1}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })()}

      {/* Admin Download Button */}
      {isAdmin && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleDownloadVideo}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#D4AF3D] hover:bg-[#B8941F] rounded-lg transition-colors shadow-sm"
            title="Download video (Admin only)"
          >
            <Download className="h-4 w-4" />
            Download Video
          </button>
        </div>
      )}
    </div>
  );
}
