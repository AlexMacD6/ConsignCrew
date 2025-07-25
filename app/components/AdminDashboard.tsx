"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Users,
  FileText,
  MapPin,
  Shield,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Mail,
  UserPlus,
  Building,
  Users2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
// Remove hardcoded zip codes import - we'll use database data instead

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone?: string;
  role?: string;
  organizations?: any[];
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: string;
  members?: any[];
  teams?: any[];
  invitations?: any[];
  _count?: {
    members: number;
    teams: number;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  teamMembers?: any[];
}

interface ZipCode {
  id: string;
  code: string;
  area: string;
  type: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Zip code states
  const [zipCodes, setZipCodes] = useState<ZipCode[]>([]);
  const [editingZipCode, setEditingZipCode] = useState<ZipCode | null>(null);
  const [newZipCode, setNewZipCode] = useState({
    code: "",
    area: "",
    type: "buyer",
  });
  const [zipCodeLoading, setZipCodeLoading] = useState(false);

  // Form states
  const [newOrganization, setNewOrganization] = useState({
    name: "",
    slug: "",
    logo: "",
    metadata: "",
  });
  const [newInvitation, setNewInvitation] = useState({
    email: "",
    role: "MEMBER",
  });
  const [newTeam, setNewTeam] = useState({
    name: "",
  });
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Load users
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

      // Load pending invitations
      const invRes = await fetch("/api/invitations/pending");
      if (invRes.ok) {
        const invData = await invRes.json();
        setPendingInvitations(invData.invitations);
      }

