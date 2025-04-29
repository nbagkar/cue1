"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"
import { Send, ArrowLeft, Play, Pause, Download, FolderPlus, Edit2, Music } from "lucide-react"
import type { Sound } from "@/types/sound"
import type { ChatMessage } from "@/types/chat"
import { mockLibrary } from "@/data/mock-library"

export default function EditSound() {
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [sound, setSound] = useState<Sound | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Find the sound by ID
  useEffect(() => {
    const foundSound = mockLibrary.find((s) => s.id === params.id)
    if (foundSound) {
      setSound(foundSound)
      // Add initial system message
      setMessages([
        {
          id: "welcome",
          type: "system",
          content: `Editing "${foundSound.name}"`,
          timestamp: new Date(),
        },
      ])
    } else {
      // Sound not found, redirect back to library
      router.push("/library")
    }
  }, [params.id, router])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim() || !sound) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate response (in a real app, this would be an API call)
    setTimeout(() => {
      const responseMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        type: "system",
        content: `I've updated "${sound.name}" based on your request: "${inputValue}"`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, responseMessage])
    }, 1000)

    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const insertEditText = (type: "bpm" | "key") => {
    if (!sound) return

    const prefix =
      type === "bpm" ? `Change BPM to ${sound.bpm + 10}` : `Change Key to ${sound.key === "C maj" ? "D maj" : "C maj"}`

    setInputValue(prefix)

    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const goBack = () => {
    router.push("/library")
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!sound) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className={isDark ? "text-white" : "text-gray-900"}>Loading...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={cn("flex flex-col h-screen", isDark ? "bg-[#161616] text-white" : "bg-gray-50 text-gray-900")}>
        {/* Header */}
        <div
          className={cn(
            "flex items-center p-4 border-b",
            isDark ? "border-[#212121] bg-[#161616]" : "border-gray-200 bg-gray-50",
          )}
        >
          <button
            onClick={goBack}
            className={cn(
              "p-2 rounded-full mr-2",
              isDark ? "hover:bg-[#212121] text-gray-400" : "hover:bg-gray-200 text-gray-500",
            )}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-medium">Editing</h1>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto">
          {/* Search query */}
          <div className="text-center mb-4">
            <h2 className={cn("text-lg", isDark ? "text-gray-400" : "text-gray-500")}>
              {sound.name.split(" ")[0].toLowerCase()}
            </h2>
          </div>

          {/* Sound card */}
          <div className="w-full max-w-xl mx-auto mb-auto">
            <div
              className={cn(
                "w-full rounded-lg p-4 mb-4 transition-colors ring-2 ring-purple-500 ring-opacity-50",
                isDark ? "bg-[#212121]" : "bg-white border border-gray-200",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Music className={cn("h-5 w-5 mr-3", isDark ? "text-gray-400" : "text-gray-500")} />
                  <div>
                    <h3 className={cn("font-medium text-base", isDark ? "text-white" : "text-gray-900")}>
                      {sound.name}
                    </h3>
                    <div className="flex items-center text-xs mt-1">
                      <span className={cn("mr-3", isDark ? "text-gray-400" : "text-gray-500")}>{sound.bpm} BPM</span>
                      <span className={cn(isDark ? "text-gray-400" : "text-gray-500")}>{sound.key}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    className={cn(
                      "p-2 rounded-full transition-colors mr-1",
                      isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900",
                    )}
                    aria-label="Download sound"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    className={cn(
                      "p-2 rounded-full transition-colors mr-1",
                      isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900",
                    )}
                    aria-label="Save to library"
                  >
                    <FolderPlus className="h-5 w-5" />
                  </button>
                  <button className={cn("p-2 rounded-full transition-colors text-purple-500")} aria-label="Edit sound">
                    <Edit2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <button
                  onClick={togglePlay}
                  className={cn(
                    "p-2 transition-colors",
                    isDark ? "text-white hover:text-gray-300" : "text-gray-900 hover:text-gray-700",
                  )}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>

                <div className="flex-1 mx-2">
                  <div className="relative h-1 bg-gray-700 bg-opacity-20 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gray-500"
                      style={{ width: `${(currentTime / sound.duration) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  {formatTime(sound.duration)}
                </div>
              </div>

              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={sound.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          </div>

          {/* Messages will be displayed here if needed */}
          <div className="w-full max-w-xl mx-auto">
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom section with edit options and input */}
          <div className="w-full max-w-xl mx-auto mt-auto">
            {/* Edit options */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => insertEditText("bpm")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-colors",
                  isDark
                    ? "bg-[#212121] text-white hover:bg-[#2a2a2a]"
                    : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-100",
                )}
              >
                Change BPM
              </button>
              <button
                onClick={() => insertEditText("key")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-colors",
                  isDark
                    ? "bg-[#212121] text-white hover:bg-[#2a2a2a]"
                    : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-100",
                )}
              >
                Change Key
              </button>
            </div>

            {/* Input area */}
            <div className="mb-4">
              <div
                className={cn(
                  "flex items-center rounded-full overflow-hidden",
                  isDark ? "bg-[#212121] border border-[#333]" : "bg-white border border-gray-200",
                )}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Refine your search..."
                  className={cn(
                    "flex-1 py-3 px-4 bg-transparent border-0 focus:ring-0 focus:outline-none",
                    isDark ? "text-white placeholder:text-gray-400" : "text-gray-900 placeholder:text-gray-500",
                  )}
                  style={{ WebkitAppearance: "none", appearance: "none" }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={cn(
                    "p-3 transition-colors",
                    inputValue.trim()
                      ? isDark
                        ? "text-purple-400 hover:text-purple-300"
                        : "text-purple-600 hover:text-purple-700"
                      : isDark
                        ? "text-gray-600"
                        : "text-gray-400",
                  )}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
