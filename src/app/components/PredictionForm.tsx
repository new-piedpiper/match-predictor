import { useState, useEffect } from 'react';
import type { Match, Prediction } from '../types';

interface PredictionFormProps {
  matches: Match[];
  currentUserEmail: string;
  onSubmit: (matchId: string, predictedWinner: 'team1' | 'team2') => void | Promise<void>;
  existingPredictions: Prediction[];
}

export function PredictionForm({
  matches,
  currentUserEmail,
  onSubmit,
  existingPredictions,
}: PredictionFormProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const todaysMatches = matches.filter(match => {
    const timeUntilMatch = match.startTime.getTime() - currentTime.getTime();
    const oneHour = 60 * 60 * 1000;
    const today = new Date();
    const matchDate = new Date(match.startTime);

    return (
      matchDate.getDate() === today.getDate() &&
      matchDate.getMonth() === today.getMonth() &&
      matchDate.getFullYear() === today.getFullYear() &&
      timeUntilMatch > oneHour
    );
  });

  const hasUserPredicted = (matchId: string): boolean => {
    return existingPredictions.some(
      p => p.matchId === matchId && p.userEmail.toLowerCase() === currentUserEmail.toLowerCase()
    );
  };

  const handleTeamClick = async (matchId: string, predictedWinner: 'team1' | 'team2') => {
    if (hasUserPredicted(matchId)) {
      alert('You have already predicted for this match');
      return;
    }

    try {
      await onSubmit(matchId, predictedWinner);
      alert('Prediction submitted successfully!');
    } catch {
      // Error surfaced by App (alert / submitError)
    }
  };

  const getCountdown = (startTime: Date): string => {
    const diff = startTime.getTime() - currentTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const canPredict = (startTime: Date): boolean => {
    const timeUntilMatch = startTime.getTime() - currentTime.getTime();
    const oneHour = 60 * 60 * 1000;
    return timeUntilMatch > oneHour;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-800">Today's Matches</h2>

      {todaysMatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 text-sm">No matches available for prediction today</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaysMatches.map(match => {
            const isPredicted = hasUserPredicted(match.id);
            const userPrediction = existingPredictions.find(
              p => p.matchId === match.id && p.userEmail.toLowerCase() === currentUserEmail.toLowerCase()
            );

            return (
              <div key={match.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {getCountdown(match.startTime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Time to submit prediction
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => void handleTeamClick(match.id, 'team1')}
                    disabled={isPredicted || !canPredict(match.startTime)}
                    className={`flex-1 py-4 rounded-lg font-semibold transition-all ${
                      isPredicted && userPrediction?.predictedWinner === 'team1'
                        ? 'bg-primary text-white'
                        : isPredicted
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : canPredict(match.startTime)
                        ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {match.team1}
                  </button>

                  <div className="text-gray-400 font-bold">VS</div>

                  <button
                    onClick={() => void handleTeamClick(match.id, 'team2')}
                    disabled={isPredicted || !canPredict(match.startTime)}
                    className={`flex-1 py-4 rounded-lg font-semibold transition-all ${
                      isPredicted && userPrediction?.predictedWinner === 'team2'
                        ? 'bg-primary text-white'
                        : isPredicted
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : canPredict(match.startTime)
                        ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {match.team2}
                  </button>
                </div>

                {isPredicted && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-center">
                    <p className="text-sm text-blue-800">
                      ✓ Prediction submitted
                    </p>
                  </div>
                )}

                {!canPredict(match.startTime) && !isPredicted && (
                  <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-center">
                    <p className="text-sm text-red-800">
                      Prediction window closed
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
