import { getSupabase } from '@/lib/supabase'
import type { LeaderboardEntry, Match, Prediction } from '@/app/types'

function baseUrl(): string {
  const b = import.meta.env.VITE_API_BASE_URL
  if (!b?.trim()) throw new Error('VITE_API_BASE_URL is not set in .env')
  return b.replace(/\/$/, '')
}

function joinPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl()}${p}`
}

export const apiConfigured = Boolean(import.meta.env.VITE_API_BASE_URL?.trim())

/** Defaults match your local Spring-style routes; override with VITE_API_PATH_* */
const paths = {
  today: () => import.meta.env.VITE_API_PATH_TODAY ?? '/api/ipl-matches-today',
  previous: () => import.meta.env.VITE_API_PATH_PREVIOUS ?? '/api/ipl-match-previous',
  points: () => import.meta.env.VITE_API_PATH_POINTS ?? '/api/results',
  predict: () => import.meta.env.VITE_API_PATH_PREDICT ?? '/api/submitPrediction',
}

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  const h: Record<string, string> = {}
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

/** GET — safe, idempotent reads. No Content-Type body. */
async function apiGet(path: string): Promise<Response> {
  return fetch(joinPath(path), {
    method: 'GET',
    headers: await authHeaders(),
  })
}

/** POST with JSON body — for creates / actions (e.g. submit prediction). */
async function apiPostJson(path: string, body: unknown): Promise<Response> {
  return fetch(joinPath(path), {
    method: 'POST',
    headers: {
      ...(await authHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

/** IPL today match row from GET /api/ipl-matches-today */
function parseIplMatchRow(raw: unknown): Match | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const mid = o.matchId ?? o.id
  const id = mid != null ? String(mid) : ''
  const team1 = String(o.team1 ?? '')
  const team2 = String(o.team2 ?? '')
  const startStr = o.matchDate ?? o.match_date ?? o.startTime ?? o.start_time
  const startTime = startStr ? new Date(String(startStr)) : new Date(NaN)
  if (!id || !team1 || !team2 || Number.isNaN(startTime.getTime())) return null
  return { id, team1, team2, startTime, result: null }
}

function pickTeamSide(teamName: string, team1: string, team2: string): 'team1' | 'team2' | null {
  const t = teamName.trim().toLowerCase()
  if (t === team1.trim().toLowerCase()) return 'team1'
  if (t === team2.trim().toLowerCase()) return 'team2'
  return null
}

function parseLastFiveForm(s: string | undefined): boolean[] | undefined {
  if (!s || typeof s !== 'string') return undefined
  const chars = s.trim().toUpperCase().split('')
  if (chars.length === 0) return undefined
  return chars.map(c => c === 'W')
}

/**
 * GET /api/ipl-matches-today — response is a JSON array of match rows.
 */
export async function fetchTodayMatch(_userEmail: string): Promise<{
  matches: Match[]
  myPredictions: Prediction[]
}> {
  const res = await apiGet(paths.today())
  if (!res.ok) throw new Error(await readError(res))
  const json: unknown = await res.json()
  const arr = Array.isArray(json) ? json : []
  const matches = arr.map(parseIplMatchRow).filter((m): m is Match => m !== null)

  return { matches, myPredictions: [] }
}

/**
 * GET /api/ipl-match-previous — latest past match and all predictions (Spring: {@code PreviousMatchResponse}).
 */
export async function fetchMatchResults(): Promise<{ matches: Match[]; predictions: Prediction[] }> {
  const res = await apiGet(paths.previous())
  if (!res.ok) throw new Error(await readError(res))
  const json: unknown = await res.json()
  const list = Array.isArray(json) ? json : []
  
  const allMatches: Match[] = []
  const allPredictions: Prediction[] = []

  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const matchRaw = row.match
    const predsRaw = row.predictions
    if (!matchRaw || typeof matchRaw !== 'object') continue

    const m = matchRaw as Record<string, unknown>
    const team1 = String(m.team1 ?? '')
    const team2 = String(m.team2 ?? '')
    const id = String(m.matchId ?? '')
    const startStr = m.matchDate ?? m.match_date
    const startTime = startStr ? new Date(String(startStr)) : new Date(NaN)
    const actualWinner = m.actualWinner != null ? String(m.actualWinner) : null
    const result = actualWinner && actualWinner.length > 0 ? pickTeamSide(actualWinner, team1, team2) : null
    
    allMatches.push({ id, team1, team2, startTime, result })

    if (Array.isArray(predsRaw)) {
      for (const p of predsRaw) {
        if (!p || typeof p !== 'object') continue
        const o = p as Record<string, unknown>
        const userName = String(o.userName ?? o.user_name ?? '')
        const predicted = String(o.predictedWinner ?? o.predicted_winner ?? '')
        if (!userName || !predicted) continue
        const predictedWinner = pickTeamSide(predicted, team1, team2)
        if (!predictedWinner) continue
        allPredictions.push({
          matchId: id,
          userName,
          userEmail: userName,
          predictedWinner,
          timestamp: new Date(),
        })
      }
    }
  }

  return { matches: allMatches, predictions: allPredictions }
}

/**
 * GET /api/results — points table.
 * Example row: { userName, points, lastFiveMatchForm: "WLLLL" }
 */
export async function fetchPointsTable(): Promise<LeaderboardEntry[]> {
  const res = await apiGet(paths.points())
  if (!res.ok) throw new Error(await readError(res))
  const json: unknown = await res.json()
  const list = Array.isArray(json) ? json : []
  return list
    .map((row): LeaderboardEntry | null => {
      if (!row || typeof row !== 'object') return null
      const o = row as Record<string, unknown>
      const userName = String(o.userName ?? o.user_name ?? '')
      if (!userName) return null
      const points = Number(o.points ?? o.score ?? 0)
      const form = o.lastFiveMatchForm ?? o.last_five_match_form ?? o.last5
      const last5 =
        typeof form === 'string'
          ? parseLastFiveForm(form)
          : Array.isArray(form)
            ? form.map(x => Boolean(x))
            : undefined
      return {
        userEmail: userName,
        userName,
        score: Number.isFinite(points) ? points : 0,
        last5,
      }
    })
    .filter((e): e is LeaderboardEntry => e !== null)
}

/**
 * POST /api/submitPrediction
 * Body: { "matchId": number, "winner": "Sunrisers Hyderabad" }
 */
export async function submitPrediction(matchId: string, winnerTeamName: string): Promise<void> {
  const id = Number(matchId)
  if (!Number.isFinite(id)) throw new Error('Invalid match id')
  const res = await apiPostJson(paths.predict(), {
    matchId: id,
    winner: winnerTeamName,
  })
  if (!res.ok) throw new Error(await readError(res))
}

async function readError(res: Response): Promise<string> {
  try {
    const t = await res.text()
    if (!t) return res.statusText || `HTTP ${res.status}`
    try {
      const j = JSON.parse(t) as { message?: string; error?: string }
      return j.message ?? j.error ?? t
    } catch {
      return t
    }
  } catch {
    return res.statusText || `HTTP ${res.status}`
  }
}
