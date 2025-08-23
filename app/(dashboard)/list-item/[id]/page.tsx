"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { authClient } from "../../../lib/auth-client";
import {
  ArrowLeft,
  MapPin,
  Star,
  Bookmark,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Edit,
  TrendingDown,
  Sparkles,
  Shield,
  Package,
  User,
  Building,
  Eye,
} from "lucide-react";
import QuestionsDisplay from "../../../components/QuestionsDisplay";
import ImageCarousel from "../../../components/ImageCarousel";
import ListingHistory from "../../../components/ListingHistory";
import CustomQRCode from "../../../components/CustomQRCode";
import TreasureBadge from "../../../components/TreasureBadge";
import { getDisplayPrice } from "../../../lib/price-calculator";
import {
  getStandardizedCondition,
  isNewCondition,
  getConditionColor,
} from "../../../lib/condition-utils";
import { usePurchaseService } from "../../../lib/purchase-service";
import {
  getBuyNowButtonState,
  getStatusOverlay,
} from "../../../lib/listing-button-utils";
import {
  trackMetaPixelEvent,
  trackViewContent,
  trackAddToWishlist,
  trackCompleteRegistration,
} from "../../../lib/meta-pixel-client";
import ProductStructuredData from "../../../components/ProductStructuredData";

// Import the time calculation function
import { getTimeUntilNextDrop } from "../../../lib/price-calculator";

// Helper function to format dates
const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
};

// Mock data for transportation history
const transportationHistory = [
  {
    id: 1,
    status: "Ordered",
    timestamp: "2025-01-15T10:30:00Z",
    description: "Item ordered and payment confirmed",
    completed: true,
  },
  {
    id: 2,
    status: "Pick-Up",
    timestamp: "2025-01-16T14:20:00Z",
    description: "Item picked up from seller location",
    completed: true,
  },
  {
    id: 3,
    status: "QA/QC",
    timestamp: "2025-01-17T09:15:00Z",
    description: "Quality assurance and quality control check completed",
    completed: true,
  },
  {
    id: 4,
    status: "Ready to Ship",
    timestamp: "2025-01-18T11:45:00Z",
    description: "Item packaged and ready for shipping",
    completed: true,
  },
  {
    id: 5,
    status: "Out for Delivery",
    timestamp: "2025-01-19T08:30:00Z",
    description: "Item is out for delivery to buyer",
    completed: false,
  },
  {
    id: 6,
    status: "Delivered",
    timestamp: null,
    description: "Item delivered to buyer",
    completed: false,
  },
];

