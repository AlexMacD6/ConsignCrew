"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
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
  CheckCircle,
  Edit,
  Play,
} from "lucide-react";
import { getApprovedZipCodesFromDB } from "../../lib/zipcodes";
import { authClient } from "../../lib/auth-client";
import { useUserPermissions } from "../../hooks/useUserPermissions";
import {
  // generateStagedPhoto, // TODO: Re-enable in Phase 2
  ComprehensiveListingData,
  mapConditionToFacebook,
  mapFacebookToGoogleProductCategory,
} from "../../lib/ai-service";
import { mapToGoogleProductCategory } from "../../lib/google-product-categories";
import {
  FACEBOOK_TAXONOMY,
  getDepartments as fbGetDepartments,
  getCategories as fbGetCategories,
  getSubCategories as fbGetSubCategories,
  validateCategoryHierarchy,
} from "../../lib/facebook-taxonomy";
// FormGenerationData interface moved to ai-service for unified typing
import { FormGenerationData } from "../../lib/ai-form-generator";
import VideoUpload from "../../components/VideoUpload";
import VideoProcessingModal from "../../components/VideoProcessingModal";
import CustomQRCode from "../../components/CustomQRCode";
import ProgressBar, { Step } from "../../components/ProgressBar";
import DeliveryCategory from "../../components/DeliveryCategory";
import BasicFormFields from "../../components/BasicFormFields";
import CategorySelector from "../../components/CategorySelector";
import ProductDimensions from "../../components/ProductDimensions";
import FacebookShopIntegration from "../../components/FacebookShopIntegration";
import ProductSpecifications from "../../components/ProductSpecifications";
import InventorySelector from "../../components/InventorySelector";
import TreasureDetection from "../../components/TreasureDetection";
import AdditionalFormFields from "../../components/AdditionalFormFields";
import PhotoDisplay from "../../components/PhotoDisplay";
import VideoDisplay from "../../components/VideoDisplay";
import FormSection from "../../components/FormSection";
import MediaPreview from "../../components/MediaPreview";
import {
  ConfidenceBadge,
  ConfidenceSummary,
} from "../../components/ConfidenceIndicator";
import HybridInput from "../../components/HybridInput";
import {
  GENDER_OPTIONS,
  AGE_GROUP_OPTIONS,
  COLOR_SUGGESTIONS,
  MATERIAL_SUGGESTIONS,
  PATTERN_SUGGESTIONS,
  STYLE_SUGGESTIONS,
  processProductSpecs,
  validateGender,
  validateAgeGroup,
  validateItemGroupId,
  type Gender,
  type AgeGroup,
} from "../../lib/product-specifications";

// Use centralized Facebook taxonomy
const taxonomy = FACEBOOK_TAXONOMY;

type Department = keyof typeof taxonomy;
type Category = keyof (typeof taxonomy)[Department] | string;
type SubCategory = string;
const conditions = [
  "New",
  "Used - Like New",
  "Used - Good",
  "Used - Fair",
] as const;
const discountSchedules = ["Turbo-30", "Classic-60"] as const;

