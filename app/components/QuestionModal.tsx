"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X, MessageSquare, Send } from "lucide-react";
import { checkAdminStatus } from "../lib/auth-utils";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle?: string;
  userId?: string;
}

export default function QuestionModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  userId,
}: QuestionModalProps) {
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      checkCurrentUser();
    }
  }, [isOpen]);

  const checkCurrentUser = async () => {
    try {
      const { user } = await checkAdminStatus();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error checking current user:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    // Use currentUser.id if available, otherwise fall back to userId prop
    const actualUserId = currentUser?.id || userId;

    if (!actualUserId) {
      setError("You must be logged in to ask a question");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          question: question.trim(),
          createdById: actualUserId,
        }),
      });

      if (res.ok) {
        setSuccess("Your question has been submitted successfully!");
        setQuestion("");
        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to submit question");
      }
    } catch (error) {
      setError("Failed to submit question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setQuestion("");
      setError("");
      setSuccess("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#D4AF3D]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Ask a Question
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          {/* Listing Info */}
          {listingTitle && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">About this listing:</p>
              <p className="font-medium text-gray-900">{listingTitle}</p>
            </div>
          )}

          {/* Question Input */}
          <div>
            <label
              htmlFor="question"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Question *
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent resize-none"
              placeholder="Ask about the item's condition, dimensions, availability, or any other details..."
              disabled={loading}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Your question will be reviewed before being published
              </p>
              <span className="text-xs text-gray-400">
                {question.length}/500
              </span>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Guidelines:</strong> Be specific and respectful. Questions
              about pricing, condition, and availability are most helpful.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
            className="flex-1 bg-[#D4AF3D] hover:bg-[#b8932f]"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Question
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
