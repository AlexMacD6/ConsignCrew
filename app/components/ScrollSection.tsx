"use client";

import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  animationType?:
    | "fadeInUp"
    | "fadeInLeft"
    | "fadeInRight"
    | "scaleIn"
    | "none";
  threshold?: number;
  delay?: number;
  stagger?: boolean;
  staggerIndex?: number;
}

export default function ScrollSection({
  children,
  className = "",
  animationType = "fadeInUp",
  threshold = 0.1,
  delay = 0,
  stagger = false,
  staggerIndex = 0,
}: ScrollSectionProps) {
  const { ref, inView } = useInView({
    threshold,
    rootMargin: "-50px 0px",
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [inView, hasAnimated]);

  const getAnimationClasses = () => {
    if (!hasAnimated) {
      return "opacity-0";
    }

    const baseClasses = "transition-all duration-1000 ease-out";
    const animationClasses = {
      fadeInUp: "animate-fade-in-up",
      fadeInLeft: "animate-fade-in-left",
      fadeInRight: "animate-fade-in-right",
      scaleIn: "animate-scale-in",
      none: "",
    };

    const staggerClass = stagger
      ? `stagger-${Math.min(staggerIndex + 1, 5)}`
      : "";

    return `${baseClasses} ${animationClasses[animationType]} ${staggerClass}`;
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClasses()} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
