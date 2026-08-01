"use client"

import type React from "react"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from ""
import { Input } from "../../../../components/ui/input"
import { Button } from "../../../../components/ui/button"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrlParam = searchParams.get("callbackUrl")
  const callbackUrl =
    callbackUrlParam && callbackUrlParam.startsWith("/") && !callbackUrlParam.startsWith("/auth")
      ? callbackUrlParam
      : "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || !password) {
      toast.error("Email and password are required")
      return
    }

    setIsSubmitting(true)
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      const errorMessage = result.error || "Login failed"
      if (errorMessage.toLowerCase().includes("otp")) {
        toast.warning("OTP verification required")
        router.push(`/auth/otp?email=${encodeURIComponent(email)}&mode=verify`)
      } else if (errorMessage === "CredentialsSignin") {
        toast.error("Invalid email or password")
      } else {
        toast.error(decodeURIComponent(errorMessage))
      }
      setIsSubmitting(false)
      return
    }
    toast.success("Welcome back")
    router.replace(result?.url && result.url.startsWith("/") && !result.url.startsWith("/auth") ? result.url : callbackUrl)
    router.refresh()
    setIsSubmitting(false)
  }

  return (
    <div className="w-full max-w-md">
      <Card className="border-border/60 shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Admin Login</CardTitle>
          <CardDescription>Use your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center text-sm text-gray-500">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md">
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold">Admin Login</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="h-10 rounded-md bg-gray-100" />
              <div className="h-10 rounded-md bg-gray-100" />
              <div className="h-10 rounded-md bg-gray-100" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}




