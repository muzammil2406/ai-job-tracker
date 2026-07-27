'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';

interface Resume {
  id: string;
  label: string;
  content: string;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const data = await apiFetch('/resume/history');
      setResumes(data);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiFetch(`/resume/${id}`, { method: 'DELETE' });
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-gray-400 mt-1">Your saved resume versions</p>
        </div>
        <a
          href="/analyze"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          New Analysis
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No saved resumes</p>
          <p className="text-sm">Analyze a resume to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resumes.map((r) => (
            <div
              key={r.id}
              className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{r.label}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/20 border border-red-800/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === r.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
