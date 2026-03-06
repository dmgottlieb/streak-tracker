import { useState } from 'react';
import { getCalendarDays, getMonthYear, formatDate, getTodayString } from '../utils/dateUtils';
import { updateStreakCompletion } from '../services/streakService';

export default function CalendarModal({ streak, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDate, setEditingDate] = useState(null);
  const [editNote, setEditNote] = useState('');
  // Local completions state so the calendar updates immediately on edit
  const [completions, setCompletions] = useState(streak.completions || {});

  const weeks = getCalendarDays(currentMonth);
  const today = getTodayString();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (date) => {
    if (!date) return;
    const dateStr = formatDate(date);
    setEditingDate(dateStr);
    setEditNote(completions[dateStr]?.note || '');
  };

  const handleSaveEdit = async (completed) => {
    if (!editingDate) return;

    // Update local state immediately so the calendar reflects the change
    setCompletions(prev => ({
      ...prev,
      [editingDate]: { completed, note: editNote }
    }));
    setEditingDate(null);
    setEditNote('');

    try {
      await updateStreakCompletion(streak.id, editingDate, completed, editNote);
    } catch (error) {
      // Roll back local state if the server update fails
      setCompletions(prev => ({
        ...prev,
        [editingDate]: streak.completions?.[editingDate] || { completed: false, note: '' }
      }));
      console.error('Error updating completion:', error);
      alert('Failed to update. Please try again.');
    }
  };

  const renderDay = (date) => {
    if (!date) return <div className="calendar-day empty"></div>;

    const dateStr = formatDate(date);
    const completion = completions[dateStr];
    const isCompleted = completion?.completed;
    const isToday = dateStr === today;
    const isBeforeStart = dateStr < streak.startDate;
    const isEditing = dateStr === editingDate;

    let className = 'calendar-day';
    if (isCompleted) className += ' completed';
    if (isToday) className += ' today';
    if (isBeforeStart) className += ' disabled';
    if (isEditing) className += ' editing';

    return (
      <div
        key={dateStr}
        className={className}
        onClick={() => !isBeforeStart && handleDayClick(date)}
        title={completion?.note || ''}
      >
        <span className="day-number">{date.getDate()}</span>
        {isCompleted && <span className="check-mark">✓</span>}
        {completion?.note && <span className="note-indicator">📝</span>}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{streak.name}</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="btn btn-small">←</button>
            <h3>{getMonthYear(currentMonth)}</h3>
            <button onClick={handleNextMonth} className="btn btn-small">→</button>
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
                  {week.map((day, j) => (
                    <div key={j}>
                      {renderDay(day)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Edit panel is always rendered to prevent layout shifts */}
          <div className="edit-panel">
            {editingDate ? (
              <>
                <h4>Edit {editingDate}</h4>
                <div className="form-group">
                  <label htmlFor="note">Note (optional)</label>
                  <textarea
                    id="note"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Add a note about this day..."
                    className="input textarea"
                    rows="3"
                  />
                </div>
                <div className="edit-actions">
                  <button onClick={() => handleSaveEdit(true)} className="btn btn-primary">
                    ✓ Mark Complete
                  </button>
                  <button onClick={() => handleSaveEdit(false)} className="btn btn-secondary">
                    ✗ Mark Incomplete
                  </button>
                  <button
                    onClick={() => { setEditingDate(null); setEditNote(''); }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p className="edit-hint">Click any day to mark it complete or add a note.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

