import StreakItem from './StreakItem';

export default function StreakList({ streaks, onOpenCalendar, onAddStreak }) {
  if (streaks.length === 0) {
    return (
      <div className="empty-state">
        <p>No streaks yet. Start tracking your habits!</p>
        <button onClick={onAddStreak} className="btn btn-primary">
          Add Your First Streak
        </button>
      </div>
    );
  }

  return (
    <div className="streak-list">
      <div className="streak-list-header">
        <h2>My Streaks</h2>
        <button onClick={onAddStreak} className="btn btn-primary">
          + Add Streak
        </button>
      </div>
      <div className="streaks">
        {streaks.map(streak => (
          <StreakItem
            key={streak.id}
            streak={streak}
            onOpenCalendar={onOpenCalendar}
          />
        ))}
      </div>
    </div>
  );
}
