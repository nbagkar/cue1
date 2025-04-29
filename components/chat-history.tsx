"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/theme-context"
import { useAuth } from "@/context/auth-context"
import { getUserChats, type Chat } from "@/lib/supabase"

export function ChatHistory() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === "dark"
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadChats() {
      if (!user) {
        setChats([])
        setIsLoading(false)
        return
      }

      try {
        const data = await getUserChats(user.id)
        setChats(data)
      } catch (error) {
        console.error('Error loading chats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChats()
  }, [user])

  const handleChatClick = (id: string) => {
    router.push(`/chat/${id}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 border-2 border-t-transparent border-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={cn("text-sm text-center px-4", isDark ? "text-gray-500" : "text-gray-400")}>
          Sign in to view your chat history
        </p>
      </div>
    )
  }

  return (
    <div className={cn("h-full overflow-y-auto", isDark && "dark-scrollbar")}>
      <div className="px-2 py-4">
        <h2 className={cn("text-sm font-medium px-3 mb-2", isDark ? "text-gray-400" : "text-gray-500")}>
          Chat History
        </h2>
        <div className="space-y-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleChatClick(chat.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-colors",
                isDark
                  ? "hover:bg-[#212121] text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <p className="text-sm truncate">{chat.title}</p>
            </button>
          ))}
          {chats.length === 0 && (
            <p className={cn("text-sm px-3", isDark ? "text-gray-500" : "text-gray-400")}>
              No chat history yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 