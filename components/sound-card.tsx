"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Play } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Sound } from "@/types/sound"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"
import { 
  Heart, 
  Download, 
  Music, 
  Edit2, 
  Piano, 
  Guitar, 
  Drum, 
  Waves, 
  CloudRain, 
  CloudSun, // Or other weather/nature icons
  Building2, // For city sounds
  TreePine, // For forest sounds
  AudioLines, // For synth/electronic sounds
  Volume2 // For effects
} from "lucide-react"
import { saveSound, removeSound } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

// Create a global audio context to manage single audio playback
let currentlyPlaying: HTMLAudioElement | null = null

interface SoundCardProps {
  sound: Sound
  onEditMode?: (isEditing: boolean, sound: Sound) => void
  inLibrary?: boolean
  onSaveStateChange?: (soundId: string, isSaved: boolean) => void
}

// Helper function to get the icon based on sound name
const getSoundIcon = (name: string): React.ElementType => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("piano")) return Piano;
  if (lowerName.includes("guitar")) return Guitar;
  if (lowerName.includes("drum") || lowerName.includes("beat")) return Drum;
  if (lowerName.includes("synth") || lowerName.includes("electronic")) return AudioLines;
  if (lowerName.includes("wave") || lowerName.includes("beach") || lowerName.includes("ocean")) return Waves;
  if (lowerName.includes("rain") || lowerName.includes("storm")) return CloudRain;
  if (lowerName.includes("city") || lowerName.includes("urban")) return Building2;
  if (lowerName.includes("forest") || lowerName.includes("nature")) return TreePine;
  if (lowerName.includes("ambient") || lowerName.includes("atmosphere")) return CloudSun; // Example, adjust as needed
  if (lowerName.includes("effect") || lowerName.includes("fx")) return Volume2;

  return Music; // Default icon
};

