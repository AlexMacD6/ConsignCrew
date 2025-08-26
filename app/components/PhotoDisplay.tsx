"use client";
import React from "react";

interface Photo {
  file: File | null;
  key: string | null;
  url: string | null;
}

interface PhotoDisplayProps {
  photos: {
    hero: Photo;
    back: Photo;
    proof: Photo;
    additional: Array<{ file: File; key: string | null; url: string | null }>;
  };
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

export default function PhotoDisplay({
  photos,
  removePhoto,
  goToPhotoType,
  safeMap,
}: PhotoDisplayProps) {
  return (
    <>
      {/* Photo Review Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">
            Photo Review (
            {
              [
                photos.hero,
                photos.back,
                photos.proof,
                ...(photos.additional || []),
              ].filter(
                (p) => p && (Array.isArray(p) ? p.length > 0 : p.file || p.url)
              ).length
            }{" "}
            photos)
          </h3>
          <button
            type="button"
            onClick={() => goToPhotoType("hero")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Edit Photos
          </button>
        </div>

        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Hero Photo */}
            {photos.hero && (
              <div className="relative">
                <img
                  src={
                    photos.hero.url ||
                    (photos.hero.file
                      ? URL.createObjectURL(photos.hero.file)
                      : "")
                  }
                  alt="Hero"
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                  1
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto("hero")}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}

            {/* Back Photo */}
            {photos.back && (
              <div className="relative">
                <img
                  src={
                    photos.back.url ||
                    (photos.back.file
                      ? URL.createObjectURL(photos.back.file)
                      : "")
                  }
                  alt="Back"
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                  2
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto("back")}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}

            {/* Proof Photo */}
            {photos.proof && (
              <div className="relative">
                <img
                  src={
                    photos.proof.url ||
                    (photos.proof.file
                      ? URL.createObjectURL(photos.proof.file)
                      : "")
                  }
                  alt="Proof"
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                  3
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto("proof")}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}

            {/* Additional Photos */}
            {safeMap(photos.additional, (photo, index) => (
              <div key={index} className="relative">
                <img
                  src={
                    photo.url ||
                    (photo.file ? URL.createObjectURL(photo.file) : "")
                  }
                  alt={`Additional ${index + 4}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                  {index + 4}
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto("additional", index)}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add More Photos Button */}
          <button
            type="button"
            onClick={() => goToPhotoType("additional")}
            className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            + Add More Photos
          </button>
        </>
      </div>
    </>
  );
}
