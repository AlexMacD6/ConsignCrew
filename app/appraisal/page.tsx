"use client";

import React, { useState, useRef, useCallback } from "react";
import { Camera, Upload, Loader2, ArrowLeft, Table, Eye } from "lucide-react";
import { Button } from "../components/ui/button";

interface AppraisalResult {
  id: string;
  imageUrl: string;
  timestamp: Date;
  status: "processing" | "completed" | "error";
  result?: {
    title: string;
    description: string;
    brand?: string;
    condition: string;
    estimatedValue: {
      low: number;
      high: number;
    };
    category: string;
    subCategory: string;
    department: string;
    confidence: {
      title: string;
      description: string;
      condition: string;
      value: string;
    };
    marketData?: {
      source: string;
      comparables: Array<{
        title: string;
        price: number;
        condition: string;
        source: string;
      }>;
    };
  };
  error?: string;
}

export default function AppraisalPage() {
  const [currentTab, setCurrentTab] = useState<"camera" | "table">("camera");
  const [appraisals, setAppraisals] = useState<AppraisalResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTakePhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      try {
        // Create a new appraisal entry immediately
        const appraisalId = Date.now().toString();
        const imageUrl = URL.createObjectURL(file);

        const newAppraisal: AppraisalResult = {
          id: appraisalId,
          imageUrl,
          timestamp: new Date(),
          status: "processing",
        };

        setAppraisals((prev) => [newAppraisal, ...prev]);

        // Upload photo and get analysis
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("appraisalId", appraisalId);

        const response = await fetch("/api/appraisal/analyze", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();

        // Update the appraisal with results
        setAppraisals((prev) =>
          prev.map((appraisal) =>
            appraisal.id === appraisalId
              ? { ...appraisal, status: "completed", result: result.analysis }
              : appraisal
          )
        );
      } catch (error) {
        console.error("Appraisal error:", error);
        setAppraisals((prev) =>
          prev.map((appraisal) =>
            appraisal.id === appraisals[0]?.id
              ? {
                  ...appraisal,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : appraisal
          )
        );
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [appraisals]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: AppraisalResult["status"]) => {
    switch (status) {
      case "processing":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const renderCameraTab = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Quick Appraisal
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentTab("table")}
            className="flex items-center gap-2"
          >
            <Table className="h-4 w-4" />
            Results
          </Button>
        </div>
      </div>

      {/* Camera Section */}
      <div className="flex-1 flex flex-col">
        {/* Take Photo Button */}
        <div className="p-6">
          <Button
            onClick={handleTakePhoto}
            disabled={isUploading}
            className="w-full h-16 bg-treasure-500 hover:bg-treasure-600 text-white text-lg font-medium flex items-center justify-center gap-3 rounded-xl shadow-lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Camera className="h-6 w-6" />
                Take Photo
              </>
            )}
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Recent Results */}
        <div className="flex-1 px-4 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Recent Appraisals
          </h2>
          <div className="space-y-4">
            {appraisals.slice(0, 3).map((appraisal) => (
              <div
                key={appraisal.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-48">
                  <img
                    src={appraisal.imageUrl}
                    alt="Appraisal"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appraisal.status
                      )}`}
                    >
                      {appraisal.status}
                    </span>
                  </div>
                </div>

                {/* Results */}
                <div className="p-4">
                  {appraisal.status === "processing" && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing image...</span>
                    </div>
                  )}

                  {appraisal.status === "error" && (
                    <div className="text-red-600">
                      <p className="text-sm font-medium">Error</p>
                      <p className="text-xs">{appraisal.error}</p>
                    </div>
                  )}

                  {appraisal.status === "completed" && appraisal.result && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">
                        {appraisal.result.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {appraisal.result.description}
                      </p>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-xs text-gray-500">
                            Estimated Value
                          </p>
                          <p className="font-medium text-treasure-600">
                            {formatCurrency(
                              appraisal.result.estimatedValue.low
                            )}{" "}
                            -{" "}
                            {formatCurrency(
                              appraisal.result.estimatedValue.high
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Condition</p>
                          <p className="text-sm font-medium">
                            {appraisal.result.condition}
                          </p>
                        </div>
                      </div>

                      {appraisal.result.confidence && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-1">
                            Confidence Scores
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              Title:{" "}
                              <span className="font-medium">
                                {appraisal.result.confidence.title}
                              </span>
                            </div>
                            <div>
                              Value:{" "}
                              <span className="font-medium">
                                {appraisal.result.confidence.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {appraisals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No appraisals yet</p>
                <p className="text-sm">Tap "Take Photo" to start</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableTab = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentTab("camera")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">All Results</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Table */}
      <div className="p-4">
        {appraisals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Table className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No appraisals yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appraisals.map((appraisal) => (
              <div
                key={appraisal.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <img
                      src={appraisal.imageUrl}
                      alt="Appraisal"
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {appraisal.result?.title || "Processing..."}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            appraisal.status
                          )}`}
                        >
                          {appraisal.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Category</p>
                          <p className="font-medium">
                            {appraisal.result?.category || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Brand</p>
                          <p className="font-medium">
                            {appraisal.result?.brand || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Condition</p>
                          <p className="font-medium">
                            {appraisal.result?.condition || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Est. Value</p>
                          <p className="font-medium text-treasure-600">
                            {appraisal.result
                              ? `${formatCurrency(
                                  appraisal.result.estimatedValue.low
                                )} - ${formatCurrency(
                                  appraisal.result.estimatedValue.high
                                )}`
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {appraisal.result?.description && (
                        <div className="mt-2">
                          <p className="text-gray-500 text-xs">Description</p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {appraisal.result.description}
                          </p>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-400">
                        {appraisal.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return currentTab === "camera" ? renderCameraTab() : renderTableTab();
}
