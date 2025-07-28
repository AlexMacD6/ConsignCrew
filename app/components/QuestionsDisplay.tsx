"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { MessageSquare, User, Calendar, CheckCircle } from "lucide-react";
import QuestionModal from "./QuestionModal";
import { checkAdminStatus } from "../lib/auth-utils";

interface Question {
  id: string;
  question: string;
  answer?: string;
  isApproved: boolean;
  isPublic: boolean;
  createdAt: string;
  answeredAt?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  answeredBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface QuestionsDisplayProps {
  listingId: string;
  listingTitle?: string;
  userId?: string;
  isAdmin?: boolean;
}

export default function QuestionsDisplay({
  listingId,
  listingTitle,
  userId,
  isAdmin = false,
}: QuestionsDisplayProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkUserAdminStatus();
    loadQuestions();
  }, [listingId]);

  const checkUserAdminStatus = async () => {
    try {
      const { isAdmin: userIsAdmin, user } = await checkAdminStatus();
      setCurrentUserIsAdmin(userIsAdmin);
      setCurrentUser(user);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setCurrentUserIsAdmin(false);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      // Use the actual admin status from authentication
      const actualIsAdmin = currentUserIsAdmin || isAdmin;

      const params = new URLSearchParams({
        listingId,
        isAdmin: actualIsAdmin.toString(),
      });

      const res = await fetch(`/api/questions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
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

  const handleQuestionSubmitted = () => {
    // Reload questions after a new one is submitted
    loadQuestions();
  };

  const approvedQuestions = questions.filter((q) => q.isApproved && q.isPublic);
  const pendingQuestions = questions.filter((q) => !q.isApproved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#D4AF3D]" />
          <h3 className="text-lg font-semibold text-gray-900">
            Questions & Answers
          </h3>
          {approvedQuestions.length > 0 && (
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {approvedQuestions.length}
            </span>
          )}
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#D4AF3D] hover:bg-[#b8932f]"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Ask a Question
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 text-gray-500">
          Loading questions...
        </div>
      )}

      {/* Approved Questions */}
      {!loading && approvedQuestions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Answered Questions
          </h4>
          {approvedQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {question.createdBy.firstName} {question.createdBy.lastName}
                  </span>
                  <span className="text-sm text-gray-500">asked:</span>
                </div>
                <p className="text-gray-900 font-medium">{question.question}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {question.answer && (
                <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-[#D4AF3D]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-[#D4AF3D]" />
                    <span className="text-sm font-medium text-gray-900">
                      Answer
                    </span>
                    {question.answeredBy && (
                      <span className="text-sm text-gray-600">
                        by {question.answeredBy.firstName}{" "}
                        {question.answeredBy.lastName}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">{question.answer}</p>
                  {question.answeredAt && (
                    <div className="flex items-center gap-1 mt-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(question.answeredAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pending Questions (for admins or question creators) */}
      {!loading &&
        (currentUserIsAdmin || isAdmin) &&
        pendingQuestions.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Pending Questions</h4>
            {pendingQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {question.createdBy.firstName} {question.createdBy.lastName}
                  </span>
                  <span className="text-sm text-gray-500">asked:</span>
                </div>
                <p className="text-gray-900">{question.question}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-yellow-600 font-medium">
                    • Pending approval
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* No Questions State */}
      {!loading && approvedQuestions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            No questions yet
          </p>
          <p className="text-gray-600 mb-4">
            Be the first to ask a question about this item!
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#D4AF3D] hover:bg-[#b8932f]"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask a Question
          </Button>
        </div>
      )}

      {/* Question Modal */}
      <QuestionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        listingId={listingId}
        listingTitle={listingTitle}
        userId={userId}
      />
    </div>
  );
}
