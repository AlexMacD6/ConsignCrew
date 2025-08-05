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
// ZIP code validation now handled via API endpoint

const discountSchedules = ["Turbo-30", "Classic-60"] as const;

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
    Automotive: ["Car Parts", "Motorcycle Parts", "Boat Parts"],
    "Building Materials": ["Lumber", "Hardware", "Fasteners", "Adhesives"],
  },
  "Books & Media": {
    Books: ["Fiction", "Non-Fiction", "Textbooks", "Children's Books"],
    "Movies & TV": ["DVDs", "Blu-rays", "Digital Codes", "VHS Tapes"],
    Music: ["CDs", "Vinyl Records", "Digital Downloads", "Instruments"],
    Magazines: ["Current Issues", "Back Issues", "Subscriptions"],
    Collectibles: ["Comic Books", "Trading Cards", "Memorabilia"],
  },
  "Health & Beauty": {
    "Personal Care": ["Skincare", "Haircare", "Oral Care", "Fragrances"],
    "Health & Wellness": ["Vitamins", "Supplements", "Medical Devices"],
    "Beauty Tools": ["Makeup Brushes", "Hair Tools", "Mirrors"],
    "Fitness & Nutrition": ["Protein Powder", "Workout Gear", "Supplements"],
    "Baby & Kids": ["Diapers", "Baby Food", "Toys", "Clothing"],
  },
  "Pet Supplies": {
    "Dog Supplies": ["Food", "Toys", "Beds", "Collars", "Leashes"],
    "Cat Supplies": ["Food", "Toys", "Litter", "Scratchers", "Beds"],
    "Other Pets": ["Bird Supplies", "Fish Supplies", "Small Animal Supplies"],
    "Pet Health": ["Medications", "Grooming", "Vaccines", "Treatments"],
    "Pet Services": ["Grooming", "Training", "Boarding", "Veterinary"],
  },
  Automotive: {
    "Cars & Trucks": ["Sedans", "SUVs", "Trucks", "Vans", "Motorcycles"],
    "Auto Parts": ["Engine Parts", "Body Parts", "Interior Parts", "Tires"],
    "Auto Accessories": ["Audio Systems", "Navigation", "Covers", "Mats"],
    "Auto Services": ["Repair", "Maintenance", "Towing", "Insurance"],
    Motorcycles: ["Sport Bikes", "Cruisers", "Scooters", "Parts"],
  },
  "Real Estate": {
    "Homes for Sale": ["Single Family", "Condos", "Townhouses", "Land"],
    "Homes for Rent": ["Apartments", "Houses", "Rooms", "Vacation Rentals"],
    Commercial: ["Office Space", "Retail Space", "Warehouses", "Land"],
    "Real Estate Services": ["Agents", "Mortgage", "Insurance", "Legal"],
    "Property Management": ["Rental Management", "Maintenance", "Utilities"],
  },
  Services: {
    "Professional Services": ["Legal", "Accounting", "Consulting", "Design"],
    "Home Services": ["Cleaning", "Repair", "Landscaping", "Moving"],
    "Health Services": ["Medical", "Dental", "Therapy", "Fitness"],
    "Beauty Services": ["Hair", "Nails", "Massage", "Spa"],
    Education: ["Tutoring", "Classes", "Training", "Lessons"],
  },
  Jobs: {
    "Full-Time": ["Administrative", "Customer Service", "Sales", "Technology"],
    "Part-Time": ["Retail", "Food Service", "Delivery", "Childcare"],
    Contract: ["Freelance", "Consulting", "Project-Based", "Seasonal"],
    Remote: ["Work from Home", "Virtual", "Online", "Telecommute"],
    Internships: ["Paid", "Unpaid", "Academic Credit", "Experience"],
  },
  "Free Stuff": {
    Household: ["Furniture", "Appliances", "Decor", "Kitchen Items"],
    Clothing: ["Men's", "Women's", "Kids'", "Baby", "Shoes"],
    Electronics: ["Computers", "Phones", "TVs", "Audio", "Gaming"],
    "Books & Media": ["Books", "Movies", "Music", "Magazines", "Games"],
    Miscellaneous: ["Tools", "Sports", "Toys", "Pet Items", "Other"],
  },
};

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

  // Facebook Shop Integration Fields
  const [facebookShopEnabled, setFacebookShopEnabled] = useState(true);
  const [facebookBrand, setFacebookBrand] = useState("");
  const [facebookCondition, setFacebookCondition] = useState("");
  const [facebookGtin, setFacebookGtin] = useState("");

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

  // Validation state
  const [zipCodeValid, setZipCodeValid] = useState<boolean | null>(null);
  const [zipCodeValidating, setZipCodeValidating] = useState(false);

  // Load existing listing data and user profile
  useEffect(() => {
    const fetchListingAndUserData = async () => {
      try {
        setLoading(true);

        // Fetch listing data
        console.log("Fetching listing with ID:", params.id);
        const response = await fetch(`/api/listings/${params.id}`);

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
          setCondition(listingData.condition || "");
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

          // Set photos - ensure all values are properly handled
          setPhotos({
            hero: listingData.photos?.hero || null,
            back: listingData.photos?.back || null,
            proof: listingData.photos?.proof || null,
            additional: listingData.photos?.additional || [],
          });

          // Set video data
          if (listingData.videoUrl) {
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

          // Validate zip code
          if (listingData.zipCode) {
            validateZipCode(listingData.zipCode);
          }
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

  const validateZipCode = async (zip: string) => {
    setZipCodeValidating(true);
    try {
      // Simplified validation - just check if it's a 5-digit code
      const isValid = /^\d{5}$/.test(zip);
      setZipCodeValid(isValid);
      if (isValid) {
        setNeighborhood("Houston Area");
      }
    } catch (error) {
      console.error("Error validating zip code:", error);
      setZipCodeValid(false);
    } finally {
      setZipCodeValidating(false);
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
    setVideoData({
      videoId: data.videoId,
      frameUrls: data.frameUrls,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      uploaded: true,
      processing: false,
      error: null,
    });
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
          photos,
          videoUrl: videoData.uploaded ? videoData.thumbnailUrl : null,
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
                  {Object.keys(taxonomy[department] as Record<string, any>).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Sub Category */}
              {(taxonomy[department] as Record<string, any>)[category]?.length >
                0 && (
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
                    {(taxonomy[department] as Record<string, any>)[
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <p className="text-xs text-gray-500 mt-1">
                  Minimum acceptable price (auto-calculated as 70% of price)
                </p>
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
                  onChange={(e) =>
                    setCondition(
                      e.target.value as "new" | "used" | "refurbished"
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
              </div>

              {/* Discount Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Schedule
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
                <p className="text-xs text-gray-500 mt-1">
                  Turbo-30: 30% off every 30 days | Classic-60: 10% off every 60
                  days
                </p>
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

            <div className="w-full">
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
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Video Uploaded Successfully
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your video has been uploaded and processed.
                    </p>
                    {videoData.thumbnailUrl && (
                      <div className="mt-4">
                        <img
                          src={videoData.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-32 h-20 object-cover rounded-lg mx-auto"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setVideoData({
                        videoId: null,
                        frameUrls: [],
                        thumbnailUrl: null,
                        duration: null,
                        uploaded: false,
                        processing: false,
                        error: null,
                      })
                    }
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Remove Video
                  </button>
                </div>
              )}
            </div>
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
