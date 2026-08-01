import "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    role?: string
    _id?: string
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      _id?: string
      role?: string
    }
    error?: string
  }

  interface User {
    accessToken?: string
    refreshToken?: string
    role?: string
    _id?: string
    user?: Record<string, unknown>
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    role?: string
    _id?: string
    user?: Record<string, unknown>
    error?: string
  }
}
