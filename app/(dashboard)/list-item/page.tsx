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
  CheckCircle,
  Edit,
} from "lucide-react";
import { getApprovedZipCodesFromDB } from "../../lib/zipcodes";
import {
  // generateStagedPhoto, // TODO: Re-enable in Phase 2
  ComprehensiveListingData,
  mapConditionToFacebook,
} from "../../lib/ai-service";
import {
  generateFormFields,
  FormGenerationData,
} from "../../lib/ai-form-generator";
import VideoUpload from "../../components/VideoUpload";
import VideoProcessingModal from "../../components/VideoProcessingModal";
import CustomQRCode from "../../components/CustomQRCode";
import {
  ConfidenceBadge,
  ConfidenceSummary,
} from "../../components/ConfidenceIndicator";

const taxonomy = {
  // Facebook Marketplace Categories - Primary Categories
  Furniture: {
    "Living Room": [
      "Sofas",
      "Loveseats",
      "Sectionals",
      "Coffee Tables",
      "Side Tables",
      "Console Tables",
    ],
    "Dining Room": [
      "Dining Tables",
      "Dining Chairs",
      "Buffets",
      "China Cabinets",
    ],
    Bedroom: ["Beds", "Dressers", "Nightstands", "Wardrobes", "Vanities"],
    Office: ["Desks", "Office Chairs", "Filing Cabinets", "Bookshelves"],
    Storage: ["Wardrobes", "Chests", "Shelving Units", "Storage Bins"],
    Outdoor: ["Patio Sets", "Garden Chairs", "Outdoor Tables"],
    Kids: ["Children's Beds", "Kids' Desks", "Toy Storage"],
  },
  Electronics: {
    "Computers & Tablets": [
      "Laptops",
      "Desktops",
      "Tablets",
      "Monitors",
      "Keyboards",
      "Mice",
    ],
    "Mobile Phones": [
      "Smartphones",
      "Phone Cases",
      "Chargers",
      "Screen Protectors",
    ],
    "Audio Equipment": ["Speakers", "Headphones", "Microphones", "Amplifiers"],
    "Cameras & Photo": ["Digital Cameras", "Lenses", "Tripods", "Camera Bags"],
    "TVs & Video": [
      "Televisions",
      "Projectors",
      "DVD Players",
      "Streaming Devices",
    ],
    "Smart Home": ["Smart Speakers", "Security Cameras", "Smart Thermostats"],
    Gaming: ["Gaming Consoles", "Gaming PCs", "Controllers", "Gaming Headsets"],
  },
  "Home & Garden": {
    "Home Décor": ["Wall Art", "Mirrors", "Vases", "Throw Pillows", "Curtains"],
    Lighting: ["Lamps", "Chandeliers", "Sconces", "Light Bulbs"],
    "Kitchen & Dining": [
      "Cookware",
      "Dinnerware",
      "Kitchen Utensils",
      "Small Appliances",
    ],
    Bathroom: ["Towels", "Shower Curtains", "Bathroom Accessories"],
    "Storage & Organization": [
      "Closet Organizers",
      "Storage Bins",
      "Hooks",
      "Shelving",
    ],
    "Rugs & Textiles": ["Area Rugs", "Carpets", "Blankets", "Throws"],
  },
  "Clothing & Accessories": {
    "Men's Clothing": ["Shirts", "Pants", "Jackets", "Shoes", "Accessories"],
    "Women's Clothing": ["Dresses", "Tops", "Bottoms", "Shoes", "Accessories"],
    "Kids' Clothing": [
      "Boys' Clothing",
      "Girls' Clothing",
      "Baby Clothes",
      "Shoes",
    ],
    "Jewelry & Watches": ["Necklaces", "Rings", "Watches", "Bracelets"],
    "Bags & Purses": ["Handbags", "Backpacks", "Wallets", "Luggage"],
    Shoes: ["Sneakers", "Boots", "Sandals", "Formal Shoes"],
  },
  "Sporting Goods": {
    "Fitness Equipment": [
      "Treadmills",
      "Weights",
      "Yoga Mats",
      "Exercise Bikes",
    ],
    "Team Sports": [
      "Basketballs",
      "Soccer Balls",
      "Baseball Equipment",
      "Tennis Rackets",
    ],
    "Outdoor Sports": [
      "Bicycles",
      "Camping Gear",
      "Hiking Equipment",
      "Fishing Gear",
    ],
    "Water Sports": ["Swimming Gear", "Surfboards", "Kayaks", "Life Jackets"],
    "Winter Sports": ["Skis", "Snowboards", "Winter Clothing", "Boots"],
  },
  "Toys & Games": {
    "Board Games": ["Strategy Games", "Family Games", "Party Games", "Puzzles"],
    "Action Figures": ["Collectible Figures", "Dolls", "Plush Toys"],
    Educational: ["Learning Toys", "Science Kits", "Art Supplies"],
    "Outdoor Toys": ["Bikes", "Scooters", "Playground Equipment"],
    "Video Games": ["Game Consoles", "Game Cartridges", "Controllers"],
  },
  "Tools & Hardware": {
    "Power Tools": ["Drills", "Saws", "Sanders", "Grinders", "Nail Guns"],
    "Hand Tools": ["Hammers", "Screwdrivers", "Wrenches", "Pliers"],
    "Garden Tools": ["Shovels", "Rakes", "Pruners", "Watering Cans"],
    "Safety Equipment": ["Gloves", "Goggles", "Hard Hats", "Safety Vests"],
    Storage: ["Tool Boxes", "Tool Chests", "Organizers"],
  },
  "Pet Supplies": {
    Dogs: ["Dog Food", "Toys", "Beds", "Collars", "Leashes"],
    Cats: ["Cat Food", "Toys", "Beds", "Litter Boxes", "Scratchers"],
    "Other Pets": ["Bird Supplies", "Fish Supplies", "Small Animal Supplies"],
    "Health & Grooming": ["Shampoo", "Brushes", "Medications", "Treats"],
  },
  "Books & Magazines": {
    Fiction: ["Novels", "Short Stories", "Poetry"],
    "Non-Fiction": ["Biographies", "History", "Science", "Self-Help"],
    "Children's Books": ["Picture Books", "Chapter Books", "Educational"],
    Magazines: ["Fashion", "Sports", "News", "Entertainment"],
    Textbooks: ["Academic", "Professional", "Reference"],
  },
  Automotive: {
    "Car Parts": ["Engine Parts", "Brake Parts", "Suspension", "Electrical"],
    Accessories: ["Seat Covers", "Floor Mats", "Dash Cams", "Phone Mounts"],
    Tools: ["Wrenches", "Jacks", "Battery Chargers", "Diagnostic Tools"],
    Maintenance: ["Oil", "Filters", "Fluids", "Cleaning Supplies"],
  },
  "Beauty & Health": {
    Skincare: ["Moisturizers", "Cleansers", "Sunscreen", "Anti-aging"],
    Haircare: ["Shampoo", "Conditioner", "Styling Products", "Hair Tools"],
    Makeup: ["Foundation", "Lipstick", "Eyeshadow", "Brushes"],
    Fragrances: ["Perfumes", "Colognes", "Body Sprays"],
    Health: ["Vitamins", "Supplements", "First Aid", "Medical Devices"],
  },
  "Office & Business": {
    "Office Furniture": ["Desks", "Chairs", "Filing Cabinets", "Bookshelves"],
    Stationery: ["Paper", "Pens", "Pencils", "Notebooks"],
    Technology: ["Computers", "Printers", "Scanners", "Software"],
    Supplies: ["Ink", "Toner", "Staplers", "Organizers"],
  },
  "Garden & Outdoor": {
    Plants: ["Indoor Plants", "Outdoor Plants", "Seeds", "Bulbs"],
    "Garden Tools": ["Shovels", "Rakes", "Pruners", "Watering Systems"],
    "Outdoor Décor": ["Planters", "Garden Statues", "Fountains", "Wind Chimes"],
    "Grills & Cooking": [
      "Charcoal Grills",
      "Gas Grills",
      "Smokers",
      "Accessories",
    ],
  },
  Collectibles: {
    "Trading Cards": ["Sports Cards", "Pokemon Cards", "Magic Cards"],
    "Coins & Currency": ["Coins", "Bills", "Commemorative Items"],
    Stamps: ["Postage Stamps", "Collector Stamps"],
    Memorabilia: [
      "Sports Memorabilia",
      "Movie Memorabilia",
      "Music Memorabilia",
    ],
  },
  Music: {
    "Vinyl Records": ["Rock", "Jazz", "Classical", "Pop"],
    CDs: ["Albums", "Singles", "Compilations"],
    Instruments: ["Guitars", "Pianos", "Drums", "Wind Instruments"],
    Equipment: ["Amplifiers", "Microphones", "Recording Equipment"],
  },
  "Video Games & Consoles": {
    "Gaming Consoles": ["PlayStation", "Xbox", "Nintendo", "PC Gaming"],
    "Video Games": ["Action", "Adventure", "Sports", "Racing", "RPG"],
    Accessories: ["Controllers", "Headsets", "Gaming Chairs", "Storage"],
  },
  Appliances: {
    "Kitchen Appliances": [
      "Refrigerators",
      "Dishwashers",
      "Ovens",
      "Microwaves",
    ],
    Laundry: ["Washers", "Dryers", "Ironing Boards"],
    Cleaning: ["Vacuum Cleaners", "Steam Cleaners", "Air Purifiers"],
    "Small Appliances": ["Blenders", "Coffee Makers", "Toasters", "Mixers"],
  },
  "Arts & Crafts": {
    "Art Supplies": ["Paints", "Brushes", "Canvas", "Sketchbooks"],
    "Craft Supplies": ["Paper", "Glue", "Scissors", "Beads"],
    Sewing: ["Fabric", "Thread", "Needles", "Sewing Machines"],
    DIY: ["Woodworking", "Jewelry Making", "Candle Making"],
  },
  "Baby & Kids": {
    "Baby Gear": ["Strollers", "Car Seats", "High Chairs", "Cribs"],
    Toys: ["Educational Toys", "Building Blocks", "Dolls", "Action Figures"],
    Clothing: ["Onesies", "Sleepers", "Outfits", "Shoes"],
    Feeding: ["Bottles", "Formula", "Baby Food", "Bibs"],
  },
  "Jewelry & Watches": {
    Necklaces: ["Gold", "Silver", "Pearl", "Diamond"],
    Rings: ["Engagement Rings", "Wedding Bands", "Fashion Rings"],
    Watches: ["Luxury Watches", "Smart Watches", "Fashion Watches"],
    Earrings: ["Studs", "Hoops", "Dangles", "Clip-ons"],
  },
  Entertainment: {
    Movies: ["DVDs", "Blu-rays", "Digital Movies"],
    Books: ["Fiction", "Non-fiction", "Magazines"],
    "Board Games": ["Family Games", "Strategy Games", "Party Games"],
    Music: ["CDs", "Vinyl", "Digital Music"],
  },
} as const;

