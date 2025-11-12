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
  fallbackToS3?: boolean; // Enable S3 fallback for CloudFront failures
}

/**
 * Robust Image Component
 * Handles image loading failures with retry logic and CloudFront to S3 fallback
 * Automatically falls back to direct S3 URLs when CloudFront returns 403 errors
 */
export default function RobustImage({
  src,
  alt,
  width = 400,
  height = 400,
  className = "",
  onError,
  onLoad,
  fallbackToS3 = true,
}: RobustImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [hasFallenBackToS3, setHasFallenBackToS3] = useState(false);
  const maxRetries = 2;

  // Check if the image URL is from S3 (our permanent storage)
  const isS3Image =
    src.includes("cloudfront.net") || src.includes("s3.amazonaws.com");

  // Helper function to generate S3 fallback URL
  const generateS3FallbackUrl = (originalSrc: string): string | null => {
    if (!fallbackToS3 || !originalSrc.includes("cloudfront.net")) {
      return null;
    }

    // Extract the S3 key from CloudFront URL
    const cfDomain =
      process.env.NEXT_PUBLIC_CDN_URL || "https://dtlqyjbwka60p.cloudfront.net";
    const cleanDomain = cfDomain.replace("https://", "").replace("http://", "");

    if (originalSrc.includes(cleanDomain)) {
      const s3Key = originalSrc.split(cleanDomain + "/")[1];
      if (s3Key) {
        const bucketName = process.env.S3_BUCKET || "consigncrew";
        const region = process.env.AWS_REGION || "us-east-1";
        return `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
      }
    }

    return null;
  };

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    setHasFallenBackToS3(false);
  }, [src]);

  const handleError = () => {
    console.warn("Image failed to load:", currentSrc);

    if (retryCount < maxRetries) {
      // Retry loading the same image
      setRetryCount((prev) => prev + 1);
      setIsLoading(true);

      // Add a small delay before retry
      setTimeout(() => {
        setCurrentSrc(currentSrc);
      }, 1000);
    } else if (!hasFallenBackToS3 && fallbackToS3) {
      // Try S3 fallback if CloudFront failed
      const s3FallbackUrl = generateS3FallbackUrl(src);
      if (s3FallbackUrl) {
        console.log("Falling back to S3 URL:", s3FallbackUrl);
        setHasFallenBackToS3(true);
        setRetryCount(0);
        setIsLoading(true);
        setCurrentSrc(s3FallbackUrl);
        return;
      }
    }

    // Image failed to load after retries and fallbacks
    setHasError(true);
    setIsLoading(false);

    if (onError) {
      onError();
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
