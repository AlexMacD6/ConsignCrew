"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, X, Loader2 } from "lucide-react";

interface CheckoutAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (addressData: any) => void;
  currentAddress?: string;
  currentAddressData?: AddressData;
}

interface AddressData {
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Checkout-specific address modal for changing shipping address during purchase
 * This doesn't affect the user's profile, only the current checkout session
 */
const CheckoutAddressModal: React.FC<CheckoutAddressModalProps> = ({
  isOpen,
  onClose,
  onAddressSelect,
  currentAddress = "",
  currentAddressData,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(currentAddress);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AddressData>({
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  // API key for Places New API
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Handle input changes and fetch predictions
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: value,
            languageCode: "en",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Transform the response to match our PlacePrediction interface
        const transformedPredictions = (data.suggestions || []).map(
          (suggestion: any) => {
            const prediction = suggestion.placePrediction;
            return {
              place_id: prediction.placeId,
              description: prediction.text.text,
              structured_formatting: {
                main_text: prediction.structuredFormat.mainText.text,
                secondary_text: prediction.structuredFormat.secondaryText.text,
              },
            };
          }
        );
        setPredictions(transformedPredictions);
        setShowPredictions(true);
      } else {
        const errorData = await response.text();
        console.error(
          "Failed to fetch predictions:",
          response.statusText,
          errorData
        );
        setPredictions([]);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: PlacePrediction) => {
    setInputValue(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    // Get place details
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${prediction.place_id}?key=${apiKey}`,
        {
          headers: {
            "X-Goog-FieldMask":
              "addressComponents,formattedAddress,displayName",
          },
        }
      );

      if (response.ok) {
        const placeDetails = await response.json();
        const addressData = parseAddressComponents(placeDetails);
        // Update form data with the parsed address
        setFormData(addressData);
      } else {
        const errorData = await response.text();
        console.error(
          "Failed to fetch place details:",
          response.statusText,
          errorData
        );
        // Fallback: use the prediction description as street address
        const addressData: AddressData = {
          streetAddress: prediction.description,
          city: "",
          state: "",
          postalCode: "",
          country: "",
        };
        setFormData(addressData);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      // Fallback: use the prediction description as street address
      const addressData: AddressData = {
        streetAddress: prediction.description,
        city: "",
        state: "",
        postalCode: "",
        country: "",
      };
      setFormData(addressData);
    }
  };

  // Parse address components from place details
  const parseAddressComponents = (placeDetails: any): AddressData => {
    let streetAddress = "";
    let postalCode = "";
    let city = "";
    let state = "";
    let country = "";

    if (placeDetails.addressComponents) {
      for (const component of placeDetails.addressComponents) {
        const types = component.types || [];

        if (types.includes("street_number")) {
          streetAddress = `${component.longText} ${streetAddress}`;
        } else if (types.includes("route")) {
          streetAddress += component.longText;
        } else if (types.includes("postal_code")) {
          postalCode = component.longText;
        } else if (types.includes("locality")) {
          city = component.longText;
        } else if (types.includes("administrative_area_level_1")) {
          state = component.shortText;
        } else if (types.includes("country")) {
          country = component.longText;
        }
      }
    }

    return {
      streetAddress:
        streetAddress.trim() || placeDetails.formattedAddress || "",
      city,
      state,
      postalCode,
      country,
    };
  };

  // Handle manual form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.streetAddress.trim()) {
      onAddressSelect(formData);
      onClose();
    }
  };

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue(currentAddress);
      setPredictions([]);
      setShowPredictions(false);
      setIsLoading(false);
      // Initialize form data with current address data if available
      if (currentAddressData) {
        setFormData(currentAddressData);
      } else if (currentAddress) {
        setFormData((prev) => ({
          ...prev,
          streetAddress: currentAddress,
        }));
      }
    }
  }, [isOpen, currentAddress, currentAddressData]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (!apiKey) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Change Shipping Address</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="text-red-600 text-center">
            Google Places API key not configured. Please set
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Change Shipping Address</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This change only affects your current
            purchase and won't update your profile address.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Search
            </label>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Start typing an address..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                autoComplete="off"
              />

              {isLoading && (
                <div className="absolute right-3 top-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              )}

              {/* Predictions dropdown */}
              {showPredictions && predictions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handlePredictionSelect(prediction)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {prediction.structured_formatting?.main_text}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {prediction.structured_formatting?.secondary_text}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Start typing to see address suggestions
            </p>
          </div>

          {/* Manual Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleFormChange}
                placeholder="123 Main St"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apartment/Suite
              </label>
              <input
                type="text"
                name="apartment"
                value={formData.apartment || ""}
                onChange={handleFormChange}
                placeholder="Apt 4B"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                placeholder="Houston"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleFormChange}
                placeholder="TX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleFormChange}
                placeholder="77001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleFormChange}
                placeholder="United States"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#D4AF3D] hover:bg-[#D4AF3D]/90 text-white"
              disabled={!formData.streetAddress.trim()}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use This Address
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutAddressModal;
