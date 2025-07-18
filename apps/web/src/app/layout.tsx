import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@repo/ui/globals.css';
import { Toaster } from '@repo/ui/components/sonner';
import { SWRProvider } from '@/components/swr-provider';
import { ThemeProvider } from '@/components/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
          <SWRProvider>
            <div className="mx-auto max-w-7xl">{children}</div>
            <Toaster />
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
