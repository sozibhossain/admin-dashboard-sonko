import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const publicPaths = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/otp",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (pathname.startsWith("/auth/login") && token) {
    const url = req.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}


