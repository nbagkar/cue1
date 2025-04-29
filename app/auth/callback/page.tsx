'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session and check for errors
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('Failed to get session')
          return
        }

        if (session) {
          // Check if we need to create a profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select()
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Profile fetch error:', profileError)
            setError('Failed to fetch profile')
            return
          }

          // If profile doesn't exist, create it
          if (!profile) {
            console.log('Creating new profile for user:', session.user.id)
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              })
              .select()
              .single()

            if (createError) {
              console.error('Profile creation error:', createError)
              // If profile creation fails, sign out the user to prevent partial state
              await supabase.auth.signOut()
              setError('Failed to create profile. Please try signing in again.')
              return
            }
          }

          // Redirect to home page
          router.push('/')
        } else {
          setError('No session found')
        }
      } catch (error) {
        console.error('Callback error:', error)
        setError('An unexpected error occurred')
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#161616] text-white">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h2 className="text-red-500 font-medium mb-2">Authentication Error</h2>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#161616]">
      <div className="h-8 w-8 border-2 border-t-transparent border-purple-500 rounded-full animate-spin" />
    </div>
  )
} 