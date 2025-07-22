import { Toaster } from '@repo/ui/components/sonner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/components/theme-provider';
import '@repo/ui/globals.css';

const geistSans = localFont({
  src: '../../public/fonts/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: '../../public/fonts/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QuizGen - 演讲即时智能评测系统',
  description:
    'AI赋能的演讲即时智能评测系统，演讲者一键生成问答题，听众实时互动答题，组织者统计教学效果。',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <div className="mx-auto max-w-7xl">{children}</div>
          <Toaster />
        </ThemeProvider>

        {/* 统计和性能分析 */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
