"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Upload,
  X,
} from "lucide-react";
import InteractiveMap from "../../components/InteractiveMap";

interface TreasureDrop {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  radius: number; // Radius in feet
  status: "active" | "found";
  clue: string;
  image: string | null;
  reward: string;
  foundBy: string | null;
  foundAt: string | null;
  createdAt: string;
  treasureCode: {
    id: string;
    code: string;
    isActive: boolean;
    maxUses: number;
    currentUses: number;
  } | null;
}

export default function AdminTreasureHuntPage() {
  const [drops, setDrops] = useState<TreasureDrop[]>([]);
  const [selectedDrop, setSelectedDrop] = useState<TreasureDrop | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "found">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Add/remove modal-open class to body
  useEffect(() => {
    if (showModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showModal]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    clue: "",
    reward: "",
    lat: "",
    lng: "",
    radius: "328", // Default 328 feet (100 meters)
    image: "",
    treasureCode: "",
  });

  // Fetch treasure drops from API
  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const response = await fetch("/api/admin/treasure-drops");
        if (response.ok) {
          const data = await response.json();
          setDrops(data);
        } else {
          console.error("Failed to fetch treasure drops");
        }
      } catch (error) {
        console.error("Error fetching treasure drops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrops();
  }, []);

  const filteredDrops = drops.filter((drop) => {
    const matchesFilter = filter === "all" || drop.status === filter;
    const matchesSearch =
      drop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drop.clue.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handlePinClick = (drop: TreasureDrop) => {
    setSelectedDrop(drop);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setFormData({
      name: "",
      clue: "",
      reward: "",
      lat: "",
      lng: "",
      radius: "328", // Default 328 feet
      image: "",
      treasureCode: "",
    });
    setShowModal(true);
  };

  const handleEdit = (drop: TreasureDrop) => {
    setIsEditing(true);
    setSelectedDrop(drop);
    setFormData({
      name: drop.name,
      clue: drop.clue,
      reward: drop.reward,
      lat: drop.location.lat.toString(),
      lng: drop.location.lng.toString(),
      radius: drop.radius.toString(),
      image: drop.image || "",
      treasureCode: drop.treasureCode?.code || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this treasure drop?")) {
      try {
        const response = await fetch(`/api/admin/treasure-drops?id=${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setDrops(drops.filter((drop) => drop.id !== id));
        } else {
          console.error("Failed to delete treasure drop");
        }
      } catch (error) {
        console.error("Error deleting treasure drop:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dropData = {
        name: formData.name,
        clue: formData.clue,
        reward: formData.reward,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
        radius: parseFloat(formData.radius),
        image: formData.image,
        treasureCode: formData.treasureCode,
      };

      if (isEditing && selectedDrop) {
        // Update existing drop
        const response = await fetch("/api/admin/treasure-drops", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedDrop.id, ...dropData }),
        });

        if (response.ok) {
          const updatedDrop = await response.json();
          setDrops(
            drops.map((drop) =>
              drop.id === selectedDrop.id ? updatedDrop : drop
            )
          );
        } else {
          const errorData = await response.json();
          console.error("Failed to update treasure drop:", errorData.error);
        }
      } else {
        // Create new drop
        const response = await fetch("/api/admin/treasure-drops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dropData),
        });

        if (response.ok) {
          const newDrop = await response.json();
          setDrops([newDrop, ...drops]);
        } else {
          const errorData = await response.json();
          console.error("Failed to create treasure drop:", errorData.error);
        }
      }

      // Reset form and close modal
      setFormData({
        name: "",
        clue: "",
        reward: "",
        lat: "",
        lng: "",
        radius: "328",
        image: "",
        treasureCode: "",
      });
      setShowModal(false);
      setIsEditing(false);
      setSelectedDrop(null);
    } catch (error) {
      console.error("Error saving treasure drop:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle image upload - for now, just use a placeholder
      setFormData({ ...formData, image: "/treasure clue.png" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading treasure hunt data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Treasure Hunt Admin
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage treasure drops and monitor hunt activity
                </p>
              </div>
              <Button
                onClick={handleAddNew}
                className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Drop
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#D4AF3D] rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {drops.filter((d) => d.status === "active").length} Active
                    Drops
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {drops.filter((d) => d.status === "found").length} Found
                    Drops
                  </span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drops..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className={
                      filter === "all" ? "bg-[#D4AF3D] hover:bg-[#b8932f]" : ""
                    }
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("active")}
                    className={
                      filter === "active"
                        ? "bg-[#D4AF3D] hover:bg-[#b8932f]"
                        : ""
                    }
                  >
                    Active
                  </Button>
                  <Button
                    variant={filter === "found" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("found")}
                    className={
                      filter === "found"
                        ? "bg-[#D4AF3D] hover:bg-[#b8932f]"
                        : ""
                    }
                  >
                    Found
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Interactive Map
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on pins to view and edit treasure drops
                </p>
              </div>
              <InteractiveMap
                drops={filteredDrops}
                onPinClick={handlePinClick}
                filter={filter}
              />
            </div>
          </div>

          {/* Drops List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Treasure Drops
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredDrops.length} drops found
                </p>
              </div>

              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {filteredDrops.map((drop) => (
                  <div
                    key={drop.id}
                    className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                      drop.status === "active"
                        ? "border-[#D4AF3D] bg-[#D4AF3D]/5"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {drop.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {drop.clue}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              drop.status === "active"
                                ? "bg-[#D4AF3D]"
                                : "bg-gray-400"
                            }`}
                          ></div>
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {drop.status === "active" ? "Active" : "Found"}
                          </span>
                          {drop.treasureCode && (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {drop.treasureCode.code}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {drop.radius}ft radius
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(drop)}
                          className="p-1 text-gray-400 hover:text-[#D4AF3D] transition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(drop.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? "Edit Treasure Drop" : "Add New Treasure Drop"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drop Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reward *
                    </label>
                    <input
                      type="text"
                      value={formData.reward}
                      onChange={(e) =>
                        setFormData({ ...formData, reward: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Clue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clue *
                  </label>
                  <textarea
                    value={formData.clue}
                    onChange={(e) =>
                      setFormData({ ...formData, clue: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    required
                  />
                </div>

                {/* Coordinates and Radius */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) =>
                        setFormData({ ...formData, lat: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      placeholder="29.7604"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) =>
                        setFormData({ ...formData, lng: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      placeholder="-95.3698"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Radius (feet) *
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="5000"
                      value={formData.radius}
                      onChange={(e) =>
                        setFormData({ ...formData, radius: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                      placeholder="328"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">50-5000 feet</p>
                  </div>
                </div>

                {/* Treasure Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treasure Code *
                  </label>
                  <input
                    type="text"
                    value={formData.treasureCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        treasureCode: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="ABC123"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    6-character code that users will enter to redeem this
                    treasure
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clue Image
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    />
                    {formData.image && (
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                  >
                    {isEditing ? "Update Drop" : "Create Drop"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
