"use client"

import { useRef, useEffect } from "react"
import { Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SettingsPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPopup({ isOpen, onClose }: SettingsPopupProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const popupRef = useRef<HTMLDivElement>(null)
  const isDark = theme === "dark"

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleLogout = async () => {
    await signOut()
    onClose()
    router.push("/login")
  }

  if (!isOpen) return null

  return (
    <div className="absolute bottom-full left-0 mb-2 z-10" ref={popupRef}>
      <div className={cn("rounded-lg shadow-lg p-4 w-48", isDark ? "bg-[#212121]" : "bg-white border border-gray-200")}>
        <h3 className={cn("text-sm font-medium mb-3", isDark ? "text-white" : "text-gray-900")}>Settings</h3>

        <div className={cn("border-t pt-2 mt-2", isDark ? "border-[#333333]" : "border-gray-200")}>
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center justify-between w-full py-2 text-sm hover:bg-[#2a2a2a] rounded px-2 transition-colors",
              isDark ? "text-white" : "text-gray-900",
            )}
          >
            <span>Theme</span>
            <span className="flex items-center">
              {theme === "dark" ? (
                <Moon size={16} className="text-gray-400" />
              ) : (
                <Sun size={16} className="text-yellow-400" />
              )}
            </span>
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center justify-between w-full py-2 text-sm hover:bg-[#2a2a2a] rounded px-2 transition-colors mt-1",
                isDark ? "text-white" : "text-gray-900",
              )}
            >
              <span>Log out</span>
              <LogOut size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
