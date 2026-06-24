import pptxgen from 'pptxgenjs';
import { GeneratedResult, Slide } from './types';
import { THEMES, ThemeConfig } from './themes';

// ─── Convert image URL to base64 for embedding in PPTX ───────────────────────
async function toBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Pre-fetch all images in parallel ────────────────────────────────────────
async function prefetchImages(slides: Slide[]): Promise<Map<number, string>> {
  const imageMap = new Map<number, string>();

  await Promise.all(
    slides
      .filter(s => s.type === 'paragraph' && s.imageUrl)
      .map(async (slide) => {
        const base64 = await toBase64(slide.imageUrl!);
        if (base64) imageMap.set(slide.id, base64);
      })
  );

  return imageMap;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generatePPTX(
  result: GeneratedResult,
  topic: string,
  correctedTopic: string
): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';

  const T: ThemeConfig = THEMES[result.theme] || THEMES.blue;
  const WHITE = 'FFFFFF';
  const DARK = '1A1A2E';
  const GRAY = '64748B';
  const finalTopic = correctedTopic || topic;

  const imageMap = await prefetchImages(result.slides);

  addTitleSlide(pptx, T, WHITE, finalTopic, result.slides.length);
  addTOCSlide(pptx, T, WHITE, DARK, result.slides);
  result.slides.forEach((slide: Slide, i: number) =>
    addContentSlide(pptx, slide, i, T, WHITE, DARK, GRAY, finalTopic, result.slides.length, imageMap)
  );
  addThankYouSlide(pptx, T, WHITE, finalTopic);

  await pptx.writeFile({ fileName: `عرض_${finalTopic.slice(0, 25)}.pptx` });
}

// ─── Title Slide ──────────────────────────────────────────────────────────────
function addTitleSlide(pptx: pptxgen, T: ThemeConfig, WHITE: string, topic: string, count: number): void {
  const s = pptx.addSlide();
  s.background = { color: T.primary };

  s.addShape(pptx.ShapeType.rect, { x: 8.5, y: 0, w: 5, h: 7, fill: { color: T.secondary, transparency: 55 }, line: { color: T.secondary, transparency: 55 } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.6, w: '100%', h: 0.4, fill: { color: T.secondary, transparency: 30 }, line: { color: T.secondary, transparency: 30 } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.5, h: '100%', fill: { color: T.accent, transparency: 20 }, line: { color: T.accent, transparency: 20 } });

  s.addText(topic, {
    x: 0.8, y: 1.2, w: 10.5, h: 3, fontSize: 44, bold: true, color: WHITE,
    fontFace: 'Segoe UI', align: 'right', rtlMode: true, wrap: true,
    shadow: { type: 'outer', color: '000000', blur: 10, offset: 4, angle: 315, opacity: 0.4 }
  });
  s.addText('عرض تقديمي أكاديمي احترافي • مدعوم بالذكاء الاصطناعي', {
    x: 0.8, y: 4.4, w: 10.5, h: 0.6, fontSize: 16, color: T.accent,
    fontFace: 'Segoe UI', align: 'right', rtlMode: true
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 5.15, w: 10.5, h: 0.04, fill: { color: T.accent, transparency: 40 }, line: { color: T.accent, transparency: 40 } });
}

