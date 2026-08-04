import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Get all cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Delete all cookies
    const cookiesInstance = await cookies();
    allCookies.forEach(cookie => {
      cookiesInstance.delete(cookie.name);
    });

    // Return success response
    return NextResponse.json({ 
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      success: false,
      message: "Logout failed"
    }, { status: 500 });
  }
}

