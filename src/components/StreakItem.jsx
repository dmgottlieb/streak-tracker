import { useState } from 'react';
import { getTodayString } from '../utils/dateUtils';
import { goalOf, dayGoalOf, countOf, isDayDone, isWeekly, weekStartOf, weekTotal } from '../utils/streakUtils';
import { updateStreakCompletion, incrementStreakCount, deleteStreak } from '../services/streakService';

export default function StreakItem({ streak, onOpenCalendar, onEdit }) {
  const [updating, setUpdating] = useState(false);
  const today = getTodayString();
  const completion = streak.completions?.[today];
  const goal = goalOf(streak);
  const weekly = isWeekly(streak);
  const count = countOf(completion);
  const doneToday = isDayDone(streak, completion);
  // Progress shown in the badge, and whether the current period is met
  const progress = weekly ? weekTotal(streak, weekStartOf(today)) : count;
  const periodMet = weekly ? progress >= goal : doneToday;

  const handleToggle = async () => {
    setUpdating(true);
    try {
      await updateStreakCompletion(streak.id, today, { completed: !doneToday });
    } catch (error) {
      console.error('Error updating streak:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Not disabled while saving: increments are atomic, so fast taps all count.
  const handleStep = async (delta) => {
    try {
      await incrementStreakCount(streak.id, today, delta, completion, dayGoalOf(streak));
    } catch (error) {
      console.error('Error updating count:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${streak.name}"?`)) {
      try {
        await deleteStreak(streak.id);
      } catch (error) {
        console.error('Error deleting streak:', error);
      }
    }
  };

  const countState = doneToday ? 'done' : count > 0 ? 'partial' : '';
  const showProgress = streak.multi || weekly;

  return (
    <div className="streak-item">
      <div className="streak-main">
        {streak.multi ? (
          <div className="checkbox-label">
            <button
              onClick={() => handleStep(1)}
              className={`count-button ${countState}`}
              aria-label={`Add one to ${streak.name} (${count} today)`}
            >
              {count || '+'}
            </button>
            <span className="streak-name">{streak.name}</span>
          </div>
        ) : (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={doneToday}
              onChange={handleToggle}
              disabled={updating}
              className="checkbox"
            />
            <span className="streak-name">{streak.name}</span>
          </label>
        )}
        <div className="streak-info">
          <span className={`streak-count ${periodMet ? 'streak-active' : ''}`}>
            {streak.currentStreak} {weekly ? 'week' : 'day'}{streak.currentStreak === 1 ? '' : 's'}
            {!showProgress && doneToday && <span className="streak-badge">✓ Today</span>}
          </span>
          {showProgress && (
            <span className="today-progress">
              {/* Slot is always reserved so the row doesn't shift when it appears */}
              {streak.multi && (
                <button
                  onClick={() => handleStep(-1)}
                  className="step-down"
                  style={{ visibility: count > 0 ? 'visible' : 'hidden' }}
                  disabled={count === 0}
                  aria-label={`Remove one from ${streak.name}`}
                >
                  −
                </button>
              )}
              <span className={`streak-badge ${periodMet ? '' : 'pending'}`}>
                {progress}/{goal} {weekly ? 'this wk' : 'today'}
              </span>
            </span>
          )}
        </div>
      </div>
      <div className="streak-actions">
        <button
          onClick={() => onOpenCalendar(streak)}
          className="btn btn-small"
          title="View history"
        >
          📅 History
        </button>
        <button
          onClick={() => onEdit(streak)}
          className="btn btn-small"
          title="Edit streak"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          className="btn btn-small btn-danger"
          title="Delete streak"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
