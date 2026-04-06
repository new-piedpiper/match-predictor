import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { PredictionForm } from './components/PredictionForm';
import { ResultsSection } from './components/ResultsSection';
import {
  apiConfigured,
  fetchTodayMatch,
  fetchMatchResults,
  fetchPointsTable,
  submitPrediction as submitPredictionApi,
} from '@/lib/api';
import { getSupabase, supabaseConfigured } from '@/lib/supabase';
import type { LeaderboardEntry, Match, Prediction } from './types';

export type { Match, Prediction, LeaderboardEntry } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [formError, setFormError] = useState<string | null>(null);

  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [resultsMatches, setResultsMatches] = useState<Match[]>([]);
  const [resultsPredictions, setResultsPredictions] = useState<Prediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!user?.email) return;
    setDataError(null);
    setDataLoading(true);
    try {
      const [today, results, points] = await Promise.all([
        fetchTodayMatch(user.email),
        fetchMatchResults(),
        fetchPointsTable(),
      ]);
      setTodayMatches(today.matches);
      setMyPredictions(prev => (today.myPredictions.length > 0 ? today.myPredictions : prev));
      setResultsMatches(results.matches);
      setResultsPredictions(results.predictions);
      setLeaderboard(points);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !user?.email || !apiConfigured) return;
    void refreshData();
  }, [user?.email, refreshData]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) return;
    setFormError(null);
    setLoginLoading(true);
    const supabase = getSupabase();

    if (authMode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoginLoading(false);
      if (error) setFormError(error.message);
      else setPassword('');
    } else {
      const { error, data } = await supabase.auth.signUp({ email, password });
      setLoginLoading(false);
      if (error) {
        setFormError(error.message);
        return;
      }
      if (data.user && !data.session) {
        setFormError(null);
        setPassword('');
        alert('Check your email to confirm your account, then sign in.');
      } else {
        setPassword('');
      }
    }
  };

  const handleLogout = async () => {
    if (!supabaseConfigured) return;
    await getSupabase().auth.signOut();
    setUser(null);
    setTodayMatches([]);
    setMyPredictions([]);
    setResultsMatches([]);
    setResultsPredictions([]);
    setLeaderboard([]);
  };

  const handlePrediction = async (matchId: string, predictedWinner: 'team1' | 'team2') => {
    setSubmitError(null);
    if (!user?.email) return;
    const match = todayMatches.find(m => m.id === matchId);
    if (!match) return;
    const winnerTeamName = predictedWinner === 'team1' ? match.team1 : match.team2;
    try {
      await submitPredictionApi(matchId, winnerTeamName);
      setMyPredictions(prev => [
        ...prev.filter(p => p.matchId !== matchId),
        {
          matchId,
          userEmail: user.email!,
          userName: user.email!.split('@')[0] ?? user.email!,
          predictedWinner,
          timestamp: new Date(),
        },
      ]);
      await refreshData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to submit';
      setSubmitError(msg);
      alert(msg);
      throw e;
    }
  };

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center space-y-2">
          <h1 className="text-lg font-semibold text-gray-800">Cricket Predictor</h1>
          <p className="text-sm text-gray-600">
            Add <code className="text-xs bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code> to{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">.env</code>, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary text-white py-4 px-4 shadow-md">
          <h1 className="text-xl font-bold text-center">Cricket Predictor</h1>
        </header>
        <main className="px-4 py-8 max-w-md mx-auto">
          <form onSubmit={handleAuthSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div className="flex rounded-lg border border-gray-200 p-0.5 text-sm">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-medium ${
                  authMode === 'signin' ? 'bg-primary text-white' : 'text-gray-600'
                }`}
                onClick={() => {
                  setAuthMode('signin');
                  setFormError(null);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md font-medium ${
                  authMode === 'signup' ? 'bg-primary text-white' : 'text-gray-600'
                }`}
                onClick={() => {
                  setAuthMode('signup');
                  setFormError(null);
                }}
              >
                Sign up
              </button>
            </div>
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
            )}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2 bg-primary text-white rounded-lg font-semibold text-sm disabled:opacity-60"
            >
              {loginLoading ? 'Please wait…' : authMode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </main>
      </div>
    );
  }

  if (!apiConfigured) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary text-white py-4 px-4 shadow-md">
          <h1 className="text-xl font-bold text-center">Cricket Predictor</h1>
        </header>
        <main className="px-4 py-8 max-w-md mx-auto space-y-4 text-center">
          <p className="text-sm text-gray-600">
            Set <code className="text-xs bg-gray-100 px-1 rounded">VITE_API_BASE_URL</code> in{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">.env</code> to your backend API (see{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">.env.example</code>).
          </p>
          <button type="button" onClick={handleLogout} className="text-sm text-primary underline">
            Sign out
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white py-4 px-4 shadow-md flex flex-col gap-1">
        <h1 className="text-xl font-bold text-center">Cricket Predictor</h1>
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="opacity-90 truncate max-w-[200px]">{user.email}</span>
          <button type="button" onClick={handleLogout} className="underline opacity-90 hover:opacity-100">
            Sign out
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {dataError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex flex-col gap-2">
            <span>{dataError}</span>
            <button type="button" className="text-red-700 underline text-left" onClick={() => void refreshData()}>
              Retry
            </button>
          </div>
        )}
        {submitError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">{submitError}</div>
        )}

        {dataLoading && todayMatches.length === 0 && resultsMatches.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            <PredictionForm
              matches={todayMatches}
              currentUserEmail={user.email ?? ''}
              onSubmit={handlePrediction}
              existingPredictions={myPredictions}
            />

            <ResultsSection
              leaderboard={leaderboard}
              matches={resultsMatches}
              predictions={resultsPredictions}
            />
          </>
        )}
      </main>
    </div>
  );
}
