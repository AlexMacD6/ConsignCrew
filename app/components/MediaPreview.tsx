"use client";
import React from "react";
import PhotoDisplay from "./PhotoDisplay";
import VideoDisplay from "./VideoDisplay";

interface MediaPreviewProps {
  photos: {
    hero: { file: File | null; key: string | null; url: string | null };
    back: { file: File | null; key: string | null; url: string | null };
    proof: { file: File | null; key: string | null; url: string | null };
    additional: Array<{ file: File; key: string | null; url: string | null }>;
  };
  videoData: {
    frameUrls: string[];
    videoUrl?: string | null;
  };
  showPhotos: boolean;
  setShowPhotos: (show: boolean) => void;
  showVideoFrames: boolean;
  setShowVideoFrames: (show: boolean) => void;
  showVideoPlayer: boolean;
  setShowVideoPlayer: (show: boolean) => void;
  removePhoto: (
    type: "hero" | "back" | "proof" | "additional",
    index?: number
  ) => void;
  goToPhotoType: (type: "hero" | "back" | "proof" | "additional") => void;
  safeMap: <T, U>(
    array: T[] | undefined | null,
    callback: (item: T, index: number) => U
  ) => U[];
}

export default function MediaPreview({
  photos,
  videoData,
  showPhotos,
  setShowPhotos,
  showVideoFrames,
  setShowVideoFrames,
  showVideoPlayer,
  setShowVideoPlayer,
  removePhoto,
  goToPhotoType,
  safeMap,
}: MediaPreviewProps) {
  return (
    <>
      {/* Photo Gallery - Collapsible */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">
            Uploaded Photos (
            {
              Object.values(photos).filter(
                (p) => p && (Array.isArray(p) ? p.length > 0 : p.file || p.url)
              ).length
            }
            )
          </h3>
          <button
            type="button"
            onClick={() => setShowPhotos(!showPhotos)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showPhotos ? "−" : "+"} {showPhotos ? "Hide" : "Show"}
          </button>
        </div>
        {showPhotos && (
          <PhotoDisplay
            photos={photos}
            removePhoto={removePhoto}
            goToPhotoType={goToPhotoType}
            safeMap={safeMap}
          />
        )}
      </div>

      {/* Video Section */}
      {videoData.frameUrls.length > 0 && (
        <VideoDisplay
          videoData={videoData}
          showVideoFrames={showVideoFrames}
          setShowVideoFrames={setShowVideoFrames}
          showVideoPlayer={showVideoPlayer}
          setShowVideoPlayer={setShowVideoPlayer}
        />
      )}
    </>
  );
}
