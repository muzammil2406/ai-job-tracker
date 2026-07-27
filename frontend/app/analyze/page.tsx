'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';

interface AnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  resumeSuggestions: string[];
  summary: string;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const [coldEmailRole, setColdEmailRole] = useState('');
  const [coldEmailName, setColdEmailName] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [coldEmail, setColdEmail] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, []);

  const handleAnalyze = async () => {
    if (!file || !jobDescription.trim()) {
      setError('Please upload a resume and enter a job description');
      return;
    }

    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const data = await apiFetch('/analyze/resume', {
        method: 'POST',
        body: formData,
      });

      setResult({
        matchScore: data.matchScore,
        matchedSkills: data.matchedSkills,
        missingSkills: data.missingSkills,
        resumeSuggestions: data.resumeSuggestions || data.suggestions,
        summary: data.summary,
      });
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateEmail = async () => {
    setGeneratingEmail(true);
    setColdEmail('');

    try {
      const data = await apiFetch('/analyze/cold-email', {
        method: 'POST',
        body: JSON.stringify({
          role: coldEmailRole || 'this position',
          jobDescription,
          userName: coldEmailName || 'Applicant',
        }),
      });
      setColdEmail(data.email);
    } catch (err: any) {
      setError(err.message || 'Email generation failed');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(coldEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreRing = (score: number) => {
    if (score >= 75) return 'border-green-500';
    if (score >= 50) return 'border-yellow-500';
    return 'border-red-500';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Resume Analyzer</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
            <h2 className="font-semibold mb-4">Upload Resume</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
              <div className="text-center">
                {file ? (
                  <p className="text-blue-400">{file.name}</p>
                ) : (
                  <>
                    <svg className="mx-auto h-8 w-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-400">Click to upload PDF</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
            <h2 className="font-semibold mb-4">Job Description</h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              placeholder="Paste the job description here..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !file || !jobDescription.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Analyzing...
              </>
            ) : (
              'Analyze Resume'
            )}
          </button>
        </div>

        <div>
          {result ? (
            <div className="space-y-6">
              <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl text-center">
                <p className="text-sm text-gray-400 mb-3">Match Score</p>
                <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full border-4 ${getScoreRing(result.matchScore)}`}>
                  <span className={`text-4xl font-bold ${getScoreColor(result.matchScore)}`}>
                    {result.matchScore}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-400">{result.summary}</p>
              </div>

              {result.matchedSkills.length > 0 && (
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <h3 className="font-semibold mb-3 text-green-400">Matched Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedSkills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-green-900/30 text-green-400 text-sm rounded-full border border-green-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.missingSkills.length > 0 && (
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <h3 className="font-semibold mb-3 text-red-400">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-red-900/30 text-red-400 text-sm rounded-full border border-red-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.resumeSuggestions.length > 0 && (
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <h3 className="font-semibold mb-3">Suggestions</h3>
                  <ol className="space-y-2">
                    {result.resumeSuggestions.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-blue-400 font-mono">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                <h3 className="font-semibold mb-4">Cold Email Generator</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input
                    type="text"
                    value={coldEmailName}
                    onChange={(e) => setColdEmailName(e.target.value)}
                    placeholder="Your name"
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={coldEmailRole}
                    onChange={(e) => setColdEmailRole(e.target.value)}
                    placeholder="Target role"
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleGenerateEmail}
                  disabled={generatingEmail}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {generatingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Generating...
                    </>
                  ) : (
                    'Generate Cold Email'
                  )}
                </button>
              </div>

              {coldEmail && (
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Generated Email</h3>
                    <button
                      onClick={copyEmail}
                      className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={coldEmail}
                    rows={12}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm resize-none focus:outline-none"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>Results will appear here after analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
