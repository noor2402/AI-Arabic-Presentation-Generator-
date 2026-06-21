export type SlideType = 'paragraph' | 'bullets' | 'comparison';

export interface Slide {
  id: number;
  type: SlideType;
  title: string;
  subtitle?: string;
  icon?: string;
  mainText?: string;
  keyPoints?: string[];
  leftSide?: { label: string; points: string[] };
  rightSide?: { label: string; points: string[] };
  imageUrl?: string;
}

export interface GeneratedResult {
  correctedTopic: string;
  theme: string;
  slides: Slide[];
}