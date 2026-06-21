'use client';

import React from 'react';

interface BulletsContent {
  bullets: string[];
}

interface Props {
  content: BulletsContent;
  accent: string;
}

export default function BulletsSlide({ content, accent }: Props) {
  const list = Array.isArray(content.bullets) ? content.bullets : [];

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        textAlign: 'right'
      }}
    >
      {list.map((bullet, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '14px',
            padding: '16px 20px',
            borderRadius: '12px',
            background: idx % 2 === 0 ? `rgba(255, 255, 255, 0.7)` : '#ffffff',
            border: `1px solid #${accent}44`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease'
          }}
        >
          {/* نقطة التعداد الرقمية المصممة بعناية */}
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            flexShrink: 0
          }}>
            {idx + 1}
          </div>

          <p style={{
            margin: 0,
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '1.6',
            fontFamily: 'Cairo, sans-serif',
            flex: 1
          }}>
            {bullet}
          </p>
        </div>
      ))}
    </div>
  );
}