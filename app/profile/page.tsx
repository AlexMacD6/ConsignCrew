"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  preferredContact: string;
  shippingAddress: string;
  alternatePickup?: string;
  payoutMethod: string;
  payoutAccount: string;
  profilePhotoUrl?: string;
  governmentIdUrl?: string;
}

export default function ProfilePage() {
  const [tab, setTab] = useState("overview");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<User | Partial<User>>({} as User);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setUpdateError("");
      setUpdateSuccess("");
      try {
        const res = await fetch("/api/profile");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setForm(data.user);
      } catch (err) {
        setUpdateError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleEdit = () => {
    setEditMode(true);
    setUpdateError("");
    setUpdateSuccess("");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setUpdateError("");
    setUpdateSuccess("");
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-t font-semibold transition border-b-2 ${tab === "overview" ? "border-[#D4AF3D] text-[#D4AF3D]" : "border-transparent text-gray-500"}`}
                onClick={() => setTab("overview")}
              >
                Overview
              </button>
              <button
                className={`px-4 py-2 rounded-t font-semibold transition border-b-2 ${tab === "settings" ? "border-[#D4AF3D] text-[#D4AF3D]" : "border-transparent text-gray-500"}`}
                onClick={() => setTab("settings")}
              >
                Settings
              </button>
            </div>
          </div>

          {tab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <img
                  src={
                    user.profilePhotoUrl ||
                    "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(user.firstName + " " + user.lastName)
                  }
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border mb-4"
                />
                <div className="text-center">
                  <div className="font-semibold text-lg">
                    {editMode ? (
                      <input
                        name="firstName"
                        value={form.firstName || ""}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-24 mr-1"
                      />
                    ) : (
                      user.firstName
                    )}{" "}
                    {editMode ? (
                      <input
                        name="lastName"
                        value={form.lastName || ""}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-24"
                      />
                    ) : (
                      user.lastName
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
                      <input
                        name="mobilePhone"
                        value={form.mobilePhone || ""}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      user.mobilePhone
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred Contact
                  </label>
                  <p className="mt-1 text-base">
                    {editMode ? (
                      <select
                        name="preferredContact"
                        value={form.preferredContact || "email"}
                        onChange={handleChange}
                        className="border rounded px-2 py-1"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                      </select>
                    ) : user.preferredContact === "email" ? (
                      "Email"
                    ) : (
                      "SMS"
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Shipping Address
                  </label>
                  <p className="mt-1 text-base">
                    {editMode ? (
                      <input
                        name="shippingAddress"
                        value={form.shippingAddress || ""}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      user.shippingAddress
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Alternate Pickup Location
                  </label>
                  <p className="mt-1 text-base">
                    {editMode ? (
                      <input
                        name="alternatePickup"
                        value={form.alternatePickup || ""}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      user.alternatePickup || (
                        <span className="text-gray-400">None</span>
                      )
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payout Method
                  </label>
                  <p className="mt-1 text-base capitalize">
                    {editMode ? (
                      <input
                        name="payoutMethod"
                        value={form.payoutMethod || ""}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      user.payoutMethod
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payout Account
                  </label>
                  <p className="mt-1 text-base">
                    {editMode ? (
                      <input
                        name="payoutAccount"
                        value={form.payoutAccount || ""}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      user.payoutAccount
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Government ID
                  </label>
                  <p className="mt-1 text-base">
                    {user.governmentIdUrl ? (
                      <Link
                        href={user.governmentIdUrl}
                        className="text-blue-600 underline"
                        target="_blank"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="text-gray-400">Not uploaded</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            {!editMode ? (
              <button
                className="px-6 py-2 bg-[#D4AF3D] text-white font-bold rounded-lg shadow hover:bg-[#b8932f] transition"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            ) : (
              <button
                className="px-6 py-2 bg-[#D4AF3D] text-white font-bold rounded-lg shadow hover:bg-[#b8932f] transition"
                onClick={handleUpdate}
              >
                Update Profile
              </button>
            )}
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
    </div>
  );
}
