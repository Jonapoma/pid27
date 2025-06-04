import { createClient as createSupabaseClientOriginal } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Add site URL configuration to the Supabase client initialization

// Modify the createClient function to include the site URL in the options
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pid27.vercel.app"

  return createSupabaseClientOriginal<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })
}

// Singleton pattern for client-side usage
let browserClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}

// Also update the server client to include the site URL
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL as string
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pid27.vercel.app"

  return createSupabaseClientOriginal<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })
}

export const supabase = getSupabaseClient()
