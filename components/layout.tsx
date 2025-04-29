"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import { PanelLeft } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && <Sidebar onToggle={toggleSidebar} />}

      <main className={cn("flex-1 relative", isDark ? "bg-[#161616]" : "bg-gray-50")}>
        {!sidebarOpen && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-1 rounded-full transition-colors",
                isDark ? "hover:bg-[#212121] text-gray-400" : "hover:bg-gray-200 text-gray-500",
              )}
            >
              <PanelLeft size={18} />
              <span className="sr-only">Open sidebar</span>
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
