"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  console.log("[AuthProvider] Initialization")

  useEffect(() => {
    console.log("[AuthProvider] useEffect triggered")

    // Get initial session
    const getInitialSession = async () => {
      console.log("[AuthProvider] getInitialSession called")
      setIsLoading(true)

      try {
        console.log("[AuthProvider] Fetching auth session")
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("[AuthProvider] Session result:", session ? "Session exists" : "No session")
        if (session !== null || user !== null) {
          setSession(session)
          setUser(session?.user ?? null)
          console.log("[AuthProvider] User set to:", session?.user?.id ? `user id: ${session.user.id}` : "null")
        }

        // Setup auth change listener
        console.log("[AuthProvider] Setting up auth state change listener")
        const {
          data: { subscription },
        } = await supabase.auth.onAuthStateChange((_event, newSession) => {
          console.log("[AuthProvider] Auth state changed, event:", _event)

          // Only update session if it's actually different
          const sessionChanged =
            newSession?.access_token !== session?.access_token || newSession?.refresh_token !== session?.refresh_token

          // Only update user if it's actually different
          const userChanged =
            (!newSession?.user && user !== null) ||
            (newSession?.user && !user) ||
            (newSession?.user && user && newSession.user.id !== user.id)

          if (sessionChanged) {
            console.log("[AuthProvider] Session changed, updating session state")
            setSession(newSession)
          }

          if (userChanged) {
            console.log(
              "[AuthProvider] User changed, updating user state from:",
              user?.id ? `user id: ${user.id}` : "null",
              "to:",
              newSession?.user?.id ? `user id: ${newSession.user.id}` : "null",
            )
            setUser(newSession?.user ?? null)
          }
        })

        console.log("[AuthProvider] Setting isLoading to false")
        setIsLoading(false)

        return () => {
          console.log("[AuthProvider] Cleanup: unsubscribing from auth changes")
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("[AuthProvider] Auth session error:", error)
        // Make sure loading state is updated even on error
        console.log("[AuthProvider] Setting isLoading to false after error")
        setIsLoading(false)
      }
    }

    getInitialSession()
    console.log("[AuthProvider] useEffect setup complete")
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    // Create a minimal profile with default values if signup is successful
    if (!error && user) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          taxation_type: "pausalno", // Default value
          yearly_revenue_limit: "6000000", // Default value
        })
      } catch (profileErr) {
        console.error("Error creating initial profile:", profileErr)
      }
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    console.log("[AuthProvider] signIn called for email:", email)
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      console.log("[AuthProvider] signIn result:", error ? "Error: " + error.message : "Success")
      return { error }
    } finally {
      // Ensure loading state is updated after sign in attempt completes
      console.log("[AuthProvider] Setting isLoading to false after signIn")
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    console.log("[AuthProvider] signOut called")
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } finally {
      // Ensure loading state is updated after sign out completes
      console.log("[AuthProvider] Setting isLoading to false after signOut")
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password/update`,
    })
    return { error }
  }

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  console.log("[AuthProvider] Rendering - isLoading:", isLoading, "user:", user?.id ? `exists (${user.id})` : "null")
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