// Mock listing data - in real app this would come from API
const mockListing = {
  item_id: "cc_001_2025_01_15_001",
  seller_id: "user_123",
  created_at: "2025-01-15T10:30:00Z",
  status: "LISTED",
  qr_code_url:
    "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=cc_001_2025_01_15_001",
  image_urls_staged: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&crop=left",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&crop=right",
  ],
  gtin: "1234567890123",
  insights_query: "modern leather sofa furniture seating living room",
  price_range_low: 750,
  price_range_high: 1100,
  list_price: 899.99,
  reserve_price: 650.0,
  estimated_retail_price: 1299.99,
  title: "Modern Leather Sofa",
  description:
    "Premium leather sofa in excellent condition. Perfect for living room or office. Features high-quality construction and comfortable seating. This sofa has been well-maintained and shows minimal signs of wear. The leather is supple and the cushions provide excellent support. Includes matching throw pillows.",
  category_id: "furniture_seating_sofas",
  condition: "EXCELLENT",
  image_urls_original: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
  ],
  serial_number: "SOFA-2024-001",
  model_number: "MLS-3S-2024",
  brand: "Ashley Furniture",
  dimensions: '84" W x 35" D x 38" H',
  discount_schedule: "Turbo-30",
  zip_code: "77019",
  seller_name: "FurniturePro",
  location: "River Oaks / Upper Kirby",
  rating: 4.8,
  reviews: 12,
  timeLeft: "2d 14h",
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [authError, setAuthError] = useState(false); // Track authentication errors
  const [email, setEmail] = useState(""); // Early access signup email
  const [isSubmitting, setIsSubmitting] = useState(false); // Signup form submission state
  const [submitSuccess, setSubmitSuccess] = useState(false); // Signup success state
  const [signupError, setSubmitError] = useState(""); // Signup error message
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;
  const currentUserId = session?.user?.id || null;
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const { handleBuyNow: purchaseServiceBuyNow, confirmOwnPurchase } =
    usePurchaseService(currentUserId);
  const [loadingPurchase, setLoadingPurchase] = useState(false); // New state for purchase loading
  const [ownListingConfirmOpen, setOwnListingConfirmOpen] = useState(false);
  const [showAddressRequiredModal, setShowAddressRequiredModal] =
    useState(false);
  const [userAddress, setUserAddress] = useState<any>(null);

  // Function to check if user has complete address
  const isAddressComplete = (address: any) => {
    if (!address) return false;
    return !!(
      address.addressLine1 &&
      address.city &&
      address.state &&
      address.zipCode
    );
  };

  // Function to fetch user profile data
  const fetchUserProfile = async () => {
    if (!isAuthenticated) return;

    try {
      const res = await fetch("/api/profile", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUserAddress(data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Function to generate video URL from video record
  const generateVideoUrl = (videoRecord: any) => {
    console.log("generateVideoUrl called with:", videoRecord);

    if (!videoRecord) {
      console.log("No videoRecord, returning null");
      return null;
    }

    // Try to use processed video first, then raw video
    const videoKey = videoRecord.processedVideoKey || videoRecord.rawVideoKey;

    if (!videoKey) {
      console.log("No processedVideoKey or rawVideoKey, returning null");
      return null;
    }

    // Use CloudFront domain if available, otherwise fallback to S3
    const cfDomain = process.env.NEXT_PUBLIC_CDN_URL;
    console.log("CloudFront domain:", cfDomain);
    console.log("CloudFront domain type:", typeof cfDomain);
    console.log("Using video key:", videoKey);

    if (cfDomain) {
      const cleanDomain = cfDomain
        .replace("https://", "")
        .replace("http://", "");
      const url = `https://${cleanDomain}/${videoKey}`;
      console.log("Generated CloudFront URL:", url);
      return url;
    }

    // Fallback to S3 URL - using known values from the project
    const bucketName = "consigncrew"; // From env.example
    const region = "us-east-1"; // From env.example
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${videoKey}`;
    console.log("Generated S3 URL:", url);
    return url;
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/listings/${params.id}`);

        if (!response.ok) {
          if (response.status === 401) {
            setAuthError(true);
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return;
        }

        const data = await response.json();
        console.log("API response data:", data); // Debug log

        if (data.success && data.listing) {
          console.log("Setting listing:", data.listing); // Debug log
          console.log("Listing itemId:", data.listing.itemId); // Debug log
          setListing(data.listing);

          // Track view count increment
          try {
            await fetch(`/api/listings/${params.id}/view`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });
          } catch (error) {
            console.error("Error tracking view:", error);
            // Don't fail the page load if view tracking fails
          }
        } else {
          console.error("API response missing listing:", data); // Debug log
          throw new Error(data.error || "Failed to fetch listing");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        setAuthError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchListing();
    }
  }, [params.id]);

  // Debug logging for video component
  useEffect(() => {
    if (listing) {
      console.log("Video component debug - videoUrl:", listing.videoUrl);
      console.log("Video component debug - video data:", listing.video);
      if (listing.videoUrl || listing.video) {
        console.log("Video component should be rendered");
      } else {
        console.log("No video data available, component not rendered");
      }
    }
  }, [listing]);

  // Fetch user profile when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      fetchUserOrganizations();
    }
  }, [isAuthenticated]);

  // Function to fetch user organizations
  const fetchUserOrganizations = async () => {
    if (!isAuthenticated || !currentUserId) return;

    try {
      const res = await fetch("/api/profile/organizations", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUserOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error("Error fetching user organizations:", error);
    }
  };

  // Check if user belongs to TreasureHub organization or is an admin
  const isTreasureHubMember = userOrganizations.some(
    (org) =>
      org.organizationSlug === "treasurehub" ||
      org.organizationSlug === "treasurehub-admin" ||
      org.role === "ADMIN" ||
      org.role === "OWNER" ||
      org.name?.toLowerCase() === "treasurehub"
  );

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "EXCELLENT":
        return "bg-green-100 text-green-800";
      case "GOOD":
        return "bg-blue-100 text-blue-800";
      case "FAIR":
        return "bg-yellow-100 text-yellow-800";
      case "POOR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const hasRecentPriceDrop = (listing: any) => {
    // Check if listing has price history and if there's been a price drop in last 48 hours
    if (!listing.priceHistory || listing.priceHistory.length < 2) {
      return false; // No price history or only initial price
    }

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Get the most recent price change
    const latestPriceChange = listing.priceHistory[0];
    const previousPrice = listing.priceHistory[1]?.price;

    // Check if the latest price change was within 48 hours and was a price drop
    if (latestPriceChange && previousPrice) {
      const priceChangeTime = new Date(latestPriceChange.createdAt);
      const isRecent = priceChangeTime > fortyEightHoursAgo;
      const isPriceDrop = latestPriceChange.price < previousPrice;

      return isRecent && isPriceDrop;
    }

    return false;
  };

  const toggleSaved = async (id: string) => {
    if (!listing) return;

    const isCurrentlySaved = savedListings.has(id);
    const action = isCurrentlySaved ? "unsave" : "save";

    try {
      const response = await fetch(`/api/listings/${id}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update the listing's saves count
        setListing((prev: any) =>
          prev ? { ...prev, saves: data.saves } : null
        );

        // Update saved listings state
        setSavedListings((prev) => {
          const newSet = new Set(prev);
          if (isCurrentlySaved) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });

        // Track AddToWishlist event when item is saved
        if (action === "save") {
          trackAddToWishlist({
            content_name: listing.title,
            content_category: `${listing.department}/${listing.category}/${listing.subCategory}`,
            content_ids: [listing.itemId],
            value: listing.price,
            currency: "USD",
            brand: listing.brand || undefined,
            condition: listing.facebookCondition,
            availability:
              listing.status === "active" ? "in stock" : "out of stock",
            price: listing.price,
            sale_price: getDisplayPrice(listing).isDiscounted
              ? getDisplayPrice(listing).price
              : undefined,
            gtin: listing.gtin || undefined,
          }).catch((error) => {
            console.error("Error tracking AddToWishlist:", error);
            // Don't fail the save functionality if tracking fails
          });
        }
      } else {
        console.error("Failed to update saves count");
      }
    } catch (error) {
      console.error("Error updating saves count:", error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source: "product_auth_error" }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.message === "Email already subscribed") {
          setSubmitError(
            "You're already signed up! We'll notify you when we launch."
          );
        } else {
          setSubmitSuccess(true);
          setEmail("");

          // Track CompleteRegistration event for successful new signups
          try {
            await trackCompleteRegistration({
              content_name: "Early Access Signup",
              content_category: "Lead Generation",
              value: 1,
              currency: "USD",
              source: "product_auth_error",
              signup_number: data.signupNumber,
            });
          } catch (trackingError) {
            console.error(
              "Error tracking CompleteRegistration (product auth):",
              trackingError
            );
            // Don't fail the signup if tracking fails
          }
        }
      } else {
        setSubmitError(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyNow = async () => {
    if (!listing || !isAuthenticated) {
      setAuthError(true);
      return;
    }

    // Check if user has complete address before proceeding
    if (!isAddressComplete(userAddress)) {
      setShowAddressRequiredModal(true);
      return;
    }

    setLoadingPurchase(true);
    await purchaseServiceBuyNow(
      listing,
      () => setOwnListingConfirmOpen(true), // onOwnerConfirmationRequired
      (error) => {
        alert(error);
        setLoadingPurchase(false);
      }, // onError
      () => {
        // onSuccess - loading will continue until redirect
      }
    );
  };

  const confirmBuyOwnListing = async () => {
    if (!listing) return;

    setOwnListingConfirmOpen(false);
    setLoadingPurchase(true);

    await confirmOwnPurchase(
      listing,
      (error) => {
        alert(error);
        setLoadingPurchase(false);
      }, // onError
      () => {
        // onSuccess - loading will continue until redirect
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    if (authError) {
      // Show Coming Soon screen for authentication errors
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              {/* Logo */}
              <div className="mb-8">
                <img
                  src="/TreasureHub - Logo.png"
                  alt="TreasureHub"
                  className="h-20 w-auto mx-auto"
                />
              </div>

              {/* Coming Soon Message */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🎉 Listings Coming Soon!
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  We're putting the finishing touches on our marketplace. Be the
                  first to discover amazing treasures when we launch!
                </p>
              </div>

              {/* Early Access Signup Form */}
              {!submitSuccess ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email for early access"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#D4AF3D] focus:ring-2 focus:ring-[#D4AF3D]/20 transition-all"
                      required
                    />
                  </div>
                  {signupError && (
                    <p className="text-red-500 text-sm">{signupError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#D4AF3D] hover:bg-[#b8932f] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Joining..." : "Get Early Access Now"}
                  </button>
                </form>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    You're on the list! 🎯
                  </h3>
                  <p className="text-green-700">
                    We'll notify you as soon as listings are available. Thanks
                    for joining our treasure hunt!
                  </p>
                </div>
              )}

              {/* Benefits */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <Sparkles className="h-8 w-8 text-[#D4AF3D] mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">
                    First Access
                  </h4>
                  <p className="text-gray-600">
                    Be the first to see new treasures
                  </p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-[#D4AF3D] mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Quality Guaranteed
                  </h4>
                  <p className="text-gray-600">Every item is quality checked</p>
                </div>
                <div className="text-center">
                  <Package className="h-8 w-8 text-[#D4AF3D] mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Easy Process
                  </h4>
                  <p className="text-gray-600">Simple buying and selling</p>
                </div>
              </div>

              {/* Back to Home */}
              <div className="mt-8">
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="border-[#D4AF3D] text-[#D4AF3D] hover:bg-[#D4AF3D] hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular "Not Found" screen for other errors
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Listing Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The listing you're looking for doesn't exist or may have been
            removed.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => router.back()}
              className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <div>
              <Button
                variant="outline"
                onClick={() => router.push("/list-item")}
                className="mt-2"
              >
                Browse All Listings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create all_images array from available photos
  const createAllImages = () => {
    const images = [];

    // Add hero photo if available
    if (listing.photos?.hero) {
      images.push({
        src: listing.photos.hero,
        type: "hero",
        label: null,
      });
    }

    // Add staged photo if available
    if (listing.photos?.staged) {
      images.push({
        src: listing.photos.staged,
        type: "staged",
        label: "Staged scene - for inspiration",
      });
    }

    // Add back photo if available
    if (listing.photos?.back) {
      images.push({
        src: listing.photos.back,
        type: "back",
        label: null,
      });
    }

    // Add additional photos if available
    if (
      listing.photos?.additional &&
      Array.isArray(listing.photos.additional)
    ) {
      listing.photos.additional.forEach((photo: string) => {
        if (photo) {
          images.push({
            src: photo,
            type: "additional",
            label: null,
          });
        }
      });
    }

    return images;
  };

  const allImages = createAllImages();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data for Facebook Shop Catalog */}
      <ProductStructuredData
        product={{
          itemId: listing.itemId,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          status: listing.status,
          brand: listing.brand,
          facebookCondition: listing.facebookCondition,
          department: listing.department,
          category: listing.category,
          subCategory: listing.subCategory,
          all_images: allImages,
          url: `https://treasurehub.club/list-item/${listing.itemId}`,
        }}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Listings
            </Button>
            <div className="flex items-center gap-4">
              {isAuthenticated && listing?.user?.id === currentUserId && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/list-item/${params.id}/edit`)}
                  className="flex items-center gap-2 bg-[#D4AF3D] hover:bg-[#b8932f] text-white border-[#D4AF3D]"
                >
                  <Edit className="h-4 w-4" />
                  Edit Listing
                </Button>
              )}
              {isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={() => toggleSaved(listing.itemId)}
                  className={`${
                    savedListings.has(listing.itemId)
                      ? "bg-[#D4AF3D] text-white border-[#D4AF3D]"
                      : ""
                  }`}
                >
                  <Bookmark
                    className={`h-4 w-4 mr-2 ${
                      savedListings.has(listing.itemId) ? "fill-current" : ""
                    }`}
                  />
                  {savedListings.has(listing.itemId) ? "Saved" : "Save"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Basic Info */}
          <div className="lg:col-span-2">
            {/* Main Image Carousel */}
            <div className="mb-6 relative">
              <ImageCarousel
                images={allImages}
                video={
                  listing.videoUrl
                    ? {
                        src: listing.videoUrl,
                        poster: listing.video?.thumbnailUrl,
                        duration: listing.video?.duration,
                      }
                    : undefined
                }
                alt={listing.title}
                className="w-full h-96 rounded-lg"
                showArrows={true}
                showDots={true}
                autoPlay={false}
              />

              {/* Status Overlay */}
              {(() => {
                const overlay = getStatusOverlay(listing?.status);
                if (!overlay.show) return null;

                return (
                  <div className={overlay.className}>
                    <div className={overlay.badgeClassName}>{overlay.text}</div>
                  </div>
                );
              })()}
            </div>

            {/* Price Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const displayPrice = getDisplayPrice(listing);

                    if (displayPrice.isDiscounted) {
                      return (
                        <>
                          <span className="text-4xl font-bold text-gray-900">
                            ${displayPrice.price.toFixed(2)}
                          </span>
                          <span className="text-2xl font-bold text-gray-400 line-through">
                            ${displayPrice.originalPrice?.toFixed(2)}
                          </span>
                        </>
                      );
                    } else {
                      return (
                        <span className="text-4xl font-bold text-gray-900">
                          ${displayPrice.price.toFixed(2)}
                        </span>
                      );
                    }
                  })()}
                </div>
                <div className="flex gap-2">
                  {hasRecentPriceDrop(listing) && (
                    <div className="text-sm bg-red-600 text-white px-3 py-1 rounded font-medium">
                      Price Drop
                    </div>
                  )}
                  {listing.list_price <= listing.reserve_price && (
                    <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded font-medium">
                      Reserve Met
                    </div>
                  )}
                  {listing.qualityChecked && (
                    <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Quality Checked
                    </div>
                  )}
                </div>
              </div>
              {listing.isTreasure ? (
                <div className="mb-4">
                  <TreasureBadge
                    isTreasure={listing.isTreasure}
                    treasureReason={listing.treasureReason}
                    showReason={true}
                  />
                  {listing.priceReasoning && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">
                        Based on recent collector sales:
                      </span>{" "}
                      {listing.priceReasoning}
                    </div>
                  )}
                </div>
              ) : (
                listing.estimated_retail_price &&
                isNewCondition(getStandardizedCondition(listing)) && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-lg text-gray-500 line-through">
                      ${listing.estimated_retail_price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-medium">
                        {Math.round(
                          ((listing.estimated_retail_price -
                            listing.list_price) /
                            listing.estimated_retail_price) *
                            100
                        )}
                        % Off Retail
                      </span>
                    </div>
                  </div>
                )
              )}
              <div className="flex gap-3">
                {isAuthenticated ? (
                  (() => {
                    const buttonState = getBuyNowButtonState({
                      status: listing?.status,
                      isOwner: listing?.user?.id === currentUserId,
                      loadingPurchase,
                    });

                    return (
                      <Button
                        className={buttonState.className}
                        onClick={handleBuyNow}
                        disabled={buttonState.disabled}
                      >
                        {buttonState.loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {buttonState.text}
                          </>
                        ) : (
                          buttonState.text
                        )}
                      </Button>
                    );
                  })()
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button
                      className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                      onClick={() => router.push("/login")}
                    >
                      Log In to Buy
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push("/contact")}
                    >
                      Ask a Question
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm purchase own listing modal */}
            {ownListingConfirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    This is your own listing
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You are about to purchase your own item. Are you sure you
                    want to continue?
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setOwnListingConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                      onClick={confirmBuyOwnListing}
                    >
                      Yes, Continue
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Address Required Modal */}
            {showAddressRequiredModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-[#D4AF3D] rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Shipping Address Required
                      </h2>
                      <p className="text-gray-600 mb-6">
                        To complete your purchase, please add your shipping
                        address. This helps us ensure smooth delivery.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setShowAddressRequiredModal(false);
                          router.push("/profile");
                        }}
                        className="w-full bg-[#D4AF3D] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#c4a235] transition-colors"
                      >
                        Add Address Now
                      </button>
                      <button
                        onClick={() => setShowAddressRequiredModal(false)}
                        className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>

                    <p className="text-sm text-gray-500 mt-4">
                      You can add your address from your profile page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Item Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Item Details
              </h2>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Condition:
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${getConditionColor(
                        getStandardizedCondition(listing)
                      )}`}
                    >
                      {getStandardizedCondition(listing)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Listed:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {formatDate(listing.createdAt || listing.created_at)}
                    </span>
                  </div>
                </div>

                {(() => {
                  const timeLeft = getTimeUntilNextDrop(listing);
                  return (
                    timeLeft && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Next Price Drop:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {timeLeft.timeString}
                          </span>
                        </div>
                      </div>
                    )
                  );
                })()}

                {listing.brand && (
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Brand:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {listing.brand}
                      </span>
                    </div>
                  </div>
                )}

                {listing.qualityChecked && (
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Quality:
                      </span>
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800 font-medium">
                        Quality Checked
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Categories Section */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Categories
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Department:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {listing.department}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Category:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {listing.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Sub-category:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {listing.subCategory}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensions Section */}
              {(listing.height ||
                listing.width ||
                listing.depth ||
                listing.dimensions) && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Dimensions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Height */}
                    {listing.height && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Height:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.height}"
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Width */}
                    {listing.width && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Width:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.width}"
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Depth */}
                    {listing.depth && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Depth:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.depth}"
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Combined Dimensions (fallback) */}
                    {!listing.height &&
                      !listing.width &&
                      !listing.depth &&
                      listing.dimensions && (
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              Dimensions:
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              {listing.dimensions}"
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Product Information */}
              {(listing.serial_number ||
                listing.model_number ||
                listing.gtin ||
                (listing.facebookShopEnabled && listing.facebookGtin)) && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Product Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listing.serial_number && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Serial Number:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.serial_number}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.model_number && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Model Number:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.model_number}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.gtin && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            GTIN:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.gtin}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.facebookShopEnabled && listing.facebookGtin && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Facebook GTIN:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.facebookGtin}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Facebook Shop Product Specifications */}
              {(listing.color ||
                listing.size ||
                listing.gender ||
                listing.ageGroup ||
                listing.material ||
                listing.pattern ||
                listing.style ||
                listing.tags?.length > 0 ||
                listing.quantity > 1 ||
                listing.salePrice) && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Product Specifications
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listing.color && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Color:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.color}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.size && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Size:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.size}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.gender && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Gender:
                          </span>
                          <span className="ml-2 text-sm text-gray-600 capitalize">
                            {listing.gender}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.ageGroup && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Age Group:
                          </span>
                          <span className="ml-2 text-sm text-gray-600 capitalize">
                            {listing.ageGroup}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.material && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Material:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.material}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.pattern && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Pattern:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.pattern}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.style && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Style:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.style}
                          </span>
                        </div>
                      </div>
                    )}

                    {listing.quantity > 1 && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Quantity Available:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {listing.quantity}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.salePrice && (
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Sale Price:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            ${listing.salePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.tags && listing.tags.length > 0 && (
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              Tags:
                            </span>
                            <div className="ml-2 flex flex-wrap gap-1 mt-1">
                              {listing.tags.map(
                                (tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {listing.qualityChecked && (
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-green-500" />
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              Quality Status:
                            </span>
                            <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800 font-medium">
                              Quality Checked
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Questions & Answers */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <QuestionsDisplay
                listingId={listing.item_id}
                listingTitle={listing.title}
                userId={listing.seller_id}
                isAdmin={isTreasureHubMember}
              />
            </div>
          </div>

          {/* Right Column - Seller Info and Additional Details */}
          <div className="lg:col-span-1">
            {/* Seller Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Seller Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Seller:
                    </span>
                    <span className="ml-2 text-sm text-[#D4AF3D] font-medium">
                      {listing.user?.name || "Unknown Seller"}
                    </span>
                  </div>
                </div>
                {listing.user?.organization && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Organization:
                      </span>
                      <span className="ml-2 text-sm text-[#D4AF3D] font-medium">
                        {listing.user.organization.name}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Location:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {listing.neighborhood}
                    </span>
                  </div>
                </div>
                {listing.rating && listing.reviews > 0 && (
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Rating:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {listing.rating} ({listing.reviews} reviews)
                      </span>
                    </div>
                  </div>
                )}
                {listing.views > 0 && (
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Views:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {listing.views}
                      </span>
                    </div>
                  </div>
                )}
                {listing.saves > 0 && (
                  <div className="flex items-center gap-3">
                    <Bookmark className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Saves:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {listing.saves}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                QR Code
              </h3>
              <div className="text-center">
                <CustomQRCode
                  itemId={listing.itemId}
                  size={150}
                  className="mx-auto"
                  showPrintButton={true}
                  userOrganizations={userOrganizations}
                />
              </div>
            </div>

            {/* History */}
            <ListingHistory
              listingId={listing.itemId}
              createdAt={listing.createdAt || listing.created_at}
              discountSchedule={
                listing.discountSchedule || listing.discount_schedule
              }
              currentPrice={getDisplayPrice(listing).price}
              originalPrice={listing.price}
              reservePrice={listing.reservePrice || listing.reserve_price}
              status={listing.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
