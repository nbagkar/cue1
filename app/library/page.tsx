"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { SoundCard } from "@/components/sound-card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Music, Search } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { Sound } from "@/types/sound"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"
import { Layout } from "@/components/layout"

interface LibrarySound {
  id: string
  created_at: string
  profile_id?: string
  sounds: Sound
}

export default function UserLibraryPage() {
  const { user, loading: userLoading } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [library, setLibrary] = useState<LibrarySound[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLibrary, setFilteredLibrary] = useState<LibrarySound[]>([])

  // Add debug log for component mount
  useEffect(() => {
    console.log("[Library] Component mounted")
  }, [])

  // Load user's library when component mounts or user changes
  useEffect(() => {
    console.log("[Library] User effect triggered:", {
      userLoading,
      userId: user?.id,
      initialLoad
    })

    if (!userLoading) {
      if (user) {
        console.log("[Library] User authenticated:", user.id)
        setError(null) // Clear any previous errors
        fetchLibrary()
      } else {
        console.log("[Library] No user found")
        setInitialLoad(false)
        setError("You must be logged in to view your library")
      }
    }
  }, [user, userLoading])

  // Filter library when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLibrary(library)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = library.filter(item => 
        item.sounds.name.toLowerCase().includes(query) ||
        (item.sounds.tags && item.sounds.tags.some(tag => tag.toLowerCase().includes(query)))
      )
      setFilteredLibrary(filtered)
    }
  }, [searchQuery, library])

  // Function to fetch user's library
  const fetchLibrary = async () => {
    if (!user) {
      console.log("[Library] No user found, skipping library fetch")
      return
    }

    console.log(`[Library] Starting library fetch for user ${user.id}`)
    setLoading(true)
    setError(null)
    
    try {
      console.log(`[Library] Making API request to /api/library`)
      const response = await fetch("/api/library")
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[Library] API error response:", errorData)
        throw new Error(errorData.error || `Failed to fetch library: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`[Library] API response:`, data)

      // Double-check we got an array of user_sounds entries
      if (!Array.isArray(data.library)) {
        console.error("[Library] Invalid data format:", data)
        setLibrary([])
        setFilteredLibrary([])
        setError("Invalid library data format")
        return
      }
      
      // Make sure we only display sounds that have valid data
      const validSounds = data.library.filter(
        (item: LibrarySound) => item.sounds && item.sounds.id && item.profile_id === user.id
      )
      
      console.log(`[Library] Found ${validSounds.length} valid sounds`)
      setLibrary(validSounds)
      setFilteredLibrary(validSounds)
    } catch (error) {
      console.error("[Library] Error fetching library:", error)
      setError(error instanceof Error ? error.message : "Failed to load your library")
      toast.error("Failed to load your library")
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  // Function to remove a sound from the library
  const removeFromLibrary = async (soundId: string) => {
    if (!user) return
    
    try {
      const response = await fetch("/api/library/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          soundId,
          userId: user.id // Explicitly include user ID for extra security
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to remove sound")
      }
      
      // Update local state to remove the sound
      setLibrary((prev) => prev.filter(item => item.sounds.id !== soundId))
      toast.success("Sound removed from library")
    } catch (error) {
      console.error("Error removing sound:", error)
      toast.error("Failed to remove sound from library")
    }
  }

  // Handle save state change (for SoundCard)
  const handleSaveStateChange = (soundId: string, isSaved: boolean) => {
    if (!isSaved) {
      const updatedLibrary = library.filter(item => item.sounds.id !== soundId)
      setLibrary(updatedLibrary)
      setFilteredLibrary(prev => prev.filter(item => item.sounds.id !== soundId))
    }
  }

  // If user is not logged in
  if (!userLoading && !user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
          <h1 className="text-2xl font-bold mb-4">Your Library</h1>
          <p className="text-muted-foreground mb-4">Please log in to view your library</p>
          <Link href="/login">
            <Button variant="default">Log In</Button>
          </Link>
        </div>
      </Layout>
    )
  }

  const libraryContent = (
    <div className="container mx-auto py-6 px-4 flex-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Sound Library</h1>
        <Button 
          variant="outline" 
          onClick={fetchLibrary}
          disabled={loading}
          className="gap-2 bg-transparent text-white border-white hover:text-white hover:bg-white/10"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Refresh</span>
        </Button>
      </div>
      
      {user && <p className="text-sm text-muted-foreground mb-6">Showing your saved sounds</p>}

      {/* Search box */}
      <div className="mb-6 max-w-md">
        <div className={cn(
          "flex items-center border rounded-full px-3 py-2 focus-within:ring-1",
          isDark 
            ? "bg-[#212121] border-[#333] focus-within:ring-purple-500" 
            : "bg-white border-gray-200 focus-within:ring-purple-600"
        )}>
          <Search className={cn("h-4 w-4 mr-2", isDark ? "text-gray-400" : "text-gray-500")} />
          <input
            type="text"
            placeholder="Search your library"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "bg-transparent border-none focus:outline-none flex-1",
              isDark ? "text-white placeholder:text-gray-400" : "text-gray-900 placeholder:text-gray-500"
            )}
          />
        </div>
      </div>

      {initialLoad ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className={cn("mb-4", isDark ? "text-red-400" : "text-red-500")}>{error}</p>
          <Button onClick={fetchLibrary} variant="default">Try Again</Button>
        </div>
      ) : filteredLibrary.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery.trim() !== "" ? (
            <>
              <p className="text-muted-foreground mb-4">No sounds match your search</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
            </>
          ) : (
            <>
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500">
                <Music className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground mb-4">No sounds saved to library</p>
              <Link href="/sound-search">
                <Button variant="default" className={cn(isDark ? "bg-purple-600 hover:bg-purple-700" : "")}>Discover Sounds</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm">
            {filteredLibrary.length} {filteredLibrary.length === 1 ? 'sound' : 'sounds'} 
            {searchQuery.trim() !== "" ? ` matching "${searchQuery}"` : ''}
          </p>
          <div className="grid grid-cols-1 gap-4">
            {filteredLibrary.map((item) => {
              // Ensure sound has isSaved property set
              const soundWithSaved = {
                ...item.sounds,
                isSaved: true
              };
              
              return (
                <SoundCard
                  key={item.id}
                  sound={soundWithSaved}
                  inLibrary={true}
                  onSaveStateChange={handleSaveStateChange}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Layout>
      {libraryContent}
    </Layout>
  )
}
