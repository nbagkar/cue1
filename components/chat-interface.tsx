"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Search } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types/chat"
import { SoundCard } from "./sound-card"
import { mockSounds } from "@/data/mock-sounds"

export function ChatInterface() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "system",
      content: "Welcome to Cue! Search for your perfect sound.",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate search (in a real app, this would be an API call)
    const query = inputValue.toLowerCase()
    const results = mockSounds.filter((sound) => sound.name.toLowerCase().includes(query))

    // Add results message
    setTimeout(() => {
      const resultsMessage: ChatMessage = {
        id: `results-${Date.now()}`,
        type: "results",
        content:
          results.length > 0
            ? `Found ${results.length} sounds for "${inputValue}"`
            : `No results found for "${inputValue}"`,
        timestamp: new Date(),
        results: results,
      }

      setMessages((prev) => [...prev, resultsMessage])
    }, 500) // Simulate a slight delay for the response

    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={cn("flex flex-col h-screen", isDark ? "bg-[#161616] text-white" : "bg-gray-50 text-gray-900")}>
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className="mb-6">
              {message.type === "user" ? (
                <div className="flex justify-end">
                  <div
                    className={cn(
                      "rounded-2xl rounded-tr-sm px-4 py-2 max-w-md",
                      isDark ? "bg-purple-600 text-white" : "bg-purple-500 text-white",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ) : message.type === "system" ? (
                <div className="flex justify-start">
                  <div
                    className={cn(
                      "rounded-2xl rounded-tl-sm px-4 py-2 max-w-md",
                      isDark ? "bg-[#212121] text-white" : "bg-white text-gray-900 border border-gray-200",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-start">
                    <div
                      className={cn(
                        "rounded-2xl rounded-tl-sm px-4 py-2",
                        isDark ? "bg-[#212121] text-white" : "bg-white text-gray-900 border border-gray-200",
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                  {message.results && message.results.length > 0 && (
                    <div className="pl-2 mt-2">
                      {message.results.map((sound) => (
                        <SoundCard key={sound.id} sound={sound} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className={cn("border-t p-4", isDark ? "border-[#212121] bg-[#161616]" : "border-gray-200 bg-gray-50")}>
        <div className="max-w-3xl mx-auto">
          <div
            className={cn(
              "flex items-center rounded-full overflow-hidden",
              isDark ? "bg-[#212121]" : "bg-white border border-gray-200",
            )}
          >
            <div className="flex-shrink-0 pl-4">
              <Search className={cn("h-5 w-5", isDark ? "text-gray-400" : "text-gray-500")} />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for sounds..."
              className={cn(
                "flex-1 py-3 px-3 bg-transparent border-0 focus:ring-0 focus:outline-none",
                isDark ? "text-white placeholder:text-gray-400" : "text-gray-900 placeholder:text-gray-500",
              )}
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
  )
}
