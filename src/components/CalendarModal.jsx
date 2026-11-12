import { useState } from 'react';
import { getCalendarDays, getMonthYear, formatDate, parseDate, getTodayString } from '../utils/dateUtils';
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
  // Local completions state so the calendar updates immediately on edit
  const [completions, setCompletions] = useState(streak.completions || {});

  const weeks = padToSixWeeks(getCalendarDays(currentMonth));
  const today = getTodayString();
  const selectedDates = [...selected].sort();
  const anyComplete = selectedDates.some(d => completions[d]?.completed);
  const anyIncomplete = selectedDates.some(d => !completions[d]?.completed);

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const clearSelection = () => {
    setSelected(new Set());
    setEditingNote(false);
  };

  const toggleDay = (dateStr) => {
    setEditingNote(false);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  // Apply updates locally right away, persist, and roll back on failure.
  const save = async (updates) => {
    const previous = completions;
    setCompletions(prev => ({ ...prev, ...updates }));
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
      updates[d] = { completed, note: completions[d]?.note || '' };
    }
    save(updates);
  };

  const startNote = () => {
    setNoteDraft(completions[selectedDates[0]]?.note || '');
    setEditingNote(true);
  };

  const saveNote = () => {
    const d = selectedDates[0];
    save({ [d]: { completed: !!completions[d]?.completed, note: noteDraft.trim() } });
  };

  const renderDay = (date, key) => {
    if (!date) return <div key={key} className="calendar-day empty"></div>;

    const dateStr = formatDate(date);
    const completion = completions[dateStr];
    const isBeforeStart = dateStr < streak.startDate;

    let className = 'calendar-day';
    if (completion?.completed) className += ' completed';
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
        {completion?.completed && <span className="check-mark">✓</span>}
        {completion?.note && <span className="note-indicator">📝</span>}
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

    if (selectedDates.length === 0) {
      return (
        <p className="action-status hint">
          Tap days to select them, then mark them complete or incomplete.
        </p>
      );
    }

    const single = selectedDates.length === 1;
    const note = single ? completions[selectedDates[0]]?.note : '';
    return (
      <>
        <p className="action-status">
          <strong>{single ? shortDate(selectedDates[0]) : `${selectedDates.length} days selected`}</strong>
          {note && <span className="action-note"> — {note}</span>}
        </p>
        <div className="action-buttons">
          {anyIncomplete && (
            <button onClick={() => markSelected(true)} className="btn btn-primary">
              ✓ {anyComplete ? 'All complete' : 'Complete'}
            </button>
          )}
          {anyComplete && (
            <button onClick={() => markSelected(false)} className="btn btn-secondary">
              ✗ {anyIncomplete ? 'All incomplete' : 'Incomplete'}
            </button>
          )}
          {single && (
            <button onClick={startNote} className="btn btn-secondary">
              📝 Note
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
