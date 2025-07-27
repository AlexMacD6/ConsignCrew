"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export default function ImageCarousel({
  images,
  alt,
  className = "",
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {/* Main Image */}
      <div className="relative">
        <img
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1} of ${images.length}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Navigation Arrows */}
        {showArrows && images.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-white"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Keyboard Navigation */}
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
    </div>
  );
}
