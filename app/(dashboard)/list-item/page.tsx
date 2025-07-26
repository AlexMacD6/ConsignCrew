"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { CheckCircleIcon, AlertCircle, MapPin, Info, Lock } from "lucide-react";
import {
  isApprovedZipCode,
  getNeighborhoodName,
  getApprovedZipCodes,
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
  const [image, setImage] = useState<File | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setShowFlash(true);
      setTimeout(() => {
        setShowFlash(false);
        setStep(2);
      }, 800);
    }
  };

  const isFormValid =
    image &&
    department &&
    category &&
    subCategory &&
    title &&
    condition &&
    price &&
    description &&
    zipCode &&
    isApprovedZipCode(zipCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      const formData = {
        image: image?.name,
        department,
        category,
        subCategory,
        title,
        condition,
        price: parseFloat(price),
        description,
        zipCode,
        neighborhood: getNeighborhoodName(zipCode),
        brand,
        dimensions,
        serialNumber,
        modelNumber,
        estimatedRetailPrice: estimatedRetailPrice
          ? parseFloat(estimatedRetailPrice)
          : null,
        discountSchedule,
        timestamp: new Date().toISOString(),
      };
      console.table(formData);
      router.push("/dashboard");
    }
  };

  const approvedZipCodes = getApprovedZipCodes();

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
            <h1 className="text-2xl font-bold mb-4 text-[#D4AF3D]">
              Snap a Photo
            </h1>
            <label
              htmlFor="photo-input"
              className="w-full flex flex-col items-center cursor-pointer"
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
                  Tap to take or choose a photo
                </span>
              </div>
            </label>
            <p className="text-gray-500 text-sm">
              Tap to take or choose a photo
            </p>
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
                    These fields will be automatically generated by ConsignCrew
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
                          value={`${title || "item"} ${category || "category"} ${department || "department"}`}
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
                              ? `$${Math.floor(parseFloat(price) * 0.8)} - $${Math.floor(parseFloat(price) * 1.2)}`
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
                              ? `$${calculateReservePrice(parseFloat(price)).toFixed(2)}`
                              : "75% of list price"
                          }
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* ConsignCrew Fee */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ConsignCrew Fee
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={
                            price
                              ? `$${calculateFee(parseFloat(price)).toFixed(2)} (8.5%)`
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

                  {image && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        className="w-64 h-64 object-cover rounded-xl border border-gray-200"
                      />
                    </div>
                  )}

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
                            (isApprovedZipCode(zipCode) ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ))}
                        </div>
                      </div>
                      {zipCode && (
                        <div className="mt-2">
                          {isApprovedZipCode(zipCode) ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <MapPin className="h-4 w-4" />
                              <span>{getNeighborhoodName(zipCode)}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-red-600">
                              ZIP code not in approved service area
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Must be in ConsignCrew service area
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 left-0 right-0 bg-white pt-6 pb-2">
              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={!isFormValid}
              >
                Post Listing
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
