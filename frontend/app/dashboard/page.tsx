'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';

interface Analysis {
  id: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await apiFetch('/resume/history');
      setAnalyses(data);
    } catch {
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-1">Your resume analysis overview</p>
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
      ) : analyses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No analyses yet</p>
          <p className="text-sm">Upload a resume to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {analyses.map((a) => (
            <div
              key={a.id}
              className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors cursor-pointer"
              onClick={() => router.push('/analyze')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {new Date(a.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{a.summary}</p>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-bold ${getScoreColor(a.matchScore)}`}>
                    {a.matchScore}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">/100</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {a.matchedSkills?.slice(0, 5).map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-800">
                    {skill}
                  </span>
                ))}
                {a.missingSkills?.slice(0, 3).map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded-full border border-red-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
