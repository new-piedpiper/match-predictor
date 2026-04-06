import type { LeaderboardEntry, Match, Prediction } from '../types';

interface ResultsSectionProps {
  leaderboard: LeaderboardEntry[];
  matches: Match[];
  predictions: Prediction[];
}

export function ResultsSection({ leaderboard, matches, predictions }: ResultsSectionProps) {
  const completedMatches = matches.filter(match => match.result !== null);

  const getCorrectPredictions = (matchId: string, winningTeam: 'team1' | 'team2'): Prediction[] => {
    return predictions.filter(
      p => p.matchId === matchId && p.predictedWinner === winningTeam
    );
  };

  const getAllPredictions = (matchId: string): Prediction[] => {
    return predictions.filter(p => p.matchId === matchId);
  };

  return (
    <div className="space-y-6">
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userEmail}
                className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${
                    index === 0 ? 'text-yellow-600' :
                    index === 1 ? 'text-gray-500' :
                    index === 2 ? 'text-orange-700' :
                    'text-gray-400'
                  }`}>
                    #{index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-800">{entry.userName}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {entry.last5 && entry.last5.length > 0 ? (
                        entry.last5.map((isCorrect, idx) => (
                          <span key={idx} className="text-base">
                            {isCorrect ? '🟢' : '🔴'}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No history</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-lg text-primary">{entry.score}</span>
                  <span className="text-xs text-gray-500">
                    {entry.score === 1 ? 'point' : 'points'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Match Results</h2>

        {completedMatches.length === 0 ? (
          <p className="text-gray-500 text-sm">No completed matches yet</p>
        ) : (
          <div className="space-y-4">
            {completedMatches.map(match => {
              const correctPredictions = match.result ? getCorrectPredictions(match.id, match.result) : [];
              const allMatchPredictions = getAllPredictions(match.id);
              const winner = match.result === 'team1' ? match.team1 : match.team2;

              return (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-semibold ${
                        match.result === 'team1' ? 'text-primary' : 'text-gray-600'
                      }`}>
                        {match.team1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {match.startTime.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-center text-xs text-gray-400 my-1">vs</div>
                    <div className={`font-semibold ${
                      match.result === 'team2' ? 'text-primary' : 'text-gray-600'
                    }`}>
                      {match.team2}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3">
                    <p className="text-sm">
                      <span className="font-semibold text-blue-800">Winner: {winner}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Correct Predictions ({correctPredictions.length}/{allMatchPredictions.length}):
                    </p>
                    {correctPredictions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {correctPredictions.map(pred => (
                          <span
                            key={pred.userEmail}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {pred.userName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No one predicted correctly</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
