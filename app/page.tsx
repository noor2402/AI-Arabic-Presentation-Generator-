'use client';

import { useState, useEffect, useRef } from 'react';
import { GeneratedResult } from '@/lib/types';
import { THEMES } from '@/lib/themes';
import { generatePPTX } from '@/lib/pptxGenerator';
import InputForm from '@/components/InputForm';
import SlidePreview from '@/components/SlidePreview';
import AnimatedLogo from '@/components/AnimatedLogo';
import Particle from '@/components/Particle';
import SlideCard from '@/components/SlideCard';
import TypingHeadline from '@/components/TypingHeadline'; // ← new
import useScrollReveal from '@/hooks/useScrollReveal';

export default function Home() {
  const [topic, setTopic]               = useState('');
  const [numSlides, setNumSlides]       = useState(5);
  const [result, setResult]             = useState<GeneratedResult | null>(null);
  const [loading, setLoading]           = useState(false);
  const [downloading, setDownloading]   = useState(false);
  const [error, setError]               = useState('');
  const [correctedTopic, setCorrectedTopic] = useState('');
  const [selectedTheme, setSelectedTheme]   = useState('auto');
  const [reportContent, setReportContent]   = useState('');
  const [file, setFile]                 = useState<File | null>(null);

  // ← typing state removed entirely (now lives in TypingHeadline)

  const resultsRef = useRef<HTMLDivElement>(null);
  const theme      = result ? (THEMES[result.theme] || THEMES.blue) : THEMES.blue;
  const totalSlides = (result?.slides?.length || numSlides) + 3;

  useScrollReveal();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const scrollAmount = window.innerHeight * 0.7;

        if (event.key === 'ArrowDown') {
          if (result && resultsRef.current && window.scrollY < 100) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          }
        } else {
          window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result]);

  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [result]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setCorrectedTopic('');

    if (!topic.trim() && !reportContent.trim()) {
      setError('الرجاء إدخال موضوع العرض أولاً.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, numSlides, selectedTheme, reportContent }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء المعالجة.');

      setResult(data.result);
      if (data.result.correctedTopic !== topic) {
        setCorrectedTopic(data.result.correctedTopic);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      await generatePPTX(result, topic, correctedTopic);
    } catch {
      setError('حدث خطأ أثناء إنشاء ملف PowerPoint.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#0A3323',
        fontFamily: 'Cairo, sans-serif',
        position: 'relative',
        // ← overflowX: 'hidden' removed here (moved to globals.css)
        color: '#F7F4D5',
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 20% 0%, rgba(211,150,140,0.22), transparent 55%), radial-gradient(circle at 80% 10%, rgba(131,153,88,0.20), transparent 60%), radial-gradient(circle at 50% 100%, rgba(16,86,102,0.28), transparent 55%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <AnimatedLogo />
      </div>

      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px 5vw 60px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '56px', width: '100%' }}>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(211,150,140,0.18)',
              border: '1px solid rgba(211,150,140,0.35)',
              borderRadius: '99px',
              padding: '6px 18px',
              fontSize: '12px',
              color: '#D3968C',
              marginBottom: '24px',
            }}
          >
            مدعوم بالذكاء الاصطناعي
          </div>

          {/* ← replaced the h1 + typing logic with the isolated component */}
          <TypingHeadline />

          <p
            style={{
              fontSize: 'clamp(14px, 2vw, 18px)',
              color: 'rgba(247,244,213,0.75)',
              maxWidth: '520px',
              margin: '0 auto',
              lineHeight: '1.7',
              wordBreak: 'keep-all',
            }}
          >
            حول أفكارك إلى عروض احترافية غنية بالمحتوى
          </p>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: '1100px',
            background: 'rgba(16,86,102,0.22)',
            backdropFilter: 'blur(26px)',
            border: '1px solid rgba(247,244,213,0.18)',
            borderRadius: '24px',
            padding: 'clamp(28px, 4vw, 52px)',
            zIndex: 2,
            margin: '0 auto',
          }}
        >
          <InputForm
            topic={topic} setTopic={setTopic}
            reportContent={reportContent}
            setReportContent={setReportContent}
            numSlides={numSlides}
            setNumSlides={setNumSlides}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
            loading={loading}
            onSubmit={handleGenerate}
          />

          {error && (
            <div style={{ marginTop: '16px', color: '#F7F4D5' }}>
              {error}
            </div>
          )}
        </div>
      </section>

      {result && (
        <section
          ref={resultsRef}
          style={{ padding: '0 5vw 80px', position: 'relative', zIndex: 1 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '1100px', margin: '0 auto 24px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700' }}>
                {result.correctedTopic}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '4px' }}>
                {totalSlides} شرائح
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                cursor: downloading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #839958, #105666, #D3968C)',
                color: '#F7F4D5',
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: 'Cairo',
                boxShadow: '0 0 20px rgba(211,150,140,0.25)',
                transition: 'all 0.2s ease',
                opacity: downloading ? 0.7 : 1,
              }}
            >
              {downloading ? 'جاري التحميل...' : 'تحميل العرض'}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px',
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            {result.slides.map((slide, index) => (
              <SlideCard key={index} label={`الشريحة ${index + 1}`} delay={index}>
                <SlidePreview slide={slide} theme={theme} />
              </SlideCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}