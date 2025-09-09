"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  Video,
  Plus,
} from "lucide-react";
import { Button } from "./ui/button";

interface UploadedVideo {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "completed" | "error";
  progress: number;
  errorMessage?: string;
  uploadedUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  frameUrls?: string[];
}

interface BulkVideoUploadProps {
  onVideosUploaded: (
    videos: Array<{
      id: string;
      src: string;
      poster?: string;
      duration?: number;
      title?: string;
      frameUrls?: string[];
    }>
  ) => void;
  maxVideos?: number;
  maxFileSizeMB?: number;
  className?: string;
  listingId?: string;
}

export default function BulkVideoUpload({
  onVideosUploaded,
  maxVideos = 5,
  maxFileSizeMB = 100,
  className = "",
  listingId,
}: BulkVideoUploadProps) {
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate video file
  const validateVideoFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("video/")) {
      return "Please select a valid video file";
    }

    // Check file size
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxFileSizeMB}MB`;
    }

    // Check if we've reached the max number of videos
    if (videos.length >= maxVideos) {
      return `Maximum ${maxVideos} videos allowed`;
    }

    return null;
  };

  // Create video preview
  const createVideoPreview = (
    file: File
  ): Promise<{ preview: string; duration: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);

      video.preload = "metadata";
      video.onloadedmetadata = () => {
        // Create a canvas to capture the first frame
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        video.currentTime = 1; // Seek to 1 second to get a good frame
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const preview = canvas.toDataURL("image/jpeg", 0.8);
          resolve({ preview, duration: video.duration });
        } else {
          reject(new Error("Could not create video preview"));
        }

        URL.revokeObjectURL(url);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load video"));
      };

      video.src = url;
    });
  };

  // Handle file selection
  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles = Array.from(fileList);

      for (const file of newFiles) {
        const validationError = validateVideoFile(file);
        if (validationError) {
          console.error("Video validation error:", validationError);
          continue;
        }

        try {
          const { preview, duration } = await createVideoPreview(file);

          const videoData: UploadedVideo = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview,
            status: "uploading",
            progress: 0,
            duration,
          };

          setVideos((prev) => [...prev, videoData]);

          // Start upload
          uploadVideo(videoData);
        } catch (error) {
          console.error("Error creating video preview:", error);
        }
      }
    },
    [videos.length, maxVideos]
  );

  // Upload video
  const uploadVideo = async (videoData: UploadedVideo) => {
    try {
      console.log("🎬 Starting video upload:", {
        fileName: videoData.file.name,
        fileSize: videoData.file.size,
        fileType: videoData.file.type,
        listingId: listingId,
      });

      // Validate file before upload
      if (!videoData.file || !(videoData.file instanceof File)) {
        throw new Error("Invalid file object");
      }

      if (!videoData.file.type.startsWith("video/")) {
        throw new Error("File must be a video");
      }

      if (videoData.file.size === 0) {
        throw new Error("File is empty");
      }

      if (videoData.file.size > maxFileSizeMB * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxFileSizeMB}MB limit`);
      }

      const formData = new FormData();
      formData.append("video", videoData.file);
      if (listingId) {
        formData.append("listingId", listingId);
        console.log("🎬 Including listingId in upload:", listingId);
      }

      // Simulate upload progress
      const updateProgress = (progress: number) => {
        setVideos((prev) =>
          prev.map((v) => (v.id === videoData.id ? { ...v, progress } : v))
        );
      };

      // Simulate progress
      for (let i = 0; i <= 90; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        updateProgress(i);
      }

      console.log("🎬 Sending upload request to /api/upload/video/bulk");

      const response = await fetch("/api/upload/video/bulk", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log(
        "🎬 Upload response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("🎬 Upload error details:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          console.error("🎬 Could not parse error response:", parseError);
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("🎬 Upload successful:", result);

      updateProgress(100);

      // Extract keyframes for AI analysis (similar to single video upload)
      try {
        console.log("🎬 Starting keyframe extraction for AI analysis...");

        // Extract frames using browser Canvas API
        const { extractVideoFrames, uploadFramesToS3, uploadThumbnailToS3 } =
          await import("@/lib/browser-video-processor");

        console.log("🎬 Extracting frames from video file...");
        const frameData = await extractVideoFrames(videoData.file, 5);
        console.log("🎬 Extracted frames:", frameData);

        // Upload frames to S3
        console.log("🎬 Uploading frames to S3...");
        const uploadedFrameUrls = await uploadFramesToS3(
          frameData.frameUrls,
          result.videoId
        );
        console.log("🎬 Uploaded frame URLs:", uploadedFrameUrls);

        // Upload thumbnail to S3
        console.log("🎬 Uploading thumbnail to S3...");
        const uploadedThumbnailUrl = await uploadThumbnailToS3(
          frameData.thumbnailUrl,
          result.videoId
        );
        console.log("🎬 Uploaded thumbnail URL:", uploadedThumbnailUrl);

        // Update video record with frame information
        const updateResponse = await fetch(
          `/api/upload/video/status/${result.videoId}`,
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
          const updateResult = await updateResponse.json();
          console.log("🎬 Video processing completed:", updateResult);

          setVideos((prev) =>
            prev.map((v) =>
              v.id === videoData.id
                ? {
                    ...v,
                    status: "completed",
                    uploadedUrl: result.videoUrl,
                    thumbnailUrl:
                      uploadedThumbnailUrl ||
                      frameData.thumbnailUrl ||
                      v.preview,
                    progress: 100,
                    frameUrls: uploadedFrameUrls, // Store frame URLs for AI analysis
                    duration: frameData.duration,
                  }
                : v
            )
          );
        } else {
          throw new Error("Failed to update video record with frame data");
        }
      } catch (frameError) {
        console.error("🎬 Keyframe extraction failed:", frameError);
        // Don't fail the entire upload if keyframe extraction fails
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoData.id
              ? {
                  ...v,
                  status: "completed",
                  uploadedUrl: result.videoUrl,
                  thumbnailUrl: result.thumbnailUrl || v.preview,
                  progress: 100,
                }
              : v
          )
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoData.id
            ? {
                ...v,
                status: "error",
                errorMessage:
                  error instanceof Error ? error.message : "Upload failed",
              }
            : v
        )
      );
    }
  };

  // Remove video
  const removeVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  // Retry upload
  const retryUpload = (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (video) {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? {
                ...v,
                status: "uploading",
                progress: 0,
                errorMessage: undefined,
              }
            : v
        )
      );
      uploadVideo(video);
    }
  };

  // Submit all completed videos
  const handleSubmit = () => {
    const completedVideos = videos
      .filter((v) => v.status === "completed" && v.uploadedUrl)
      .map((v) => ({
        id: v.id,
        src: v.uploadedUrl!,
        poster: v.thumbnailUrl || v.preview, // Use server thumbnail or fallback to client preview
        duration: v.duration,
        title: v.file.name,
        frameUrls: v.frameUrls || [], // Include frame URLs for AI analysis
      }));

    onVideosUploaded(completedVideos);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  // File input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const completedVideosCount = videos.filter(
    (v) => v.status === "completed"
  ).length;
  const canSubmit = completedVideosCount > 0;

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
          isDragging
            ? "border-[#D4AF3D] bg-[#D4AF3D]/5"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="text-center">
          <div className="w-16 h-16 bg-[#D4AF3D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="h-8 w-8 text-[#D4AF3D]" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Multiple Videos
          </h3>

          <p className="text-gray-600 mb-4">
            Drag and drop video files here, or click to browse
          </p>

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#D4AF3D] hover:bg-[#c4a235] text-white"
            disabled={videos.length >= maxVideos}
          >
            <Plus className="h-4 w-4 mr-2" />
            Choose Videos
          </Button>

          <div className="mt-4 text-sm text-gray-500">
            <p>
              Maximum {maxVideos} videos • Up to {maxFileSizeMB}MB each
            </p>
            <p>Supported formats: MP4, MOV, AVI, WebM</p>
          </div>
        </div>
      </div>

      {/* Video list */}
      {videos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Uploaded Videos ({videos.length}/{maxVideos})
            </h4>
            {canSubmit && (
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Use {completedVideosCount} Video
                {completedVideosCount !== 1 ? "s" : ""}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Video preview */}
                  <div className="flex-shrink-0 w-20 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    {video.preview ? (
                      <img
                        src={video.preview}
                        alt="Video preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Video info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 truncate">
                          {video.file.name}
                        </h5>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{formatFileSize(video.file.size)}</span>
                          {video.duration && (
                            <span>{Math.round(video.duration)}s</span>
                          )}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-2">
                        {video.status === "uploading" && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        )}

                        {video.status === "completed" && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Completed</span>
                          </div>
                        )}

                        {video.status === "error" && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">Failed</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeVideo(video.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {video.status === "uploading" && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#D4AF3D] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${video.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {video.progress}%
                        </span>
                      </div>
                    )}

                    {/* Error message */}
                    {video.status === "error" && video.errorMessage && (
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-red-600">
                          {video.errorMessage}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryUpload(video.id)}
                          className="text-xs"
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
