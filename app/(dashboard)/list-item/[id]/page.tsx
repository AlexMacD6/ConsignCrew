"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Star,
  Tag,
  Clock,
  Calendar,
  User,
  Package,
  DollarSign,
  TrendingDown,
  Bookmark,
  Truck,
  CheckCircle,
  AlertCircle,
  QrCode,
  ExternalLink,
} from "lucide-react";
import QuestionsDisplay from "../../../components/QuestionsDisplay";

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
  fee_pct: 8.5,
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // In a real app, fetch listing data based on params.id
    // For now, use mock data
    setListing(mockListing);
    setLoading(false);
  }, [params.id]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeUntilNextDrop = (
    discountSchedule: string,
    createdAt: string
  ) => {
    // Mock implementation - in real app this would calculate actual time
    return "1d 6h";
  };

  const toggleSaved = (id: string) => {
    setSavedListings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Listing Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The listing you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => router.back()}
            className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Button
                variant="outline"
                onClick={() => toggleSaved(listing.item_id)}
                className={`${
                  savedListings.has(listing.item_id)
                    ? "bg-[#D4AF3D] text-white border-[#D4AF3D]"
                    : ""
                }`}
              >
                <Bookmark
                  className={`h-4 w-4 mr-2 ${
                    savedListings.has(listing.item_id) ? "fill-current" : ""
                  }`}
                />
                {savedListings.has(listing.item_id) ? "Saved" : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(listing.qr_code_url, "_blank")}
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Basic Info */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="mb-6">
              <img
                src={listing.image_urls_staged[selectedImage]}
                alt={listing.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              {/* Image Thumbnails */}
              {listing.image_urls_staged.length > 1 && (
                <div className="flex gap-2 mt-4">
                  {listing.image_urls_staged.map(
                    (image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedImage === index
                            ? "border-[#D4AF3D]"
                            : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${listing.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Price Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${listing.list_price.toFixed(2)}
                </span>
                {listing.list_price <= listing.reserve_price && (
                  <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded font-medium">
                    Reserve Met
                  </div>
                )}
              </div>
              {listing.estimated_retail_price && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg text-gray-500 line-through">
                    ${listing.estimated_retail_price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium">
                      {Math.round(
                        ((listing.estimated_retail_price - listing.list_price) /
                          listing.estimated_retail_price) *
                          100
                      )}
                      % Off Retail
                    </span>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white">
                  Buy it Now
                </Button>
                <Button variant="outline" className="flex-1">
                  Make Offer
                </Button>
              </div>
            </div>

            {/* Item Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Item Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Condition:
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${getConditionColor(listing.condition)}`}
                    >
                      {listing.condition}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Listed:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {formatDate(listing.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Time Left:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {listing.timeLeft}
                    </span>
                  </div>
                </div>
                {(() => {
                  const nextDrop = getTimeUntilNextDrop(
                    listing.discount_schedule,
                    listing.created_at
                  );
                  return (
                    nextDrop && (
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Next Price Drop:
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {nextDrop}
                          </span>
                        </div>
                      </div>
                    )
                  );
                })()}
                {listing.brand && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-gray-400" />
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
                {listing.dimensions && (
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Dimensions:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {listing.dimensions}
                      </span>
                    </div>
                  </div>
                )}
                {listing.serial_number && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-gray-400" />
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
                    <Tag className="h-5 w-5 text-gray-400" />
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
                    <Tag className="h-5 w-5 text-gray-400" />
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
              </div>
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

            {/* Transportation History */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Transportation History
              </h2>
              <div className="space-y-4">
                {transportationHistory.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      {index < transportationHistory.length - 1 && (
                        <div
                          className={`w-0.5 h-8 mt-2 ${
                            step.completed ? "bg-green-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {step.status}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {step.description}
                      </p>
                      {step.timestamp && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(step.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions & Answers */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <QuestionsDisplay
                listingId={listing.item_id}
                listingTitle={listing.title}
                userId={listing.seller_id}
                isAdmin={isAdmin}
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
                      {listing.seller_name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Location:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {listing.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Rating:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {listing.rating} ({listing.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pricing Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">List Price:</span>
                  <span className="text-sm font-medium">
                    ${listing.list_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reserve Price:</span>
                  <span className="text-sm font-medium">
                    ${listing.reserve_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fee:</span>
                  <span className="text-sm font-medium">
                    {listing.fee_pct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price Range:</span>
                  <span className="text-sm font-medium">
                    ${listing.price_range_low} - ${listing.price_range_high}
                  </span>
                </div>
              </div>
            </div>

            {/* Item ID and QR Code */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Item Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Item ID:
                  </span>
                  <p className="text-sm text-gray-600 mt-1 font-mono">
                    {listing.item_id}
                  </p>
                </div>
                <div className="text-center">
                  <img
                    src={listing.qr_code_url}
                    alt="QR Code"
                    className="w-32 h-32 mx-auto border border-gray-200 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Scan to view this listing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
