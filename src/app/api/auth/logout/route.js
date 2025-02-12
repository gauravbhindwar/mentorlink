import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookiesInstance = await cookies();
  
  allCookies.forEach(cookie => {
    cookiesInstance.delete(cookie.name);
  });

  return NextResponse.json({ success: true });
}
