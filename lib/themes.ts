export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  name: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  blue: { primary: '0F2D5E', secondary: '1A56A0', accent: 'C5D9F5', light: 'EBF3FF', name: 'أزرق' },
  green: { primary: '0A3D24', secondary: '1A7A47', accent: 'B8EDD4', light: 'E8F8EF', name: 'أخضر' },
  purple: { primary: '2D1060', secondary: '6022B8', accent: 'DDD0F8', light: 'F3EEFF', name: 'بنفسجي' },
  orange: { primary: '5C1A04', secondary: 'C44A0A', accent: 'FAD4B8', light: 'FEF0E6', name: 'برتقالي' },
  maroon: { primary: '8A1538', secondary: 'A32B4F', accent: 'FAD4D8', light: 'FFF0F3', name: 'عنابي' },
};