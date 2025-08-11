"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface RobustImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Robust Image Component
 * Handles image loading failures with retry logic
 * Only shows S3-stored images - no fallbacks for failed images
 */
export default function RobustImage({
  src,
  alt,
  width = 400,
  height = 400,
  className = "",
  onError,
  onLoad,
}: RobustImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Check if the image URL is from S3 (our permanent storage)
  const isS3Image =
    src.includes("cloudfront.net") || src.includes("s3.amazonaws.com");

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    console.warn("Image failed to load:", src);

    if (retryCount < maxRetries) {
      // Retry loading the same image
      setRetryCount((prev) => prev + 1);
      setIsLoading(true);

      // Add a small delay before retry
      setTimeout(() => {
        setCurrentSrc(src);
      }, 1000);
    } else {
      // Image failed to load after retries - don't show anything
      setHasError(true);
      setIsLoading(false);

      if (onError) {
        onError();
      }
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);

    if (onLoad) {
      onLoad();
    }
  };

  // If image has error after retries, don't render anything
  if (hasError) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      )}

      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${
          isLoading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={false} // Allow optimization for S3 images
      />
    </div>
  );
}
