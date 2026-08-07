import deskflowLogo from '../assets/deskflow-logo.png';

export function LoadingSplash() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121317] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.14),transparent_45%)]" />
      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute -inset-5 rounded-full bg-blue-500/15 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-gray-700/70 bg-[#1A1D21] shadow-2xl shadow-blue-950/40">
            <img src={deskflowLogo} alt="DeskFlow" className="h-full w-full object-cover" />
          </div>
        </div>
        <h1 className="text-xl font-black tracking-tight">DeskFlow</h1>
        <p className="mt-1 text-xs text-gray-500">Loading your workspace…</p>
        <div className="mt-6 flex items-center gap-1.5" aria-label="Loading">
          {[0, 1, 2].map(index => (
            <span
              key={index}
              className="h-2 w-2 animate-pulse rounded-full bg-blue-400"
              style={{ animationDelay: `${index * 180}ms` }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
