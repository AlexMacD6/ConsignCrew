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
import VideoUpload from "../../../../components/VideoUpload";
import VideoCarousel from "../../../../components/VideoCarousel";

import { ConfidenceBadge } from "../../../../components/ConfidenceIndicator";
import HybridInput from "../../../../components/HybridInput";
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
} from "../../../../lib/product-specifications";
import { getDisplayPrice } from "../../../../lib/price-calculator";
import { API_ENDPOINTS } from "../../../../lib/api";
import {
  FACEBOOK_TAXONOMY,
  getDepartments,
  getCategories,
  getSubCategories,
} from "../../../../lib/facebook-taxonomy";
import { cachedFetch, apiCache } from "../../../../lib/api-cache";
// ZIP code validation now handled via API endpoint

const discountSchedules = ["Turbo-30", "Classic-60"] as const;

// Use centralized Facebook taxonomy
const taxonomy = FACEBOOK_TAXONOMY;

type Department = keyof typeof taxonomy;
type Category = keyof (typeof taxonomy)[Department] | string;
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
  const [condition, setCondition] = useState<
    "new" | "used" | "refurbished" | ""
  >("");
  const [price, setPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [estimatedRetailPrice, setEstimatedRetailPrice] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [brand, setBrand] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [dimensionsConfirmed, setDimensionsConfirmed] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [discountSchedule, setDiscountSchedule] = useState<
    (typeof discountSchedules)[number] | ""
  >("");
  const [calculatedSalesPrice, setCalculatedSalesPrice] = useState<
    number | null
  >(null);

  // Facebook Shop Integration Fields
  const [facebookShopEnabled, setFacebookShopEnabled] = useState(true);
  const [facebookBrand, setFacebookBrand] = useState("");
  const [facebookCondition, setFacebookCondition] = useState("");
  const [facebookGtin, setFacebookGtin] = useState("");

  // Product Specifications (Facebook Shop Fields)
  const [quantity, setQuantity] = useState("1");
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

  // Inventory linking state
  const [inventoryLists, setInventoryLists] = useState<any[]>([]);
  const [selectedInventoryList, setSelectedInventoryList] =
    useState<string>("");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] =
    useState<string>("");

  // Treasure detection state
  const [isTreasure, setIsTreasure] = useState(false);
  const [treasureReason, setTreasureReason] = useState("");

  // Confidence scores for AI-generated fields
  const [confidenceScores, setConfidenceScores] = useState<any>(null);

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

  // Photo state with drag-and-drop support
  const [photos, setPhotos] = useState({
    hero: null as any,
    back: null as any,
    proof: null as any,
    additional: [] as any[],
  });
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
  const [photoOrder, setPhotoOrder] = useState<string[]>([]);

  // Video state - support for multiple videos
  const [videoData, setVideoData] = useState<{
    videoId: string | null;
    frameUrls: string[];
    thumbnailUrl: string | null;
    duration: number | null;
    uploaded: boolean;
    processing: boolean;
    error: string | null;
  }>({
    videoId: null,
    frameUrls: [],
    thumbnailUrl: null,
    duration: null,
    uploaded: false,
    processing: false,
    error: null,
  });

  // Multiple videos state
  const [videos, setVideos] = useState<
    Array<{
      id: string;
      src: string;
      poster?: string;
      duration?: number;
      title?: string;
    }>
  >([]);

  // Load existing listing data and user profile
  useEffect(() => {
    const fetchListingAndUserData = async () => {
      try {
        setLoading(true);

        // Fetch listing data with caching
        console.log("Fetching listing with ID:", params.id);
        const response = await cachedFetch(
          `/api/listings/${params.id}`,
          {},
          60000
        ); // Cache for 1 minute

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch listing:", response.status, errorText);
          throw new Error(
            `Failed to fetch listing: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          const listingData = data.listing;
          setListing(listingData);

          // Populate form with existing data - ensure all values are strings to prevent controlled/uncontrolled input errors
          setDepartment(listingData.department || "Furniture");
          setCategory(listingData.category || "");
          setSubCategory(listingData.subCategory || "");
          setTitle(listingData.title || "");
          setDescription(listingData.description || "");
          setCondition(listingData.facebookCondition || "");
          setPrice(listingData.price ? listingData.price.toString() : "");
          setReservePrice(
            listingData.reservePrice ? listingData.reservePrice.toString() : ""
          );
          setEstimatedRetailPrice(
            listingData.estimatedRetailPrice
              ? listingData.estimatedRetailPrice.toString()
              : ""
          );
          setZipCode(listingData.zipCode || "");
          setNeighborhood(listingData.neighborhood || "");
          setBrand(listingData.brand || "");
          setHeight(listingData.height ? listingData.height.toString() : "");
          setWidth(listingData.width ? listingData.width.toString() : "");
          setDepth(listingData.depth ? listingData.depth.toString() : "");
          setDimensionsConfirmed(
            !!(listingData.height || listingData.width || listingData.depth)
          );
          setSerialNumber(listingData.serialNumber || "");
          setModelNumber(listingData.modelNumber || "");
          setDiscountSchedule(
            listingData.discountSchedule?.type ||
              listingData.discountSchedule ||
              ""
          );

          // Facebook Shop Integration Fields
          setFacebookShopEnabled(listingData.facebookShopEnabled ?? true);
          setFacebookBrand(listingData.facebookBrand || "");
          setFacebookCondition(listingData.facebookCondition || "");
          setFacebookGtin(listingData.facebookGtin || "");

          // Product Specifications (Facebook Shop Fields)
          setQuantity(listingData.quantity?.toString() || "1");
          setItemGroupId(listingData.itemGroupId || "");
          setGender(listingData.gender || "");
          setColor(listingData.color || "");
          setSize(listingData.size || "");
          setAgeGroup(listingData.ageGroup || "");
          setMaterial(listingData.material || "");
          setPattern(listingData.pattern || "");
          setStyle(listingData.style || "");
          setTags(listingData.tags || []);

          // Treasure fields
          setIsTreasure(listingData.isTreasure || false);
          setTreasureReason(listingData.treasureReason || "");

          // Set photos - ensure all values are properly handled
          setPhotos({
            hero: listingData.photos?.hero || null,
            back: listingData.photos?.back || null,
            proof: listingData.photos?.proof || null,
            additional: listingData.photos?.additional || [],
          });

          // Set video data - handle both single video and multiple videos
          const existingVideos = [];
          const processedVideoIds = new Set<string>(); // Track processed video IDs to avoid duplicates

          // Handle legacy single video (videoUrl) - only if no modern videos exist
          if (
            listingData.videoUrl &&
            !listingData.videos?.length &&
            !listingData.video
          ) {
            existingVideos.push({
              id: "legacy-video",
              src: listingData.videoUrl,
              title: `Video: ${listingData.title}`,
            });
            processedVideoIds.add("legacy-video");
            setVideoData({
              videoId: null,
              frameUrls: [],
              thumbnailUrl: null,
              duration: null,
              uploaded: true,
              processing: false,
              error: null,
            });
          }

          // Prioritize multiple videos array over single video object
          if (
            listingData.videos &&
            Array.isArray(listingData.videos) &&
            listingData.videos.length > 0
          ) {
            listingData.videos.forEach((video: any, index: number) => {
              // Skip if we've already processed this video ID
              if (processedVideoIds.has(video.id)) {
                return;
              }

              const cdnUrl =
                process.env.NEXT_PUBLIC_CDN_URL ||
                "https://dtlqyjbwka60p.cloudfront.net";
              console.log("🎬 Using CDN URL:", cdnUrl, "for video:", video.id);

              const videoKey = video.rawVideoKey || video.processedVideoKey;
              let videoSrc = null;

              if (videoKey && cdnUrl) {
                const cleanDomain = cdnUrl
                  .replace("https://", "")
                  .replace("http://", "");
                videoSrc = `https://${cleanDomain}/${videoKey}`;
              }

              console.log("🎬 Generated video URL:", videoSrc);

              if (videoSrc) {
                console.log("🎬 Video data for", video.id, ":", {
                  thumbnailUrl: video.thumbnailUrl,
                  duration: video.duration,
                  rawVideoKey: video.rawVideoKey,
                  processedVideoKey: video.processedVideoKey,
                });

                existingVideos.push({
                  id: video.id,
                  src: videoSrc,
                  poster: video.thumbnailUrl || undefined,
                  duration: video.duration || undefined,
                  title: `${listingData.title} - Video ${index + 1}`,
                });
                processedVideoIds.add(video.id);
              }
            });
          }
          // Fallback to single video object only if no videos array exists
          else if (
            listingData.video &&
            !processedVideoIds.has(listingData.video.id)
          ) {
            const cdnUrl =
              process.env.NEXT_PUBLIC_CDN_URL ||
              "https://dtlqyjbwka60p.cloudfront.net";
            console.log(
              "🎬 Using CDN URL:",
              cdnUrl,
              "for single video:",
              listingData.video.id
            );

            const videoKey =
              listingData.video.rawVideoKey ||
              listingData.video.processedVideoKey;
            let videoSrc = null;

            if (videoKey && cdnUrl) {
              const cleanDomain = cdnUrl
                .replace("https://", "")
                .replace("http://", "");
              videoSrc = `https://${cleanDomain}/${videoKey}`;
            }

            console.log("🎬 Generated single video URL:", videoSrc);

            if (videoSrc) {
              existingVideos.push({
                id: listingData.video.id,
                src: videoSrc,
                poster: listingData.video.thumbnailUrl || undefined,
                duration: listingData.video.duration || undefined,
                title: `Video: ${listingData.title}`,
              });
              processedVideoIds.add(listingData.video.id);
            }
          }

          console.log(
            "🎬 Processed videos:",
            existingVideos.length,
            "unique videos"
          );
          console.log(
            "🎬 Video details:",
            existingVideos.map((v) => ({
              id: v.id,
              title: v.title,
              src: v.src.substring(0, 50) + "...",
            }))
          );
          console.log("🎬 Final videos being set:", existingVideos.length);
          existingVideos.forEach((video, index) => {
            console.log(`🎬 Final video ${index}:`, {
              id: video.id,
              hasPoster: !!video.poster,
              posterUrl: video.poster,
              duration: video.duration,
              title: video.title,
            });
          });

          setVideos(existingVideos);

          // Initialize photo order - ensure safe access to photos
          const order = [];
          if (listingData.photos?.hero) order.push("hero");
          if (listingData.photos?.back) order.push("back");
          if (listingData.photos?.proof) order.push("proof");
          if (listingData.photos?.additional) {
            listingData.photos.additional.forEach((_: any, index: number) => {
              order.push(`additional-${index}`);
            });
          }
          setPhotoOrder(order);
        } else {
          throw new Error(data.error || "Failed to fetch listing");
        }

        // Fetch user profile data to get zip code and neighborhood
        try {
          console.log("Fetching user profile...");
          const profileResponse = await fetch("/api/profile");
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.user?.zipCode) {
              // Update zip code if not already set from listing
              if (!zipCode) {
                setZipCode(profileData.user.zipCode);
              }

              // Set default neighborhood for Houston area
              setNeighborhood("Houston Area");
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        setError("Failed to load listing data");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchListingAndUserData();
    }
  }, [params.id]);

  // Load inventory lists for quick linking
  useEffect(() => {
    const loadLists = async () => {
      try {
        const resp = await fetch("/api/admin/inventory-lists");
        if (resp.ok) {
          const data = await resp.json();
          setInventoryLists(data.lists || []);
        }
      } catch (e) {
        console.error("Failed to load inventory lists", e);
      }
    };
    loadLists();
  }, []);

  useEffect(() => {
    const loadItems = async () => {
      if (!selectedInventoryList) return setInventoryItems([]);
      try {
        const resp = await fetch(
          `/api/admin/inventory?listId=${selectedInventoryList}`
        );
        if (resp.ok) {
          const data = await resp.json();
          setInventoryItems(data.items || []);
        }
      } catch (e) {
        console.error("Failed to load inventory items", e);
      }
    };
    loadItems();
  }, [selectedInventoryList]);

  // Calculate sales price when discount schedule or price changes
  useEffect(() => {
    if (
      price &&
      discountSchedule &&
      (listing?.createdAt || listing?.created_at)
    ) {
      const mockListing = {
        list_price: parseFloat(price),
        discount_schedule: { type: discountSchedule },
        created_at: listing.createdAt || listing.created_at,
        reserve_price: reservePrice ? parseFloat(reservePrice) : undefined,
      };
      const displayPrice = getDisplayPrice(mockListing);
      setCalculatedSalesPrice(
        displayPrice.isDiscounted ? displayPrice.price : null
      );
    } else {
      setCalculatedSalesPrice(null);
    }
  }, [
    price,
    discountSchedule,
    listing?.createdAt,
    listing?.created_at,
    reservePrice,
  ]);

  // Video upload handlers
  const handleVideoUploaded = async (data: {
    videoId: string;
    frameUrls: string[];
    thumbnailUrl: string;
    duration: number;
  }) => {
    console.log("Video uploaded successfully:", data);
    setVideoData({
      videoId: data.videoId,
      frameUrls: data.frameUrls,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      uploaded: true,
      processing: false,
      error: null,
    });

    // Add to videos array
    const newVideo = {
      id: data.videoId,
      src: data.thumbnailUrl, // This will be the actual video URL from the upload
      poster: data.thumbnailUrl,
      duration: data.duration,
      title: `Video: ${title || "New Video"}`,
    };
    setVideos((prev) => [...prev, newVideo]);
  };

  const handleVideoError = (error: string) => {
    console.error("Video upload error:", error);
    setVideoData((prev) => ({
      ...prev,
      error,
      processing: false,
    }));
  };

  const handleVideoStarted = () => {
    console.log("Video upload started");
    setVideoData((prev) => ({
      ...prev,
      processing: true,
      error: null,
    }));
  };

  // Function to refresh listing data (useful after video uploads)
  const refreshListingData = async () => {
    try {
      console.log("🔄 Refreshing listing data after video upload");
      const response = await cachedFetch(`/api/listings/${params.id}`, {}, 0); // No cache for refresh

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const listingData = data.listing;

          // Update the videos state with fresh data from the server
          const existingVideos: Array<{
            id: string;
            src: string;
            poster?: string;
            duration?: number;
            title?: string;
          }> = [];
          const processedVideoIds = new Set<string>();

          // Process videos array
          if (
            listingData.videos &&
            Array.isArray(listingData.videos) &&
            listingData.videos.length > 0
          ) {
            listingData.videos.forEach((video: any, index: number) => {
              if (processedVideoIds.has(video.id)) return;

              const cdnUrl =
                process.env.NEXT_PUBLIC_CDN_URL ||
                "https://dtlqyjbwka60p.cloudfront.net";
              const videoKey = video.rawVideoKey || video.processedVideoKey;
              let videoSrc = null;

              if (videoKey && cdnUrl) {
                const cleanDomain = cdnUrl
                  .replace("https://", "")
                  .replace("http://", "");
                videoSrc = `https://${cleanDomain}/${videoKey}`;
              }

              if (videoSrc) {
                existingVideos.push({
                  id: video.id,
                  src: videoSrc,
                  poster: video.thumbnailUrl || undefined,
                  duration: video.duration || undefined,
                  title: `${listingData.title} - Video ${index + 1}`,
                });
                processedVideoIds.add(video.id);
              }
            });
          }

          // Process single video if not already included
          if (
            listingData.video &&
            !processedVideoIds.has(listingData.video.id)
          ) {
            const cdnUrl =
              process.env.NEXT_PUBLIC_CDN_URL ||
              "https://dtlqyjbwka60p.cloudfront.net";
            const videoKey =
              listingData.video.rawVideoKey ||
              listingData.video.processedVideoKey;
            let videoSrc = null;

            if (videoKey && cdnUrl) {
              const cleanDomain = cdnUrl
                .replace("https://", "")
                .replace("http://", "");
              videoSrc = `https://${cleanDomain}/${videoKey}`;
            }

            if (videoSrc) {
              existingVideos.push({
                id: listingData.video.id,
                src: videoSrc,
                poster: listingData.video.thumbnailUrl || undefined,
                duration: listingData.video.duration || undefined,
                title: `${listingData.title} - Original Video`,
              });
            }
          }

          console.log("🔄 Refreshed videos:", existingVideos.length);
          setVideos(existingVideos);
        }
      }
    } catch (error) {
      console.error("Error refreshing listing data:", error);
    }
  };

  // Remove video handler
  const handleRemoveVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((video) => video.id !== videoId));

    // If removing the single uploaded video, reset video data
    if (videoData.videoId === videoId) {
      setVideoData({
        videoId: null,
        frameUrls: [],
        thumbnailUrl: null,
        duration: null,
        uploaded: false,
        processing: false,
        error: null,
      });
    }
  };

  // Drag and drop handlers for video reordering
  const handleVideoDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleVideoDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (dragIndex === dropIndex) return;

    setVideos((prev) => {
      const newVideos = [...prev];
      const draggedVideo = newVideos[dragIndex];

      // Remove the dragged video
      newVideos.splice(dragIndex, 1);

      // Insert it at the new position
      newVideos.splice(dropIndex, 0, draggedVideo);

      console.log(
        "🎬 Videos reordered:",
        newVideos.map((v, i) => `${i + 1}: ${v.title}`)
      );
      return newVideos;
    });
  };

  // Calculate reserve price (minimum acceptable price)
  const calculateReservePrice = (price: number) => {
    return Math.round(price * 0.7 * 100) / 100; // 70% of original price
  };

  // Auto-calculate reserve price when price changes
  useEffect(() => {
    if (price && !reservePrice) {
      setReservePrice(calculateReservePrice(parseFloat(price)).toFixed(2));
    }
  }, [price, reservePrice]);

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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    try {
      // Create form data with required parameters
      const formData = new FormData();
      formData.append("file", file);
      formData.append("photoType", "additional"); // For edit page, treat as additional photo
      formData.append("itemId", params.id as string);

      const response = await fetch("/api/upload/photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();

      // Add the new photo to the additional photos array
      setPhotos((prev) => ({
        ...prev,
        additional: [...prev.additional, data.url],
      }));

      // Add to photo order
      const newPhotoId = `additional-${photos.additional.length}`;
      setPhotoOrder((prev) => [...prev, newPhotoId]);

      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form submission started");
    console.log("Current state:", {
      zipCode,
      saving,
      photos: photos.hero,
    });

    if (!photos.hero) {
      console.log("No hero photo");
      setError("Please upload a hero photo");
      return;
    }

    console.log("All validations passed, proceeding with submission");
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

          brand: brand || null,
          height: height || null,
          width: width || null,
          depth: depth || null,
          serialNumber: serialNumber || null,
          modelNumber: modelNumber || null,
          estimatedRetailPrice: estimatedRetailPrice
            ? parseFloat(estimatedRetailPrice)
            : null,
          reservePrice: reservePrice ? parseFloat(reservePrice) : null,
          discountSchedule: { type: discountSchedule },
          // Facebook Shop Integration Fields
          facebookShopEnabled,
          facebookBrand: facebookBrand || null,
          facebookCondition: facebookCondition || null,
          facebookGtin: facebookGtin || null,
          // Product Specifications (Facebook Shop Fields)
          quantity: parseInt(quantity) || 1,
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

          // Treasure fields
          isTreasure: isTreasure || false,
          treasureReason: treasureReason || null,
          photos,
          videoUrl: videoData.uploaded ? videoData.thumbnailUrl : null,
          // Include video IDs for multi-video support
          videoIds: (() => {
            console.log("🎬 Videos in state before filtering:", videos.length);
            videos.forEach((video, index) => {
              console.log(`🎬 Video ${index}:`, {
                id: video.id,
                src: video.src?.substring(0, 50) + "...",
              });
            });

            return videos
              .map((video) => video.id)
              .filter((id) => {
                // Filter out invalid, empty, or placeholder video IDs
                const isValid =
                  id &&
                  typeof id === "string" &&
                  id.trim() !== "" &&
                  id !== "legacy-video" &&
                  id !== "single-video" &&
                  id !== "fallback-video" &&
                  !id.startsWith("video-"); // Remove generic video-N IDs

                console.log(
                  "🎬 Frontend filtering video ID:",
                  id,
                  isValid ? "✅ valid" : "❌ invalid"
                );
                return isValid;
              });
          })(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("🚨 Update listing failed:", errorData);

        // Show specific error message for video-related errors
        if (
          errorData.missingIds ||
          errorData.error?.includes("Video records not found")
        ) {
          throw new Error(
            `Some videos could not be found in the database: ${
              errorData.missingIds?.join(", ") || "Unknown video IDs"
            }`
          );
        }

        throw new Error(errorData.error || "Failed to update listing");
      }

      const data = await response.json();

      if (data.success) {
        // Invalidate cache for this listing
        apiCache.invalidate(`/api/listings/${params.id}`);

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
                  {taxonomy &&
                    Object.keys(taxonomy).map((dept) => (
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
                  {taxonomy &&
                    department &&
                    taxonomy[department] &&
                    Object.keys(
                      taxonomy[department] as Record<string, any>
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              {/* Sub Category */}
              {taxonomy &&
                department &&
                category &&
                (taxonomy[department] as Record<string, any>)[category]
                  ?.length > 0 && (
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
                      {taxonomy &&
                        department &&
                        category &&
                        (taxonomy[department] as Record<string, any>)[
                          category
                        ]?.map((subCat: string) => (
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Link to Inventory */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Link Inventory Item (optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={selectedInventoryList}
                    onChange={(e) => {
                      setSelectedInventoryList(e.target.value);
                      setSelectedInventoryItem("");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="">Select Inventory List</option>
                    {inventoryLists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l._count?.items ?? 0})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedInventoryItem}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedInventoryItem(id);
                      const item = inventoryItems.find((i) => i.id === id);
                      if (item) {
                        // Prefill helpful fields
                        if (!title) setTitle(item.description || title);
                        if (!price && item.unitRetail)
                          setPrice(String(item.unitRetail));
                        if (!brand && item.vendor) setBrand(item.vendor);
                        if (!estimatedRetailPrice && item.extRetail)
                          setEstimatedRetailPrice(String(item.extRetail));
                      }
                    }}
                    disabled={!selectedInventoryList}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="">Select Item</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.itemNumber || "#"} — {item.description || "Item"}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selecting an inventory item will prefill title, price, brand,
                  and retail when available.
                </p>
              </div>

              {/* Reserve Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reserve Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={reservePrice}
                    onChange={(e) => setReservePrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="0.00"
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

              {/* Discount Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Discount Schedule
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Turbo-30: 30% off every 30 days
                      <br />
                      Classic-60: 10% off every 60 days
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </label>
                <select
                  value={discountSchedule}
                  onChange={(e) =>
                    setDiscountSchedule(
                      e.target.value as (typeof discountSchedules)[number]
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                >
                  <option value="">Select Schedule</option>
                  {discountSchedules.map((schedule) => (
                    <option key={schedule} value={schedule}>
                      {schedule}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Schedule Calculation Display */}
              <div className="col-span-full">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Discount Schedule Calculation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Days Since Listing:</span>
                      <span className="ml-2 font-medium">
                        {listing?.createdAt || listing?.created_at
                          ? Math.floor(
                              (new Date().getTime() -
                                new Date(
                                  listing.createdAt || listing.created_at
                                ).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Discount Schedule:</span>
                      <span className="ml-2 font-medium">
                        {discountSchedule || "None selected"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">List Price:</span>
                      <span className="ml-2 font-medium">
                        ${price || "0.00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sales Price:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {calculatedSalesPrice
                          ? `$${calculatedSalesPrice.toFixed(2)}`
                          : "No discount"}
                      </span>
                    </div>
                  </div>
                </div>
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

              {/* Product Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Dimensions (inches)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Height */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      placeholder="H"
                    />
                  </div>

                  {/* Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      placeholder="W"
                    />
                  </div>

                  {/* Depth */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Depth
                    </label>
                    <input
                      type="number"
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      placeholder="D"
                    />
                  </div>
                </div>

                {/* Dimensions Summary */}
                {(height || width || depth) && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Dimensions:</span>{" "}
                      {height ? `${height}"` : "—"} H ×{" "}
                      {width ? `${width}"` : "—"} W ×{" "}
                      {depth ? `${depth}"` : "—"} D
                    </p>
                  </div>
                )}
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

          {/* Facebook Shop Integration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Facebook Shop Integration
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure settings for Facebook Marketplace integration.
            </p>

            <div className="space-y-6">
              {/* Facebook Shop Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enable Facebook Shop
                  </label>
                  <p className="text-xs text-gray-500">
                    List this item on Facebook Marketplace
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facebookShopEnabled}
                    onChange={(e) => setFacebookShopEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D4AF3D] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF3D]"></div>
                </label>
              </div>

              {facebookShopEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Facebook Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook Brand
                    </label>
                    <input
                      type="text"
                      value={facebookBrand}
                      onChange={(e) => setFacebookBrand(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      placeholder="Brand name for Facebook"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use main brand field
                    </p>
                  </div>

                  {/* Facebook Condition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook Condition
                    </label>
                    <select
                      value={facebookCondition}
                      onChange={(e) => setFacebookCondition(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    >
                      <option value="">Use main condition</option>
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use main condition field
                    </p>
                  </div>

                  {/* Facebook GTIN */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook GTIN (Global Trade Item Number)
                    </label>
                    <input
                      type="text"
                      value={facebookGtin}
                      onChange={(e) => setFacebookGtin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      placeholder="UPC, EAN, or ISBN"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Product identifier for better Facebook Marketplace
                      visibility
                    </p>
                  </div>

                  {/* Facebook Catalog Sync - Sales Price */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook Catalog Sales Price
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Calculated Sales Price:
                        </span>
                        <span className="text-lg font-semibold text-green-600">
                          {calculatedSalesPrice
                            ? `$${calculatedSalesPrice.toFixed(2)}`
                            : "No discount"}
                        </span>
                      </div>
                      {calculatedSalesPrice && (
                        <div className="mt-2 text-xs text-gray-500">
                          This price will be synced to Facebook catalog based on
                          your discount schedule
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                let photoTitle = "";

                if (photoId === "hero" && photos.hero) {
                  photoUrl = photos.hero;
                  photoType = "Hero";
                  photoTitle = "Hero";
                } else if (photoId === "back" && photos.back) {
                  photoUrl = photos.back;
                  photoType = "Back";
                  photoTitle = "Back";
                } else if (photoId === "proof" && photos.proof) {
                  photoUrl = photos.proof;
                  photoType = "Proof";
                  photoTitle = "Proof";
                } else if (photoId.startsWith("additional-")) {
                  const additionalIndex = parseInt(photoId.split("-")[1]);
                  if (photos.additional[additionalIndex]) {
                    photoUrl = photos.additional[additionalIndex];
                    photoType = `Additional ${additionalIndex + 1}`;
                    photoTitle = `Additional ${additionalIndex + 1}`;
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
                      {index + 1}. {photoTitle}
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

          {/* Product Specifications (Facebook Shop Fields) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-[#D4AF3D]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Product Specifications
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Detailed product specifications for better categorization and
              search visibility.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Quantity Available
                  {confidenceScores?.quantity && (
                    <ConfidenceBadge level={confidenceScores.quantity.level} />
                  )}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="1"
                />
              </div>

              {/* Item Group ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Item Group ID
                  {confidenceScores?.itemGroupId && (
                    <ConfidenceBadge
                      level={confidenceScores.itemGroupId.level}
                    />
                  )}
                  <div className="relative group">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Used to group related product variants (e.g., same shirt
                      in different colors/sizes)
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={itemGroupId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 50) {
                      setItemGroupId(value);
                    }
                  }}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="For product variants"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {itemGroupId.length}/50 characters
                </p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Gender
                  {confidenceScores?.gender && (
                    <ConfidenceBadge level={confidenceScores.gender.level} />
                  )}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender | "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Age Group
                  {confidenceScores?.ageGroup && (
                    <ConfidenceBadge level={confidenceScores.ageGroup.level} />
                  )}
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value as AgeGroup | "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                >
                  <option value="">Select Age Group</option>
                  {AGE_GROUP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <HybridInput
                value={color}
                onChange={setColor}
                suggestions={COLOR_SUGGESTIONS}
                placeholder="e.g., Red, Blue, Black"
                label="Color"
                confidenceBadge={
                  confidenceScores?.color && (
                    <ConfidenceBadge level={confidenceScores.color.level} />
                  )
                }
              />

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Size
                  {confidenceScores?.size && (
                    <ConfidenceBadge level={confidenceScores.size.level} />
                  )}
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="e.g., Large, XL, 42"
                />
              </div>

              {/* Material */}
              <HybridInput
                value={material}
                onChange={setMaterial}
                suggestions={MATERIAL_SUGGESTIONS}
                placeholder="e.g., Cotton, Wood, Metal"
                label="Material"
                confidenceBadge={
                  confidenceScores?.material && (
                    <ConfidenceBadge level={confidenceScores.material.level} />
                  )
                }
              />

              {/* Pattern */}
              <HybridInput
                value={pattern}
                onChange={setPattern}
                suggestions={PATTERN_SUGGESTIONS}
                placeholder="e.g., Striped, Floral, Solid"
                label="Pattern"
                confidenceBadge={
                  confidenceScores?.pattern && (
                    <ConfidenceBadge level={confidenceScores.pattern.level} />
                  )
                }
              />

              {/* Style */}
              <HybridInput
                value={style}
                onChange={setStyle}
                suggestions={STYLE_SUGGESTIONS}
                placeholder="e.g., Modern, Vintage, Casual"
                label="Style"
                confidenceBadge={
                  confidenceScores?.style && (
                    <ConfidenceBadge level={confidenceScores.style.level} />
                  )
                }
              />

              {/* Product Type */}

              {/* Tags - Full Width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Tags
                  {confidenceScores?.tags && (
                    <ConfidenceBadge level={confidenceScores.tags.level} />
                  )}
                  <div className="relative group">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Keywords to help buyers find your item (e.g., "vintage",
                      "handmade", "eco-friendly")
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-[#D4AF3D] text-white rounded-lg hover:bg-[#b8932f] transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Treasure Detection Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-[#D4AF3D]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Treasure Detection
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Mark items as "Treasures" for one-of-a-kind, vintage, or collector
              pieces that don't have standard retail pricing.
            </p>

            <div className="space-y-6">
              {/* Is Treasure Toggle */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTreasure}
                    onChange={(e) => setIsTreasure(e.target.checked)}
                    className="w-4 h-4 text-[#D4AF3D] border-gray-300 rounded focus:ring-[#D4AF3D]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    This is a Treasure (one-of-a-kind, vintage, or collector
                    piece)
                  </span>
                </label>
              </div>

              {/* Treasure Reason */}
              {isTreasure && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treasure Reason
                  </label>
                  <textarea
                    value={treasureReason}
                    onChange={(e) => setTreasureReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    rows={3}
                    placeholder="Explain why this is a treasure (e.g., 'Vintage 1980s design', 'Discontinued model', 'One-of-a-kind piece')"
                  />
                </div>
              )}

              {/* Treasure Info */}
              {isTreasure && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">
                        Treasure Items
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Treasure items are one-of-a-kind, vintage, or collector
                        pieces that don't follow standard pricing schedules.
                        They're marked with a special badge and use
                        collector-based pricing instead of retail pricing.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Product Videos {videos.length > 0 && `(${videos.length})`}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Add videos to showcase your item in action. This helps buyers
                  better understand the product.
                </p>
              </div>
            </div>

            {/* Video Preview Section */}
            {videos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-4">
                  Current Videos
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Video Carousel */}
                  <div>
                    <VideoCarousel
                      videos={videos}
                      controls={true}
                      autoPlay={false}
                      className=""
                    />
                  </div>

                  {/* Video List with Remove Options */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Manage Videos ({videos.length})
                      {videos.length > 1 && (
                        <span className="text-xs text-gray-500 ml-2">
                          • Drag to reorder
                        </span>
                      )}
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {videos.map((video, index) => (
                        <div
                          key={`${video.id}-${index}`}
                          draggable
                          onDragStart={(e) => handleVideoDragStart(e, index)}
                          onDragOver={handleVideoDragOver}
                          onDrop={(e) => handleVideoDrop(e, index)}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border cursor-move hover:bg-gray-100 transition-colors"
                        >
                          {/* Drag Handle */}
                          <div className="flex-shrink-0 flex items-center">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>

                          <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded overflow-hidden">
                            {video.poster ? (
                              <img
                                src={video.poster}
                                alt={`Video ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log(
                                    "Thumbnail failed to load:",
                                    video.poster
                                  );
                                  e.currentTarget.style.display = "none";
                                  const parent = e.currentTarget.parentElement;
                                  if (
                                    parent &&
                                    !parent.querySelector(".fallback-icon")
                                  ) {
                                    const fallback =
                                      document.createElement("div");
                                    fallback.className =
                                      "fallback-icon w-full h-full flex items-center justify-center";
                                    fallback.innerHTML =
                                      '<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 4H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z"></path></svg>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                                onLoad={() => {
                                  console.log(
                                    "Thumbnail loaded successfully:",
                                    video.poster
                                  );
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-900 truncate">
                              Video {index + 1}
                            </h5>
                            <p className="text-xs text-gray-500 mt-1">
                              {video.duration &&
                                `${Math.round(video.duration)}s • `}
                              {video.title}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(video.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Remove video"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Section */}
            {videos.length === 0 && (
              <div className="border-t border-gray-200 pt-6">
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-4">
                    Upload Your First Video
                  </h3>
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
                </div>
              </div>
            )}

            {/* Upload Options for Empty State */}
            {videos.length === 0 && !videoData.processing && (
              <div className="mt-6 text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-gray-500 mb-4">
                    <Play className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    No videos yet
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload videos to showcase your item in action. For multiple
                    videos, use the bulk upload feature during listing creation.
                  </p>
                </div>
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
              disabled={saving}
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
