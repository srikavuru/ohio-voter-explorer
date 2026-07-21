import { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './lib/firebase';
import Dashboard from './pages/Dashboard';
import VoterSearch from './pages/VoterSearch';
import VoterDetail from './pages/VoterDetail';
import AskAI from './pages/AskAI';

export default function App() {
  const [user, setUser] = useState(isFirebaseConfigured ? undefined : null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 text-gray-100">
        <h1 className="text-xl font-semibold">Ohio Voter Explorer</h1>
        <button
          type="button"
          disabled={!isFirebaseConfigured}
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="rounded-md bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sign in with Google
        </button>
        {!isFirebaseConfigured && (
          <p className="text-xs text-gray-500">
            Firebase isn't configured yet — set VITE_FIREBASE_* in .env
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="flex items-center justify-between border-b border-gray-800 px-6 py-3">
        <div className="flex gap-6 text-sm text-gray-300">
          <Link to="/">Dashboard</Link>
          <Link to="/search">Voter Search</Link>
          <Link to="/ask-ai">Ask AI</Link>
        </div>
        <button
          type="button"
          onClick={() => signOut(auth)}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Sign out
        </button>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<VoterSearch />} />
        <Route path="/voter/:id" element={<VoterDetail />} />
        <Route path="/ask-ai" element={<AskAI />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
