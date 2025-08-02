"use client";
import React, { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui/popover";
import {
  CheckCircleIcon,
  AlertCircle,
  MapPin,
  Info,
  Lock,
  Upload,
  Loader2,
  ArrowLeft,
  GripVertical,
  X,
  Play,
} from "lucide-react";
// ZIP code validation now handled via API endpoint

const taxonomy = {
  Furniture: {
    Chairs: ["Dining Chairs", "Office Chairs", "Accent Chairs", "Recliners"],
    Tables: ["Coffee Tables", "Dining Tables", "Side Tables", "Console Tables"],
    "Storage & Shelving": [],
    Seating: ["Sofas", "Loveseats", "Sectionals"],
    "Bedroom Furniture": ["Beds", "Dressers"],
    "Office Furniture": [],
    "Outdoor Furniture": [],
    "Bundles & Sets": [],
  },
  Electronics: {
    "Computers & Tablets": ["Laptops", "Desktops", "Tablets", "Monitors"],
    "Mobile Phones & Accessories": [],
    "Audio Equipment": [
      "Bluetooth Speakers",
      "Studio Headphones",
      "Turntables",
    ],
    "Cameras & Photo": [],
    "Gaming Consoles & Accessories": [],
    "Smart Home Devices": [],
    "Bundles & Sets": [],
  },
  "Home & Living": {
    "Home Décor": ["Wall Mirrors", "Decorative Vases", "Throw Pillows"],
    Lighting: ["Lamps", "Chandeliers", "Sconces"],
    "Rugs & Textiles": [],
    "Candles & Fragrance": [],
    "Storage & Organization": [],
    "Bundles & Sets": [],
  },
  "Art & Collectibles": {
    "Art Prints": [],
    Paintings: [],
    Sculptures: [],
    "Vintage Collectibles": [],
    Memorabilia: [],
    "Bundles & Sets": [],
  },
  "Books & Media": {
    Books: [],
    "Vinyl Records": [],
    "CDs & DVDs": [],
    "Video Games": [],
    "Bundles & Sets": [],
  },
  "Sports & Outdoors": {
    "Camping & Hiking Gear": ["Tents", "Sleeping Bags", "Backpacks"],
    "Bicycles & Accessories": [],
    "Fitness Equipment": [],
    "Water Sports Gear": [],
    "Team Sports Equipment": [],
    "Bundles & Sets": [],
  },
  "Toys & Games": {
    "Board Games": ["Strategy Games", "Family Games", "Party Games"],
    Puzzles: [],
    "Action Figures": [],
    "Educational Toys": [],
    "Dolls & Plush": [],
    "Bundles & Sets": [],
  },
  "Tools & Hardware": {
    "Power Tools": ["Drills", "Saws", "Sanders"],
    "Hand Tools": [],
    "Tool Storage": [],
    "Safety Equipment": [],
    "Bundles & Sets": [],
  },
  "Kitchen & Dining": {
    Cookware: ["Non-stick Pans", "Cast-Iron Skillets", "Baking Sheets"],
    Dinnerware: [],
    "Small Appliances": [],
    "Kitchen Utensils": [],
    "Bundles & Sets": [],
  },
};

type Department = keyof typeof taxonomy;
type Category = string;
type SubCategory = string;

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [department, setDepartment] = useState<Department>("Furniture");
  const [category, setCategory] = useState<Category>("");
  const [subCategory, setSubCategory] = useState<SubCategory>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("EXCELLENT");
  const [price, setPrice] = useState("");
  const [estimatedRetailPrice, setEstimatedRetailPrice] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [brand, setBrand] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [discountSchedule, setDiscountSchedule] = useState("Classic-60");

  // Photo state with drag-and-drop support
  const [photos, setPhotos] = useState({
    hero: null as any,
    back: null as any,
    proof: null as any,
    additional: [] as any[],
  });
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
  const [photoOrder, setPhotoOrder] = useState<string[]>([]);

  // Video state
  const [video, setVideo] = useState<{
    file: File | null;
    key: string | null;
    url: string | null;
  }>({
    file: null,
    key: null,
    url: null,
  });
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  // Validation state
  const [zipCodeValid, setZipCodeValid] = useState<boolean | null>(null);
  const [zipCodeValidating, setZipCodeValidating] = useState(false);

  // Load existing listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/listings/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch listing");
        }

        const data = await response.json();

        if (data.success) {
          const listingData = data.listing;
          setListing(listingData);

          // Populate form with existing data
          setDepartment(listingData.department);
          setCategory(listingData.category);
          setSubCategory(listingData.subCategory);
          setTitle(listingData.title);
          setDescription(listingData.description);
          setCondition(listingData.condition);
          setPrice(listingData.price.toString());
          setEstimatedRetailPrice(
            listingData.estimatedRetailPrice?.toString() || ""
          );
          setZipCode(listingData.zipCode);
          setNeighborhood(listingData.neighborhood);
          setBrand(listingData.brand || "");
          setDimensions(listingData.dimensions || "");
          setSerialNumber(listingData.serialNumber || "");
          setModelNumber(listingData.modelNumber || "");
          setDiscountSchedule(
            listingData.discountSchedule?.type || "Classic-60"
          );

          // Set photos
          setPhotos({
            hero: listingData.photos.hero,
            back: listingData.photos.back,
            proof: listingData.photos.proof,
            additional: listingData.photos.additional || [],
          });

          // Set video
          setVideo({
            file: null,
            key: null,
            url: listingData.videoUrl || null,
          });

          // Initialize photo order
          const order = [];
          if (listingData.photos.hero) order.push("hero");
          if (listingData.photos.back) order.push("back");
          if (listingData.photos.proof) order.push("proof");
          if (listingData.photos.additional) {
            listingData.photos.additional.forEach((_, index) => {
              order.push(`additional-${index}`);
            });
          }
          setPhotoOrder(order);

          // Validate zip code
          if (listingData.zipCode) {
            validateZipCode(listingData.zipCode);
          }
        } else {
          throw new Error(data.error || "Failed to fetch listing");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        setError("Failed to load listing data");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchListing();
    }
  }, [params.id]);

  const validateZipCode = async (zip: string) => {
    setZipCodeValidating(true);
    try {
      const response = await fetch("/api/zipcodes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zipCode: zip }),
      });

      if (!response.ok) {
        throw new Error("Failed to validate ZIP code");
      }

      const data = await response.json();

      if (data.success) {
        setZipCodeValid(data.isValid);
        if (data.isValid && data.area) {
          setNeighborhood(data.area);
        }
      } else {
        setZipCodeValid(false);
      }
    } catch (error) {
      console.error("Error validating zip code:", error);
      setZipCodeValid(false);
    } finally {
      setZipCodeValidating(false);
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        setVideoUploadError("Please select a valid video file");
        return;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setVideoUploadError("Video file size must be less than 100MB");
        return;
      }

      try {
        setVideoUploading(true);
        setVideoUploadError(null);

        // Generate item ID for S3 key
        const itemId = params.id as string;

        // Upload file using API route
        const formData = new FormData();
        formData.append("file", file);
        formData.append("itemId", itemId);
        formData.append("type", "video");

        const uploadResponse = await fetch("/api/upload/video", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Video upload failed");
        }

        const result = await uploadResponse.json();

        // Update video state
        setVideo({
          file,
          key: result.key,
          url: result.url,
        });
      } catch (error) {
        console.error("Error uploading video:", error);
        setVideoUploadError(
          error instanceof Error ? error.message : "Video upload failed"
        );
      } finally {
        setVideoUploading(false);
      }
    }
  };

  const clearVideo = () => {
    setVideo({ file: null, key: null, url: null });
    setVideoUploadError(null);
  };

  // Drag and drop functions for photo reordering
  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    setDraggedPhoto(photoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetPhotoId: string) => {
    e.preventDefault();
    if (draggedPhoto && draggedPhoto !== targetPhotoId) {
      const newOrder = [...photoOrder];
      const draggedIndex = newOrder.indexOf(draggedPhoto);
      const targetIndex = newOrder.indexOf(targetPhotoId);

      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedPhoto);

      setPhotoOrder(newOrder);
    }
    setDraggedPhoto(null);
  };

  const handleDragEnd = () => {
    setDraggedPhoto(null);
  };

  const removePhoto = (photoId: string) => {
    const newOrder = photoOrder.filter((id) => id !== photoId);
    setPhotoOrder(newOrder);

    // Update photos state based on photo type
    if (photoId === "hero") {
      setPhotos((prev) => ({ ...prev, hero: null }));
    } else if (photoId === "back") {
      setPhotos((prev) => ({ ...prev, back: null }));
    } else if (photoId === "proof") {
      setPhotos((prev) => ({ ...prev, proof: null }));
    } else {
      setPhotos((prev) => ({
        ...prev,
        additional: prev.additional.filter(
          (_, index) => `additional-${index}` !== photoId
        ),
      }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      // Update photos state based on current photo type
      setPhotos((prev) => ({
        ...prev,
        hero: data.url,
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!zipCodeValid) {
      setError("Please enter a valid zip code");
      return;
    }

    if (!photos.hero) {
      setError("Please upload a hero photo");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/listings/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          department,
          category,
          subCategory,
          title,
          condition,
          price: parseFloat(price),
          description,
          zipCode,
          neighborhood,
          brand: brand || null,
          dimensions: dimensions || null,
          serialNumber: serialNumber || null,
          modelNumber: modelNumber || null,
          estimatedRetailPrice: estimatedRetailPrice
            ? parseFloat(estimatedRetailPrice)
            : null,
          discountSchedule: { type: discountSchedule },
          photos,
          videoUrl: video.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update listing");
      }

      const data = await response.json();

      if (data.success) {
        // Redirect to the listing detail page
        router.push(`/list-item/${params.id}`);
      } else {
        throw new Error(data.error || "Failed to update listing");
      }
    } catch (error) {
      console.error("Error updating listing:", error);
      setError(
        `Failed to update listing: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading listing data...</p>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Listing
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Listing
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value as Department);
                    setCategory("");
                    setSubCategory("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  required
                >
                  {Object.keys(taxonomy).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {Object.keys(taxonomy[department]).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub Category */}
              {taxonomy[department][category]?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Category
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="">Select Sub Category</option>
                    {taxonomy[department][category].map((subCat) => (
                      <option key={subCat} value={subCat}>
                        {subCat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="Enter a descriptive title for your item"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="Describe your item in detail..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Condition */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing & Condition
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Estimated Retail Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Retail Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={estimatedRetailPrice}
                    onChange={(e) => setEstimatedRetailPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  required
                >
                  <option value="NEW">New</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Location
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zip Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value);
                      setZipCodeValid(null);
                    }}
                    onBlur={() => validateZipCode(zipCode)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="Enter zip code"
                    required
                  />
                  {zipCodeValidating && (
                    <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-gray-400" />
                  )}
                  {zipCodeValid === true && (
                    <CheckCircleIcon className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                  )}
                  {zipCodeValid === false && (
                    <AlertCircle className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />
                  )}
                </div>
                {zipCodeValid === false && (
                  <p className="mt-1 text-sm text-red-600">
                    Please enter a valid zip code in our service area
                  </p>
                )}
              </div>

              {/* Neighborhood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="Neighborhood will be auto-filled"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="e.g., Apple, Samsung, Ashley Furniture"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder='e.g., 24" W x 18" D x 36" H'
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="Serial number if applicable"
                />
              </div>

              {/* Model Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Number
                </label>
                <input
                  type="text"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="Model number if applicable"
                />
              </div>
            </div>
          </div>

          {/* Photos Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
            <p className="text-sm text-gray-600 mb-6">
              Drag and drop photos to reorder them. The first photo will be the
              main image shown in listings.
            </p>

            {/* Photo Grid with Drag and Drop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {photoOrder.map((photoId, index) => {
                let photoUrl = null;
                let photoType = "";

                if (photoId === "hero" && photos.hero) {
                  photoUrl = photos.hero;
                  photoType = "Hero";
                } else if (photoId === "back" && photos.back) {
                  photoUrl = photos.back;
                  photoType = "Back";
                } else if (photoId === "proof" && photos.proof) {
                  photoUrl = photos.proof;
                  photoType = "Proof";
                } else if (photoId.startsWith("additional-")) {
                  const additionalIndex = parseInt(photoId.split("-")[1]);
                  if (photos.additional[additionalIndex]) {
                    photoUrl = photos.additional[additionalIndex];
                    photoType = `Additional ${additionalIndex + 1}`;
                  }
                }

                if (!photoUrl) return null;

                return (
                  <div
                    key={photoId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, photoId)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, photoId)}
                    onDragEnd={handleDragEnd}
                    className={`relative group cursor-move border-2 rounded-lg overflow-hidden ${
                      draggedPhoto === photoId
                        ? "border-[#D4AF3D] opacity-50"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={photoUrl}
                      alt={`${photoType} photo`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <GripVertical className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                        <span className="text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(photoId)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                      {photoType}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Video Upload */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Product Video (Optional)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Add a video to showcase your item in action. This helps buyers
              better understand the product.
            </p>

            {/* Video Preview */}
            {video.url && (
              <div className="mb-4 relative">
                <video
                  src={video.url}
                  className="w-full max-w-md aspect-video bg-gray-100 rounded-lg"
                  controls
                  preload="metadata"
                />
                <button
                  type="button"
                  onClick={clearVideo}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Video Upload Area */}
            {!video.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  MP4, WebM, or OGG up to 100MB
                </p>
              </div>
            )}

            {/* Video Upload Error */}
            {videoUploadError && (
              <div className="text-red-600 text-sm mt-2">
                {videoUploadError}
              </div>
            )}

            {/* Video Upload Progress */}
            {videoUploading && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">
                  Uploading video...
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !zipCodeValid}
              className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
