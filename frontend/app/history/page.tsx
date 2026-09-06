'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { apiFetch, getToken } from '@/lib/api';

interface Resume {
  id: string;
  label: string;
  content: string;
  createdAt: string;
}

interface MatchHistoryItem {
  id: string;
  resume: Resume | null;
  analysis: { matchScore: number } | null;
  createdAt: string;
}

interface ResumeHistoryData {
  resumeHistory: {
    items: MatchHistoryItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

const RESUME_HISTORY_QUERY = gql`
  query ResumeHistory($page: Int, $pageSize: Int) {
    resumeHistory(page: $page, pageSize: $pageSize) {
      items {
        id
        createdAt
        resume {
          id
          label
          content
          createdAt
        }
        analysis {
          matchScore
        }
      }
      total
      page
      pageSize
      totalPages
      hasNextPage
    }
  }
`;

export default function HistoryPage() {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const { data, loading, error, refetch } = useQuery<ResumeHistoryData>(
    RESUME_HISTORY_QUERY,
    {
      variables: { page: 1, pageSize: 10 },
      skip: !ready,
    },
  );

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    setReady(true);
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiFetch(`/resume/${id}`, { method: 'DELETE' });
      refetch();
    } catch {
    } finally {
      setDeleting(null);
    }
  };

  const items = data?.resumeHistory.items ?? [];

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
      ) : error ? (
        <div className="text-center py-20 text-red-400">
          <p className="text-lg mb-2">Failed to load resume history</p>
          <p className="text-sm">{error.message}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No saved resumes</p>
          <p className="text-sm">Analyze a resume to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((r) => (
            <div
              key={r.id}
              className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{r.resume?.label}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {r.analysis && (
                    <p className="text-xs mt-1">
                      <span className="text-blue-400">Match score: </span>
                      <span className="text-gray-300">{r.analysis.matchScore}/100</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {r.resume?.content}
                  </p>
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