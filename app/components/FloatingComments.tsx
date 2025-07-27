"use client";

import React, { useEffect, useState } from "react";

interface Comment {
  id: number;
  text: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

const comments = [
  "Is this available?",
  "Will you take $5?",
  "Can you drop it off at my place?",
  "What's your lowest price?",
  "Save it for me?",
  "Wanna join my crypto group?",
  "Any scratches at all?",
  "Can you meet me in San Antonio?",
];

export default function FloatingComments() {
  const [commentElements, setCommentElements] = useState<Comment[]>([]);

  useEffect(() => {
    // Generate random positions and animations for each comment
    const elements = comments.map((text, index) => ({
      id: index,
      text,
      x: Math.random() * 80 + 10, // 10% to 90% of viewport width
      y: Math.random() * 80 + 10, // 10% to 90% of viewport height
      delay: Math.random() * 3, // Random delay up to 3 seconds
      duration: 8 + Math.random() * 4, // 8-12 seconds duration (much faster)
    }));

    setCommentElements(elements);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {commentElements.map((comment) => (
        <div
          key={comment.id}
          className="absolute animate-float"
          style={{
            left: `${comment.x}%`,
            top: `${comment.y}%`,
            animationDelay: `${comment.delay}s`,
            animationDuration: `${comment.duration}s`,
          }}
        >
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg px-3 py-2 text-red-300 text-sm font-medium whitespace-nowrap">
            <span className="line-through opacity-60">{comment.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
