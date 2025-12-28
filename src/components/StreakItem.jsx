import { useState } from 'react';
import { getTodayString } from '../utils/dateUtils';
import { updateStreakCompletion, deleteStreak } from '../services/streakService';

export default function StreakItem({ streak, onOpenCalendar }) {
  const [updating, setUpdating] = useState(false);
  const today = getTodayString();
  const isCheckedToday = streak.completions?.[today]?.completed || false;

  const handleToggle = async () => {
    setUpdating(true);
    try {
      await updateStreakCompletion(streak.id, today, !isCheckedToday);
    } catch (error) {
      console.error('Error updating streak:', error);
    } finally {
      setUpdating(false);
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

  return (
    <div className="streak-item">
      <div className="streak-main">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isCheckedToday}
            onChange={handleToggle}
            disabled={updating}
            className="checkbox"
          />
          <span className="streak-name">{streak.name}</span>
        </label>
        <div className="streak-info">
          <span className="streak-count">{streak.currentStreak} days</span>
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
