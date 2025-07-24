"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaChevronDown,
  FaChevronRight,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import { faqData } from "./faq-data";
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";

// Add type definitions at the top of the file
type FeedbackData = {
  helpful: number;
  notHelpful: number;
  userVote?: boolean;
};

type FeedbackResponse = Record<string, FeedbackData>;

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<FeedbackResponse>({});
  const [userFeedback, setUserFeedback] = useState<Record<string, boolean>>({});
  const userFeedbackRef = useRef(userFeedback);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Debug log on component mount
  useEffect(() => {
    console.log("FAQ Page mounted");
  }, []);

  // Fetch feedback counts and user votes from backend on mount
  useEffect(() => {
    async function fetchFeedback() {
      try {
        const res = await fetch("/api/faq-feedback");
        const allFeedback = (await res.json()) as FeedbackResponse;
        setFeedback(allFeedback);

        // Update user feedback state based on userVote property
        const userVotes: Record<string, boolean> = {};
        Object.entries(allFeedback).forEach(([itemId, data]) => {
          if (data.userVote !== undefined) {
            userVotes[itemId] = data.userVote;
          }
        });
        setUserFeedback(userVotes);
      } catch (error) {
        console.error("Error fetching FAQ feedback:", error);
      }
    }
    fetchFeedback();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`category-${selectedCategory}`);
        console.log("Trying to scroll to:", `category-${selectedCategory}`, el);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    userFeedbackRef.current = userFeedback;
  }, [userFeedback]);

  const handleCategoryClick = (categoryId: string) => {
    console.log("Category clicked:", categoryId);
    setSelectedCategory(categoryId);
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Voting handler: POST to backend and refresh feedback
  const handleFeedback = async (itemId: string, isHelpful: boolean) => {
    try {
      const res = await fetch("/api/faq-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqItemId: itemId, isHelpful }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit feedback");
      }

      // Refetch feedback after voting
      const feedbackRes = await fetch("/api/faq-feedback");
      const allFeedback = (await feedbackRes.json()) as FeedbackResponse;
      setFeedback(allFeedback);

      // Update user feedback state based on userVote property
      const userVotes: Record<string, boolean> = {};
      Object.entries(allFeedback).forEach(([itemId, data]) => {
        if (data.userVote !== undefined) {
          userVotes[itemId] = data.userVote;
        }
      });
      setUserFeedback(userVotes);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // You might want to show a toast notification here
    }
  };

  // Only filter by search query, not by selectedCategory
  const filteredCategories = faqData.filter((category) => {
    if (searchQuery) {
      return category.items.some(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (typeof item.answer === "string" &&
            item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
        {/* Categories Sidebar */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="space-y-2">
              {faqData.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${selectedCategory === category.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="md:col-span-3">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <div key={category.id} className="p-6 border rounded-lg">
                <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      id={`category-${category.id}`}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow mb-8 scroll-mt-60"
                    >
                      <button
                        onClick={() => {
                          setExpandedItems((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(item.id)) {
                              newSet.delete(item.id);
                            } else {
                              newSet.add(item.id);
                            }
                            return newSet;
                          });
                        }}
                        className="w-full text-left flex justify-between items-center"
                      >
                        <span className="font-medium">{item.question}</span>
                        {expandedItems.has(item.id) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      {expandedItems.has(item.id) && (
                        <div className="mt-2 pl-4">
                          <div className="text-gray-600">
                            {typeof item.answer === "string" ? (
                              <p>{item.answer}</p>
                            ) : (
                              item.answer
                            )}
                          </div>
                          <div className="mt-4 flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                              Was this helpful?
                            </span>
                            <button
                              onClick={() => handleFeedback(item.id, true)}
                              className={`flex items-center gap-2 transition-colors ${userFeedback[item.id] === true ? "text-green-600 bg-green-50 hover:bg-green-100" : "hover:bg-gray-100"}`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span>{feedback[item.id]?.helpful || 0}</span>
                            </button>
                            <button
                              onClick={() => handleFeedback(item.id, false)}
                              className={`flex items-center gap-2 transition-colors ${userFeedback[item.id] === false ? "text-red-600 bg-red-50 hover:bg-red-100" : "hover:bg-gray-100"}`}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span>{feedback[item.id]?.notHelpful || 0}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
