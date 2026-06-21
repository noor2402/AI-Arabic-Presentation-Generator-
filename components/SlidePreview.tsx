import { Slide } from '@/lib/types';
import BulletsSlide from './slides/BulletsSlide';
import ComparisonSlide from './slides/ComparisonSlide';
import ParagraphSlide from './slides/ParagraphSlide';

interface Props {
  slide: Slide;
  theme: { primary: string; secondary: string; accent: string; light: string; name: string };
}

export default function SlidePreview({ slide, theme }: Props) {

  // دالة اختيار وحقن المكوّن المناسب ديناميكياً بحسب نوع الشريحة
  const renderSlideBody = () => {
    switch (slide.type) {
      case 'paragraph':
        return (
          <ParagraphSlide
            content={{ text: slide.mainText || 'لا يوجد نص تحليلي متوفر حالياً.' }}
            secondary={theme.secondary}
            light={theme.light}
          />
        );

      case 'bullets':
        return (
          <BulletsSlide
            content={{ bullets: slide.keyPoints || [] }}
            accent={theme.accent}
          />
        );


      case 'comparison':
        return (
          <ComparisonSlide
            content={{
              left: {
                label: slide.leftSide?.label || 'الجانب الأول',
                points: slide.leftSide?.points || []
              },
              right: {
                label: slide.rightSide?.label || 'الجانب الثاني',
                points: slide.rightSide?.points || []
              }
            }}
            theme={theme}
          />
        );

      default:
        return <div className="text-center p-4 text-gray-400">نمط الشريحة غير معروف.</div>;
    }
  };

  return (
    <div dir="rtl" style={{ textAlign: 'right' }}>
      {/* Header العرض التقديمي */}
      <div style={{
        padding: '18px 24px',
        background: `linear-gradient(135deg, #${theme.primary}, #${theme.secondary})`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        <span style={{ fontSize: '22px' }}>{slide.icon || "📄"}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '18px', fontFamily: 'Cairo' }}>
            {slide.title}
          </span>
          {slide.subtitle && (
            <span style={{ color: `#${theme.accent}`, fontSize: '12px', fontFamily: 'Cairo', marginTop: '2px' }}>
              {slide.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Content الجسم الخاص بالشريحة */}
      <div style={{ background: `#${theme.light}`, padding: '24px' }}>
        {renderSlideBody()}
      </div>
    </div>
  );
}