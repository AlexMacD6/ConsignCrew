"use client";
import React from "react";
import { Play } from "lucide-react";

interface VideoData {
  frameUrls: string[];
  videoUrl?: string;
}

interface VideoDisplayProps {
  videoData: VideoData;
  showVideoFrames: boolean;
  setShowVideoFrames: (show: boolean) => void;
  showVideoPlayer: boolean;
  setShowVideoPlayer: (show: boolean) => void;
}

export default function VideoDisplay({
  videoData,
  showVideoFrames,
  setShowVideoFrames,
  showVideoPlayer,
  setShowVideoPlayer,
}: VideoDisplayProps) {
  return (
    <>
      {/* Video Keyframes Section - Collapsible */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">
            Video Keyframes ({videoData.frameUrls.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowVideoFrames(!showVideoFrames)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showVideoFrames ? "Hide" : "Show"}
          </button>
        </div>

        {showVideoFrames && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {videoData.frameUrls.map((frameUrl, index) => (
              <div key={index} className="relative">
                <img
                  src={frameUrl}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Section - Collapsible */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Video Player</h3>
          <button
            type="button"
            onClick={() => setShowVideoPlayer(!showVideoPlayer)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showVideoPlayer ? "Hide" : "Show"}
          </button>
        </div>

        {showVideoPlayer && (
          <div className="relative w-full max-w-md">
            <video
              src={videoData.videoUrl || undefined}
              controls
              className="w-full rounded-lg border border-gray-200"
              style={{ maxHeight: "300px" }}
              preload="metadata"
              crossOrigin="anonymous"
            >
              <source src={videoData.videoUrl || ""} type="video/mp4" />
              <source src={videoData.videoUrl || ""} type="video/quicktime" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Play className="h-3 w-3" />
              Video
            </div>
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {videoData.frameUrls.length} frames
            </div>
          </div>
        )}
      </div>
    </>
  );
}
