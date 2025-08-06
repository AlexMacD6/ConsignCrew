"use client";

import React, { useState } from "react";
import AddressModal from "../components/AddressModal";

export default function TestAutocompletePage() {
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleAddressSelect = (addressData: any) => {
    console.log("Test page: Address selected:", addressData);
    setSelectedAddress(addressData);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        Google Maps Extended Component Library Test
      </h1>

      <div className="max-w-md">
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
        >
          Open Address Picker Modal
        </button>
      </div>

      {selectedAddress && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Selected Address Data:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(selectedAddress, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Environment Check:</h2>
        <p className="text-sm">
          API Key configured:{" "}
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "Yes" : "No"}
        </p>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <p className="text-sm text-gray-600">
            Key starts with:{" "}
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 10)}...
          </p>
        )}
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddressSelect={handleAddressSelect}
        currentAddress=""
      />
    </div>
  );
}
