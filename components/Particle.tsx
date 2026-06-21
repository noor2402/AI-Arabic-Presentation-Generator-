'use client';

import React from 'react';

const COLORS = ['#839958', '#D3968C', '#F7F4D5', '#105666'];
const SIZES = [2, 3, 4, 5, 6];

export default function Particle({ index }: { index: number }) {
  const size = SIZES[index % SIZES.length];
  const color = COLORS[index % COLORS.length];

  return (
    <div
      style={{
        position: 'absolute',
        left: `${(index * 5.7) % 100}%`,
        bottom: '-30px',

        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',

        background: color,
        opacity: 0.85,

        boxShadow: 'none',

        pointerEvents: 'none',
        zIndex: 0,

        animation: `
          particle-float ${12 + (index % 10)}s linear infinite
        `,

        animationDelay: `
          ${(index * 0.6) % 8}s,
          ${(index * 0.2) % 3}s
        `,

      }}
    />
  );
}