'use client';

import React from 'react';

interface AmberOverlayProps {
  percent: number; // 0 to 100
}

export default function AmberOverlay({ percent }: AmberOverlayProps) {
  if (!percent || percent <= 0) return null;

  // Calculate opacity (max out around 0.55 for readability)
  const opacity = Math.min(0.65, (percent / 100) * 0.7);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-200"
      style={{
        backgroundColor: '#d97706', // Warm amber
        mixBlendMode: 'multiply',
        opacity: opacity,
      }}
      aria-hidden="true"
    />
  );
}
