"use client";

import React, { useState, useEffect } from "react";
import CustomQRCode from "../../components/CustomQRCode";
import CheckoutAddressModal from "../../components/CheckoutAddressModal";
import {
  Calendar,
  Clock,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Phone,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Printer,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";

interface Order {
  id: string;
  listingId: string;
  listing: {
    itemId: string;
    title: string;
    photos: string[];
    condition: string;
    conditionNotes?: string;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
    mobilePhone?: string;
  };
  seller: {
    id: string;
    name: string;
  };
  amount: number;
  status: string;
  shippingAddress: any; // Could be string or object with streetAddress, city, state, zipCode, country
  scheduledPickupTime?: string;
  pickupTimeSlot?: string;
  deliveryDriverId?: string;
  estimatedDeliveryTime?: string;
  deliveryNotes?: string;
  deliveryAttempts: number;
  lastDeliveryAttempt?: string;
  createdAt: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
}

interface DeliveryStats {
  pendingScheduling: number;
  scheduled: number;
  enRoute: number;
  delivered: number;
  finalized: number;
  total: number;
}

const statusConfig = {
  ALL: {
    label: "All Orders",
    color: "bg-yellow-100 text-yellow-800", // TreasureHub gold theme
    icon: Package,
    description: "All orders in the system",
  },
  PAID: {
    label: "Paid",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
    description: "Payment confirmed, ready for scheduling",
  },
  PENDING_SCHEDULING: {
    label: "Pending Scheduling",
    color: "bg-orange-100 text-orange-800",
    icon: Calendar,
    description: "Awaiting delivery schedule assignment",
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "bg-purple-100 text-purple-800",
    icon: Clock,
    description: "Pickup and delivery time scheduled",
  },
  EN_ROUTE: {
    label: "En Route",
    color: "bg-indigo-100 text-indigo-800",
    icon: Truck,
    description: "Out for delivery",
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Successfully delivered to customer",
  },
  FINALIZED: {
    label: "Finalized",
    color: "bg-gray-100 text-gray-800",
    icon: CheckCircle,
    description: "Orders finalized after 24+ hours post-delivery",
  },
};

export default function DeliverySchedulerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({
    pendingScheduling: 0,
    scheduled: 0,
    enRoute: 0,
    delivered: 0,
    finalized: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPickTicketModal, setShowPickTicketModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [completedPickTickets, setCompletedPickTickets] = useState<Set<string>>(
    new Set()
  );
  const [assignedSlots, setAssignedSlots] = useState<Set<string>>(new Set());
  const [waitingForCustomer, setWaitingForCustomer] = useState<Set<string>>(
    new Set()
  );
  const [showAssignSlotModal, setShowAssignSlotModal] = useState(false);
  const [orderSlotSelections, setOrderSlotSelections] = useState<{
    [orderId: string]: Array<{ date: string; window: string }>;
  }>({});
  const [zipCodeValidations, setZipCodeValidations] = useState<{
    [orderId: string]: { valid: boolean | null; loading: boolean };
  }>({});

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdown]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/orders/delivery-scheduler");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        calculateStats(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orderList: Order[]) => {
    // Calculate finalized orders (delivered + 24 hours ago)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const finalizedOrders = orderList.filter((o) => {
      if (o.status === "DELIVERED" && o.statusUpdatedAt) {
        const deliveryDate = new Date(o.statusUpdatedAt);
        return deliveryDate <= twentyFourHoursAgo;
      }
      return o.status === "FINALIZED";
    });

    const stats = {
      pendingScheduling: orderList.filter(
        (o) => o.status === "PENDING_SCHEDULING"
      ).length,
      scheduled: orderList.filter((o) => o.status === "SCHEDULED").length,
      enRoute: orderList.filter((o) => o.status === "EN_ROUTE").length,
      delivered: orderList.filter(
        (o) =>
          o.status === "DELIVERED" &&
          (!o.statusUpdatedAt ||
            new Date(o.statusUpdatedAt) > twentyFourHoursAgo)
      ).length,
      finalized: finalizedOrders.length,
      total: orderList.length,
    };
    setStats(stats);
  };

  const filterOrders = () => {
    let filtered = orders;

    if (selectedStatus !== "ALL") {
      if (selectedStatus === "FINALIZED") {
        // Show orders that are delivered + 24 hours ago, or explicitly finalized
        const now = new Date();
        const twentyFourHoursAgo = new Date(
          now.getTime() - 24 * 60 * 60 * 1000
        );

        filtered = filtered.filter((order) => {
          if (order.status === "DELIVERED" && order.statusUpdatedAt) {
            const deliveryDate = new Date(order.statusUpdatedAt);
            return deliveryDate <= twentyFourHoursAgo;
          }
          return order.status === "FINALIZED";
        });
      } else if (selectedStatus === "PAID") {
        // Only show orders with PAID status
        filtered = filtered.filter((order) => order.status === "PAID");
      } else {
        // For DELIVERED status, exclude orders that should be finalized
        if (selectedStatus === "DELIVERED") {
          const now = new Date();
          const twentyFourHoursAgo = new Date(
            now.getTime() - 24 * 60 * 60 * 1000
          );
          filtered = filtered.filter(
            (order) =>
              order.status === "DELIVERED" &&
              (!order.statusUpdatedAt ||
                new Date(order.statusUpdatedAt) > twentyFourHoursAgo)
          );
        } else {
          filtered = filtered.filter(
            (order) => order.status === selectedStatus
          );
        }
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.listing.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.listing.itemId
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.buyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh the data
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleEditAddress = (order: Order) => {
    setEditingOrder(order);
    setShowAddressModal(true);
  };

  const handleAddressUpdate = async (addressData: any) => {
    if (!editingOrder) return;

    try {
      const response = await fetch(
        `/api/admin/orders/${editingOrder.id}/address`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shippingAddress: addressData }),
        }
      );

      if (response.ok) {
        fetchOrders(); // Refresh the data
        setShowAddressModal(false);
        setEditingOrder(null);
      } else {
        throw new Error("Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      alert("Failed to update address. Please try again.");
    }
  };

  const handlePickTicketComplete = (orderId: string) => {
    setCompletedPickTickets((prev) => new Set([...prev, orderId]));
    setShowPickTicketModal(false);
    setSelectedOrder(null);
  };

  const toggleDropdown = (orderId: string) => {
    setOpenDropdown(openDropdown === orderId ? null : orderId);
  };

  const handleAssignSlot = (order: Order) => {
    setSelectedOrder(order);
    setShowAssignSlotModal(true);
    setOpenDropdown(null);
  };

  const handleSlotAssignment = (
    orderId: string,
    selectedSlots?: Array<{ date: string; window: string }>
  ) => {
    setAssignedSlots((prev) => new Set([...prev, orderId]));
    setWaitingForCustomer((prev) => new Set([...prev, orderId]));

    // Store the slot selections for this order
    if (selectedSlots) {
      setOrderSlotSelections((prev) => ({
        ...prev,
        [orderId]: selectedSlots,
      }));
    }

    setShowAssignSlotModal(false);
    setSelectedOrder(null);
  };

  const handleResendLink = async (orderId: string) => {
    try {
      // TODO: Implement resend functionality
      alert("Resend link functionality will be implemented");
    } catch (error) {
      console.error("Error resending link:", error);
      alert("Failed to resend link. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = [
      "PAID",
      "PENDING_SCHEDULING",
      "SCHEDULED",
      "EN_ROUTE",
      "DELIVERED",
      "FINALIZED",
    ];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1
      ? statusFlow[currentIndex + 1]
      : null;
  };

  const getPreviousStatus = (currentStatus: string) => {
    const statusFlow = [
      "PAID",
      "PENDING_SCHEDULING",
      "SCHEDULED",
      "EN_ROUTE",
      "DELIVERED",
      "FINALIZED",
    ];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
  };

  const getStatusBorderColor = (status: string) => {
    const borderColorMap: { [key: string]: string } = {
      PAID: "border-blue-300",
      PENDING_SCHEDULING: "border-orange-300",
      SCHEDULED: "border-purple-300",
      EN_ROUTE: "border-indigo-300",
      DELIVERED: "border-green-300",
      FINALIZED: "border-gray-300",
    };
    return borderColorMap[status] || "border-gray-200";
  };

  const handlePrintLabel = async (itemId: string) => {
    try {
      // Generate the full URL for the QR code
      const qrData = `${window.location.origin}/list-item/${itemId}`;

      // Generate label using the same logic as CustomQRCode component
      await generatePrintableLabel(itemId, qrData);
    } catch (error) {
      console.error("Error generating print label:", error);
      alert("Failed to generate print label. Please try again.");
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

    // Generate QR code
    console.log("Generating QR code...");
    const QRCode = await import("qrcode");
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H", // High error correction level to allow for logo overlay
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
    await new Promise<void>((resolve, reject) => {
      qrImage.onload = () => {
        console.log("QR code image loaded");
        resolve();
      };
      qrImage.onerror = (error) => {
        console.error("Failed to load QR code image", error);
        reject(error);
      };
      qrImage.src = qrCodeDataURL;
    });

    // Load TreasureHub banner logo for header
    console.log("Loading TreasureHub banner logo...");
    const bannerLogo = new Image();
    let useBannerLogo = false;
    try {
      await new Promise<void>((resolve, reject) => {
        bannerLogo.onload = () => {
          console.log("TreasureHub banner logo loaded");
          useBannerLogo = true;
          resolve();
        };
        bannerLogo.onerror = (error) => {
          console.warn("Banner logo not found, will use text fallback");
          resolve(); // Don't reject, just use fallback
        };
        bannerLogo.src = "/TreasureHub - Banner - Label.png";
      });
    } catch (error) {
      console.warn("Banner logo failed to load, using text fallback");
    }

    // Load center logo for QR code overlay
    console.log("Loading center logo...");
    const centerLogo = new Image();
    let useCenterLogo = false;
    try {
      await new Promise<void>((resolve, reject) => {
        centerLogo.onload = () => {
          console.log("Center logo loaded");
          useCenterLogo = true;
          resolve();
        };
        centerLogo.onerror = (error) => {
          console.warn("Center logo not found, will skip overlay");
          resolve(); // Don't reject, just skip overlay
        };
        centerLogo.src = "/TreasureHub - Logo Black.png";
      });
    } catch (error) {
      console.warn("Center logo failed to load, skipping overlay");
    }

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

    // Add very bold black border around entire label
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 12; // Even much bolder border (2x previous)
    ctx.strokeRect(6, 6, labelWidth - 12, labelHeight - 12);

    console.log("Canvas drawing complete, converting to blob...");

    // Convert canvas to blob and trigger download
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to generate blob from canvas");
        return;
      }

      console.log("Blob generated, creating download...");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `treasurehub-label-${itemId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("Download triggered");
    }, "image/png");
  };

  // Validate zip code for delivery
  const validateZipCode = async (orderId: string, zipCode: string) => {
    if (!zipCode) return;

    // Set loading state
    setZipCodeValidations((prev) => ({
      ...prev,
      [orderId]: { valid: null, loading: true },
    }));

    try {
      const response = await fetch("/api/zipcodes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zipCode }),
      });

      const data = await response.json();

      // Update validation state
      setZipCodeValidations((prev) => ({
        ...prev,
        [orderId]: { valid: data.isValid, loading: false },
      }));
    } catch (error) {
      console.error("Error validating zip code:", error);
      setZipCodeValidations((prev) => ({
        ...prev,
        [orderId]: { valid: false, loading: false },
      }));
    }
  };

  // Extract zip code from shipping address
  const extractZipCode = (shippingAddress: any) => {
    if (!shippingAddress) return null;

    if (typeof shippingAddress === "string") {
      // Try to extract zip code from string address
      const zipMatch = shippingAddress.match(/\b\d{5}(-\d{4})?\b/);
      return zipMatch ? zipMatch[0] : null;
    }

    if (typeof shippingAddress === "object") {
      return shippingAddress.zipCode || shippingAddress.postalCode;
    }

    return null;
  };

  const StatusCard = ({
    status,
    count,
    onClick,
  }: {
    status: string;
    count: number;
    onClick: () => void;
  }) => {
    const config = statusConfig[status as keyof typeof statusConfig];

    // Handle undefined config
    if (!config) {
      console.error(`StatusCard: No config found for status: ${status}`);
      return (
        <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50">
          <div className="text-red-600">Invalid Status: {status}</div>
        </div>
      );
    }

    const Icon = config.icon;
    const borderColor = getStatusBorderColor(status);

    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
          selectedStatus === status
            ? "border-blue-500 bg-blue-50"
            : `${borderColor} hover:shadow-lg`
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">
              {config.label}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{count}</div>
        </div>
      </div>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const config = statusConfig[order.status as keyof typeof statusConfig];

    // Handle undefined config
    if (!config) {
      console.error(`OrderCard: No config found for status: ${order.status}`);
      return (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-red-600">Invalid Status: {order.status}</div>
          <div className="text-sm text-gray-600">Order ID: {order.id}</div>
        </div>
      );
    }

    const Icon = config.icon;
    const nextStatus = getNextStatus(order.status);
    const borderColor = getStatusBorderColor(order.status);

    return (
      <div
        className={`bg-white rounded-lg border-2 ${borderColor} p-4 hover:shadow-md transition-shadow`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {(() => {
                const heroImage = getHeroImage(order.listing.photos);

                return heroImage ? (
                  <img
                    src={heroImage}
                    alt={order.listing.title}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      console.error(
                        `Failed to load image for order ${order.id}:`,
                        heroImage
                      );
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <Package className="h-6 w-6 text-gray-400" />
                );
              })()}
            </div>
            <div>
              <a
                href={`/list-item/${order.listing.itemId}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                target="_blank"
                rel="noopener noreferrer"
              >
                {order.listing.title}
              </a>
              <p className="text-sm text-gray-500">
                ID: {order.listing.itemId}
              </p>
              <p className="text-sm text-gray-500">
                Confirmation: #{order.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-400">Order: {order.id}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              ${order.amount.toFixed(2)}
            </div>
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <div className="flex items-center gap-1 text-gray-500 mb-1">
              <User className="h-3 w-3" />
              Customer
            </div>
            <div className="font-medium">{order.buyer.name}</div>
            <div className="text-gray-500">{order.buyer.email}</div>
            {order.buyer.mobilePhone && (
              <div className="flex items-center gap-1 text-gray-500">
                <Phone className="h-3 w-3" />
                {order.buyer.mobilePhone}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1 text-gray-500 mb-1">
              <MapPin className="h-3 w-3" />
              Delivery Address
            </div>
            {order.shippingAddress ? (
              <div className="text-sm">
                {typeof order.shippingAddress === "string" ? (
                  // Handle case where address is stored as a string
                  <div>{order.shippingAddress}</div>
                ) : (
                  // Handle case where address is stored as an object
                  <>
                    {order.shippingAddress.streetAddress && (
                      <div>{order.shippingAddress.streetAddress}</div>
                    )}
                    {(order.shippingAddress.city ||
                      order.shippingAddress.state ||
                      order.shippingAddress.zipCode) && (
                      <div>
                        {order.shippingAddress.city &&
                          `${order.shippingAddress.city}`}
                        {order.shippingAddress.city &&
                          order.shippingAddress.state &&
                          ", "}
                        {order.shippingAddress.state &&
                          `${order.shippingAddress.state}`}
                        {(order.shippingAddress.city ||
                          order.shippingAddress.state) &&
                          order.shippingAddress.zipCode &&
                          " "}
                        {order.shippingAddress.zipCode &&
                          `${order.shippingAddress.zipCode}`}
                      </div>
                    )}
                    {order.shippingAddress.country &&
                      order.shippingAddress.country !== "US" && (
                        <div>{order.shippingAddress.country}</div>
                      )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                No delivery address provided
              </div>
            )}
            <div className="mt-1">
              <ZipCodeValidation order={order} />
            </div>
          </div>
        </div>

        {order.scheduledPickupTime && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Calendar className="h-3 w-3" />
              Scheduled Pickup
            </div>
            <div className="font-medium">
              {formatDate(order.scheduledPickupTime)}
            </div>
            {order.pickupTimeSlot && (
              <div className="text-gray-500">Slot: {order.pickupTimeSlot}</div>
            )}
          </div>
        )}

        {order.estimatedDeliveryTime && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Truck className="h-3 w-3" />
              Estimated Delivery
            </div>
            <div className="font-medium">
              {formatDate(order.estimatedDeliveryTime)}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Created: {formatDate(order.createdAt)}
            {order.statusUpdatedAt && (
              <> • Updated: {formatDate(order.statusUpdatedAt)}</>
            )}
          </div>
          <div className="flex gap-2">
            {/* Different layout for PAID orders */}
            {order.status === "PAID" ? (
              <>
                {/* Main Pick Ticket Action */}
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowPickTicketModal(true);
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                    completedPickTickets.has(order.id)
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Printer className="h-4 w-4" />
                  {completedPickTickets.has(order.id)
                    ? "Pick Ticket ✓"
                    : "Generate Pick Ticket"}
                </button>

                {/* More Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(order.id)}
                    className="inline-flex items-center gap-1 px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openDropdown === order.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          handlePrintLabel(order.listing.itemId);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Printer className="h-3 w-3" />
                        Print Label
                      </button>
                      <button
                        onClick={() => {
                          handleEditAddress(order);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="h-3 w-3" />
                        Edit Address
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : order.status === "PENDING_SCHEDULING" ? (
              <>
                {/* Main Assign Slot Action */}
                <button
                  onClick={() => handleAssignSlot(order)}
                  className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                    waitingForCustomer.has(order.id)
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer"
                      : assignedSlots.has(order.id)
                      ? "bg-green-600 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {waitingForCustomer.has(order.id)
                    ? "Waiting for Customer"
                    : assignedSlots.has(order.id)
                    ? "Slots Assigned ✓"
                    : "Assign Slot"}
                </button>

                {/* Secondary Resend Link Action */}
                {assignedSlots.has(order.id) && (
                  <button
                    onClick={() => handleResendLink(order.id)}
                    className="inline-flex items-center gap-1 px-2 py-2 text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 rounded transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Resend Link
                  </button>
                )}

                {/* More Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(order.id)}
                    className="inline-flex items-center gap-1 px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openDropdown === order.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowPickTicketModal(true);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Printer className="h-3 w-3" />
                        Pick Ticket
                      </button>
                      <button
                        onClick={() => {
                          handlePrintLabel(order.listing.itemId);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Printer className="h-3 w-3" />
                        Print Label
                      </button>
                      <button
                        onClick={() => {
                          handleEditAddress(order);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="h-3 w-3" />
                        Edit Address
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Original layout for other statuses */
              <>
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  View
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowPickTicketModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors"
                >
                  <Printer className="h-3 w-3" />
                  Pick Ticket
                </button>
                <button
                  onClick={() => handlePrintLabel(order.listing.itemId)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                >
                  <Printer className="h-3 w-3" />
                  Print Label
                </button>
                <button
                  onClick={() => handleEditAddress(order)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  <Edit className="h-3 w-3" />
                  Edit Address
                </button>
              </>
            )}

            {/* Navigation buttons */}
            {(() => {
              const previousStatus = getPreviousStatus(order.status);
              if (!previousStatus) return null;

              const prevConfig =
                statusConfig[previousStatus as keyof typeof statusConfig];
              return (
                <button
                  onClick={() => updateOrderStatus(order.id, previousStatus)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  title={`Back to ${prevConfig?.label || previousStatus}`}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to {prevConfig?.label || previousStatus}
                </button>
              );
            })()}

            {(() => {
              const nextStatus = getNextStatus(order.status);
              if (!nextStatus) return null;

              // Block progression from PAID to PENDING_SCHEDULING unless pick ticket is completed
              let isBlocked =
                order.status === "PAID" && !completedPickTickets.has(order.id);
              let blockMessage = "Complete Pick Ticket first";

              // Block progression from PENDING_SCHEDULING to SCHEDULED unless customer has responded
              if (
                order.status === "PENDING_SCHEDULING" &&
                waitingForCustomer.has(order.id)
              ) {
                isBlocked = true;
                blockMessage = "Waiting for customer to select time slot";
              }

              const nextConfig =
                statusConfig[nextStatus as keyof typeof statusConfig];
              return (
                <button
                  onClick={() => {
                    if (isBlocked) {
                      alert(
                        order.status === "PAID"
                          ? "Please complete the Pick Ticket first before moving to Pending Scheduling."
                          : "Please wait for customer to select a time slot before proceeding."
                      );
                      return;
                    }
                    updateOrderStatus(order.id, nextStatus);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    isBlocked
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                  title={
                    isBlocked
                      ? blockMessage
                      : `Move to ${nextConfig?.label || nextStatus}`
                  }
                  disabled={isBlocked}
                >
                  Move to {nextConfig?.label || nextStatus}
                  <ChevronRight className="h-3 w-3" />
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to extract hero image from photos object
  const getHeroImage = (photos: any) => {
    let photosData = photos;

    // If photos is a string (JSON), try to parse it
    if (typeof photosData === "string") {
      try {
        photosData = JSON.parse(photosData);
      } catch (e) {
        photosData = {};
      }
    }

    // Extract hero image from the photos object structure
    if (photosData && typeof photosData === "object") {
      return (
        photosData.hero ||
        photosData.staged ||
        photosData.back ||
        photosData.proof ||
        (photosData.additional && photosData.additional[0])
      );
    }

    return null;
  };

  // Zip Code Validation Component
  const ZipCodeValidation = ({ order }: { order: Order }) => {
    const zipCode = extractZipCode(order.shippingAddress);
    const validation = zipCodeValidations[order.id];

    useEffect(() => {
      if (zipCode && !validation) {
        validateZipCode(order.id, zipCode);
      }
    }, [zipCode, order.id, validation]);

    if (!zipCode) {
      return (
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>No Zip Code</span>
        </div>
      );
    }

    if (validation?.loading) {
      return (
        <div className="flex items-center gap-1 text-blue-600 text-xs">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Checking...</span>
        </div>
      );
    }

    if (validation?.valid === true) {
      return (
        <div className="flex items-center gap-1 text-green-600 text-xs">
          <CheckCircle className="h-3 w-3" />
          <span>Valid for Delivery</span>
        </div>
      );
    }

    if (validation?.valid === false) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>Not in Service Area</span>
        </div>
      );
    }

    return null;
  };

  // PickTicketModal Component
  const PickTicketModal = ({
    order,
    isOpen,
    onClose,
    onComplete,
  }: {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    onComplete?: (orderId: string) => void;
  }) => {
    if (!order || !isOpen) return null;

    const [warehouseInstructions, setWarehouseInstructions] = useState({
      verifyCondition: false,
      checkDamage: false,
      photographDifferences: false,
      packageSecurely: false,
      updateStatus: false,
    });

    const allInstructionsCompleted = Object.values(warehouseInstructions).every(
      Boolean
    );

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const orderTime = new Date(order.createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const orderShortId = order.id.slice(-8).toUpperCase();
    const heroImage = getHeroImage(order.listing.photos);

    const handleInstructionChange = (
      key: keyof typeof warehouseInstructions
    ) => {
      setWarehouseInstructions((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    };

    const handleComplete = () => {
      if (allInstructionsCompleted && onComplete) {
        onComplete(order.id);
      }
    };

    const generatePDF = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { jsPDF } = await import("jspdf");
        const QRCode = await import("qrcode");
        const doc = new jsPDF();

        // Set up document properties
        doc.setProperties({
          title: `Pick Ticket - ${orderShortId}`,
          subject: "Warehouse Pick Ticket",
          author: "TreasureHub",
          creator: "TreasureHub Warehouse System",
        });

        // Add header layout with order number and date on first line
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Order: ${orderShortId}`, 20, 20);
        doc.text(`Date: ${orderDate}`, 190, 20, { align: "right" });

        // Add warehouse pick ticket title on second line
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("WAREHOUSE PICK TICKET", 105, 35, { align: "center" });

        // Add a line under the header
        doc.setLineWidth(2);
        doc.setDrawColor(0, 0, 0); // Black
        doc.line(20, 45, 190, 45);

        // Add section headers and content
        let yPosition = 55;

        // Item Reference and Item Details Section (side by side)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0); // Black text
        doc.text("ITEM REFERENCE", 20, yPosition);
        doc.text("ITEM TO PICK", 110, yPosition);

        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0); // Black for underlines
        doc.line(20, yPosition + 2, 80, yPosition + 2); // Left underline
        doc.line(110, yPosition + 2, 190, yPosition + 2); // Right underline
        yPosition += 15;

        // Generate QR Label using same method as CustomQRCode component
        try {
          const qrData = `${
            typeof window !== "undefined"
              ? window.location.origin
              : "https://treasurehub.store"
          }/list-item/${order.listing.itemId}`;

          // Generate the complete label as done in CustomQRCode component
          const labelCanvas = document.createElement("canvas");
          const labelCtx = labelCanvas.getContext("2d");

          // Use smaller dimensions for PDF (scaled down from 600x900)
          const labelWidth = 200;
          const labelHeight = 300;
          labelCanvas.width = labelWidth;
          labelCanvas.height = labelHeight;

          if (!labelCtx) {
            throw new Error("Could not get canvas context");
          }

          // Set white background
          labelCtx.fillStyle = "#ffffff";
          labelCtx.fillRect(0, 0, labelWidth, labelHeight);

          // Generate QR code with same settings as CustomQRCode
          const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: "H",
            margin: 4,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
            width: 133, // Scaled down proportionally
          });

          // Load QR code image
          const qrImage = new Image();
          await new Promise((resolve, reject) => {
            qrImage.onload = () => resolve(undefined);
            qrImage.onerror = reject;
            qrImage.src = qrCodeDataURL;
          });

          // Load TreasureHub banner logo
          const bannerLogo = new Image();
          let useBannerLogo = false;
          try {
            await new Promise((resolve, reject) => {
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

          // Load center logo for QR overlay
          const centerLogo = new Image();
          let useCenterLogo = false;
          try {
            await new Promise((resolve, reject) => {
              centerLogo.onload = () => {
                useCenterLogo = true;
                resolve(undefined);
              };
              centerLogo.onerror = () => resolve(undefined);
              centerLogo.src = "/TreasureHub - Logo Black.png";
            });
          } catch (error) {
            useCenterLogo = false;
          }

          // Calculate layout (proportionally scaled from original)
          const margin = 7;
          const availableWidth = labelWidth - margin * 2;
          const bannerY = margin;
          const bannerHeight = 33; // Scaled down from 100

          // Draw banner
          if (useBannerLogo) {
            const bannerWidth = Math.min(
              availableWidth,
              bannerLogo.width * (bannerHeight / bannerLogo.height)
            );
            const bannerX = (labelWidth - bannerWidth) / 2;
            labelCtx.drawImage(
              bannerLogo,
              bannerX,
              bannerY,
              bannerWidth,
              bannerHeight
            );
          } else {
            labelCtx.fillStyle = "#000000";
            labelCtx.font = "bold 21px Arial";
            labelCtx.textAlign = "center";
            labelCtx.textBaseline = "middle";
            labelCtx.fillText(
              "TreasureHub",
              labelWidth / 2,
              bannerY + bannerHeight / 2
            );
          }

          // Calculate QR code position
          const itemIdFontSize = 30;
          labelCtx.font = `bold ${itemIdFontSize}px monospace`;
          const textMetrics = labelCtx.measureText(order.listing.itemId);
          const textWidth = textMetrics.width;
          const textHeight = itemIdFontSize;
          const textPadding = 5;
          const skuBoxHeight = textHeight + textPadding * 2;
          const skuY = labelHeight - margin - skuBoxHeight;

          const qrStartY = bannerY + bannerHeight + 2;
          const qrEndY = skuY - 2;
          const maxQRHeight = qrEndY - qrStartY;
          const qrSize = Math.min(maxQRHeight, availableWidth);
          const qrX = (labelWidth - qrSize) / 2;
          const qrY = qrStartY + (maxQRHeight - qrSize) / 2;

          // Draw QR code
          labelCtx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

          // Draw center logo overlay
          if (useCenterLogo) {
            const logoSize = Math.min(40, qrSize * 0.25);
            const logoX = (labelWidth - logoSize) / 2;
            const logoY = qrY + (qrSize - logoSize) / 2;

            // White background circle
            const excavationSize = logoSize + 7;
            labelCtx.fillStyle = "#ffffff";
            labelCtx.beginPath();
            labelCtx.arc(
              logoX + logoSize / 2,
              logoY + logoSize / 2,
              excavationSize / 2,
              0,
              2 * Math.PI
            );
            labelCtx.fill();

            // Draw logo
            labelCtx.drawImage(centerLogo, logoX, logoY, logoSize, logoSize);
          }

          // Draw Item ID in black box
          const skuBoxWidth = textWidth + textPadding * 2;
          const skuBoxX = (labelWidth - skuBoxWidth) / 2;

          labelCtx.fillStyle = "#000000";
          labelCtx.fillRect(skuBoxX, skuY, skuBoxWidth, skuBoxHeight);

          labelCtx.fillStyle = "#ffffff";
          labelCtx.textAlign = "center";
          labelCtx.textBaseline = "middle";
          labelCtx.fillText(
            order.listing.itemId,
            labelWidth / 2,
            skuY + skuBoxHeight / 2
          );

          // Convert label to data URL and add to PDF (left aligned)
          const labelDataURL = labelCanvas.toDataURL("image/png");
          doc.addImage(labelDataURL, "PNG", 20, yPosition - 5, 40, 60);

          // Add item details to the right of QR code
          const itemDetailsX = 110;
          let itemDetailsY = yPosition;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);

          // Split long titles to fit on page
          const titleLines = doc.splitTextToSize(
            `Title: ${order.listing.title}`,
            80
          );
          doc.text(titleLines, itemDetailsX, itemDetailsY);
          itemDetailsY += titleLines.length * 6 + 5;

          doc.text(
            `Condition: ${order.listing.condition}`,
            itemDetailsX,
            itemDetailsY
          );
          itemDetailsY += 8;
          doc.text("Quantity: 1", itemDetailsX, itemDetailsY);
        } catch (qrError) {
          console.warn("Failed to generate QR label:", qrError);
          doc.text("QR Code: [See listing details online]", 20, yPosition);
        }

        yPosition += 65; // More space to account for QR code height

        // Warehouse Instructions with checkboxes
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0); // Black text
        doc.text("WAREHOUSE INSTRUCTIONS", 20, yPosition);
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0); // Black for underlines
        doc.line(20, yPosition + 2, 140, yPosition + 2);
        yPosition += 15;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const instructions = [
          "Verify item condition matches description",
          "Check for any damage during pick",
          "Photograph item if condition differs",
          "Package securely for delivery",
          "Update order status after completion",
        ];

        instructions.forEach((instruction) => {
          // Draw checkbox
          doc.setLineWidth(0.5);
          doc.setDrawColor(0, 0, 0); // Black for checkboxes
          doc.rect(20, yPosition - 3, 4, 4); // Empty checkbox

          // Add instruction text
          doc.setTextColor(0, 0, 0); // Black text
          doc.text(instruction, 28, yPosition);
          yPosition += 8;
        });

        yPosition += 15;

        // Delivery Information
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0); // Black text
        doc.text("DELIVERY ADDRESS & CUSTOMER", 20, yPosition);
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0); // Black for underlines
        doc.line(20, yPosition + 2, 190, yPosition + 2);
        yPosition += 15;

        // Split into two columns
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Delivery To:", 20, yPosition);
        doc.text("Customer Contact:", 110, yPosition);
        yPosition += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        // Delivery Address (left column)
        let leftColumnY = yPosition;
        if (order.shippingAddress) {
          if (typeof order.shippingAddress === "string") {
            const lines = doc.splitTextToSize(order.shippingAddress, 80);
            doc.text(lines, 20, leftColumnY);
            leftColumnY += lines.length * 6;
          } else {
            if (order.shippingAddress.streetAddress) {
              const streetLines = doc.splitTextToSize(
                order.shippingAddress.streetAddress,
                80
              );
              doc.text(streetLines, 20, leftColumnY);
              leftColumnY += streetLines.length * 6;
            }
            if (order.shippingAddress.apartment) {
              doc.text(order.shippingAddress.apartment, 20, leftColumnY);
              leftColumnY += 6;
            }

            let cityStateZip = "";
            if (order.shippingAddress.city)
              cityStateZip += order.shippingAddress.city;
            if (order.shippingAddress.state) {
              cityStateZip +=
                (cityStateZip ? ", " : "") + order.shippingAddress.state;
            }
            if (order.shippingAddress.zipCode) {
              cityStateZip +=
                (cityStateZip ? " " : "") + order.shippingAddress.zipCode;
            }

            if (cityStateZip) {
              doc.text(cityStateZip, 20, leftColumnY);
              leftColumnY += 6;
            }
          }
        } else {
          doc.setFont("helvetica", "bold");
          doc.text("⚠️ NO ADDRESS PROVIDED", 20, leftColumnY);
          doc.setFont("helvetica", "normal");
          leftColumnY += 6;
        }

        // Customer Information (right column)
        let rightColumnY = yPosition;
        const nameLines = doc.splitTextToSize(`Name: ${order.buyer.name}`, 80);
        doc.text(nameLines, 110, rightColumnY);
        rightColumnY += nameLines.length * 6;

        const emailLines = doc.splitTextToSize(
          `Email: ${order.buyer.email}`,
          80
        );
        doc.text(emailLines, 110, rightColumnY);
        rightColumnY += emailLines.length * 6;

        if (order.buyer.mobilePhone) {
          doc.text(`Phone: ${order.buyer.mobilePhone}`, 110, rightColumnY);
          rightColumnY += 6;
        }

        // Move yPosition to after both columns
        yPosition = Math.max(leftColumnY, rightColumnY) + 20;

        // Add footer
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0); // Black text
        doc.setDrawColor(0, 0, 0); // Black lines
        const footerY = Math.max(yPosition, 275);
        doc.line(20, footerY - 5, 190, footerY - 5);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, footerY);
        doc.text("TreasureHub Warehouse Operations", 110, footerY);

        // Save the PDF
        doc.save(`pick-ticket-${orderShortId}.pdf`);
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Failed to generate PDF. Please try again.");
      }
    };

    return (
      <>
        {/* Modal for Screen Display */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header - Hide on print */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 print-hide">
              <div className="flex items-center gap-4">
                <img
                  src="/TreasureHub Banner Logo.png"
                  alt="TreasureHub"
                  className="h-12"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Warehouse Pick Ticket
                  </h2>
                  <p className="text-gray-600 mt-1">Order #{orderShortId}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generatePDF}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Generate PDF
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content for Screen Display */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Pick Ticket Ready for Download
                  </h3>
                  <p className="text-blue-800">
                    Click "Generate PDF" to create and download a professional
                    warehouse pick ticket with all necessary information.
                  </p>
                </div>
              </div>

              {/* Order Summary for Modal Display */}
              <div className="space-y-6">
                {/* Quick Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Order Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        Order ID:
                      </span>
                      <div className="font-mono text-xs">{orderShortId}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date:</span>
                      <div>{orderDate}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Item ID:
                      </span>
                      <div className="font-mono font-bold">
                        {order.listing.itemId}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Customer:
                      </span>
                      <div>{order.buyer.name}</div>
                    </div>
                  </div>
                </div>

                {/* Item Preview - Clickable */}
                <div
                  className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    window.open(`/list-item/${order.listing.itemId}`, "_blank")
                  }
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    Item Details
                    <svg
                      className="w-4 h-4 ml-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </h3>
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {heroImage ? (
                        <img
                          src={heroImage}
                          alt={order.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {order.listing.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Condition: {order.listing.condition}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Click to view full listing →
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Preview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Delivery Information
                  </h3>
                  <div className="text-sm">
                    {order.shippingAddress ? (
                      typeof order.shippingAddress === "string" ? (
                        <div>{order.shippingAddress}</div>
                      ) : (
                        <div>
                          {order.shippingAddress.streetAddress && (
                            <div>{order.shippingAddress.streetAddress}</div>
                          )}
                          <div>
                            {order.shippingAddress.city &&
                              `${order.shippingAddress.city}`}
                            {order.shippingAddress.city &&
                              order.shippingAddress.state &&
                              ", "}
                            {order.shippingAddress.state &&
                              `${order.shippingAddress.state}`}
                            {order.shippingAddress.zipCode &&
                              ` ${order.shippingAddress.zipCode}`}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-red-600 font-semibold">
                        ⚠️ NO DELIVERY ADDRESS PROVIDED
                      </div>
                    )}
                  </div>
                </div>

                {/* Warehouse Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    📋 Warehouse Instructions
                    {allInstructionsCompleted && (
                      <span className="ml-2 text-green-600">✓ Complete</span>
                    )}
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={warehouseInstructions.verifyCondition}
                        onChange={() =>
                          handleInstructionChange("verifyCondition")
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Verify item condition matches description
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={warehouseInstructions.checkDamage}
                        onChange={() => handleInstructionChange("checkDamage")}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Check for any damage during pick
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={warehouseInstructions.photographDifferences}
                        onChange={() =>
                          handleInstructionChange("photographDifferences")
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Photograph item if condition differs
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={warehouseInstructions.packageSecurely}
                        onChange={() =>
                          handleInstructionChange("packageSecurely")
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Package securely for delivery
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={warehouseInstructions.updateStatus}
                        onChange={() => handleInstructionChange("updateStatus")}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Update order status after completion
                      </span>
                    </label>
                  </div>

                  {/* Complete Button */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleComplete}
                      disabled={!allInstructionsCompleted}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                        allInstructionsCompleted
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {allInstructionsCompleted
                        ? "Mark Pick Ticket Complete ✓"
                        : "Complete All Instructions First"}
                    </button>
                    <button
                      onClick={generatePDF}
                      className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Generate PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // AssignSlotModal Component
  const AssignSlotModal = ({
    order,
    isOpen,
    onClose,
    onAssign,
  }: {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    onAssign?: (
      orderId: string,
      selectedSlots?: Array<{ date: string; window: string }>
    ) => void;
  }) => {
    const [selectedSlots, setSelectedSlots] = useState<
      Array<{
        date: string;
        window: string;
      }>
    >([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Initialize with existing selections when editing
    React.useEffect(() => {
      if (order && orderSlotSelections[order.id]) {
        setSelectedSlots(orderSlotSelections[order.id]);
      } else {
        setSelectedSlots([]);
      }
    }, [order, orderSlotSelections]);

    if (!order || !isOpen) return null;

    // Define delivery windows
    const deliveryWindows = [
      {
        id: "morning",
        label: "Morning (8:00 AM - 12:00 PM)",
        startTime: "08:00",
        endTime: "12:00",
      },
      {
        id: "afternoon",
        label: "Afternoon (12:00 PM - 4:00 PM)",
        startTime: "12:00",
        endTime: "16:00",
      },
      {
        id: "evening",
        label: "Evening (4:00 PM - 8:00 PM)",
        startTime: "16:00",
        endTime: "20:00",
      },
    ];

    // Function to get occupied slots for a date/window (will be replaced with real API call)
    const getOccupiedSlots = (date: string, windowId: string): number => {
      // TODO: Replace with actual API call to get scheduled deliveries for this date/window
      // For now, return 0 to show full capacity available
      return 0;
    };

    const getAvailableSlots = (date: string, windowId: string): number => {
      const maxCapacity = 4; // Default 4 deliveries per window (adjustable in Driver Allocation)
      const occupied = getOccupiedSlots(date, windowId);
      return Math.max(0, maxCapacity - occupied);
    };

    // Generate next 7 days for selection
    const getNextSevenDays = () => {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        days.push({
          value: date.toISOString().split("T")[0],
          label: date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          }),
        });
      }
      return days;
    };

    const availableDays = getNextSevenDays();

    const orderShortId = order.id.slice(-8).toUpperCase();

    const handleSlotSelection = (date: string, windowId: string) => {
      const slotKey = `${date}-${windowId}`;
      const isAlreadySelected = selectedSlots.some(
        (slot) => slot.date === date && slot.window === windowId
      );

      if (isAlreadySelected) {
        // Remove slot
        setSelectedSlots((prev) =>
          prev.filter(
            (slot) => !(slot.date === date && slot.window === windowId)
          )
        );
      } else {
        // Add slot (limit to 3 selections)
        if (selectedSlots.length < 3) {
          setSelectedSlots((prev) => [...prev, { date, window: windowId }]);
        } else {
          alert("You can select up to 3 time slot options for the customer.");
        }
      }
    };

    const isSlotSelected = (date: string, windowId: string): boolean => {
      return selectedSlots.some(
        (slot) => slot.date === date && slot.window === windowId
      );
    };

    const handleSubmit = async () => {
      if (selectedSlots.length < 2) {
        alert(
          "Please select at least 2 time slot options for the customer to choose from."
        );
        return;
      }

      setIsSubmitting(true);
      try {
        // Convert selected slots to detailed format for email
        const detailedSlots = selectedSlots.map((slot) => {
          const window = deliveryWindows.find((w) => w.id === slot.window);
          const dayLabel = availableDays.find(
            (d) => d.value === slot.date
          )?.label;
          return {
            date: slot.date,
            dateLabel: dayLabel,
            windowId: slot.window,
            windowLabel: window?.label,
            startTime: window?.startTime,
            endTime: window?.endTime,
          };
        });

        // Send email via SES with time slot options
        const emailData = {
          orderId: order.id,
          customerEmail: order.buyer.email,
          customerName: order.buyer.name,
          timeSlots: detailedSlots,
          itemTitle: order.listing.title,
          itemId: order.listing.itemId,
        };

        // Send email via SES API
        const emailResponse = await fetch(
          "/api/admin/delivery-scheduler/send-timeslots",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailData),
          }
        );

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(errorData.error || "Failed to send email");
        }

        const emailResult = await emailResponse.json();

        if (onAssign) {
          onAssign(order.id, selectedSlots);
        }

        setShowSuccessModal(true);
      } catch (error) {
        console.error("Error sending time slot email:", error);

        // Show specific error message based on the error type
        let errorMessage =
          "Failed to send time slot options. Please try again.";
        if (error instanceof Error) {
          if (error.message.includes("not verified")) {
            errorMessage =
              "❌ Email Error: Sender email address not verified in AWS SES.\n\nPlease contact your administrator to verify the sender email address in AWS SES console.";
          } else if (error.message.includes("Failed to send email")) {
            errorMessage =
              "Email service error. Please check your connection and try again.";
          } else {
            errorMessage = error.message;
          }
        }

        alert(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {orderSlotSelections[order.id] ? "Edit" : "Assign"} Delivery
                Time Slots
              </h2>
              <p className="text-gray-600 mt-1">
                Order #{orderShortId} - {order.buyer.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delivery Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p>
                  <strong>Item:</strong> {order.listing.title}
                </p>
                <p>
                  <strong>Customer:</strong> {order.buyer.name}
                </p>
                <p>
                  <strong>Email:</strong> {order.buyer.email}
                </p>
                <div className="mt-2">
                  <strong>Address:</strong>
                  {order.shippingAddress ? (
                    typeof order.shippingAddress === "string" ? (
                      <span className="ml-1">{order.shippingAddress}</span>
                    ) : (
                      <div className="ml-1">
                        {order.shippingAddress.streetAddress && (
                          <div>{order.shippingAddress.streetAddress}</div>
                        )}
                        <div>
                          {order.shippingAddress.city &&
                            `${order.shippingAddress.city}`}
                          {order.shippingAddress.city &&
                            order.shippingAddress.state &&
                            ", "}
                          {order.shippingAddress.state &&
                            `${order.shippingAddress.state}`}
                          {order.shippingAddress.zipCode &&
                            ` ${order.shippingAddress.zipCode}`}
                        </div>
                      </div>
                    )
                  ) : (
                    <span className="text-red-600 ml-1">
                      No address provided
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Available Delivery Windows */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Available Delivery Windows
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose 2-3 available time slots for the customer to select from.
                Each window has a capacity of 4 deliveries.
              </p>

              {selectedSlots.length > 0 && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Selected:</strong> {selectedSlots.length}/3 time
                    slot{selectedSlots.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {availableDays.map((day) => (
                  <div
                    key={day.value}
                    className="border border-gray-200 rounded-lg"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900">
                        {day.label}
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {deliveryWindows.map((window) => {
                          const available = getAvailableSlots(
                            day.value,
                            window.id
                          );
                          const isSelected = isSlotSelected(
                            day.value,
                            window.id
                          );
                          const isDisabled = available === 0 && !isSelected;

                          return (
                            <button
                              key={window.id}
                              onClick={() =>
                                !isDisabled &&
                                handleSlotSelection(day.value, window.id)
                              }
                              disabled={isDisabled}
                              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                                isSelected
                                  ? "border-purple-500 bg-purple-50 text-purple-900"
                                  : isDisabled
                                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                  : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                              }`}
                            >
                              <div className="font-medium text-sm">
                                {window.label.split(" (")[0]}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {window.label.split("(")[1]?.replace(")", "")}
                              </div>
                              <div
                                className={`text-xs mt-2 font-medium ${
                                  available === 0
                                    ? "text-red-600"
                                    : available <= 2
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {available}/4 available
                              </div>
                              {isSelected && (
                                <div className="text-xs text-purple-600 mt-1 font-medium">
                                  ✓ Selected
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? orderSlotSelections[order.id]
                    ? "Updating..."
                    : "Sending Email..."
                  : orderSlotSelections[order.id]
                  ? "Update Selections"
                  : "Send to Customer"}
              </button>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {orderSlotSelections[order.id]
                    ? "Selections Updated!"
                    : "Email Sent Successfully!"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {orderSlotSelections[order.id]
                    ? "Time slot selections have been updated and sent to the customer!"
                    : "Time slot options have been sent to the customer via email!"}
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    onClose();
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // OrderDetailsModal Component
  const OrderDetailsModal = ({
    order,
    isOpen,
    onClose,
  }: {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!order || !isOpen) return null;

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const orderShortId = order.id.slice(-8).toUpperCase();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Order Details
                </h2>
                <p className="text-gray-600 mt-1">Complete order information</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Email-style content */}
          <div className="p-6">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Order Confirmed!
              </h3>
              <p className="text-lg text-gray-600">
                Your purchase was successful
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="text-xl font-bold text-gray-900 mb-6 text-center">
                Order Details
              </h4>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="bg-white rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                    Order Information
                  </h5>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confirmation ID:</span>
                      <span className="font-semibold">#{orderShortId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Order ID:</span>
                      <span className="font-semibold text-xs">{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-semibold">{orderDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${
                          statusConfig[
                            order.status as keyof typeof statusConfig
                          ]?.color || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusConfig[order.status as keyof typeof statusConfig]
                          ?.label || order.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-[#D4AF3D] text-xl">
                        ${order.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                    Customer Information
                  </h5>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold">{order.buyer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold">{order.buyer.email}</span>
                    </div>
                    {order.buyer.mobilePhone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">
                          {order.buyer.mobilePhone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                Product Information
              </h4>

              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {(() => {
                    const heroImage = getHeroImage(order.listing.photos);

                    return heroImage ? (
                      <img
                        src={heroImage}
                        alt={order.listing.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-lg text-gray-900 mb-2">
                    {order.listing.title}
                  </h5>
                  <p className="text-gray-600 mb-2">
                    Item ID: {order.listing.itemId}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-bold text-[#D4AF3D] text-xl">
                      ${order.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping & Delivery */}
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                Shipping & Delivery
              </h4>

              {order.shippingAddress ? (
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Delivery Address:
                  </h5>
                  <div className="text-gray-700">
                    {typeof order.shippingAddress === "string" ? (
                      <p>{order.shippingAddress}</p>
                    ) : (
                      <>
                        {order.shippingAddress.streetAddress && (
                          <p>{order.shippingAddress.streetAddress}</p>
                        )}
                        {order.shippingAddress.apartment && (
                          <p>{order.shippingAddress.apartment}</p>
                        )}
                        {(order.shippingAddress.city ||
                          order.shippingAddress.state ||
                          order.shippingAddress.zipCode) && (
                          <p>
                            {order.shippingAddress.city &&
                              `${order.shippingAddress.city}`}
                            {order.shippingAddress.city &&
                              order.shippingAddress.state &&
                              ", "}
                            {order.shippingAddress.state &&
                              `${order.shippingAddress.state}`}
                            {(order.shippingAddress.city ||
                              order.shippingAddress.state) &&
                              order.shippingAddress.zipCode &&
                              " "}
                            {order.shippingAddress.zipCode &&
                              `${order.shippingAddress.zipCode}`}
                          </p>
                        )}
                        {order.shippingAddress.country &&
                          order.shippingAddress.country !== "US" && (
                            <p>{order.shippingAddress.country}</p>
                          )}
                      </>
                    )}
                  </div>
                  <div className="mt-3">
                    <ZipCodeValidation order={order} />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic mb-4">
                  No delivery address provided
                </p>
              )}

              <p className="text-gray-700">
                Once processed, your item will be delivered. Delivery typically
                takes 1-3 business days.
              </p>

              {order.scheduledPickupTime && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <h6 className="font-semibold text-gray-900">
                    Scheduled Pickup:
                  </h6>
                  <p className="text-gray-700">
                    {formatDate(order.scheduledPickupTime)}
                  </p>
                  {order.pickupTimeSlot && (
                    <p className="text-gray-600 text-sm">
                      Time Slot: {order.pickupTimeSlot}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="text-center">
              <button
                onClick={onClose}
                className="bg-[#D4AF3D] hover:bg-[#D4AF3D]/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Print-only Pick Ticket Content - Always render when order is selected */}
      {selectedOrder && (
        <div className="pick-ticket-print-area fixed inset-0 bg-white z-50 hidden print:block print-show">
          {/* Print Title with Small Logo */}
          <div className="flex items-center justify-center mb-6 pb-3 border-b-2 border-black">
            <img
              src="/TreasureHub - Banner - Label.png"
              alt="TreasureHub"
              className="h-8 mr-3"
            />
            <div className="text-2xl font-bold">WAREHOUSE PICK TICKET</div>
          </div>

          {/* Top Section: Item Reference and Warehouse Instructions */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2">
                ITEM REFERENCE
              </h3>
              <div className="text-center">
                <div className="inline-block p-3 border-2 border-gray-300 rounded">
                  <CustomQRCode
                    itemId={selectedOrder.listing.itemId}
                    size={100}
                    className="mx-auto"
                    showPrintButton={false}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2">
                📋 WAREHOUSE INSTRUCTIONS
              </h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Verify item condition matches description</li>
                <li>• Check for any damage during pick</li>
                <li>• Photograph item if condition differs</li>
                <li>• Package securely for delivery</li>
                <li>• Update order status after completion</li>
              </ul>
            </div>
          </div>

          {/* Item Information */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2 mb-3">
              ITEM TO PICK
            </h3>
            <div className="border border-gray-300 p-4 rounded">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 border border-gray-300 rounded flex-shrink-0">
                  {getHeroImage(selectedOrder.listing.photos) ? (
                    <img
                      src={getHeroImage(selectedOrder.listing.photos)}
                      alt="Item Image"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-4">
                    <span className="font-medium text-gray-700 min-w-24">
                      SKU/Listing ID:
                    </span>
                    <span className="font-mono font-bold">
                      {selectedOrder.listing.itemId}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="font-medium text-gray-700 min-w-24">
                      Title:
                    </span>
                    <span className="font-bold">
                      {selectedOrder.listing.title}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-4">
                      <span className="font-medium text-gray-700">
                        Quantity:
                      </span>
                      <span className="font-bold text-lg">1</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="font-medium text-gray-700">
                        Condition:
                      </span>
                      <span>{selectedOrder.listing.condition}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address and Contact */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2 mb-3">
              DELIVERY ADDRESS & BUYER INFORMATION
            </h3>
            <div className="bg-gray-50 border border-gray-300 p-4 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700 block mb-1">
                    Delivery To:
                  </span>
                  {selectedOrder.shippingAddress ? (
                    <div className="text-sm">
                      {typeof selectedOrder.shippingAddress === "string" ? (
                        <div>{selectedOrder.shippingAddress}</div>
                      ) : (
                        <>
                          {selectedOrder.shippingAddress.streetAddress && (
                            <div className="font-medium">
                              {selectedOrder.shippingAddress.streetAddress}
                            </div>
                          )}
                          {selectedOrder.shippingAddress.apartment && (
                            <div>{selectedOrder.shippingAddress.apartment}</div>
                          )}
                          <div>
                            {selectedOrder.shippingAddress.city &&
                              `${selectedOrder.shippingAddress.city}`}
                            {selectedOrder.shippingAddress.city &&
                              selectedOrder.shippingAddress.state &&
                              ", "}
                            {selectedOrder.shippingAddress.state &&
                              `${selectedOrder.shippingAddress.state}`}
                            {(selectedOrder.shippingAddress.city ||
                              selectedOrder.shippingAddress.state) &&
                              selectedOrder.shippingAddress.zipCode &&
                              " "}
                            {selectedOrder.shippingAddress.zipCode &&
                              `${selectedOrder.shippingAddress.zipCode}`}
                          </div>
                          {selectedOrder.shippingAddress.country &&
                            selectedOrder.shippingAddress.country !== "US" && (
                              <div>{selectedOrder.shippingAddress.country}</div>
                            )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600 font-medium text-sm">
                      ⚠️ NO DELIVERY ADDRESS PROVIDED
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-medium text-gray-700 block mb-1">
                    Customer Contact:
                  </span>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span className="font-medium">
                        {selectedOrder.buyer.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span className="text-xs">
                        {selectedOrder.buyer.email}
                      </span>
                    </div>
                    {selectedOrder.buyer.mobilePhone && (
                      <div className="flex justify-between">
                        <span className="font-medium">Phone:</span>
                        <span className="font-mono text-xs">
                          {selectedOrder.buyer.mobilePhone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto print-hide">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Delivery Scheduler
          </h1>
          <p className="text-gray-600">
            Manage and track order deliveries through the fulfillment process
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <StatusCard
            status="ALL"
            count={stats.total}
            onClick={() => setSelectedStatus("ALL")}
          />
          <StatusCard
            status="PAID"
            count={orders.filter((o) => o.status === "PAID").length}
            onClick={() => setSelectedStatus("PAID")}
          />
          <StatusCard
            status="PENDING_SCHEDULING"
            count={stats.pendingScheduling}
            onClick={() => setSelectedStatus("PENDING_SCHEDULING")}
          />
          <StatusCard
            status="SCHEDULED"
            count={stats.scheduled}
            onClick={() => setSelectedStatus("SCHEDULED")}
          />
          <StatusCard
            status="EN_ROUTE"
            count={stats.enRoute}
            onClick={() => setSelectedStatus("EN_ROUTE")}
          />
          <StatusCard
            status="DELIVERED"
            count={stats.delivered}
            onClick={() => setSelectedStatus("DELIVERED")}
          />
          <StatusCard
            status="FINALIZED"
            count={stats.finalized}
            onClick={() => setSelectedStatus("FINALIZED")}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, items, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-500">
              {selectedStatus === "ALL"
                ? "No orders match your search criteria."
                : `No orders with status "${
                    statusConfig[selectedStatus as keyof typeof statusConfig]
                      ?.label || selectedStatus
                  }".`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}
        />

        {/* Pick Ticket Modal */}
        <PickTicketModal
          order={selectedOrder}
          isOpen={showPickTicketModal}
          onClose={() => {
            setShowPickTicketModal(false);
            setSelectedOrder(null);
          }}
          onComplete={handlePickTicketComplete}
        />

        {/* Assign Slot Modal */}
        <AssignSlotModal
          order={selectedOrder}
          isOpen={showAssignSlotModal}
          onClose={() => {
            setShowAssignSlotModal(false);
            setSelectedOrder(null);
          }}
          onAssign={handleSlotAssignment}
        />

        {/* Edit Address Modal */}
        <CheckoutAddressModal
          isOpen={showAddressModal}
          onClose={() => {
            setShowAddressModal(false);
            setEditingOrder(null);
          }}
          onAddressSelect={handleAddressUpdate}
          currentAddress={
            editingOrder?.shippingAddress
              ? typeof editingOrder.shippingAddress === "string"
                ? editingOrder.shippingAddress
                : `${editingOrder.shippingAddress.streetAddress}${
                    editingOrder.shippingAddress.apartment
                      ? ", " + editingOrder.shippingAddress.apartment
                      : ""
                  }, ${editingOrder.shippingAddress.city}, ${
                    editingOrder.shippingAddress.state
                  } ${editingOrder.shippingAddress.zipCode}`
              : ""
          }
          currentAddressData={
            editingOrder?.shippingAddress &&
            typeof editingOrder.shippingAddress === "object"
              ? {
                  streetAddress:
                    editingOrder.shippingAddress.streetAddress || "",
                  apartment: editingOrder.shippingAddress.apartment || "",
                  city: editingOrder.shippingAddress.city || "",
                  state: editingOrder.shippingAddress.state || "",
                  postalCode: editingOrder.shippingAddress.zipCode || "",
                  country:
                    editingOrder.shippingAddress.country || "United States",
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
