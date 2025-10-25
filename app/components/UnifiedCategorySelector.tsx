"use client";
import React, { useState, useEffect, useRef } from "react";
import { ConfidenceBadge } from "./ConfidenceIndicator";
import { ConfidenceLevel } from "@/lib/ai-confidence-scorer";
import { ChevronDown, Search } from "lucide-react";

interface UnifiedCategorySelectorProps {
  department: string;
  setDepartment: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  subCategory: string;
  setSubCategory: (value: string) => void;
  taxonomy: any;
  confidenceScores?: {
    department?: { level: ConfidenceLevel };
    category?: { level: ConfidenceLevel };
    subCategory?: { level: ConfidenceLevel };
  };
  onCategoryChange?: (
    department: string,
    category: string,
    subCategory: string
  ) => void;
}

interface CategoryOption {
  fullPath: string; // e.g., "Video Games & Consoles//Video Game Accessories//Memory Cards & Expansion Packs"
  department: string;
  category: string;
  subCategory: string;
  displayText: string; // formatted for display
}

export default function UnifiedCategorySelector({
  department,
  setDepartment,
  category,
  setCategory,
  subCategory,
  setSubCategory,
  taxonomy,
  confidenceScores,
  onCategoryChange,
}: UnifiedCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<CategoryOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Build flat list of all category combinations
  useEffect(() => {
    if (!taxonomy) return;

    const options: CategoryOption[] = [];

    Object.keys(taxonomy).forEach((dept) => {
      const deptData = taxonomy[dept];
      if (!deptData || typeof deptData !== "object") return;

      Object.keys(deptData).forEach((cat) => {
        const catData = deptData[cat];

        // If there are subcategories
        if (Array.isArray(catData) && catData.length > 0) {
          catData.forEach((sub) => {
            options.push({
              fullPath: `${dept}//${cat}//${sub}`,
              department: dept,
              category: cat,
              subCategory: sub,
              displayText: `${dept} → ${cat} → ${sub}`,
            });
          });
        } else {
          // No subcategories, just department and category
          options.push({
            fullPath: `${dept}//${cat}`,
            department: dept,
            category: cat,
            subCategory: "",
            displayText: `${dept} → ${cat}`,
          });
        }
      });
    });

    // Sort alphabetically by display text
    options.sort((a, b) => a.displayText.localeCompare(b.displayText));

    setCategoryOptions(options);
    setFilteredOptions(options);
  }, [taxonomy]);

  // Filter options based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOptions(categoryOptions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = categoryOptions.filter((option) =>
      option.displayText.toLowerCase().includes(query)
    );
    setFilteredOptions(filtered);
  }, [searchQuery, categoryOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Get current selection display text
  const getCurrentSelectionText = () => {
    if (!department) return "Select Category";

    const parts = [department];
    if (category) parts.push(category);
    if (subCategory) parts.push(subCategory);

    return parts.join(" → ");
  };

  // Handle selection
  const handleSelect = (option: CategoryOption) => {
    setDepartment(option.department);
    setCategory(option.category);
    setSubCategory(option.subCategory);
    onCategoryChange?.(option.department, option.category, option.subCategory);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Get the highest confidence level from all three fields
  const getHighestConfidence = (): ConfidenceLevel | null => {
    const levels = [
      confidenceScores?.department?.level,
      confidenceScores?.category?.level,
      confidenceScores?.subCategory?.level,
    ].filter(Boolean) as ConfidenceLevel[];

    if (levels.length === 0) return null;

    // Priority: high > medium > low
    if (levels.includes("high")) return "high";
    if (levels.includes("medium")) return "medium";
    return "low";
  };

  const highestConfidence = getHighestConfidence();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        Category *
        {highestConfidence && <ConfidenceBadge level={highestConfidence} />}
      </label>

      <div className="relative" ref={dropdownRef}>
        {/* Main dropdown trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent bg-white text-left flex items-center justify-between"
        >
          <span className={department ? "text-gray-900" : "text-gray-400"}>
            {getCurrentSelectionText()}
          </span>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search categories..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-80">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  No categories found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected =
                    option.department === department &&
                    option.category === category &&
                    option.subCategory === subCategory;

                  return (
                    <button
                      key={`${option.fullPath}-${index}`}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[#D4AF3D]/10 transition-colors ${
                        isSelected
                          ? "bg-[#D4AF3D]/20 font-medium text-[#D4AF3D]"
                          : "text-gray-700"
                      }`}
                    >
                      {option.displayText}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {department && category && (
          <span>
            <strong>Department:</strong> {department}
            {category && (
              <>
                {" "}
                • <strong>Category:</strong> {category}
              </>
            )}
            {subCategory && (
              <>
                {" "}
                • <strong>Sub-category:</strong> {subCategory}
              </>
            )}
          </span>
        )}
        {!department && "Search and select from available categories"}
      </p>
    </div>
  );
}












