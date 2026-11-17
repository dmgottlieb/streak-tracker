import { useState } from 'react';
import { formatDate, getDateRange, getTodayString } from '../utils/dateUtils';
import { createStreak, updateStreakSettings } from '../services/streakService';

// Creates a streak, or edits one when `streak` is given.
export default function AddStreakModal({ userId, streak, onClose }) {
  const editing = !!streak;
  const [name, setName] = useState(streak?.name || '');
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [autoPopulate, setAutoPopulate] = useState(true);
  const [multi, setMulti] = useState(!!streak?.multi);
  const [goalInput, setGoalInput] = useState(String(streak?.goal || 1));
  const [loading, setLoading] = useState(false);

  const goal = Math.min(99, Math.max(1, parseInt(goalInput, 10) || 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editing) {
        await updateStreakSettings(streak, { name: name.trim(), multi, goal: multi ? goal : 1 });
      } else {
        // Generate completions if auto-populate is enabled and start date is in the past
        const completions = {};
        if (autoPopulate && startDate < getTodayString()) {
          getDateRange(startDate, getTodayString()).forEach(date => {
            completions[date] = {
              completed: true,
              note: '',
              ...(multi && { count: goal }),
              timestamp: new Date()
            };
          });
        }

        await createStreak(userId, {
          name: name.trim(),
          startDate,
          completions,
          multi,
          goal: multi ? goal : 1
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving streak:', error);
      alert('Failed to save streak. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? 'Edit Streak' : 'Add New Streak'}</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="streak-name">Streak Name</label>
            <input
              id="streak-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Salad"
              className="input"
              autoFocus
              required
            />
          </div>
          {!editing && (
            <div className="form-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={multi}
                onChange={(e) => setMulti(e.target.checked)}
                className="checkbox"
              />
              <span>Can be done more than once a day</span>
            </label>
          </div>
          {multi && (
            <div className="form-group">
              <label htmlFor="streak-goal">Daily goal (times per day for a day to count)</label>
              <input
                id="streak-goal"
                type="number"
                inputMode="numeric"
                min="1"
                max="99"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onBlur={() => setGoalInput(String(goal))}
                className="input goal-input"
              />
            </div>
          )}
          {!editing && startDate < getTodayString() && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoPopulate}
                  onChange={(e) => setAutoPopulate(e.target.checked)}
                  className="checkbox"
                />
                <span>
                  Mark all past days as complete (from {startDate} to today)
                  {multi && goal > 1 && `, ${goal} times each`}
                </span>
              </label>
            </div>
          )}
          {editing && streak.multi && multi && goal !== (streak.goal || 1) && (
            <p className="form-hint">Changing the goal recalculates which past days count toward the streak.</p>
          )}
          {editing && streak.multi && !multi && (
            <p className="form-hint">
              Days that reached the goal of {streak.goal || 1} stay complete. Counts are kept if you switch back.
            </p>
          )}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editing ? 'Save' : 'Create Streak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
