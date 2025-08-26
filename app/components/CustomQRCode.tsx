"use client";
import React, { useState, useEffect, useRef } from "react";
import { Printer, FileText } from "lucide-react";

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Check if user belongs to TreasureHub organization or is an admin
  const isTreasureHubMember = userOrganizations.some(
    (org) =>
      org.organizationSlug === "treasurehub" ||
      org.organizationSlug === "treasurehub-admin" ||
      org.role === "ADMIN" ||
      org.role === "OWNER" ||
      org.name?.toLowerCase() === "treasurehub"
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

    // Create a canvas for the 2" x 3" label at 300 DPI (600x900 pixels)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 2" wide x 3" tall at 300 DPI = 600px x 900px
    const labelWidth = 600; // 2 inches at 300 DPI
    const labelHeight = 900; // 3 inches at 300 DPI
    canvas.width = labelWidth;
    canvas.height = labelHeight;

    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    console.log("Canvas created, starting generation...");

    // Set white background instead of transparent
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, labelWidth, labelHeight);

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

    // Calculate spacing: minimal margins to maximize QR code size
    const margin = 20; // Further reduced to maximize QR code space
    const availableWidth = labelWidth - margin * 2;
    const availableHeight = labelHeight - margin * 2;

    // Draw TreasureHub banner at the top
    const bannerY = margin;
    let bannerHeight = 100; // Much bigger banner (2.5x larger)

    if (useBannerLogo) {
      // Use the banner logo
      const bannerWidth = Math.min(
        availableWidth,
        bannerLogo.width * (bannerHeight / bannerLogo.height)
      );
      const bannerX = (labelWidth - bannerWidth) / 2;
      ctx.drawImage(bannerLogo, bannerX, bannerY, bannerWidth, bannerHeight);
    } else {
      // Fallback to black text (scaled up for larger banner)
      ctx.fillStyle = "#000000"; // Black ink only
      ctx.font = "bold 64px Arial"; // Much larger font to match banner size
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TreasureHub", labelWidth / 2, bannerY + bannerHeight / 2);
    }

    // Calculate maximum QR code size with minimal spacing to maximize QR size
    const spacingBetweenElements = 5; // Minimal spacing to maximize QR code size

    // Calculate Item ID text dimensions first to size box appropriately
    const itemIdFontSize = 90; // Bigger than previous 77px
    ctx.font = `bold ${itemIdFontSize}px monospace`;
    const textMetrics = ctx.measureText(itemId);
    const textWidth = textMetrics.width;
    const textHeight = itemIdFontSize; // Approximate height based on font size

    // Create a snug-fitting black box around the text with padding
    const textPadding = 15; // Padding around text
    const skuBoxWidth = textWidth + textPadding * 2;
    const skuBoxHeight = textHeight + textPadding * 2;
    const skuY = labelHeight - margin - skuBoxHeight;
    const skuBoxX = (labelWidth - skuBoxWidth) / 2; // Center the text-fitting black box

    const qrStartY = bannerY + bannerHeight + spacingBetweenElements;
    const qrEndY = skuY - spacingBetweenElements;
    const maxQRHeight = qrEndY - qrStartY;
    const maxQRWidth = availableWidth;

    // Maximize QR code size to use all available space while keeping logo and Item ID perfect
    const qrSize = Math.min(maxQRHeight, maxQRWidth); // Use 100% of available space for maximum QR size
    const qrX = (labelWidth - qrSize) / 2;
    const qrY = qrStartY + (maxQRHeight - qrSize) / 2; // Center vertically in available space

    // Draw QR code
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Draw high-resolution logo in center of QR code (properly scaled for chest positioning)
    // Scale logo appropriately for high resolution - larger than before since it's higher quality
    const logoSize = Math.min(120, qrSize * 0.25); // Increased size for high-res logo, up to 25% of QR code
    const logoX = (labelWidth - logoSize) / 2;
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

    // Draw white text inside black box (bigger and centered in the snug box)
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${itemIdFontSize}px monospace`; // Use the calculated font size (90px)
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(itemId, labelWidth / 2, skuY + skuBoxHeight / 2);

    // Add very bold black border around entire label with margin to prevent scanner cut-off
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 8; // Slightly thinner border to accommodate margin
    const borderMargin = 15; // Margin from edge to prevent scanner cut-off
    ctx.strokeRect(
      borderMargin,
      borderMargin,
      labelWidth - borderMargin * 2,
      labelHeight - borderMargin * 2
    );

    // Convert canvas to PNG with embedded 300 DPI metadata
    console.log("Converting canvas to 300 DPI PNG with proper metadata...");

    // Get image data from canvas
    const dataUrl = canvas.toDataURL("image/png", 1.0);

    // Debug: Log the original PNG data
    console.log("Original PNG dataUrl length:", dataUrl.length);

    // Simpler, more reliable approach to add DPI metadata
    const addDpiToPng = (dataUrl: string) => {
      try {
        // Convert data URL to Uint8Array
        const base64 = dataUrl.split(",")[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        console.log(
          "PNG signature check:",
          Array.from(bytes.slice(0, 8)).map((b) => b.toString(16))
        );

        // Verify PNG signature
        const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
        for (let i = 0; i < 8; i++) {
          if (bytes[i] !== pngSignature[i]) {
            console.error("Invalid PNG signature");
            return dataUrl;
          }
        }

        // Find IHDR chunk (always at position 8 in valid PNG)
        let pos = 8;
        const ihdrLength =
          (bytes[pos] << 24) |
          (bytes[pos + 1] << 16) |
          (bytes[pos + 2] << 8) |
          bytes[pos + 3];
        console.log("IHDR length:", ihdrLength);

        if (ihdrLength !== 13) {
          console.error("Invalid IHDR length");
          return dataUrl;
        }

        // Skip IHDR: length(4) + type(4) + data(13) + crc(4) = 25 bytes
        pos += 4 + 4 + 13 + 4; // Now pointing to next chunk

        console.log("Position after IHDR:", pos);

        // Create pHYs chunk
        const pixelsPerMeter = 11811; // 300 DPI = 11811 pixels/meter
        console.log("Pixels per meter:", pixelsPerMeter);

        const physData = new Uint8Array(9);
        // X pixels per meter (4 bytes, big endian)
        physData[0] = (pixelsPerMeter >>> 24) & 0xff;
        physData[1] = (pixelsPerMeter >>> 16) & 0xff;
        physData[2] = (pixelsPerMeter >>> 8) & 0xff;
        physData[3] = pixelsPerMeter & 0xff;
        // Y pixels per meter (4 bytes, big endian)
        physData[4] = (pixelsPerMeter >>> 24) & 0xff;
        physData[5] = (pixelsPerMeter >>> 16) & 0xff;
        physData[6] = (pixelsPerMeter >>> 8) & 0xff;
        physData[7] = pixelsPerMeter & 0xff;
        // Unit (1 byte: 1 = meters)
        physData[8] = 1;

        // Calculate CRC32 for pHYs chunk
        const physType = new Uint8Array([0x70, 0x48, 0x59, 0x73]); // 'pHYs'
        const crcData = new Uint8Array(physType.length + physData.length);
        crcData.set(physType, 0);
        crcData.set(physData, physType.length);

        const crc32 = calculateCRC32(crcData);
        console.log("Calculated CRC32:", crc32.toString(16));

        // Create complete pHYs chunk
        const physChunk = new Uint8Array(4 + 4 + 9 + 4); // length + type + data + crc

        // Length (9 bytes, big endian)
        physChunk[0] = 0;
        physChunk[1] = 0;
        physChunk[2] = 0;
        physChunk[3] = 9;

        // Type 'pHYs'
        physChunk[4] = 0x70; // 'p'
        physChunk[5] = 0x48; // 'H'
        physChunk[6] = 0x59; // 'Y'
        physChunk[7] = 0x73; // 's'

        // Data
        physChunk.set(physData, 8);

        // CRC
        physChunk[17] = (crc32 >>> 24) & 0xff;
        physChunk[18] = (crc32 >>> 16) & 0xff;
        physChunk[19] = (crc32 >>> 8) & 0xff;
        physChunk[20] = crc32 & 0xff;

        console.log("pHYs chunk created, length:", physChunk.length);

        // Insert pHYs chunk right after IHDR
        const newBytes = new Uint8Array(bytes.length + physChunk.length);
        newBytes.set(bytes.slice(0, pos), 0); // Copy up to after IHDR
        newBytes.set(physChunk, pos); // Insert pHYs chunk
        newBytes.set(bytes.slice(pos), pos + physChunk.length); // Copy rest

        console.log(
          "New PNG size:",
          newBytes.length,
          "original:",
          bytes.length
        );

        // Convert back to base64
        let binaryStr = "";
        const chunkSize = 8192;
        for (let i = 0; i < newBytes.length; i += chunkSize) {
          const chunk = newBytes.slice(i, i + chunkSize);
          binaryStr += String.fromCharCode.apply(null, Array.from(chunk));
        }

        const newBase64 = btoa(binaryStr);
        console.log("New base64 length:", newBase64.length);

        return `data:image/png;base64,${newBase64}`;
      } catch (error) {
        console.error("Error adding DPI metadata:", error);
        return dataUrl;
      }
    };

    // CRC32 calculation (standard PNG CRC)
    const calculateCRC32 = (data: Uint8Array) => {
      const crcTable = new Uint32Array(256);

      // Build CRC table
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[i] = c;
      }

      let crc = 0xffffffff;
      for (let i = 0; i < data.length; i++) {
        crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
      }
      return (crc ^ 0xffffffff) >>> 0;
    };

    // Add 300 DPI metadata to the PNG
    const pngWith300Dpi = addDpiToPng(dataUrl);

    // Create download link
    const link = document.createElement("a");
    link.href = pngWith300Dpi;
    link.download = `TreasureHub-Label-${itemId}-300dpi.png`;

    console.log(
      'Creating 300 DPI PNG: 600x900 pixels = 2"x3" at 300 DPI with embedded metadata'
    );

    document.body.appendChild(link);
    console.log("Clicking download link for 300 DPI PNG with metadata...");
    link.click();
    document.body.removeChild(link);
    console.log("300 DPI PNG with metadata download completed");
  };

  const generatePrintablePDF = async (itemId: string, qrData: string) => {
    console.log("Starting PDF generation", { itemId, qrData });

    try {
      // Import jsPDF
      const { jsPDF } = await import("jspdf");

      // Create a canvas with the same exact content as the PNG label
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 2" wide x 3" tall at 300 DPI = 600px x 900px
      const labelWidth = 600;
      const labelHeight = 900;
      canvas.width = labelWidth;
      canvas.height = labelHeight;

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Set white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, labelWidth, labelHeight);

      // Generate QR code with the same settings as PNG
      const QRCode = (await import("qrcode")).default;
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: "H",
        type: "image/png",
        quality: 1,
        margin: 4,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        width: 400,
      });

      // Load QR code image
      const qrImage = new Image();
      await new Promise((resolve, reject) => {
        qrImage.onload = () => resolve(undefined);
        qrImage.onerror = reject;
        qrImage.src = qrCodeDataURL;
      });

      // Load logos (same as PNG generation)
      const bannerLogo = new Image();
      let useBannerLogo = false;
      try {
        await new Promise((resolve) => {
          bannerLogo.onload = () => {
            useBannerLogo = true;
            resolve(undefined);
          };
          bannerLogo.onerror = () => resolve(undefined);
          bannerLogo.src = "/TreasureHub - Banner - Label.png";
        });
      } catch (error) {
        useBannerLogo = false;
      }

      const centerLogo = new Image();
      await new Promise((resolve, reject) => {
        centerLogo.onload = () => resolve(undefined);
        centerLogo.onerror = reject;
        centerLogo.src = "/TreasureHub - Logo Black.png";
      });

      // Use the EXACT same layout as PNG generation
      const margin = 20;
      const availableWidth = labelWidth - margin * 2;
      const availableHeight = labelHeight - margin * 2;

      // Draw TreasureHub banner at the top
      const bannerY = margin;
      let bannerHeight = 100;

      if (useBannerLogo) {
        const bannerWidth = Math.min(
          availableWidth,
          bannerLogo.width * (bannerHeight / bannerLogo.height)
        );
        const bannerX = (labelWidth - bannerWidth) / 2;
        ctx.drawImage(bannerLogo, bannerX, bannerY, bannerWidth, bannerHeight);
      } else {
        ctx.fillStyle = "#000000";
        ctx.font = "bold 64px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("TreasureHub", labelWidth / 2, bannerY + bannerHeight / 2);
      }

      // Calculate layout (exact same as PNG)
      const spacingBetweenElements = 5;
      const itemIdFontSize = 90;
      ctx.font = `bold ${itemIdFontSize}px monospace`;
      const textMetrics = ctx.measureText(itemId);
      const textWidth = textMetrics.width;
      const textHeight = itemIdFontSize;

      const textPadding = 15;
      const skuBoxWidth = textWidth + textPadding * 2;
      const skuBoxHeight = textHeight + textPadding * 2;
      const skuY = labelHeight - margin - skuBoxHeight;
      const skuBoxX = (labelWidth - skuBoxWidth) / 2;

      const qrStartY = bannerY + bannerHeight + spacingBetweenElements;
      const qrEndY = skuY - spacingBetweenElements;
      const maxQRHeight = qrEndY - qrStartY;
      const maxQRWidth = availableWidth;

      const qrSize = Math.min(maxQRHeight, maxQRWidth);
      const qrX = (labelWidth - qrSize) / 2;
      const qrY = qrStartY + (maxQRHeight - qrSize) / 2;

      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Draw center logo with white background
      const logoSize = Math.min(120, qrSize * 0.25);
      const logoX = (labelWidth - logoSize) / 2;
      const logoY = qrY + (qrSize - logoSize) / 2;

      const excavationSize = logoSize + 20;
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

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(centerLogo, logoX, logoY, logoSize, logoSize);

      // Draw black box for SKU
      ctx.fillStyle = "#000000";
      ctx.fillRect(skuBoxX, skuY, skuBoxWidth, skuBoxHeight);

      // Draw white text inside black box
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${itemIdFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(itemId, labelWidth / 2, skuY + skuBoxHeight / 2);

      // Add thin white margin border (15px margin from edge)
      const borderMargin = 15;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 30; // Thin white border
      ctx.strokeRect(
        borderMargin,
        borderMargin,
        labelWidth - borderMargin * 2,
        labelHeight - borderMargin * 2
      );

      // Convert canvas to image and add to PDF
      const canvasDataURL = canvas.toDataURL("image/png", 1.0);

      // Create PDF with 2" x 3" dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: [2, 3],
        compress: true,
      });

      // Add the canvas image to PDF with small margin to prevent cut-off
      const pdfMargin = 0.05; // 0.05 inch margin
      pdf.addImage(
        canvasDataURL,
        "PNG",
        pdfMargin,
        pdfMargin,
        2 - pdfMargin * 2,
        3 - pdfMargin * 2
      );

      // Save the PDF
      console.log("Saving PDF...");
      pdf.save(`TreasureHub-Label-${itemId}.pdf`);
      console.log("PDF generation completed");
    } catch (error) {
      console.error("Error in PDF generation:", error);
      throw error;
    }
  };

  const handlePrintToPDF = async () => {
    console.log("Print to PDF clicked", { QRCodeComponent, itemId, qrData });

    if (!QRCodeComponent) {
      console.error("QRCodeComponent not loaded");
      alert("QR code component not ready. Please wait and try again.");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Generate PDF using the same content as the label
      await generatePrintablePDF(itemId, qrData);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
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
        <div className="bg-gray-100 rounded-lg px-4 py-3 inline-block">
          <span className="font-mono font-bold text-3xl tracking-wider text-gray-800">
            {itemId}
          </span>
        </div>
      </div>

      {/* Scan Instructions */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">Scan to view listing</p>
      </div>

      {/* TreasureHub Organization Print Buttons */}
      {showPrintButton && isTreasureHubMember && !isLoading && (
        <div className="mt-4 text-center">
          <div className="flex gap-2 justify-center">
            <button
              onClick={handlePrintLabel}
              disabled={isGeneratingLabel || isGeneratingPDF}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isGeneratingLabel || isGeneratingPDF
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
            <button
              onClick={handlePrintToPDF}
              disabled={isGeneratingPDF || isGeneratingLabel}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isGeneratingPDF || isGeneratingLabel
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#D4AF3D] text-white hover:bg-[#c4a235]"
              }`}
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Print to PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
