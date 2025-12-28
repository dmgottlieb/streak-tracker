import { useState, useEffect } from 'react';
import { subscribeToStreaks } from '../services/streakService';
import { calculateStreak } from '../utils/dateUtils';

export const useStreaks = (userId) => {
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setStreaks([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToStreaks(userId, (streaksData) => {
      // Calculate current streak for each streak
      const streaksWithCounts = streaksData.map(streak => ({
        ...streak,
        currentStreak: calculateStreak(streak.completions || {}, streak.startDate)
      }));

      setStreaks(streaksWithCounts);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { streaks, loading };
};
