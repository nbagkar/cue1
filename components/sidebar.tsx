"use client"
import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Folder, PanelLeft, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/theme-context"
import { SettingsPopup } from "./settings-popup"
import { SavedSearches } from "./saved-searches"
import { useAuth } from "@/context/auth-context"

interface SidebarProps {
  className?: string
  onToggle: () => void
}

export function Sidebar({ className, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const { user, signOut } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isDark = theme === "dark"

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "?"

    const name = user.user_metadata?.full_name || user.email || ""
    if (!name) return "?"

    if (name.includes(" ")) {
      const [first, last] = name.split(" ")
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }

    return name.charAt(0).toUpperCase()
  }

  // Get display name
  const getDisplayName = () => {
    if (!user) return "Guest"
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  }

  return (
    <div
      className={cn(
        "flex flex-col h-screen border-r w-64 transition-colors overflow-hidden",
        isDark ? "bg-[#111111] border-[#212121] text-white" : "bg-gray-100 border-gray-200 text-gray-900",
        className,
      )}
    >
      <div className="flex items-center p-4">
        <h1 className={cn("text-xl font-medium mr-auto", isDark ? "text-white" : "text-gray-900")}>Cue</h1>
        <button
          onClick={onToggle}
          className={cn(
            "p-1 rounded-full transition-colors",
            isDark ? "hover:bg-[#212121] text-gray-400" : "hover:bg-gray-200 text-gray-500",
          )}
        >
          <PanelLeft size={18} />
        </button>
      </div>

      <nav className="px-3">
        <button
          onClick={() => { window.location.href = '/'; }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors w-full text-left",
            pathname === "/" // Assuming '/' is the main search page
              ? isDark
                ? "text-white bg-[#212121]"
                : "text-gray-900 bg-gray-200"
              : isDark
                ? "text-gray-400 hover:bg-[#212121]"
                : "text-gray-600 hover:bg-gray-200",
          )}
        >
          <Search size={18} />
          <span>New Search</span>
        </button>
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors",
            pathname === "/"
              ? isDark
                ? "text-white bg-[#212121]"
                : "text-gray-900 bg-gray-200"
              : isDark
                ? "text-gray-400 hover:bg-[#212121]"
                : "text-gray-600 hover:bg-gray-200",
          )}
        >
          <Search size={18} />
          <span>Search</span>
        </Link>
        <Link
          href="/library"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors",
            pathname === "/library"
              ? isDark
                ? "text-white bg-[#212121]"
                : "text-gray-900 bg-gray-200"
              : isDark
                ? "text-gray-400 hover:bg-[#212121]"
                : "text-gray-600 hover:bg-gray-200",
          )}
        >
          <Folder size={18} />
          <span>Library</span>
        </Link>
      </nav>

      {/* Saved Searches Section */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn("px-3 pt-4", isDark ? "text-gray-400" : "text-gray-500")}>
          <SavedSearches />
        </div>
      </div>

      <div className={cn("p-3 border-t relative", isDark ? "border-[#212121]" : "border-gray-200")}>
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center"
              >
                <span className="text-white text-[10px]">{getUserInitials()}</span>
              </button>
              <div>
                <p className={cn("text-[12px]", isDark ? "text-white" : "text-gray-900")}>{getDisplayName()}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                isDark ? "hover:bg-[#212121] text-gray-400" : "hover:bg-gray-200 text-gray-500",
              )}
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full",
              isDark ? "hover:bg-[#212121] text-gray-300" : "hover:bg-gray-200 text-gray-700",
            )}
          >
            <User size={16} />
            <span className="text-sm">Log in</span>
          </Link>
        )}
        <SettingsPopup isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </div>
  )
}