export function SoundCard({ sound, onEditMode, inLibrary = false, onSaveStateChange }: SoundCardProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === "dark"
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isSaved, setIsSaved] = useState(sound.isSaved || false)
  const [isEditing, setIsEditing] = useState(false)
  const [audioError, setAudioError] = useState(!sound.audioUrl)
  const [actualDuration, setActualDuration] = useState(sound.duration)
  const [isSaving, setIsSaving] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // --- Get the dynamic icon ---
  const SoundIcon = useMemo(() => getSoundIcon(sound.name || ""), [sound.name]);

  // Extract audio URL 
  const audioUrl = useMemo(() => {
    if (!sound.audioUrl) return null

    // Handle already complete URLs
    if (sound.audioUrl.startsWith('http')) {
      return sound.audioUrl
    }
    
    // Handle URLs that are just filenames
    // Make sure to use double slash in the path as required by Supabase storage
    return `https://rnmmonnvfrqhfcunpyvt.supabase.co/storage/v1/object/public/audio/${sound.audioUrl}`
  }, [sound.audioUrl])

  // Reset audio player when the URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl
      audioRef.current.load()
      
      // Add fallback error handling
      setAudioError(false) // Reset error state on new URL
    }
  }, [audioUrl])

  // Update isSaved state when sound.isSaved changes
  useEffect(() => {
    setIsSaved(sound.isSaved || false)
  }, [sound.isSaved])

  // Format time for display
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle audio time update event
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0)
    }
  }

  const stopCurrentlyPlaying = () => {
    if (currentlyPlaying && currentlyPlaying !== audioRef.current) {
      currentlyPlaying.pause()
      // Find the other SoundCard and update its state
      const event = new CustomEvent('audioStateChange', { detail: { isPlaying: false } })
      document.dispatchEvent(event)
    }
  }

  useEffect(() => {
    // Listen for audio state changes from other SoundCards
    const handleAudioStateChange = (event: CustomEvent) => {
      if (event.detail.isPlaying === false && isPlaying) {
        setIsPlaying(false)
      }
    }

    document.addEventListener('audioStateChange' as any, handleAudioStateChange)

    return () => {
      document.removeEventListener('audioStateChange' as any, handleAudioStateChange)
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        currentlyPlaying = null
      } else {
        stopCurrentlyPlaying()
        audioRef.current.play()
        currentlyPlaying = audioRef.current
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleSave = async () => {
    if (!user) {
      // Redirect to login page
      router.push("/login")
      return
    }

    setIsSaving(true)
    try {
      const success = isSaved 
        ? await removeSound(user.id, sound.id)
        : await saveSound(user.id, sound.id)

      if (success) {
        const newSavedState = !isSaved
        setIsSaved(newSavedState)
        if (onSaveStateChange) {
          onSaveStateChange(sound.id, newSavedState)
        }
      }
    } catch (error) {
      console.error("Error toggling sound save state:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    if (!audioUrl) return;

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${sound.name}.${audioUrl.split('.').pop()}`; // Use the original file extension
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = () => {
    if (inLibrary) {
      // Navigate to edit page with sound ID
      router.push(`/edit/${sound.id}`)
    } else {
      // Toggle edit mode for inline editing
      const newEditState = !isEditing
      setIsEditing(newEditState)
      if (onEditMode) {
        onEditMode(newEditState, sound)
      }
    }
  }

  // Handle end of playback
  const handleEnded = () => {
    setIsPlaying(false)
  }

  // Format the duration for display
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle audio errors more gracefully
  const handleAudioError = () => {
    console.error(`Error loading audio for "${sound.name}": ${audioUrl}`)
    setAudioError(true)
  }

  return (
    <div
      className={cn(
        "w-full max-w-2xl rounded-lg p-4 mb-4 transition-colors",
        isDark ? "bg-[#212121]" : "bg-white border border-gray-200",
        isEditing && "ring-2 ring-purple-500 ring-opacity-50",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center pl-2">
          <SoundIcon className={cn("h-5 w-5 mr-3", isDark ? "text-gray-400" : "text-gray-500")} />
          <div>
            <h3 className={cn("font-medium text-base", isDark ? "text-white" : "text-gray-900")}>{sound.name}</h3>
            <div className="flex items-center text-xs mt-1">
              <span className={cn("mr-3", isDark ? "text-gray-400" : "text-gray-500")}>{sound.bpm} BPM</span>
              <span className={cn(isDark ? "text-gray-400" : "text-gray-500")}>{sound.key}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleDownload}
            disabled={!audioUrl}
            className={cn(
              "p-2 rounded-full transition-colors mr-1",
              !audioUrl
                ? "text-gray-500 opacity-50 cursor-not-allowed"
                : isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900"
            )}
            aria-label="Download sound"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={toggleSave}
            disabled={isSaving}
            className={cn(
              "p-2 rounded-full transition-colors mr-1",
              isSaved
                ? "text-red-500"
                : isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
            aria-label={isSaved ? "Remove from library" : "Add to library"}
          >
            <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
          </button>
          <button
            onClick={handleEdit}
            className={cn(
              "p-2 rounded-full transition-colors",
              isEditing
                ? "text-purple-500"
                : isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900",
            )}
            aria-label={isEditing ? "Cancel edit" : "Edit sound"}
          >
            <Edit2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center">
        <button
          onClick={togglePlay}
          disabled={audioError}
          className={cn(
            "p-2 transition-colors",
            audioError
              ? "text-gray-500 cursor-not-allowed"
              : isDark
              ? "text-white hover:text-gray-300"
              : "text-gray-900 hover:text-gray-700"
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Image src="/pause-circle.svg" alt="Pause" width={20} height={20} />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1 mx-2">
          <div className="relative h-1 bg-gray-700 bg-opacity-20 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gray-500"
              style={{ width: `${actualDuration ? (currentTime / actualDuration) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{formatTime(actualDuration)}</div>
      </div>

      {sound.audioUrl && (
        <audio
          ref={audioRef}
          src={sound.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => setActualDuration(e.currentTarget.duration)}
          onEnded={handleEnded}
          onError={handleAudioError}
        />
      )}
    </div>
  )
}
