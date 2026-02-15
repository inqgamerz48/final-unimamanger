import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/student', '/faculty', '/hod', '/admin']

// Routes that are public
const publicRoutes = ['/login', '/']

// Setup routes that should not be redirected
const setupRoutes = ['/admin/setup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/api/auth'))) {
    return NextResponse.next()
  }
  
  // Allow setup routes to pass through (they have their own checks)
  if (setupRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    // Check for Firebase token in cookie
    const token = request.cookies.get('firebase-token')?.value
    
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Token exists, allow through - API routes will verify it
    // Note: Actual Firebase token verification happens in API routes
    // because middleware runs at the edge and has limitations with Firebase Admin
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
