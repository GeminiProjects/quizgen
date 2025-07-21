import type { Metadata } from 'next';
import type * as React from 'react';

export const metadata: Metadata = {
  title: '我参与',
};

export default function ParticipationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
