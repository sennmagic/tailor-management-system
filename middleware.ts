import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔍 Middleware running for path:', pathname)
  
  // Get cookies
  const refreshToken = request.cookies.get('refresh_token')
  const accessToken = request.cookies.get('access_token')
  
  console.log('🍪 Cookies found:', {
    refreshToken: refreshToken?.value ? 'YES' : 'NO',
    accessToken: accessToken?.value ? 'YES' : 'NO'
  })
  
  // Simple test: if no tokens and not on login page, redirect to login
  if (!refreshToken && !accessToken && pathname !== '/login') {
    console.log('🚫 No tokens found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If on login page but has tokens, redirect to home
  if (pathname === '/login' && refreshToken && accessToken) {
    console.log('✅ Has tokens, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  console.log('✅ Allowing request to continue')
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 