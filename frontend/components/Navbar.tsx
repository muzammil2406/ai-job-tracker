'use client';

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/dashboard" className="font-bold text-lg text-white">
          AI Job Tracker
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/analyze" className="text-gray-400 hover:text-white transition-colors">
            Analyze
          </a>
          <a href="/history" className="text-gray-400 hover:text-white transition-colors">
            History
          </a>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
