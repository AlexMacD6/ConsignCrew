"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import InventoryReceiving from "./InventoryReceiving";
import InventoryInStock from "./InventoryInStock";
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
  Truck,
  AlertCircle,
  MessageSquare,
  FileText,
  ExternalLink,
  Database,
  RefreshCw,
  Loader2,
  Info,
  Star,
  Tag,
} from "lucide-react";
import QuestionManagement from "../components/QuestionManagement";

interface User {
  id: string;
  name: string;
  email: string;
  mobilePhone?: string;
  emailVerified: boolean;
  primaryRole?: string;
  organizations?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  totalOrganizations?: number;
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

interface InventoryList {
  id: string;
  name: string;
  lotNumber?: string;
  datePurchased?: string;
  briefDescription?: string;
  createdAt: string;
  winningBidAmount?: number;
  serviceCharges?: number;
  shippingCharges?: number;
  totalPurchasePrice?: number;
  totalExtRetailValue?: number;
  msrpPercentage?: number;
  _count?: { items: number };
  totalUnits?: number;
}

interface InventoryItem {
  id: string;
  lotNumber?: string;
  itemNumber?: string;
  deptCode?: string;
  department?: string;
  description?: string;
  quantity?: number;
  unitRetail?: number;
  extRetail?: number;
  vendor?: string;
  categoryCode?: string;
  category?: string;
  purchasePrice?: number;
}

interface InventoryFinancials {
  totalExtRetailValue: number;
  totalPurchasePrice: number;
  msrpPercentage: number;
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

  // User Management states
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(
    null
  );
  const [selectedUserForOrg, setSelectedUserForOrg] = useState<User | null>(
    null
  );
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newUserRole, setNewUserRole] = useState({
    organizationId: "",
    role: "MEMBER",
  });
  const [newUserOrg, setNewUserOrg] = useState({
    organizationId: "",
    role: "MEMBER",
  });

  const [savingAiConfig, setSavingAiConfig] = useState(false);

