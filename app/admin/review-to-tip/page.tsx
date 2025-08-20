"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";

interface Driver {
  id: string;
  initials: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  totalReviews: number;
  totalBonusEarned: number;
  createdAt: string;
  _count: {
    reviewScans: number;
    reviewBonuses: number;
  };
}

interface ReviewScan {
  id: string;
  scannedAt: string;
  ipAddress?: string;
  driver: {
    initials: string;
    fullName: string;
  };
  googleReview?: {
    id: string;
    rating: number;
    reviewText?: string;
    confirmedAt: string;
    bonusAwarded: boolean;
  };
}

interface ReviewBonus {
  id: string;
  bonusAmount: number;
  awardedAt: string;
  paymentStatus: string;
  paymentMethod?: string;
  driver: {
    initials: string;
    fullName: string;
    email?: string;
  };
  googleReview: {
    rating: number;
    reviewScan: {
      scannedAt: string;
    };
  };
}

export default function ReviewToTipDashboard() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [reviewScans, setReviewScans] = useState<ReviewScan[]>([]);
  const [bonuses, setBonuses] = useState<ReviewBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    totalScans: 0,
    confirmedReviews: 0,
    pendingBonuses: 0,
    totalBonusAmount: 0,
  });

  // New driver form
  const [newDriver, setNewDriver] = useState({
    initials: "",
    fullName: "",
    email: "",
    phone: "",
    googleReviewsUrl: "",
  });

  // Review confirmation form
  const [reviewConfirmation, setReviewConfirmation] = useState({
    scanId: "",
    rating: 5,
    reviewText: "",
    reviewerName: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch drivers
      const driversRes = await fetch("/api/admin/drivers");
      const driversData = await driversRes.json();

      // Fetch review scans
      const scansRes = await fetch("/api/admin/reviews");
      const scansData = await scansRes.json();

      // Fetch bonuses
      const bonusesRes = await fetch("/api/admin/bonuses");
      const bonusesData = await bonusesRes.json();

      if (driversData.success) {
        setDrivers(driversData.drivers);
      }

      if (scansData.success) {
        setReviewScans(scansData.reviewScans);
        setStats((prev) => ({
          ...prev,
          totalScans: scansData.stats.totalScans,
          confirmedReviews: scansData.stats.reviewsConfirmed,
        }));
      }

      if (bonusesData.success) {
        setBonuses(bonusesData.bonuses);
        setStats((prev) => ({
          ...prev,
          pendingBonuses: bonusesData.stats.byStatus?.pending?.count || 0,
          totalBonusAmount: bonusesData.stats.totalAmount,
        }));
      }

      // Calculate driver stats
      if (driversData.success) {
        setStats((prev) => ({
          ...prev,
          totalDrivers: driversData.drivers.length,
          activeDrivers: driversData.drivers.filter((d: Driver) => d.isActive)
            .length,
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createDriver = async () => {
    try {
      const response = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDriver),
      });

      const data = await response.json();

      if (data.success) {
        setNewDriver({
          initials: "",
          fullName: "",
          email: "",
          phone: "",
          googleReviewsUrl: "",
        });
        fetchData(); // Refresh data
        alert("Driver created successfully!");
      } else {
        alert(data.error || "Failed to create driver");
      }
    } catch (error) {
      console.error("Error creating driver:", error);
      alert("Failed to create driver");
    }
  };

  const confirmReview = async () => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewScanId: reviewConfirmation.scanId,
          rating: reviewConfirmation.rating,
          reviewText: reviewConfirmation.reviewText,
          reviewerName: reviewConfirmation.reviewerName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReviewConfirmation({
          scanId: "",
          rating: 5,
          reviewText: "",
          reviewerName: "",
        });
        fetchData(); // Refresh data
        alert(data.message || "Review confirmed successfully!");
      } else {
        alert(data.error || "Failed to confirm review");
      }
    } catch (error) {
      console.error("Error confirming review:", error);
      alert("Failed to confirm review");
    }
  };

  const updateBonusStatus = async (bonusId: string, status: string) => {
    try {
      const response = await fetch("/api/admin/bonuses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bonusId,
          paymentStatus: status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchData(); // Refresh data
        alert(data.message || "Bonus status updated!");
      } else {
        alert(data.error || "Failed to update bonus status");
      }
    } catch (error) {
      console.error("Error updating bonus:", error);
      alert("Failed to update bonus status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Review-to-Tip Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Review-to-Tip Dashboard</h1>
        <p className="text-gray-600">
          Manage drivers, QR code scans, reviews, and bonuses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            <div className="text-sm text-gray-600">Total Drivers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-treasure-600">
              {stats.activeDrivers}
            </div>
            <div className="text-sm text-gray-600">Active Drivers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <div className="text-sm text-gray-600">QR Scans</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-treasure-600">
              {stats.confirmedReviews}
            </div>
            <div className="text-sm text-gray-600">Confirmed Reviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingBonuses}
            </div>
            <div className="text-sm text-gray-600">Pending Bonuses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-treasure-600">
              ${stats.totalBonusAmount.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Bonuses</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="drivers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="scans">QR Scans</TabsTrigger>
          <TabsTrigger value="reviews">Review Confirmation</TabsTrigger>
          <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
        </TabsList>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          {/* Add New Driver */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Driver</CardTitle>
              <CardDescription>
                Create QR codes for new delivery drivers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  placeholder="Initials (e.g., ARM)"
                  value={newDriver.initials}
                  onChange={(e) =>
                    setNewDriver((prev) => ({
                      ...prev,
                      initials: e.target.value.toUpperCase(),
                    }))
                  }
                  maxLength={4}
                />
                <Input
                  placeholder="Full Name"
                  value={newDriver.fullName}
                  onChange={(e) =>
                    setNewDriver((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Email (optional)"
                  type="email"
                  value={newDriver.email}
                  onChange={(e) =>
                    setNewDriver((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
                <Input
                  placeholder="Phone (optional)"
                  value={newDriver.phone}
                  onChange={(e) =>
                    setNewDriver((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
                <Input
                  placeholder="Google Reviews URL (optional)"
                  value={newDriver.googleReviewsUrl}
                  onChange={(e) =>
                    setNewDriver((prev) => ({
                      ...prev,
                      googleReviewsUrl: e.target.value,
                    }))
                  }
                />
                <Button
                  onClick={createDriver}
                  disabled={!newDriver.initials || !newDriver.fullName}
                >
                  Add Driver
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Drivers List */}
          <Card>
            <CardHeader>
              <CardTitle>All Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="font-mono font-bold text-lg bg-treasure-100 px-3 py-1 rounded text-treasure-800">
                        {driver.initials}
                      </div>
                      <div>
                        <div className="font-semibold">{driver.fullName}</div>
                        <div className="text-sm text-gray-600">
                          {driver.email} • {driver._count.reviewScans} scans • $
                          {driver.totalBonusEarned.toFixed(2)} earned
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={driver.isActive ? "default" : "secondary"}
                      >
                        {driver.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        QR: treasurehub.club/review/
                        {driver.initials.toLowerCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Scans Tab */}
        <TabsContent value="scans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent QR Code Scans</CardTitle>
              <CardDescription>
                Track when customers scan driver QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewScans.slice(0, 20).map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="font-mono font-bold bg-gray-100 px-2 py-1 rounded">
                        {scan.driver.initials}
                      </div>
                      <div>
                        <div className="font-medium">
                          {scan.driver.fullName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(scan.scannedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {scan.googleReview ? (
                        <Badge
                          variant="default"
                          className="bg-treasure-100 text-treasure-800"
                        >
                          ⭐ {scan.googleReview.rating} stars
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending Review</Badge>
                      )}
                      <div className="text-xs text-gray-500">
                        {scan.ipAddress}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Confirmation Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Confirm Google Review</CardTitle>
              <CardDescription>
                Manually confirm reviews to award bonuses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  className="p-2 border rounded"
                  value={reviewConfirmation.scanId}
                  onChange={(e) =>
                    setReviewConfirmation((prev) => ({
                      ...prev,
                      scanId: e.target.value,
                    }))
                  }
                >
                  <option value="">Select QR Scan</option>
                  {reviewScans
                    .filter((scan) => !scan.googleReview)
                    .map((scan) => (
                      <option key={scan.id} value={scan.id}>
                        {scan.driver.initials} -{" "}
                        {new Date(scan.scannedAt).toLocaleDateString()}
                      </option>
                    ))}
                </select>
                <select
                  className="p-2 border rounded"
                  value={reviewConfirmation.rating}
                  onChange={(e) =>
                    setReviewConfirmation((prev) => ({
                      ...prev,
                      rating: parseInt(e.target.value),
                    }))
                  }
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                  <option value={3}>⭐⭐⭐ (3 stars)</option>
                  <option value={2}>⭐⭐ (2 stars)</option>
                  <option value={1}>⭐ (1 star)</option>
                </select>
                <Input
                  placeholder="Reviewer Name (optional)"
                  value={reviewConfirmation.reviewerName}
                  onChange={(e) =>
                    setReviewConfirmation((prev) => ({
                      ...prev,
                      reviewerName: e.target.value,
                    }))
                  }
                />
                <Button
                  onClick={confirmReview}
                  disabled={!reviewConfirmation.scanId}
                >
                  Confirm Review
                </Button>
              </div>
              <Input
                placeholder="Review Text (optional)"
                value={reviewConfirmation.reviewText}
                onChange={(e) =>
                  setReviewConfirmation((prev) => ({
                    ...prev,
                    reviewText: e.target.value,
                  }))
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bonuses Tab */}
        <TabsContent value="bonuses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Driver Bonuses</CardTitle>
              <CardDescription>
                Manage bonus payments for 5-star reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bonuses.map((bonus) => (
                  <div
                    key={bonus.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="font-mono font-bold bg-yellow-100 px-2 py-1 rounded">
                        {bonus.driver.initials}
                      </div>
                      <div>
                        <div className="font-medium">
                          {bonus.driver.fullName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(bonus.awardedAt).toLocaleDateString()} • ⭐{" "}
                          {bonus.googleReview.rating} stars • $
                          {bonus.bonusAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          bonus.paymentStatus === "paid" ? "default" : "outline"
                        }
                        className={
                          bonus.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : bonus.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {bonus.paymentStatus}
                      </Badge>
                      {bonus.paymentStatus === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => updateBonusStatus(bonus.id, "paid")}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
