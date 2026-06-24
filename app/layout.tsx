import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مُولّد العروض التقديمية الاحترافي',
  description: 'منصة ذكية متطورة لتوليد وتصميم عروض الباوربوينت باللغة العربية الفصحى مدعومة بالذكاء الاصطناعي',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="theme-color" content="#0f0524" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}