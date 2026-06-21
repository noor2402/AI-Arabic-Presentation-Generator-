'use client';

import { useState, useEffect } from 'react';

export default function TypingHeadline() {
  const [text, setText]           = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const fullText = "أنشئ عروضاً احترافية باللغة العربية";

    const handleType = () => {
      const currentText = isDeleting
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1);

      setText(currentText);
      setTypingSpeed(isDeleting ? 50 : 150);

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentText === '') {
        setIsDeleting(false);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, typingSpeed]);

  return (
    <h1
      style={{
        fontSize: 'clamp(36px, 6vw, 72px)',
        fontWeight: '900',
        lineHeight: '1.2',
        marginBottom: '16px',
        color: '#F7F4D5',
      }}
    >
      <span style={{ borderLeft: '2px solid #F7F4D5', paddingLeft: '8px' }}>
        {text.substring(0, 20)}
        <span style={{ color: '#D3968C' }}>
          {text.substring(20)}
        </span>
      </span>
    </h1>
  );
}