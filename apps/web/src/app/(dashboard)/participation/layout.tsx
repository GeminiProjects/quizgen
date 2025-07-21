import type { Metadata } from 'next';
import type * as React from 'react';

export const metadata: Metadata = {
  title: 'QuizGen-演讲即时智能评测系统',
};

export default function ParticipationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
