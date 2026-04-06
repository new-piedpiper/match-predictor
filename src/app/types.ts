export interface Match {
  id: string
  team1: string
  team2: string
  startTime: Date
  result?: 'team1' | 'team2' | null
}

export interface Prediction {
  matchId: string
  userName: string
  userEmail: string
  predictedWinner: 'team1' | 'team2'
  timestamp: Date
}

export interface LeaderboardEntry {
  userEmail: string
  userName: string
  score: number
  last5?: boolean[]
}
