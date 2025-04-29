import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { Sound } from "@/types/sound"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

// Hardcoded Supabase credentials
const supabaseUrl = "https://rnmmonnvfrqhfcunpyvt.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubW1vbm52ZnJxaGZjdW5weXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1Njc3ODUsImV4cCI6MjA2MDE0Mzc4NX0.YB18Oogxf6z3YUzUZ77ORHdHRVm85Ots-pY8Ltz2Q5Q"

// Constants for storage
const STORAGE_BUCKET = 'audio'
const STORAGE_PUBLIC_URL = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}`

// Function to get a public URL for a file in storage
function getStorageUrl(path: string): string | null {
  if (!path) {
    console.error("[Storage] getStorageUrl called with empty path.");
    return null;
  }

  try {
    console.log("[Storage] Original path received:", path);

    // If it's already a full URL, return it
    if (path.startsWith('http')) {
      return path;
    }

    // Clean the path: remove leading/trailing slashes and 'audio/' prefix if present
    const cleanPath = path
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+$/, '') // Remove trailing slashes
      .replace(/^audio\/+/, ''); // Remove 'audio/' prefix if present

    console.log("[Storage] Cleaned path:", cleanPath);

    if (!cleanPath) {
      console.error("[Storage] Path became empty after cleaning:", path);
      return null;
    }

    // Construct the full public URL
    const publicUrl = `${STORAGE_PUBLIC_URL}/${cleanPath}`;
    console.log("[Storage] Generated public URL:", publicUrl);
    return publicUrl;

  } catch (error) {
    console.error(`[Storage] Exception getting storage URL for path '${path}':`, error);
    return null;
  }
}

export async function GET() {
  try {
    console.log("[Library API] Route handler started.");
    
    console.log("[Library API] Initializing Supabase client via createRouteHandlerClient")
    // Initialize Supabase client - Pass the cookies function directly
    const supabase = createRouteHandlerClient({ cookies }); 
    
    // Get current user
    console.log("[Library API] Attempting supabase.auth.getUser()")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("[Library API] supabase.auth.getUser() returned an error:", userError);
      return NextResponse.json(
        { error: userError.message || "Authentication error during getUser" },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error("[Library API] supabase.auth.getUser() returned null user, but no error.");
      return NextResponse.json(
        { error: "Unauthorized - No user session found" },
        { status: 401 }
      );
    }

    console.log(`[Library API] Authenticated user: ${user.id}`)
    
    try {
      // Get user sounds with a join to get sound details
      console.log(`[Library API] Fetching user_sounds with sound details for user ${user.id}`)
      const { data: userSounds, error: userSoundsError } = await supabase
        .from("user_sounds")
        .select(`
          id,
          created_at,
          profile_id,
          sound_id,
          sounds: sound_id (
            id,
            name,
            bpm,
            key,
            len,
            url,
            waveform,
            tags
          )
        `)
        .eq("profile_id", user.id) as { data: Array<{
          id: string;
          created_at: string;
          profile_id: string;
          sound_id: string;
          sounds: {
            id: string;
            name: string;
            bpm: number | null;
            key: string | null;
            len: number | null;
            url: string | null;
            waveform: number[];
            tags: string[];
          } | null;
        }> | null, error: any }
      
      if (userSoundsError) {
        console.error("[Library API] Error querying user_sounds:", userSoundsError)
        return NextResponse.json({ 
          error: "Database error: " + userSoundsError.message,
          details: userSoundsError
        }, { status: 500 })
      }
      
      console.log(`[Library API] Raw user_sounds data:`, userSounds)
      console.log(`[Library API] Found ${userSounds?.length || 0} user_sounds entries`)
      
      // If no saved sounds, return empty result
      if (!userSounds || userSounds.length === 0) {
        console.log("[Library API] No saved sounds found")
        return NextResponse.json({
          library: [],
          userId: user.id
        })
      }
      
      // Format the response
      const libraryData = userSounds.map(userSound => {
        if (!userSound.sounds) {
          console.warn(`[Library API] Sound with ID ${userSound.sound_id} not found`)
          return null
        }
        
        const dbSound = userSound.sounds
        const audioUrl = dbSound.url ? getStorageUrl(dbSound.url) : null
        console.log(`[Library API] Processing sound: ${dbSound.name} (${dbSound.id})`)
        
        // Create a sound object that matches the Sound type
        const formattedSound: Sound = {
          id: dbSound.id,
          name: dbSound.name || "Unnamed Sound",
          bpm: dbSound.bpm,
          key: dbSound.key,
          duration: dbSound.len || null,
          audioUrl: audioUrl,
          waveform: dbSound.waveform || [],
          tags: dbSound.tags || [],
          isSaved: true
        }
        
        // Return in the format expected by the client
        return {
          id: userSound.id,
          created_at: userSound.created_at,
          profile_id: user.id,
          sounds: formattedSound
        }
      }).filter(Boolean) // Remove null entries for sounds not found
      
      console.log(`[Library API] Final formatted library data:`, libraryData)
      console.log(`[Library API] Returning ${libraryData.length} formatted sounds`)
      
      return NextResponse.json({
        library: libraryData,
        userId: user.id
      })
    } catch (error) {
      console.error("[Library API] Unexpected error:", error)
      return NextResponse.json({ 
        error: "Unexpected error: " + (error instanceof Error ? error.message : String(error))
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[Library API] Authentication error:", error)
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 401 }
    )
  }
} 