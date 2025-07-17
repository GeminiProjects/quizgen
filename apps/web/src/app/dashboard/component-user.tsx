// 示例组件，可以删除、重构
'use client';

import type { SessionResponse } from '@repo/auth';
import Image from 'next/image';

export default function ComponentUser({
  session,
}: {
  session: SessionResponse;
}) {
  return (
    <div>
      {session.user.image && (
        <Image
          alt={session.user.name}
          height={100}
          src={session.user.image}
          width={100}
        />
      )}
      <p>{session.user.name}</p>
      <p>{session.user.email}</p>
    </div>
  );
}
