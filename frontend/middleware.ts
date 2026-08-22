import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PATHS = ['/dashboard', '/profile', '/settings', '/admin']

// Routes that should redirect authenticated users away
const AUTH_PATHS = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Since auth is fully client-side (Supabase + localStorage), 
  // we only block obvious direct-navigation to dashboard sub-routes.
  // The real protection is in the React AuthGuard component.
  
  // Allow all requests to pass through — protection is client-side
  // This middleware exists as the extension point for server-side token validation
  // if a cookie-based session is added in the future.
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
