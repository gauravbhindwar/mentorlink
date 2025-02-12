import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Clear cookies
  const cookieStore = cookies();
  cookieStore.getAll().forEach(cookie => {
    cookies().delete(cookie.name);
  });

  return NextResponse.json({ success: true });
}
