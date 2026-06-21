'use client';

import React from "react";

const THEME_OPTIONS = [
  { value: 'auto', label: 'تلقائي', bg: 'linear-gradient(135deg, #839958, #D3968C)' },
  { value: 'blue', label: 'أزرق', bg: '#1d4ed8' },
  { value: 'green', label: 'أخضر', bg: '#15803d' },
  { value: 'purple', label: 'بنفسجي', bg: '#7c3aed' },
  { value: 'orange', label: 'برتقالي', bg: '#ea580c' },
  { value: 'maroon', label: 'عنابي', bg: '#8A1538' },
];

interface Props {
  topic: string;
  setTopic: (v: string) => void;
  reportContent: string;
  setReportContent: (v: string) => void;
  numSlides: number;
  setNumSlides: (v: number) => void;
  selectedTheme: string;
  setSelectedTheme: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;

}

export default function InputForm({
  topic,
  setTopic,
  reportContent,
  setReportContent,
  numSlides,
  setNumSlides,
  selectedTheme,
  setSelectedTheme,
  loading,
  onSubmit,
}: Props) {

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        direction: 'rtl'
      }}
    >

      {/* TOPIC */}
      <div style={sectionStyle}>
        <label style={labelStyle}>عنوان العرض التقديمي</label>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          disabled={loading}
          placeholder="مثال: رؤية قطر 2030، الذكاء الاصطناعي في التعليم..."
          style={inputStyle}
        />
      </div>

        {/* REPORT CONTENT (optional) */}
<div style={sectionStyle}>
  <label style={labelStyle}>
     أضف نص التقرير (اختياري)
  </label>
  <textarea
    value={reportContent}
    onChange={e => setReportContent(e.target.value)}
    disabled={loading}
    rows={6}
    maxLength={20000}
    placeholder="اضف نص التقرير هنا، أو اتركه فارغا لإنشاء عرض تقديمي بناءا على العنوان"
    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
  />
  <p style={{ fontSize: '12px', color: 'rgba(247,244,213,0.5)', textAlign: 'left', direction: 'ltr', margin: 0 }}>
    {reportContent.length} / 20000
  </p>
</div>

      {/* THEME */}
      <div style={sectionStyle}>
        <label style={labelStyle}>لون العرض</label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '10px',
            width: '100%'
          }}
        >
          {THEME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedTheme(opt.value)}
              disabled={loading}
              style={{
                height: '52px',
                borderRadius: '12px',
                border: selectedTheme === opt.value ? '2px solid #F7F4D5' : '2px solid transparent',
                background: opt.bg,
                color: '#F7F4D5',
                fontSize: '15px', // ← تم التغيير من 14px إلى 15px
                fontWeight: 700,
                fontFamily: 'Cairo',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: selectedTheme === opt.value ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedTheme === opt.value
                  ? '0 0 20px rgba(247,244,213,0.2)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* SLIDER */}
      <div style={sectionStyle}>
        <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
          <span>عدد الشرائح</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #839958, #D3968C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '26px', // ← تم التغيير من 22px إلى 26px
              fontWeight: 900,
            }}
          >
            {numSlides}
          </span>
        </label>

        <input
          type="range"
          min={3}
          max={10}
          value={numSlides}
          onChange={e => setNumSlides(Number(e.target.value))}
          style={{ width: '100%', direction: 'rtl' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[3,4,5,6,7,8,9,10].map(n => (
            <span
              key={n}
              style={{
                fontSize: '13px', // ← تم التغيير من 11px إلى 13px
                color: numSlides === n ? '#839958' : 'rgba(247,244,213,0.3)',
                fontWeight: numSlides === n ? 700 : 400,
                fontFamily: 'Cairo',
                transition: 'all 0.2s',
              }}
            >
              {n}
            </span>
          ))}
        </div>

        <p
          style={{
            fontSize: '13px', // ← تم التغيير من 11px إلى 13px
            color: 'rgba(247,244,213,0.7)',
            fontFamily: 'Cairo',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(131,153,88,0.35), 0 0 20px rgba(211,150,140,0.25)',
            letterSpacing: '0.3px',
            animation: 'textGlow 2.5s ease-in-out infinite',
          }}
        >
          ستضاف شريحة للغلاف + الفهرس + الخاتمة تلقائيا · الإجمالي {numSlides + 3} شرائح
        </p>
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className={loading ? '' : 'glow-btn'}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: '14px',
          border: 'none',
          background: 'linear-gradient(135deg, #839958, #105666, #D3968C)',
          color: '#F7F4D5',
          fontSize: '18px', // ← تم التغيير من 16px إلى 18px
          fontWeight: 800,
          fontFamily: 'Cairo',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.3s',
          animation: loading ? 'none' : 'aurora 3s ease infinite, pulse-glow 2.5s ease-in-out infinite',
        }}
      >
        {loading ? 'جاري التوليد...' : 'إنشاء العرض التقديمي'}
      </button>

    </form>
  );
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  fontSize: '15px', // ← تم التغيير من 13px إلى 15px
  fontWeight: 600,
  color: 'rgba(247,244,213,0.7)',
  fontFamily: 'Cairo',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '12px',
  border: '1.5px solid rgba(247,244,213,0.12)',
  background: 'rgba(247,244,213,0.06)',
  backdropFilter: 'blur(10px)',
  color: '#F7F4D5',
  fontSize: '16px', // ← تم التغيير من 14px إلى 16px
  fontFamily: 'Cairo',
  outline: 'none',
  transition: 'all 0.2s',
};