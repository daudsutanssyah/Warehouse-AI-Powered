import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Route Categories
 */
// Public routes accessible without authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth/callback']

// Routes that logged-in users should NOT access (redirect to /dashboard)
const AUTH_ROUTES = ['/login', '/register']

// Page routes that require an authenticated session
const PROTECTED_ROUTES_PREFIX = [
  '/dashboard',
  '/products',
  '/warehouses',
  '/stock',
  '/chat',
]

// API routes that require an authenticated session (returns 401 JSON)
const API_PROTECTED_PREFIX = [
  '/api/products',
  '/api/warehouses',
  '/api/stock',
  '/api/ai',
]

export async function proxy(request: NextRequest) {
  // Start with a standard NextResponse.next that forwards the incoming request headers
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create an auth-aware Supabase server client that refreshes expired sessions
  // using the getAll / setAll pattern from @supabase/ssr documentation.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. Update the request cookies so Server Components down the line see the updated tokens
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // 2. Clone the response to ensure response headers and cookies stay in sync
          supabaseResponse = NextResponse.next({
            request,
          })
          // 3. Set the updated cookies on the outgoing response to update the user's browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Helper to carry over any newly refreshed auth cookies to redirect responses
  const createRedirectResponse = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // Validate the session token securely on the server with getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Log incoming request and user session state
  console.log(`[middleware] ${request.method} ${pathname} | user: ${user?.email ?? 'none'}`)

  // 1. If user is logged in and visits auth routes (/login, /register) -> redirect to /dashboard
  if (user && AUTH_ROUTES.includes(pathname)) {
    console.log(`[middleware] Decision: Redirect -> /dashboard (authenticated user on auth route)`)
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return createRedirectResponse(dashboardUrl)
  }

  // 2. If user is NOT logged in and accesses a protected page -> redirect to /login with redirectTo
  const isProtectedPage = PROTECTED_ROUTES_PREFIX.some((prefix) =>
    pathname.startsWith(prefix)
  )
  if (!user && isProtectedPage) {
    console.log(`[middleware] Decision: Redirect -> /login?redirectTo=${pathname} (unauthenticated protected route)`)
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return createRedirectResponse(loginUrl)
  }

  // 3. If user is NOT logged in and calls a protected API endpoint -> return 401 Unauthorized JSON
  const isProtectedApi = API_PROTECTED_PREFIX.some((prefix) =>
    pathname.startsWith(prefix)
  )
  if (!user && isProtectedApi) {
    console.log(`[middleware] Decision: 401 Unauthorized (unauthenticated API route)`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 4. Otherwise continue the request with updated session cookies
  console.log(`[middleware] Decision: Allow request to ${pathname}`)
  return supabaseResponse
}

export default proxy

// Route matcher configuration excluding static assets, images, and favicon
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

