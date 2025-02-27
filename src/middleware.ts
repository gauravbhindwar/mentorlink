import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their allowed roles
const protectedRoutes = {
  '/pages/admin/admindashboard': ['admin'],
  '/pages/admin/managementee': ['admin'],
  '/pages/admin/managementor': ['admin'],
  '/pages/admin/managemeeting': ['admin'],
  '/pages/meetings/mreport': ['admin'],
  '/pages/admin/createacademicsession': ['admin'],
  '/pages/mentordashboard': ['mentor'],
  '/pages/viewmentee': ['mentor'],
  '/pages/meetings/schmeeting': ['mentor'],
  '/pages/mentordashboard/consolidatedReport': ['mentor']
}


export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Get UserRole from cookies
  const userRoles = request.cookies.get('UserRole')?.value?.split(',') || []

  // If user has both admin and mentor roles, allow access to all routes
  if (userRoles.includes('admin') && userRoles.includes('mentor')) {
    return NextResponse.next()
  }

  // Check if this is a protected route
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    path.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Check if user has required role for this route
  const hasAccess = Object.entries(protectedRoutes).some(([route, allowedRoles]) => {
    if (path.startsWith(route)) {
      return allowedRoles.some(role => userRoles.includes(role))
    }
    return false
  })

  if (!hasAccess) {
    // Redirect to login if no valid role
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/pages/admin/:path*',
    '/pages/mentordashboard/:path*',
    '/pages/viewmentee/:path*',
    '/pages/meetings/:path*'
  ]
}
