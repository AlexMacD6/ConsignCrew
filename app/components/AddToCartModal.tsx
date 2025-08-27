"use client";
import React from "react";
import { Button } from "./ui/button";
import { CheckCircle, ShoppingCart, X } from "lucide-react";

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewCart: () => void;
  itemName?: string;
}

export default function AddToCartModal({
  isOpen,
  onClose,
  onViewCart,
  itemName
}: AddToCartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D4AF3D] to-[#b8932f] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-full p-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Added to Cart!</h3>
                <p className="text-white/80 text-sm">Item successfully added</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {itemName && (
            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-1">Item added:</p>
              <p className="font-medium text-gray-900">{itemName}</p>
            </div>
          )}
          
          <p className="text-gray-600 mb-6">
            Your item has been added to your cart. What would you like to do next?
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onViewCart}
              className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white font-medium"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Cart
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
