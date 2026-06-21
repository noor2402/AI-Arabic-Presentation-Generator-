'use client';

import React from 'react';

interface ParagraphContent {
  text: string;
}

interface Props {
  content: ParagraphContent;
  secondary: string;
  light: string;
}

export default function ParagraphSlide({ content, secondary, light }: Props) {
  return (
    <div
      dir="rtl"
      style={{
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '28px 32px', // Increased padding
        borderRight: `6px solid #${secondary}`,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
        textAlign: 'right'
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#374151',
          fontSize: '16px', // Increased font size
          lineHeight: '1.9', // Better line height for readability
          fontFamily: 'Cairo, sans-serif',
          fontWeight: '400',
          whiteSpace: 'pre-line'
        }}
      >
        {content.text}
      </p>
    </div>
  );
}