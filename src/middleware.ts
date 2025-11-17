import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const path = req.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth']
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath))

  // Redirect to login if not authenticated
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (token && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Role-based access control
  if (token) {
    const role = token.role as string

    // Admin has access to everything
    if (role === 'Admin') {
      return NextResponse.next()
    }

    // Sales role restrictions
    if (role === 'Sales') {
      const salesAllowedPaths = [
        '/dashboard',
        '/customers',
        '/leads',
        '/pipeline',
        '/sales',
        '/activities',
        '/api/customers',
        '/api/leads',
        '/api/pipeline',
        '/api/sales',
        '/api/activities',
      ]

      const hasAccess = salesAllowedPaths.some(allowedPath => path.startsWith(allowedPath))

      if (!hasAccess) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Support role restrictions
    if (role === 'Support') {
      const supportAllowedPaths = [
        '/dashboard',
        '/customers',
        '/tickets',
        '/api/customers',
        '/api/tickets',
      ]

      const hasAccess = supportAllowedPaths.some(allowedPath => path.startsWith(allowedPath))

      if (!hasAccess) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
