"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { CheckCircleIcon } from "lucide-react";

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
  const router = useRouter();
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
  const [zip, setZip] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection and flash
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setImage(file);
      setShowFlash(true);
      setTimeout(() => {
        setShowFlash(false);
        setStep(2);
      }, 800);
    }
  };

  // Form validation
  const isFormValid =
    !!image &&
    department &&
    category &&
    subCategory &&
    title.trim().length > 0 &&
    title.length <= 100 &&
    condition &&
    price &&
    !isNaN(Number(price)) &&
    Number(price) > 0 &&
    description.trim().length > 0 &&
    zip.match(/^\d{5}$/);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      image,
      department,
      category,
      subCategory,
      title,
      condition,
      price,
      description,
      zip,
    };
    // eslint-disable-next-line no-console
    console.table(data);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg mx-auto">
        {/* Step 1: Photo Capture */}
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
              @keyframes pop {
                0% { transform: scale(0.7); opacity: 0; }
                60% { transform: scale(1.15); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              .animate-pop { animation: pop 0.8s cubic-bezier(.17,.67,.83,.67); }
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-fade-in { animation: fade-in 0.2s; }
            `}</style>
          </div>
        )}
        {/* Step 2: Listing Form */}
        {step === 2 && (
          <form
            className="bg-white rounded-xl shadow-lg p-8 space-y-6"
            onSubmit={handleSubmit}
          >
            {/* Photo Preview */}
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
                <label className="block font-medium mb-1">Department</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value as Department);
                    setCategory("");
                    setSubCategory("");
                  }}
                  required
                >
                  <option value="">Select Department</option>
                  {Object.keys(taxonomy).map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
              {/* Category */}
              <div>
                <label className="block font-medium mb-1">Category</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory("");
                  }}
                  required
                  disabled={!department}
                >
                  <option value="">
                    {department ? "Select Category" : "Select Department first"}
                  </option>
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
                <label className="block font-medium mb-1">Sub-category</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  required
                  disabled={!category}
                >
                  <option value="">
                    {category ? "Select Sub-category" : "Select Category first"}
                  </option>
                  {department &&
                  category &&
                  (taxonomy[department][
                    category as keyof (typeof taxonomy)[typeof department]
                  ] as unknown as string[]) &&
                  (
                    taxonomy[department][
                      category as keyof (typeof taxonomy)[typeof department]
                    ] as unknown as string[]
                  ).length > 0 ? (
                    (
                      taxonomy[department][
                        category as keyof (typeof taxonomy)[typeof department]
                      ] as unknown as string[]
                    ).map((sub: string) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))
                  ) : (
                    <option value="">(No sub-categories)</option>
                  )}
                </select>
              </div>
              {/* Title */}
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Modern Sofa, iPhone 13, etc."
                />
                <div className="text-xs text-gray-400 text-right">
                  {title.length}/100
                </div>
              </div>
              {/* Condition */}
              <div>
                <label className="block font-medium mb-1">Condition</label>
                <div className="flex gap-4">
                  {conditions.map((cond) => (
                    <label key={cond} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="condition"
                        value={cond}
                        checked={condition === cond}
                        onChange={() => setCondition(cond)}
                        required
                      />
                      <span>{cond}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Price */}
              <div>
                <label className="block font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  min={1}
                  step={0.01}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="Enter price"
                />
              </div>
              {/* Description */}
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Describe your item..."
                />
              </div>
              {/* ZIP Code */}
              <div>
                <label className="block font-medium mb-1">ZIP Code</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  value={zip}
                  onChange={(e) =>
                    setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))
                  }
                  required
                  pattern="^\d{5}$"
                  placeholder="e.g. 90210"
                />
              </div>
            </div>
            {/* Sticky Post Button */}
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
