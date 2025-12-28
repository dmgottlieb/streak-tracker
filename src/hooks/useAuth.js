import { useState, useEffect } from 'react';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Please check your .env file.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error('Firebase is not configured');
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured');
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return { user, loading, signInWithGoogle, signOut, error, isConfigured: isFirebaseConfigured };
};