// ─── TOC Slide ────────────────────────────────────────────────────────────────
function addTOCSlide(pptx: pptxgen, T: ThemeConfig, WHITE: string, DARK: string, slides: Slide[]): void {
  const s = pptx.addSlide();
  s.background = { color: WHITE };

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.25, fill: { color: T.primary }, line: { color: T.primary } });
  s.addText('فهرس المحتويات', { x: 0.5, y: 0, w: 12.5, h: 1.25, fontSize: 30, bold: true, color: WHITE, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'middle' });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.8, w: '100%', h: 0.2, fill: { color: T.secondary }, line: { color: T.secondary } });

  const half = Math.ceil(slides.length / 2);

  slides.slice(0, half).forEach((slide: Slide, i: number) => {
    const y = 1.45 + i * 0.9;
    s.addShape(pptx.ShapeType.roundRect, { x: 6.9, y, w: 6.2, h: 0.75, fill: { color: i % 2 === 0 ? T.light : WHITE }, line: { color: T.accent, pt: 1 }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.ellipse, { x: 12.65, y: y + 0.17, w: 0.38, h: 0.38, fill: { color: T.secondary }, line: { color: T.secondary } });
    s.addText(String(i + 1).padStart(2, '0'), { x: 12.65, y: y + 0.17, w: 0.38, h: 0.38, fontSize: 10, bold: true, color: WHITE, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
    s.addText(slide.title, { x: 7.0, y, w: 5.5, h: 0.75, fontSize: 13, color: DARK, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'middle' });
  });

  slides.slice(half).forEach((slide: Slide, i: number) => {
    const y = 1.45 + i * 0.9;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y, w: 6.2, h: 0.75, fill: { color: i % 2 === 0 ? T.light : WHITE }, line: { color: T.accent, pt: 1 }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.ellipse, { x: 6.15, y: y + 0.17, w: 0.38, h: 0.38, fill: { color: T.secondary }, line: { color: T.secondary } });
    s.addText(String(i + half + 1).padStart(2, '0'), { x: 6.15, y: y + 0.17, w: 0.38, h: 0.38, fontSize: 10, bold: true, color: WHITE, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
    s.addText(slide.title, { x: 0.5, y, w: 5.5, h: 0.75, fontSize: 13, color: DARK, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'middle' });
  });
}

// ─── Content Slide ────────────────────────────────────────────────────────────
function addContentSlide(
  pptx: pptxgen, slide: Slide, index: number, T: ThemeConfig,
  WHITE: string, DARK: string, GRAY: string, topic: string,
  totalSlides: number, imageMap: Map<number, string>
): void {
  const s = pptx.addSlide();
  s.background = { color: WHITE };

  // Fixed header
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.3, fill: { color: T.primary }, line: { color: T.primary } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.22, h: 1.3, fill: { color: T.secondary }, line: { color: T.secondary } });
  s.addShape(pptx.ShapeType.roundRect, { x: 12.3, y: 0.25, w: 0.75, h: 0.65, fill: { color: T.secondary }, line: { color: T.secondary }, rectRadius: 0.08 });
  s.addText(String(index + 1).padStart(2, '0'), { x: 12.3, y: 0.25, w: 0.75, h: 0.65, fontSize: 15, bold: true, color: WHITE, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  s.addText(slide.title, { x: 0.5, y: 0.08, w: 11.6, h: 0.72, fontSize: 24, bold: true, color: WHITE, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'middle' });

  if (slide.subtitle) {
    s.addText(slide.subtitle, { x: 0.5, y: 0.82, w: 11.6, h: 0.4, fontSize: 13, color: T.accent, italic: true, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'middle' });
  }

  // Body background
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 1.3, w: '100%', h: 5.55, fill: { color: T.light }, line: { color: T.light } });

  // ── PARAGRAPH ──
  if (slide.type === 'paragraph') {
    const imageData = imageMap.get(slide.id);

    if (imageData) {
      s.addImage({ data: imageData, x: 0.4, y: 1.55, w: 4.8, h: 4.6, rounding: true });
      s.addShape(pptx.ShapeType.roundRect, { x: 5.5, y: 1.55, w: 7.3, h: 4.6, fill: { color: WHITE }, line: { color: T.accent, pt: 1 }, rectRadius: 0.1 });
      s.addShape(pptx.ShapeType.rect, { x: 12.68, y: 1.55, w: 0.12, h: 4.6, fill: { color: T.secondary }, line: { color: T.secondary } });
      s.addText(slide.mainText || '', { x: 5.65, y: 1.7, w: 6.9, h: 4.3, fontSize: 15, color: DARK, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'top', wrap: true, lineSpacingMultiple: 1.5 });
    } else {
      s.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.8, w: 12.4, h: 4.2, fill: { color: WHITE }, line: { color: T.accent, pt: 1 }, rectRadius: 0.1 });
      s.addShape(pptx.ShapeType.rect, { x: 12.8, y: 1.8, w: 0.12, h: 4.2, fill: { color: T.secondary }, line: { color: T.secondary } });
      s.addText(slide.mainText || '', { x: 0.8, y: 2.0, w: 11.8, h: 3.8, fontSize: 16, color: DARK, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'top', wrap: true, lineSpacingMultiple: 1.5 });
    }

  // ── BULLETS ──
  } else if (slide.type === 'bullets') {
    const safePoints = Array.isArray(slide.keyPoints) ? slide.keyPoints.slice(0, 4) : [];
    safePoints.forEach((point: string, i: number) => {
      const y = 1.6 + i * 1.2;
      s.addShape(pptx.ShapeType.roundRect, { x: 0.5, y, w: 12.4, h: 0.9, fill: { color: i % 2 === 0 ? T.accent : WHITE }, line: { color: T.accent, pt: 1 }, rectRadius: 0.07 });
      s.addShape(pptx.ShapeType.ellipse, { x: 12.6, y: y + 0.35, w: 0.2, h: 0.2, fill: { color: T.secondary }, line: { color: T.secondary } });
      s.addText(point, { x: 0.8, y, w: 11.6, h: 0.9, fontSize: 14, color: DARK, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'middle', wrap: true });
    });

  // ── COMPARISON ──
  } else if (slide.type === 'comparison') {
    s.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 1.8, w: 5.8, h: 4.5, fill: { color: T.light }, line: { color: T.primary, pt: 1 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.8, w: 5.8, h: 0.6, fill: { color: T.primary }, line: { color: T.primary } });
    s.addText(slide.leftSide?.label || 'الجانب الأول', { x: 6.8, y: 1.8, w: 5.8, h: 0.6, fontSize: 15, bold: true, color: WHITE, fontFace: 'Segoe UI', align: 'center', rtlMode: true, valign: 'middle' });
    const leftPoints = (slide.leftSide?.points || []).join('\n\n• ');
    s.addText(leftPoints ? '• ' + leftPoints : '', { x: 7.0, y: 2.6, w: 5.4, h: 3.5, fontSize: 13, color: DARK, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'top', wrap: true });

    s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.8, w: 5.8, h: 4.5, fill: { color: T.light }, line: { color: T.secondary, pt: 1 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 5.8, h: 0.6, fill: { color: T.secondary }, line: { color: T.secondary } });
    s.addText(slide.rightSide?.label || 'الجانب الثاني', { x: 0.8, y: 1.8, w: 5.8, h: 0.6, fontSize: 15, bold: true, color: WHITE, fontFace: 'Segoe UI', align: 'center', rtlMode: true, valign: 'middle' });
    const rightPoints = (slide.rightSide?.points || []).join('\n\n• ');
    s.addText(rightPoints ? '• ' + rightPoints : '', { x: 1.0, y: 2.6, w: 5.4, h: 3.5, fontSize: 13, color: DARK, fontFace: 'Segoe UI', align: 'right', rtlMode: true, valign: 'top', wrap: true });
  }

  // Fixed footer
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.8, w: '100%', h: 0.2, fill: { color: T.secondary }, line: { color: T.secondary } });
  s.addText(`${topic} • ${index + 1} / ${totalSlides}`, { x: 0.4, y: 6.5, w: 12.6, h: 0.28, fontSize: 10, color: GRAY, fontFace: 'Segoe UI', align: 'right', rtlMode: true });
}

