"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface IntegratedVideoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  aspectRatio?: "16/9" | "16/10" | "4/3";
  showControls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
}

const IntegratedVideoPlayer: React.FC<IntegratedVideoPlayerProps> = ({
  videoId,
  title = "TreasureHub Demo",
  className = "",
  aspectRatio = "16/10",
  showControls = true,
  autoplay = true,
  muted = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate YouTube URL on client side to avoid hydration mismatch
  useEffect(() => {
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      mute: muted ? "1" : "0",
      controls: showControls ? "1" : "0",
      showinfo: "0", // Hide video title and uploader info
      rel: "0", // Don't show related videos
      modestbranding: "1", // Minimal YouTube branding
      playsinline: "1", // Play inline on mobile
      enablejsapi: "1", // Enable YouTube API
      origin: window.location.origin,
      widget_referrer: window.location.origin,
      color: "white", // White progress bar
      iv_load_policy: "3", // Hide video annotations
      fs: "0", // Disable fullscreen button
      disablekb: "1", // Disable keyboard controls
      loop: "0",
      playlist: videoId, // Required for loop to work
    });

    setYoutubeUrl(
      `https://www.youtube.com/embed/${videoId}?${params.toString()}`
    );
  }, [videoId, autoplay, muted, showControls]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoaded(true);
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause video
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*"
        );
      }
      setIsPlaying(false);
      setShowOverlay(true);
    } else {
      // Play video
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          "*"
        );
      }
      setIsPlaying(true);
      setShowOverlay(false);
    }
  };

  // Handle video click to toggle play/pause
  const handleVideoClick = () => {
    handlePlayPause();
  };

  // Custom play/pause button overlay
  const PlayPauseOverlay = () => (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl cursor-pointer group"
      initial={{ opacity: 0 }}
      animate={{ opacity: showOverlay ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleVideoClick}
    >
      <motion.div
        className="w-24 h-24 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl group-hover:bg-white transition-all duration-300 border-4 border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isPlaying ? (
          // Pause icon
          <svg
            className="w-10 h-10 text-gray-900"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          // Play icon
          <svg
            className="w-10 h-10 text-gray-900 ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </motion.div>
    </motion.div>
  );

  // Aspect ratio styles
  const aspectRatioStyles = {
    "16/9": { aspectRatio: "16/9" },
    "16/10": { aspectRatio: "16/10" },
    "4/3": { aspectRatio: "4/3" },
  };

  return (
    <motion.div
      className={`relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-treasure-500/10 to-treasure-600/10 p-3 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Main video container */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black cursor-pointer group"
        style={aspectRatioStyles[aspectRatio]}
        onClick={handleVideoClick}
      >
        {/* YouTube iframe - only render when URL is ready */}
        {youtubeUrl && (
          <iframe
            ref={iframeRef}
            src={youtubeUrl}
            title={title}
            className="w-full h-full rounded-2xl"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        )}

        {/* Custom play/pause button overlay */}
        <PlayPauseOverlay />

        {/* Subtle gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

        {/* Custom controls overlay */}
        {showControls && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/20">
              TreasureHub
            </div>
          </div>
        )}

        {/* Video status indicator */}
        <div className="absolute bottom-4 left-4">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/20">
            {isPlaying ? "Playing" : "Paused"}
          </div>
        </div>
      </div>

      {/* Enhanced decorative elements */}
      <motion.div
        className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-treasure-500 to-treasure-600 rounded-full opacity-30"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-6 -right-6 w-8 h-8 bg-gradient-to-br from-treasure-600 to-treasure-700 rounded-full opacity-40"
        animate={{
          scale: [1, 1.4, 1],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Additional decorative dots */}
      <motion.div
        className="absolute top-8 -right-2 w-3 h-3 bg-treasure-500 rounded-full opacity-60"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute -bottom-2 left-8 w-2 h-2 bg-treasure-600 rounded-full opacity-50"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />

      {/* Loading state */}
      {(!isLoaded || !youtubeUrl) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
          <div className="text-center">
            <motion.div
              className="w-16 h-16 border-4 border-treasure-500/20 border-t-treasure-500 rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-gray-600 text-sm font-medium">
              Loading video...
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default IntegratedVideoPlayer;
