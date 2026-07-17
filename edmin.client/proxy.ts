import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // 1. If not authenticated, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Decode JWT payload to get roles
  let roles: string[] = [];
  try {
    const payloadBase64 = token.split('.')[1];
    if (payloadBase64) {
      // Decode base64url
      const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const decodedData = JSON.parse(decodedJson);
      if (decodedData.roles && Array.isArray(decodedData.roles)) {
        roles = decodedData.roles.map((r: string) => r.toLowerCase());
      } else if (decodedData.role) {
        // Fallback for older tokens
        roles = [decodedData.role.toLowerCase()];
      }
    }
  } catch (error) {
    // If token is malformed, clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  if (roles.length === 0) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  const { pathname } = request.nextUrl;
  
  // 3. Prevent role-mismatched requests
  // Determine if the requested path is allowed for any of the user's roles
  let isAllowed = false;
  let primaryPrefix = `/dashboard/${roles[0]}`; // Default fallback for redirects

  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL(primaryPrefix, request.url));
  }

  // Universal routes accessible to all authenticated users
  const universalRoutes = ['/dashboard/profile', '/dashboard/settings', '/dashboard/change-password'];
  if (universalRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  for (const r of roles) {
    const expectedPathPrefix = `/dashboard/${r}`;
    if (pathname.startsWith(expectedPathPrefix) || pathname.startsWith('/dashboard/shared')) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    return NextResponse.redirect(new URL(primaryPrefix, request.url));
  }

  return NextResponse.next();
}

// Configure middleware to only run on /dashboard and its subpaths
export const config = {
  matcher: '/dashboard/:path*',
};
