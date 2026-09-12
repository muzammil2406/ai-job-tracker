'use client';

import { useEffect, useState } from 'react';
import { getToken, getUser, removeToken } from '@/lib/api';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setIsLoggedIn(Boolean(getToken()));
      setUserName(getUser()?.name ?? null);
    };
    sync();
    window.addEventListener('auth-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleLogout = () => {
    removeToken();
    window.location.href = '/login';
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <a
          href={isLoggedIn ? '/dashboard' : '/'}
          className="font-bold text-lg text-white"
        >
          AI Job Tracker
        </a>
        <div className="flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <>
              <a href="/analyze" className="text-gray-400 hover:text-white transition-colors">
                Analyze
              </a>
              <a href="/history" className="text-gray-400 hover:text-white transition-colors">
                History
              </a>
              <span className="text-gray-300" title="Logged in as">
                {userName}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="text-gray-400 hover:text-white transition-colors">
                Login
              </a>
              <a href="/register" className="text-gray-400 hover:text-white transition-colors">
                Register
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}