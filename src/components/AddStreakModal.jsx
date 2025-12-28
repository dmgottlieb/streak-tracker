import { useState } from 'react';
import { formatDate } from '../utils/dateUtils';
import { createStreak } from '../services/streakService';

export default function AddStreakModal({ userId, onClose }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createStreak(userId, {
        name: name.trim(),
        startDate,
        completions: {}
      });
      onClose();
    } catch (error) {
      console.error('Error creating streak:', error);
      alert('Failed to create streak. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Streak</h2>
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
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Streak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
