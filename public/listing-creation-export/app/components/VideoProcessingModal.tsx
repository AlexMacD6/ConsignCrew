"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface VideoProcessingModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    videoId: string;
    frameUrls: string[];
    thumbnailUrl: string;
    duration: number;
  }) => void;
}

interface ProcessingStatus {
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  error?: string;
}

export default function VideoProcessingModal({
  videoId,
  isOpen,
  onClose,
  onComplete,
}: VideoProcessingModalProps) {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: "pending",
    progress: 0,
    message: "Initializing video processing...",
  });

  useEffect(() => {
    console.log("VideoProcessingModal useEffect triggered:", {
      isOpen,
      videoId,
    });
    if (!isOpen || !videoId) return;

    let pollInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const startProcessing = async () => {
      console.log("Starting video processing for videoId:", videoId);
      try {
        // Start video processing
        setProcessingStatus({
          status: "processing",
          progress: 0,
          message: "Starting video processing...",
        });

        console.log(
          "Making API call to /api/upload/video/process with videoId:",
          videoId
        );
        const processResponse = await fetch("/api/upload/video/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          throw new Error(
            errorData.error || "Failed to start video processing"
          );
        }

        const processData = await processResponse.json();
        console.log("Video processing started:", processData);
        console.log("Process response status:", processResponse.status);

        // Simulate progress updates
        let progress = 0;
        progressInterval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress < 90) {
            setProcessingStatus((prev) => ({
              ...prev,
              progress: Math.min(progress, 90),
              message: getProgressMessage(progress),
            }));
          }
        }, 1000);

        // Poll for completion
        pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `/api/upload/video/status/${videoId}`
            );
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();

              if (statusData.status === "completed") {
                clearInterval(pollInterval);
                clearInterval(progressInterval);

                setProcessingStatus({
                  status: "completed",
                  progress: 100,
                  message: "Video processing completed!",
                });

                console.log("Video processing completed in modal:", statusData);
                console.log("Frame URLs from status:", statusData.urls?.frames);
                console.log(
                  "Frame count:",
                  statusData.urls?.frames?.length || 0
                );

                // Call onComplete with the video data
                onComplete({
                  videoId: statusData.videoId,
                  frameUrls: statusData.urls?.frames || [],
                  thumbnailUrl: statusData.urls?.thumbnail || "",
                  duration: statusData.metadata?.duration || 0,
                });

                // Close modal after a short delay
                setTimeout(() => {
                  onClose();
                }, 2000);
              } else if (statusData.status === "failed") {
                clearInterval(pollInterval);
                clearInterval(progressInterval);

                setProcessingStatus({
                  status: "failed",
                  progress: 0,
                  message: "Video processing failed",
                  error: statusData.error || "Unknown error occurred",
                });
              }
            }
          } catch (error) {
            console.error("Error checking video status:", error);
            // If we can't check status, show error after a few attempts
            if (error instanceof Error && error.message.includes("fetch")) {
              clearInterval(pollInterval);
              clearInterval(progressInterval);

              setProcessingStatus({
                status: "failed",
                progress: 0,
                message: "Failed to check video processing status",
                error: "Network error while checking processing status",
              });
            }
          }
        }, 2000);
      } catch (error) {
        clearInterval(pollInterval);
        clearInterval(progressInterval);

        setProcessingStatus({
          status: "failed",
          progress: 0,
          message: "Failed to start video processing",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    startProcessing();

    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen, videoId, onComplete, onClose]);

  const getProgressMessage = (progress: number): string => {
    if (progress < 20) return "Downloading video...";
    if (progress < 40) return "Analyzing video metadata...";
    if (progress < 60) return "Compressing video...";
    if (progress < 80) return "Generating thumbnail...";
    if (progress < 90) return "Extracting key frames...";
    return "Finalizing processing...";
  };

  console.log("VideoProcessingModal render check:", { isOpen, videoId });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Video Processing
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={processingStatus.status === "processing"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                processingStatus.status === "failed"
                  ? "bg-red-500"
                  : processingStatus.status === "completed"
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${processingStatus.progress}%` }}
            />
          </div>

          {/* Status Icon and Message */}
          <div className="flex items-center gap-3">
            {processingStatus.status === "processing" && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            {processingStatus.status === "completed" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {processingStatus.status === "failed" && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-700">
              {processingStatus.message}
            </span>
          </div>

          {/* Progress Percentage */}
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(processingStatus.progress)}%
            </span>
          </div>

          {/* Error Message */}
          {processingStatus.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{processingStatus.error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {processingStatus.status === "failed" && (
              <button
                onClick={() => {
                  setProcessingStatus({
                    status: "pending",
                    progress: 0,
                    message: "Initializing video processing...",
                  });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            )}
            {processingStatus.status !== "processing" && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
