import { NextResponse } from 'next/server';

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return NextResponse.json({ message: 'Hello, world!' });
}
