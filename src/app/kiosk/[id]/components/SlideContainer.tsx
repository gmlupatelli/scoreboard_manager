'use client';

import React, { useState, useEffect } from 'react';

interface SlideContainerProps {
  children: React.ReactNode;
  isTransitioning: boolean;
  isActive: boolean;
}

/**
 * SlideContainer handles smooth fade-in/fade-out transitions.
 * New slides fade in smoothly, exiting slides fade out.
 */
export default function SlideContainer({
  children,
  isTransitioning,
  isActive,
}: SlideContainerProps) {
  // Track if we should show this slide (with fade-in delay)
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive && !isTransitioning) {
      // Small delay before starting fade-in for smoother transition
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isActive) {
      setIsVisible(false);
    }
  }, [isActive, isTransitioning]);

  // Only render the active slide
  if (!isActive) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
        isTransitioning ? 'opacity-0' : isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
