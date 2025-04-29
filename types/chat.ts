import type { Sound } from "./sound"

export type MessageType = "user" | "system" | "results"

export interface ChatMessage {
  id: string
  type: MessageType
  content: string
  timestamp: Date
  results?: Sound[]
}
