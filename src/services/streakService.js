import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { countOf, dayGoalOf } from '../utils/streakUtils';

const STREAKS_COLLECTION = 'streaks';

// Subscribe to user's streaks (real-time updates)
export const subscribeToStreaks = (userId, callback) => {
  const q = query(
    collection(db, STREAKS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const streaks = [];
    snapshot.forEach((doc) => {
      streaks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(streaks);
  });
};

// Create a new streak
export const createStreak = async (userId, streakData) => {
  const docRef = await addDoc(collection(db, STREAKS_COLLECTION), {
    userId,
    name: streakData.name,
    startDate: streakData.startDate,
    completions: streakData.completions || {},
    multi: !!streakData.multi,
    goal: streakData.goal || 1,
    period: streakData.period || 'day',
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Write individual fields of each day's completion, leaving the others
// (note, count, completed) untouched.
// updates: { 'YYYY-MM-DD': { completed?, note?, count? } }
export const updateStreakCompletions = async (streakId, updates) => {
  const streakRef = doc(db, STREAKS_COLLECTION, streakId);
  const fields = {};
  for (const [date, values] of Object.entries(updates)) {
    for (const [key, value] of Object.entries(values)) {
      fields[`completions.${date}.${key}`] = value;
    }
    fields[`completions.${date}.timestamp`] = serverTimestamp();
  }
  await updateDoc(streakRef, fields);
};

export const updateStreakCompletion = (streakId, date, values) =>
  updateStreakCompletions(streakId, { [date]: values });

// Add delta to a counted streak's day. Uses an atomic increment so taps from
// two devices (or quick double taps) aren't lost. `completed` mirrors
// count >= goal for exports; the app itself reads the count.
export const incrementStreakCount = async (streakId, date, delta, completion, goal) => {
  const streakRef = doc(db, STREAKS_COLLECTION, streakId);
  const newCount = Math.max(0, countOf(completion) + delta);
  // A day with `completed` but no count yet must be set explicitly, since
  // incrementing a missing field would start from 0, not from 1.
  const legacy = completion && typeof completion.count !== 'number';
  await updateDoc(streakRef, {
    [`completions.${date}.count`]: legacy ? newCount : increment(delta),
    [`completions.${date}.completed`]: newCount >= goal,
    [`completions.${date}.timestamp`]: serverTimestamp(),
  });
};

// Rename, switch between once-a-day and counted, change goal or period.
// Rewrites each day so stored data stays consistent with the new settings:
// - to counted: every day gets an explicit count (a done day becomes 1)
// - counted: `completed` = the day's count reached the new per-day goal
// - back to once-a-day: `completed` = the count reached the per-day goal
//   that was in effect, so the days that counted stay complete
export const updateStreakSettings = async (streak, { name, multi, goal, period }) => {
  const streakRef = doc(db, STREAKS_COLLECTION, streak.id);
  const fields = { name, multi, goal, period };

  if (multi || streak.multi) {
    const doneAt = multi ? dayGoalOf({ multi, goal, period }) : dayGoalOf(streak);
    for (const [date, completion] of Object.entries(streak.completions || {})) {
      const count = countOf(completion);
      if (typeof completion.count !== 'number') fields[`completions.${date}.count`] = count;
      fields[`completions.${date}.completed`] = count >= doneAt;
    }
  }
  await updateDoc(streakRef, fields);
};

// Delete a streak
export const deleteStreak = async (streakId) => {
  const streakRef = doc(db, STREAKS_COLLECTION, streakId);
  await deleteDoc(streakRef);
};

// Export all user's streaks as JSON
export const exportStreaks = (streaks) => {
  const dataStr = JSON.stringify(streaks, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `streak-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
  link.click();

  URL.revokeObjectURL(url);
};
