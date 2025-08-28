"use client";
import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Debug logging
  React.useEffect(() => {
    console.log("VideoPlayer props:", { src, poster, duration, title });
  }, [src, poster, duration, title]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedData = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video failed to load:", src, e);
    // Try to get more specific error information
    const video = e.currentTarget;
    if (video.error) {
      console.error("Video error code:", video.error.code);

      // Only log error message if it's not empty
      const errorMessage = video.error.message;
      if (errorMessage && errorMessage.trim()) {
        console.error("Video error message:", errorMessage);
      } else {
        // Provide meaningful error messages based on error code
        const errorCodeMessages = {
          1: "MEDIA_ERR_ABORTED - Video playback was aborted",
          2: "MEDIA_ERR_NETWORK - Network error occurred while downloading video",
          3: "MEDIA_ERR_DECODE - Video decoding error occurred",
          4: "MEDIA_ERR_SRC_NOT_SUPPORTED - Video format not supported or source not found",
        };
        const meaningfulError =
          errorCodeMessages[
            video.error.code as keyof typeof errorCodeMessages
          ] || `Unknown video error (code: ${video.error.code})`;
        console.error("Video error:", meaningfulError);
      }
    }
    setHasError(true);
    setIsLoading(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  if (hasError) {
    return (
      <div
        className={`relative bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center p-8">
          <div className="text-gray-400 mb-2">
            <Play className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 text-sm">Video could not be loaded</p>
          <p className="text-gray-400 text-xs mt-1">
            Please check your connection and try again
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load(); // Reload the video
              }
            }}
            className="mt-3 px-4 py-2 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#b8932f] transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative group bg-black rounded-lg overflow-hidden ${className}`}
      onClick={(e) => e.stopPropagation()} // Prevent modal opening
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        controls={controls && !showCustomControls}
        autoPlay={autoPlay}
        muted={isMuted}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        style={{ pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()} // Prevent modal opening on video click
      >
        Your browser does not support the video tag.
      </video>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Custom controls overlay (if enabled) */}
      {showCustomControls && !isLoading && !hasError && (
        <div className="absolute inset-0 bg-transparent">
          {/* Play/Pause overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={handlePlayPause}
          >
            {!isPlaying && (
              <div className="bg-black/60 rounded-full p-4 group-hover:bg-black/80 transition-colors">
                <Play className="h-8 w-8 text-white ml-1" />
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={handleRestart}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={handleMute}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <div className="flex-1 mx-3">
                <input
                  type="range"
                  min="0"
                  max={videoDuration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </span>

              <button
                onClick={handleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duration badge (if not using custom controls) */}
      {duration && !showCustomControls && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {formatTime(duration)}
        </div>
      )}

      {/* Title overlay */}
      {title && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {title}
        </div>
      )}
    </div>
  );
}
