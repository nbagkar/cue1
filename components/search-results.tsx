"use client"

import type { Sound } from "@/types/sound"
import { SoundCard } from "./sound-card"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"

interface SearchResultsProps {
  results: Sound[]
  query: string
}

export function SearchResults({ results, query }: SearchResultsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="w-full max-w-4xl mx-auto">
      {results.length > 0 ? (
        <div>
          <h2
            className={cn("text-xl font-medium mb-6 text-center font-serif", isDark ? "text-white" : "text-gray-900")}
          >
            Results for "{query}"
          </h2>
          <div className="flex flex-col items-center">
            {results.map((sound) => (
              <SoundCard key={sound.id} sound={sound} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className={cn("text-xl font-medium mb-3", isDark ? "text-white" : "text-gray-900")}>No results found</h2>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            Try a different search term or browse our library
          </p>
        </div>
      )}
    </div>
  )
}
