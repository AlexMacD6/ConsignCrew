"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import {
  Search,
  Filter,
  Eye,
  MapPin,
  Star,
  QrCode,
  Tag,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Bookmark,
  EyeOff,
  X,
  Calendar,
  DollarSign,
  User,
  Package,
  HelpCircle,
  ArrowDown,
  MessageCircle,
  Check,
  Shield,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { getNeighborhoodName } from "../../lib/zipcodes";
import { getDisplayPrice } from "../../lib/price-calculator";
import {
  getStandardizedCondition,
  getConditionColor,
  isNewCondition,
} from "../../lib/condition-utils";
import { usePurchaseService } from "../../lib/purchase-service";
import {
  getBuyNowButtonState,
  getStatusOverlay,
} from "../../lib/listing-button-utils";
import QuestionsDisplay from "../../components/QuestionsDisplay";
import ImageCarousel from "../../components/ImageCarousel";
import CustomQRCode from "../../components/CustomQRCode";
import TreasureBadge from "../../components/TreasureBadge";
import {
  getFacebookCategories,
  mapToFacebookCategory,
} from "../../lib/category-mapping";
import {
  trackAddToWishlist,
  trackCompleteRegistration,
} from "../../lib/meta-pixel-client";

// Helper function to convert S3 keys to CloudFront URLs
function getPhotoUrl(photoData: any): string | null {
  if (!photoData) return null;

  // If it's already a full URL, return it
  if (
    typeof photoData === "string" &&
    (photoData.startsWith("http://") || photoData.startsWith("https://"))
  ) {
    return photoData;
  }

  // If it's an object with url property, return the url
  if (photoData && typeof photoData === "object" && photoData.url) {
    return photoData.url;
  }

  // If it's a string that looks like an S3 key, convert it to CloudFront URL
  if (typeof photoData === "string" && photoData.includes("/")) {
    const cfDomain =
      process.env.NEXT_PUBLIC_CDN_URL || "https://dtlqyjbwka60p.cloudfront.net";
    return `${cfDomain}/${photoData}`;
  }

  return null;
}

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [showSold, setShowSold] = useState(true); // Default to showing sold items
  const [showProcessing, setShowProcessing] = useState(true); // Default to showing processing items
  const [showHidden, setShowHidden] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showTreasures, setShowTreasures] = useState(false);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [hiddenListings, setHiddenListings] = useState<Set<string>>(new Set());
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(true); // Mock admin status - in real app this would come from auth
  const [isClient, setIsClient] = useState(false); // Track client-side rendering
  const [timeKey, setTimeKey] = useState(0); // Force re-renders for time calculations
  const [authError, setAuthError] = useState(false); // Track authentication errors
  const [email, setEmail] = useState(""); // Early access signup email
  const [isSubmitting, setIsSubmitting] = useState(false); // Signup form submission state
  const [submitSuccess, setSubmitSuccess] = useState(false); // Signup success state
  const [signupError, setSignupError] = useState(""); // Signup error message
  const [loadingPurchase, setLoadingPurchase] = useState(false); // Purchase loading state
  const [ownListingConfirmOpen, setOwnListingConfirmOpen] = useState(false); // Own listing confirmation modal
  const [showAddressRequiredModal, setShowAddressRequiredModal] = useState(false);
  const [userAddress, setUserAddress] = useState<any>(null);

  // Authentication state
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;
  const currentUserId = session?.user?.id || null;
  const { handleBuyNow: purchaseServiceBuyNow, confirmOwnPurchase } =
    usePurchaseService(currentUserId);

  // Function to check if user has complete address
  const isAddressComplete = (address: any) => {
    if (!address) return false;
    return !!(address.addressLine1 && address.city && address.state && address.zipCode);
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

  // Set client-side rendering flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch("/api/listings");
        if (!response.ok) {
          if (response.status === 401) {
            setAuthError(true);
            setListings([]);
            return;
          }
          throw new Error("Failed to fetch listings");
        }
        const data = await response.json();
        if (data.success) {
          // Debug: Log listing statuses to see what we have
          console.log(
            "Listing statuses:",
            data.listings.map((l: any) => ({ id: l.itemId, status: l.status }))
          );
          console.log("Total listings received:", data.listings.length);

          // Transform API data to match the expected format
          const transformedListings = data.listings.map((listing: any) => {
            return {
              item_id: listing.itemId,
              seller_id: listing.userId,
              created_at: listing.createdAt,
              status: listing.status,
              qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${listing.itemId}`,
              image_urls_staged: getPhotoUrl(listing.photos.staged)
                ? [getPhotoUrl(listing.photos.staged)] // Use actual staged photo if available
                : getPhotoUrl(listing.photos.hero)
                ? [getPhotoUrl(listing.photos.hero)] // Fallback to hero photo
                : [],
              title: listing.title,
              description: listing.description,
              category_id: `${listing.department}_${listing.category}_${listing.subCategory}`,
              facebookCondition: listing.facebookCondition,
              image_urls_original:
                listing.photos.gallery || [getPhotoUrl(listing.photos.hero)] ||
                [],
              // Create a comprehensive image array for carousel - put staged photo first if available
              all_images: [
                getPhotoUrl(listing.photos.staged), // AI-generated staged photo as FIRST image
                getPhotoUrl(listing.photos.hero), // Hero photo as second image
                getPhotoUrl(listing.photos.back),
                ...(listing.photos.additional?.map((photo: any) =>
                  getPhotoUrl(photo)
                ) || []),
              ].filter(Boolean), // Remove any null/undefined values
              serial_number: listing.serialNumber,
              model_number: listing.modelNumber,
              brand: listing.brand,
              dimensions: listing.dimensions,
              discount_schedule: listing.discountSchedule || {
                type: "Classic-60",
              },
              zip_code: listing.zipCode,
              list_price: listing.price,
              estimated_retail_price: listing.estimatedRetailPrice,
              seller_name: listing.user.name || "Unknown Seller",
              seller_organization:
                listing.user.members?.[0]?.organization || null,
              location: listing.neighborhood,
              rating: listing.rating || null, // Use actual rating if available
              reviews: listing.reviews || 0, // Use actual review count if available
              timeLeft: null, // Will be calculated dynamically
              // Treasure fields
              isTreasure: listing.isTreasure || false,
              treasureReason: listing.treasureReason || null,
            };
          });
          setListings(transformedListings);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
        // Set empty array if API fails - no fallback to mock data
        setListings([]);
      }
    };

    fetchListings();
  }, []);

  // Update time calculations every minute
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setTimeKey((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isClient]);

  // Debug: Log current filter states
  console.log("Filter states:", {
    showSold,
    showProcessing,
    showSaved,
    showHidden,
    showTreasures,
  });

  // Filter and sort listings
  const filteredListings = listings
    .filter((listing) => {
      // Map the listing's categories to Facebook category for filtering
      const listingFacebookCategory = mapToFacebookCategory(
        listing.department || listing.category_id?.split("_")[0] || "general",
        listing.category || listing.category_id?.split("_")[1] || "general",
        listing.subCategory || listing.category_id?.split("_")[2]
      );

      const matchesSearch =
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        listingFacebookCategory === selectedCategory;

      const isHidden = hiddenListings.has(listing.item_id);
      const isSaved = savedListings.has(listing.item_id);
      const isSoldItem = listing.status === "sold";
      const isProcessingItem = listing.status === "processing";
      const shouldShowHidden = showHidden || !isHidden;
      const shouldShowSaved = !showSaved || isSaved;
      const shouldShowTreasures = !showTreasures || listing.isTreasure;
      const shouldShowSoldItems = showSold || !isSoldItem;
      const shouldShowProcessingItems = showProcessing || !isProcessingItem;

      const result =
        matchesSearch &&
        matchesCategory &&
        shouldShowHidden &&
        shouldShowSaved &&
        shouldShowTreasures &&
        shouldShowSoldItems &&
        shouldShowProcessingItems;

      // Debug: Log filtering decisions for sold and processing items
      if (isSoldItem) {
        console.log(`Sold item ${listing.item_id}:`, {
          showSold,
          shouldShowSoldItems,
          result,
          status: listing.status,
        });
      }

      if (isProcessingItem) {
        console.log(`Processing item ${listing.item_id}:`, {
          shouldShowProcessingItems,
          result,
          status: listing.status,
        });
      }

      return result;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.list_price - b.list_price;
        case "price-high":
          return b.list_price - a.list_price;
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "largest-discount":
          // Calculate discount as the difference between list price and sales price
          const aDiscount = a.salePrice ? a.list_price - a.salePrice : 0;
          const bDiscount = b.salePrice ? b.list_price - b.salePrice : 0;
          return bDiscount - aDiscount; // Largest discount first
        case "percent-off-retail":
          // Calculate % off retail for "New" condition items
          const aIsNew =
            getStandardizedCondition(a) === "New" && a.estimated_retail_price;
          const bIsNew =
            getStandardizedCondition(b) === "New" && b.estimated_retail_price;

          if (!aIsNew && !bIsNew) return 0;
          if (!aIsNew) return 1; // b comes first
          if (!bIsNew) return -1; // a comes first

          const aPercentOff =
            ((a.estimated_retail_price - a.list_price) /
              a.estimated_retail_price) *
            100;
          const bPercentOff =
            ((b.estimated_retail_price - b.list_price) /
              b.estimated_retail_price) *
            100;
          return bPercentOff - aPercentOff; // Largest % off first
        default:
          return 0;
      }
    });

  const toggleSaved = (id: string) => {
    setSavedListings((prev) => {
      const newSet = new Set(prev);
      const isCurrentlySaved = newSet.has(id);

      if (isCurrentlySaved) {
        newSet.delete(id);
      } else {
        newSet.add(id);

        // Track AddToWishlist event when item is saved
        const listing = listings.find((l) => l.item_id === id);
        if (listing) {
          trackAddToWishlist({
            content_name: listing.title,
            content_category: `${listing.department}/${listing.category}/${listing.subCategory}`,
            content_ids: [listing.item_id],
            value: listing.list_price,
            currency: "USD",
            brand: listing.brand || undefined,
            condition: listing.facebookCondition || undefined,
            availability:
              listing.status === "LISTED" ? "in stock" : "out of stock",
            price: listing.list_price,
            sale_price: listing.salePrice || undefined,
            gtin: listing.gtin || undefined,
          }).catch((error) => {
            console.error("Error tracking AddToWishlist:", error);
            // Don't fail the save functionality if tracking fails
          });
        }
      }

      return newSet;
    });
  };

  const toggleHidden = (id: string) => {
    setHiddenListings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const openModal = (listing: any) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
  };

  const navigateToListingDetail = (listingId: string) => {
    router.push(`/list-item/${listingId}`);
  };

  const approveQuestion = (questionId: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === questionId ? { ...q, is_approved: true, is_public: true } : q
      )
    );
  };

  const handleBuyNow = async () => {
    if (!selectedListing || !isAuthenticated) {
      setAuthError(true);
      return;
    }

    setLoadingPurchase(true);
    await purchaseServiceBuyNow(
      selectedListing,
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
    if (!selectedListing) return;

    setOwnListingConfirmOpen(false);
    setLoadingPurchase(true);

    await confirmOwnPurchase(
      selectedListing,
      (error) => {
        alert(error);
        setLoadingPurchase(false);
      }, // onError
      () => {
        // onSuccess - loading will continue until redirect
      }
    );
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSignupError("");
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source: "listings_auth_error" }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.message === "Email already subscribed") {
          setSignupError(
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
              source: "listings_auth_error",
              signup_number: data.signupNumber,
            });
          } catch (trackingError) {
            console.error(
              "Error tracking CompleteRegistration (listings auth):",
              trackingError
            );
            // Don't fail the signup if tracking fails
          }
        }
      } else {
        setSignupError(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setSignupError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use Facebook Marketplace categories for consistent filtering
  const categories = ["All", ...getFacebookCategories()];

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in_transit":
      case "in-transit":
      case "transit":
        return {
          text: "In Transit",
          className: "bg-blue-600 text-white",
        };
      case "sold":
      case "completed":
        return {
          text: "Sold",
          className: "bg-gray-600 text-white",
        };
      case "pending":
        return {
          text: "Pending",
          className: "bg-yellow-600 text-white",
        };
      case "active":
      case "listed":
      case "available":
      default:
        // Show "Available" for active/listed listings
        return {
          text: "Available",
          className: "bg-green-600 text-white",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate time until next price drop based on discount schedule
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

  const getTimeUntilNextDrop = (discountSchedule: any, createdAt: string) => {
    // Return null during server-side rendering to prevent hydration mismatch
    if (!isClient) {
      return null;
    }

    // Import discount schedule logic
    const DISCOUNT_SCHEDULES: Record<string, any> = {
      "Turbo-30": {
        type: "Turbo-30",
        dropIntervals: [0, 3, 6, 9, 12, 15, 18, 21, 24, 30],
        dropPercentages: [100, 95, 90, 85, 80, 75, 70, 65, 60, 0],
        totalDuration: 30,
      },
      "Classic-60": {
        type: "Classic-60",
        dropIntervals: [0, 7, 14, 21, 28, 35, 42, 49, 56, 60],
        dropPercentages: [100, 90, 80, 75, 70, 65, 60, 55, 50, 0],
        totalDuration: 60,
      },
    };

    const scheduleType = discountSchedule?.type || "Classic-60";
    const schedule = DISCOUNT_SCHEDULES[scheduleType];

    if (!schedule) {
      return null;
    }

    const now = new Date();
    const created = new Date(createdAt);
    const daysSinceCreation = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If listing has expired, no more drops
    if (daysSinceCreation >= schedule.totalDuration) {
      return null;
    }

    // Find the next drop
    for (let i = 0; i < schedule.dropIntervals.length; i++) {
      if (schedule.dropIntervals[i] > daysSinceCreation) {
        const daysUntilNextDrop = schedule.dropIntervals[i] - daysSinceCreation;

        if (daysUntilNextDrop === 0) {
          return "Any moment now...";
        } else if (daysUntilNextDrop === 1) {
          return "1d";
        } else {
          return `${daysUntilNextDrop}d`;
        }
      }
    }

    return null; // No more drops
  };

  // Helper function to check if price drop is within 24 hours
  const isPriceDropWithin24Hours = (
    discountSchedule: any,
    createdAt: string
  ) => {
    if (!isClient) {
      return false;
    }

    const timeUntilNext = getTimeUntilNextDrop(discountSchedule, createdAt);
    if (!timeUntilNext) {
      return false;
    }

    // Check if it's "Any moment now..." or "1d"
    return timeUntilNext === "Any moment now..." || timeUntilNext === "1d";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Active Listings
            </h1>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2">
              {/* Filter Panel Toggle Button */}
              <Button
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white px-4 py-2 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredListings.length} of {listings.length} listings
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Bookmark className="h-4 w-4 text-[#D4AF3D]" />
              {savedListings.size} saved
            </span>
            <span className="flex items-center gap-1">
              <EyeOff className="h-4 w-4 text-gray-500" />
              {hiddenListings.size} hidden
            </span>
          </div>
        </div>
      </div>

      {/* Main Content with Side Panel */}
      <div className="flex relative">
        {/* Listings Grid */}
        <div
          className={`flex-1 transition-all duration-300 ${
            filterPanelOpen ? "mr-80" : "mr-0"
          } max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => {
              const isSaved = savedListings.has(listing.item_id);
              const isHidden = hiddenListings.has(listing.item_id);

              return (
                <div
                  key={listing.item_id}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${
                    isHidden ? "opacity-60" : ""
                  } ${listing.status === "sold" ? "opacity-75" : ""}`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden group">
                    {listing.all_images && listing.all_images.length > 1 ? (
                      <ImageCarousel
                        images={listing.all_images}
                        alt={listing.title}
                        className="w-full h-full"
                        showArrows={true}
                        showDots={false}
                        autoPlay={false}
                      />
                    ) : (
                      <img
                        src={listing.image_urls_staged[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    )}

                    {/* Time Left Badge */}
                    {(() => {
                      const timeLeft = getTimeUntilNextDrop(
                        listing.discount_schedule,
                        listing.created_at
                      );
                      return (
                        timeLeft && (
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeLeft}
                          </div>
                        )
                      );
                    })()}

                    {/* Newly Listed Badge - Show for items added in last 72 hours */}
                    {isClient &&
                      (() => {
                        const createdDate = new Date(listing.created_at);
                        const now = new Date();
                        const hoursDiff =
                          (now.getTime() - createdDate.getTime()) /
                          (1000 * 60 * 60);
                        return hoursDiff <= 72 ? (
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                            Newly Listed
                          </div>
                        ) : null;
                      })()}

                    {/* Price Drop Badge - Show for price drops in last 48 hours */}
                    {isClient && hasRecentPriceDrop(listing) && (
                      <div className="absolute top-12 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                        Price Drop
                      </div>
                    )}

                    {/* Next Price Drop Badge - Only show if within 24 hours */}
                    {(() => {
                      const isWithin24Hours = isPriceDropWithin24Hours(
                        listing.discount_schedule,
                        listing.created_at
                      );
                      const nextDrop = getTimeUntilNextDrop(
                        listing.discount_schedule,
                        listing.created_at
                      );
                      return (
                        isWithin24Hours &&
                        nextDrop && (
                          <div
                            key={`${listing.item_id}-${timeKey}`}
                            className="absolute bottom-2 left-20 bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                          >
                            <TrendingDown className="h-3 w-3" />
                            {nextDrop}
                          </div>
                        )
                      );
                    })()}

                    {/* QR Code Badge */}
                    <div className="absolute bottom-2 right-2 bg-white/90 p-1 rounded">
                      <QrCode className="h-4 w-4 text-gray-600" />
                    </div>

                    {/* Hidden Badge */}
                    {isHidden && (
                      <div className="absolute top-2 left-12 bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold">
                        HIDDEN
                      </div>
                    )}

                    {/* SOLD Overlay */}
                    {listing.status === "sold" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-red-600 text-white px-6 py-3 rounded-lg text-xl font-bold transform rotate-12 shadow-lg">
                          SOLD
                        </div>
                      </div>
                    )}

                    {/* PROCESSING Overlay */}
                    {listing.status === "processing" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-[#D4AF3D] to-[#b8932f] text-white px-6 py-3 rounded-lg text-xl font-bold transform rotate-12 shadow-lg">
                          PROCESSING
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3
                      className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 hover:text-[#D4AF3D] cursor-pointer"
                      onClick={() => navigateToListingDetail(listing.item_id)}
                    >
                      {listing.title}
                    </h3>

                    {/* Display Price (Sales Price or List Price) */}
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const displayPrice = getDisplayPrice(listing);

                        if (displayPrice.isDiscounted) {
                          return (
                            <>
                              <span className="text-lg font-bold text-green-600">
                                ${displayPrice.price.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ${displayPrice.originalPrice?.toFixed(2)}
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                                Sale
                              </span>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <span className="text-lg font-bold text-gray-900">
                                ${displayPrice.price.toFixed(2)}
                              </span>
                              {listing.list_price <= listing.reserve_price && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                  Reserve Met
                                </span>
                              )}
                            </>
                          );
                        }
                      })()}
                    </div>

                    {/* Treasure Badge or Estimated Retail Price */}
                    {listing.isTreasure ? (
                      <div className="mb-2">
                        <TreasureBadge
                          isTreasure={listing.isTreasure}
                          treasureReason={listing.treasureReason}
                          showReason={false}
                        />
                      </div>
                    ) : (
                      listing.estimated_retail_price &&
                      isNewCondition(getStandardizedCondition(listing)) && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500 line-through">
                            ${listing.estimated_retail_price.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <ArrowDown className="h-3 w-3" />
                            <span>
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

                    {/* Rating - Only show if there are actual reviews */}
                    {listing.rating && listing.reviews > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">
                          {listing.rating}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({listing.reviews})
                        </span>
                      </div>
                    )}

                    {/* Condition & Location */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span
                        className={`px-2 py-1 rounded ${getConditionColor(
                          getStandardizedCondition(listing)
                        )}`}
                      >
                        {getStandardizedCondition(listing)}
                      </span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </div>
                    </div>

                    {/* Brand & Dimensions */}
                    {(listing.brand || listing.dimensions) && (
                      <div className="text-xs text-gray-400 mb-3">
                        {listing.brand && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Brand: {listing.brand}
                          </div>
                        )}
                        {listing.dimensions && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {listing.dimensions}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white text-sm"
                        onClick={() => openModal(listing)}
                      >
                        View Details
                      </Button>

                      {/* Save Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSaved(listing.item_id)}
                        className={`px-3 transition-colors ${
                          isSaved
                            ? "bg-[#D4AF3D] text-white border-[#D4AF3D]"
                            : "hover:bg-[#D4AF3D] hover:text-white hover:border-[#D4AF3D]"
                        }`}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`}
                        />
                      </Button>

                      {/* Hide Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleHidden(listing.item_id)}
                        className={`px-3 transition-colors ${
                          isHidden
                            ? "bg-gray-600 text-white border-gray-600"
                            : "hover:bg-gray-600 hover:text-white hover:border-gray-600"
                        }`}
                      >
                        <EyeOff
                          className={`h-4 w-4 ${
                            isHidden ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* No Results or Coming Soon */}
          {filteredListings.length === 0 && authError && (
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
                    We're putting the finishing touches on our marketplace. Be
                    the first to discover amazing treasures when we launch!
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
                    <p className="text-gray-600">
                      Every item is quality checked
                    </p>
                  </div>
                  <div className="text-center">
                    <Package className="h-8 w-8 text-[#D4AF3D] mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Easy Process
                    </h4>
                    <p className="text-gray-600">Simple buying and selling</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular No Results (when not auth error) */}
          {filteredListings.length === 0 && !authError && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No listings found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Filter Side Panel */}
        <div
          className={`fixed top-[73px] right-0 h-[calc(100vh-73px)] bg-white shadow-lg border-l border-gray-200 transition-transform duration-300 ease-in-out z-40 ${
            filterPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 pt-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Sort & Filter
            </h3>
            <button
              onClick={() => setFilterPanelOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Panel Content */}
          <div
            className="p-4 space-y-6 overflow-y-auto h-full pb-20"
            style={{ width: "320px" }}
          >
            {/* Sort Options */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Sort By
              </h4>
              <div className="space-y-2">
                {[
                  { value: "newest", label: "Newest First" },
                  { value: "price-low", label: "Price: Low to High" },
                  { value: "price-high", label: "Price: High to Low" },
                  { value: "largest-discount", label: "Largest Discount" },
                  { value: "percent-off-retail", label: "% Off Retail" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="sortBy"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-4 w-4 text-[#D4AF3D] border-gray-300 focus:ring-[#D4AF3D]"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Category
              </h4>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* View Options */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                View Options
              </h4>
              <div className="space-y-2">
                <Button
                  variant={showSaved ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowSaved(!showSaved)}
                  className={`w-full flex items-center justify-start gap-2 transition-colors ${
                    showSaved
                      ? "bg-[#D4AF3D] text-white border-[#D4AF3D] hover:bg-[#b8932f]"
                      : "hover:bg-[#D4AF3D] hover:text-white hover:border-[#D4AF3D]"
                  }`}
                >
                  <Bookmark
                    className={`h-4 w-4 ${showSaved ? "fill-current" : ""}`}
                  />
                  {showSaved ? "Show All" : "Saved Only"}
                </Button>

                <Button
                  variant={showHidden ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowHidden(!showHidden)}
                  className={`w-full flex items-center justify-start gap-2 transition-colors ${
                    showHidden
                      ? "bg-gray-600 text-white border-gray-600 hover:bg-gray-700"
                      : "hover:bg-gray-600 hover:text-white hover:border-gray-600"
                  }`}
                >
                  <EyeOff
                    className={`h-4 w-4 ${showHidden ? "fill-current" : ""}`}
                  />
                  {showHidden ? "Hide Hidden" : "Show Hidden"}
                </Button>

                <Button
                  variant={showTreasures ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowTreasures(!showTreasures)}
                  className={`w-full flex items-center justify-start gap-2 transition-colors ${
                    showTreasures
                      ? "bg-[#D4AF3D] text-white border-[#D4AF3D] hover:bg-[#b8932f]"
                      : "hover:bg-[#D4AF3D] hover:text-white hover:border-[#D4AF3D]"
                  }`}
                >
                  <Sparkles
                    className={`h-4 w-4 ${showTreasures ? "fill-current" : ""}`}
                  />
                  {showTreasures ? "Show All" : "Treasures Only"}
                </Button>

                <Button
                  variant={showSold ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowSold(!showSold)}
                  className={`w-full flex items-center justify-start gap-2 transition-colors ${
                    showSold
                      ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                      : "hover:bg-green-600 hover:text-white hover:border-green-600"
                  }`}
                >
                  <CheckCircle
                    className={`h-4 w-4 ${showSold ? "fill-current" : ""}`}
                  />
                  {showSold ? "Hide Sold" : "Show Sold"}
                </Button>

                <Button
                  variant={showProcessing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowProcessing(!showProcessing)}
                  className={`w-full flex items-center justify-start gap-2 transition-colors ${
                    showProcessing
                      ? "bg-[#D4AF3D] text-white border-[#D4AF3D] hover:bg-[#b8932f]"
                      : "hover:bg-[#D4AF3D] hover:text-white hover:border-[#D4AF3D]"
                  }`}
                >
                  <CheckCircle
                    className={`h-4 w-4 ${
                      showProcessing ? "fill-current" : ""
                    }`}
                  />
                  {showProcessing ? "Hide Processing" : "Show Processing"}
                </Button>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSortBy("newest");
                  setSelectedCategory("All");
                  setShowSaved(false);
                  setShowHidden(false);
                  setShowTreasures(false);
                  setShowSold(true); // Reset to default (showing sold items)
                  setShowProcessing(true); // Reset to default (showing processing items)
                }}
                className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Backdrop */}
        {filterPanelOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-30"
            onClick={() => setFilterPanelOpen(false)}
          />
        )}
      </div>

      {/* Listing Details Modal */}
      {isModalOpen && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedListing.title}
                </h2>
                {(() => {
                  const statusBadge = getStatusBadge(selectedListing.status);
                  return statusBadge ? (
                    <div
                      className={`px-3 py-1 rounded text-sm font-medium ${statusBadge.className}`}
                    >
                      {statusBadge.text}
                    </div>
                  ) : null;
                })()}
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Image and Basic Info */}
                <div>
                  {/* Main Image Carousel */}
                  <div className="mb-6">
                    <ImageCarousel
                      images={selectedListing.all_images}
                      alt={selectedListing.title}
                      className="w-full h-96 rounded-lg"
                      showArrows={true}
                      showDots={true}
                      autoPlay={false}
                    />
                  </div>

                  {/* Price Information */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-2">
                      {(() => {
                        const displayPrice = getDisplayPrice(selectedListing);

                        if (displayPrice.isDiscounted) {
                          return (
                            <div className="flex items-center gap-3">
                              <span className="text-3xl font-bold text-green-600">
                                ${displayPrice.price.toFixed(2)}
                              </span>
                              <span className="text-xl text-gray-500 line-through">
                                ${displayPrice.originalPrice?.toFixed(2)}
                              </span>
                              <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                                Sale
                              </span>
                            </div>
                          );
                        } else {
                          return (
                            <span className="text-3xl font-bold text-gray-900">
                              ${displayPrice.price.toFixed(2)}
                            </span>
                          );
                        }
                      })()}
                    </div>
                    {(() => {
                      const displayPrice = getDisplayPrice(selectedListing);
                      return (
                        displayPrice.price <= selectedListing.reserve_price && (
                          <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded font-medium inline-block">
                            Reserve Met
                          </div>
                        )
                      );
                    })()}
                    {/* Estimated Retail Price - Only show if available and condition is New */}
                    {selectedListing.estimated_retail_price &&
                      isNewCondition(
                        getStandardizedCondition(selectedListing)
                      ) && (
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-lg text-gray-500 line-through">
                            ${selectedListing.estimated_retail_price.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <ArrowDown className="h-4 w-4" />
                            <span className="font-medium">
                              {(() => {
                                const displayPrice =
                                  getDisplayPrice(selectedListing);
                                return Math.round(
                                  ((selectedListing.estimated_retail_price -
                                    displayPrice.price) /
                                    selectedListing.estimated_retail_price) *
                                    100
                                );
                              })()}
                              % Off Retail
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    {isAuthenticated ? (
                      (() => {
                        const buttonState = getBuyNowButtonState({
                          status: selectedListing?.status,
                          isOwner: selectedListing?.user?.id === currentUserId,
                          loadingPurchase,
                        });

                        return (
                          <Button
                            variant="default"
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
                      <div className="flex gap-2 flex-1">
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
                    <Button
                      variant="outline"
                      onClick={() => toggleSaved(selectedListing.item_id)}
                      className={`${
                        savedListings.has(selectedListing.item_id)
                          ? "bg-[#D4AF3D] text-white border-[#D4AF3D]"
                          : ""
                      }`}
                    >
                      <Bookmark
                        className={`h-4 w-4 mr-2 ${
                          savedListings.has(selectedListing.item_id)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                      {savedListings.has(selectedListing.item_id)
                        ? "Saved"
                        : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                      title="Ask a Question"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigateToListingDetail(selectedListing.item_id)
                      }
                      className="flex items-center gap-2 hover:bg-gray-100"
                      title="View Full Details"
                    >
                      <ExternalLink className="h-4 w-4" />
                      See More
                    </Button>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div>
                  {/* Item Details */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Item Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Condition:
                          </span>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${getConditionColor(
                              getStandardizedCondition(selectedListing)
                            )}`}
                          >
                            {getStandardizedCondition(selectedListing)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Status:
                          </span>
                          {(() => {
                            const statusBadge = getStatusBadge(
                              selectedListing.status
                            );
                            return statusBadge ? (
                              <span
                                className={`ml-2 px-2 py-1 rounded text-xs font-medium ${statusBadge.className}`}
                              >
                                {statusBadge.text}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Listed:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {formatDate(selectedListing.created_at)}
                          </span>
                        </div>
                      </div>
                      {(() => {
                        const timeLeft = getTimeUntilNextDrop(
                          selectedListing.discount_schedule,
                          selectedListing.created_at
                        );
                        return (
                          timeLeft && (
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-gray-400" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Time Left:
                                </span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {timeLeft}
                                </span>
                              </div>
                            </div>
                          )
                        );
                      })()}
                      {/* Brand & Dimensions */}
                      {(selectedListing.brand ||
                        selectedListing.dimensions) && (
                        <>
                          {selectedListing.brand && (
                            <div className="flex items-center gap-3">
                              <Tag className="h-5 w-5 text-gray-400" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Brand:
                                </span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {selectedListing.brand}
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedListing.dimensions && (
                            <div className="flex items-center gap-3">
                              <Package className="h-5 w-5 text-gray-400" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Dimensions:
                                </span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {selectedListing.dimensions}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Serial/Model Numbers */}
                      {(selectedListing.serial_number ||
                        selectedListing.model_number) && (
                        <>
                          {selectedListing.serial_number && (
                            <div className="flex items-center gap-3">
                              <Tag className="h-5 w-5 text-gray-400" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Serial Number:
                                </span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {selectedListing.serial_number}
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedListing.model_number && (
                            <div className="flex items-center gap-3">
                              <Tag className="h-5 w-5 text-gray-400" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Model Number:
                                </span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {selectedListing.model_number}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {selectedListing.gtin && (
                        <div className="flex items-center gap-3">
                          <Tag className="h-5 w-5 text-gray-400" />
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              GTIN:
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              {selectedListing.gtin}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seller Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Seller Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Seller:
                          </span>
                          <span className="ml-2 text-sm text-[#D4AF3D] font-medium">
                            {selectedListing.seller_name}
                          </span>
                        </div>
                      </div>
                      {selectedListing.seller_organization && (
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-5 w-5 text-gray-400 flex items-center justify-center">
                            <span className="text-xs font-bold">🏢</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              Organization:
                            </span>
                            <span className="ml-2 text-sm text-[#D4AF3D] font-medium">
                              {selectedListing.seller_organization.name}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Location:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {selectedListing.location}
                          </span>
                        </div>
                      </div>
                      {selectedListing.rating &&
                        selectedListing.reviews > 0 && (
                          <div className="flex items-center gap-3">
                            <Star className="h-5 w-5 text-yellow-400" />
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                Rating:
                              </span>
                              <span className="ml-2 text-sm text-gray-600">
                                {selectedListing.rating} (
                                {selectedListing.reviews} reviews)
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      QR Code
                    </h3>
                    <div className="text-center">
                      <CustomQRCode
                        itemId={selectedListing.item_id}
                        size={120}
                        className="mx-auto"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedListing.description}
                    </p>
                  </div>

                  {/* Questions Section */}
                  <div className="mb-6">
                    <QuestionsDisplay
                      listingId={selectedListing.item_id}
                      listingTitle={selectedListing.title}
                      userId={selectedListing.seller_id}
                      isAdmin={isAdmin}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
