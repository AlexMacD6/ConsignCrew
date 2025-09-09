"use client";

import React, { useState, useRef, useEffect } from "react";
import { validateVideoFile } from "@/lib/video-upload";
import VideoProcessingModal from "./VideoProcessingModal";

interface VideoUploadProps {
  onVideoUploaded: (videoData: {
    videoId: string;
    frameUrls: string[];
    thumbnailUrl: string;
    duration: number;
  }) => void;
  onError: (error: string) => void;
  onStarted?: () => void;
  disabled?: boolean;
}

interface VideoStatus {
  videoId: string;
  status: "pending" | "processing" | "completed" | "failed";
  urls?: {
    processedVideo: string;
    thumbnail: string;
    frames: string[];
  };
  metadata?: {
    duration: number;
    resolution: string;
    frameCount: number;
  };
  error?: string;
}

export default function VideoUpload({
  onVideoUploaded,
  onError,
  onStarted,
  disabled = false,
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      onError(validation.error!);
      return;
    }

    setSelectedFile(file);
    setVideoStatus(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadVideo = async () => {
    console.log("uploadVideo function called with file:", selectedFile?.name);
    if (!selectedFile) return;

    console.log("Starting video upload process");
    setIsUploading(true);
    setUploadProgress(0);

    // Notify parent that upload has started
    onStarted?.();

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await fetch("/api/upload/video/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { presignedUrl, videoId } = await presignedResponse.json();
      console.log("Got presigned URL and videoId:", videoId);

      // Step 2: Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video to S3");
      }

      console.log("Video upload to S3 completed successfully");
      setUploadProgress(100);
      setIsUploading(false);

      // Step 3: Start browser-based frame extraction immediately
      console.log(
        "Starting browser-based frame extraction for videoId:",
        videoId
      );
      setIsProcessing(true);

      // Start browser-based frame extraction
      try {
        // Extract frames using browser Canvas API
        const { extractVideoFrames, uploadFramesToS3, uploadThumbnailToS3 } =
          await import("@/lib/browser-video-processor");

        console.log("Extracting frames from video file...");
        const frameData = await extractVideoFrames(selectedFile, 5);
        console.log("Extracted frames:", frameData);

        // Upload frames to S3
        console.log("Uploading frames to S3...");
        const uploadedFrameUrls = await uploadFramesToS3(
          frameData.frameUrls,
          videoId
        );
        console.log("Uploaded frame URLs:", uploadedFrameUrls);

        // Upload thumbnail to S3
        console.log("Uploading thumbnail to S3...");
        const uploadedThumbnailUrl = await uploadThumbnailToS3(
          frameData.thumbnailUrl,
          videoId
        );
        console.log("Uploaded thumbnail URL:", uploadedThumbnailUrl);

        // Update video record with frame information
        const updateResponse = await fetch(
          `/api/upload/video/status/${videoId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "completed",
              frameUrls: uploadedFrameUrls,
              frameCount: uploadedFrameUrls.length,
              duration: frameData.duration,
              thumbnailUrl: uploadedThumbnailUrl || frameData.thumbnailUrl,
            }),
          }
        );

        if (updateResponse.ok) {
          const response = await updateResponse.json();
          console.log("Video processing completed:", response);

          setIsProcessing(false);
          onVideoUploaded?.(response.video);
        } else {
          throw new Error("Failed to update video record");
        }
      } catch (error) {
        console.error("Failed to process video frames:", error);
        setIsProcessing(false);
        onError(
          error instanceof Error
            ? error.message
            : "Video frame extraction failed"
        );
      }
    } catch (error) {
      console.error("Video upload error:", error);
      setIsUploading(false);
      setIsProcessing(false);
      onError(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const startStatusPolling = (videoId: string) => {
    statusCheckInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/upload/video/status/${videoId}`);
        if (response.ok) {
          const status = await response.json();
          setVideoStatus(status);

          if (status.status === "completed") {
            setIsProcessing(false);
            if (statusCheckInterval.current) {
              clearInterval(statusCheckInterval.current);
            }
            console.log("Video processing completed:", {
              videoId: status.videoId,
              frameUrls: status.urls.frames,
              frameCount: status.urls.frames?.length || 0,
              thumbnailUrl: status.urls.thumbnail,
              duration: status.metadata.duration,
            });
            onVideoUploaded({
              videoId: status.videoId,
              frameUrls: status.urls.frames,
              thumbnailUrl: status.urls.thumbnail,
              duration: status.metadata.duration,
            });
          } else if (status.status === "failed") {
            setIsProcessing(false);
            if (statusCheckInterval.current) {
              clearInterval(statusCheckInterval.current);
            }
            onError(status.error || "Video processing failed");
          }
        }
      } catch (error) {
        console.error("Status check error:", error);
      }
    }, 2000); // Check every 2 seconds
  };

  const handleRemoveVideo = () => {
    setSelectedFile(null);
    setVideoStatus(null);
    setIsUploading(false);
    setIsProcessing(false);
    setUploadProgress(0);
    setShowProcessingModal(false);
    setCurrentVideoId(null);
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessingComplete = (data: {
    videoId: string;
    frameUrls: string[];
    thumbnailUrl: string;
    duration: number;
  }) => {
    setIsProcessing(false);
    setShowProcessingModal(false);
    setCurrentVideoId(null);
    onVideoUploaded(data);
  };

  const handleProcessingModalClose = () => {
    setShowProcessingModal(false);
    setCurrentVideoId(null);
    setIsProcessing(false);
  };

  return (
    <div className="w-full">
      {/* File Selection Area */}
      {!selectedFile && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-treasure-500 bg-treasure-50"
              : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="space-y-2">
            <div className="text-4xl">🎥</div>
            <h3 className="text-lg font-medium text-gray-900">Upload Video</h3>
            <p className="text-sm text-gray-500">
              Drag and drop a video file here, or click to select
            </p>
            <p className="text-xs text-gray-400">
              Supports .mp4 and .mov files up to 250 MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* Selected File Display */}
      {selectedFile && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎥</div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveVideo}
              className="text-red-500 hover:text-red-700"
              disabled={isUploading || isProcessing}
            >
              ✕
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-treasure-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-treasure-500"></div>
                <span className="text-sm text-gray-600">
                  Processing video...
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This may take a few minutes. We're compressing your video and
                extracting frames for AI analysis.
              </p>
            </div>
          )}

          {/* Processing Status Display */}
          {videoStatus && (
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                {videoStatus.status === "completed" && (
                  <div className="text-green-500">✓</div>
                )}
                {videoStatus.status === "failed" && (
                  <div className="text-red-500">✕</div>
                )}
                <span className="text-sm font-medium">
                  {videoStatus.status === "completed" && "Processing Complete"}
                  {videoStatus.status === "failed" && "Processing Failed"}
                  {videoStatus.status === "processing" && "Processing..."}
                </span>
              </div>

              {videoStatus.status === "completed" && videoStatus.metadata && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Duration: {Math.round(videoStatus.metadata.duration)}s</p>
                  <p>Resolution: {videoStatus.metadata.resolution}</p>
                  <p>Frames extracted: {videoStatus.metadata.frameCount}</p>
                </div>
              )}

              {videoStatus.status === "failed" && videoStatus.error && (
                <p className="mt-2 text-sm text-red-600">{videoStatus.error}</p>
              )}
            </div>
          )}

          {/* Upload Button */}
          {!isUploading &&
            !isProcessing &&
            videoStatus?.status !== "completed" && (
              <button
                type="button"
                onClick={uploadVideo}
                disabled={disabled}
                className="mt-4 w-full bg-treasure-500 text-white py-2 px-4 rounded-md hover:bg-treasure-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Upload and Process Video
              </button>
            )}
        </div>
      )}

      {/* Video Processing Modal */}
      {showProcessingModal && currentVideoId && (
        <VideoProcessingModal
          videoId={currentVideoId}
          isOpen={showProcessingModal}
          onClose={handleProcessingModalClose}
          onComplete={handleProcessingComplete}
        />
      )}
    </div>
  );
}
