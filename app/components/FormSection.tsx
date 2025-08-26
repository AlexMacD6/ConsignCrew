"use client";
import React from "react";
import { Lock } from "lucide-react";
import CategorySelector from "./CategorySelector";
import BasicFormFields from "./BasicFormFields";
import ProductDimensions from "./ProductDimensions";
import AdditionalFormFields from "./AdditionalFormFields";
import DeliveryCategory from "./DeliveryCategory";

interface FormSectionProps {
  // Form data
  department: string;
  setDepartment: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  subCategory: string;
  setSubCategory: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  brand: string;
  setBrand: (value: string) => void;
  condition: string;
  setCondition: React.Dispatch<
    React.SetStateAction<
      "" | "New" | "Used - Like New" | "Used - Good" | "Used - Fair"
    >
  >;
  height: string;
  setHeight: (value: string) => void;
  width: string;
  setWidth: (value: string) => void;
  depth: string;
  setDepth: (value: string) => void;
  dimensionsConfirmed: boolean;
  setDimensionsConfirmed: (value: boolean) => void;
  reservePrice: string;
  setReservePrice: (value: string) => void;
  serialNumber: string;
  setSerialNumber: (value: string) => void;
  modelNumber: string;
  setModelNumber: (value: string) => void;
  estimatedRetailPrice: string;
  setEstimatedRetailPrice: (value: string) => void;
  discountSchedule: string;
  setDiscountSchedule: React.Dispatch<
    React.SetStateAction<"" | "Turbo-30" | "Classic-60">
  >;
  facebookGtin: string;
  setFacebookGtin: (value: string) => void;
  setGtinEdited: (value: boolean) => void;
  deliveryCategory: "NORMAL" | "BULK";
  setDeliveryCategory: (value: "NORMAL" | "BULK") => void;

  // Additional props
  selectedInventoryItem?: any;
  discountSchedules: readonly string[];
  generatedListingId?: string;
  itemId?: string;
  generateQRCode?: (id: string) => string;
  generatedQRCode?: string;
  confidenceScores?: any;
}

export default function FormSection(props: FormSectionProps) {
  return (
    <div className="space-y-4">
      {/* Item ID (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Item ID
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={props.itemId || "Generating..."}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
          />
          <Lock className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      <CategorySelector
        department={props.department}
        setDepartment={props.setDepartment}
        category={props.category}
        setCategory={props.setCategory}
        subCategory={props.subCategory}
        setSubCategory={props.setSubCategory}
        confidenceScores={props.confidenceScores}
      />

      <BasicFormFields
        title={props.title}
        setTitle={props.setTitle}
        price={props.price}
        setPrice={props.setPrice}
        description={props.description}
        setDescription={props.setDescription}
        brand={props.brand}
        setBrand={props.setBrand}
        condition={props.condition}
        setCondition={props.setCondition}
        confidenceScores={props.confidenceScores}
      />

      <ProductDimensions
        height={props.height}
        setHeight={props.setHeight}
        width={props.width}
        setWidth={props.setWidth}
        depth={props.depth}
        setDepth={props.setDepth}
        dimensionsConfirmed={props.dimensionsConfirmed}
        setDimensionsConfirmed={props.setDimensionsConfirmed}
        confidenceScores={props.confidenceScores}
      />

      <AdditionalFormFields
        reservePrice={props.reservePrice}
        setReservePrice={props.setReservePrice}
        price={props.price}
        serialNumber={props.serialNumber}
        setSerialNumber={props.setSerialNumber}
        modelNumber={props.modelNumber}
        setModelNumber={props.setModelNumber}
        estimatedRetailPrice={props.estimatedRetailPrice}
        setEstimatedRetailPrice={props.setEstimatedRetailPrice}
        selectedInventoryItem={props.selectedInventoryItem}
        discountSchedule={props.discountSchedule}
        setDiscountSchedule={props.setDiscountSchedule}
        discountSchedules={props.discountSchedules}
        facebookGtin={props.facebookGtin}
        setFacebookGtin={props.setFacebookGtin}
        setGtinEdited={props.setGtinEdited}
        generatedListingId={props.generatedListingId}
        itemId={props.itemId}
        generateQRCode={props.generateQRCode}
        generatedQRCode={props.generatedQRCode}
      />

      <DeliveryCategory
        deliveryCategory={props.deliveryCategory}
        setDeliveryCategory={props.setDeliveryCategory}
        confidenceScores={props.confidenceScores}
      />
    </div>
  );
}
