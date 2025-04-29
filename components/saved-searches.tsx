"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSearchHistory } from "@/lib/search-history"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/theme-context"
import { subDays, isToday, isYesterday } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

interface SearchHistoryItem {
  query: string
  created_at: string
  timestamp?: string // For compatibility
}

interface GroupedSearches {
  today: SearchHistoryItem[]
  yesterday: SearchHistoryItem[]
  past3Days: SearchHistoryItem[]
  past7Days: SearchHistoryItem[]
}

interface Props {
  onSelect?: (query: string) => void
}

export function SavedSearches({ onSelect }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const { user } = useAuth()
  const isDark = theme === "dark"
  const [groupedSearches, setGroupedSearches] = useState<GroupedSearches>({
    today: [],
    yesterday: [],
    past3Days: [],
    past7Days: [],
  })

  const groupSearches = (searches: SearchHistoryItem[]) => {
    console.log("Grouping searches:", searches)
    const grouped: GroupedSearches = {
      today: [],
      yesterday: [],
      past3Days: [],
      past7Days: [],
    }

    searches.forEach((search) => {
      const date = new Date(search.created_at)
      const now = new Date()
      const threeDaysAgo = subDays(now, 3)
      const sevenDaysAgo = subDays(now, 7)

      if (isToday(date)) {
        grouped.today.push(search)
      } else if (isYesterday(date)) {
        grouped.yesterday.push(search)
      } else if (date >= threeDaysAgo && date < now) {
        grouped.past3Days.push(search)
      } else if (date >= sevenDaysAgo && date < threeDaysAgo) {
        grouped.past7Days.push(search)
      }
    })

    console.log("Grouped searches:", grouped)
    return grouped
  }

  useEffect(() => {
    if (!user) {
      console.log("[SavedSearches] No user found, skipping search history fetch")
      return
    }

    console.log("[SavedSearches] Setting up search history for user:", user.id)

    const fetchAndGroupSearches = async () => {
      console.log("[SavedSearches] Fetching search history...")
      const searches = await getSearchHistory()
      console.log("[SavedSearches] Fetched searches:", searches)
      const grouped = groupSearches(searches)
      console.log("[SavedSearches] Setting grouped searches:", grouped)
      setGroupedSearches(grouped)
    }

    // Initial fetch
    fetchAndGroupSearches()

    // Subscribe to real-time updates
    console.log("[SavedSearches] Setting up real-time subscription...")
    const subscription = supabase
      .channel('search_history_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'search_history',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: { new: SearchHistoryItem }) => {
          console.log("[SavedSearches] Received real-time update:", payload)
          // Refetch all searches when a new one is added
          const searches = await getSearchHistory()
          console.log("[SavedSearches] Fetched updated searches:", searches)
          const grouped = groupSearches(searches)
          console.log("[SavedSearches] Setting updated grouped searches:", grouped)
          setGroupedSearches(grouped)
        }
      )
      .subscribe()

    return () => {
      console.log("[SavedSearches] Cleaning up subscription")
      subscription.unsubscribe()
    }
  }, [user])

  const handleSearchClick = (query: string) => {
    // Dispatch a custom event instead of using onSelect or router
    console.log(`[SavedSearches] Dispatching search event for query: ${query}`)
    const event = new CustomEvent('rerunSearch', { detail: { query } })
    window.dispatchEvent(event)

    // If used elsewhere, the onSelect prop could still be useful
    // if (onSelect) {
    //   onSelect(query)
    // } else {
    //   // Default behavior - navigate to search page (now handled by event)
    //   // router.push(`/?q=${encodeURIComponent(query)}`)
    // }
  }

  const renderSearchGroup = (title: string, searches: SearchHistoryItem[]) => {
    if (searches.length === 0) return null

    return (
      <div className="mb-4">
        <h3 className={cn("text-xs font-medium px-4 py-2", isDark ? "text-gray-400" : "text-gray-500")}>{title}</h3>
        <ul>
          {searches.map((search) => (
            <li key={search.created_at}>
              <button
                onClick={() => handleSearchClick(search.query)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm truncate rounded-lg hover:bg-opacity-80 transition-colors",
                  isDark ? "hover:bg-[#212121] text-white" : "hover:bg-gray-200 text-gray-800",
                )}
              >
                {search.query}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="mt-4">
      {renderSearchGroup("Today", groupedSearches.today)}
      {renderSearchGroup("Yesterday", groupedSearches.yesterday)}
      {renderSearchGroup("Past 3 Days", groupedSearches.past3Days)}
      {renderSearchGroup("Past 7 Days", groupedSearches.past7Days)}
    </div>
  )
}
