"use client";
import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, Trash2, CheckCircle } from "lucide-react";

interface PhotoGalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  originalFilename: string;
  status: string;
  listingId?: string;
  createdAt: string;
}

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhotos: (photos: PhotoGalleryPhoto[]) => void;
  maxSelect?: number;
}

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  onSelectPhotos,
  maxSelect,
}: PhotoGalleryModalProps) {
  const [photos, setPhotos] = useState<PhotoGalleryPhoto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoGalleryPhoto[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"available" | "listed" | "all">(
    "available"
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch photos when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
    }
  }, [isOpen, filter]);

  // Filter photos based on selected filter
  useEffect(() => {
    if (filter === "all") {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter((p) => p.status === filter));
    }
  }, [photos, filter]);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/photo-gallery?status=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch photos");

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error("Error fetching photos:", err);
      setError("Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      // Upload each file
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/photo-gallery", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      // Refresh photos after upload
      await fetchPhotos();
    } catch (err) {
      console.error("Error uploading photos:", err);
      setError(err instanceof Error ? err.message : "Failed to upload photos");
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handlePhotoClick = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);

    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      // Check max selection limit
      if (maxSelect && newSelected.size >= maxSelect) {
        setError(`You can only select up to ${maxSelect} photos`);
        return;
      }
      newSelected.add(photoId);
    }

    setSelectedPhotos(newSelected);
    setError(null);
  };

  const handleSelectAll = () => {
    const availablePhotos = filteredPhotos.filter(
      (p) => p.status === "available"
    );
    if (maxSelect) {
      const limited = availablePhotos.slice(0, maxSelect);
      setSelectedPhotos(new Set(limited.map((p) => p.id)));
    } else {
      setSelectedPhotos(new Set(availablePhotos.map((p) => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedPhotos(new Set());
    setError(null);
  };

  const handleConfirm = () => {
    const selected = photos.filter((p) => selectedPhotos.has(p.id));
    onSelectPhotos(selected);
    onClose();
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (
      !confirm("Are you sure you want to delete this photo from your gallery?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/photo-gallery/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete photo");
      }

      // Remove from selected if it was selected
      const newSelected = new Set(selectedPhotos);
      newSelected.delete(photoId);
      setSelectedPhotos(newSelected);

      // Refresh photos
      await fetchPhotos();
    } catch (err) {
      console.error("Error deleting photo:", err);
      setError(err instanceof Error ? err.message : "Failed to delete photo");
    }
  };

  const getFilterCounts = () => {
    return {
      available: photos.filter((p) => p.status === "available").length,
      listed: photos.filter((p) => p.status === "listed").length,
      all: photos.length,
    };
  };

  const counts = getFilterCounts();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Photo Gallery</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter("available")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "available"
                  ? "bg-[#D4AF3D] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Available ({counts.available})
            </button>
            <button
              onClick={() => setFilter("listed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "listed"
                  ? "bg-[#D4AF3D] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Previously Listed ({counts.listed})
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-[#D4AF3D] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Photos ({counts.all})
            </button>
          </div>

          {/* Upload Button */}
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <div
                className={`px-4 py-2 rounded-lg border-2 border-dashed border-[#D4AF3D] text-center transition-colors ${
                  uploading
                    ? "bg-gray-100 cursor-not-allowed"
                    : "hover:bg-[#D4AF3D]/5"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Upload Photos to Gallery
                      </span>
                    </>
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Photo Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#D4AF3D]" />
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Upload className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No photos in this category</p>
              <p className="text-sm">Upload photos to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => {
                const isSelected = selectedPhotos.has(photo.id);
                const isListed = photo.status === "listed";

                return (
                  <div
                    key={photo.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-[#D4AF3D] ring-2 ring-[#D4AF3D]"
                        : isListed
                        ? "border-gray-300 opacity-60"
                        : "border-gray-200 hover:border-[#D4AF3D]"
                    }`}
                    onClick={() => !isListed && handlePhotoClick(photo.id)}
                  >
                    <div className="aspect-square">
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.originalFilename}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#D4AF3D] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Listed Badge */}
                    {isListed && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                        In Use
                      </div>
                    )}

                    {/* Delete Button */}
                    {!isListed && filter === "available" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        className="absolute bottom-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Filename */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.originalFilename}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Select All Available
              </button>
              <button
                onClick={handleClearSelection}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={selectedPhotos.size === 0}
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedPhotos.size} photo
                {selectedPhotos.size !== 1 ? "s" : ""} selected
                {maxSelect && ` (max ${maxSelect})`}
              </span>
              <button
                onClick={handleConfirm}
                disabled={selectedPhotos.size === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedPhotos.size > 0
                    ? "bg-[#D4AF3D] text-white hover:bg-[#b8932f]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Use Selected Photos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




















