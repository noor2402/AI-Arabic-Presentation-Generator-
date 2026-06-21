import { useEffect } from 'react';

export default function useScrollReveal(dep?: unknown) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      }),
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach(el => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(40px)';
      (el as HTMLElement).style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [dep]);
}