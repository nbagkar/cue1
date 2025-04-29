import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: Request) {
  const { soundId } = await request.json()
  
  if (!soundId) {
    return NextResponse.json(
      { error: "Sound ID is required" },
      { status: 400 }
    )
  }

  // Initialize Supabase client
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  console.log(`Saving sound ${soundId} to user ${user.id}'s library`)

  // Check if sound exists
  const { data: soundExists, error: soundError } = await supabase
    .from("sounds")
    .select("id")
    .eq("id", soundId)
    .single()

  if (soundError || !soundExists) {
    console.error("Sound not found:", soundError)
    return NextResponse.json(
      { error: "Sound not found" },
      { status: 404 }
    )
  }

  // Check if already saved - use profile_id to match database schema
  const { data: existingSave, error: checkError } = await supabase
    .from("user_sounds")
    .select("id, profile_id")
    .eq("sound_id", soundId)
    .eq("profile_id", user.id)
    .single()

  if (checkError) {
    console.log("Check error (expected if not saved yet):", checkError);
  }
    
  if (existingSave) {
    console.log(`Sound ${soundId} already saved for user ${user.id}. Record:`, existingSave)
    return NextResponse.json(
      { message: "Sound already saved to library" },
      { status: 200 }
    )
  }

  // Save sound to user's library with profile_id
  const { data, error } = await supabase
    .from("user_sounds")
    .insert({
      sound_id: soundId,
      profile_id: user.id, // Use profile_id to match database schema
    })
    .select()

  if (error) {
    console.error("Database error saving sound:", error)
    return NextResponse.json(
      { error: "Failed to save sound" },
      { status: 500 }
    )
  }

  console.log(`Successfully saved sound ${soundId} to user ${user.id}'s library. New record:`, data)

  // Verify the save worked by querying again
  const { data: verification, error: verifyError } = await supabase
    .from("user_sounds")
    .select("id, profile_id, sound_id")
    .eq("sound_id", soundId)
    .eq("profile_id", user.id)
    .single();
    
  if (verifyError) {
    console.error("Verification error:", verifyError);
  } else {
    console.log("Verification successful:", verification);
  }

  return NextResponse.json({ 
    message: "Sound saved to library",
    data,
    userId: user.id,
    verificationResult: verification || null
  })
} 