"use client";

import React, { useState } from "react";
import VideoUpload from "./VideoUpload";

interface VideoData {
  videoId: string;
  frameUrls: string[];
  thumbnailUrl: string;
  duration: number;
}

export default function VideoUploadExample() {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoUploaded = (data: VideoData) => {
    setVideoData(data);
    setError(null);
    console.log("Video uploaded successfully:", data);

    // Here you would typically:
    // 1. Store the video data in your form state
    // 2. Pass the frame URLs to your AI analysis
    // 3. Update the UI to show the video thumbnail
  };

  const handleVideoError = (errorMessage: string) => {
    setError(errorMessage);
    setVideoData(null);
    console.error("Video upload error:", errorMessage);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Video Upload Example</h2>

      {/* Video Upload Component */}
      <div className="mb-6">
        <VideoUpload
          onVideoUploaded={handleVideoUploaded}
          onError={handleVideoError}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Video Preview */}
      {videoData && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Uploaded Video</h3>

          {/* Thumbnail */}
          <div className="mb-4">
            <img
              src={videoData.thumbnailUrl}
              alt="Video thumbnail"
              className="w-full max-w-md rounded-lg shadow-md"
            />
          </div>

          {/* Video Details */}
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Video ID:</strong> {videoData.videoId}
            </p>
            <p>
              <strong>Duration:</strong> {Math.round(videoData.duration)}{" "}
              seconds
            </p>
            <p>
              <strong>Frames extracted:</strong> {videoData.frameUrls.length}
            </p>
          </div>

          {/* Frame URLs for AI Analysis */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">AI Analysis Frames:</h4>
            <div className="grid grid-cols-5 gap-2">
              {videoData.frameUrls.map((frameUrl, index) => (
                <div key={index} className="text-center">
                  <img
                    src={frameUrl}
                    alt={`Frame ${index}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <p className="text-xs mt-1">Frame {index}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Integration with AI Analysis */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">
              AI Analysis Integration
            </h4>
            <p className="text-sm text-blue-700">
              The video frames above will be automatically included in the AI
              analysis when generating comprehensive listings. The AI will
              analyze both photos and video frames to provide enhanced product
              insights.
            </p>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Integration Instructions</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Import the VideoUpload component</li>
          <li>Add it to your form with onVideoUploaded and onError handlers</li>
          <li>Store the video data in your form state</li>
          <li>Pass frame URLs to your AI analysis service</li>
          <li>Include video metadata in your listing submission</li>
        </ol>
      </div>
    </div>
  );
}
