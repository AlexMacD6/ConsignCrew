"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  CheckCircleIcon,
  AlertCircle,
  MapPin,
  Info,
  Lock,
  Upload,
  Loader2,
} from "lucide-react";
import {
  isApprovedZipCodeFromDB,
  getNeighborhoodNameFromDB,
  getApprovedZipCodesFromDB,
} from "../../lib/zipcodes";

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
  "Office Supplies": {
    "Office Furniture": [],
    "Stationery & Paper": ["Notebooks", "Pens", "Planners"],
    "Desk Accessories": [],
    "Office Electronics": ["Printers", "Scanners"],
    "Bundles & Sets": [],
  },
  "Beauty & Personal Care": {
    Skincare: ["Moisturizers", "Serums", "Masks"],
    Haircare: [],
    Fragrances: [],
    "Grooming Tools": [],
    "Bundles & Sets": [],
  },
  "Automotive Parts & Accessories": {
    "Interior Accessories": [],
    "Exterior Accessories": [],
    "Performance Parts": [],
    "Car Care & Detailing": [],
    "Bundles & Sets": [],
  },
  "Garden & Outdoor": {
    "Gardening Tools": [],
    "Planters & Pots": [],
    "Outdoor Décor": [],
    "Grills & Outdoor Cooking": [],
    "Bundles & Sets": [],
  },
  "Pet Supplies": {
    "Beds & Furniture": [],
    "Toys & Enrichment": [],
    "Grooming & Health": [],
    "Bowls & Feeders": [],
    "Bundles & Sets": [],
  },
} as const;

type Department = keyof typeof taxonomy;
type Category = string;
type SubCategory = string;
const conditions = ["New", "Like New", "Good", "Fair"] as const;
const discountSchedules = ["Turbo-30", "Classic-60"] as const;