      // Load zip codes
      const zipRes = await fetch("/api/admin/zipcodes");
      if (zipRes.ok) {
        const zipData = await zipRes.json();
        const allZipCodes = [
          ...zipData.sellerZipCodes.map((zip: any) => ({
            ...zip,
            type: "seller",
          })),
          ...zipData.buyerZipCodes.map((zip: any) => ({
            ...zip,
            type: "buyer",
          })),
        ];
        setZipCodes(allZipCodes);
      }
    } catch (error) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
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
        setSuccess("Organization created successfully!");
      } else {
        const error = await res.json();
        setError(error.error || "Failed to create organization");
      }
    } catch (error) {
      setError("Failed to create organization");
    }
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrg) return;

    try {
      const res = await fetch(`/api/admin/organizations/${editingOrg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingOrg),
      });

      if (res.ok) {
        const data = await res.json();
        setOrganizations(
          organizations.map((org) =>
            org.id === editingOrg.id ? data.organization : org
          )
        );
        setEditingOrg(null);
        setSuccess("Organization updated successfully!");
      } else {
        const error = await res.json();
        setError(error.error || "Failed to update organization");
      }
    } catch (error) {
      setError("Failed to update organization");
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm("Are you sure you want to delete this organization?")) return;

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOrganizations(organizations.filter((org) => org.id !== orgId));
        setSuccess("Organization deleted successfully!");
      } else {
        const error = await res.json();
        setError(error.error || "Failed to delete organization");
      }
    } catch (error) {
      setError("Failed to delete organization");
    }
  };

  const handleInviteUser = async (orgId: string) => {
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvitation),
      });

      if (res.ok) {
        const data = await res.json();
        setNewInvitation({ email: "", role: "MEMBER" });
        setSuccess("Invitation sent successfully!");
        await loadData(); // Reload to get updated invitations
      } else {
        const error = await res.json();
        setError(error.error || "Failed to send invitation");
      }
    } catch (error) {
      setError("Failed to send invitation");
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      if (res.ok) {
        setSuccess("Invitation accepted successfully!");
        await loadData(); // Reload data
      } else {
        const error = await res.json();
        setError(error.error || "Failed to accept invitation");
      }
    } catch (error) {
      setError("Failed to accept invitation");
    }
  };

  const handleCreateTeam = async (orgId: string) => {
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });

      if (res.ok) {
        const data = await res.json();
        setNewTeam({ name: "" });
        setSuccess("Team created successfully!");
        await loadData(); // Reload to get updated teams
      } else {
        const error = await res.json();
        setError(error.error || "Failed to create team");
      }
    } catch (error) {
      setError("Failed to create team");
    }
  };

  const handleUpdateUserRole = async (
    userId: string,
    orgId: string,
    newRole: string
  ) => {
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setSuccess("User role updated successfully!");
        await loadData(); // Reload data
      } else {
        const error = await res.json();
        setError(error.error || "Failed to update user role");
      }
    } catch (error) {
      setError("Failed to update user role");
    }
  };

  const handleRemoveUser = async (userId: string, orgId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this user from the organization?"
      )
    )
      return;

    try {
      const res = await fetch(
        `/api/admin/organizations/${orgId}/members?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setSuccess("User removed successfully!");
        await loadData(); // Reload data
      } else {
        const error = await res.json();
        setError(error.error || "Failed to remove user");
      }
    } catch (error) {
      setError("Failed to remove user");
    }
  };

  // Zip code management functions
  const handleAddZipCode = async () => {
    if (!newZipCode.code || !newZipCode.area) {
      setError("Please fill in all fields");
      return;
    }

    setZipCodeLoading(true);
    try {
      const res = await fetch("/api/admin/zipcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newZipCode),
      });

      if (res.ok) {
        const data = await res.json();
        setZipCodes([...zipCodes, data.zip]);
        setNewZipCode({ code: "", area: "", type: "buyer" });
        setSuccess("Zip code added successfully!");
      } else {
        const error = await res.json();
        setError(error.error || "Failed to add zip code");
      }
    } catch (error) {
      setError("Failed to add zip code");
    } finally {
      setZipCodeLoading(false);
    }
  };

  const handleUpdateZipCode = async () => {
    if (!editingZipCode || !editingZipCode.code || !editingZipCode.area) {
      setError("Please fill in all fields");
      return;
    }

    setZipCodeLoading(true);
    try {
      const res = await fetch("/api/admin/zipcodes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingZipCode),
      });

      if (res.ok) {
        const data = await res.json();
        setZipCodes(
          zipCodes.map((zip) => (zip.id === editingZipCode.id ? data.zip : zip))
        );
        setEditingZipCode(null);
        setSuccess("Zip code updated successfully!");
      } else {
        const error = await res.json();
        setError(error.error || "Failed to update zip code");
      }
    } catch (error) {
      setError("Failed to update zip code");
    } finally {
      setZipCodeLoading(false);
    }
  };

  const handleDeleteZipCode = async (zipId: string) => {
    if (!confirm("Are you sure you want to delete this zip code?")) {
      return;
    }

    setZipCodeLoading(true);
    try {
      const res = await fetch("/api/admin/zipcodes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: zipId }),
      });

      if (res.ok) {
        setZipCodes(zipCodes.filter((zip) => zip.id !== zipId));
        setSuccess("Zip code deleted successfully!");
      } else {
        const error = await res.json();
        setError(error.error || "Failed to delete zip code");
      }
    } catch (error) {
      setError("Failed to delete zip code");
    } finally {
      setZipCodeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-semibold transition border-b-2 ${
            activeTab === "overview"
              ? "border-[#D4AF3D] text-[#D4AF3D]"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          <Shield className="inline w-4 h-4 mr-2" />
          Overview
        </button>
        <button
          className={`px-4 py-2 font-semibold transition border-b-2 ${
            activeTab === "organizations"
              ? "border-[#D4AF3D] text-[#D4AF3D]"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("organizations")}
        >
          <Building className="inline w-4 h-4 mr-2" />
          Organizations
        </button>
        <button
          className={`px-4 py-2 font-semibold transition border-b-2 ${
            activeTab === "users"
              ? "border-[#D4AF3D] text-[#D4AF3D]"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("users")}
        >
          <Users className="inline w-4 h-4 mr-2" />
          Users
        </button>
        <button
          className={`px-4 py-2 font-semibold transition border-b-2 ${
            activeTab === "invitations"
              ? "border-[#D4AF3D] text-[#D4AF3D]"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("invitations")}
        >
          <Mail className="inline w-4 h-4 mr-2" />
          Invitations
        </button>
        <button
          className={`px-4 py-2 font-semibold transition border-b-2 ${
            activeTab === "content"
              ? "border-[#D4AF3D] text-[#D4AF3D]"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => setActiveTab("content")}
        >
          <FileText className="inline w-4 h-4 mr-2" />
          Content
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Users</h3>
            <div className="text-3xl font-bold text-[#D4AF3D]">
              {users.length}
            </div>
            <p className="text-gray-600">Total registered users</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Organizations</h3>
            <div className="text-3xl font-bold text-[#D4AF3D]">
              {organizations.length}
            </div>
            <p className="text-gray-600">Active organizations</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Pending Invitations</h3>
            <div className="text-3xl font-bold text-[#D4AF3D]">
              {pendingInvitations.length}
            </div>
            <p className="text-gray-600">Awaiting response</p>
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === "organizations" && (
        <div className="space-y-6">
          {/* Create Organization Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Create New Organization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Organization Name"
                value={newOrganization.name}
                onChange={(e) =>
                  setNewOrganization({
                    ...newOrganization,
                    name: e.target.value,
                  })
                }
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Slug (e.g., my-org)"
                value={newOrganization.slug}
                onChange={(e) =>
                  setNewOrganization({
                    ...newOrganization,
                    slug: e.target.value,
                  })
                }
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Logo URL (optional)"
                value={newOrganization.logo}
                onChange={(e) =>
                  setNewOrganization({
                    ...newOrganization,
                    logo: e.target.value,
                  })
                }
                className="border rounded px-3 py-2"
              />
              <Button
                onClick={handleCreateOrganization}
                className="bg-[#D4AF3D] hover:bg-[#b8932f]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </div>

          {/* Organizations List */}
          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{org.name}</h3>
                    <p className="text-gray-600">Slug: {org.slug}</p>
                    <p className="text-sm text-gray-500">
                      {org._count?.members || 0} members,{" "}
                      {org._count?.teams || 0} teams
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingOrg(org)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteOrganization(org.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Organization Members */}
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Members</h4>
                  <div className="space-y-2">
                    {org.members?.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {member.user.firstName} {member.user.lastName}
                          </span>
                          <span className="text-gray-600 ml-2">
                            ({member.user.email})
                          </span>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${
                              member.role === "OWNER"
                                ? "bg-purple-100 text-purple-800"
                                : member.role === "ADMIN"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateUserRole(
                                member.user.id,
                                org.id,
                                e.target.value
                              )
                            }
                            className="border rounded px-2 py-1 text-xs"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                            <option value="OWNER">Owner</option>
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() =>
                              handleRemoveUser(member.user.id, org.id)
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite User */}
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Invite User</h4>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={newInvitation.email}
                      onChange={(e) =>
                        setNewInvitation({
                          ...newInvitation,
                          email: e.target.value,
                        })
                      }
                      className="border rounded px-3 py-2 flex-1"
                    />
                    <select
                      value={newInvitation.role}
                      onChange={(e) =>
                        setNewInvitation({
                          ...newInvitation,
                          role: e.target.value,
                        })
                      }
                      className="border rounded px-3 py-2"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <Button
                      onClick={() => handleInviteUser(org.id)}
                      className="bg-[#D4AF3D] hover:bg-[#b8932f]"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">User Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organizations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {user.organizations?.map((org: any) => (
                          <div key={org.id} className="flex items-center gap-1">
                            <span className="text-xs text-gray-600">
                              {org.name}
                            </span>
                            <span
                              className={`px-1 py-0.5 rounded text-xs ${
                                org.role === "OWNER"
                                  ? "bg-purple-100 text-purple-800"
                                  : org.role === "ADMIN"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {org.role}
                            </span>
                          </div>
                        ))}
                        {(!user.organizations ||
                          user.organizations.length === 0) && (
                          <span className="text-xs text-gray-400">
                            No organizations
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Pending Invitations</h3>
            {pendingInvitations.length === 0 ? (
              <p className="text-gray-500">No pending invitations</p>
            ) : (
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex justify-between items-center bg-gray-50 p-4 rounded"
                  >
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-gray-600">
                        Invited to {invitation.organization.name} as{" "}
                        {invitation.role}
                      </div>
                      <div className="text-xs text-gray-500">
                        Invited by {invitation.inviter.firstName}{" "}
                        {invitation.inviter.lastName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Expires{" "}
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Management Tab */}
      {activeTab === "content" && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Approved Zip Codes
              </h3>
              <Button
                onClick={() =>
                  setNewZipCode({ code: "", area: "", type: "buyer" })
                }
                className="bg-[#D4AF3D] hover:bg-[#b8932f]"
                disabled={zipCodeLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Zip Code
              </Button>
            </div>

            {/* Add New Zip Code Form */}
            <div className="mb-6 bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-lg mb-3">Add New Zip Code</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Zip Code (e.g., 77007)"
                  value={newZipCode.code}
                  onChange={(e) =>
                    setNewZipCode({ ...newZipCode, code: e.target.value })
                  }
                  maxLength={5}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Area Name (e.g., The Heights)"
                  value={newZipCode.area}
                  onChange={(e) =>
                    setNewZipCode({ ...newZipCode, area: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <select
                  value={newZipCode.type}
                  onChange={(e) =>
                    setNewZipCode({ ...newZipCode, type: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
                <Button
                  onClick={handleAddZipCode}
                  disabled={
                    zipCodeLoading || !newZipCode.code || !newZipCode.area
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {zipCodeLoading ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>

            {/* Seller Zip Codes */}
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3 text-blue-600">
                Seller Zip Codes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {zipCodes
                  .filter((zip) => zip.type === "seller")
                  .map((zip) => (
                    <div
                      key={zip.id}
                      className="bg-white rounded-lg p-3 border flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{zip.code}</span>
                        <span className="text-gray-600 ml-2">{zip.area}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingZipCode(zip)}
                          disabled={zipCodeLoading}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteZipCode(zip.id)}
                          disabled={zipCodeLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Buyer Zip Codes */}
            <div>
              <h4 className="font-semibold text-lg mb-3 text-green-600">
                Buyer Zip Codes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {zipCodes
                  .filter((zip) => zip.type === "buyer")
                  .map((zip) => (
                    <div
                      key={zip.id}
                      className="bg-white rounded-lg p-3 border flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{zip.code}</span>
                        <span className="text-gray-600 ml-2">{zip.area}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingZipCode(zip)}
                          disabled={zipCodeLoading}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteZipCode(zip.id)}
                          disabled={zipCodeLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {editingOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Organization</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Organization Name"
                value={editingOrg.name}
                onChange={(e) =>
                  setEditingOrg({ ...editingOrg, name: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
              />
              <input
                type="text"
                placeholder="Slug"
                value={editingOrg.slug}
                onChange={(e) =>
                  setEditingOrg({ ...editingOrg, slug: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
              />
              <input
                type="text"
                placeholder="Logo URL"
                value={editingOrg.logo || ""}
                onChange={(e) =>
                  setEditingOrg({ ...editingOrg, logo: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
              />
              <textarea
                placeholder="Metadata (JSON)"
                value={editingOrg.metadata || ""}
                onChange={(e) =>
                  setEditingOrg({ ...editingOrg, metadata: e.target.value })
                }
                className="border rounded px-3 py-2 w-full h-20"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleUpdateOrganization}
                className="bg-[#D4AF3D] hover:bg-[#b8932f]"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditingOrg(null)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zip Code Modal */}
      {editingZipCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Zip Code</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Zip Code"
                value={editingZipCode.code}
                onChange={(e) =>
                  setEditingZipCode({ ...editingZipCode, code: e.target.value })
                }
                maxLength={5}
                className="border rounded px-3 py-2 w-full"
              />
              <input
                type="text"
                placeholder="Area Name"
                value={editingZipCode.area}
                onChange={(e) =>
                  setEditingZipCode({ ...editingZipCode, area: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
              />
              <select
                value={editingZipCode.type}
                onChange={(e) =>
                  setEditingZipCode({ ...editingZipCode, type: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleUpdateZipCode}
                disabled={zipCodeLoading}
                className="bg-[#D4AF3D] hover:bg-[#b8932f]"
              >
                <Save className="w-4 h-4 mr-2" />
                {zipCodeLoading ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditingZipCode(null)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
