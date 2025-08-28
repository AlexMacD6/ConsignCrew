"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Play } from "lucide-react";
import RobustImage from "./RobustImage";

interface MediaItem {
  type: "image";
  src: string;
  alt?: string;
}

interface ImageWithMetadata {
  src: string;
  type?: string;
  label?: string | null;
}

interface ImageCarouselProps {
  images: (string | ImageWithMetadata)[];
  alt: string;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showModal?: boolean;
}

export default function ImageCarousel({
  images,
  alt,
  className = "",
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  showModal = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ensure images is an array and filter out empty items
  const validImages = Array.isArray(images) ? images : [];

  // Create media items array: images only
  const mediaItems: (MediaItem & { label?: string | null })[] = validImages
    .filter((item) => {
      const src = typeof item === "string" ? item : item.src;
      return src && src.trim() !== "";
    }) // Filter out empty/undefined image sources
    .map((item, index) => {
      const src = typeof item === "string" ? item : item.src;
      const label = typeof item === "string" ? null : item.label;
      return {
        type: "image" as const,
        src,
        alt: `${alt} - Image ${index + 1}`,
        label,
      };
    });

  const totalItems = mediaItems.length;

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || totalItems <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalItems);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, totalItems]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? totalItems - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === totalItems - 1 ? 0 : prevIndex + 1
    );
  };

  const goToItem = (index: number) => {
    setCurrentIndex(index);
  };

  const openModal = () => {
    if (showModal) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Handle keyboard events for modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500">No media available</span>
      </div>
    );
  }

  const currentItem = mediaItems[currentIndex];

  // Safety check to ensure currentItem is defined
  if (!currentItem || !currentItem.src) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500">No media available</span>
      </div>
    );
  }

  const renderMediaItem = (item: MediaItem & { label?: string | null }) => {
    // Use RobustImage for better error handling
    return (
      <div className="relative w-full h-full">
        <RobustImage
          src={item.src}
          alt={item.alt || "Product image"}
          width={400}
          height={400}
          className="w-full h-full object-cover rounded-lg"
        />
        {item.label && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {item.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`relative overflow-hidden group ${className}`}>
        {/* Main Media */}
        <div className="relative w-full h-full">
          {currentItem.type === "image" ? (
            <div className="relative w-full h-full">
              <RobustImage
                src={currentItem.src}
                alt={currentItem.alt || "Product image"}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer hover:opacity-95"
                onLoad={() => {}}
                onError={() => {}}
              />

              {/* Image Label (e.g., for AI-generated images) */}
              {currentItem.label && (
                <div className="absolute bottom-2 right-2">
                  <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    {currentItem.label}
                  </div>
                </div>
              )}

              {/* Click overlay for modal - only for images */}
              {currentItem.type === "image" && (
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={openModal}
                />
              )}
            </div>
          ) : (
            renderMediaItem(currentItem)
          )}

          {/* Expand Icon (only for images) */}
          {showModal && currentItem.type === "image" && (
            <div
              className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
              onClick={openModal}
            >
              <Maximize2 className="h-4 w-4" />
            </div>
          )}

          {/* Media Counter */}
          {totalItems > 1 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {currentIndex + 1} / {totalItems}
            </div>
          )}

          {/* Navigation Arrows - Fixed positioning relative to container */}
          {showArrows && totalItems > 1 && (
            <>
              {/* Left Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-[calc(50%-20px)] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-30"
                aria-label="Previous media"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-[calc(50%-20px)] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-30"
                aria-label="Next media"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {showDots && totalItems > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-30">
            {mediaItems.map((item, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToItem(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to ${item.type} ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Keyboard Navigation */}
        {
          <div
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                goToPrevious();
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goToNext();
              }
            }}
            className="outline-none"
          />
        }
      </div>

      {/* Modal (only for images) */}
      {isModalOpen && currentItem.type === "image" && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 z-10"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main Image */}
            <div className="relative max-w-full max-h-full">
              <RobustImage
                src={currentItem.src}
                alt={currentItem.alt || "Product image"}
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain"
              />

              {/* Image Counter */}
              {totalItems > 1 && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
                  {currentIndex + 1} / {totalItems}
                </div>
              )}

              {/* Navigation Arrows */}
              {totalItems > 1 && (
                <>
                  {/* Left Arrow */}
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>

                  {/* Right Arrow */}
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200"
                    aria-label="Next media"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {totalItems > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {mediaItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => goToItem(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentIndex
                          ? "bg-white"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Go to ${item.type} ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
