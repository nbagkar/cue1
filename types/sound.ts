export interface Sound {
  id: string
  name: string
  bpm: number | null
  key: string | null
  duration: number | null
  audioUrl: string | null
  waveform: number[] // For visualization
  isSaved?: boolean
  tags?: string[]
}
