export interface SavedSearch {
  id: string
  query: string
  createdAt: Date
}

export type SavedSearchPeriod = "today" | "yesterday" | "past3Days" | "past7Days"

export interface GroupedSearches {
  today: SavedSearch[]
  yesterday: SavedSearch[]
  past3Days: SavedSearch[]
  past7Days: SavedSearch[]
}
