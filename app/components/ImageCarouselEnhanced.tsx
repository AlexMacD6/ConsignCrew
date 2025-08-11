"use client";
import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Play,
  AlertTriangle,
} from "lucide-react";
import RobustImage from "./RobustImage";

interface MediaItem {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
  duration?: number;
}

interface ImageWithMetadata {
  src: string;
  type?: string;
  label?: string | null;
}

interface ImageCarouselEnhancedProps {
  images: (string | ImageWithMetadata)[];
  video?: {
    src: string;
    poster?: string;
    duration?: number;
  };
  alt: string;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showModal?: boolean;
}

export default function ImageCarouselEnhanced({
  images,
  video,
  alt,
  className = "",
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  showModal = true,
}: ImageCarouselEnhancedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create media items array: images first, then video if available
  const mediaItems: (MediaItem & { label?: string | null })[] = [
    ...images
      .filter((item) => {
        const src = typeof item === "string" ? item : item.src;
        return src && src.trim() !== "";
      })
      .map((item, index) => {
        const src = typeof item === "string" ? item : item.src;
        const label = typeof item === "string" ? null : item.label;
        return {
          type: "image" as const,
          src,
          alt: `${alt} - Image ${index + 1}`,

          label,
        };
      }),
    ...(video && video.src && video.src.trim() !== ""
      ? [
          {
            type: "video" as const,
            src: video.src,
            poster: video.poster,
            duration: video.duration,
            alt: `${alt} - Video`,
            label: null,
          },
        ]
      : []),
  ];

  const totalItems = mediaItems.length;

  // Auto-play functionality (only for images, not videos)
  React.useEffect(() => {
    if (!autoPlay || totalItems <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalItems);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, totalItems]);

  const currentItem = mediaItems[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalItems) % totalItems);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalItems);
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

  const renderMediaItem = (item: MediaItem & { label?: string | null }) => {
    if (item.type === "video") {
      return (
        <div className="relative w-full h-full">
          <video
            src={item.src}
            poster={item.poster}
            controls
            className="w-full h-full object-cover rounded-lg"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
          {item.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {Math.floor(item.duration / 60)}:
              {(item.duration % 60).toString().padStart(2, "0")}
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
            <Play className="h-4 w-4" />
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <RobustImage
          src={item.src}
          alt={item.alt || "Product image"}
          width={400}
          height={400}
          className="w-full h-full object-cover rounded-lg"
          fallbackSrc="/cardboard.jpg"
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

              {/* Image Label */}
              {currentItem.label && (
                <div className="absolute bottom-2 right-2">
                  <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    {currentItem.label}
                  </div>
                </div>
              )}

              {/* Click overlay for modal */}
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={openModal}
              />
            </div>
          ) : (
            renderMediaItem(currentItem)
          )}
        </div>

        {/* Navigation Arrows */}
        {showArrows && totalItems > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {showDots && totalItems > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToItem(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10"
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
