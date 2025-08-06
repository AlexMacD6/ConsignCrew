"use client";

import React, { useState } from "react";
import VideoUpload from "./VideoUpload";

interface VideoData {
  videoId: string;
  videoUrl: string;
  thumbnailUrl: string;
  frameUrls: string[];
  duration: number;
}

export default function VideoUploadTest() {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVideoUploaded = async (data: VideoData) => {
    console.log("Video uploaded successfully:", data);
    setVideoData(data);
    setError(null);
  };

  const handleError = (error: string) => {
    console.error("Video upload error:", error);
    setError(error);
  };

  const testAiAnalysis = async () => {
    if (!videoData) {
      setError("No video data available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate AI analysis with video frames
      const mockListingData = {
        title: "Test Product",
        description: "A test product for video analysis",
        department: "Electronics",
        category: "Computers",
        subCategory: "Laptops",
        condition: "EXCELLENT",
        price: 999,
        brand: "Test Brand",
        photos: {
          hero: { url: "https://example.com/hero.jpg" },
        },
        video: {
          videoId: videoData.videoId,
          frameUrls: videoData.frameUrls,
          thumbnailUrl: videoData.thumbnailUrl,
          duration: videoData.duration,
        },
        additionalInfo: "Testing video frame analysis with AI",
      };

      const response = await fetch("/api/ai/generate-comprehensive-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockListingData),
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAiAnalysis(result);
      console.log("AI analysis result:", result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed");
      console.error("AI analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Video Upload Test</h2>
        <p className="text-gray-600 mb-6">
          Test the video upload functionality with FFmpeg processing and AI
          frame analysis.
        </p>

        <VideoUpload
          onVideoUploaded={handleVideoUploaded}
          onError={handleError}
          disabled={loading}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {videoData && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Video Uploaded Successfully!
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Video ID:</strong> {videoData.videoId}
              </p>
              <p>
                <strong>Duration:</strong> {videoData.duration.toFixed(1)}{" "}
                seconds
              </p>
              <p>
                <strong>Video URL:</strong>{" "}
                <a
                  href={videoData.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {videoData.videoUrl}
                </a>
              </p>
              <p>
                <strong>Thumbnail URL:</strong>{" "}
                <a
                  href={videoData.thumbnailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {videoData.thumbnailUrl}
                </a>
              </p>
              <div>
                <strong>Frame URLs:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  {videoData.frameUrls.map((url, index) => (
                    <li key={index}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Frame {index + 1}: {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={testAiAnalysis}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Test AI Analysis with Video Frames"}
            </button>
          </div>
        )}

        {aiAnalysis && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              AI Analysis Result
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Title:</strong> {aiAnalysis.listingData?.title}
              </p>
              <p>
                <strong>Brand:</strong> {aiAnalysis.listingData?.brand}
              </p>
              <p>
                <strong>Condition:</strong> {aiAnalysis.listingData?.condition}
              </p>
              <p>
                <strong>Estimated Retail Price:</strong> $
                {aiAnalysis.listingData?.estimatedRetailPrice}
              </p>
              <p>
                <strong>List Price:</strong> $
                {aiAnalysis.listingData?.listPrice}
              </p>
              <p>
                <strong>Features:</strong>{" "}
                {aiAnalysis.listingData?.features?.join(", ")}
              </p>
              <p>
                <strong>Keywords:</strong>{" "}
                {aiAnalysis.listingData?.keywords?.join(", ")}
              </p>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                View Full Analysis
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(aiAnalysis, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
