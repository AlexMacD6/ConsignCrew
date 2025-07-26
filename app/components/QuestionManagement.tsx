"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  Shield,
} from "lucide-react";
import { checkAdminStatus } from "../lib/auth-utils";

interface Question {
  id: string;
  listingId: string;
  question: string;
  answer?: string;
  isApproved: boolean;
  isPublic: boolean;
  createdAt: string;
  answeredAt?: string;
  approvedAt?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  answeredBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function QuestionManagement() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit states
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadQuestions();
    }
  }, [isAdmin, statusFilter, searchTerm, currentPage]);

  const checkAdminAccess = async () => {
    try {
      const { isAdmin: userIsAdmin, user } = await checkAdminStatus();
      setIsAdmin(userIsAdmin);
      setCurrentUser(user);

      if (!userIsAdmin) {
        setError("Access denied. Admin privileges required.");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setError("Failed to verify admin access.");
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await fetch(`/api/admin/questions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setPagination(data.pagination);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to load questions");
      }
    } catch (error) {
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const res = await fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: editingQuestion.id,
          answer: answerText,
          isApproved: true,
          isPublic: true,
          answeredById: "admin", // This should come from auth context
        }),
      });

      if (res.ok) {
        const updatedQuestion = await res.json();
        setQuestions(
          questions.map((q) =>
            q.id === editingQuestion.id ? updatedQuestion : q
          )
        );
        setEditingQuestion(null);
        setAnswerText("");
        setSuccess("Question updated successfully!");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update question");
      }
    } catch (error) {
      setError("Failed to update question");
    }
  };

  const handleApproveQuestion = async (questionId: string) => {
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          isApproved: true,
          isPublic: true,
          answeredById: "admin", // This should come from auth context
        }),
      });

      if (res.ok) {
        const updatedQuestion = await res.json();
        setQuestions(
          questions.map((q) => (q.id === questionId ? updatedQuestion : q))
        );
        setSuccess("Question approved successfully!");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to approve question");
      }
    } catch (error) {
      setError("Failed to approve question");
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          isApproved: false,
          isPublic: false,
          answeredById: "admin", // This should come from auth context
        }),
      });

      if (res.ok) {
        const updatedQuestion = await res.json();
        setQuestions(
          questions.map((q) => (q.id === questionId ? updatedQuestion : q))
        );
        setSuccess("Question rejected successfully!");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to reject question");
      }
    } catch (error) {
      setError("Failed to reject question");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setQuestions(questions.filter((q) => q.id !== questionId));
        setSuccess("Question deleted successfully!");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to delete question");
      }
    } catch (error) {
      setError("Failed to delete question");
    }
  };

  const getStatusBadge = (question: Question) => {
    if (question.isApproved && question.isPublic) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>
      );
    } else if (question.answer && !question.isApproved) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading questions...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 mb-4">
          You need admin privileges to access this feature.
        </p>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
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

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search questions or listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
            >
              <option value="all">All Questions</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button
              onClick={loadQuestions}
              className="bg-[#D4AF3D] hover:bg-[#b8932f]"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No questions found
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="bg-white p-6 rounded-lg shadow border-l-4 border-[#D4AF3D]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(question)}
                    <span className="text-sm text-gray-500">
                      Listing: {question.listingId}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {question.question}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {question.createdBy.firstName}{" "}
                      {question.createdBy.lastName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!question.isApproved && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveQuestion(question.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingQuestion(question);
                      setAnswerText(question.answer || "");
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Answer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Answer Section */}
              {question.answer && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Answer:</h4>
                  <p className="text-gray-700">{question.answer}</p>
                  {question.answeredBy && (
                    <p className="text-sm text-gray-500 mt-2">
                      Answered by {question.answeredBy.firstName}{" "}
                      {question.answeredBy.lastName}
                      {question.answeredAt &&
                        ` on ${new Date(question.answeredAt).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Answer Question</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question:
                </label>
                <p className="text-gray-900 p-3 bg-gray-50 rounded border">
                  {editingQuestion.question}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer:
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent"
                  placeholder="Enter your answer..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleUpdateQuestion}
                className="bg-[#D4AF3D] hover:bg-[#b8932f]"
              >
                Save Answer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingQuestion(null);
                  setAnswerText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