// ─── Thank You Slide ──────────────────────────────────────────────────────────
function addThankYouSlide(pptx: pptxgen, T: ThemeConfig, WHITE: string, topic: string): void {
  const s = pptx.addSlide();
  s.background = { color: T.primary };

  s.addShape(pptx.ShapeType.ellipse, { x: -1.2, y: -1.2, w: 4, h: 4, fill: { color: T.secondary, transparency: 50 }, line: { color: T.secondary, transparency: 50 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 10.5, y: 4.5, w: 3.5, h: 3.5, fill: { color: T.secondary, transparency: 50 }, line: { color: T.secondary, transparency: 50 } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.25, fill: { color: T.accent, transparency: 20 }, line: { color: T.accent, transparency: 20 } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.75, w: '100%', h: 0.25, fill: { color: T.accent, transparency: 20 }, line: { color: T.accent, transparency: 20 } });

  s.addText('شكراً لاهتمامكم', { x: 0.5, y: 1.3, w: 12.5, h: 1.8, fontSize: 52, bold: true, color: WHITE, fontFace: 'Segoe UI', align: 'center', rtlMode: true });
  s.addText(topic, { x: 0.5, y: 3.2, w: 12.5, h: 1.0, fontSize: 20, color: T.accent, fontFace: 'Segoe UI', align: 'center', rtlMode: true, wrap: true });
  s.addShape(pptx.ShapeType.rect, { x: 4.2, y: 4.45, w: 4.8, h: 0.05, fill: { color: T.accent, transparency: 30 }, line: { color: T.accent, transparency: 30 } });
  s.addText('تم إنشاؤه بالذكاء الاصطناعي', { x: 0.5, y: 5.9, w: 12.5, h: 0.45, fontSize: 11, color: WHITE, fontFace: 'Segoe UI', align: 'center', rtlMode: true });
}