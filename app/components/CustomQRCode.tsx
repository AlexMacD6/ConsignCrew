"use client";
import React, { useState, useEffect } from "react";

interface CustomQRCodeProps {
  itemId: string;
  size?: number;
  className?: string;
}

export default function CustomQRCode({
  itemId,
  size = 200,
  className = "",
}: CustomQRCodeProps) {
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate the full URL for the QR code
  const qrData = `${window.location.origin}/list-item/${itemId}`;

  useEffect(() => {
    const loadQRCode = async () => {
      try {
        const { QRCodeSVG } = await import("qrcode.react");
        setQRCodeComponent(() => QRCodeSVG);
      } catch (error) {
        console.error("Failed to load QR code component:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQRCode();
  }, []);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* QR Code */}
      <div className="relative">
        {isLoading ? (
          <div
            className="bg-gray-100 rounded-lg p-4 text-center"
            style={{ width: size, height: size }}
          >
            <p className="text-sm text-gray-600">Loading QR Code...</p>
          </div>
        ) : QRCodeComponent ? (
          <QRCodeComponent
            value={qrData}
            size={size}
            level="H" // High error correction level to allow for logo overlay
            includeMargin={true}
            bgColor="#FFFFFF"
            fgColor="#000000"
            imageSettings={{
              src: "/TreasureHub - Favicon Black.png",
              x: undefined,
              y: undefined,
              height: size * 0.25, // 25% of QR code size (increased from 15%)
              width: size * 0.25,
              excavate: true, // Remove QR code data where logo is placed
            }}
          />
        ) : (
          <div
            className="bg-gray-100 rounded-lg p-4 text-center"
            style={{ width: size, height: size }}
          >
            <p className="text-sm text-gray-600">QR Code unavailable</p>
          </div>
        )}
      </div>

      {/* Item ID Display Below QR Code */}
      <div className="mt-3 text-center">
        <div className="bg-gray-100 rounded-lg px-3 py-2 inline-block">
          <span className="font-mono font-bold text-lg tracking-wider text-gray-800">
            {itemId}
          </span>
        </div>
      </div>

      {/* Scan Instructions */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">Scan to view listing</p>
      </div>
    </div>
  );
}
