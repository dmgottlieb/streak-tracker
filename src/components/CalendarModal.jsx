import { useState } from 'react';
import { getCalendarDays, getMonthYear, formatDate, getTodayString } from '../utils/dateUtils';
import { updateStreakCompletion } from '../services/streakService';

export default function CalendarModal({ streak, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDate, setEditingDate] = useState(null);
  const [editNote, setEditNote] = useState('');

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
    const completion = streak.completions?.[dateStr];
    setEditingDate(dateStr);
    setEditNote(completion?.note || '');
  };

  const handleSaveEdit = async (completed) => {
    if (!editingDate) return;

    try {
      await updateStreakCompletion(streak.id, editingDate, completed, editNote);
      setEditingDate(null);
      setEditNote('');
    } catch (error) {
      console.error('Error updating completion:', error);
      alert('Failed to update. Please try again.');
    }
  };

  const renderDay = (date) => {
    if (!date) return <div className="calendar-day empty"></div>;

    const dateStr = formatDate(date);
    const completion = streak.completions?.[dateStr];
    const isCompleted = completion?.completed;
    const isToday = dateStr === today;
    const startDate = streak.startDate;
    const isBeforeStart = dateStr < startDate;

    let className = 'calendar-day';
    if (isCompleted) className += ' completed';
    if (isToday) className += ' today';
    if (isBeforeStart) className += ' disabled';

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

          {editingDate && (
            <div className="edit-panel">
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
                <button
                  onClick={() => handleSaveEdit(true)}
                  className="btn btn-primary"
                >
                  ✓ Mark Complete
                </button>
                <button
                  onClick={() => handleSaveEdit(false)}
                  className="btn btn-secondary"
                >
                  ✗ Mark Incomplete
                </button>
                <button
                  onClick={() => {
                    setEditingDate(null);
                    setEditNote('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
