"use client";

import React, { useState } from "react";
import BulkVideoUpload from "./BulkVideoUpload";
import VideoCarousel from "./VideoCarousel";
import { Button } from "./ui/button";

interface VideoData {
  id: string;
  src: string;
  poster?: string;
  duration?: number;
  title?: string;
}

/**
 * Example component showing how to use BulkVideoUpload and VideoCarousel together
 * This can be used in listing creation/editing forms
 */
export default function VideoUploadExample() {
  const [uploadedVideos, setUploadedVideos] = useState<VideoData[]>([]);
  const [showUpload, setShowUpload] = useState(true);

  const handleVideosUploaded = (videos: VideoData[]) => {
    setUploadedVideos(videos);
    setShowUpload(false);
  };

  const handleReset = () => {
    setUploadedVideos([]);
    setShowUpload(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Multi-Video Upload & Carousel Example
        </h2>
        <p className="text-gray-600">
          This example shows how to use the bulk video upload and video carousel
          components for listings that require multiple videos.
        </p>
      </div>

      {showUpload ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Step 1: Upload Multiple Videos
          </h3>
          <BulkVideoUpload
            onVideosUploaded={handleVideosUploaded}
            maxVideos={5}
            maxFileSizeMB={100}
            listingId="example-listing-id" // Optional: associate with listing
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Step 2: Video Carousel Preview
            </h3>
            <Button onClick={handleReset} variant="outline" className="text-sm">
              Upload Different Videos
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Carousel */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">
                Interactive Video Carousel
              </h4>
              <VideoCarousel
                videos={uploadedVideos}
                controls={true}
                showCustomControls={false}
                autoPlay={false}
              />
            </div>

            {/* Video Information */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">
                Uploaded Videos ({uploadedVideos.length})
              </h4>
              <div className="space-y-3">
                {uploadedVideos.map((video, index) => (
                  <div
                    key={video.id}
                    className="bg-gray-50 rounded-lg p-4 border"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">
                          Video {index + 1}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {video.title}
                        </p>
                        {video.duration && (
                          <p className="text-xs text-gray-500 mt-1">
                            Duration: {Math.round(video.duration)}s
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {video.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">
                  Integration Notes:
                </h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Videos are uploaded to AWS S3</li>
                  <li>• Thumbnails are auto-generated</li>
                  <li>• Carousel supports navigation & thumbnails</li>
                  <li>• iPhone 9:16 aspect ratio optimized</li>
                  <li>• Click-to-load saves bandwidth</li>
                  <li>• Default muted for better UX</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
