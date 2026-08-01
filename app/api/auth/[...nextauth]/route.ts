import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"

const requireApiBaseUrl = () => {
  const apiBaseUrl =
    process.env.NEXTPUBLICBASEURL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    ""

  if (!apiBaseUrl) {
    throw new Error("Backend API base URL is not configured")
  }

  return apiBaseUrl.replace("localhost", "127.0.0.1").replace(/\/$/, "")
}

const decodeJwt = (token: string): { exp?: number } => {
  try {
    const base64Payload = token.split(".")[1]
    const payload = Buffer.from(base64Payload, "base64").toString("utf8")
    return JSON.parse(payload) as { exp?: number }
  } catch {
    return {}
  }
}

const getTokenExpiry = (token: string) => {
  const decoded = decodeJwt(token)
  if (!decoded.exp) return null
  return decoded.exp * 1000
}

const refreshAccessToken = async (token: any) => {
  try {
    const response = await axios.post(
      `${requireApiBaseUrl()}/auth/refresh-token`,
      { refreshToken: token.refreshToken },
      { headers: { "Content-Type": "application/json" } }
    )

    const refreshed = response.data?.data
    const nextAccessToken = refreshed?.accessToken
    const nextRefreshToken = refreshed?.refreshToken

    if (!nextAccessToken || !nextRefreshToken) {
      return { ...token, error: "RefreshAccessTokenError" }
    }

    return {
      ...token,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      accessTokenExpires: getTokenExpiry(nextAccessToken) ?? Date.now() + 1000 * 60 * 15,
      error: undefined,
    }
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email and password are required")
        }

        try {
          const response = await axios.post(
            `${requireApiBaseUrl()}/auth/login`,
            {
              email: credentials.email.trim(),
              password: credentials.password,
            },
            {
              headers: { "Content-Type": "application/json" },
              validateStatus: () => true,
            }
          )

          const payload = response.data
          if (!payload?.success || response.status >= 400) {
            throw new Error(payload?.message || "Login failed")
          }

          const data = payload.data ?? {}
          const user = data.user ?? data
          const accessToken = data.accessToken ?? user.accessToken
          const refreshToken = data.refreshToken ?? user.refreshToken
          const userId = `${data._id ?? user._id ?? user.id ?? credentials.email}`

          if (!accessToken || !refreshToken) {
            throw new Error("Login succeeded but auth tokens were not returned")
          }

          const sessionUser = {
            _id: userId,
            name: user.name,
            username: user.username,
            email: user.email ?? credentials.email,
            phone: user.phone,
            role: data.role ?? user.role,
            avatar: user.avatar,
          }

          return {
            id: userId,
            email: sessionUser.email,
            name: sessionUser.name ?? sessionUser.username ?? sessionUser.email ?? "Admin",
            accessToken,
            refreshToken,
            role: sessionUser.role,
            _id: userId,
            user: sessionUser,
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || error.message || "Login failed")
          }
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const accessToken = (user as any).accessToken as string
        const refreshToken = (user as any).refreshToken as string
        return {
          ...token,
          accessToken,
          refreshToken,
          accessTokenExpires: getTokenExpiry(accessToken) ?? Date.now() + 1000 * 60 * 15,
          role: (user as any).role,
          _id: (user as any)._id,
          user: (user as any).user,
        }
      }

      if (token.accessToken && token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token
      }

      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.refreshToken = token.refreshToken as string | undefined
      session.role = token.role as string | undefined
      session._id = token._id as string | undefined
      session.user = (token.user as any) ?? session.user
      session.error = token.error as string | undefined
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }





