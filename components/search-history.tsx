'use client'

import { useEffect, useState } from 'react'
import { getSearchHistory } from '@/lib/search-history'
import { useTheme } from '@/context/theme-context'
import { cn } from '@/lib/utils'
import { isToday, isYesterday, subDays } from 'date-fns'

interface SearchHistoryProps {
  onSelect: (query: string) => void
}

interface SearchHistoryItem {
  query: string
  social?: string
  timestamp: string
}

interface GroupedSearches {
  today: SearchHistoryItem[]
  yesterday: SearchHistoryItem[]
  pastThreeDays: SearchHistoryItem[]
  pastWeek: SearchHistoryItem[]
}

export function SearchHistory({ onSelect }: SearchHistoryProps) {
  const [groupedHistory, setGroupedHistory] = useState<GroupedSearches>({
    today: [],
    yesterday: [],
    pastThreeDays: [],
    pastWeek: []
  })
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    const fetchHistory = async () => {
      const history = await getSearchHistory()
      
      // Group searches by time periods
      const grouped = history.reduce((acc: GroupedSearches, item) => {
        const date = new Date(item.timestamp)
        const now = new Date()
        const threeDaysAgo = subDays(now, 3)
        const sevenDaysAgo = subDays(now, 7)

        if (isToday(date)) {
          acc.today.push(item)
        } else if (isYesterday(date)) {
          acc.yesterday.push(item)
        } else if (date >= threeDaysAgo && date < now) {
          acc.pastThreeDays.push(item)
        } else if (date >= sevenDaysAgo && date < threeDaysAgo) {
          acc.pastWeek.push(item)
        }
        return acc
      }, {
        today: [],
        yesterday: [],
        pastThreeDays: [],
        pastWeek: []
      })

      setGroupedHistory(grouped)
    }

    fetchHistory()
  }, [])

  const renderSection = (title: string, items: SearchHistoryItem[]) => {
    if (items.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className={cn(
          "text-sm font-medium mb-3",
          isDark ? "text-gray-400" : "text-gray-500"
        )}>
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.timestamp}
              onClick={() => onSelect(item.query)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                isDark
                  ? "text-white hover:bg-[#2a2a2a]"
                  : "text-gray-900 hover:bg-gray-100"
              )}
            >
              {item.query}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      {renderSection("Today", groupedHistory.today)}
      {renderSection("Yesterday", groupedHistory.yesterday)}
      {renderSection("Past 3 Days", groupedHistory.pastThreeDays)}
      {renderSection("Past 7 Days", groupedHistory.pastWeek)}
    </div>
  )
} 