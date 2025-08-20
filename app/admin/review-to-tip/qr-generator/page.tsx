"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

interface Driver {
  id: string;
  initials: string;
  fullName: string;
  email?: string;
  isActive: boolean;
  totalReviews: number;
  totalBonusEarned: number;
}

export default function QRGeneratorPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch("/api/admin/drivers?activeOnly=true");
      const data = await response.json();

      if (data.success) {
        setDrivers(data.drivers);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeURL = (initials: string) => {
    return `https://treasurehub.club/review/${initials.toLowerCase()}`;
  };

  const downloadQR = (initials: string, fullName: string) => {
    const svg = document.getElementById(`qr-${initials}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = 512;
        canvas.height = 512;
        ctx!.fillStyle = "white";
        ctx!.fillRect(0, 0, 512, 512);
        ctx!.drawImage(img, 0, 0, 512, 512);

        const link = document.createElement("a");
        link.download = `TreasureHub-QR-${initials}-${fullName.replace(
          /\s+/g,
          "_"
        )}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const printCard = (driver: Driver) => {
    const qrUrl = generateQRCodeURL(driver.initials);
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>TreasureHub Driver Card - ${driver.initials}</title>
          <style>
            @page {
              size: 3.5in 2in;
              margin: 0.1in;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background: white;
            }
            .card {
              width: 100%;
              height: 100%;
                             border: 2px solid #d4af3d;
              border-radius: 8px;
              padding: 12px;
              display: flex;
              align-items: center;
              background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
            }
            .content {
              flex: 1;
              margin-right: 12px;
            }
            .logo {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 4px;
            }
            .message {
              font-size: 11px;
              line-height: 1.3;
              color: #374151;
              margin-bottom: 6px;
            }
            .highlight {
              font-size: 10px;
              font-weight: bold;
              color: #1e40af;
              background: #fef3c7;
              padding: 2px 4px;
              border-radius: 3px;
              display: inline-block;
            }
            .driver {
              font-size: 9px;
              color: #6b7280;
              margin-top: 4px;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .qr-code {
              width: 80px;
              height: 80px;
            }
            .qr-label {
              font-size: 7px;
              color: #6b7280;
              margin-top: 2px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="content">
              <div class="logo">TreasureHub</div>
              <div class="message">
                "If you feel that we have exceeded your expectations, we don't take tips.
              </div>
                             <div class="message">
                 Your honest feedback on Google Reviews helps us continue providing exceptional service."
               </div>
              <div class="highlight">Scan to leave a review!</div>
              <div class="driver">Driver: ${driver.fullName} (${driver.initials})</div>
            </div>
            <div class="qr-container">
              <div id="qr-print" class="qr-code"></div>
              <div class="qr-label">Scan with camera</div>
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.getElementById('qr-print'), '${qrUrl}', {
              width: 80,
              margin: 1,
              color: {
                dark: '#1e40af',
                light: '#ffffff'
              }
            }, function(error) {
              if (error) console.error(error);
              setTimeout(() => window.print(), 500);
            });
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading QR Generator...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">QR Code Generator</h1>
        <p className="text-gray-600">
          Generate QR codes for driver review cards
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
          <CardDescription>
            Generate and print QR codes for your delivery drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <div className="bg-treasure-100 text-treasure-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <div className="font-semibold">Generate QR Codes</div>
                <div className="text-gray-600">
                  Each driver gets a unique QR code linking to
                  treasurehub.club/review/[initials]
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-treasure-100 text-treasure-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <div className="font-semibold">Print Cards</div>
                <div className="text-gray-600">
                  Print business card-sized cards (3.5" x 2") with the QR code
                  and message
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-treasure-100 text-treasure-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <div className="font-semibold">Track Results</div>
                <div className="text-gray-600">
                  Monitor scans and reviews in the admin dashboard
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{driver.fullName}</CardTitle>
                <Badge variant={driver.isActive ? "default" : "secondary"}>
                  {driver.initials}
                </Badge>
              </div>
              <CardDescription>
                {driver.totalReviews} reviews • $
                {driver.totalBonusEarned.toFixed(2)} earned
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border">
                  <QRCodeSVG
                    id={`qr-${driver.initials}`}
                    value={generateQRCodeURL(driver.initials)}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#d4af3d"
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* URL Display */}
              <div className="text-center">
                <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                  treasurehub.club/review/{driver.initials.toLowerCase()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadQR(driver.initials, driver.fullName)}
                  className="flex-1"
                >
                  Download PNG
                </Button>
                <Button
                  size="sm"
                  onClick={() => printCard(driver)}
                  className="flex-1"
                >
                  Print Card
                </Button>
              </div>

              {/* Preview Card */}
              <div className="border rounded-lg p-3 bg-gradient-to-br from-treasure-50 to-treasure-100 text-xs">
                <div className="font-bold text-treasure-800 mb-1">
                  TreasureHub
                </div>
                <div className="text-gray-700 mb-2">
                  "Your honest feedback on Google Reviews helps TreasureHub
                  recognize exceptional service."
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Driver: {driver.initials}
                  </span>
                  <div className="w-8 h-8 bg-white border rounded flex items-center justify-center">
                    <div className="w-6 h-6 bg-treasure-600 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Drivers Message */}
      {drivers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">No active drivers found</div>
            <Button asChild>
              <a href="/admin/review-to-tip">Add Drivers</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