export default function ListItemPage() {
  // Photo management with S3 integration
  const [photos, setPhotos] = useState<{
    hero: { file: File | null; key: string | null; url: string | null };
    back: { file: File | null; key: string | null; url: string | null };
    proof: { file: File | null; key: string | null; url: string | null };
    additional: Array<{ file: File; key: string | null; url: string | null }>;
  }>({
    hero: { file: null, key: null, url: null },
    back: { file: null, key: null, url: null },
    proof: { file: null, key: null, url: null },
    additional: [],
  });
  const [currentPhotoType, setCurrentPhotoType] = useState<
    "hero" | "back" | "proof" | "additional"
  >("hero");
  const [showFlash, setShowFlash] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Video upload state
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
  const [department, setDepartment] = useState<Department | "">("");
  const [category, setCategory] = useState<Category | "">("");
  const [subCategory, setSubCategory] = useState<SubCategory | "">("");
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState<(typeof conditions)[number] | "">(
    ""
  );
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [zipCode, setZipCode] = useState("");

  // New fields to match listing structure
  const [brand, setBrand] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [estimatedRetailPrice, setEstimatedRetailPrice] = useState("");
  const [discountSchedule, setDiscountSchedule] = useState<
    (typeof discountSchedules)[number] | ""
  >("");

  // Zip code validation state
  const [zipCodeValidation, setZipCodeValidation] = useState<{
    isValid: boolean | null;
    neighborhood: string | null;
  }>({ isValid: null, neighborhood: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Validate zip code when it changes
  useEffect(() => {
    const validateZipCode = async () => {
      if (zipCode && zipCode.length === 5) {
        try {
          const [isValid, neighborhood] = await Promise.all([
            isApprovedZipCodeFromDB(zipCode),
            getNeighborhoodNameFromDB(zipCode),
          ]);
          setZipCodeValidation({ isValid, neighborhood });
        } catch (error) {
          console.error("Error validating zip code:", error);
          setZipCodeValidation({ isValid: false, neighborhood: null });
        }
      } else {
        setZipCodeValidation({ isValid: null, neighborhood: null });
      }
    };

    validateZipCode();
  }, [zipCode]);

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
        const itemId = generateItemId();

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

        setShowFlash(true);
        setTimeout(() => {
          setShowFlash(false);
        }, 800);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        setUploadError(null);

        // Generate item ID for S3 key
        const itemId = generateItemId();

        // Upload file using API route
        const formData = new FormData();
        formData.append("file", file);
        formData.append("photoType", currentPhotoType);
        formData.append("itemId", itemId);

        const uploadResponse = await fetch("/api/upload/photo", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const result = await uploadResponse.json();

        // Update photo state
        if (currentPhotoType === "additional") {
          setPhotos((prev) => ({
            ...prev,
            additional: [
              ...prev.additional,
              {
                file,
                key: result.key,
                url: result.url,
              },
            ],
          }));
        } else {
          setPhotos((prev) => ({
            ...prev,
            [currentPhotoType]: {
              file,
              key: result.key,
              url: result.url,
            },
          }));
        }

        setShowFlash(true);
        setTimeout(() => {
          setShowFlash(false);
          // Move to next photo type or to form
          if (currentPhotoType === "hero") {
            setCurrentPhotoType("back");
          } else if (currentPhotoType === "back") {
            setCurrentPhotoType("proof");
          } else if (currentPhotoType === "proof") {
            setCurrentPhotoType("additional");
          } else {
            setStep(2);
          }
        }, 800);
      } catch (error) {
        console.error("Error uploading image:", error);
        setUploadError(
          error instanceof Error ? error.message : "Upload failed"
        );
      } finally {
        setUploading(false);
      }
    }
  };

  const goToPhotoType = (type: "hero" | "back" | "proof" | "additional") => {
    setCurrentPhotoType(type);
    setStep(1);
  };

  const goBackToPhotos = () => {
    // Determine which photo type to go back to based on what's missing
    if (!photos.hero?.file) {
      setCurrentPhotoType("hero");
    } else if (!photos.back?.file) {
      setCurrentPhotoType("back");
    } else if (!photos.proof?.file) {
      setCurrentPhotoType("proof");
    } else {
      setCurrentPhotoType("additional");
    }
    setStep(1);
  };

  // Photo analysis and auto-filling functions
  const analyzePhotosForAutoFill = () => {
    // This would integrate with AI/ML services to analyze photos
    // For now, we'll provide a framework for auto-filling based on photo analysis

    const autoFillData = {
      department: "",
      category: "",
      subCategory: "",
      condition: "",
      brand: "",
      model: "",
      serialNumber: "",
      description: "",
      estimatedValue: 0,
    };

    // Analyze hero photo for item type and condition
    if (photos.hero?.file) {
      // AI analysis would happen here
      // For now, we'll set some example logic
      autoFillData.condition = "Good"; // Default condition
    }

    // Analyze proof photo for brand, model, serial number
    if (photos.proof?.file) {
      // AI analysis would extract text and identify brand/model
      // This would use OCR and AI to read labels, screens, etc.
    }

    // Analyze back photo for additional details
    if (photos.back?.file) {
      // AI analysis would identify ports, connections, etc.
    }

    return autoFillData;
  };

  const applyAutoFillData = () => {
    const autoFillData = analyzePhotosForAutoFill();

    // Apply auto-filled data to form fields
    if (autoFillData.department)
      setDepartment(autoFillData.department as Department);
    if (autoFillData.category) setCategory(autoFillData.category);
    if (autoFillData.subCategory) setSubCategory(autoFillData.subCategory);
    if (autoFillData.condition)
      setCondition(autoFillData.condition as (typeof conditions)[number]);
    if (autoFillData.brand) setBrand(autoFillData.brand);
    if (autoFillData.model) setModelNumber(autoFillData.model);
    if (autoFillData.serialNumber) setSerialNumber(autoFillData.serialNumber);
    if (autoFillData.description) setDescription(autoFillData.description);
    if (autoFillData.estimatedValue)
      setPrice(autoFillData.estimatedValue.toString());
  };

  const removePhoto = (
    type: "hero" | "back" | "proof" | "additional",
    index?: number
  ) => {
    if (type === "additional" && index !== undefined) {
      setPhotos((prev) => ({
        ...prev,
        additional: prev.additional.filter((_, i) => i !== index),
      }));
    } else {
      setPhotos((prev) => ({
        ...prev,
        [type]: { file: null, key: null, url: null },
      }));
    }
  };

  const clearVideo = () => {
    setVideo({ file: null, key: null, url: null });
    setVideoUploadError(null);
  };

  const clearCurrentPhoto = () => {
    if (currentPhotoType === "additional") {
      // For additional photos, clear the last one added
      setPhotos((prev) => ({
        ...prev,
        additional: prev.additional.slice(0, -1),
      }));
    } else {
      setPhotos((prev) => ({
        ...prev,
        [currentPhotoType]: { file: null, key: null, url: null },
      }));
    }
  };

  // Navigation functions
  const goToNextPhoto = () => {
    if (currentPhotoType === "hero") {
      setCurrentPhotoType("back");
    } else if (currentPhotoType === "back") {
      setCurrentPhotoType("proof");
    } else if (currentPhotoType === "proof") {
      setCurrentPhotoType("additional");
    } else if (currentPhotoType === "additional") {
      // Only proceed to form if all required photos are uploaded
      if (
        (photos.hero?.file || photos.hero?.url) &&
        (photos.back?.file || photos.back?.url)
      ) {
        setStep(2);
        // Apply auto-fill data when reaching the form
        setTimeout(() => {
          applyAutoFillData();
        }, 100);
      }
    }
  };

  const goToPreviousPhoto = () => {
    if (currentPhotoType === "back") {
      setCurrentPhotoType("hero");
    } else if (currentPhotoType === "proof") {
      setCurrentPhotoType("back");
    } else if (currentPhotoType === "additional") {
      setCurrentPhotoType("proof");
    }
  };

  const canGoNext = () => {
    if (currentPhotoType === "hero")
      return photos.hero?.file !== null || photos.hero?.url !== null;
    if (currentPhotoType === "back")
      return photos.back?.file !== null || photos.back?.url !== null;
    if (currentPhotoType === "proof")
      return photos.proof?.file !== null || photos.proof?.url !== null;
    if (currentPhotoType === "additional") {
      // Only allow going to form if all required photos are uploaded
      return (
        (photos.hero?.file !== null || photos.hero?.url !== null) &&
        (photos.back?.file !== null || photos.back?.url !== null)
      );
    }
    return false;
  };

  const canGoBack = () => {
    if (currentPhotoType === "hero") return false;
    return true;
  };

  const isFormValid =
    (photos.hero?.file || photos.hero?.url) &&
    (photos.back?.file || photos.back?.url) &&
    department &&
    category &&
    subCategory &&
    title &&
    condition &&
    price &&
    description &&
    zipCode &&
    zipCodeValidation.isValid === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      try {
        const formData = {
          photos: {
            hero: photos.hero?.key,
            back: photos.back?.key,
            proof: photos.proof?.key,
            additional: photos.additional.map((f) => f.key),
          },
          videoUrl: video.url,
          department,
          category,
          subCategory,
          title,
          condition,
          price: parseFloat(price),
          description,
          zipCode,
          neighborhood: zipCodeValidation.neighborhood || "Unknown Area",
          brand,
          dimensions,
          serialNumber,
          modelNumber,
          estimatedRetailPrice: estimatedRetailPrice
            ? parseFloat(estimatedRetailPrice)
            : null,
          discountSchedule,
        };

        console.table(formData);

        const response = await fetch("/api/listings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create listing");
        }

        const result = await response.json();
        console.log("Listing created successfully:", result);

        // Redirect to listings page
        router.push("/listings");
      } catch (error) {
        console.error("Error creating listing:", error);
        alert(
          `Failed to create listing: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  };

  // Generate auto-generated fields preview
  const generateItemId = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    return `cc_${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}_${dateStr}_${timeStr}`;
  };

  const generateQRCode = (itemId: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${itemId}`;
  };

  const calculateFee = (price: number) => {
    return price * 0.085; // 8.5% fee
  };

  const calculateReservePrice = (price: number) => {
    return price * 0.75; // 75% of list price
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-6xl mx-auto">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white rounded-xl shadow-lg p-8 relative">
            {/* Navigation Buttons - Top Corners */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              {/* Back Button - Top Left */}
              <button
                type="button"
                onClick={goToPreviousPhoto}
                disabled={!canGoBack()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  canGoBack()
                    ? "bg-gray-500 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Back
              </button>

              {/* Next Button - Top Right */}
              <button
                type="button"
                onClick={goToNextPhoto}
                disabled={!canGoNext()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  canGoNext()
                    ? "bg-[#D4AF3D] text-white hover:bg-[#b8932f]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {currentPhotoType === "additional"
                  ? "Continue to Form"
                  : "Next"}
              </button>
            </div>

            <h1 className="text-2xl font-bold mb-6 text-[#D4AF3D] mt-16">
              Photo Requirements
            </h1>

            {/* Photo Progress with Previews */}
            <div className="flex items-center gap-4 mb-8">
              {/* Photo 1 - Hero */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentPhotoType === "hero"
                      ? "bg-[#D4AF3D] text-white ring-2 ring-[#D4AF3D] ring-offset-2"
                      : photos.hero?.file || photos.hero?.url
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                {photos.hero?.url && photos.hero.url.trim() !== "" && (
                  <div className="relative w-12 h-12">
                    <img
                      src={photos.hero.url}
                      alt="Hero photo preview"
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removePhoto("hero")}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Photo 2 - Back */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentPhotoType === "back"
                      ? "bg-[#D4AF3D] text-white ring-2 ring-[#D4AF3D] ring-offset-2"
                      : photos.back?.file || photos.back?.url
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                {photos.back?.url && photos.back.url.trim() !== "" && (
                  <div className="relative w-12 h-12">
                    <img
                      src={photos.back.url}
                      alt="Back photo preview"
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removePhoto("back")}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Photo 3 - Proof */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentPhotoType === "proof"
                      ? "bg-[#D4AF3D] text-white ring-2 ring-[#D4AF3D] ring-offset-2"
                      : photos.proof?.file || photos.proof?.url
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                {photos.proof?.url && photos.proof.url.trim() !== "" && (
                  <div className="relative w-12 h-12">
                    <img
                      src={photos.proof.url}
                      alt="Proof photo preview"
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removePhoto("proof")}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Photos */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`text-sm font-medium transition-colors ${
                    currentPhotoType === "additional"
                      ? "text-[#D4AF3D] font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  +
                </div>
                {photos.additional.length > 0 && (
                  <div className="flex gap-1">
                    {photos.additional.slice(0, 2).map((photo, index) => {
                      const imageSrc =
                        photo.url ||
                        (photo.file ? URL.createObjectURL(photo.file) : null);
                      return imageSrc ? (
                        <div key={index} className="relative w-12 h-12">
                          <img
                            src={imageSrc}
                            alt={`Additional photo ${index + 1} preview`}
                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => removePhoto("additional", index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                    {photos.additional.length > 2 && (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                        +{photos.additional.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Photo Requirements Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    Required Photos for Auto-Fill
                  </p>
                  <p>
                    Photos #1 and #2 are required to proceed to the form. These
                    photos will be analyzed to automatically fill in item
                    details.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Photo Type Instructions */}
            <div className="text-center mb-6 max-w-md">
              <h2 className="text-lg font-semibold mb-2">
                {currentPhotoType === "hero" && "Photo #1: Front-On Hero"}
                {currentPhotoType === "back" &&
                  "Photo #2: Full Back / Underside"}
                {currentPhotoType === "proof" &&
                  "Photo #3: Proof / Identification"}
                {currentPhotoType === "additional" &&
                  "Additional Photos (Optional)"}
              </h2>

              <div className="text-sm text-gray-600 mb-4">
                {currentPhotoType === "hero" && (
                  <>
                    <p className="font-medium mb-2">What to capture:</p>
                    <p>
                      Entire item, centered, front-facing. Include any
                      detachable pieces that normally stay attached.
                    </p>
                    <p className="font-medium mt-3 mb-2">Shooting tips:</p>
                    <ul className="text-left space-y-1">
                      <li>• Place on uncluttered surface or wall</li>
                      <li>• Shoot straight-on (eye-level), not angled</li>
                      <li>• Fill ~80% of frame—but leave clean margins</li>
                      <li>
                        • Use daylight or neutral lamp; avoid window back-glare
                      </li>
                      <li>• Remove cords, trash, personal items from scene</li>
                    </ul>
                  </>
                )}
                {currentPhotoType === "back" && (
                  <>
                    <p className="font-medium mb-2">What to capture:</p>
                    <p>
                      Entire rear (or underside) of the same item. Show ports,
                      hinges, back fabric, cabinet backs, battery doors.
                    </p>
                    <p className="font-medium mt-3 mb-2">Shooting tips:</p>
                    <ul className="text-left space-y-1">
                      <li>• Step back to capture the whole reverse side</li>
                      <li>• Flip small items face-down on a clean surface</li>
                      <li>• Keep lighting consistent with Photo 1</li>
                      <li>• Don't crop off feet, plugs, or vent areas</li>
                    </ul>
                  </>
                )}
                {currentPhotoType === "proof" && (
                  <>
                    <p className="font-medium mb-2">What to capture:</p>
                    <p>One of the following based on your item type:</p>
                    <ul className="text-left space-y-1 mb-3">
                      <li>
                        • Electronics & Appliances: powered-on screen or label
                        plate with model + serial
                      </li>
                      <li>• Luxury Bags / Shoes: logo stamp & date code</li>
                      <li>
                        • Furniture: wood grain or tag showing brand + fabric
                        code
                      </li>
                      <li>
                        • Collectibles: maker's mark, limited-edition number
                      </li>
                    </ul>
                    <p className="font-medium mb-2">Shooting tips:</p>
                    <ul className="text-left space-y-1">
                      <li>
                        • Fill frame with label or lit screen—text must be
                        legible
                      </li>
                      <li>• Use flash only if it doesn't blow out ink</li>
                      <li>• Hold phone steady; tap focus on text</li>
                      <li>
                        • For power shots, show full screen—no standby splash
                      </li>
                    </ul>
                  </>
                )}
                {currentPhotoType === "additional" && (
                  <>
                    <p className="font-medium mb-2">
                      Additional Photos (up to 10):
                    </p>
                    <p>
                      Show unique features, damage, accessories, or different
                      angles that help buyers understand the item.
                    </p>
                    <p className="font-medium mt-3 mb-2">Guidance:</p>
                    <ul className="text-left space-y-1">
                      <li>• Close-ups of any damage or wear</li>
                      <li>• Different angles or perspectives</li>
                      <li>• Included accessories or parts</li>
                      <li>• Size comparison with common objects</li>
                      <li>• Functionality demonstrations</li>
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Current Photo Upload Area */}
            <div className="w-full flex flex-col items-center">
              {/* Photo Preview for Current Step */}
              {(() => {
                let imageSrc = null;

                if (currentPhotoType === "hero" && photos.hero) {
                  imageSrc =
                    photos.hero.url ||
                    (photos.hero.file
                      ? URL.createObjectURL(photos.hero.file)
                      : null);
                } else if (currentPhotoType === "back" && photos.back) {
                  imageSrc =
                    photos.back.url ||
                    (photos.back.file
                      ? URL.createObjectURL(photos.back.file)
                      : null);
                } else if (currentPhotoType === "proof" && photos.proof) {
                  imageSrc =
                    photos.proof.url ||
                    (photos.proof.file
                      ? URL.createObjectURL(photos.proof.file)
                      : null);
                } else if (
                  currentPhotoType === "additional" &&
                  photos.additional.length > 0
                ) {
                  const lastAdditional =
                    photos.additional[photos.additional.length - 1];
                  imageSrc =
                    lastAdditional.url ||
                    (lastAdditional.file
                      ? URL.createObjectURL(lastAdditional.file)
                      : null);
                }

                return imageSrc ? (
                  <div className="mb-4 relative">
                    <img
                      src={imageSrc}
                      alt={`${currentPhotoType} photo preview`}
                      className="w-64 h-64 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={clearCurrentPhoto}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : null;
              })()}

              {/* Upload Area */}
              <label
                htmlFor="photo-input"
                className={`w-full flex flex-col items-center cursor-pointer ${
                  (currentPhotoType === "hero" &&
                    (photos.hero?.file || photos.hero?.url)) ||
                  (currentPhotoType === "back" &&
                    (photos.back?.file || photos.back?.url)) ||
                  (currentPhotoType === "proof" &&
                    (photos.proof?.file || photos.proof?.url)) ||
                  (currentPhotoType === "additional" &&
                    photos.additional.length >= 10)
                    ? "hidden"
                    : ""
                }`}
              >
                <input
                  id="photo-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-gray-400">
                    {currentPhotoType === "additional"
                      ? photos.additional.length >= 10
                        ? "Maximum photos reached"
                        : `Add photo ${photos.additional.length + 1} of 10`
                      : "Tap to take or choose a photo"}
                  </span>
                </div>
              </label>
            </div>

            {/* Video Upload Section */}
            <div className="w-full mt-8">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Product Video (Optional)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add a video to showcase your item in action. This helps buyers
                  better understand the product.
                </p>
              </div>

              {/* Video Preview */}
              {video.url && (
                <div className="mb-4 relative">
                  <video
                    src={video.url}
                    className="w-full max-w-md mx-auto aspect-video bg-gray-100 rounded-lg"
                    controls
                    preload="metadata"
                  />
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Video Upload Area */}
              {!video.url && (
                <label
                  htmlFor="video-input"
                  className="w-full flex flex-col items-center cursor-pointer"
                >
                  <input
                    id="video-input"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoChange}
                  />
                  <div className="w-full max-w-md bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8 mb-2">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">
                        {videoUploading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF3D]"></div>
                            <span className="ml-2">Uploading video...</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-4xl mb-2">📹</div>
                            <span>Tap to upload a video</span>
                            <div className="text-xs text-gray-500 mt-1">
                              MP4, WebM, or OGG up to 100MB
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              )}

              {/* Video Upload Error */}
              {videoUploadError && (
                <div className="text-red-600 text-sm text-center mt-2">
                  {videoUploadError}
                </div>
              )}
            </div>

            <p className="text-gray-500 text-sm">
              {currentPhotoType === "additional"
                ? photos.additional.length >= 10
                  ? "Maximum of 10 additional photos reached"
                  : `Add more photos (optional) - ${photos.additional.length}/10`
                : "Tap to take or choose a photo"}
            </p>

            {/* Skip to Form Button (only when all required photos are uploaded) */}
            {currentPhotoType === "additional" &&
              (photos.hero?.file || photos.hero?.url) &&
              (photos.back?.file || photos.back?.url) && (
                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    // Apply auto-fill data when reaching the form
                    setTimeout(() => {
                      applyAutoFillData();
                    }, 100);
                  }}
                  className="mt-4 px-6 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Skip to Form
                </button>
              )}

            {showFlash && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 animate-fade-in">
                <CheckCircleIcon className="w-24 h-24 text-green-500 animate-pop" />
              </div>
            )}
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes pop {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
              }
              .animate-fade-in {
                animation: fade-in 0.3s ease-out;
              }
              .animate-pop {
                animation: pop 0.6s ease-out;
              }
            `}</style>
          </div>
        )}

        {step === 2 && (
          <form
            className="bg-white rounded-xl shadow-lg p-8"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Auto-generated Fields */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-[#D4AF3D]" />
                    Auto-Generated Fields
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    These fields will be automatically generated by TreasureHub
                  </p>

                  <div className="space-y-4">
                    {/* Item ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item ID
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={generateItemId()}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* QR Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        QR Code URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={generateQRCode(generateItemId())}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-xs"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* GTIN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GTIN (Global Trade Item Number)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value="Auto-generated from product database"
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Insights Query */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insights Query
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`${title || "item"} ${
                            category || "category"
                          } ${department || "department"}`}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range (Low - High)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={
                            price
                              ? `$${Math.floor(
                                  parseFloat(price) * 0.8
                                )} - $${Math.floor(parseFloat(price) * 1.2)}`
                              : "Calculated from list price"
                          }
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Reserve Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reserve Price
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={
                            price
                              ? `$${calculateReservePrice(
                                  parseFloat(price)
                                ).toFixed(2)}`
                              : "75% of list price"
                          }
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Service Fee */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Fee
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={
                            price
                              ? `$${calculateFee(parseFloat(price)).toFixed(
                                  2
                                )} (8.5%)`
                              : "8.5% of list price"
                          }
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value="LISTED"
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Created At */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Created At
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={new Date().toISOString()}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Editable Fields */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Editable Fields
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Fill out these fields to complete your listing
                  </p>

                  {/* Photo Gallery */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Uploaded Photos
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Hero Photo */}
                      {photos.hero && (
                        <div className="relative">
                          <img
                            src={
                              photos.hero.url ||
                              (photos.hero.file
                                ? URL.createObjectURL(photos.hero.file)
                                : "")
                            }
                            alt="Hero"
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            1
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto("hero")}
                            className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Back Photo */}
                      {photos.back && (
                        <div className="relative">
                          <img
                            src={
                              photos.back.url ||
                              (photos.back.file
                                ? URL.createObjectURL(photos.back.file)
                                : "")
                            }
                            alt="Back"
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            2
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto("back")}
                            className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Proof Photo */}
                      {photos.proof && (
                        <div className="relative">
                          <img
                            src={
                              photos.proof.url ||
                              (photos.proof.file
                                ? URL.createObjectURL(photos.proof.file)
                                : "")
                            }
                            alt="Proof"
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            3
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto("proof")}
                            className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Additional Photos */}
                      {photos.additional.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={
                              photo.url ||
                              (photo.file
                                ? URL.createObjectURL(photo.file)
                                : "")
                            }
                            alt={`Additional ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                            {index + 4}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto("additional", index)}
                            className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add More Photos Button */}
                    <button
                      type="button"
                      onClick={() => goToPhotoType("additional")}
                      className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      + Add More Photos
                    </button>
                  </div>

                  <div className="space-y-4">
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
                        <option value="">Select Department</option>
                        {(Object.keys(taxonomy) as string[]).map((dept) => (
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
                        disabled={!department}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent disabled:bg-gray-100"
                        required
                      >
                        <option value="">Select Category</option>
                        {department &&
                          (Object.keys(taxonomy[department]) as string[]).map(
                            (cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            )
                          )}
                      </select>
                    </div>

                    {/* Sub-category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub-category *
                      </label>
                      <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        disabled={!category}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent disabled:bg-gray-100"
                        required
                      >
                        <option value="">Select Sub-category</option>
                        {category &&
                          department &&
                          (
                            taxonomy[department][
                              category as keyof (typeof taxonomy)[typeof department]
                            ] as unknown as string[]
                          ).map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                        placeholder="Enter item title"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {title.length}/100 characters
                      </p>
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand/Manufacturer
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                        placeholder="e.g., Apple, Nike, Ashley Furniture"
                      />
                    </div>

                    {/* Dimensions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Dimensions
                      </label>
                      <input
                        type="text"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                        placeholder='e.g., 84" W x 35" D x 38" H'
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
                        placeholder="Enter serial number if available"
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
                        placeholder="Enter model number if available"
                      />
                    </div>

                    {/* Estimated Retail Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Retail Price
                      </label>
                      <input
                        type="number"
                        value={estimatedRetailPrice}
                        onChange={(e) =>
                          setEstimatedRetailPrice(e.target.value)
                        }
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Original retail price for comparison
                      </p>
                    </div>

                    {/* Discount Schedule */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Discount Schedule *
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                            >
                              <Info className="w-3 h-3 text-gray-600" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-4" align="start">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-900">
                                Discount Schedule Options
                              </h4>

                              <div className="space-y-3">
                                <div>
                                  <h5 className="font-medium text-blue-600 mb-2">
                                    Turbo-30 (30-Day)
                                  </h5>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <p>
                                      <strong>Price drops every 3 days</strong>
                                    </p>
                                    <div className="bg-gray-50 p-2 rounded">
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="font-medium">Day</div>
                                        <div className="font-medium">Price</div>
                                        <div className="font-medium">Drop</div>
                                        <div>0</div>
                                        <div>100%</div>
                                        <div>0%</div>
                                        <div>3</div>
                                        <div>95%</div>
                                        <div>-5%</div>
                                        <div>6</div>
                                        <div>90%</div>
                                        <div>-10%</div>
                                        <div>9</div>
                                        <div>85%</div>
                                        <div>-15%</div>
                                        <div>12</div>
                                        <div>80%</div>
                                        <div>-20%</div>
                                        <div>15</div>
                                        <div>75%</div>
                                        <div>-25%</div>
                                        <div>18</div>
                                        <div>70%</div>
                                        <div>-30%</div>
                                        <div>21</div>
                                        <div>65%</div>
                                        <div>-35%</div>
                                        <div>24</div>
                                        <div>60%</div>
                                        <div>-40%</div>
                                        <div>30</div>
                                        <div>Expire</div>
                                        <div>-</div>
                                      </div>
                                    </div>
                                    <p className="text-gray-500">
                                      • Expires after 30 days
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="font-medium text-green-600 mb-2">
                                    Classic-60 (60-Day)
                                  </h5>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <p>
                                      <strong>Price drops every 7 days</strong>
                                    </p>
                                    <div className="bg-gray-50 p-2 rounded">
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="font-medium">Day</div>
                                        <div className="font-medium">Price</div>
                                        <div className="font-medium">Drop</div>
                                        <div>0</div>
                                        <div>100%</div>
                                        <div>0%</div>
                                        <div>7</div>
                                        <div>90%</div>
                                        <div>-10%</div>
                                        <div>14</div>
                                        <div>80%</div>
                                        <div>-20%</div>
                                        <div>21</div>
                                        <div>75%</div>
                                        <div>-25%</div>
                                        <div>28</div>
                                        <div>70%</div>
                                        <div>-30%</div>
                                        <div>35</div>
                                        <div>65%</div>
                                        <div>-35%</div>
                                        <div>42</div>
                                        <div>60%</div>
                                        <div>-40%</div>
                                        <div>49</div>
                                        <div>55%</div>
                                        <div>-45%</div>
                                        <div>56</div>
                                        <div>50%</div>
                                        <div>-50%</div>
                                        <div>60</div>
                                        <div>Expire</div>
                                        <div>-</div>
                                      </div>
                                    </div>
                                    <p className="mt-2 text-gray-500">
                                      • 25% drop triggers opt-out modal
                                    </p>
                                    <p className="text-gray-500">
                                      • Expires after 60 days
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="text-xs text-gray-500 border-t pt-2">
                                <p>
                                  <strong>Note:</strong> All schedules respect
                                  your reserve price minimum.
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <select
                        value={discountSchedule}
                        onChange={(e) =>
                          setDiscountSchedule(
                            e.target.value as (typeof discountSchedules)[number]
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                        required
                      >
                        <option value="">Select Discount Schedule</option>
                        {discountSchedules.map((schedule) => (
                          <option key={schedule} value={schedule}>
                            {schedule}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Turbo-30: 30min drops for 7 days | Classic-60: 60min
                        drops for 14 days
                      </p>
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condition *
                      </label>
                      <div className="space-y-2">
                        {conditions.map((cond) => (
                          <label key={cond} className="flex items-center">
                            <input
                              type="radio"
                              name="condition"
                              value={cond}
                              checked={condition === cond}
                              onChange={(e) =>
                                setCondition(
                                  e.target.value as (typeof conditions)[number]
                                )
                              }
                              className="mr-2"
                              required
                            />
                            {cond}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        List Price ($) *
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                        placeholder="Describe your item..."
                        required
                      />
                    </div>

                    {/* ZIP Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          maxLength={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent pr-10"
                          placeholder="77007"
                          required
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {zipCode &&
                            zipCode.length === 5 &&
                            (zipCodeValidation.isValid === true ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            ) : zipCodeValidation.isValid === false ? (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D4AF3D]"></div>
                            ))}
                        </div>
                      </div>
                      {zipCode && zipCode.length === 5 && (
                        <div className="mt-2">
                          {zipCodeValidation.isValid === true ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <MapPin className="h-4 w-4" />
                              <span>{zipCodeValidation.neighborhood}</span>
                            </div>
                          ) : zipCodeValidation.isValid === false ? (
                            <div className="text-sm text-red-600">
                              ZIP code not in approved service area
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Validating ZIP code...
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Must be in TreasureHub service area
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 left-0 right-0 bg-white pt-6 pb-2">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={goBackToPhotos}
                >
                  Back to Photos
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="flex-1"
                  disabled={!isFormValid}
                >
                  Post Listing
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
