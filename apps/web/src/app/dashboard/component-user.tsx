'use client';

import type { SessionResponse } from '@repo/auth';
import Image from 'next/image';

export default function ComponentUser({
  session,
}: {
  session: SessionResponse;
}) {
  if (!session.user.image) {
    return null;
  }

  return (
    <div>
      <Image
        alt={session.user.name}
        height={100}
        src={session.user.image}
        width={100}
      />
      <p>{session.user.name}</p>
      <p>{session.user.email}</p>
    </div>
  );
}
