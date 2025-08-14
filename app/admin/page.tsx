"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import {
  MapPin,
  Gift,
  Users,
  BarChart3,
  Settings,
  Shield,
  ArrowRight,
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
  MessageSquare,
  FileText,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import QuestionManagement from "../components/QuestionManagement";

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
  const [pendingQuestions, setPendingQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingPriceDrops, setProcessingPriceDrops] = useState(false);

  // Facebook Catalog Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);

  const handleProcessPriceDrops = async () => {
    try {
      setProcessingPriceDrops(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/process-price-drops", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `Price drops processed successfully! ${data.result.dropped} prices dropped, ${data.result.processed} listings processed.`
        );
      } else {
        setError(data.error || "Failed to process price drops");
      }
    } catch (error) {
      setError("Failed to process price drops");
    } finally {
      setProcessingPriceDrops(false);
    }
  };

  // Zip code states
  const [zipCodes, setZipCodes] = useState<ZipCode[]>([]);
  const [editingZipCode, setEditingZipCode] = useState<ZipCode | null>(null);
  const [newZipCode, setNewZipCode] = useState({
    code: "",
    area: "",
    type: "buyer",
  });

  // Organization states
  const [newOrganization, setNewOrganization] = useState({
    name: "",
    slug: "",
    logo: "",
    metadata: "",
  });
  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);

  // Invitation states
  const [newInvitation, setNewInvitation] = useState({
    email: "",
    role: "member",
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedOrgForInvite, setSelectedOrgForInvite] =
    useState<Organization | null>(null);

  // Team states
  const [newTeam, setNewTeam] = useState({
    name: "",
  });

  // AI Model Configuration states
  const [aiModelConfig, setAiModelConfig] = useState({
    phase1Model: "gpt-4o", // Default to GPT-4o for better visual analysis
    phase2Model: "gpt-4o", // Default to GPT-4o for Phase 2
  });
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  // Members modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedOrgForMembers, setSelectedOrgForMembers] =
    useState<Organization | null>(null);

  const adminModules = [
    {
      title: "Treasure Hunt",
      description:
        "Manage treasure drops, monitor hunt activity, and track user discoveries",
      icon: MapPin,
      href: "/admin/treasure-hunt",
      color: "bg-[#D4AF3D]",
      stats: "3 Active Drops",
    },
    {
      title: "Treasure Redemptions",
      description: "View and manage treasure redemption requests and rewards",
      icon: Gift,
      href: "/admin/treasure-redemptions",
      color: "bg-green-500",
      stats: "12 Pending",
    },
    {
      title: "User Management",
      description: "Manage user accounts, permissions, and activity",
      icon: Users,
      href: "#",
      color: "bg-blue-500",
      stats: `${users.length} Users`,
      onClick: () => setActiveTab("users"),
    },
    {
      title: "Organizations",
      description: "Manage organizations, teams, and member permissions",
      icon: Building,
      href: "#",
      color: "bg-purple-500",
      stats: `${organizations.length} Organizations`,
      onClick: () => setActiveTab("organizations"),
    },
    {
      title: "System Settings",
      description:
        "Configure platform settings, integrations, and system preferences",
      icon: Settings,
      href: "#",
      color: "bg-gray-500",
      stats: "Configure",
      onClick: () => setActiveTab("settings"),
    },
    {
      title: "Security",
      description:
        "Monitor security events, manage access controls, and audit logs",
      icon: Shield,
      href: "#",
      color: "bg-red-500",
      stats: "Monitor",
      onClick: () => setActiveTab("security"),
    },
    {
      title: "Price Drops",
      description:
        "Process automatic price drops for active listings based on discount schedules",
      icon: BarChart3,
      href: "#",
      color: "bg-orange-500",
      stats: "Process",
      onClick: handleProcessPriceDrops,
    },
    {
      title: "Facebook Shop Export",
      description:
        "Export all listings with Facebook Shop enabled to CSV format for upload",
      icon: ExternalLink,
      href: "/fbshop.csv",
      color: "bg-blue-600",
      stats: "Export CSV",
    },

    {
      title: "Quality Check Management",
      description:
        "Manage quality check status for listings and display badges to buyers",
      icon: Shield,
      href: "/admin/quality-check",
      color: "bg-green-600",
      stats: "Manage",
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load users
      const usersResponse = await fetch("/api/admin/users");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Load organizations
      const orgsResponse = await fetch("/api/admin/organizations");
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganizations(orgsData.organizations || []);
      }

      // Load pending invitations
      const invitationsResponse = await fetch(
        "/api/admin/organizations/invitations"
      );
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setPendingInvitations(invitationsData.invitations || []);
      }

      // Load zip codes
      const zipCodesResponse = await fetch("/api/admin/zipcodes");
      if (zipCodesResponse.ok) {
        const zipCodesData = await zipCodesResponse.json();
        setZipCodes(zipCodesData.zipCodes || []);
      }

      // Load pending questions count
      const questionsResponse = await fetch("/api/admin/questions");
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setPendingQuestions(questionsData.pendingCount || 0);
      }

      // Load AI model configuration
      const aiConfigResponse = await fetch("/api/admin/ai-model-config");
      if (aiConfigResponse.ok) {
        const aiConfigData = await aiConfigResponse.json();
        if (aiConfigData.config) {
          setAiModelConfig(aiConfigData.config);
        }
      }
    } catch (err) {
      setError("Failed to load admin data");
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrganization),
      });

      if (response.ok) {
        setSuccess("Organization created successfully!");
        setNewOrganization({ name: "", slug: "", logo: "", metadata: "" });
        setShowCreateOrgModal(false);
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to create organization");
      }
    } catch (err) {
      setError("Failed to create organization");
    }
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrganization) return;

    try {
      const response = await fetch(
        `/api/admin/organizations/${editingOrganization.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingOrganization),
        }
      );

      if (response.ok) {
        setSuccess("Organization updated successfully!");
        setEditingOrganization(null);
        setShowEditOrgModal(false);
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to update organization");
      }
    } catch (err) {
      setError("Failed to update organization");
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm("Are you sure you want to delete this organization?")) return;

    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Organization deleted successfully!");
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to delete organization");
      }
    } catch (err) {
      setError("Failed to delete organization");
    }
  };

  const handleInviteUser = async () => {
    if (!selectedOrgForInvite) return;

    try {
      const response = await fetch(
        `/api/admin/organizations/${selectedOrgForInvite.id}/invitations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newInvitation),
        }
      );

      if (response.ok) {
        setSuccess("Invitation sent successfully!");
        setNewInvitation({ email: "", role: "member" });
        setShowInviteModal(false);
        setSelectedOrgForInvite(null);
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to send invitation");
      }
    } catch (err) {
      setError("Failed to send invitation");
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      if (response.ok) {
        setSuccess("Invitation accepted successfully!");
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to accept invitation");
      }
    } catch (err) {
      setError("Failed to accept invitation");
    }
  };

  const handleCreateTeam = async (orgId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });

      if (response.ok) {
        setSuccess("Team created successfully!");
        setNewTeam({ name: "" });
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to create team");
      }
    } catch (err) {
      setError("Failed to create team");
    }
  };

  const handleUpdateUserRole = async (
    userId: string,
    orgId: string,
    newRole: string
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/assign-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, role: newRole }),
      });

      if (response.ok) {
        setSuccess("User role updated successfully!");
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to update user role");
      }
    } catch (err) {
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
      const response = await fetch(
        `/api/admin/organizations/${orgId}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        setSuccess("User removed successfully!");
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to remove user");
      }
    } catch (err) {
      setError("Failed to remove user");
    }
  };

  const handleAddZipCode = async () => {
    try {
      const response = await fetch("/api/admin/zipcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newZipCode),
      });

      if (response.ok) {
        setSuccess("Zip code added successfully!");
        setNewZipCode({ code: "", area: "", type: "buyer" });
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to add zip code");
      }
    } catch (err) {
      setError("Failed to add zip code");
    }
  };

  const handleUpdateZipCode = async () => {
    if (!editingZipCode) return;

    try {
      const response = await fetch(`/api/admin/zipcodes/${editingZipCode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingZipCode),
      });

      if (response.ok) {
        setSuccess("Zip code updated successfully!");
        setEditingZipCode(null);
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to update zip code");
      }
    } catch (err) {
      setError("Failed to update zip code");
    }
  };

  const handleDeleteZipCode = async (zipId: string) => {
    if (!confirm("Are you sure you want to delete this zip code?")) return;

    try {
      const response = await fetch(`/api/admin/zipcodes/${zipId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Zip code deleted successfully!");
        loadData();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to delete zip code");
      }
    } catch (err) {
      setError("Failed to delete zip code");
    }
  };

  const handleSaveAiModelConfig = async () => {
    try {
      setSavingAiConfig(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/ai-model-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiModelConfig),
      });

      if (response.ok) {
        setSuccess("AI Model configuration saved successfully!");
      } else {
        const error = await response.json();
        setError(error.error || "Failed to save AI Model configuration");
      }
    } catch (error) {
      setError("Failed to save AI Model configuration");
    } finally {
      setSavingAiConfig(false);
    }
  };

  // Facebook Catalog Sync functions
  const loadSyncStats = async () => {
    try {
      const response = await fetch("/api/admin/sync-facebook-catalog", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStats(data);
      }
    } catch (error) {
      console.error("Error loading sync stats:", error);
    }
  };

  const handleFacebookSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/admin/sync-facebook-catalog", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      setSyncResult(data);
      setShowSyncModal(true);

      // Refresh sync stats after sync
      if (data.success) {
        await loadSyncStats();
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: "Network error occurred",
        message: error instanceof Error ? error.message : "Failed to sync",
      });
      setShowSyncModal(true);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF3D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your TreasureHub platform and monitor system activity
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-[#D4AF3D] text-[#D4AF3D]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-[#D4AF3D] text-[#D4AF3D]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("organizations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "organizations"
                  ? "border-[#D4AF3D] text-[#D4AF3D]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Organizations
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-[#D4AF3D] text-[#D4AF3D]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "security"
                  ? "border-[#D4AF3D] text-[#D4AF3D]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Security
            </button>
            <button
              onClick={() => {
                setActiveTab("facebook");
                loadSyncStats();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "facebook"
                  ? "border-[#D4AF3D] text-[#D4AF3D]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Facebook Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {activeTab === "overview" && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-[#D4AF3D] rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Drops
                    </p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Pending Redemptions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Organizations
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {organizations.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminModules.map((module, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg ${module.color}`}>
                          <module.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {module.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {module.stats}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>

                    <p className="text-sm text-gray-600 mt-4 mb-4">
                      {module.description}
                    </p>

                    {module.onClick ? (
                      <Button
                        onClick={module.onClick}
                        className="w-full bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                      >
                        Access Module
                      </Button>
                    ) : (
                      <Link href={module.href}>
                        <Button className="w-full bg-[#D4AF3D] hover:bg-[#b8932f] text-white">
                          Access Module
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#D4AF3D] rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        New treasure drop "Riverwalk Riddle" was created
                      </p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        User "John Doe" found "Museum District Mystery"
                      </p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        New user registration: "Jane Smith"
                      </p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                User Management
              </h2>
              <Button className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-[#D4AF3D] flex items-center justify-center">
                                  <span className="text-white font-medium">
                                    {user.firstName?.[0]}
                                    {user.lastName?.[0]}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.mobilePhone || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {user.role || "User"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "organizations" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Organizations
              </h2>
              <Button
                onClick={() => setShowCreateOrgModal(true)}
                className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {org.name}
                      </h3>
                      <p className="text-sm text-gray-500">@{org.slug}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingOrganization(org);
                          setShowEditOrgModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrganization(org.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users2 className="h-4 w-4 mr-2" />
                      {org._count?.members || 0} members
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      {org._count?.teams || 0} teams
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOrgForMembers(org);
                        setShowMembersModal(true);
                      }}
                    >
                      <Users2 className="h-4 w-4 mr-1" />
                      Members
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOrgForInvite(org);
                        setShowInviteModal(true);
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Invite
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              System Settings
            </h2>

            {/* Zip Code Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Zip Code Management
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={newZipCode.code}
                  onChange={(e) =>
                    setNewZipCode({ ...newZipCode, code: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Area"
                  value={newZipCode.area}
                  onChange={(e) =>
                    setNewZipCode({ ...newZipCode, area: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <select
                  value={newZipCode.type}
                  onChange={(e) =>
                    setNewZipCode({ ...newZipCode, type: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>

              <Button
                onClick={handleAddZipCode}
                className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Zip Code
              </Button>

              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Current Zip Codes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {zipCodes.map((zip) => (
                    <div
                      key={zip.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{zip.code}</p>
                        <p className="text-sm text-gray-500">
                          {zip.area} ({zip.type})
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingZipCode(zip)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteZipCode(zip.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Model Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Model Configuration
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure which AI models to use for different services. Changes
                take effect immediately.
              </p>

              {/* Cost Information */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Cost Control Information
                    </h4>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        <strong>GPT-4o:</strong> Standard cost, excellent visual
                        analysis, recommended for most use cases
                      </p>
                      <p>
                        <strong>GPT-5:</strong> Higher cost, advanced reasoning,
                        use only when needed for complex analysis
                      </p>
                      <p className="mt-1 text-xs">
                        💡 <strong>Tip:</strong> Start with GPT-4o and upgrade
                        to GPT-5 only if you need enhanced reasoning
                        capabilities
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* AI Service Phase 1 - Comprehensive Listing Generation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Service Phase 1
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Comprehensive listing generation and form fields
                  </p>
                  <select
                    value={aiModelConfig.phase1Model}
                    onChange={(e) =>
                      setAiModelConfig({
                        ...aiModelConfig,
                        phase1Model: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="gpt-4o">
                      GPT-4o (Default - Standard Cost, Excellent Visual
                      Analysis)
                    </option>
                    <option value="gpt-5">
                      GPT-5 (Higher Cost, Advanced Reasoning)
                    </option>
                  </select>
                </div>

                {/* AI Service Phase 2 - Staged Photo Generation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Service Phase 2
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Staged photo generation and enhancement
                  </p>
                  <select
                    value={aiModelConfig.phase2Model}
                    onChange={(e) =>
                      setAiModelConfig({
                        ...aiModelConfig,
                        phase2Model: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="gpt-4o">GPT-4o (Current API)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Current Phase 1 Model:</strong>{" "}
                    {aiModelConfig.phase1Model}
                  </p>
                  <p>
                    <strong>Current Phase 2 Model:</strong>{" "}
                    {aiModelConfig.phase2Model}
                  </p>
                </div>
                <Button
                  onClick={handleSaveAiModelConfig}
                  disabled={savingAiConfig}
                  className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  {savingAiConfig ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Question Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Question Management
              </h3>
              <QuestionManagement />
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Security & Monitoring
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Invitations
                </h3>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-gray-500">
                          {invitation.organization.name} - {invitation.role}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  ))}
                  {pendingInvitations.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No pending invitations
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Database
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Email Service
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      File Storage
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Facebook Catalog Sync Tab */}
        {activeTab === "facebook" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Facebook Catalog Sync
            </h2>

            {/* Sync Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2 text-blue-600" />
                  Total Listings
                </h3>
                <div className="text-3xl font-bold text-blue-600">
                  {syncStats?.totalListings || 0}
                </div>
                <p className="text-gray-600">Facebook Shop enabled</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Synced
                </h3>
                <div className="text-3xl font-bold text-green-600">
                  {syncStats?.syncedListings || 0}
                </div>
                <p className="text-gray-600">Successfully synced to catalog</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                  Pending
                </h3>
                <div className="text-3xl font-bold text-orange-600">
                  {syncStats?.pendingListings || 0}
                </div>
                <p className="text-gray-600">Require manual sync</p>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Facebook Catalog Sync
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Sync existing listings to Facebook catalog for Meta Commerce
                    Manager integration
                  </p>
                </div>
                <Button
                  onClick={handleFacebookSync}
                  disabled={isSyncing}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
              </div>

              {/* Environment Status */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Environment Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">META_ACCESS_TOKEN</span>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Required for Meta API access
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">META_CATALOG_ID</span>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Target Facebook product catalog
                    </p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  How It Works
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • Syncs existing listings with Facebook Shop enabled to your
                    catalog
                  </li>
                  <li>
                    • Updates product information including images, prices, and
                    availability
                  </li>
                  <li>
                    • Enables ViewContent and AddToWishlist events to match
                    properly
                  </li>
                  <li>
                    • New listings auto-sync when created (if environment is
                    configured)
                  </li>
                </ul>
              </div>

              {/* External Links */}
              <div className="mt-6 flex gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() =>
                    window.open(
                      "https://business.facebook.com/commerce/",
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                  Facebook Commerce Manager
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() =>
                    window.open(
                      "https://developers.facebook.com/docs/marketing-api/catalog",
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                  Catalog API Documentation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Organization Modal */}
        {showCreateOrgModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Create Organization
              </h3>
              <div className="space-y-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Organization Slug"
                  value={newOrganization.slug}
                  onChange={(e) =>
                    setNewOrganization({
                      ...newOrganization,
                      slug: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <textarea
                  placeholder="Metadata (optional)"
                  value={newOrganization.metadata}
                  onChange={(e) =>
                    setNewOrganization({
                      ...newOrganization,
                      metadata: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleCreateOrganization}
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  Create
                </Button>
                <Button
                  onClick={() => setShowCreateOrgModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Organization Modal */}
        {showEditOrgModal && editingOrganization && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Organization</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Organization Name"
                  value={editingOrganization.name}
                  onChange={(e) =>
                    setEditingOrganization({
                      ...editingOrganization,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Organization Slug"
                  value={editingOrganization.slug}
                  onChange={(e) =>
                    setEditingOrganization({
                      ...editingOrganization,
                      slug: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Logo URL (optional)"
                  value={editingOrganization.logo || ""}
                  onChange={(e) =>
                    setEditingOrganization({
                      ...editingOrganization,
                      logo: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <textarea
                  placeholder="Metadata (optional)"
                  value={editingOrganization.metadata || ""}
                  onChange={(e) =>
                    setEditingOrganization({
                      ...editingOrganization,
                      metadata: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleUpdateOrganization}
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  Update
                </Button>
                <Button
                  onClick={() => {
                    setShowEditOrgModal(false);
                    setEditingOrganization(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Invite User Modal */}
        {showInviteModal && selectedOrgForInvite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Invite User to {selectedOrgForInvite.name}
              </h3>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newInvitation.email}
                  onChange={(e) =>
                    setNewInvitation({
                      ...newInvitation,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                />
                <select
                  value={newInvitation.role}
                  onChange={(e) =>
                    setNewInvitation({ ...newInvitation, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleInviteUser}
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  Send Invitation
                </Button>
                <Button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedOrgForInvite(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && selectedOrgForMembers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                Members of {selectedOrgForMembers.name}
              </h3>
              <div className="space-y-3">
                {selectedOrgForMembers.members?.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {member.user?.name || member.user?.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.user?.email}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          member.role === "OWNER"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "ADMIN"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {member.role}
                      </span>
                      {member.role !== "OWNER" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRemoveUser(
                              member.user.id,
                              selectedOrgForMembers.id
                            )
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(!selectedOrgForMembers.members ||
                  selectedOrgForMembers.members.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No members found
                  </p>
                )}
              </div>
              <div className="mt-6">
                <Button
                  onClick={() => {
                    setShowMembersModal(false);
                    setSelectedOrgForMembers(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Facebook Catalog Sync Result Modal */}
        {showSyncModal && syncResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      syncResult.success ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {syncResult.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Facebook Catalog Sync
                  </h2>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {syncResult.success ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">
                        ✅ Sync Completed Successfully!
                      </h3>
                      <p className="text-green-700">
                        {syncResult.message ||
                          "Facebook catalog sync completed"}
                      </p>
                    </div>

                    {syncResult.processed !== undefined && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {syncResult.processed}
                          </div>
                          <div className="text-sm text-blue-600">
                            Total Processed
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {syncResult.synced}
                          </div>
                          <div className="text-sm text-green-600">
                            Successfully Synced
                          </div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {syncResult.errors}
                          </div>
                          <div className="text-sm text-red-600">Errors</div>
                        </div>
                      </div>
                    )}

                    {syncResult.errorDetails &&
                      syncResult.errorDetails.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Error Details:
                          </h4>
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
                            {syncResult.errorDetails.map(
                              (detail: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 border-b border-gray-100 last:border-b-0 bg-red-50"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">
                                      {detail.itemId}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                                      Error
                                    </span>
                                  </div>
                                  <div className="text-xs text-red-600 mt-1">
                                    {detail.error}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 mb-2">
                        ❌ Sync Failed
                      </h3>
                      <p className="text-red-700">
                        {syncResult.message || "An error occurred during sync"}
                      </p>
                      {syncResult.error && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {syncResult.error}
                        </p>
                      )}
                    </div>

                    {syncResult.missingVars && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">
                          Missing Environment Variables:
                        </h4>
                        <ul className="list-disc list-inside text-yellow-700">
                          {syncResult.missingVars.map(
                            (varName: string, index: number) => (
                              <li key={index}>
                                <code>{varName}</code>
                              </li>
                            )
                          )}
                        </ul>
                        <p className="text-sm text-yellow-600 mt-2">
                          Please configure these environment variables in your
                          production environment.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setShowSyncModal(false)}
                    className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
