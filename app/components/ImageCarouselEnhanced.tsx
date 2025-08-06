"use client";
import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import RobustImage from "./RobustImage";

interface EnhancedFlaw {
  type: string;
  severity: "minor" | "moderate" | "major";
  location?: string;
  description: string;
  confidence?: number;
  impactOnValue?: "low" | "medium" | "high";
  repairability?: "easy" | "moderate" | "difficult";
}

interface MediaItem {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
  duration?: number;
  flaws?: EnhancedFlaw[];
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
  photoFlaws?: {
    [photoUrl: string]: EnhancedFlaw[];
  };
  onFlawFeedback?: (
    photoUrl: string,
    flawIndex: number,
    feedback: "accurate" | "inaccurate"
  ) => void;
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
  photoFlaws = {},
  onFlawFeedback,
}: ImageCarouselEnhancedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flawFeedback, setFlawFeedback] = useState<{
    [key: string]: { [flawIndex: number]: "accurate" | "inaccurate" };
  }>({});

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
          flaws: photoFlaws[src] || [],
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

  // Handle flaw feedback
  const handleFlawFeedback = (
    photoUrl: string,
    flawIndex: number,
    feedback: "accurate" | "inaccurate"
  ) => {
    setFlawFeedback((prev) => ({
      ...prev,
      [photoUrl]: {
        ...prev[photoUrl],
        [flawIndex]: feedback,
      },
    }));

    if (onFlawFeedback) {
      onFlawFeedback(photoUrl, flawIndex, feedback);
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "major":
        return "bg-red-600";
      case "moderate":
        return "bg-orange-500";
      case "minor":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
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
                fallbackSrc="/cardboard.jpg"
                onLoad={() => {}}
                onError={() => {}}
              />

              {/* Enhanced Flaw Tags */}
              {currentItem.flaws && currentItem.flaws.length > 0 && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-xs">
                  {currentItem.flaws.map((flaw, flawIndex) => {
                    const feedback = flawFeedback[currentItem.src]?.[flawIndex];
                    return (
                      <div
                        key={flawIndex}
                        className={`relative group/flaw ${getSeverityColor(
                          flaw.severity
                        )} text-white px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:scale-105`}
                        title={`${flaw.type}: ${flaw.description}
Location: ${flaw.location || "Not specified"}
Confidence: ${Math.round((flaw.confidence || 0.5) * 100)}%
Impact on Value: ${flaw.impactOnValue || "Unknown"}
Repairability: ${flaw.repairability || "Unknown"}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>
                            {flaw.type.charAt(0).toUpperCase() +
                              flaw.type.slice(1)}
                          </span>
                          {flaw.confidence && (
                            <span
                              className={`text-xs ${getConfidenceColor(
                                flaw.confidence
                              )}`}
                            >
                              {Math.round(flaw.confidence * 100)}%
                            </span>
                          )}
                        </div>

                        {/* Feedback buttons */}
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg opacity-0 group-hover/flaw:opacity-100 transition-opacity duration-200 z-10">
                          <div className="flex">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFlawFeedback(
                                  currentItem.src,
                                  flawIndex,
                                  "accurate"
                                );
                              }}
                              className={`px-2 py-1 text-xs flex items-center gap-1 ${
                                feedback === "accurate"
                                  ? "bg-green-100 text-green-700"
                                  : "hover:bg-gray-100"
                              }`}
                              title="Mark as accurate"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Accurate
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFlawFeedback(
                                  currentItem.src,
                                  flawIndex,
                                  "inaccurate"
                                );
                              }}
                              className={`px-2 py-1 text-xs flex items-center gap-1 ${
                                feedback === "inaccurate"
                                  ? "bg-red-100 text-red-700"
                                  : "hover:bg-gray-100"
                              }`}
                              title="Mark as inaccurate"
                            >
                              <XCircle className="h-3 w-3" />
                              Inaccurate
                            </button>
                          </div>
                        </div>

                        {/* Feedback indicator */}
                        {feedback && (
                          <div className="absolute -top-1 -right-1">
                            {feedback === "accurate" ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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
                fallbackSrc="/cardboard.jpg"
              />
            </div>

            {/* Enhanced Flaw Details in Modal */}
            {currentItem.flaws && currentItem.flaws.length > 0 && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 max-w-sm">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Detected Flaws
                </h3>
                <div className="space-y-2">
                  {currentItem.flaws.map((flaw, flawIndex) => (
                    <div
                      key={flawIndex}
                      className="border-l-4 border-red-500 pl-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${getSeverityColor(
                            flaw.severity
                          )}`}
                        >
                          {flaw.type.charAt(0).toUpperCase() +
                            flaw.type.slice(1)}
                        </span>
                        {flaw.confidence && (
                          <span
                            className={`text-xs ${getConfidenceColor(
                              flaw.confidence
                            )}`}
                          >
                            {Math.round(flaw.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        {flaw.description}
                      </p>
                      {flaw.location && (
                        <p className="text-xs text-gray-600">
                          Location: {flaw.location}
                        </p>
                      )}
                      {flaw.impactOnValue && (
                        <p
                          className={`text-xs ${getImpactColor(
                            flaw.impactOnValue
                          )}`}
                        >
                          Impact: {flaw.impactOnValue}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
