"use client";
import React, { useState, useEffect, useRef } from "react";
import { Printer } from "lucide-react";

interface CustomQRCodeProps {
  itemId: string;
  size?: number;
  className?: string;
  showPrintButton?: boolean;
  userOrganizations?: any[];
}

export default function CustomQRCode({
  itemId,
  size = 200,
  className = "",
  showPrintButton = false,
  userOrganizations = [],
}: CustomQRCodeProps) {
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Check if user belongs to TreasureHub organization
  const isTreasureHubMember = userOrganizations.some(
    (org) =>
      org.slug === "treasurehub" || org.name?.toLowerCase() === "treasurehub"
  );

  // Debug logging for button visibility
  console.log("QRCode Debug:", {
    showPrintButton,
    userOrganizations,
    isTreasureHubMember,
    isLoading,
    shouldShowButton: showPrintButton && isTreasureHubMember && !isLoading,
  });

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

  const handlePrintLabel = async () => {
    console.log("Print label clicked", { QRCodeComponent, itemId, qrData });

    if (!QRCodeComponent) {
      console.error("QRCodeComponent not loaded");
      alert("QR code component not ready. Please wait and try again.");
      return;
    }

    setIsGeneratingLabel(true);
    try {
      // Generate label using the existing QR code format
      await generatePrintableLabel(itemId, qrData);
    } catch (error) {
      console.error("Error generating print label:", error);
      alert("Failed to generate print label. Please try again.");
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const generatePrintableLabel = async (itemId: string, qrData: string) => {
    console.log("Starting label generation", { itemId, qrData });

    // Create a canvas for the 2" x 2" label at 300 DPI
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 2" x 2" at 300 DPI = 600px x 600px
    const labelSize = 600;
    canvas.width = labelSize;
    canvas.height = labelSize;

    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    console.log("Canvas created, starting generation...");

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, labelSize, labelSize);

    // Generate QR code with the same settings as the component

    // Use the same QR code library to generate (exact same settings as component)
    console.log("Generating QR code...");
    const QRCode = (await import("qrcode")).default;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H", // High error correction level to allow for logo overlay
      type: "image/png",
      quality: 1,
      margin: 4, // includeMargin=true means margin of 4
      color: {
        dark: "#000000", // fgColor
        light: "#ffffff", // bgColor
      },
      width: 400, // QR code size in the 600px canvas
    });
    console.log("QR code generated");

    // Load QR code image
    console.log("Loading QR code image...");
    const qrImage = new Image();
    await new Promise((resolve, reject) => {
      qrImage.onload = () => {
        console.log("QR code image loaded");
        resolve(undefined);
      };
      qrImage.onerror = (error) => {
        console.error("Failed to load QR code image", error);
        reject(error);
      };
      qrImage.src = qrCodeDataURL;
    });

    // Load TreasureHub banner logo for header (with fallback)
    console.log("Loading TreasureHub banner logo...");
    const bannerLogo = new Image();
    let useBannerLogo = false;
    try {
      await new Promise((resolve, reject) => {
        bannerLogo.onload = () => {
          console.log("TreasureHub banner logo loaded");
          useBannerLogo = true;
          resolve(undefined);
        };
        bannerLogo.onerror = (error) => {
          console.warn("Banner logo not found, will use text fallback");
          resolve(undefined); // Don't reject, just use fallback
        };
        // Use the specified label banner logo
        bannerLogo.src = "/TreasureHub - Banner - Label.png";
      });
    } catch (error) {
      console.warn("Banner logo failed to load, using text fallback");
      useBannerLogo = false;
    }

    // Load TreasureHub center logo for QR code overlay
    console.log("Loading TreasureHub center logo...");
    const centerLogo = new Image();
    await new Promise((resolve, reject) => {
      centerLogo.onload = () => {
        console.log("TreasureHub center logo loaded");
        resolve(undefined);
      };
      centerLogo.onerror = (error) => {
        console.error("Failed to load TreasureHub center logo", error);
        reject(error);
      };
      centerLogo.src = "/TreasureHub - Logo Black.png";
    });

    // Calculate spacing: smaller margins to maximize QR code size
    const margin = 30; // Reduced from 45px
    const availableWidth = labelSize - margin * 2;
    const availableHeight = labelSize - margin * 2;

    // Draw TreasureHub banner at the top
    const bannerY = margin;
    let bannerHeight = 100; // Much bigger banner (2.5x larger)

    if (useBannerLogo) {
      // Use the banner logo
      const bannerWidth = Math.min(
        availableWidth,
        bannerLogo.width * (bannerHeight / bannerLogo.height)
      );
      const bannerX = (labelSize - bannerWidth) / 2;
      ctx.drawImage(bannerLogo, bannerX, bannerY, bannerWidth, bannerHeight);
    } else {
      // Fallback to black text (scaled up for larger banner)
      ctx.fillStyle = "#000000"; // Black ink only
      ctx.font = "bold 64px Arial"; // Much larger font to match banner size
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TreasureHub", labelSize / 2, bannerY + bannerHeight / 2);
    }

    // Calculate maximum QR code size with smaller spacing
    const spacingBetweenElements = 10; // Reduced from 15px

    // Item ID box at bottom (larger and matches QR code width)
    const skuBoxHeight = 80; // Even bigger for better readability
    const skuY = labelSize - margin - skuBoxHeight;

    const qrStartY = bannerY + bannerHeight + spacingBetweenElements;
    const qrEndY = skuY - spacingBetweenElements;
    const maxQRHeight = qrEndY - qrStartY;
    const maxQRWidth = availableWidth;

    // Use the smaller dimension to keep QR code square and as large as possible
    const qrSize = Math.min(maxQRHeight, maxQRWidth);
    const qrX = (labelSize - qrSize) / 2;
    const qrY = qrStartY + (maxQRHeight - qrSize) / 2; // Center vertically in available space

    // Make Item ID box same width as QR code
    const skuBoxWidth = qrSize; // Same width as QR code
    const skuBoxX = qrX; // Same X position as QR code

    // Draw QR code
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Draw high-resolution logo in center of QR code (properly scaled for chest positioning)
    // Scale logo appropriately for high resolution - larger than before since it's higher quality
    const logoSize = Math.min(120, qrSize * 0.25); // Increased size for high-res logo, up to 25% of QR code
    const logoX = (labelSize - logoSize) / 2;
    const logoY = qrY + (qrSize - logoSize) / 2;

    // Add white background circle for logo (like the component excavation)
    const excavationSize = logoSize + 20; // Slightly larger margin for better visibility
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      logoX + logoSize / 2,
      logoY + logoSize / 2,
      excavationSize / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Draw the high-resolution center logo with anti-aliasing for crisp rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(centerLogo, logoX, logoY, logoSize, logoSize);

    // Draw black box for SKU
    ctx.fillStyle = "#000000";
    ctx.fillRect(skuBoxX, skuY, skuBoxWidth, skuBoxHeight);

    // Draw white text inside black box (even larger for maximum readability)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px monospace"; // Increased to 48px for the bigger box
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(itemId, labelSize / 2, skuY + skuBoxHeight / 2);

    // Add very bold black border around entire label
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 12; // Even much bolder border (2x previous)
    ctx.strokeRect(6, 6, labelSize - 12, labelSize - 12);

    // Convert canvas to blob and trigger download
    console.log("Converting canvas to blob and triggering download...");
    canvas.toBlob((blob) => {
      if (blob) {
        console.log("Blob created, size:", blob.size);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `TreasureHub-Label-${itemId}.png`;
        document.body.appendChild(link);
        console.log("Clicking download link...");
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("Download completed");
      } else {
        console.error("Failed to create blob from canvas");
      }
    }, "image/png");
  };

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

      {/* TreasureHub Organization Print Label Button */}
      {showPrintButton && isTreasureHubMember && !isLoading && (
        <div className="mt-4 text-center">
          <button
            onClick={handlePrintLabel}
            disabled={isGeneratingLabel}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isGeneratingLabel
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#D4AF3D] text-white hover:bg-[#c4a235]"
            }`}
          >
            {isGeneratingLabel ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                Generating...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4" />
                Print Label
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
