"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import IntegratedVideoPlayer from "./IntegratedVideoPlayer";

const DemoVideoBubble: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, duration: 0.5 }}
    >
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="btn btn-floating"
        whileHover={{ scale: 1.15, x: 8, y: 8 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      </motion.button>

      {/* Expanded Video Modal */}
      <motion.div
        className={`absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden ${
          isExpanded ? "w-96 h-64" : "w-0 h-0"
        }`}
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: isExpanded ? 384 : 0,
          height: isExpanded ? 256 : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {isExpanded && (
          <div className="p-4 h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Watch Demo</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="h-48">
              <IntegratedVideoPlayer
                videoId="9hmtpNu3_Lk"
                title="TreasureHub Demo"
                aspectRatio="16/9"
                showControls={false}
                autoplay={false}
                muted={true}
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DemoVideoBubble;
