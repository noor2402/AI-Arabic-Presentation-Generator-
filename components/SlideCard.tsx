'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SlideCard({
  label,
  children,
  delay,
}: {
  label: string;
  children: React.ReactNode;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      {
        threshold: 0.15,
      }
    );

    if (ref.current) obs.observe(ref.current);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0px) scale(1)'
          : 'translateY(30px) scale(0.98)',
        transition: `all 0.6s ease ${delay * 0.08}s`,
        willChange: 'transform, opacity',
      }}
    >
      {/* LABEL */}
      <div
        style={{
          fontSize: '11px',
          color: 'rgba(247,244,213,0.45)',
          marginBottom: '8px',
          fontFamily: 'Cairo, sans-serif',
          letterSpacing: '0.3px',
        }}
      >
        {label}
      </div>

      {/* CARD */}
      <div
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.transform = 'translateY(-6px)' ;
          el.style.boxShadow = '0 25px 60px rgba(131,153,88,0.25)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';
        }}
        style={{
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid rgba(247,244,213,0.10)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {children}
      </div>
    </div>
  );
}