"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface TreasureModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasure: {
    name: string;
    clue: string;
    reward: string;
    status: "active" | "found";
    image?: string | null;
    foundBy?: string | null;
    foundAt?: string | null;
  };
}

export default function TreasureModal({
  isOpen,
  onClose,
  treasure,
}: TreasureModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset flip state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, #f4d03f 0%, #f39c12 25%, #e67e22 50%, #d35400 75%, #ba4a00 100%)",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  treasure.status === "active"
                    ? "bg-white text-[#D4AF3D]"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {treasure.status === "active" ? "Active" : "Found"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Flip Card */}
            <div className="lg:w-1/2 flex justify-center">
              <motion.div
                className="relative w-80 h-80 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  {/* Front of Card - Question Mark */}
                  <motion.div
                    className="absolute w-full h-full rounded-2xl p-8"
                    style={{
                      backfaceVisibility: "hidden",
                      backgroundImage: "url('/treasure clue.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    animate={{ rotateY: isFlipped ? -180 : 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    <div className="text-center h-full flex flex-col justify-center items-center">
                      <div className="text-8xl mb-4">❓</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        Hidden Treasure
                      </h3>
                      <p className="text-gray-600 text-center">
                        Click to reveal the clue and reward!
                      </p>
                    </div>
                  </motion.div>

                  {/* Back of Card - Treasure Content */}
                  <motion.div
                    className="absolute w-full h-full rounded-2xl p-8"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundImage: "url('/treasure clue.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    animate={{ rotateY: isFlipped ? -180 : 180 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    <div className="text-center h-full flex flex-col justify-center">
                      <h4 className="text-2xl font-bold text-gray-900 mb-4">
                        {treasure.name}
                      </h4>

                      {/* Clue Section */}
                      <div className="mb-4">
                        <h5 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center">
                          <span className="text-xl mr-2">🔍</span>
                          Clue
                        </h5>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {treasure.clue}
                        </p>
                      </div>

                      {/* Reward Section */}
                      <div className="mb-4">
                        <h5 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center">
                          <span className="text-xl mr-2">🏆</span>
                          Reward
                        </h5>
                        <div className="bg-gradient-to-r from-[#D4AF3D] to-[#b8932f] rounded-lg p-3 text-white">
                          <p className="font-semibold text-base">
                            {treasure.reward}
                          </p>
                        </div>
                      </div>

                      {/* Found Info (if treasure is found) */}
                      {treasure.status === "found" && treasure.foundBy && (
                        <div className="mt-auto">
                          <h5 className="text-sm font-semibold text-gray-800 mb-1 flex items-center justify-center">
                            <span className="text-lg mr-1">✅</span>
                            Found
                          </h5>
                          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                            <p className="text-green-800 text-xs">
                              <span className="font-semibold">Found by:</span>{" "}
                              {treasure.foundBy}
                            </p>
                            {treasure.foundAt && (
                              <p className="text-green-700 text-xs mt-1">
                                <span className="font-semibold">Date:</span>{" "}
                                {treasure.foundAt}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* Side Panel */}
            <div className="lg:w-1/2 p-6 bg-white/95 backdrop-blur-sm rounded-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {isFlipped ? "Treasure Revealed!" : "Ready to Discover?"}
                </h3>
                <p className="text-gray-600">
                  {isFlipped
                    ? "You've found the treasure! Check the details on the card."
                    : "Click on the treasure map to reveal what's hidden inside!"}
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <span className="text-lg mr-2">💡</span>
                    How to Play
                  </h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Click the treasure map to flip it over</li>
                    <li>• Read the clue to find the treasure location</li>
                    <li>• Visit the location and claim your reward</li>
                    <li>• Some treasures may already be found by others</li>
                  </ul>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  {treasure.status === "active" ? (
                    <button className="w-full bg-[#D4AF3D] hover:bg-[#b8932f] text-white font-bold py-3 px-6 rounded-lg transition-colors">
                      Claim Treasure
                    </button>
                  ) : (
                    <button
                      className="w-full bg-gray-300 text-gray-600 font-bold py-3 px-6 rounded-lg cursor-not-allowed"
                      disabled
                    >
                      Already Found
                    </button>
                  )}
                </div>

                {/* Flip Again Button */}
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isFlipped ? "Flip Back" : "Flip Card"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
