"use client"

import { PanelLeft } from "lucide-react"

interface SidebarTriggerProps {
  onClick: () => void
  className?: string
}

export function SidebarTrigger({ onClick, className }: SidebarTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`p-1 rounded-full hover:bg-[#212121] text-gray-400 transition-colors ${className}`}
    >
      <PanelLeft size={18} />
      <span className="sr-only">Open sidebar</span>
    </button>
  )
}
