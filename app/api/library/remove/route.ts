import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: Request) {
  const { soundId, userId } = await request.json()
  
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

  // Security check: verify the provided userId matches the authenticated user
  if (userId && userId !== user.id) {
    console.warn(`User ID mismatch: ${userId} vs ${user.id}`)
    return NextResponse.json(
      { error: "Unauthorized action" },
      { status: 403 }
    )
  }

  // Remove sound from user's library - use profile_id to match database schema
  const { error } = await supabase
    .from("user_sounds")
    .delete()
    .eq("sound_id", soundId)
    .eq("profile_id", user.id)

  if (error) {
    console.error("Database error removing sound:", error)
    return NextResponse.json(
      { error: "Failed to remove sound from library" },
      { status: 500 }
    )
  }

  return NextResponse.json({ 
    message: "Sound removed from library",
    userId: user.id
  })
} 