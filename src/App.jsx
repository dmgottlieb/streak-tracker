import { useState } from 'react';
import './App.css';
import { useAuth } from './hooks/useAuth';
import { useStreaks } from './hooks/useStreaks';
import Header from './components/Header';
import StreakList from './components/StreakList';
import AddStreakModal from './components/AddStreakModal';
import CalendarModal from './components/CalendarModal';

function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut, error, isConfigured } = useAuth();
  const { streaks, loading: streaksLoading } = useStreaks(user?.uid);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStreak, setSelectedStreak] = useState(null);

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="app">
        <Header user={null} onSignIn={signInWithGoogle} />
        <div className="welcome">
          <h2>Firebase Not Configured</h2>
          <p style={{ color: '#DC2626' }}>
            Firebase configuration is missing. Please set up your Firebase project and add credentials to .env file.
          </p>
          <p>See README.md for setup instructions.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <Header user={null} onSignIn={signInWithGoogle} />
        <div className="welcome">
          <h2>Welcome to Streak Tracker</h2>
          <p>Track your daily habits and build lasting streaks.</p>
          <p>Sign in with Google to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
        streaks={streaks}
      />
      <main className="main">
        {streaksLoading ? (
          <div className="loading">Loading your streaks...</div>
        ) : (
          <StreakList
            streaks={streaks}
            onOpenCalendar={setSelectedStreak}
            onAddStreak={() => setShowAddModal(true)}
          />
        )}
      </main>

      {showAddModal && (
        <AddStreakModal
          userId={user.uid}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {selectedStreak && (
        <CalendarModal
          streak={selectedStreak}
          onClose={() => setSelectedStreak(null)}
        />
      )}
    </div>
  );
}

export default App;
