import { getDateRange, getTodayString } from './dateUtils';

// How many threshold rows ("longest streak at ≥k per day") the stats show at most.
const MAX_THRESHOLDS = 5;

// Daily goal: a counted ("multi") streak's day counts once its count reaches this.
export const goalOf = (streak) => (streak.multi ? Math.max(1, streak.goal || 1) : 1);

// Times done on a day. Days written before counts existed have only `completed`.
export const countOf = (completion) => {
  if (!completion) return 0;
  if (typeof completion.count === 'number') return Math.max(0, completion.count);
  return completion.completed ? 1 : 0;
};

// A day's value for streak math: its count for counted streaks, 0/1 otherwise.
const dayValue = (streak, completion) =>
  streak.multi ? countOf(completion) : (completion?.completed ? 1 : 0);

export const isDayDone = (streak, completion) =>
  dayValue(streak, completion) >= goalOf(streak);

// Current run of done days ending today, or yesterday if today isn't done yet
// (an unfinished today doesn't break the streak).
export const calculateStreak = (streak) => {
  const completions = streak.completions || {};
  const dates = getDateRange(streak.startDate, getTodayString());
  let i = dates.length - 1;
  if (i >= 0 && !isDayDone(streak, completions[dates[i]])) i--;

  let run = 0;
  for (; i >= 0 && isDayDone(streak, completions[dates[i]]); i--) run++;
  return run;
};

export const computeStats = (streak) => {
  const completions = streak.completions || {};
  const values = getDateRange(streak.startDate, getTodayString())
    .map(d => dayValue(streak, completions[d]));

  const longestAt = (k) => {
    let best = 0, run = 0;
    for (const v of values) {
      run = v >= k ? run + 1 : 0;
      if (run > best) best = run;
    }
    return best;
  };

  const maxValue = values.reduce((a, b) => Math.max(a, b), 0);
  const thresholds = [];
  for (let k = 1; k <= Math.min(maxValue, MAX_THRESHOLDS); k++) {
    thresholds.push({ k, days: longestAt(k) });
  }

  return {
    total: values.reduce((a, b) => a + b, 0),
    longest: longestAt(goalOf(streak)),
    thresholds,
  };
};