type Department = keyof typeof taxonomy;
type Category = keyof (typeof taxonomy)[Department] | string;
type SubCategory = string;
const conditions = ["new", "used", "refurbished"] as const;
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

  // Facebook Shop Integration Fields
  const [facebookShopEnabled, setFacebookShopEnabled] = useState(true);
  const [facebookBrand, setFacebookBrand] = useState("");
  const [facebookCondition, setFacebookCondition] = useState("");
  const [facebookGtin, setFacebookGtin] = useState("");

  // Zip code validation state
  const [zipCodeValidation, setZipCodeValidation] = useState<{
    isValid: boolean | null;
    neighborhood: string | null;
  }>({ isValid: null, neighborhood: null });

  // Video upload state
  const [videoData, setVideoData] = useState<{
    videoId: string | null;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    frameUrls: string[];
    duration: number | null;
    processing: boolean;
    error: string | null;
    uploaded: boolean; // Track if video was uploaded
  }>({
    videoId: null,
    videoUrl: null,
    thumbnailUrl: null,
    frameUrls: [],
    duration: null,
    processing: false,
    error: null,
    uploaded: false,
  });

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Safety check function for map operations
  const safeMap = <T, R>(
    array: T[] | undefined | null,
    callback: (item: T, index: number) => R
  ): R[] => {
    return Array.isArray(array) ? array.map(callback) : [];
  };

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

  // Video upload handlers
  const handleVideoUploaded = async (data: {
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
      process.env.NEXT_PUBLIC_CDN_URL || "https://dtlqyjbwka60p.cloudfront.net";
    const videoUrl = `${cdnDomain}/processed/videos/${data.videoId}.mp4`;

    setVideoData({
      videoId: data.videoId,
      videoUrl: videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      frameUrls: data.frameUrls,
      duration: data.duration,
      processing: false,
      error: null,
      uploaded: true,
    });

    // Show a brief success message
    setTimeout(() => {
      setVideoData((prev) => ({ ...prev, processing: false }));
    }, 3000); // Hide processing indicator after 3 seconds
  };

  const handleVideoStarted = () => {
    // Video upload started - mark as processing and allow user to continue
    setVideoData((prev) => ({
      ...prev,
      processing: true,
      uploaded: true,
    }));
  };

  const handleVideoError = (error: string) => {
    console.error("Video upload error:", error);
    setVideoData((prev) => ({
      ...prev,
      error,
      processing: false,
    }));
  };

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

  // Legacy function - removed in favor of comprehensive AI workflow

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

    console.log("📸 Photo URLs for AI analysis:", photoUrls);
    console.log("📸 Photos object for AI:", {
      hero: { url: photoUrls[0] || null },
      back: { url: photoUrls[1] || null },
      proof: { url: photoUrls[2] || null },
      additional: photoUrls.slice(3).map((url) => ({ url })),
    });
    console.log("🎥 Video data for AI:", videoData);
    console.log("🎥 Video frame URLs:", videoData.frameUrls);
    console.log("🎥 Video frame count:", videoData.frameUrls?.length || 0);

    // Use default values if fields are empty for auto-generation
    const userInput = {
      title: title || "Product",
      description: description || "Product description",
      department: department || "Furniture",
      category: category || "Other",
      subCategory: subCategory || "General",
      condition: condition || "GOOD",
      price: parseFloat(price) || 100,
      brand: brand || undefined,
      additionalInfo: `${height ? `Height: ${height} inches. ` : ""}${
        width ? `Width: ${width} inches. ` : ""
      }${depth ? `Depth: ${depth} inches. ` : ""}${
        serialNumber ? `Serial: ${serialNumber}. ` : ""
      }${modelNumber ? `Model: ${modelNumber}. ` : ""}${
        estimatedRetailPrice ? `Retail: $${estimatedRetailPrice}. ` : ""
      }${discountSchedule ? `Schedule: ${discountSchedule}.` : ""}`,
      // Add visual content for AI analysis
      photos: {
        hero: { url: photoUrls[0] || null },
        back: { url: photoUrls[1] || null },
        proof: { url: photoUrls[2] || null },
        additional: photoUrls.slice(3).map((url) => ({ url })),
      },
      // Add video data if available
      video:
        videoData.videoId && videoData.thumbnailUrl
          ? {
              videoId: videoData.videoId,
              frameUrls: videoData.frameUrls,
              thumbnailUrl: videoData.thumbnailUrl,
              duration: videoData.duration || 0,
            }
          : undefined,
    };

    setGeneratingComprehensive(true);
    setComprehensiveError(null);

    try {
      // Use comprehensive listing generation which supports video analysis
      const { generateComprehensiveListing } = await import(
        "../../lib/ai-service"
      );
      const response = await generateComprehensiveListing(userInput);
      console.log("🎯 Form Generation Complete:", response);
      setComprehensiveListing(response.listingData);

      // Extract confidence scores if available
      if (response.confidenceScores) {
        setConfidenceScores(response.confidenceScores);
        console.log("🎯 Confidence scores set:", response.confidenceScores);
      } else {
        console.log("⚠️ No confidence scores found in response");
      }

      // Apply the form data to the form
      const listingData = response.listingData;
      console.log("📝 Setting title to:", listingData.title);
      setTitle(listingData.title);
      setDescription(listingData.description);
      setDepartment(listingData.department as Department);
      setCategory(listingData.category || "");
      setSubCategory(listingData.subCategory || "");
      setCondition(mapConditionToFacebook(listingData.condition));
      setPrice(listingData.listPrice.toString());
      setBrand(listingData.brand);
      setHeight(listingData.height || "");
      setWidth(listingData.width || "");
      setDepth(listingData.depth || "");
      setSerialNumber(listingData.serialNumber || "");
      setModelNumber(listingData.modelNumber || "");
      setEstimatedRetailPrice(listingData.estimatedRetailPrice.toString());
      setDiscountSchedule(
        listingData.discountSchedule as "Turbo-30" | "Classic-60"
      );
      setPriceReasoning(listingData.priceReasoning);

      // Apply Facebook fields
      setFacebookBrand(listingData.facebookBrand || "");
      setFacebookCondition(listingData.facebookCondition || "");
      setFacebookGtin(listingData.facebookGtin || "");

      // Use stored itemId for QR code and listing ID when form fields are generated
      const listingId = itemId || generateItemId();
      const qrCode = generateQRCode(listingId);
      setGeneratedListingId(listingId);
      setGeneratedQRCode(qrCode);

      // Generate staged photo with comprehensive data (non-blocking)
      if (photos.hero?.url || photos.hero?.key) {
        const photoUrls = [
          photos.hero?.url || photos.hero?.key,
          photos.back?.url || photos.back?.key,
          ...(photos.additional
            ? photos.additional.map((p) => p.url || p.key).filter(Boolean)
            : []),
        ].filter(Boolean);

        // TODO: Re-enable staged photo generation in Phase 2
        // Run staged photo generation in background without blocking
        // generateStagedPhotoAsync(
        //   photoUrls,
        //   listingData.detailedDescription,
        //   listingData.department,
        //   listingData.category
        // ).catch((error) => {
        //   console.error(
        //     "Staged photo generation failed (non-blocking):",
        //     error
        //   );
        // });
      }
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

  // Helper function to check if minimum photo requirements are met
  const hasMinimumPhotos = () => {
    return (
      (photos.hero?.file || photos.hero?.url) &&
      (photos.back?.file || photos.back?.url)
    );
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
    description;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      try {
        const formData = {
          photos: {
            // staged: stagedPhoto.url, // TODO: Re-enable AI-generated staged photo URL in Phase 2
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
          // Facebook Shop Integration Fields
          facebookShopEnabled,
          facebookBrand: brand || null, // Use main brand field
          facebookCondition: condition || null, // Use main condition field
          facebookGtin: facebookGtin || null,
          itemId: generatedListingId || itemId,
          qrCodeUrl: generatedQRCode || generateQRCode(itemId),
          videoId: videoData.videoId || null, // Add video ID to link video to listing
        };

        console.log("Submitting listing with data:", formData);
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
  const generateItemId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateQRCode = (itemId: string) => {
    // Generate the full URL for the QR code
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/list-item/${itemId}`;
  };

  const calculateFee = (price: number) => {
    return price * 0.085; // 8.5% fee
  };

  const [reservePrice, setReservePrice] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");

  // Generate itemId once when component mounts
  useEffect(() => {
    if (!itemId) {
      setItemId(generateItemId());
    }
  }, [itemId]);

  const calculateReservePrice = (price: number) => {
    return price * 0.6; // 60% of list price
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Debug info */}
      <div className="fixed top-4 left-4 bg-black text-white p-2 rounded text-xs z-50">
        Step: {step} | Video: {videoData.videoId ? "Y" : "N"} | Processing:{" "}
        {videoData.processing ? "Y" : "N"} | Form Gen:{" "}
        {generatingComprehensive ? "Y" : "N"} | Generated:{" "}
        {comprehensiveListing ? "Y" : "N"}
      </div>
      <div className="w-full max-w-6xl mx-auto">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white rounded-xl shadow-lg p-8 relative">
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
                <span className="text-xs text-gray-500">Optional</span>
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
                <span className="text-xs text-gray-500">Optional</span>
                {photos.additional && photos.additional.length > 0 && (
                  <div className="flex gap-1">
                    {safeMap(photos.additional, (photo, index) => {
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
                  <p className="font-medium mb-1">Minimum Photo Requirements</p>
                  <p className="mb-2">
                    <strong>Required:</strong> Photos #1 (Front) and #2 (Back)
                    are mandatory to proceed to the form.
                  </p>
                  <p className="mb-2">
                    <strong>Optional:</strong> Photo #3 (Proof) and Additional
                    photos (up to 10) enhance your listing.
                  </p>
                  <p className="text-xs text-blue-600">
                    These photos will be analyzed by AI to automatically fill in
                    item details.
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
                            photos.additional ? photos.additional.length + 1 : 1
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
                          console.log("🔄 Starting auto form generation...");
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
                        You need at least 2 photos (Front and Back) to proceed
                        to the form.
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
          </div>
        )}

        {step === 3 && (
          <>
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

                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#D4AF3D] rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-700">
                        Performing deep market analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 bg-[#D4AF3D] rounded-full animate-pulse"
                        style={{ animationDelay: "0.5s" }}
                      ></div>
                      <span className="text-sm text-gray-700">
                        Analyzing competitive landscape
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 bg-[#D4AF3D] rounded-full animate-pulse"
                        style={{ animationDelay: "1s" }}
                      ></div>
                      <span className="text-sm text-gray-700">
                        Calculating market-based pricing
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 bg-[#D4AF3D] rounded-full animate-pulse"
                        style={{ animationDelay: "1.5s" }}
                      ></div>
                      <span className="text-sm text-gray-700">
                        Generating consumer insights
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 bg-[#D4AF3D] rounded-full animate-pulse"
                        style={{ animationDelay: "2s" }}
                      ></div>
                      <span className="text-sm text-gray-700">
                        Finalizing comprehensive analysis
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Expected time:</strong> 20-30 seconds
                      <br />
                      <strong>Model:</strong> GPT-4o (deep reasoning & analysis)
                      <br />
                      <strong>Processing:</strong> Market analysis &
                      comprehensive reasoning
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
              {/* Facebook Shop Integration Section - Moved to Top */}
              <div className="border-b pb-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Facebook Shop Integration
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Facebook Shop Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Enable Facebook Shop Sync
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Sync this listing with Facebook Shop for increased
                        visibility
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={facebookShopEnabled}
                        onChange={(e) =>
                          setFacebookShopEnabled(e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

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

                    {/* Photo Gallery - Collapsible */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          Uploaded Photos (
                          {
                            Object.values(photos).filter(
                              (p) =>
                                p &&
                                (Array.isArray(p)
                                  ? p.length > 0
                                  : p.file || p.url)
                            ).length
                          }
                          )
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowPhotos(!showPhotos)}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                          {showPhotos ? "−" : "+"}{" "}
                          {showPhotos ? "Hide" : "Show"}
                        </button>
                      </div>
                      {showPhotos && (
                        <>
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
                            {safeMap(photos.additional, (photo, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={
                                    photo.url ||
                                    (photo.file
                                      ? URL.createObjectURL(photo.file)
                                      : "")
                                  }
                                  alt={`Additional ${index + 4}`}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                                  {index + 4}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removePhoto("additional", index)
                                  }
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
                        </>
                      )}
                    </div>

                    {/* Video Keyframes Section - Collapsible */}
                    {videoData.frameUrls && videoData.frameUrls.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-700">
                            Video Keyframes ({videoData.frameUrls.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowVideoFrames(!showVideoFrames)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                          >
                            {showVideoFrames ? "−" : "+"}{" "}
                            {showVideoFrames ? "Hide" : "Show"}
                          </button>
                        </div>
                        {showVideoFrames && (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {videoData.frameUrls.map((frameUrl, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={frameUrl}
                                  alt={`Frame ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border border-gray-200"
                                />
                                <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-1 rounded">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Item ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item ID
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={itemId || "Generating..."}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                          />
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      {/* QR Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          QR Code
                        </label>
                        <div className="space-y-2">
                          {(generatedListingId || itemId) && (
                            <div className="flex justify-center">
                              <CustomQRCode
                                itemId={generatedListingId || itemId}
                                size={150}
                                className="border border-gray-200 rounded-lg p-4 bg-white"
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={
                                generatedQRCode ||
                                (itemId
                                  ? generateQRCode(itemId)
                                  : "Generating...")
                              }
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-xs"
                            />
                            <Lock className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Listing ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Listing ID
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={
                              generatedListingId || itemId || "Generating..."
                            }
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                          />
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Unique identifier for this listing
                        </p>
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
                        <p className="text-xs text-gray-500 mt-1">
                          Used for market analysis and pricing insights
                        </p>
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
                                : "60% of list price"
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

                  {/* AI Confidence Summary */}
                  {confidenceScores && (
                    <ConfidenceSummary confidenceData={confidenceScores} />
                  )}
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

                    <div className="space-y-4">
                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Department *
                          {confidenceScores?.department && (
                            <ConfidenceBadge
                              level={confidenceScores.department.level}
                            />
                          )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Category *
                          {confidenceScores?.category && (
                            <ConfidenceBadge
                              level={confidenceScores.category.level}
                            />
                          )}
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
                            taxonomy[department] &&
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
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Sub-category *
                          {confidenceScores?.subCategory && (
                            <ConfidenceBadge
                              level={confidenceScores.subCategory.level}
                            />
                          )}
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
                            taxonomy[department] &&
                            taxonomy[department][
                              category as keyof (typeof taxonomy)[typeof department]
                            ] &&
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
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Title *
                          {confidenceScores?.title && (
                            <ConfidenceBadge
                              level={confidenceScores.title.level}
                            />
                          )}
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

                      {/* List Price */}
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
                        <p className="text-xs text-gray-500 mt-1">
                          Price range: $
                          {price ? Math.floor(parseFloat(price) * 0.8) : 0} - $
                          {price ? Math.floor(parseFloat(price) * 1.2) : 0}
                        </p>
                      </div>

                      {/* Reserve Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reserve Price ($)
                        </label>
                        <input
                          type="number"
                          value={reservePrice}
                          onChange={(e) => setReservePrice(e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum price you're willing to accept (default: 60%
                          of list price)
                        </p>
                      </div>

                      {/* Brand */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Brand/Manufacturer
                          {confidenceScores?.brand && (
                            <ConfidenceBadge
                              level={confidenceScores.brand.level}
                            />
                          )}
                        </label>
                        <input
                          type="text"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                          placeholder="e.g., Apple, Nike, Ashley Furniture"
                        />
                      </div>

                      {/* Product Dimensions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Product Dimensions (inches)
                          {(confidenceScores?.height ||
                            confidenceScores?.width ||
                            confidenceScores?.depth) && (
                            <div className="flex gap-1">
                              {confidenceScores?.height && (
                                <ConfidenceBadge
                                  level={confidenceScores.height.level}
                                />
                              )}
                              {confidenceScores?.width && (
                                <ConfidenceBadge
                                  level={confidenceScores.width.level}
                                />
                              )}
                              {confidenceScores?.depth && (
                                <ConfidenceBadge
                                  level={confidenceScores.depth.level}
                                />
                              )}
                            </div>
                          )}
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

                        {/* Dimensions Confirmation */}
                        {(height || width || depth) && !dimensionsConfirmed && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-yellow-800">
                                  Verify Dimensions
                                </h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                  Please verify these dimensions are accurate.
                                  AI estimates may not be precise.
                                </p>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setDimensionsConfirmed(true)}
                                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                                  >
                                    Confirm Accurate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHeight("");
                                      setWidth("");
                                      setDepth("");
                                    }}
                                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                                  >
                                    Clear & Measure
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Confirmed Dimensions */}
                        {dimensionsConfirmed && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-800 font-medium">
                                Dimensions verified as accurate
                              </span>
                              <button
                                type="button"
                                onClick={() => setDimensionsConfirmed(false)}
                                className="ml-auto text-xs text-green-600 hover:text-green-800 underline"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* GTIN/UPC Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GTIN/UPC Code
                        </label>
                        <input
                          type="text"
                          value={facebookGtin}
                          onChange={(e) => setFacebookGtin(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                          placeholder="e.g., 1234567890123"
                          maxLength={13}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Global Trade Item Number or UPC code for better
                          Facebook matching
                        </p>
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
                                        <strong>
                                          Price drops every 3 days
                                        </strong>
                                      </p>
                                      <div className="bg-gray-50 p-2 rounded">
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                          <div className="font-medium">Day</div>
                                          <div className="font-medium">
                                            Price
                                          </div>
                                          <div className="font-medium">
                                            Drop
                                          </div>
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
                                        <strong>
                                          Price drops every 7 days
                                        </strong>
                                      </p>
                                      <div className="bg-gray-50 p-2 rounded">
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                          <div className="font-medium">Day</div>
                                          <div className="font-medium">
                                            Price
                                          </div>
                                          <div className="font-medium">
                                            Drop
                                          </div>
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
                              e.target
                                .value as (typeof discountSchedules)[number]
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
                      </div>

                      {/* Condition */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Condition *
                          {confidenceScores?.condition && (
                            <ConfidenceBadge
                              level={confidenceScores.condition.level}
                            />
                          )}
                        </label>
                        <select
                          value={condition}
                          onChange={(e) =>
                            setCondition(
                              e.target.value as (typeof conditions)[number] | ""
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                          required
                        >
                          <option value="">Select Condition</option>
                          <option value="new">New</option>
                          <option value="used">Used</option>
                          <option value="refurbished">Refurbished</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Facebook-compatible condition format
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
          </>
        )}
      </div>
    </div>
  );
}