export default function ListItemPage() {
  const { data: session } = authClient.useSession();
  const {
    canListItems,
    isSeller,
    isBuyer,
    isLoading: permissionsLoading,
  } = useUserPermissions();
  const routerNavigation = useRouter();

  // ALL STATE DECLARATIONS MUST BE BEFORE ANY CONDITIONAL RETURNS
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
    additional: [], // Ensure it's always an array
  });
  const [currentPhotoType, setCurrentPhotoType] = useState<
    "hero" | "back" | "proof" | "additional"
  >("hero");
  const [showFlash, setShowFlash] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [department, setDepartment] = useState<Department | "">("");
  const [category, setCategory] = useState<Category | "">("");
  const [subCategory, setSubCategory] = useState<SubCategory | "">("");
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState<(typeof conditions)[number] | "">(
    ""
  );
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [userInput, setUserInput] = useState("");
  const [zipCode, setZipCode] = useState("");

  // New fields to match listing structure
  const [brand, setBrand] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [dimensionsConfirmed, setDimensionsConfirmed] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [estimatedRetailPrice, setEstimatedRetailPrice] = useState("");
  const [discountSchedule, setDiscountSchedule] = useState<
    (typeof discountSchedules)[number] | ""
  >("");
  const [deliveryCategory, setDeliveryCategory] = useState<"NORMAL" | "BULK">(
    "NORMAL"
  );

  // Facebook Shop Integration Fields
  const [facebookShopEnabled, setFacebookShopEnabled] = useState(true);
  const [facebookBrand, setFacebookBrand] = useState("");
  const [facebookCondition, setFacebookCondition] = useState("");
  const [facebookGtin, setFacebookGtin] = useState("");
  const [gtinEdited, setGtinEdited] = useState(false);

  // External Item ID shown separately (do not map to GTIN)
  const [externalItemId, setExternalItemId] = useState("");

  // Google Product Category (Legacy - keeping for backward compatibility)
  const [googleProductCategory, setGoogleProductCategory] = useState("");

  // Google Product Categories (New separated fields)
  const [googleProductCategoryPrimary, setGoogleProductCategoryPrimary] =
    useState("");
  const [googleProductCategorySecondary, setGoogleProductCategorySecondary] =
    useState("");
  const [googleProductCategoryTertiary, setGoogleProductCategoryTertiary] =
    useState("");

  const [availableGoogleCategories, setAvailableGoogleCategories] = useState<
    string[]
  >([]);

  // Product Specifications (Facebook Shop Fields)
  const [quantity, setQuantity] = useState("1");
  const [salePrice, setSalePrice] = useState("");
  const [salePriceEffectiveDate, setSalePriceEffectiveDate] = useState("");
  const [itemGroupId, setItemGroupId] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [material, setMaterial] = useState("");
  const [pattern, setPattern] = useState("");
  const [style, setStyle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Treasure detection state
  const [isTreasure, setIsTreasure] = useState(false);
  const [treasureReason, setTreasureReason] = useState("");

  // Additional state that was defined later - moving here to fix hooks order
  const [reservePrice, setReservePrice] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");

  // Inventory selection state
  const [isItemInInventory, setIsItemInInventory] = useState<boolean | null>(
    null
  );
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotalPages, setInventoryTotalPages] = useState(1);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false); // Default to showing all items

  // Zip code validation state
  const [zipCodeValidation, setZipCodeValidation] = useState<{
    isValid: boolean | null;
    neighborhood: string | null;
  }>({ isValid: null, neighborhood: null });

  // Video upload state
  const [videoData, setVideoData] = useState<{
    videoId: string | null;
    videoUrl: string | null;
    processingStatus: string | null;
    transcodeJobId: string | null;
    uploadMethod: "direct" | "ai" | null;
    uploadedAt: Date | null;
    duration: number | null;
    fileSize: number | null;
    format: string | null;
    resolution: string | null;
    thumbnailUrl: string | null;
    hlsUrl: string | null;
    dashUrl: string | null;
    frameUrls: string[];
    processing: boolean;
    error: string | null;
    uploaded: boolean;
  }>({
    videoId: null,
    videoUrl: null,
    processingStatus: null,
    transcodeJobId: null,
    uploadMethod: null,
    uploadedAt: null,
    duration: null,
    fileSize: null,
    format: null,
    resolution: null,
    thumbnailUrl: null,
    hlsUrl: null,
    dashUrl: null,
    frameUrls: [],
    processing: false,
    error: null,
    uploaded: false,
  });

  // Photo upload method selection
  const [uploadMethod, setUploadMethod] = useState<"single" | "bulk">("single");
  const [bulkPhotos, setBulkPhotos] = useState<
    Array<{
      file: File;
      url: string | null;
      preview: string;
      type?: "hero" | "back" | "proof" | "additional";
    }>
  >([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  // AI analysis state (legacy - keeping for staged photo)
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);
  const [priceReasoning, setPriceReasoning] = useState<string>("");

  // Comprehensive AI listing state
  const [comprehensiveListing, setComprehensiveListing] =
    useState<ComprehensiveListingData | null>(null);
  const [confidenceScores, setConfidenceScores] = useState<any>(null);
  const [generatedQRCode, setGeneratedQRCode] = useState<string>("");
  const [generatedListingId, setGeneratedListingId] = useState<string>("");
  const [generatingComprehensive, setGeneratingComprehensive] = useState(false);
  const [comprehensiveError, setComprehensiveError] = useState<string | null>(
    null
  );

  // UI state for collapsible sections
  const [showPhotos, setShowPhotos] = useState(false);
  const [showVideoFrames, setShowVideoFrames] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  // Phase 2: Staged photo data state
  const [stagedPhotoData, setStagedPhotoData] = useState<{
    referenceImageUrl: string;
    stagingPrompt: string;
    processedImageUrl: string | null;
    generatedImageUrl?: string;
    generating: boolean;
    error: string | null;
  } | null>(null);

  // Form validation errors state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Refs and other hooks (must be before early returns)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Video upload handlers (memoized to prevent unnecessary re-renders)
  const handleVideoUploaded = useCallback(
    async (data: {
      videoId: string;
      frameUrls: string[];
      thumbnailUrl: string;
      duration: number;
    }) => {
      console.log("Video uploaded successfully:", data);
      console.log("Data structure:", JSON.stringify(data, null, 2));
      console.log("Frame URLs received:", data.frameUrls);
      console.log("Frame count:", data.frameUrls?.length || 0);
      // Generate video URL from videoId using CloudFront domain
      const cdnDomain =
        process.env.NEXT_PUBLIC_CDN_URL ||
        "https://dtlqyjbwka60p.cloudfront.net";
      const videoUrl = `${cdnDomain}/processed/videos/${data.videoId}.mp4`;

      setVideoData((prev) => ({
        ...prev,
        videoId: data.videoId,
        videoUrl: videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        frameUrls: data.frameUrls,
        duration: data.duration,
        processing: false,
        error: null,
        uploaded: true,
      }));

      // Show a brief success message
      setTimeout(() => {
        setVideoData((prev) => ({ ...prev, processing: false }));
      }, 3000); // Hide processing indicator after 3 seconds
    },
    []
  );

  const handleVideoStarted = useCallback(() => {
    // Video upload started - mark as processing and allow user to continue
    setVideoData((prev) => ({
      ...prev,
      processing: true,
      uploaded: true,
    }));
  }, []);

  const handleVideoError = useCallback((error: string) => {
    console.error("Video upload error:", error);
    setVideoData((prev) => ({
      ...prev,
      error,
      processing: false,
    }));
  }, []);

  // Helper functions (need to be available for useEffect hooks)
  const hasMinimumPhotos = () => {
    return (
      (photos.hero?.file || photos.hero?.url) &&
      (photos.back?.file || photos.back?.url) &&
      (photos.proof?.file || photos.proof?.url)
    );
  };

  const generateItemId = () => {
    // Generate 6-character alphanumeric ID
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const calculateReservePrice = (price: number) => {
    return price * 0.6; // 60% of list price
  };

  // Load inventory items for modal
  const loadInventoryItems = useCallback(async () => {
    setIsLoadingInventory(true);
    try {
      const params = new URLSearchParams();
      if (inventorySearchQuery) {
        params.append("q", inventorySearchQuery);
      }
      params.append("page", String(inventoryPage));
      params.append("limit", "25");
      if (showAvailableOnly) {
        params.append("availableOnly", "true");
      }

      const response = await fetch(
        `/api/admin/inventory/items?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.items || []);
        setInventoryTotalPages(data.pagination.totalPages || 1);
      } else {
        console.error("Failed to load inventory");
        setInventoryItems([]);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      setInventoryItems([]);
    } finally {
      setIsLoadingInventory(false);
    }
  }, [inventorySearchQuery, inventoryPage, showAvailableOnly]);

  // UseEffect hooks - must come before early returns
  // Redirect users without listing permissions away from this page
  useEffect(() => {
    if (!permissionsLoading && !canListItems) {
      routerNavigation.push("/listings"); // Redirect to browse instead
    }
  }, [canListItems, permissionsLoading, routerNavigation]);

  // Set neighborhood based on zip code (simplified without validation)
  useEffect(() => {
    if (zipCode && zipCode.length === 5) {
      // For now, just set a default neighborhood
      setZipCodeValidation({
        isValid: true,
        neighborhood: "Houston Area",
      });
    } else {
      setZipCodeValidation({ isValid: null, neighborhood: null });
    }
  }, [zipCode]);

  // Validate minimum photo requirements when step changes
  useEffect(() => {
    if (step === 3 && !hasMinimumPhotos()) {
      // If user somehow gets to step 3 without minimum photos, redirect back to photos
      setStep(2);
      // Go to the first missing photo type
      if (!photos.hero?.file && !photos.hero?.url) {
        setCurrentPhotoType("hero");
      } else if (!photos.back?.file && !photos.back?.url) {
        setCurrentPhotoType("back");
      } else {
        setCurrentPhotoType("additional");
      }
    }
  }, [step, photos.hero, photos.back]);

  // Generate itemId once when component mounts
  useEffect(() => {
    if (!itemId) {
      setItemId(generateItemId());
    }
  }, [itemId]);

  // Auto-populate reserve price when list price changes
  useEffect(() => {
    if (price && !reservePrice) {
      setReservePrice(calculateReservePrice(parseFloat(price)).toFixed(2));
    }
  }, [price, reservePrice]);

  // Fetch user's ZIP code from profile
  useEffect(() => {
    const fetchUserZipCode = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const userData = await response.json();
          if (userData.user?.zipCode && !zipCode) {
            setZipCode(userData.user.zipCode);
          }
        }
      } catch (error) {
        console.error("Error fetching user ZIP code:", error);
      }
    };

    fetchUserZipCode();
  }, [zipCode]);

  // Load inventory when modal opens or search query changes
  useEffect(() => {
    if (showInventoryModal) {
      loadInventoryItems();
    }
  }, [showInventoryModal, loadInventoryItems]);

  // Cleanup modal state on component unmount
  useEffect(() => {
    return () => {
      setShowInventoryModal(false);
    };
  }, []);

  // Handle escape key to close inventory modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showInventoryModal) {
        setShowInventoryModal(false);
      }
    };

    if (showInventoryModal) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [showInventoryModal]);

  // Sync Item ID display from inventory selection (read-only field)
  useEffect(() => {
    if (selectedInventoryItem?.itemNumber) {
      setExternalItemId(selectedInventoryItem.itemNumber);
    }
  }, [selectedInventoryItem]);

  // Early returns for permissions - must come after ALL hooks
  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#D4AF3D]" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Checking Your Permissions
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your access level...
          </p>
          <div className="mt-4 text-sm text-gray-500">
            This may take a few seconds
          </div>
        </div>
      </div>
    );
  }

  if (!canListItems) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h1>
          <p className="text-gray-600 mb-4">
            This feature is only available to sellers. You can browse and
            purchase items instead.
          </p>

          <div className="space-y-3">
            <Button onClick={() => routerNavigation.push("/listings")}>
              Browse Items
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="ml-2"
            >
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get confidence color
  const getConfidenceColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // TODO: Re-enable staged photo state in Phase 2
  // Staged photo state
  // const [stagedPhoto, setStagedPhoto] = useState<{
  //   url: string | null;
  //   generating: boolean;
  //   error: string | null;
  // }>({
  //   url: null,
  //   generating: false,
  //   error: null,
  // });

  // Tag management functions
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // Safety check function for map operations
  const safeMap = <T, R>(
    array: T[] | undefined | null,
    callback: (item: T, index: number) => R
  ): R[] => {
    return Array.isArray(array) ? array.map(callback) : [];
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        setUploadError(null);

        // Use stored itemId for S3 key
        const uploadItemId = itemId || generateItemId();

        // Upload file using API route
        const formData = new FormData();
        formData.append("file", file);
        formData.append("photoType", currentPhotoType);
        formData.append("itemId", uploadItemId);

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
          // Move to next photo type (but not to form)
          if (currentPhotoType === "hero") {
            setCurrentPhotoType("back");
          } else if (currentPhotoType === "back") {
            setCurrentPhotoType("proof");
          } else if (currentPhotoType === "proof") {
            setCurrentPhotoType("additional");
          }
          // Note: For additional photos, stay on additional and let user click "Proceed to Form"
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

  // Video upload handlers moved to top of component to fix hooks order

  const handleVideoProcessing = (processing: boolean) => {
    setVideoData((prev) => ({
      ...prev,
      processing,
    }));
  };

  const goToPhotoType = (type: "hero" | "back" | "proof" | "additional") => {
    setCurrentPhotoType(type);
    setStep(1);
  };

  const goBackToPhotos = () => {
    // Determine which photo type to go back to based on what's missing
    if (!photos.hero?.file && !photos.hero?.url) {
      setCurrentPhotoType("hero");
    } else if (!photos.back?.file && !photos.back?.url) {
      setCurrentPhotoType("back");
    } else if (!photos.proof?.file && !photos.proof?.url) {
      setCurrentPhotoType("proof");
    } else {
      setCurrentPhotoType("additional");
    }
    setStep(1);
  };

  // Bulk photo upload handlers
  const handleBulkPhotoSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newBulkPhotos = files.map((file) => ({
        file,
        url: null, // Will be set after upload
        preview: URL.createObjectURL(file),
        type: undefined, // Will be auto-categorized later
      }));
      setBulkPhotos(newBulkPhotos);
    }
  };

  const handleBulkPhotoUpload = async () => {
    if (bulkPhotos.length === 0) return;

    try {
      setBulkUploading(true);
      setUploadError(null);

      // Use stored itemId for S3 key
      const uploadItemId = itemId || generateItemId();

      // Auto-categorize photos based on order and requirements
      const categorizedPhotos = autoCategorizePhotos(bulkPhotos);

      // Upload each photo
      for (const photo of categorizedPhotos) {
        if (photo.type) {
          const formData = new FormData();
          formData.append("file", photo.file);
          formData.append("photoType", photo.type);
          formData.append("itemId", uploadItemId);

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
          if (photo.type === "additional") {
            setPhotos((prev) => ({
              ...prev,
              additional: [
                ...prev.additional,
                {
                  file: photo.file,
                  key: result.key,
                  url: result.url,
                },
              ],
            }));
          } else if (
            photo.type &&
            (photo.type === "hero" ||
              photo.type === "back" ||
              photo.type === "proof")
          ) {
            const photoType = photo.type as "hero" | "back" | "proof";
            setPhotos((prev) => ({
              ...prev,
              [photoType]: {
                file: photo.file,
                key: result.key,
                url: result.url,
              },
            }));
          }
        }
      }

      // Clear bulk photos and show success
      setBulkPhotos([]);
      setShowFlash(true);
      setTimeout(() => {
        setShowFlash(false);
        // Move to form generation step
        setStep(3);
        // Automatically trigger form field generation
        setTimeout(async () => {
          try {
            console.log("🚀 Starting auto form generation...");
            await generateFormFieldsData();
            console.log("✅ Auto form generation completed successfully");
          } catch (error) {
            console.error("❌ Auto form generation failed:", error);
            setComprehensiveError(
              "AI form generation failed. You can still fill out the form manually."
            );
          }
        }, 1000);
      }, 800);
    } catch (error) {
      console.error("Error uploading bulk photos:", error);
      setUploadError(
        error instanceof Error ? error.message : "Bulk upload failed"
      );
    } finally {
      setBulkUploading(false);
    }
  };

  const autoCategorizePhotos = (photos: typeof bulkPhotos) => {
    // This will now be handled by the comprehensive AI endpoint during form generation
    // For now, use improved simple logic as a placeholder
    return autoCategorizePhotosSimple(photos);
  };

  const autoCategorizePhotosSimple = (photos: typeof bulkPhotos) => {
    const categorized = [...photos];
    let heroIndex = -1;
    let backIndex = -1;
    let proofIndex = -1;

    // Improved simple logic: look for clues in filenames/metadata
    // This is still not ideal but better than pure sequential assignment
    for (let i = 0; i < categorized.length; i++) {
      const photo = categorized[i];
      const filename = photo.file?.name?.toLowerCase() || "";

      // Try to identify hero (front-facing) photos
      if (
        heroIndex === -1 &&
        (filename.includes("front") ||
          filename.includes("hero") ||
          filename.includes("main") ||
          i === 0) // Default first photo as hero
      ) {
        photo.type = "hero";
        heroIndex = i;
      }
      // Try to identify back photos
      else if (
        backIndex === -1 &&
        (filename.includes("back") ||
          filename.includes("rear") ||
          filename.includes("behind") ||
          i === 1) // Default second photo as back
      ) {
        photo.type = "back";
        backIndex = i;
      }
      // Try to identify proof photos
      else if (
        proofIndex === -1 &&
        (filename.includes("proof") ||
          filename.includes("label") ||
          filename.includes("serial") ||
          filename.includes("model") ||
          i === 2) // Default third photo as proof
      ) {
        photo.type = "proof";
        proofIndex = i;
      }
      // Everything else is additional
      else {
        photo.type = "additional";
      }
    }

    // Ensure we have at least hero and back assigned
    if (heroIndex === -1 && categorized.length > 0) {
      categorized[0].type = "hero";
    }
    if (backIndex === -1 && categorized.length > 1) {
      categorized[1].type = "back";
    }

    return categorized;
  };

  const validateBulkPhotos = () => {
    return bulkPhotos.length >= 2; // Need at least hero and back
  };

  const clearBulkPhotos = () => {
    setBulkPhotos([]);
  };

  const removeBulkPhoto = (index: number) => {
    setBulkPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Legacy AI analysis function - removed in favor of comprehensive AI workflow

  // TODO: Re-enable staged photo generation in Phase 2
  // const generateStagedPhotoAsync = async (
  //   photoUrls: string[],
  //   productDescription: string,
  //   department: string,
  //   category: string
  // ) => {
  //   try {
  //     setStagedPhoto((prev) => ({ ...prev, generating: true, error: null }));

  //     const stagedPhotoData = await generateStagedPhoto({
  //       photoUrls,
  //       productDescription,
  //       department,
  //       category,
  //     });

  //     setStagedPhoto({
  //       url: stagedPhotoData.stagedPhotoUrl,
  //       generating: false,
  //       error: null,
  //     });

  //     console.log("Staged photo generated successfully:", stagedPhotoData);
  //   } catch (error) {
  //     console.error("Error generating staged photo:", error);
  //     setStagedPhoto({
  //       url: null,
  //       generating: false,
  //       error:
  //         error instanceof Error
  //           ? error.message
  //           : "Failed to generate staged photo",
  //     });
  //   }
  // };

  // Updated to use unified AI service for form field generation

  const generateFormFieldsData = async () => {
    // Collect photo URLs for AI analysis - convert S3 to CloudFront URLs
    const photoUrls = [
      photos.hero?.url || photos.hero?.key,
      photos.back?.url || photos.back?.key,
      ...(photos.additional
        ? photos.additional.map((p) => p.url || p.key).filter(Boolean)
        : []),
    ]
      .filter(Boolean)
      .map((url) => {
        // Convert S3 URLs to CloudFront URLs for OpenAI access
        if (url && typeof url === "string") {
          if (url.includes("s3.us-east-1.amazonaws.com")) {
            // Convert S3 URL to CloudFront URL
            const s3Path = url.split("s3.us-east-1.amazonaws.com/")[1];
            const cfDomain =
              process.env.NEXT_PUBLIC_CDN_URL ||
              "https://dtlqyjbwka60p.cloudfront.net";
            return `${cfDomain}/${s3Path}`;
          }
          return url;
        }
        return url;
      });

    console.log("🚀 Photo URLs for AI analysis:", photoUrls);
    console.log("🚀 Photos object for AI:", {
      hero: { url: photoUrls[0] || null },
      back: { url: photoUrls[1] || null },
      proof: { url: photoUrls[2] || null },
      additional: photoUrls.slice(3).map((url) => ({ url })),
    });
    console.log("🚀 Raw photos state:", photos);
    console.log("🚀 Photo URLs array:", photoUrls);
    console.log("🚀 Video data for AI:", videoData);
    console.log("🚀 Video frame URLs:", videoData.frameUrls);
    console.log("🚀 Video frame count:", videoData.frameUrls?.length || 0);

    // Use the userInput state variable if available, otherwise use default values
    const aiUserInput = userInput || "Product description for AI analysis";

    setGeneratingComprehensive(true);
    setComprehensiveError(null);

    // Log what we're about to send to the API
    console.log("🚀 Sending to AI API:", {
      userInput,
      photoUrls,
      videoData,
      mode: "comprehensive",
    });

    // Prepare the photos object for the API
    const photosForApi = {
      hero: { url: photoUrls[0] || null },
      back: { url: photoUrls[1] || null },
      proof: { url: photoUrls[2] || null },
      additional: photoUrls.slice(3).map((url) => ({ url })),
    };

    console.log("🚀 Photos object being sent to API:", photosForApi);

    try {
      // Use unified comprehensive listing service
      const response = await fetch("/api/ai/generate-comprehensive-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: aiUserInput,
          photos: photosForApi,
          video:
            videoData.videoId && videoData.thumbnailUrl
              ? {
                  url: videoData.videoUrl,
                  videoId: videoData.videoId,
                  frameUrls: videoData.frameUrls,
                  thumbnailUrl: videoData.thumbnailUrl,
                  duration: videoData.duration || 0,
                }
              : undefined,
          externalItemId: externalItemId || undefined,
          inventoryItem: selectedInventoryItem
            ? {
                id: selectedInventoryItem.id,
                description: selectedInventoryItem.description,
                vendor: selectedInventoryItem.vendor,
                category: selectedInventoryItem.category,
                department: selectedInventoryItem.department,
                itemNumber: selectedInventoryItem.itemNumber,
                lotNumber: selectedInventoryItem.lotNumber,
                quantity: selectedInventoryItem.quantity,
                unitRetail: selectedInventoryItem.unitRetail,
                extRetail: selectedInventoryItem.extRetail,
                unitPurchasePrice: selectedInventoryItem.unitPurchasePrice,
                categoryCode: selectedInventoryItem.categoryCode,
                deptCode: selectedInventoryItem.deptCode,
                // Note: purchasePrice is excluded for privacy
                list: selectedInventoryItem.list
                  ? {
                      name: selectedInventoryItem.list.name,
                      briefDescription:
                        selectedInventoryItem.list.briefDescription,
                      datePurchased: selectedInventoryItem.list.datePurchased,
                      lotNumber: selectedInventoryItem.list.lotNumber,
                    }
                  : undefined,
              }
            : undefined,
          mode: "comprehensive", // Use comprehensive mode for full analysis
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate comprehensive listing"
        );
      }

      const data = await response.json();
      console.log("🎉 Comprehensive Generation Complete:", data);

      // DEBUG: Log model information received from API
      if (data.debug) {
        console.log("🔍 DEBUG: Model Information from API");
        console.log("🔍 Model Requested:", data.debug.modelRequested);
        console.log("🔍 Model Actually Used:", data.debug.modelUsed);
        console.log(
          "🔍 Model Match:",
          data.debug.modelMatch ? "✅ EXACT MATCH" : "❌ MODEL MISMATCH"
        );
        console.log("🔍 Full Debug Info:", data.debug);
      } else {
        console.log("💬 No debug information received from API");
      }

      setComprehensiveListing(data.listingData);

      // Extract confidence scores if available
      if (data.confidenceScores) {
        setConfidenceScores(data.confidenceScores);
        console.log("🎯 Confidence scores set:", data.confidenceScores);
      } else {
        console.log("💬 No confidence scores found in response");
      }

      // Apply the form data to the form
      const listingData = data.listingData;
      console.log("🎉 Setting title to:", listingData.title);
      setTitle(listingData.title);
      setDescription(listingData.description);

      // Use AI-generated Facebook categories as PRIMARY source
      // If AI didn't provide them, fall back to legacy fields
      const aiDepartment =
        listingData.facebookDepartment || listingData.department;
      const aiCategory = listingData.facebookCategory || listingData.category;
      const aiSubCategory =
        listingData.facebookSubCategory || listingData.subCategory;

      console.log(
        "🔍 DEBUG: AI-Generated Facebook Categories (Before Validation)"
      );
      console.log("🔍 Department:", aiDepartment);
      console.log("🔍 Category:", aiCategory);
      console.log("🔍 Sub-Category:", aiSubCategory);

      // Validate and fix category hierarchy
      const validatedCategories = validateCategoryHierarchy(
        aiDepartment || "",
        aiCategory || "",
        aiSubCategory || ""
      );

      console.log("🔍 DEBUG: Validated Facebook Categories (After Validation)");
      console.log("🔍 Department:", validatedCategories.department);
      console.log("🔍 Category:", validatedCategories.category);
      console.log("🔍 Sub-Category:", validatedCategories.subCategory);

      setDepartment(validatedCategories.department as Department);
      setCategory(validatedCategories.category || "");
      setSubCategory(validatedCategories.subCategory || "");

      // Update available Google Product Categories for existing listing
      // (kept as-is; dropdowns for FB are driven by FACEBOOK_TAXONOMY)
      setCondition(listingData.condition || "");
      setPrice(listingData.listPrice.toString());
      setBrand(listingData.brand);
      setHeight(listingData.height ? String(listingData.height) : "");
      setWidth(listingData.width ? String(listingData.width) : "");
      setDepth(listingData.depth ? String(listingData.depth) : "");
      setSerialNumber(listingData.serialNumber || "");
      setModelNumber(listingData.modelNumber || "");
      setDeliveryCategory(listingData.deliveryCategory || "NORMAL");
      // If we have an inventory item with a precise MSRP (unitRetail), prefer that over AI estimate
      const msrpFromInventory = selectedInventoryItem?.unitRetail;
      if (
        typeof msrpFromInventory === "number" &&
        !Number.isNaN(msrpFromInventory)
      ) {
        setEstimatedRetailPrice(msrpFromInventory.toFixed(2));
      } else {
        setEstimatedRetailPrice(listingData.estimatedRetailPrice.toString());
      }
      setDiscountSchedule(
        listingData.discountSchedule as "Turbo-30" | "Classic-60"
      );
      setPriceReasoning(listingData.priceReasoning);

      // Apply Facebook fields
      setFacebookBrand(listingData.facebookBrand || "");
      setFacebookCondition(listingData.facebookCondition || "");
      setFacebookGtin(listingData.facebookGtin || "");

      // DEBUG: Log Google Product Categories received
      console.log("🔍 DEBUG: Google Product Categories Received");
      console.log("🔍 Primary:", listingData.googleProductCategoryPrimary);
      console.log("🔍 Secondary:", listingData.googleProductCategorySecondary);

      // Apply AI photo categorization if available
      if (
        Array.isArray(listingData.photoCategorization) &&
        listingData.photoCategorization.length > 0
      ) {
        console.log(
          "🎨 AI Photo Categorization:",
          listingData.photoCategorization
        );

        // Apply categorization to current photos based on AI analysis
        const newPhotos = { ...photos };
        const allPhotoUrls = [
          photos.hero?.url || photos.hero?.key,
          photos.back?.url || photos.back?.key,
          photos.proof?.url || photos.proof?.key,
          ...(photos.additional || []).map((p) => p.url || p.key),
        ].filter(Boolean);

        // Create new photo structure based on AI categorization
        const categorizedPhotos: {
          hero: { file: File | null; key: string | null; url: string | null };
          back: { file: File | null; key: string | null; url: string | null };
          proof: { file: File | null; key: string | null; url: string | null };
          additional: Array<{
            file: File;
            key: string | null;
            url: string | null;
          }>;
        } = {
          hero: { file: null, key: null, url: null },
          back: { file: null, key: null, url: null },
          proof: { file: null, key: null, url: null },
          additional: [],
        };

        // Apply AI categorization to reorganize photos
        listingData.photoCategorization.forEach(
          (category: string, index: number) => {
            const photoUrl = allPhotoUrls[index];
            if (photoUrl && typeof photoUrl === "string") {
              if (category === "hero") {
                categorizedPhotos.hero = {
                  file: null,
                  key: null,
                  url: photoUrl,
                };
              } else if (category === "back") {
                categorizedPhotos.back = {
                  file: null,
                  key: null,
                  url: photoUrl,
                };
              } else if (category === "proof") {
                categorizedPhotos.proof = {
                  file: null,
                  key: null,
                  url: photoUrl,
                };
              } else if (category === "additional") {
                categorizedPhotos.additional.push({
                  file: null as any,
                  key: null,
                  url: photoUrl,
                });
              }
            }
          }
        );

        setPhotos(categorizedPhotos);
        console.log(
          "🎨 Photos reorganized based on AI categorization:",
          categorizedPhotos
        );
      }
      console.log("🔍 Tertiary:", listingData.googleProductCategoryTertiary);
      console.log("🔍 Legacy Field:", listingData.googleProductCategory);

      // Set the new separated Google Product Category fields
      // If AI provides them, use those; otherwise, map from Facebook categories
      if (
        listingData.googleProductCategoryPrimary &&
        listingData.googleProductCategorySecondary &&
        listingData.googleProductCategoryTertiary
      ) {
        // AI provided complete Google categories
        setGoogleProductCategoryPrimary(
          listingData.googleProductCategoryPrimary
        );
        setGoogleProductCategorySecondary(
          listingData.googleProductCategorySecondary
        );
        setGoogleProductCategoryTertiary(
          listingData.googleProductCategoryTertiary
        );
      } else {
        // AI didn't provide Google categories, map from AI-generated Facebook categories
        const googleMapping = mapFacebookToGoogleProductCategory(
          aiDepartment || "",
          aiCategory || "",
          aiSubCategory || ""
        );
        setGoogleProductCategoryPrimary(googleMapping.primary);
        setGoogleProductCategorySecondary(googleMapping.secondary);
        setGoogleProductCategoryTertiary(googleMapping.tertiary);
      }

      // Also set the legacy field for backward compatibility
      const finalGoogleMapping = {
        primary:
          listingData.googleProductCategoryPrimary ||
          googleProductCategoryPrimary,
        secondary:
          listingData.googleProductCategorySecondary ||
          googleProductCategorySecondary,
        tertiary:
          listingData.googleProductCategoryTertiary ||
          googleProductCategoryTertiary,
      };

      setGoogleProductCategory(
        listingData.googleProductCategory ||
          `${finalGoogleMapping.primary} > ${finalGoogleMapping.secondary} > ${finalGoogleMapping.tertiary}`
      );

      // Note: userInput is preserved so users can see what they originally typed
      // This helps them understand what information the AI used for generation

      // Apply Product Specifications (Facebook Shop Fields)
      setQuantity(listingData.quantity?.toString() || "1");
      setSalePrice(listingData.salePrice?.toString() || "");
      setSalePriceEffectiveDate(listingData.salePriceEffectiveDate || "");
      setItemGroupId(listingData.itemGroupId || "");
      setGender(listingData.gender || "");
      setColor(listingData.color || "");
      setSize(listingData.size || "");
      setAgeGroup(listingData.ageGroup || "");
      setMaterial(listingData.material || "");
      setPattern(listingData.pattern || "");
      setStyle(listingData.style || "");
      setTags(listingData.tags || []);

      // Apply Treasure fields
      setIsTreasure(listingData.isTreasure || false);
      setTreasureReason(listingData.treasureReason || "");

      // Use stored itemId for QR code and listing ID when form fields are generated
      const listingId = itemId || generateItemId();
      const qrCode = generateQRCode(listingId);
      setGeneratedListingId(listingId);
      setGeneratedQRCode(qrCode);

      // Phase 2: Staged photo generation is currently paused
      // if (photos.hero?.url || photos.hero?.key) {
      //   console.log("�� Phase 2 - Starting staged photo generation...");
      //   // ... Phase 2 logic commented out ...
      // }
    } catch (error) {
      console.error("❌ Error generating form fields:", error);
      setComprehensiveError(
        error instanceof Error
          ? error.message
          : "Failed to generate form fields"
      );
    } finally {
      setGeneratingComprehensive(false);
    }
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
    }
    // Note: For additional photos, users should use the "Proceed to Form with AI Analysis" button
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
      // For additional photos, the "Next" button is disabled
      // Users should use the "Proceed to Form with AI Analysis" button instead
      return false;
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
    (photos.proof?.file || photos.proof?.url) &&
    department &&
    category &&
    subCategory &&
    title &&
    condition &&
    price &&
    description;

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!(photos.hero?.file || photos.hero?.url)) {
      errors.push("Hero photo is required");
    }
    if (!(photos.back?.file || photos.back?.url)) {
      errors.push("Back photo is required");
    }
    if (!(photos.proof?.file || photos.proof?.url)) {
      errors.push("Proof photo is required");
    }
    if (!department) {
      errors.push("Department is required");
    }
    if (!category) {
      errors.push("Category is required");
    }
    if (!subCategory) {
      errors.push("Sub-category is required");
    }
    if (!title) {
      errors.push("Title is required");
    }
    if (!condition) {
      errors.push("Condition is required");
    }
    if (!price) {
      errors.push("List price is required");
    }
    if (!description) {
      errors.push("Description is required");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form and collect errors
    const errors = validateForm();
    setValidationErrors(errors);

    if (errors.length === 0) {
      try {
        const formData = {
          photos: {
            staged: stagedPhotoData?.generatedImageUrl || photos.proof?.url, // AI-generated staged photo
            hero: photos.hero,
            back: photos.back,
            proof: photos.proof,
            additional: photos.additional,
          },

          department,
          category,
          subCategory,
          title,
          condition,
          price: parseFloat(price),
          reservePrice: reservePrice
            ? parseFloat(reservePrice)
            : calculateReservePrice(parseFloat(price)),
          description,
          zipCode: zipCode || null,
          neighborhood: zipCodeValidation.neighborhood || "Unknown Area",
          brand,
          height,
          width,
          depth,
          serialNumber,
          modelNumber,
          estimatedRetailPrice: estimatedRetailPrice
            ? parseFloat(estimatedRetailPrice)
            : null,
          discountSchedule,
          deliveryCategory,
          // Facebook Shop Integration Fields
          facebookShopEnabled,
          facebookBrand: brand || null, // Use main brand field
          facebookCondition: condition
            ? mapConditionToFacebook(condition)
            : null, // Map to Facebook format
          facebookGtin: facebookGtin || null,
          googleProductCategory:
            googleProductCategory ||
            comprehensiveListing?.googleProductCategory ||
            null,

          // Product Specifications (Facebook Shop Fields)
          quantity: parseInt(quantity) || 1,
          salePrice: salePrice ? parseFloat(salePrice) : null,
          salePriceEffectiveDate: salePriceEffectiveDate || null,
          itemGroupId: itemGroupId || null,
          ...processProductSpecs({
            gender,
            ageGroup,
            color,
            size,
            material,
            pattern,
            style,
            itemGroupId,
          }),
          tags: tags || [],
          // Treasure fields (from AI or manual)
          isTreasure: isTreasure || comprehensiveListing?.isTreasure || false,
          treasureReason:
            treasureReason || comprehensiveListing?.treasureReason || null,
          itemId: generatedListingId || itemId,
          qrCodeUrl: generatedQRCode || generateQRCode(itemId),
          videoId: videoData.videoId || null, // Add video ID to link video to listing
          // Inventory item relationship
          inventoryItemId: selectedInventoryItem?.id || null,
          inventoryListId: selectedInventoryItem?.list?.id || null,
        };

        console.log("Submitting listing with data:", formData);
        console.log("Google Product Category:", googleProductCategory);
        console.log("Form validation status:", {
          hasHeroPhoto: !!(photos.hero?.file || photos.hero?.url),
          hasBackPhoto: !!(photos.back?.file || photos.back?.url),
          hasDepartment: !!department,
          hasCategory: !!category,
          hasSubCategory: !!subCategory,
          hasTitle: !!title,
          hasCondition: !!condition,
          hasPrice: !!price,
          hasDescription: !!description,
          hasZipCode: !!zipCode,
          zipCodeLength: zipCode?.length,
          hasGoogleProductCategory: !!googleProductCategory,
          isFormValid,
        });

        const response = await fetch("/api/listings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Listing creation failed:", errorData);
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

  const generateQRCode = (itemId: string) => {
    // Generate the full URL for the QR code
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/list-item/${itemId}`;
  };

  // Progress steps configuration
  const progressSteps: Step[] = [
    {
      id: 1,
      title: "Video & Description",
      description: "Upload video (optional) and describe your item",
      status: "pending",
      required: false,
    },
    {
      id: 2,
      title: "Photo Upload",
      description: "Upload required photos (Front, Back, Proof)",
      status: "pending",
      required: true,
    },
    {
      id: 3,
      title: "AI Form Generation",
      description: "AI analyzes photos and generates listing details",
      status: "pending",
      required: true,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-6xl mx-auto">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white rounded-xl shadow-lg p-8 relative">
            {/* Progress Bar */}
            <ProgressBar
              steps={progressSteps}
              currentStep={0}
              className="mb-8 w-full max-w-4xl"
            />

            <h1 className="text-2xl font-bold mb-6 text-[#D4AF3D]">
              Video Upload (Optional)
            </h1>
            <p className="text-gray-600 mb-8 text-center max-w-2xl">
              Upload a video demonstration of your item to enhance your listing.
              Our AI will analyze key frames from your video to provide better
              product insights.
            </p>

            <div className="w-full max-w-2xl">
              {!videoData.uploaded ? (
                <>
                  <VideoUpload
                    onVideoUploaded={handleVideoUploaded}
                    onError={handleVideoError}
                    onStarted={handleVideoStarted}
                    disabled={videoData.processing}
                  />

                  {videoData.error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800">{videoData.error}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Video Processing Started
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your video is being processed in the background. You can
                      continue to photos now.
                    </p>
                  </div>
                </div>
              )}

              {/* Inventory Selection Section */}
              <div className="mt-8 w-full max-w-2xl">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800">
                      Inventory Item Selection
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      Enhanced AI Data
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                    Is this item already in your inventory? Selecting an
                    inventory item will provide detailed information to the AI
                    for better listing generation.
                  </p>

                  {/* Is this item in inventory? */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Is this item in your inventory?
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsItemInInventory(true);
                          setShowInventoryModal(true);
                        }}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          isItemInInventory === true
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        Yes, select from inventory
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsItemInInventory(false);
                          setShowInventoryModal(false);
                          setSelectedInventoryItem(null);
                        }}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          isItemInInventory === false
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        No, new item
                      </button>
                    </div>
                  </div>

                  {/* Inventory Selection Status */}
                  {isItemInInventory === true && (
                    <div className="mb-4">
                      {selectedInventoryItem ? (
                        <div className="p-3 bg-white border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                ✓ Selected:{" "}
                                {selectedInventoryItem.description ||
                                  "No description"}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <div>
                                  {selectedInventoryItem.vendor && (
                                    <>
                                      <span className="font-medium">
                                        Vendor:
                                      </span>{" "}
                                      {selectedInventoryItem.vendor}
                                    </>
                                  )}
                                  {selectedInventoryItem.category && (
                                    <>
                                      {selectedInventoryItem.vendor && " • "}
                                      <span className="font-medium">
                                        Category:
                                      </span>{" "}
                                      {selectedInventoryItem.category}
                                    </>
                                  )}
                                </div>
                                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                  <div>
                                    <span className="font-medium">MSRP:</span>{" "}
                                    {selectedInventoryItem.unitRetail
                                      ? `$${selectedInventoryItem.unitRetail}`
                                      : "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Unit Purchase:
                                    </span>{" "}
                                    {selectedInventoryItem.unitPurchasePrice
                                      ? `$${Number(
                                          selectedInventoryItem.unitPurchasePrice
                                        ).toFixed(2)}`
                                      : "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Item #:</span>{" "}
                                    {selectedInventoryItem.itemNumber || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Lot #:</span>{" "}
                                    {selectedInventoryItem.lotNumber || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Dept/Code:
                                    </span>{" "}
                                    {selectedInventoryItem.department || "N/A"}
                                    {selectedInventoryItem.deptCode
                                      ? ` (${selectedInventoryItem.deptCode})`
                                      : ""}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Ext. Retail:
                                    </span>{" "}
                                    {selectedInventoryItem.extRetail
                                      ? `$${selectedInventoryItem.extRetail}`
                                      : "N/A"}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowInventoryModal(true)}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="text-gray-600">
                              No inventory item selected
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowInventoryModal(true)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Browse Inventory
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* User Input Section - Item Description for AI */}
              <div className="mt-8 w-full max-w-2xl">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">
                      Item Description for AI Analysis
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Enhanced AI Results
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mb-3 leading-relaxed">
                    Describe your item to help our AI generate more accurate
                    listings. Include details about brand, condition, features,
                    and any specific information that photos might not show.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-2">
                      Item Description *
                    </label>
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      placeholder="e.g., This is a vintage leather armchair from the 1960s. It has some wear on the arms but the seat and back are in excellent condition. Made by Herman Miller, includes original tags..."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#b8932f] transition-colors"
                >
                  Continue to Photos
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white rounded-xl shadow-lg p-8 relative">
            {/* Progress Bar */}
            <ProgressBar
              steps={progressSteps}
              currentStep={1}
              className="mb-8 w-full max-w-4xl"
            />

            {/* Navigation Buttons - Top Corners */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              {/* Back to Video Upload Button - Top Left */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg transition-colors bg-gray-500 text-white hover:bg-gray-600"
              >
                Back to Video
              </button>

              {/* Photo Navigation Buttons - Top Right */}
              <div className="flex gap-2">
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
                  Previous Photo
                </button>

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
                  Next Photo
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-6 text-[#D4AF3D] mt-16">
              Photo Requirements
            </h1>

            {/* Upload Method Selection */}
            <div className="w-full max-w-2xl mb-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Choose Your Upload Method
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Single Photo Upload Option */}
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="single"
                      checked={uploadMethod === "single"}
                      onChange={(e) =>
                        setUploadMethod(e.target.value as "single" | "bulk")
                      }
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-lg border-2 transition-all ${
                        uploadMethod === "single"
                          ? "border-[#D4AF3D] bg-[#D4AF3D]/5"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            uploadMethod === "single"
                              ? "border-[#D4AF3D] bg-[#D4AF3D]"
                              : "border-gray-300"
                          }`}
                        >
                          {uploadMethod === "single" && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Single Photo Upload
                          </div>
                          <div className="text-sm text-gray-600">
                            Step-by-step, one photo at a time
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Bulk Photo Upload Option */}
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="bulk"
                      checked={uploadMethod === "bulk"}
                      onChange={(e) =>
                        setUploadMethod(e.target.value as "single" | "bulk")
                      }
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-lg border-2 transition-all ${
                        uploadMethod === "bulk"
                          ? "border-[#D4AF3D] bg-[#D4AF3D]/5"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            uploadMethod === "bulk"
                              ? "border-[#D4AF3D] bg-[#D4AF3D]"
                              : "border-gray-300"
                          }`}
                        >
                          {uploadMethod === "bulk" && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Bulk Photo Upload
                          </div>
                          <div className="text-sm text-gray-600">
                            Upload multiple photos at once
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {videoData.processing && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Video processing in background...</span>
                </div>
              </div>
            )}

            {videoData.uploaded &&
              !videoData.processing &&
              videoData.videoId && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Video ready for AI analysis ({videoData.frameUrls.length}{" "}
                      frames)
                    </span>
                  </div>
                </div>
              )}

            {/* Single Photo Upload Interface */}
            {uploadMethod === "single" && (
              <>
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
                    <span className="text-xs text-red-600 font-medium">
                      Required
                    </span>
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
                          Ã—
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
                    <span className="text-xs text-red-600 font-medium">
                      Required
                    </span>
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
                          Ã—
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
                    <span className="text-xs text-red-600 font-medium">
                      Required
                    </span>
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
                          Ã—
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Additional Photos */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        currentPhotoType === "additional"
                          ? "bg-[#D4AF3D] text-white ring-2 ring-[#D4AF3D] ring-offset-2"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      +
                    </div>
                    <span className="text-xs text-gray-500">Optional</span>
                    {photos.additional && photos.additional.length > 0 && (
                      <div className="flex gap-1">
                        {safeMap(photos.additional, (photo, index) => {
                          const imageSrc =
                            photo.url ||
                            (photo.file
                              ? URL.createObjectURL(photo.file)
                              : null);
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
                                Ã—
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
                        Minimum Photo Requirements
                      </p>
                      <p className="mb-2">
                        <strong>Required:</strong> Photos #1 (Front), #2 (Back),
                        and #3 (Proof) are mandatory to proceed to the form.
                      </p>
                      <p className="mb-2">
                        <strong>Optional:</strong> Additional photos (up to 10)
                        enhance your listing.
                      </p>
                      <p className="text-xs text-blue-600">
                        These photos will be analyzed by AI to automatically
                        fill in item details.
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
                            • Use daylight or neutral lamp; avoid window
                            back-glare
                          </li>
                          <li>
                            • Remove cords, trash, personal items from scene
                          </li>
                        </ul>
                      </>
                    )}
                    {currentPhotoType === "back" && (
                      <>
                        <p className="font-medium mb-2">What to capture:</p>
                        <p>
                          Entire rear (or underside) of the same item. Show
                          ports, hinges, back fabric, cabinet backs, battery
                          doors.
                        </p>
                        <p className="font-medium mt-3 mb-2">Shooting tips:</p>
                        <ul className="text-left space-y-1">
                          <li>• Step back to capture the whole reverse side</li>
                          <li>
                            • Flip small items face-down on a clean surface
                          </li>
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
                            • Electronics & Appliances: powered-on screen or
                            label plate with model + serial
                          </li>
                          <li>• Luxury Bags / Shoes: logo stamp & date code</li>
                          <li>
                            • Furniture: wood grain or tag showing brand +
                            fabric code
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
                            • For power shots, show full screen—no standby
                            splash
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
                          Show unique features, damage, accessories, or
                          different angles that help buyers understand the item.
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
                      photos.additional &&
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
                          Ã—
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
                        photos.additional &&
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
                          ? photos.additional && photos.additional.length >= 10
                            ? "Maximum photos reached"
                            : `Add photo ${
                                photos.additional
                                  ? photos.additional.length + 1
                                  : 1
                              } of 10`
                          : "Tap to take or choose a photo"}
                      </span>
                    </div>
                  </label>
                </div>

                <p className="text-gray-500 text-sm">
                  {currentPhotoType === "additional"
                    ? photos.additional && photos.additional.length >= 10
                      ? "Maximum of 10 additional photos reached"
                      : `Add more photos (optional) - ${
                          photos.additional ? photos.additional.length : 0
                        }/10`
                    : "Tap to take or choose a photo"}
                </p>

                {/* Proceed to Form Button with validation */}
                {currentPhotoType === "additional" && (
                  <div className="mt-4">
                    {hasMinimumPhotos() ? (
                      <button
                        type="button"
                        disabled={videoData.processing}
                        onClick={async () => {
                          // Don't proceed if video is still processing
                          if (videoData.processing) {
                            console.log(
                              "Cannot proceed - video is still processing"
                            );
                            return;
                          }

                          console.log(
                            "Proceed to Form button clicked, current step:",
                            step
                          );
                          // Transition to form and automatically trigger AI enhancement
                          console.log("Setting step to 3");
                          setStep(3);
                          console.log("Step should now be 3");

                          // Automatically trigger form field generation after a short delay to ensure form is rendered
                          setTimeout(async () => {
                            try {
                              console.log(
                                "🚀 Starting auto form generation..."
                              );
                              await generateFormFieldsData();
                              console.log(
                                "✅ Auto form generation completed successfully"
                              );
                            } catch (error) {
                              console.error(
                                "❌ Auto form generation failed:",
                                error
                              );
                              // Show user-friendly error message
                              setComprehensiveError(
                                "AI form generation failed. You can still fill out the form manually."
                              );
                              // Don't block the user experience if AI fails
                            }
                          }, 1000); // Increased delay to ensure form is fully rendered
                        }}
                        className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                          videoData.processing
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-[#D4AF3D] text-white hover:bg-[#b8932f]"
                        }`}
                      >
                        {videoData.processing ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                            Processing Video...
                          </span>
                        ) : (
                          "Generate Form Fields"
                        )}
                      </button>
                    ) : (
                      <div className="text-center">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">
                              Minimum Photo Requirements Not Met
                            </span>
                          </div>
                          <p className="text-sm text-yellow-700">
                            You need at least 2 photos (Front and Back) to
                            proceed to the form.
                          </p>
                          <div className="mt-2 text-xs text-yellow-600">
                            Missing:{" "}
                            {!photos.hero?.file && !photos.hero?.url
                              ? "Front photo, "
                              : ""}
                            {!photos.back?.file && !photos.back?.url
                              ? "Back photo"
                              : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                        >
                          Generate Form Fields
                        </button>
                      </div>
                    )}
                  </div>
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
              </>
            )}

            {/* Bulk Photo Upload Interface */}
            {uploadMethod === "bulk" && (
              <>
                {/* Bulk Photo Selection */}
                <div className="w-full max-w-2xl mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center">
                      Bulk Photo Upload
                    </h3>
                    <p className="text-sm text-blue-700 mb-4 text-center">
                      Select multiple photos at once. We'll automatically
                      categorize them for you.
                    </p>

                    {/* Drag & Drop Area */}
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleBulkPhotoSelection}
                        className="hidden"
                        id="bulk-photo-input"
                      />
                      <label
                        htmlFor="bulk-photo-input"
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="w-12 h-12 text-blue-500" />
                          <div>
                            <p className="text-lg font-medium text-blue-900">
                              {bulkPhotos.length > 0
                                ? `${bulkPhotos.length} photo${
                                    bulkPhotos.length !== 1 ? "s" : ""
                                  } selected`
                                : "Click to select photos or drag & drop"}
                            </p>
                            <p className="text-sm text-blue-600">
                              Minimum 2 photos required (Front + Back)
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Selected Photos Preview */}
                    {bulkPhotos.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-blue-900">
                            Selected Photos ({bulkPhotos.length})
                          </h4>
                          <button
                            onClick={clearBulkPhotos}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Clear All
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {bulkPhotos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo.preview}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                onClick={() => removeBulkPhoto(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Ã—
                              </button>
                              <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {photo.type || "Auto-categorize"}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Upload Button */}
                        <div className="mt-6 text-center">
                          <button
                            onClick={handleBulkPhotoUpload}
                            disabled={!validateBulkPhotos() || bulkUploading}
                            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                              validateBulkPhotos() && !bulkUploading
                                ? "bg-[#D4AF3D] text-white hover:bg-[#b8932f]"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {bulkUploading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading Photos...
                              </span>
                            ) : (
                              `Upload ${bulkPhotos.length} Photo${
                                bulkPhotos.length !== 1 ? "s" : ""
                              } & Generate Form`
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <>
            {/* Progress Bar */}
            <div className="w-full max-w-6xl mx-auto mb-8">
              <ProgressBar
                steps={progressSteps}
                currentStep={2}
                className="w-full"
              />
            </div>

            {/* AI Generation Loading Screen */}
            {generatingComprehensive && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
                  <div className="mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      AI Form Generation in Progress
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Our AI is analyzing your photos and generating
                      comprehensive form fields...
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-[#D4AF3D] h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Phase 1: Complete</span>
                      <span>Phase 2: In Progress</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        Phase 1: Analyzing photos and generating listing data
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        Performing deep market analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        Calculating market-based pricing
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-500">
                        Finalizing comprehensive analysis
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Expected time:</strong> 15-25 seconds
                      <br />
                      <strong>Model:</strong> GPT-5 (deep reasoning & analysis)
                      <br />
                      <strong>Processing:</strong> Phase 1: Listing generation
                      only
                    </p>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Please don't close this window or navigate away
                  </div>
                </div>
              </div>
            )}

            <form
              className="bg-white rounded-xl shadow-lg p-8"
              onSubmit={handleSubmit}
            >
              {/* Facebook Shop Integration Section */}
              <FacebookShopIntegration
                facebookShopEnabled={facebookShopEnabled}
                setFacebookShopEnabled={setFacebookShopEnabled}
              />

              {/* AI Pricing Analysis - Moved to Top */}
              {priceReasoning && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800">
                      AI Pricing Analysis
                    </h3>
                    {confidenceScores?.priceReasoning && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(
                          confidenceScores.priceReasoning.level
                        )}`}
                      >
                        {confidenceScores.priceReasoning.level} Confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {priceReasoning}
                  </p>
                </div>
              )}

              {/* Description Section - Full Width */}
              <div className="mt-6 bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-[#D4AF3D]" />
                  Description
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    Description *
                    {confidenceScores?.description && (
                      <ConfidenceBadge
                        level={confidenceScores.description.level}
                      />
                    )}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="Describe your item in detail. Include features, condition, dimensions, and any relevant information that would help buyers understand your item..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/2000 characters recommended
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Auto-generated Fields */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Info className="h-5 w-5 text-[#D4AF3D]" />
                      Auto-Generated Fields
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      These fields will be automatically generated by
                      TreasureHub
                    </p>

                    {/* ZIP Code - Display Only */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={zipCode || "Not set"}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        placeholder="ZIP code will be set from profile"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Set in your profile settings
                      </p>
                    </div>

                    {/* Item ID - Display Only */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Item ID
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={itemId || "Generating..."}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Unit Purchase Price - Display Only */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Unit Purchase Price
                      </label>
                      <input
                        type="text"
                        value={
                          selectedInventoryItem?.unitPurchasePrice
                            ? `$${selectedInventoryItem.unitPurchasePrice.toFixed(
                                2
                              )}`
                            : "Not available"
                        }
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    {/* Item Number - Display Only */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Item Number
                      </label>
                      <input
                        type="text"
                        value={
                          selectedInventoryItem?.itemNumber || "Not available"
                        }
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Internal inventory identifier (not GTIN/UPC)
                      </p>
                    </div>

                    {/* Lot Number - Display Only */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Lot Number
                      </label>
                      <input
                        type="text"
                        value={
                          selectedInventoryItem?.lotNumber || "Not available"
                        }
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Auto-generated from inventory selection
                      </p>
                    </div>

                    {/* QR Code - Display Only */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        QR Code
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={
                            generatedQRCode ||
                            (itemId && generateQRCode
                              ? generateQRCode(itemId)
                              : "Generating...")
                          }
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-xs"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Media Preview */}
                    <MediaPreview
                      photos={photos}
                      videoData={videoData}
                      showPhotos={showPhotos}
                      setShowPhotos={setShowPhotos}
                      showVideoFrames={showVideoFrames}
                      setShowVideoFrames={setShowVideoFrames}
                      showVideoPlayer={showVideoPlayer}
                      setShowVideoPlayer={setShowVideoPlayer}
                      removePhoto={removePhoto}
                      goToPhotoType={goToPhotoType}
                      safeMap={safeMap}
                    />
                  </div>
                </div>

                {/* Right Column - Editable Fields */}
                <div className="space-y-6">
                  <FormSection
                    department={department}
                    setDepartment={setDepartment}
                    category={category}
                    setCategory={setCategory}
                    subCategory={subCategory}
                    setSubCategory={setSubCategory}
                    title={title}
                    setTitle={setTitle}
                    price={price}
                    setPrice={setPrice}
                    brand={brand}
                    setBrand={setBrand}
                    condition={condition}
                    setCondition={setCondition}
                    height={height}
                    setHeight={setHeight}
                    width={width}
                    setWidth={setWidth}
                    depth={depth}
                    setDepth={setDepth}
                    dimensionsConfirmed={dimensionsConfirmed}
                    setDimensionsConfirmed={setDimensionsConfirmed}
                    reservePrice={reservePrice}
                    setReservePrice={setReservePrice}
                    serialNumber={serialNumber}
                    setSerialNumber={setSerialNumber}
                    modelNumber={modelNumber}
                    setModelNumber={setModelNumber}
                    estimatedRetailPrice={estimatedRetailPrice}
                    setEstimatedRetailPrice={setEstimatedRetailPrice}
                    discountSchedule={discountSchedule}
                    setDiscountSchedule={setDiscountSchedule}
                    facebookGtin={facebookGtin}
                    setFacebookGtin={setFacebookGtin}
                    setGtinEdited={setGtinEdited}
                    deliveryCategory={deliveryCategory}
                    setDeliveryCategory={setDeliveryCategory}
                    selectedInventoryItem={selectedInventoryItem}
                    discountSchedules={discountSchedules}
                    generatedListingId={generatedListingId}
                    itemId={itemId}
                    generateQRCode={generateQRCode}
                    generatedQRCode={generatedQRCode}
                    confidenceScores={confidenceScores}
                    taxonomy={taxonomy}
                  />
                </div>
              </div>

              {/* Product Specifications - Full Page Width */}
              <div className="mt-6 bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-[#D4AF3D]" />
                  Product Specifications
                </h2>
                <ProductSpecifications
                  quantity={quantity}
                  setQuantity={setQuantity}
                  salePrice={salePrice}
                  setSalePrice={setSalePrice}
                  salePriceEffectiveDate={salePriceEffectiveDate}
                  setSalePriceEffectiveDate={setSalePriceEffectiveDate}
                  itemGroupId={itemGroupId}
                  setItemGroupId={setItemGroupId}
                  gender={gender}
                  setGender={setGender}
                  ageGroup={ageGroup}
                  setAgeGroup={setAgeGroup}
                  color={color}
                  setColor={setColor}
                  size={size}
                  setSize={setSize}
                  material={material}
                  setMaterial={setMaterial}
                  pattern={pattern}
                  setPattern={setPattern}
                  style={style}
                  setStyle={setStyle}
                  tags={tags}
                  setTags={setTags}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                  addTag={addTag}
                  removeTag={removeTag}
                  handleTagKeyPress={handleTagKeyPress}
                  confidenceScores={confidenceScores}
                  genderOptions={["male", "female", "unisex"]}
                  ageGroupOptions={[
                    "newborn",
                    "infant",
                    "toddler",
                    "kids",
                    "adult",
                  ]}
                  colorSuggestions={[
                    "Black",
                    "White",
                    "Red",
                    "Blue",
                    "Green",
                    "Yellow",
                    "Brown",
                    "Gray",
                    "Silver",
                    "Gold",
                  ]}
                  materialSuggestions={[
                    "Cotton",
                    "Leather",
                    "Wood",
                    "Metal",
                    "Plastic",
                    "Glass",
                    "Ceramic",
                    "Fabric",
                    "Paper",
                    "Stone",
                  ]}
                  patternSuggestions={[
                    "Solid",
                    "Striped",
                    "Floral",
                    "Plaid",
                    "Polka Dot",
                    "Geometric",
                    "Abstract",
                    "Animal Print",
                    "Tie Dye",
                    "Ombre",
                  ]}
                  styleSuggestions={[
                    "Modern",
                    "Vintage",
                    "Casual",
                    "Formal",
                    "Minimalist",
                    "Bohemian",
                    "Industrial",
                    "Scandinavian",
                    "Traditional",
                    "Contemporary",
                  ]}
                />
              </div>

              <TreasureDetection
                isTreasure={isTreasure}
                setIsTreasure={setIsTreasure}
                treasureReason={treasureReason}
                setTreasureReason={setTreasureReason}
                comprehensiveListing={comprehensiveListing}
              />

              {/* Submit Button Section */}
              <div className="mt-8 flex gap-4">
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
            </form>
          </>
        )}

        <InventorySelector
          showInventoryModal={showInventoryModal}
          setShowInventoryModal={setShowInventoryModal}
          inventoryItems={inventoryItems}
          inventorySearchQuery={inventorySearchQuery}
          setInventorySearchQuery={setInventorySearchQuery}
          selectedInventoryItem={selectedInventoryItem}
          setSelectedInventoryItem={setSelectedInventoryItem}
          inventoryPage={inventoryPage}
          setInventoryPage={setInventoryPage}
          inventoryTotalPages={inventoryTotalPages}
          showAvailableOnly={showAvailableOnly}
          setShowAvailableOnly={setShowAvailableOnly}
          isLoadingInventory={isLoadingInventory}
        />
      </div>
    </div>
  );
}
