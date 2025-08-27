"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import {
  Users,
  FileText,
  MapPin,
  Shield,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Package,
  DollarSign,
  Calendar,
  Star,
  Heart,
  Eye as EyeIcon,
  MoreHorizontal,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Clock,
  Bookmark,
} from "lucide-react";
import { SELLER_ZIP_CODES, BUYER_ZIP_CODES } from "../lib/zipcodes";

import { authClient } from "../lib/auth-client";
import { useUserPermissions } from "../hooks/useUserPermissions";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import AddressModal from "../components/AddressModal";
import HoustonMetroMap from "../components/HoustonMetroMap";
import { getDisplayPrice } from "../lib/price-calculator";

// Remove server-side imports - we'll use API endpoints instead

interface User {
  id: string;
  name: string;
  email: string;
  mobilePhone?: string;
  emailVerified?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
  isAdmin?: boolean;
}

// Mock admin data - in real app this would come from API
const mockUsers = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "user",
    status: "active",
    joinDate: "2024-01-15",
    lastLogin: "2025-01-20",
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    role: "admin",
    status: "active",
    joinDate: "2024-02-10",
    lastLogin: "2025-01-21",
  },
  {
    id: 3,
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@example.com",
    role: "user",
    status: "inactive",
    joinDate: "2024-03-05",
    lastLogin: "2024-12-15",
  },
];

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const { canListItems } = useUserPermissions();
  const [tab, setTab] = useState<
    "overview" | "listings" | "purchases" | "settings"
  >("overview");
  const [adminTab, setAdminTab] = useState("users");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<User | Partial<User>>({} as User);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [isAddressUpdating, setIsAddressUpdating] = useState(false);

  // Debug log for form state

  const [users, setUsers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [editingZipCode, setEditingZipCode] = useState<string | null>(null);
  const [newZipCode, setNewZipCode] = useState({
    code: "",
    area: "",
    type: "buyer",
  });
  const [newOrganization, setNewOrganization] = useState({
    name: "",
    slug: "",
    logo: "",
    metadata: "",
  });
  const [isAdminUser, setIsAdminUser] = useState(false);

  // ZIP code validation removed - validation will happen at checkout only

  // Listing management state
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsFilter, setListingsFilter] = useState("all"); // all, active, sold, draft
  const [listingsSearch, setListingsSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressCompletionModal, setShowAddressCompletionModal] =
    useState(false);

  // Purchase management state
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesFilter, setPurchasesFilter] = useState("all"); // all, pending, completed
  const [purchasesSearch, setPurchasesSearch] = useState("");

  const router = useRouter();

  // Function to check if address is incomplete
  const isAddressIncomplete = (user: User | null) => {
    if (!user) return false;
    return !user.addressLine1 || !user.city || !user.state || !user.zipCode;
  };

  // Function to handle opening address completion modal
  const handleCompleteAddress = () => {
    setShowAddressCompletionModal(false);
    setShowAddressModal(true);
  };

  useEffect(() => {
    async function fetchCompleteProfile() {
      // Wait for session to load
      if (!session) {
        return;
      }

      if (!session?.user) {
        setUpdateError("Please log in to view your profile");
        router.push("/login");
        return;
      }

      setLoading(true);
      setUpdateError("");
      setUpdateSuccess("");

      try {
        console.log("Profile page: Fetching complete profile data...");
        const res = await fetch("/api/profile/complete", {
          credentials: "include",
        });

        if (res.status === 401) {
          setUpdateError("Please log in to view your profile");
          router.push("/login");
          return;
        }

        if (!res.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch (parseError) {
            console.error(
              "Profile page: Failed to parse error response:",
              parseError
            );
            errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
          }
          console.error("Profile page: API error:", errorData);
          setUpdateError(
            errorData.message || `Failed to load profile (${res.status})`
          );
          return;
        }

        const data = await res.json();
        console.log("Profile page: Received complete profile data");

        // Set all data from the combined response
        setUser(data.user);
        setListings(data.listings || []);
        setPurchases(data.purchases || []);
        setIsAdminUser(data.permissions?.isAdmin || false);

        // Check if address is incomplete and show completion modal
        if (isAddressIncomplete(data.user)) {
          setTimeout(() => {
            setShowAddressCompletionModal(true);
          }, 1000);
        }

        // Only load admin data if user is admin (avoiding additional API calls)
        if (data.permissions?.isAdmin) {
          await loadAdminData();
        }
      } catch (err) {
        console.error("Profile page: Error fetching complete profile:", err);
        setUpdateError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompleteProfile();
  }, [router, session, editMode]);

  // Separate useEffect to initialize form data when user data changes
  useEffect(() => {
    if (user && !editMode) {
      setForm(user);
    }
  }, [user, editMode]);

  const loadAdminData = async () => {
    try {
      // Load users with organizations
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      // Load organizations
      const orgRes = await fetch("/api/admin/organizations");
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganizations(orgData.organizations);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  // Optimized: Listings and purchases are now loaded via the combined /api/profile/complete endpoint
  const refreshListings = async () => {
    try {
      setListingsLoading(true);
      const response = await fetch("/api/listings?userOnly=true", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      } else {
        console.error("Failed to refresh user listings");
      }
    } catch (error) {
      console.error("Error refreshing user listings:", error);
    } finally {
      setListingsLoading(false);
    }
  };

  const handleListingAction = async (listingId: string, action: string) => {
    try {
      let response;

      if (action === "delete") {
        response = await fetch(`/api/listings?id=${listingId}`, {
          method: "DELETE",
        });
      } else {
        response = await fetch(`/api/listings?id=${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action.toUpperCase() }),
        });
      }

      if (response.ok) {
        await refreshListings(); // Reload listings
        setUpdateSuccess(`Listing ${action}ed successfully!`);
      } else {
        const error = await response.json();
        setUpdateError(error.error || `Failed to ${action} listing`);
      }
    } catch (error) {
      setUpdateError(`Failed to ${action} listing`);
    }
  };

  const getFilteredListings = () => {
    let filtered = listings;

    // Apply status filter
    if (listingsFilter !== "all") {
      filtered = filtered.filter(
        (listing) =>
          listing.status.toLowerCase() === listingsFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (listingsSearch) {
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(listingsSearch.toLowerCase()) ||
          listing.description
            .toLowerCase()
            .includes(listingsSearch.toLowerCase())
      );
    }

    return filtered;
  };

  const handleEdit = () => {
    setEditMode(true);
    setUpdateError("");
    setUpdateSuccess("");
    // Initialize form with current user data
    if (user) {
      const initialForm = {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        mobilePhone: user.mobilePhone || "",
        emailVerified: user.emailVerified || false,
        addressLine1: user.addressLine1 || "",
        addressLine2: user.addressLine2 || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        country: user.country || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isAdmin: user.isAdmin || false,
      };
      setForm(initialForm);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = async (addressData: any) => {
    // Update form with address components from Google Places
    const updatedForm = {
      ...form,
      addressLine1: addressData.streetAddress,
      addressLine2: addressData.apartment || "",
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.postalCode,
      country: addressData.country,
    };

    // Update the form state
    setForm(updatedForm);

    // Also update the user state to reflect changes immediately
    setUser((prev) =>
      prev
        ? {
            ...prev,
            addressLine1: addressData.streetAddress,
            addressLine2: addressData.apartment || "",
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.postalCode,
            country: addressData.country,
          }
        : null
    );

    // Save the address to the database
    try {
      setIsAddressUpdating(true);
      setUpdateError("");
      setUpdateSuccess("");

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });

      const data = await res.json();
      if (data.success) {
        setUpdateSuccess("Address updated successfully!");
        // Update user state with the response from server
        setUser(data.user);
        // Close the address completion modal if it was open
        setShowAddressCompletionModal(false);
      } else {
        setUpdateError(data.error || "Failed to update address");
      }
    } catch (err) {
      setUpdateError("Server error. Please try again.");
    } finally {
      setIsAddressUpdating(false);
    }
  };

  const validateAddress = () => {
    const requiredFields = ["addressLine1", "city", "state", "zipCode"];
    const missingFields = requiredFields.filter(
      (field) => !form[field as keyof typeof form]
    );

    if (missingFields.length > 0) {
      setUpdateError(
        `Please fill in all required address fields: ${missingFields.join(
          ", "
        )}`
      );
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    setUpdateError("");
    setUpdateSuccess("");

    // Validate address before updating
    if (!validateAddress()) {
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setEditMode(false);
        setUpdateSuccess("Profile updated successfully!");
      } else {
        setUpdateError(data.error || "Update failed");
      }
    } catch (err) {
      setUpdateError("Server error. Please try again.");
    }
  };

  const handleUserRoleChange = (userId: number, newRole: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handleUserStatusChange = (userId: number, newStatus: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const handleAddZipCode = () => {
    // In real app, this would make an API call
    console.log("Adding zip code:", newZipCode);
    setNewZipCode({ code: "", area: "", type: "buyer" });
  };

  const handleDeleteZipCode = (zipCode: string, type: string) => {
    // In real app, this would make an API call
    console.log("Deleting zip code:", zipCode, type);
  };

  const handleCreateOrganization = async () => {
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrganization),
      });

      if (res.ok) {
        const data = await res.json();
        setOrganizations([...organizations, data.organization]);
        setNewOrganization({ name: "", slug: "", logo: "", metadata: "" });
        setUpdateSuccess("Organization created successfully!");
      } else {
        const error = await res.json();
        setUpdateError(error.error || "Failed to create organization");
      }
    } catch (error) {
      setUpdateError("Failed to create organization");
    }
  };

  // ZIP code validation function removed - validation will happen at checkout only

  const handleAssignAdmin = async (userId: string, organizationId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/assign-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (res.ok) {
        await loadAdminData(); // Reload data
        setUpdateSuccess("User assigned as admin successfully!");
      } else {
        const errorData = await res.json();
        setUpdateError(errorData.error || "Failed to assign admin role");
      }
    } catch (error) {
      setUpdateError("Failed to assign admin role");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading profile...</div>
    );
  }
  if (!user) {
    return (
      <div className="text-center py-12 text-red-500">Profile not found.</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-t font-semibold transition border-b-2 ${
                  tab === "overview"
                    ? "border-[#D4AF3D] text-[#D4AF3D]"
                    : "border-transparent text-gray-500"
                }`}
                onClick={() => setTab("overview")}
              >
                Overview
              </button>
              <button
                className={`px-4 py-2 rounded-t font-semibold transition border-b-2 ${
                  tab === "listings"
                    ? "border-[#D4AF3D] text-[#D4AF3D]"
                    : "border-transparent text-gray-500"
                }`}
                onClick={() => setTab("listings")}
              >
                <Package className="inline w-4 h-4 mr-1" />
                My Listings
              </button>
              <button
                className={`px-4 py-2 rounded-t font-semibold transition border-b-2 ${
                  tab === "purchases"
                    ? "border-[#D4AF3D] text-[#D4AF3D]"
                    : "border-transparent text-gray-500"
                }`}
                onClick={() => setTab("purchases")}
              >
                <ShoppingCart className="inline w-4 h-4 mr-1" />
                My Purchases
              </button>
              <button
                className={`px-4 py-2 rounded-t font-semibold transition border-b-2 ${
                  tab === "settings"
                    ? "border-[#D4AF3D] text-[#D4AF3D]"
                    : "border-transparent text-gray-500"
                }`}
                onClick={() => setTab("settings")}
              >
                Settings
              </button>
              {isAdminUser && (
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-t font-semibold transition border-b-2 border-transparent text-gray-500 hover:text-[#D4AF3D] hover:border-[#D4AF3D]"
                >
                  <Shield className="inline w-4 h-4 mr-1" />
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>

          {tab === "overview" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                  <img
                    src={
                      "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(user.name)
                    }
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border mb-4"
                  />
                  <div className="text-center">
                    <div className="font-semibold text-lg">
                      {editMode ? (
                        <input
                          name="name"
                          value={form.name || ""}
                          onChange={handleChange}
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        user.name
                      )}
                    </div>
                    <div className="text-gray-500">
                      {editMode ? (
                        <input
                          name="email"
                          value={form.email || ""}
                          onChange={handleChange}
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        user.email
                      )}
                    </div>
                    <div className="text-gray-500">
                      {editMode ? (
                        <PhoneInput
                          country={"us"}
                          value={form.mobilePhone || ""}
                          onChange={(value) =>
                            setForm({ ...form, mobilePhone: value })
                          }
                          inputClass="border rounded px-2 py-1 w-full"
                          inputStyle={{ width: "100%" }}
                          dropdownStyle={{ textAlign: "left" }}
                          buttonStyle={{ textAlign: "left" }}
                          specialLabel=""
                          inputProps={{
                            name: "mobilePhone",
                          }}
                        />
                      ) : (
                        user.mobilePhone || "No phone number"
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Verification Status
                    </label>
                    <p className="mt-1 text-base">
                      {user.emailVerified ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <XCircle className="w-4 h-4 mr-1" />
                          Not Verified
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Member Since
                    </label>
                    <p className="mt-1 text-base">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Updated
                    </label>
                    <p className="mt-1 text-base">
                      {user.updatedAt
                        ? new Date(user.updatedAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="mt-8 border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-[#D4AF3D]" />
                    Shipping Address Information
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddressModal(true);
                      setUpdateError("");
                      setUpdateSuccess("");
                    }}
                    disabled={isAddressUpdating}
                    className={`text-sm font-medium flex items-center ${
                      isAddressUpdating
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-[#D4AF3D] hover:text-[#b8932f]"
                    }`}
                  >
                    {isAddressUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-1"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Address
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <p className="text-base text-gray-900">
                      {user.addressLine1 || "Not provided"}
                    </p>
                    {user.addressLine2 && (
                      <p className="text-base text-gray-900">
                        {user.addressLine2}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <p className="text-base text-gray-900">
                      {user.city || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <p className="text-base text-gray-900">
                      {user.state || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <p className="text-base text-gray-900">
                      {user.zipCode || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <p className="text-base text-gray-900">
                      {user.country || "Not provided"}
                    </p>
                  </div>
                </div>

                {!user.addressLine1 &&
                  !user.city &&
                  !user.state &&
                  !user.zipCode && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 text-center">
                        No address information provided. Click "Edit Address" to
                        add your address.
                      </p>
                    </div>
                  )}

                {/* Address update status messages */}
                {updateSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 text-center">
                      {updateSuccess}
                    </p>
                  </div>
                )}
                {updateError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 text-center">
                      {updateError}
                    </p>
                  </div>
                )}
              </div>

              {/* Houston Metro Service Area Map */}
              <div className="mt-8">
                <HoustonMetroMap userZipCode={user?.zipCode} />
              </div>
            </div>
          )}

          {tab === "listings" && (
            <div className="space-y-6">
              {/* Header with stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">
                        Total Listings
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {listings.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <EyeIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">
                        Active
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {listings.filter((l) => l.status === "ACTIVE").length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">
                        Sold
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {listings.filter((l) => l.status === "SOLD").length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-gray-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Processing
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          listings.filter((l) => l.status === "PROCESSING")
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={listingsSearch}
                    onChange={(e) => setListingsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={listingsFilter}
                    onChange={(e) => setListingsFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="all">All Listings</option>
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="processing">Processing</option>
                  </select>
                  {canListItems && (
                    <Button
                      onClick={() => router.push("/list-item")}
                      className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Listing
                    </Button>
                  )}
                </div>
              </div>

              {/* Listings Grid */}
              {listingsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF3D] mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading your listings...</p>
                </div>
              ) : getFilteredListings().length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No listings found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {listings.length === 0
                      ? "You haven't created any listings yet."
                      : "No listings match your current filters."}
                  </p>
                  {listings.length === 0 && (
                    <Button
                      onClick={() => router.push("/list-item")}
                      className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Listing
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredListings().map((listing) => (
                    <div
                      key={listing.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Listing Image */}
                      <div className="relative h-48 bg-gray-100">
                        {listing.photos?.hero ? (
                          <img
                            src={listing.photos.hero}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              listing.status === "active" ||
                              listing.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : listing.status === "sold" ||
                                  listing.status === "SOLD"
                                ? "bg-yellow-100 text-yellow-800"
                                : listing.status === "processing" ||
                                  listing.status === "PROCESSING"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {listing.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Listing Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {listing.title}
                        </h3>
                        <p className="text-2xl font-bold text-[#D4AF3D] mb-2">
                          {(() => {
                            const displayPrice = getDisplayPrice(listing);
                            if (displayPrice.isDiscounted) {
                              return (
                                <>
                                  <span className="text-green-600">
                                    ${displayPrice.price.toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    ${displayPrice.originalPrice?.toFixed(2)}
                                  </span>
                                </>
                              );
                            } else {
                              return `$${displayPrice.price.toFixed(2)}`;
                            }
                          })()}
                        </p>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {listing.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            <span>{listing.views || 0} views</span>
                          </div>
                          <div className="flex items-center">
                            <Bookmark className="h-4 w-4 mr-1" />
                            <span>{listing.saves || 0} saves</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {new Date(listing.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              router.push(`/list-item/${listing.itemId}`)
                            }
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() =>
                              router.push(`/list-item/${listing.itemId}/edit`)
                            }
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() =>
                              handleListingAction(listing.itemId, "delete")
                            }
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "purchases" && (
            <div className="space-y-6">
              {/* Header with stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">
                        Total Purchases
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {purchases.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {
                          purchases.filter(
                            (p) =>
                              (p.status === "completed" ||
                                p.status === "FINALIZED" ||
                                p.status === "DELIVERED") &&
                              p.status !== "cancelled"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {
                          purchases.filter(
                            (p) =>
                              (p.status === "pending" ||
                                p.status === "PENDING" ||
                                p.status === "PENDING_SCHEDULING" ||
                                p.status === "SCHEDULED" ||
                                p.status === "EN_ROUTE" ||
                                p.status === "PAID") &&
                              p.status !== "cancelled"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">
                        Total Saved
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        $
                        {purchases
                          .filter((p) => p.status !== "cancelled")
                          .reduce((sum, p) => {
                            const savings = p.estimatedRetailPrice
                              ? p.estimatedRetailPrice - p.total
                              : 0;
                            return sum + Math.max(0, savings);
                          }, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search purchases..."
                    value={purchasesSearch}
                    onChange={(e) => setPurchasesSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={purchasesFilter}
                    onChange={(e) => setPurchasesFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="all">All Purchases</option>
                    <option value="pending">Pending Payment</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING_SCHEDULING">
                      Pending Scheduling
                    </option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="EN_ROUTE">En Route</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="completed">Completed/Finalized</option>
                  </select>
                </div>
              </div>

              {/* Purchases List */}
              {purchasesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF3D] mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading purchases...</p>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No purchases yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    When you make purchases, they will appear here.
                  </p>
                  <Button
                    onClick={() => router.push("/listings")}
                    className="btn btn-primary btn-md"
                  >
                    Browse Listings
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchases
                    .filter((purchase) => {
                      // Exclude cancelled orders from display entirely
                      if (purchase.status === "cancelled") return false;

                      const matchesSearch =
                        purchase.title
                          ?.toLowerCase()
                          .includes(purchasesSearch.toLowerCase()) ||
                        purchase.sellerName
                          ?.toLowerCase()
                          .includes(purchasesSearch.toLowerCase());
                      const matchesFilter =
                        purchasesFilter === "all" ||
                        purchase.status === purchasesFilter ||
                        (purchasesFilter === "completed" &&
                          (purchase.status === "completed" ||
                            purchase.status === "FINALIZED" ||
                            purchase.status === "DELIVERED")) ||
                        (purchasesFilter === "pending" &&
                          (purchase.status === "pending" ||
                            purchase.status === "PENDING"));
                      return matchesSearch && matchesFilter;
                    })
                    .map((purchase) => (
                      <div
                        key={purchase.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Purchase Image */}
                        <div className="relative h-48 bg-gray-100">
                          {purchase.photos?.hero ? (
                            <img
                              src={purchase.photos.hero}
                              alt={purchase.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          {/* Status Badge - Only show for non-cancelled orders */}
                          {purchase.status !== "cancelled" && (
                            <div className="absolute top-2 right-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  purchase.status === "completed" ||
                                  purchase.status === "FINALIZED"
                                    ? "bg-green-100 text-green-800"
                                    : purchase.status === "pending" ||
                                      purchase.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : purchase.status === "PENDING_SCHEDULING"
                                    ? "bg-orange-100 text-orange-800"
                                    : purchase.status === "SCHEDULED"
                                    ? "bg-purple-100 text-purple-800"
                                    : purchase.status === "EN_ROUTE"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : purchase.status === "DELIVERED"
                                    ? "bg-green-100 text-green-800"
                                    : purchase.status === "PAID"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {purchase.status === "PENDING_SCHEDULING"
                                  ? "PENDING SCHEDULING"
                                  : purchase.status
                                      .toUpperCase()
                                      .replace("_", " ")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Purchase Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {purchase.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            Seller: {purchase.sellerName}
                          </p>
                          <p className="text-2xl font-bold text-[#D4AF3D] mb-2">
                            ${purchase.total?.toFixed(2)}
                          </p>

                          {/* Purchase Details */}
                          <div className="space-y-1 mb-4">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>
                                  {new Date(
                                    purchase.purchaseDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {purchase.trackingNumber && (
                              <div className="text-sm text-gray-500">
                                <span className="font-medium">Tracking:</span>{" "}
                                {purchase.trackingNumber}
                              </div>
                            )}
                            {purchase.deliveredAt && (
                              <div className="text-sm text-green-600">
                                <span className="font-medium">Delivered:</span>{" "}
                                {new Date(
                                  purchase.deliveredAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                router.push(`/list-item/${purchase.listingId}`)
                              }
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View Item
                            </Button>
                            <Button
                              onClick={() => {
                                router.push(`/order/${purchase.id}/success`);
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            {editMode ? (
              <button className="btn btn-primary btn-md" onClick={handleUpdate}>
                Update Profile
              </button>
            ) : null}
          </div>
          {updateError && (
            <div className="text-red-600 text-center font-semibold mt-2">
              {updateError}
            </div>
          )}
          {updateSuccess && (
            <div className="text-green-600 text-center font-semibold mt-2">
              {updateSuccess}
            </div>
          )}

          {tab === "settings" && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Settings and preferences will be available here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Address Completion Modal */}
      {showAddressCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-[#D4AF3D] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Complete Your Address
                </h2>
                <p className="text-gray-600 mb-6">
                  To complete purchases on TreasureHub, please add your shipping
                  address. This helps us ensure smooth delivery.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCompleteAddress}
                  className="w-full bg-[#D4AF3D] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#c4a235] transition-colors"
                >
                  Add Address Now
                </button>
                <button
                  onClick={() => setShowAddressCompletionModal(false)}
                  className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Skip for Now
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                You can add your address later from your profile settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
        currentAddress={form.addressLine1 || ""}
        currentAddressData={{
          streetAddress: form.addressLine1 || "",
          apartment: form.addressLine2 || "",
          city: form.city || "",
          state: form.state || "",
          postalCode: form.zipCode || "",
          country: form.country || "",
        }}
      />
    </div>
  );
}
