import { exportStreaks } from '../services/streakService';

export default function Header({ user, onSignIn, onSignOut, streaks }) {
  const handleExport = () => {
    exportStreaks(streaks);
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="title">Streak Tracker</h1>
        <div className="header-actions">
          {user ? (
            <>
              {streaks.length > 0 && (
                <button onClick={handleExport} className="btn btn-secondary">
                  Export Data
                </button>
              )}
              <div className="user-info">
                <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                <span className="user-name">{user.displayName}</span>
              </div>
              <button onClick={onSignOut} className="btn btn-secondary">
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={onSignIn} className="btn btn-primary">
              Sign In with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
