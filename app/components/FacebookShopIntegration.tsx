"use client";
import React from "react";

interface FacebookShopIntegrationProps {
  facebookShopEnabled: boolean;
  setFacebookShopEnabled: (enabled: boolean) => void;
}

export default function FacebookShopIntegration({
  facebookShopEnabled,
  setFacebookShopEnabled,
}: FacebookShopIntegrationProps) {
  return (
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
              Sync this listing with Facebook Shop for increased visibility
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={facebookShopEnabled}
              onChange={(e) => setFacebookShopEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