  // System Cleanup
  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    success: boolean;
    message: string;
    releasedHolds?: number;
    cancelledOrders?: number;
    resetProcessingListings?: number;
  } | null>(null);

  // Inventory Management states
  const [inventoryLists, setInventoryLists] = useState<InventoryList[]>([]);
  const [selectedInventoryList, setSelectedInventoryList] =
    useState<InventoryList | null>(null);
  const [showCreateInventoryListModal, setShowCreateInventoryListModal] =
    useState(false);
  const [newInventoryList, setNewInventoryList] = useState({
    lotNumber: "",
    datePurchased: "",
    briefDescription: "",
    name: "",
  });
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  // New state variables for editing and viewing items
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState("");
  const [showViewItemsModal, setShowViewItemsModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [editingListData, setEditingListData] = useState({
    lotNumber: "",
    datePurchased: "",
    briefDescription: "",
    name: "",
  });
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  // New state variables for financial fields
  const [editingFinancials, setEditingFinancials] = useState<{
    winningBidAmount: string;
    serviceCharges: string;
    shippingCharges: string;
  }>({
    winningBidAmount: "",
    serviceCharges: "",
    shippingCharges: "",
  });
  const [showEditFinancialsModal, setShowEditFinancialsModal] = useState(false);
  const [selectedListForFinancials, setSelectedListForFinancials] =
    useState<InventoryList | null>(null);

  // Members modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedOrgForMembers, setSelectedOrgForMembers] =
    useState<Organization | null>(null);

  const adminModules = [
    {
      title: "Delivery Scheduler",
      description:
        "Manage order deliveries from payment to completion through the fulfillment workflow",
      icon: Clock,
      href: "/admin/delivery-scheduler",
      color: "bg-indigo-500",
      stats: "Track Orders",
    },
    {
      title: "Delivery Operations",
      description:
        "Manage driver schedules, delivery capacity, and optimize daily delivery operations",
      icon: Truck,
      href: "/admin/delivery-operations",
      color: "bg-blue-600",
      stats: "Optimize Routes",
    },
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
      title: "Review-to-Tip System",
      description:
        "Manage driver QR codes, track customer feedback, and recognize exceptional service",
      icon: Star,
      href: "/admin/review-to-tip",
      color: "bg-treasure-500",
      stats: "Active System",
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
        "Select and export listings with Facebook Shop enabled to CSV format for upload",
      icon: ExternalLink,
      href: "/admin/facebook-shop-export",
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
    {
      title: "Promo Code Management",
      description:
        "Create and manage promotional codes for discounts and special offers",
      icon: Tag,
      href: "/admin/promo-codes",
      color: "bg-purple-600",
      stats: "Manage Codes",
    },
    {
      title: "Sales Analytics",
      description:
        "Track sales performance, revenue trends, and comprehensive business metrics",
      icon: BarChart3,
      href: "/admin/sales-analytics",
      color: "bg-green-500",
      stats: "View Reports",
    },
    {
      title: "Export Data",
      description:
        "Export any database table to CSV format for analysis, backup, or migration",
      icon: Database,
      href: "/admin/export-data",
      color: "bg-cyan-500",
      stats: "Export CSV",
    },
  ];

  // Load data only when switching to a tab that needs it
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  // Track which tabs have been loaded to avoid reloading
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  const loadTabData = async (tab: string) => {
    // Skip if already loaded
    if (loadedTabs.has(tab)) return;

    try {
      setLoading(true);
      setError("");

      switch (tab) {
        case "overview":
          // Load summary data for overview
          await Promise.all([
            loadUsers(),
            loadOrganizations(),
            loadPendingQuestions(),
          ]);
          break;

        case "users":
          await loadUsers();
          break;

        case "organizations":
          await Promise.all([loadOrganizations(), loadPendingInvitations()]);
          break;

        case "settings":
          await Promise.all([loadZipCodes(), loadAiConfig()]);
          break;

        case "inventory":
          await loadInventoryLists();
          break;

        // facebook and security tabs don't need initial data
        default:
          break;
      }

      // Mark tab as loaded
      setLoadedTabs((prev) => new Set(prev).add(tab));
    } catch (err) {
      setError("Failed to load data");
      console.error("Error loading tab data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Individual data loading functions
  const loadUsers = async () => {
    const response = await fetch("/api/admin/users");
    if (response.ok) {
      const data = await response.json();
      setUsers(data.users || []);
    }
  };

  const loadOrganizations = async () => {
    const response = await fetch("/api/admin/organizations");
    if (response.ok) {
      const data = await response.json();
      setOrganizations(data.organizations || []);
    }
  };

  const loadPendingInvitations = async () => {
    const response = await fetch("/api/admin/organizations/invitations");
    if (response.ok) {
      const data = await response.json();
      setPendingInvitations(data.invitations || []);
    }
  };

  const loadZipCodes = async () => {
    const response = await fetch("/api/admin/zipcodes");
    if (response.ok) {
      const data = await response.json();
      setZipCodes(data.zipCodes || []);
    }
  };

  const loadPendingQuestions = async () => {
    const response = await fetch("/api/admin/questions");
    if (response.ok) {
      const data = await response.json();
      setPendingQuestions(data.pendingCount || 0);
    }
  };

  const loadAiConfig = async () => {
    const response = await fetch("/api/admin/ai-model-config");
    if (response.ok) {
      const data = await response.json();
      if (data.config) {
        setAiModelConfig(data.config);
      }
    }
  };

  // Legacy loadData function for use in mutation callbacks
  const reloadCurrentTab = () => {
    setLoadedTabs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(activeTab);
      return newSet;
    });
    loadTabData(activeTab);
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
        reloadCurrentTab();
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
        reloadCurrentTab();
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
        reloadCurrentTab();
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
        reloadCurrentTab();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to send invitation");
      }
    } catch (err) {
      setError("Failed to send invitation");
    }
  };

  // Inventory Management functions
  const loadInventoryLists = async () => {
    try {
      const response = await fetch("/api/admin/inventory-lists");
      if (response.ok) {
        const data = await response.json();
        // The API returns { success: true, lists: [...] }
        const lists = data.lists || [];
        setInventoryLists(Array.isArray(lists) ? lists : []);
      } else {
        console.error("Failed to load inventory lists:", response.status);
        setInventoryLists([]);
      }
    } catch (error) {
      console.error("Error loading inventory lists:", error);
      setInventoryLists([]);
    }
  };

  const handleCreateInventoryList = async () => {
    // Generate title if not already set
    const generatedTitle = generateTitle(
      newInventoryList.lotNumber,
      newInventoryList.datePurchased,
      newInventoryList.briefDescription
    );

    if (!generatedTitle.trim()) {
      setError(
        "Please provide at least one of: Lot Number, Date Purchased, or Brief Description"
      );
      return;
    }

    try {
      setIsCreatingList(true);
      setError("");
      setSuccess("");

      // Create FormData for the combined endpoint
      const formData = new FormData();
      formData.append("name", generatedTitle.trim());
      formData.append("lotNumber", newInventoryList.lotNumber);
      formData.append("datePurchased", newInventoryList.datePurchased);
      formData.append("briefDescription", newInventoryList.briefDescription);

      // Add CSV file if selected
      if (selectedCsvFile) {
        formData.append("file", selectedCsvFile);
      }

      const response = await fetch(
        "/api/admin/inventory-lists/create-with-csv",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.warning) {
          setError(data.warning); // Show warning if CSV failed but list was created
        } else {
          setSuccess(data.message || "Inventory list created successfully!");
        }

        // Reset form state
        resetCreateModal();
        loadInventoryLists();
      } else {
        setError(data.error || "Failed to create inventory list");
      }
    } catch (err) {
      setError("Failed to create inventory list");
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedCsvFile(file);
    } else if (file) {
      setError("Please select a valid CSV file");
      event.target.value = ""; // Reset file input
    }
  };

  // Update new inventory list data and auto-generate title
  const updateNewInventoryListData = (field: string, value: string) => {
    const newData = { ...newInventoryList, [field]: value };
    setNewInventoryList({
      ...newData,
      name: generateTitle(
        newData.lotNumber,
        newData.datePurchased,
        newData.briefDescription
      ),
    });
  };

  const resetCreateModal = () => {
    setNewInventoryList({
      lotNumber: "",
      datePurchased: "",
      briefDescription: "",
      name: "",
    });
    setSelectedCsvFile(null);
    setShowCreateInventoryListModal(false);
    setError("");
    setSuccess("");
  };

  const handleDeleteInventoryList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this inventory list?"))
      return;

    try {
      const response = await fetch(`/api/admin/inventory-lists/${listId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Inventory list deleted successfully!");
        loadInventoryLists();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to delete inventory list");
      }
    } catch (err) {
      setError("Failed to delete inventory list");
    }
  };

  const handleCSVUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Ensure we have a valid list ID
      const listId =
        Array.isArray(inventoryLists) && inventoryLists.length > 0
          ? inventoryLists[0].id
          : "";

      if (!listId) {
        setError(
          "Please create an inventory list first before uploading CSV files"
        );
        return;
      }

      formData.append("listId", listId);

      const response = await fetch("/api/admin/inventory/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccess("CSV uploaded successfully!");
        loadInventoryLists();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to upload CSV");
      }
    } catch (err) {
      setError("Failed to upload CSV");
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
        reloadCurrentTab();
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
        reloadCurrentTab();
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
        reloadCurrentTab();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to update user role");
      }
    } catch (err) {
      setError("Failed to update user role");
    }
  };

  const handleUpdateUserRoleNew = async () => {
    if (!selectedUserForRole) return;

    try {
      const response = await fetch(
        `/api/admin/users/${selectedUserForRole.id}/update-role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: newUserRole.organizationId,
            newRole: newUserRole.role,
          }),
        }
      );

      if (response.ok) {
        setSuccess("User role updated successfully!");
        setNewUserRole({ organizationId: "", role: "MEMBER" });
        setShowRoleModal(false);
        setSelectedUserForRole(null);
        reloadCurrentTab();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to update user role");
      }
    } catch (err) {
      setError("Failed to update user role");
    }
  };

  const handleAddUserToOrg = async () => {
    if (!selectedUserForOrg) return;

    try {
      const response = await fetch(
        `/api/admin/users/${selectedUserForOrg.id}/add-to-org`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUserOrg),
        }
      );

      if (response.ok) {
        setSuccess("User added to organization successfully!");
        setNewUserOrg({ organizationId: "", role: "MEMBER" });
        setShowOrgModal(false);
        setSelectedUserForOrg(null);
        reloadCurrentTab();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to add user to organization");
      }
    } catch (err) {
      setError("Failed to add user to organization");
    }
  };

  const handleRemoveUserFromOrg = async (
    userId: string,
    organizationId: string
  ) => {
    if (
      !confirm(
        "Are you sure you want to remove this user from the organization?"
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/remove-from-org`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId }),
        }
      );

      if (response.ok) {
        setSuccess("User removed from organization successfully!");
        reloadCurrentTab();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to remove user from organization");
      }
    } catch (err) {
      setError("Failed to remove user from organization");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      // Note: You'll need to implement the actual delete user API endpoint
      setError("Delete user functionality not yet implemented");
      // const response = await fetch(`/api/admin/users/${userId}`, {
      //   method: "DELETE",
      // });
      // if (response.ok) {
      //   setSuccess("User deleted successfully!");
      //   reloadCurrentTab();
      // } else {
      //   const error = await response.json();
      //   setError(error.error || "Failed to delete user");
      // }
    } catch (err) {
      setError("Failed to delete user");
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
        reloadCurrentTab();
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
        reloadCurrentTab();
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
        reloadCurrentTab();
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
        reloadCurrentTab();
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

  // System Cleanup function
  const handleManualCleanup = async () => {
    try {
      setCleaningUp(true);
      setCleanupResult(null);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/cleanup-expired-holds", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setCleanupResult({
          success: true,
          message: data.message,
          releasedHolds: data.releasedHolds,
          cancelledOrders: data.cancelledOrders,
          resetProcessingListings: data.resetProcessingListings,
        });
        setSuccess("System cleanup completed successfully!");
      } else {
        setCleanupResult({
          success: false,
          message: data.error || "Cleanup failed",
        });
        setError(data.error || "Failed to perform system cleanup");
      }
    } catch (error) {
      setCleanupResult({
        success: false,
        message: "Network error occurred during cleanup",
      });
      setError("Network error occurred during cleanup");
    } finally {
      setCleaningUp(false);
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

  // Function to auto-generate title from lot number, date, and description
  const generateTitle = (
    lotNumber: string,
    datePurchased: string,
    briefDescription: string
  ) => {
    const parts = [];

    // Format date as MMDDYYYY if provided
    if (datePurchased) {
      // Parse date string directly to avoid timezone issues
      const [year, month, day] = datePurchased.split("-");
      const formattedMonth = String(month).padStart(2, "0");
      const formattedDay = String(day).padStart(2, "0");
      parts.push(`${formattedMonth}${formattedDay}${year}`);
    }

    // Add lot number if provided
    if (lotNumber.trim()) {
      parts.push(lotNumber.trim());
    }

    // Add brief description if provided
    if (briefDescription.trim()) {
      parts.push(briefDescription.trim());
    }

    return parts.join(" - ");
  };

  // Update editing data and auto-generate title
  const updateEditingData = (field: string, value: string) => {
    const newData = { ...editingListData, [field]: value };
    setEditingListData({
      ...newData,
      name: generateTitle(
        newData.lotNumber,
        newData.datePurchased,
        newData.briefDescription
      ),
    });
  };

  // New functions for editing and viewing items
  const handleEditInventoryList = async () => {
    if (!editingListId || !editingListData.name.trim()) return;

    try {
      const response = await fetch(
        `/api/admin/inventory-lists/${editingListId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingListData.name.trim(),
            lotNumber: editingListData.lotNumber.trim() || null,
            datePurchased: editingListData.datePurchased
              ? new Date(editingListData.datePurchased).toISOString()
              : null,
            briefDescription: editingListData.briefDescription.trim() || null,
          }),
        }
      );

      if (response.ok) {
        setSuccess("Inventory list updated successfully!");
        setShowEditListModal(false);
        setEditingListId(null);
        setEditingListData({
          lotNumber: "",
          datePurchased: "",
          briefDescription: "",
          name: "",
        });
        loadInventoryLists();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to update inventory list");
      }
    } catch (err) {
      setError("Failed to update inventory list");
    }
  };

  const handleViewInventoryItems = async (listId: string) => {
    setSelectedInventoryList(
      inventoryLists.find((list) => list.id === listId) || null
    );
    setShowViewItemsModal(true);
    setLoadingItems(true);

    try {
      const response = await fetch(`/api/admin/inventory?listId=${listId}`);
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.items || []);
      } else {
        setError("Failed to load inventory items");
        setInventoryItems([]);
      }
    } catch (err) {
      setError("Failed to load inventory items");
      setInventoryItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const startEditInventoryList = (list: InventoryList) => {
    setEditingListId(list.id);
    setEditingListData({
      lotNumber: list.lotNumber || "",
      datePurchased: list.datePurchased ? list.datePurchased.split("T")[0] : "", // Format for date input
      briefDescription: list.briefDescription || "",
      name: list.name,
    });
    setShowEditListModal(true);
  };

  const cancelEditInventoryList = () => {
    setEditingListId(null);
    setEditingListName("");
  };

  // Financial calculation functions
  const calculateFinancials = (
    items: InventoryItem[],
    winningBid: number,
    serviceCharges: number,
    shippingCharges: number
  ): InventoryFinancials => {
    const totalExtRetailValue = items.reduce((sum, item) => {
      const extRetail = (item.unitRetail || 0) * (item.quantity || 0);
      return sum + extRetail;
    }, 0);

    const totalPurchasePrice = winningBid + serviceCharges + shippingCharges;
    const msrpPercentage =
      totalExtRetailValue > 0
        ? (totalPurchasePrice / totalExtRetailValue) * 100
        : 0;

    return {
      totalExtRetailValue,
      totalPurchasePrice,
      msrpPercentage,
    };
  };

  const calculateItemPurchasePrices = (
    items: InventoryItem[],
    msrpPercentage: number
  ): InventoryItem[] => {
    return items.map((item) => ({
      ...item,
      purchasePrice:
        ((item.unitRetail || 0) * (item.quantity || 0) * msrpPercentage) / 100,
    }));
  };

  const handleEditFinancials = async (list: InventoryList) => {
    setSelectedListForFinancials(list);
    setEditingFinancials({
      winningBidAmount: list.winningBidAmount?.toString() || "",
      serviceCharges: list.serviceCharges?.toString() || "",
      shippingCharges: list.shippingCharges?.toString() || "",
    });
    setShowEditFinancialsModal(true);

    // Load inventory items for this list to calculate financials
    try {
      const response = await fetch(`/api/admin/inventory?listId=${list.id}`);
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.items || []);
      } else {
        setError("Failed to load inventory items for financial calculations");
        setInventoryItems([]);
      }
    } catch (err) {
      setError("Failed to load inventory items for financial calculations");
      setInventoryItems([]);
    }
  };

  const handleSaveFinancials = async () => {
    if (!selectedListForFinancials) return;

    try {
      const winningBid = parseFloat(editingFinancials.winningBidAmount) || 0;
      const serviceCharges = parseFloat(editingFinancials.serviceCharges) || 0;
      const shippingCharges =
        parseFloat(editingFinancials.shippingCharges) || 0;

      // Calculate financials
      const financials = calculateFinancials(
        inventoryItems,
        winningBid,
        serviceCharges,
        shippingCharges
      );

      // Update inventory list with financial data
      const response = await fetch(
        `/api/admin/inventory-lists/${selectedListForFinancials.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winningBidAmount: winningBid,
            serviceCharges: serviceCharges,
            shippingCharges: shippingCharges,
            totalPurchasePrice: financials.totalPurchasePrice,
            totalExtRetailValue: financials.totalExtRetailValue,
            msrpPercentage: financials.msrpPercentage,
          }),
        }
      );

      if (response.ok) {
        // Update inventory items with calculated purchase prices
        const updatedItems = calculateItemPurchasePrices(
          inventoryItems,
          financials.msrpPercentage
        );

        // Batch update all items at once instead of individual requests
        try {
          const batchResponse = await fetch(
            "/api/admin/inventory/batch-update",
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                listId: selectedListForFinancials.id,
                items: updatedItems.map((item) => ({
                  id: item.id,
                  purchasePrice: item.purchasePrice,
                  extRetail: item.extRetail,
                })),
              }),
            }
          );

          if (batchResponse.ok) {
            const batchResult = await batchResponse.json();
            console.log(`Batch updated ${batchResult.updatedCount} items`);
          } else {
            console.error("Batch update failed:", batchResponse.status);
          }
        } catch (batchError) {
          console.error("Batch update error:", batchError);
        }

        setSuccess("Financial data updated successfully!");
        setShowEditFinancialsModal(false);
        setSelectedListForFinancials(null);
        loadInventoryLists();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to update financial data");
      }
    } catch (err) {
      setError("Failed to update financial data");
    }
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (percentage: number | undefined): string => {
    if (percentage === undefined || percentage === null) return "0%";
    return `${percentage.toFixed(2)}%`;
  };

  const calculateUnitPurchasePrice = (
    purchasePrice: number | undefined,
    quantity: number | undefined
  ): string => {
    if (!purchasePrice || !quantity || quantity === 0) return "N/A";
    const unitPrice = purchasePrice / quantity;
    return formatCurrency(unitPrice);
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
            <button
              onClick={() => {
                setActiveTab("inventory");
                setActiveSubTab("inventory_receiving");
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "inventory"
                  ? "border-[#D4AF3D] text-[#D4AF3D]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Inventory
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
                          Organizations
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
                                    {user.name?.[0] || "U"}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || "Unknown User"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.emailVerified
                                    ? "Verified"
                                    : "Unverified"}
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
                            <div className="space-y-1">
                              {user.organizations &&
                              user.organizations.length > 0 ? (
                                user.organizations.map((org, index) => (
                                  <div
                                    key={`${user.id}-${org.id}-${index}`} // Using user-member-index combination for unique key
                                    className="flex items-center space-x-2"
                                  >
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                      {org.name}
                                    </span>
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                      {org.role}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  No Organizations
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserForRole(user);
                                  setShowRoleModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserForOrg(user);
                                  setShowOrgModal(true);
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Building className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
              {organizations.map((org, index) => (
                <div
                  key={`${org.id}-${index}`}
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

              <div className="mt-6 space-y-8">
                {/* Buyer Zip Codes Table */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Buyer Zip Codes (
                    {zipCodes.filter((zip) => zip.type === "buyer").length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Zip Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Area
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {zipCodes.filter((zip) => zip.type === "buyer").length >
                        0 ? (
                          zipCodes
                            .filter((zip) => zip.type === "buyer")
                            .map((zip) => (
                              <tr key={zip.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {zip.code}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {zip.area || "No area specified"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
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
                                      onClick={() =>
                                        handleDeleteZipCode(zip.id)
                                      }
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                              No buyer zip codes configured
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Seller Zip Codes Table */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Seller Zip Codes (
                    {zipCodes.filter((zip) => zip.type === "seller").length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Zip Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Area
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {zipCodes.filter((zip) => zip.type === "seller")
                          .length > 0 ? (
                          zipCodes
                            .filter((zip) => zip.type === "seller")
                            .map((zip) => (
                              <tr key={zip.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {zip.code}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {zip.area || "No area specified"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
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
                                      onClick={() =>
                                        handleDeleteZipCode(zip.id)
                                      }
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                              No seller zip codes configured
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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

            {/* System Cleanup */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Cleanup
              </h3>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Automatic Cleanup:</strong> The system automatically
                    cleans up expired holds and stuck processing listings every
                    5 minutes.
                  </p>
                  <p className="mb-4">
                    <strong>Manual Cleanup:</strong> Use this button to
                    immediately clean up any stuck listings or expired holds.
                  </p>
                </div>
                <Button
                  onClick={handleManualCleanup}
                  disabled={cleaningUp}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {cleaningUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cleaning Up...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clean Up Stuck Listings
                    </>
                  )}
                </Button>
                {cleanupResult && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      cleanupResult.success
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {cleanupResult.message}
                  </div>
                )}
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

        {/* Inventory Management Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Inventory Management
            </h2>

            {/* Sub-tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSubTab("inventory_receiving")}
                  className={`px-4 py-2 rounded ${
                    activeSubTab === "inventory_receiving"
                      ? "bg-[#D4AF3D] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Receiving
                </button>
                <button
                  onClick={() => setActiveSubTab("inventory_instock")}
                  className={`px-4 py-2 rounded ${
                    activeSubTab === "inventory_instock"
                      ? "bg-[#D4AF3D] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setActiveSubTab("inventory_upload")}
                  className={`px-4 py-2 rounded ${
                    activeSubTab === "inventory_upload"
                      ? "bg-[#D4AF3D] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Data Upload
                </button>
              </div>
            </div>

            {activeSubTab === "inventory_upload" && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Inventory Lists
                      </h3>
                      <p className="text-gray-600 mt-1">
                        Create and manage your inventory lists. You can create a
                        list and upload CSV data in one step.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowCreateInventoryListModal(true)}
                      className="bg-[#D4AF3D] hover:bg-[#b8932f] text-white flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create List & Upload CSV
                    </Button>
                  </div>

                  {/* Inventory Lists Display */}
                  <div className="space-y-4">
                    {Array.isArray(inventoryLists) &&
                      inventoryLists.map((list) => (
                        <div
                          key={list.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {list.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {list._count?.items || 0} items •{" "}
                                {list.totalUnits || 0} total units • Created{" "}
                                {new Date(list.createdAt).toLocaleDateString()}
                              </p>
                              {(list.lotNumber ||
                                list.datePurchased ||
                                list.briefDescription) && (
                                <div className="mt-1 space-y-1">
                                  {list.lotNumber && (
                                    <p className="text-xs text-gray-500">
                                      <span className="font-medium">Lot:</span>{" "}
                                      {list.lotNumber}
                                    </p>
                                  )}
                                  {list.datePurchased && (
                                    <p className="text-xs text-gray-500">
                                      <span className="font-medium">
                                        Purchased:
                                      </span>{" "}
                                      {new Date(
                                        list.datePurchased
                                      ).toLocaleDateString()}
                                    </p>
                                  )}
                                  {list.briefDescription && (
                                    <p className="text-xs text-gray-500">
                                      <span className="font-medium">
                                        Description:
                                      </span>{" "}
                                      {list.briefDescription}
                                    </p>
                                  )}
                                </div>
                              )}
                              {/* Financial Summary */}
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="text-gray-500">
                                    Total Purchase:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(list.totalPurchasePrice)}
                                  </span>
                                  <span className="text-gray-500">
                                    MSRP Value:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(list.totalExtRetailValue)}
                                  </span>
                                  <span className="text-gray-500">
                                    % of MSRP:
                                  </span>
                                  <span className="font-medium">
                                    {formatPercentage(list.msrpPercentage)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="text-gray-500">
                                    Avg Unit Purchase:
                                  </span>
                                  <span className="font-medium text-purple-600">
                                    {list.totalPurchasePrice &&
                                    list.totalExtRetailValue
                                      ? `${(
                                          (list.totalPurchasePrice /
                                            list.totalExtRetailValue) *
                                          100
                                        ).toFixed(1)}% of retail per unit`
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() =>
                                  handleViewInventoryItems(list.id)
                                }
                                variant="outline"
                                size="sm"
                              >
                                View Items
                              </Button>
                              <Button
                                onClick={() => handleEditFinancials(list)}
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                              >
                                Financials
                              </Button>
                              <Button
                                onClick={() => startEditInventoryList(list)}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDeleteInventoryList(list.id)
                                }
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {(!Array.isArray(inventoryLists) ||
                      inventoryLists.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No inventory lists created yet</p>
                        <p className="text-sm">
                          Create your first list to get started
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CSV Upload Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Upload CSV Inventory
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload a CSV file to populate your inventory lists. The CSV
                    should include columns for: lot number, item number,
                    department, description, quantity, unit retail, vendor,
                    category, etc.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FileText className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Click to upload CSV file
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        or drag and drop
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeSubTab === "inventory_receiving" && <InventoryReceiving />}
            {activeSubTab === "inventory_instock" && <InventoryInStock />}
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

        {/* Create Inventory List Modal with CSV Upload */}
        {showCreateInventoryListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">
                Create Inventory List
              </h3>

              <div className="space-y-6">
                {/* List Information Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lot Number
                    </label>
                    <input
                      type="text"
                      value={newInventoryList.lotNumber}
                      onChange={(e) =>
                        updateNewInventoryListData("lotNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                      placeholder="e.g., 6098887"
                      disabled={isCreatingList}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Purchased
                    </label>
                    <input
                      type="date"
                      value={newInventoryList.datePurchased}
                      onChange={(e) =>
                        updateNewInventoryListData(
                          "datePurchased",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                      disabled={isCreatingList}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brief Description
                    </label>
                    <input
                      type="text"
                      value={newInventoryList.briefDescription}
                      onChange={(e) =>
                        updateNewInventoryListData(
                          "briefDescription",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                      placeholder="e.g., 6 Pallets of Patio Furniture"
                      disabled={isCreatingList}
                    />
                  </div>

                  {/* Generated Title Preview */}
                  {newInventoryList.name && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Generated List Name:
                      </label>
                      <p className="text-sm text-gray-900 font-medium">
                        {newInventoryList.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* CSV File Upload (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV File (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload a CSV file to populate the list immediately. You can
                    also add items later.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileSelect}
                      className="hidden"
                      id="csv-upload-modal"
                      disabled={isCreatingList}
                    />
                    <label
                      htmlFor="csv-upload-modal"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FileText className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600">
                        {selectedCsvFile
                          ? selectedCsvFile.name
                          : "Click to upload CSV file"}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        or drag and drop
                      </span>
                    </label>
                  </div>

                  {selectedCsvFile && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">
                        {selectedCsvFile.name} (
                        {(selectedCsvFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <Button
                        onClick={() => {
                          setSelectedCsvFile(null);
                          const input = document.getElementById(
                            "csv-upload-modal"
                          ) as HTMLInputElement;
                          if (input) input.value = "";
                        }}
                        variant="ghost"
                        size="sm"
                        disabled={isCreatingList}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* CSV Format Info */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    CSV Format Requirements:
                  </p>
                  <p className="text-xs text-blue-600">
                    Include columns: Lot Number, Item Number, Department, Item
                    Description, Qty, Unit Retail, Vendor, Category
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleCreateInventoryList}
                  disabled={
                    isCreatingList ||
                    (!newInventoryList.lotNumber.trim() &&
                      !newInventoryList.datePurchased.trim() &&
                      !newInventoryList.briefDescription.trim())
                  }
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white disabled:opacity-50"
                >
                  {isCreatingList ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : selectedCsvFile ? (
                    "Create List & Upload CSV"
                  ) : (
                    "Create List"
                  )}
                </Button>
                <Button
                  onClick={resetCreateModal}
                  variant="outline"
                  className="flex-1"
                  disabled={isCreatingList}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Inventory Items Modal */}
        {showViewItemsModal && selectedInventoryList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Inventory Items - {selectedInventoryList.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedInventoryList._count?.items || 0} unique items •{" "}
                    {selectedInventoryList.totalUnits || 0} total units
                  </p>
                </div>
                <Button
                  onClick={() => setShowViewItemsModal(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>

              {loadingItems ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF3D]"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  {inventoryItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                              Lot #
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                              Item #
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                              Dept Code
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                              Department
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                              Description
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                              Unit Retail
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                              Ext. Retail
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                              Vendor
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                              Cat Code
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                              Category
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                              Unit Purchase Price
                              <div className="relative group inline-block ml-1">
                                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  Total Purchase Price ÷ Quantity
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                              Total Purchase Price
                              <div className="relative group inline-block ml-1">
                                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  Total cost for all units
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {inventoryItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.lotNumber || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.itemNumber || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.deptCode || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.department || "N/A"}
                              </td>
                              <td
                                className="px-3 py-2 text-sm text-gray-900 max-w-[200px] truncate"
                                title={item.description || "N/A"}
                              >
                                {item.description || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.quantity || 0}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.unitRetail
                                  ? `$${item.unitRetail.toFixed(2)}`
                                  : "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.extRetail
                                  ? `$${item.extRetail.toFixed(2)}`
                                  : "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.vendor || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.categoryCode || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.category || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {calculateUnitPurchasePrice(
                                  item.purchasePrice,
                                  item.quantity
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {item.purchasePrice
                                  ? `$${item.purchasePrice.toFixed(2)}`
                                  : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No inventory items found</p>
                      <p className="text-sm">
                        Upload a CSV file to populate this inventory list
                      </p>
                    </div>
                  )}
                </div>
              )}
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

        {/* User Role Management Modal */}
        {showRoleModal && selectedUserForRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Update Role for {selectedUserForRole.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <select
                    value={newUserRole.organizationId}
                    onChange={(e) =>
                      setNewUserRole({
                        ...newUserRole,
                        organizationId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role
                  </label>
                  <select
                    value={newUserRole.role}
                    onChange={(e) =>
                      setNewUserRole({ ...newUserRole, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleUpdateUserRoleNew}
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  Update Role
                </Button>
                <Button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUserForRole(null);
                    setNewUserRole({ organizationId: "", role: "MEMBER" });
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

        {/* User Organization Management Modal */}
        {showOrgModal && selectedUserForOrg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Add {selectedUserForOrg.name} to Organization
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <select
                    value={newUserOrg.organizationId}
                    onChange={(e) =>
                      setNewUserOrg({
                        ...newUserOrg,
                        organizationId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={newUserOrg.role}
                    onChange={(e) =>
                      setNewUserOrg({ ...newUserOrg, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleAddUserToOrg}
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  Add to Organization
                </Button>
                <Button
                  onClick={() => {
                    setShowOrgModal(false);
                    setSelectedUserForOrg(null);
                    setNewUserOrg({ organizationId: "", role: "MEMBER" });
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

        {/* Edit Financials Modal */}
        {showEditFinancialsModal && selectedListForFinancials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Edit Financial Data - {selectedListForFinancials.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Winning Bid Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editingFinancials.winningBidAmount}
                    onChange={(e) =>
                      setEditingFinancials({
                        ...editingFinancials,
                        winningBidAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editingFinancials.serviceCharges}
                    onChange={(e) =>
                      setEditingFinancials({
                        ...editingFinancials,
                        serviceCharges: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editingFinancials.shippingCharges}
                    onChange={(e) =>
                      setEditingFinancials({
                        ...editingFinancials,
                        shippingCharges: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  />
                </div>

                {/* Calculated Values Preview */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Calculated Values:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Total Purchase Price:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          (parseFloat(editingFinancials.winningBidAmount) ||
                            0) +
                            (parseFloat(editingFinancials.serviceCharges) ||
                              0) +
                            (parseFloat(editingFinancials.shippingCharges) || 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total MSRP Value:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          inventoryItems.reduce(
                            (sum, item) =>
                              sum +
                              (item.unitRetail || 0) * (item.quantity || 0),
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">% of MSRP:</span>
                      <span className="font-medium">
                        {(() => {
                          const totalPurchase =
                            (parseFloat(editingFinancials.winningBidAmount) ||
                              0) +
                            (parseFloat(editingFinancials.serviceCharges) ||
                              0) +
                            (parseFloat(editingFinancials.shippingCharges) ||
                              0);
                          const totalMSRP = inventoryItems.reduce(
                            (sum, item) =>
                              sum +
                              (item.unitRetail || 0) * (item.quantity || 0),
                            0
                          );
                          return totalMSRP > 0
                            ? `${((totalPurchase / totalMSRP) * 100).toFixed(
                                2
                              )}%`
                            : "-";
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Unit Purchase:</span>
                      <span className="font-medium text-purple-600">
                        {(() => {
                          const totalPurchase =
                            (parseFloat(editingFinancials.winningBidAmount) ||
                              0) +
                            (parseFloat(editingFinancials.serviceCharges) ||
                              0) +
                            (parseFloat(editingFinancials.shippingCharges) ||
                              0);
                          const totalMSRP = inventoryItems.reduce(
                            (sum, item) =>
                              sum +
                              (item.unitRetail || 0) * (item.quantity || 0),
                            0
                          );
                          return totalMSRP > 0
                            ? `${((totalPurchase / totalMSRP) * 100).toFixed(
                                1
                              )}% of retail per unit`
                            : "-";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleSaveFinancials}
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  Save Financials
                </Button>
                <Button
                  onClick={() => {
                    setShowEditFinancialsModal(false);
                    setSelectedListForFinancials(null);
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

        {/* Enhanced Edit Inventory List Modal */}
        {showEditListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">
                Edit Inventory List
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Number
                  </label>
                  <input
                    type="text"
                    value={editingListData.lotNumber}
                    onChange={(e) =>
                      updateEditingData("lotNumber", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                    placeholder="e.g., 6098887"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Purchased
                  </label>
                  <input
                    type="date"
                    value={editingListData.datePurchased}
                    onChange={(e) =>
                      updateEditingData("datePurchased", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brief Description
                  </label>
                  <input
                    type="text"
                    value={editingListData.briefDescription}
                    onChange={(e) =>
                      updateEditingData("briefDescription", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF3D]"
                    placeholder="e.g., 6 Pallets of Patio Furniture"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generated Title
                  </label>
                  <input
                    type="text"
                    value={editingListData.name}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                    placeholder="Title will be auto-generated"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: MMDDYYYY - Lot Number - Description
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleEditInventoryList}
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                  disabled={!editingListData.name.trim()}
                >
                  Update List
                </Button>
                <Button
                  onClick={() => {
                    setShowEditListModal(false);
                    setEditingListId(null);
                    setEditingListData({
                      lotNumber: "",
                      datePurchased: "",
                      briefDescription: "",
                      name: "",
                    });
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

        {/* Edit Zip Code Modal */}
        {editingZipCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Zip Code</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={editingZipCode.code}
                    onChange={(e) =>
                      setEditingZipCode({
                        ...editingZipCode,
                        code: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="e.g., 77001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    value={editingZipCode.area}
                    onChange={(e) =>
                      setEditingZipCode({
                        ...editingZipCode,
                        area: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                    placeholder="e.g., Downtown Houston"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={editingZipCode.type}
                    onChange={(e) =>
                      setEditingZipCode({
                        ...editingZipCode,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleUpdateZipCode}
                  className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f] text-white"
                >
                  Update Zip Code
                </Button>
                <Button
                  onClick={() => setEditingZipCode(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
