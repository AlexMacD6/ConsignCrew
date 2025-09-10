"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Percent, Truck, Tag } from "lucide-react";
import { Button } from "./ui/button";

interface PromoCode {
  id?: string;
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
}

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promoCode: Omit<PromoCode, "id">) => Promise<void>;
  promoCode?: PromoCode | null;
  loading?: boolean;
}

export default function PromoCodeModal({
  isOpen,
  onClose,
  onSave,
  promoCode,
  loading = false,
}: PromoCodeModalProps) {
  const [formData, setFormData] = useState<Omit<PromoCode, "id">>({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    value: 0,
    isActive: true,
    startDate: "",
    endDate: "",
    usageLimit: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (promoCode) {
      setFormData({
        code: promoCode.code,
        name: promoCode.name,
        description: promoCode.description || "",
        type: promoCode.type,
        value: promoCode.value,
        isActive: promoCode.isActive,
        startDate: promoCode.startDate ? promoCode.startDate.split("T")[0] : "",
        endDate: promoCode.endDate ? promoCode.endDate.split("T")[0] : "",
        usageLimit: promoCode.usageLimit,
      });
    } else {
      // Reset form for new promo code
      setFormData({
        code: "",
        name: "",
        description: "",
        type: "percentage",
        value: 0,
        isActive: true,
        startDate: "",
        endDate: "",
        usageLimit: undefined,
      });
    }
    setErrors({});
  }, [promoCode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Promo code is required";
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code =
        "Promo code must be uppercase alphanumeric characters only";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.value === undefined || formData.value < 0) {
      newErrors.value = "Value must be a positive number";
    }

    if (formData.type === "percentage" && formData.value > 100) {
      newErrors.value = "Percentage cannot exceed 100%";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      newErrors.endDate = "End date must be after start date";
    }

    if (formData.usageLimit !== undefined && formData.usageLimit < 1) {
      newErrors.usageLimit = "Usage limit must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Format dates for API
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        usageLimit: formData.usageLimit || undefined,
      };

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error("Error saving promo code:", error);
      // Handle error (could show toast notification)
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Tag className="h-6 w-6 text-[#D4AF3D]" />
            <h2 className="text-xl font-semibold text-gray-900">
              {promoCode ? "Edit Promo Code" : "Create Promo Code"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promo Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => {
                  // Only allow uppercase letters and numbers, no spaces
                  const sanitized = e.target.value
                    .replace(/[^A-Z0-9]/g, "") // Remove any non-alphanumeric characters
                    .toUpperCase();
                  handleInputChange("code", sanitized);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent font-mono ${
                  errors.code ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter promo code"
                disabled={!!promoCode} // Don't allow editing code for existing promo codes
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Early Access Free Delivery"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
              rows={3}
              placeholder="Free delivery for early access customers"
            />
          </div>

          {/* Discount Type and Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
              >
                <option value="percentage">Percentage Off</option>
                <option value="fixed_amount">Fixed Amount Off</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === "free_shipping"
                  ? "Value (not used)"
                  : formData.type === "percentage"
                  ? "Percentage (%)"
                  : "Amount ($)"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {formData.type === "percentage" ? (
                    <Percent className="h-4 w-4 text-gray-400" />
                  ) : formData.type === "fixed_amount" ? (
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Truck className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    handleInputChange("value", parseFloat(e.target.value) || 0)
                  }
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent ${
                    errors.value ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder={formData.type === "percentage" ? "10" : "5.00"}
                  step={formData.type === "percentage" ? "1" : "0.01"}
                  min="0"
                  max={formData.type === "percentage" ? "100" : undefined}
                  disabled={formData.type === "free_shipping"}
                />
              </div>
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent ${
                  errors.endDate ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Usage Limit and Active Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                value={formData.usageLimit || ""}
                onChange={(e) =>
                  handleInputChange(
                    "usageLimit",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent ${
                  errors.usageLimit ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Leave empty for unlimited"
                min="1"
              />
              {errors.usageLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.usageLimit}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={() => handleInputChange("isActive", true)}
                    className="mr-2"
                  />
                  Active
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isActive"
                    checked={!formData.isActive}
                    onChange={() => handleInputChange("isActive", false)}
                    className="mr-2"
                  />
                  Inactive
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : promoCode ? (
                "Update Promo Code"
              ) : (
                "Create Promo Code"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
