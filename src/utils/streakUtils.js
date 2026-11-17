import { formatDate, getDateRange, getTodayString, parseDate } from './dateUtils';

// How many threshold rows ("longest streak at ≥k per period") the stats show at most.
const MAX_THRESHOLDS = 5;

// A streak is measured in days or in (Sunday-start) weeks.
export const periodOf = (streak) => (streak.period === 'week' ? 'week' : 'day');
export const isWeekly = (streak) => periodOf(streak) === 'week';

// Goal per period: a day (or week) counts once its total reaches this.
// Once-a-day daily streaks always have goal 1.
export const goalOf = (streak) =>
  streak.multi || isWeekly(streak) ? Math.max(1, streak.goal || 1) : 1;

// What a single day needs to be "done": the goal for daily streaks, any
// activity for weekly ones (the goal applies to the week's total).
export const dayGoalOf = (streak) => (isWeekly(streak) ? 1 : goalOf(streak));

// Times done on a day. Days written before counts existed have only `completed`.
export const countOf = (completion) => {
  if (!completion) return 0;
  if (typeof completion.count === 'number') return Math.max(0, completion.count);
  return completion.completed ? 1 : 0;
};

// A day's contribution: its count for counted streaks, 0/1 otherwise.
const dayValue = (streak, completion) =>
  streak.multi ? countOf(completion) : (completion?.completed ? 1 : 0);

export const isDayDone = (streak, completion) =>
  dayValue(streak, completion) >= dayGoalOf(streak);

// Sunday of the week containing dateStr, as YYYY-MM-DD.
export const weekStartOf = (dateStr) => {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return formatDate(d);
};

// Total for the week starting on `sunday`, counting only days from the
// streak's start date through today.
export const weekTotal = (streak, sunday, completions = streak.completions || {}) => {
  const d = parseDate(sunday);
  const today = getTodayString();
  let total = 0;
  for (let i = 0; i < 7; i++, d.setDate(d.getDate() + 1)) {
    const ds = formatDate(d);
    if (ds >= streak.startDate && ds <= today) total += dayValue(streak, completions[ds]);
  }
  return total;
};

// One total per period from the start date through today, oldest first.
// For weekly streaks the first and last weeks may be partial.
const periodTotals = (streak) => {
  const completions = streak.completions || {};
  const dates = getDateRange(streak.startDate, getTodayString());
  if (!isWeekly(streak)) return dates.map(d => dayValue(streak, completions[d]));

  const totals = [];
  let current = null;
  for (const d of dates) {
    const week = weekStartOf(d);
    if (week !== current) {
      totals.push(0);
      current = week;
    }
    totals[totals.length - 1] += dayValue(streak, completions[d]);
  }
  return totals;
};

// Current run of periods meeting the goal. The period in progress only
// counts once met and never breaks the streak; an unmet partial first week
// just sits before the run, so it never breaks it either.
export const calculateStreak = (streak) => {
  const totals = periodTotals(streak);
  const goal = goalOf(streak);
  let i = totals.length - 1;
  if (i >= 0 && totals[i] < goal) i--;

  let run = 0;
  for (; i >= 0 && totals[i] >= goal; i--) run++;
  return run;
};

export const computeStats = (streak) => {
  const totals = periodTotals(streak);

  const longestAt = (k) => {
    let best = 0, run = 0;
    for (const v of totals) {
      run = v >= k ? run + 1 : 0;
      if (run > best) best = run;
    }
    return best;
  };

  const maxTotal = totals.reduce((a, b) => Math.max(a, b), 0);
  const thresholds = [];
  for (let k = 1; k <= Math.min(maxTotal, MAX_THRESHOLDS); k++) {
    thresholds.push({ k, periods: longestAt(k) });
  }

  return {
    total: totals.reduce((a, b) => a + b, 0),
    longest: longestAt(goalOf(streak)),
    thresholds,
  };
};
