import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

// Hardcoded Supabase credentials
const supabaseUrl = "https://rnmmonnvfrqhfcunpyvt.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubW1vbm52ZnJxaGZjdW5weXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1Njc3ODUsImV4cCI6MjA2MDE0Mzc4NX0.YB18Oogxf6z3YUzUZ77ORHdHRVm85Ots-pY8Ltz2Q5Q"

export async function GET() {
  try {
    // Initialize Supabase client directly
    console.log("Initializing Supabase client with hardcoded credentials")
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
    
    // Get current user directly with the SDK
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      console.error("Auth error:", userError || "No user found")
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }
    
    const user = userData.user
    console.log(`Got user: ${user.id}`)
    
    try {
      // Get user sounds directly
      console.log(`Fetching user_sounds for user ${user.id}`)
      const userSoundsResponse = await supabase
        .from("user_sounds")
        .select("*")
        .eq("profile_id", user.id)
      
      if (userSoundsResponse.error) {
        console.error("Error querying user_sounds:", userSoundsResponse.error)
        return NextResponse.json({ 
          error: "Database error: " + userSoundsResponse.error.message,
          details: userSoundsResponse.error
        }, { status: 500 })
      }
      
      const userSounds = userSoundsResponse.data || []
      console.log(`Found ${userSounds.length} user_sounds entries`)
      
      // If no saved sounds, return empty result
      if (userSounds.length === 0) {
        return NextResponse.json({
          userSounds: [],
          sounds: [],
          count: 0,
          soundCount: 0,
          userId: user.id
        })
      }
      
      // Extract sound IDs and handle empty array case
      const soundIds = userSounds.map(item => item.sound_id)
      console.log(`Extracted ${soundIds.length} sound IDs:`, soundIds)
      
      // Fetch the sounds
      console.log(`Fetching sounds with IDs: ${soundIds.join(', ')}`)
      const soundsResponse = await supabase
        .from("sounds")
        .select("*")
        .in("id", soundIds)
      
      if (soundsResponse.error) {
        console.error("Error querying sounds:", soundsResponse.error)
        return NextResponse.json({ 
          error: "Database error: " + soundsResponse.error.message,
          details: soundsResponse.error,
          userSounds // Include the user_sounds in the response
        }, { status: 500 })
      }
      
      const sounds = soundsResponse.data || []
      console.log(`Found ${sounds.length} sound entries`)
      
      return NextResponse.json({
        userSounds,
        sounds,
        count: userSounds.length,
        soundCount: sounds.length,
        userId: user.id
      })
    } catch (dbError) {
      console.error("Database operation error:", dbError)
      return NextResponse.json({ 
        error: "Database operation error", 
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Unhandled error:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
} 