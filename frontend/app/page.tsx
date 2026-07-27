export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        AI Job Application Tracker
      </h1>
      <p className="text-gray-400 text-lg mb-8 max-w-md">
        Analyze your resume against job descriptions, get AI-powered suggestions, and generate cold outreach emails.
      </p>
      <div className="flex gap-4">
        <a
          href="/analyze"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          Start Analyzing
        </a>
        <a
          href="/dashboard"
          className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-medium transition-colors"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
