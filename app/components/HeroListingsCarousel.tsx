"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  MapPin,
} from "lucide-react";
import Link from "next/link";

interface Listing {
  itemId: string;
  title: string;
  price: number;
  photos: {
    hero?: string | null;
    staged?: string | null;
  };
  department: string;
  category: string;
  subCategory: string;
  neighborhood: string;
  condition: string;
}

interface HeroListingsCarouselProps {
  autoPlayInterval?: number;
  maxListings?: number;
}

export default function HeroListingsCarousel({
  autoPlayInterval = 5000,
  maxListings = 6,
}: HeroListingsCarouselProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch actual listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching listings from /api/listings...");

        // Add timeout and better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch("/api/listings?status=active&limit=20", {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        clearTimeout(timeoutId);
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(
            `Failed to fetch listings: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("API Response data:", data);

        if (data.success && data.listings) {
          console.log("Total listings received:", data.listings.length);

          // Filter listings that have hero photos and transform data
          const validListings = data.listings
            .filter((listing: any) => {
              const hasHeroPhoto = listing.photos?.hero;
              if (!hasHeroPhoto) {
                console.log(
                  "Listing without hero photo:",
                  listing.itemId,
                  listing.title
                );
              }
              return hasHeroPhoto;
            })
            .slice(0, maxListings)
            .map((listing: any) => ({
              itemId: listing.itemId,
              title: listing.title,
              price: listing.price,
              photos: {
                hero: listing.photos.hero,
                staged: listing.photos.staged,
              },
              department: listing.department,
              category: listing.category,
              subCategory: listing.subCategory,
              neighborhood: listing.neighborhood,
              condition: listing.condition,
            }));

          console.log("Valid listings with hero photos:", validListings.length);
          setListings(validListings);

          if (validListings.length === 0) {
            setError("No listings with photos available yet");
          }
        } else {
          console.log("API response missing success or listings:", data);
          setError("No listings available");
        }
      } catch (err) {
        console.error("Error fetching listings:", err);

        // More specific error handling
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            setError("Request timed out. Please try again.");
          } else if (err.message.includes("Failed to fetch")) {
            setError(
              "Network error. Please check your connection and try again."
            );
          } else {
            setError(`Failed to load listings: ${err.message}`);
          }
        } else {
          setError("An unexpected error occurred while loading listings.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we're on the client side
    if (typeof window !== "undefined") {
      fetchListings();
    }
  }, [maxListings]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || listings.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % listings.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, autoPlayInterval, listings.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? listings.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % listings.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full bg-gray-200 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-treasure-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading treasures...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || listings.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center p-8">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {error || "No listings available"}
          </h3>
          <p className="text-gray-500 mb-4">
            {listings.length === 0
              ? "Be the first to list an item!"
              : "Check back soon for new treasures"}
          </p>
          <div className="space-y-3">
            <Link
              href="/list-item"
              className="inline-block bg-treasure-500 hover:bg-treasure-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              List Your First Item
            </Link>
            <div className="text-sm text-gray-400">
              <p>Debug Info:</p>
              <p>Error: {error || "None"}</p>
              <p>Listings: {listings.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentListing = listings[currentIndex];

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Image */}
      <div className="relative w-full h-full">
        <img
          src={currentListing.photos.hero || currentListing.photos.staged}
          alt={currentListing.title}
          className="w-full h-full object-cover"
        />

        {/* Image Overlay with Listing Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          {/* Top Info */}
          <div className="absolute top-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                <p className="text-sm font-medium">
                  {currentListing.department} • {currentListing.category}
                </p>
              </div>
              <div className="bg-treasure-500 text-white px-3 py-2 rounded-lg">
                <p className="text-sm font-medium">
                  {currentListing.condition}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/60 backdrop-blur-sm text-white p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 line-clamp-2">
                {currentListing.title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-xl">
                      ${currentListing.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-gray-300" />
                    <span className="text-sm text-gray-300">
                      {currentListing.neighborhood}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/list-item/${currentListing.itemId}`}
                  className="bg-treasure-500 hover:bg-treasure-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {listings.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
            aria-label="Previous listing"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
            aria-label="Next listing"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {listings.length > 1 && (
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {listings.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-treasure-500 scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to listing ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Button */}
      {listings.length > 1 && (
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black/80 transition-all duration-200"
          aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isAutoPlaying ? (
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1 h-4 bg-white mx-0.5"></div>
              <div className="w-1 h-4 bg-white mx-0.5"></div>
            </div>
          ) : (
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-0.5"></div>
            </div>
          )}
        </button>
      )}

      {/* Listing Counter */}
      {listings.length > 1 && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
          <p className="text-sm font-medium">
            {currentIndex + 1} of {listings.length}
          </p>
        </div>
      )}
    </div>
  );
}
