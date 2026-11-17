import { useState } from 'react';
import { getCalendarDays, getMonthYear, formatDate, parseDate, getTodayString } from '../utils/dateUtils';
import { goalOf, countOf, isDayDone, calculateStreak, computeStats } from '../utils/streakUtils';
import { updateStreakCompletions } from '../services/streakService';

// Always render 6 week rows so the grid height doesn't change between months.
const padToSixWeeks = (weeks) => {
  const padded = [...weeks];
  while (padded.length < 6) padded.push(new Array(7).fill(null));
  return padded;
};

const shortDate = (dateStr) =>
  parseDate(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function CalendarModal({ streak, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState(() => new Set());
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  // null = untouched: the stepper shows the day's own count (one day) or the goal (several).
  const [countEdit, setCountEdit] = useState(null);
  // Local completions state so the calendar updates immediately on edit
  const [completions, setCompletions] = useState(streak.completions || {});

  const weeks = padToSixWeeks(getCalendarDays(currentMonth));
  const today = getTodayString();
  const goal = goalOf(streak);
  const liveStreak = { ...streak, completions };
  const selectedDates = [...selected].sort();
  const countDraft = countEdit ?? (selectedDates.length === 1 ? countOf(completions[selectedDates[0]]) : goal);
  const anyComplete = selectedDates.some(d => completions[d]?.completed);
  const anyIncomplete = selectedDates.some(d => !completions[d]?.completed);

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const clearSelection = () => {
    setSelected(new Set());
    setEditingNote(false);
    setCountEdit(null);
  };

  const toggleDay = (dateStr) => {
    setEditingNote(false);
    setCountEdit(null);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  // Apply updates locally right away, persist, and roll back on failure.
  // updates: { date: { ...fields to change } }; other fields are kept.
  const save = async (updates) => {
    const previous = completions;
    setCompletions(prev => {
      const next = { ...prev };
      for (const [d, values] of Object.entries(updates)) next[d] = { ...prev[d], ...values };
      return next;
    });
    clearSelection();
    try {
      await updateStreakCompletions(streak.id, updates);
    } catch (error) {
      setCompletions(previous);
      console.error('Error updating completions:', error);
      alert('Failed to update. Please try again.');
    }
  };

  const markSelected = (completed) => {
    const updates = {};
    for (const d of selectedDates) {
      updates[d] = { completed };
    }
    save(updates);
  };

  const setSelectedCounts = () => {
    const updates = {};
    for (const d of selectedDates) {
      updates[d] = { count: countDraft, completed: countDraft >= goal };
    }
    save(updates);
  };

  const startNote = () => {
    setNoteDraft(completions[selectedDates[0]]?.note || '');
    setEditingNote(true);
  };

  const saveNote = () => {
    const d = selectedDates[0];
    save({ [d]: { note: noteDraft.trim() } });
  };

  const renderDay = (date, key) => {
    if (!date) return <div key={key} className="calendar-day empty"></div>;

    const dateStr = formatDate(date);
    const completion = completions[dateStr];
    const isBeforeStart = dateStr < streak.startDate;
    const done = isDayDone(streak, completion);
    const count = countOf(completion);

    let className = 'calendar-day';
    if (done) className += ' completed';
    if (streak.multi && !done && count > 0) className += ' partial';
    if (streak.multi && count > goal) className += ' extra';
    if (dateStr === today) className += ' today';
    if (isBeforeStart) className += ' disabled';
    if (selected.has(dateStr)) className += ' selected';

    return (
      <div
        key={key}
        className={className}
        onClick={() => !isBeforeStart && toggleDay(dateStr)}
        title={completion?.note || ''}
      >
        <span className="day-number">{date.getDate()}</span>
        {streak.multi
          ? count > 0 && <span className="day-count">×{count}</span>
          : done && <span className="check-mark">✓</span>}
        {completion?.note && <span className="note-indicator">📝</span>}
      </div>
    );
  };

  // Shown in the action bar while no days are selected.
  const renderStats = () => {
    const stats = computeStats(liveStreak);
    const current = calculateStreak(liveStreak);
    return (
      <div className="stats">
        <p className="stats-line">
          <strong>{stats.total}</strong> {streak.multi ? 'total' : 'days done'}
          {' · '}Current <strong>{current}d</strong>
          {' · '}Best <strong>{stats.longest}d</strong>
        </p>
        {streak.multi && stats.thresholds.length > 0 && (
          <p className="stats-line secondary">
            Longest at{' '}
            {stats.thresholds.map(({ k, days }, i) => (
              <span key={k}>{i > 0 && ' · '}≥{k} <strong>{days}d</strong></span>
            ))}
          </p>
        )}
        <p className="action-status hint">Tap days to select and edit them.</p>
      </div>
    );
  };

  const renderActionBar = () => {
    if (editingNote) {
      return (
        <>
          <input
            type="text"
            className="input"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveNote()}
            placeholder={`Note for ${shortDate(selectedDates[0])}`}
            autoFocus
          />
          <div className="action-buttons">
            <button onClick={saveNote} className="btn btn-primary">Save note</button>
            <button onClick={() => setEditingNote(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </>
      );
    }

    if (selectedDates.length === 0) return renderStats();

    const single = selectedDates.length === 1;
    const note = single ? completions[selectedDates[0]]?.note : '';
    return (
      <>
        <p className="action-status">
          <strong>{single ? shortDate(selectedDates[0]) : `${selectedDates.length} days selected`}</strong>
          {streak.multi && single && (
            <span className="action-note"> — {countOf(completions[selectedDates[0]])}/{goal}</span>
          )}
          {note && <span className="action-note"> — {note}</span>}
        </p>
        <div className="action-buttons">
          {streak.multi && (
            <>
              <div className="stepper">
                <button onClick={() => setCountEdit(Math.max(0, countDraft - 1))} disabled={countDraft === 0} aria-label="One fewer">−</button>
                <span className="stepper-value">{countDraft}</span>
                <button onClick={() => setCountEdit(Math.min(99, countDraft + 1))} aria-label="One more">+</button>
              </div>
              <button onClick={setSelectedCounts} className="btn btn-primary">Set</button>
            </>
          )}
          {!streak.multi && anyIncomplete && (
            <button onClick={() => markSelected(true)} className="btn btn-primary">
              ✓ {anyComplete ? 'All complete' : 'Complete'}
            </button>
          )}
          {!streak.multi && anyComplete && (
            <button onClick={() => markSelected(false)} className="btn btn-secondary">
              ✗ {anyIncomplete ? 'All incomplete' : 'Incomplete'}
            </button>
          )}
          {single && (
            <button onClick={startNote} className="btn btn-secondary" aria-label="Note">
              {streak.multi ? '📝' : '📝 Note'}
            </button>
          )}
          <button onClick={clearSelection} className="btn btn-secondary">Clear</button>
        </div>
      </>
    );
  };

  return (
    <div className="modal-overlay calendar-overlay" onClick={onClose}>
      <div className="modal calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{streak.name}</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="calendar-header">
            <button onClick={() => changeMonth(-1)} className="btn btn-small">←</button>
            <h3>{getMonthYear(currentMonth)}</h3>
            <button onClick={() => changeMonth(1)} className="btn btn-small">→</button>
          </div>
          <div className="calendar">
            <div className="calendar-weekdays">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            <div className="calendar-weeks">
              {weeks.map((week, i) => (
                <div key={i} className="calendar-week">
                  {week.map((day, j) => renderDay(day, j))}
                </div>
              ))}
            </div>
          </div>

          {/* Fixed-height action bar: its contents change, its size never does */}
          <div className="action-bar">{renderActionBar()}</div>
        </div>
      </div>
    </div>
  );
}
