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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

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
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Update a streak's completion for a specific date
export const updateStreakCompletion = async (streakId, date, completed, note = '') => {
  const streakRef = doc(db, STREAKS_COLLECTION, streakId);
  const completionKey = `completions.${date}`;

  await updateDoc(streakRef, {
    [completionKey]: {
      completed,
      note,
      timestamp: serverTimestamp()
    }
  });
};

// Update streak name
export const updateStreakName = async (streakId, newName) => {
  const streakRef = doc(db, STREAKS_COLLECTION, streakId);
  await updateDoc(streakRef, { name: newName });
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
