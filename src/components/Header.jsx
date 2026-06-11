import { exportStreaks } from '../services/streakService';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function Header({ user, onSignIn, onSignOut, streaks }) {
  const { isInstallable, promptInstall } = usePWAInstall();

  const handleExport = () => {
    exportStreaks(streaks);
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      console.log('User accepted PWA install');
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="title">Streak Tracker</h1>
        <div className="header-actions">
          {isInstallable && (
            <button onClick={handleInstall} className="btn btn-primary">
              📲 Install App
            </button>
          )}
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
