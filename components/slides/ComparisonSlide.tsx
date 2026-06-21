'use client';
import React from 'react';

interface SideData {
  label: string;
  points: string[];
}

interface ComparisonContent {
  left: SideData;
  right: SideData;
}

interface Props {
  content: ComparisonContent;
  theme: { primary: string; secondary: string; accent: string; light: string; name: string };
}

export default function ComparisonSlide({ content, theme }: Props) {
  const leftPoints = Array.isArray(content.left?.points) ? content.left.points : [];
  const rightPoints = Array.isArray(content.right?.points) ? content.right.points : [];

  return (
    <div
      dir="rtl"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        width: '100%',
        textAlign: 'right'
      }}
    >
      {/* العمود الأيمن - الجانب الأول (يستخدم primary) */}
      <div style={{
        background: `#${theme.light}`,
        border: `1px solid #${theme.primary}33`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          background: `#${theme.primary}`,
          color: 'white',
          padding: '12px 16px',
          fontWeight: '700',
          fontSize: '15px',
          fontFamily: 'Cairo',
          textAlign: 'center'
        }}>
          {content.left?.label || 'الجانب الأول'}
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {leftPoints.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: `#${theme.primary}`, fontWeight: 'bold' }}>•</span>
              <p style={{ margin: 0, color: '#2d3748', fontSize: '13px', fontFamily: 'Cairo', lineHeight: '1.6' }}>{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* العمود الأيسر - الجانب الثاني (يستخدم secondary) */}
      <div style={{
        background: `#${theme.light}`,
        border: `1px solid #${theme.secondary}33`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          background: `#${theme.secondary}`,
          color: 'white',
          padding: '12px 16px',
          fontWeight: '700',
          fontSize: '15px',
          fontFamily: 'Cairo',
          textAlign: 'center'
        }}>
          {content.right?.label || 'الجانب الثاني'}
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rightPoints.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: `#${theme.secondary}`, fontWeight: 'bold' }}>•</span>
              <p style={{ margin: 0, color: '#2d3748', fontSize: '13px', fontFamily: 'Cairo', lineHeight: '1.6' }}>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}