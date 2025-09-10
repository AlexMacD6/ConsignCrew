"use client";

import { useState } from "react";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface PromoCodeInputProps {
  onApply: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: () => Promise<boolean>;
  appliedCode?: {
    code: string;
    name: string;
    description?: string;
  };
  discount?: {
    amount: number;
    type: string;
    description: string;
  };
  disabled?: boolean;
}

export default function PromoCodeInput({
  onApply,
  onRemove,
  appliedCode,
  discount,
  disabled = false,
}: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!code.trim()) {
      setError("Please enter a promo code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await onApply(code.trim());

      if (result.success) {
        setCode("");
        setError("");
      } else {
        setError(result.error || "Invalid promo code");
      }
    } catch (error) {
      setError("Failed to apply promo code");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      await onRemove();
      setError("");
    } catch (error) {
      setError("Failed to remove promo code");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  if (appliedCode) {
    return (
      <div className="space-y-3">
        {/* Applied Promo Code */}
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-green-100 rounded">
              <Tag className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-medium text-green-800">
                  {appliedCode.code}
                </code>
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-xs text-green-600">{appliedCode.name}</div>
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading || disabled}
            className="text-green-600 hover:text-green-800 disabled:opacity-50"
            title="Remove promo code"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Discount Display */}
        {discount && discount.amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Promo Code Discount
            </span>
            <span className="font-medium text-green-600">
              -${discount.amount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Free Shipping Display */}
        {discount && discount.type === "free_shipping" && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {discount.description}
            </span>
            <span className="font-medium text-green-600">Applied</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Promo Code Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Promo Code
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                // Only allow uppercase letters and numbers, no spaces
                const sanitized = e.target.value
                  .replace(/[^A-Z0-9]/g, "") // Remove any non-alphanumeric characters
                  .toUpperCase();
                setCode(sanitized);
                if (error) setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="EARLYACCESS"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent font-mono text-sm ${
                error ? "border-red-300" : "border-gray-300"
              }`}
              disabled={loading || disabled}
            />
          </div>
          <Button
            onClick={handleApply}
            disabled={loading || disabled || !code.trim()}
            className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white px-4 py-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <X className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>

      {/* Helpful Text */}
      <div className="text-xs text-gray-500">
        Have a promo code? Enter it above to apply discounts or free shipping.
      </div>
    </div>
  );
}
