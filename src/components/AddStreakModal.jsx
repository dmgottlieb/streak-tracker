import { useState } from 'react';
import { formatDate, getDateRange, getTodayString } from '../utils/dateUtils';
import { createStreak, updateStreakSettings } from '../services/streakService';
import { goalOf, dayGoalOf, periodOf } from '../utils/streakUtils';

// Creates a streak, or edits one when `streak` is given.
export default function AddStreakModal({ userId, streak, onClose }) {
  const editing = !!streak;
  const [name, setName] = useState(streak?.name || '');
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [autoPopulate, setAutoPopulate] = useState(true);
  const [multi, setMulti] = useState(!!streak?.multi);
  const [goalInput, setGoalInput] = useState(String(streak?.goal || 1));
  const [period, setPeriod] = useState(streak ? periodOf(streak) : 'day');
  const [loading, setLoading] = useState(false);

  const weekly = period === 'week';
  // Once-a-day daily streaks have no goal to choose; once-a-day weekly ones top out at 7.
  const hasGoal = multi || weekly;
  const maxGoal = !multi && weekly ? 7 : 99;
  const goal = hasGoal ? Math.min(maxGoal, Math.max(1, parseInt(goalInput, 10) || 1)) : 1;
  const settings = { multi, goal, period };
  const dayGoal = dayGoalOf(settings);
  const goalChanged = editing && (goal !== goalOf(streak) || period !== periodOf(streak));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editing) {
        await updateStreakSettings(streak, { name: name.trim(), ...settings });
      } else {
        // Generate completions if auto-populate is enabled and start date is in the past
        const completions = {};
        if (autoPopulate && startDate < getTodayString()) {
          getDateRange(startDate, getTodayString()).forEach(date => {
            completions[date] = {
              completed: true,
              note: '',
              ...(multi && { count: dayGoal }),
              timestamp: new Date()
            };
          });
        }

        await createStreak(userId, {
          name: name.trim(),
          startDate,
          completions,
          ...settings
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
          <div className="form-group">
            <label htmlFor="streak-period">Goal</label>
            <div className="goal-row">
              {hasGoal ? (
                <input
                  id="streak-goal"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={maxGoal}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onBlur={() => setGoalInput(String(goal))}
                  className="input goal-input"
                  aria-label="Goal"
                />
              ) : (
                <span>Once</span>
              )}
              <span>{hasGoal ? (goal === 1 ? 'time per' : 'times per') : 'per'}</span>
              <select
                id="streak-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input period-select"
              >
                <option value="day">day</option>
                <option value="week">week</option>
              </select>
            </div>
          </div>
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
                  {multi && dayGoal > 1 && `, ${dayGoal} times each`}
                </span>
              </label>
            </div>
          )}
          {goalChanged && (
            <p className="form-hint">
              Changing the goal recalculates which past {weekly ? 'weeks' : 'days'} count toward the streak.
            </p>
          )}
          {editing && streak.multi && !multi && dayGoalOf(streak) > 1 && (
            <p className="form-hint">
              Days that reached {dayGoalOf(streak)} stay complete. Counts are kept if you switch back.
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
