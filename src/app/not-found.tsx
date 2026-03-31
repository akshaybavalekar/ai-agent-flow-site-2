export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-white/70 mb-8">Page not found</p>
        <a 
          href="/" 
          className="inline-block bg-white/20 hover:bg-white/25 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}