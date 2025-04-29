"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { success, error } = await signIn(email, password)

      if (!success && error) {
        setError(error)
        setIsLoading(false)
        return
      }

      // Redirect to home page on successful login
      router.push("/")
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      const { success, error } = await signInWithGoogle()
      if (!success && error) {
        setError(error)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    }
  }

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4", isDark ? "bg-[#161616]" : "bg-gray-50")}>
      <div
        className={cn("w-full max-w-md p-6 rounded-lg", isDark ? "bg-[#212121]" : "bg-white border border-gray-200")}
      >
        <h1 className={cn("text-2xl font-medium mb-6 text-center font-serif", isDark ? "text-white" : "text-gray-900")}>
          Log in to Cue
        </h1>

        {error && <div className="mb-4 p-3 rounded bg-red-100 border border-red-300 text-red-800 text-sm">{error}</div>}

        <button
          onClick={handleGoogleSignIn}
          className={cn(
            "w-full mb-4 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2",
            isDark ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-300",
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className={cn("w-full border-t", isDark ? "border-gray-700" : "border-gray-300")}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={cn("px-2", isDark ? "bg-[#212121] text-gray-400" : "bg-white text-gray-500")}>
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className={cn("block mb-2 text-sm font-medium", isDark ? "text-gray-200" : "text-gray-700")}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2",
                isDark
                  ? "bg-[#161616] border-[#333] text-white focus:ring-purple-600"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-purple-500",
              )}
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className={cn("block mb-2 text-sm font-medium", isDark ? "text-gray-200" : "text-gray-700")}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2",
                isDark
                  ? "bg-[#161616] border-[#333] text-white focus:ring-purple-600"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-purple-500",
              )}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-2 px-4 rounded-md font-medium transition-colors",
              "bg-purple-600 hover:bg-purple-700 text-white",
              isLoading && "opacity-70 cursor-not-allowed",
            )}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className={cn("mt-4 text-center text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
          Don't have an account?{" "}
          <Link href="/signup" className="text-purple-600 hover:text-purple-500">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
