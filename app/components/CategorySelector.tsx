"use client";
import React from "react";
import { ConfidenceBadge } from "./ConfidenceIndicator";
import { ConfidenceLevel } from "@/lib/ai-confidence-scorer";

interface CategorySelectorProps {
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

export default function CategorySelector({
  department,
  setDepartment,
  category,
  setCategory,
  subCategory,
  setSubCategory,
  taxonomy,
  confidenceScores,
  onCategoryChange,
}: CategorySelectorProps) {
  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setCategory("");
    setSubCategory("");
    onCategoryChange?.(value, "", "");
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSubCategory("");
    onCategoryChange?.(department, value, "");
  };

  const handleSubCategoryChange = (value: string) => {
    setSubCategory(value);
    onCategoryChange?.(department, category, value);
  };

  return (
    <>
      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          Department *
          {confidenceScores?.department && (
            <ConfidenceBadge level={confidenceScores.department.level} />
          )}
        </label>
        <select
          value={department}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          required
        >
          <option value="">Select Department</option>
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
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          Category *
          {confidenceScores?.category && (
            <ConfidenceBadge level={confidenceScores.category.level} />
          )}
        </label>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          required
        >
          <option value="">Select Category</option>
          {department && taxonomy && taxonomy[department]
            ? Object.keys(taxonomy[department]).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
            : // Show all categories when no department selected
            taxonomy
            ? (() => {
                const allCategories: JSX.Element[] = [];
                Object.keys(taxonomy).forEach((dept) => {
                  const deptData = taxonomy[dept];
                  if (deptData) {
                    Object.keys(deptData).forEach((cat) => {
                      allCategories.push(
                        <option key={`${dept}-${cat}`} value={cat}>
                          {cat}
                        </option>
                      );
                    });
                  }
                });
                return allCategories;
              })()
            : null}
        </select>
      </div>

      {/* Sub-category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          Sub-category *
          {confidenceScores?.subCategory && (
            <ConfidenceBadge level={confidenceScores.subCategory.level} />
          )}
        </label>
        <select
          value={subCategory}
          onChange={(e) => handleSubCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
          required
        >
          <option value="">Select Sub-category</option>
          {category &&
          department &&
          taxonomy &&
          taxonomy[department] &&
          taxonomy[department][category]
            ? (taxonomy[department][category] as string[]).map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))
            : // Show all sub-categories when no category selected
            taxonomy
            ? (() => {
                const allSubCategories: JSX.Element[] = [];
                Object.keys(taxonomy).forEach((dept) => {
                  const deptData = taxonomy[dept];
                  if (deptData) {
                    Object.keys(deptData).forEach((cat) => {
                      const catData = deptData[cat];
                      if (Array.isArray(catData)) {
                        catData.forEach((sub) => {
                          allSubCategories.push(
                            <option key={`${dept}-${cat}-${sub}`} value={sub}>
                              {sub}
                            </option>
                          );
                        });
                      }
                    });
                  }
                });
                return allSubCategories;
              })()
            : null}
        </select>
      </div>
    </>
  );
}
