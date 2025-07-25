"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { CheckCircleIcon, AlertCircle, MapPin } from "lucide-react";
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
        timestamp: new Date().toISOString(),
      };
      console.table(formData);
      router.push("/dashboard");
    }
  };

  const approvedZipCodes = getApprovedZipCodes();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg mx-auto">
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
            className="bg-white rounded-xl shadow-lg p-8 space-y-6"
            onSubmit={handleSubmit}
          >
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
                  Price ($) *
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

            <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 pb-2">
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
