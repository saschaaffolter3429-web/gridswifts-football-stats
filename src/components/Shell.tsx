import { Database, FileText, PlaySquare, RadioTower, Trophy, Users } from 'lucide-react';

export type Page = 'dashboard' | 'teams' | 'games' | 'broadcast' | 'reports' | 'database';

const nav: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Trophy size={18} /> },
  { id: 'teams', label: 'Teams', icon: <Users size={18} /> },
  { id: 'games', label: 'Games', icon: <PlaySquare size={18} /> },
  { id: 'broadcast', label: 'Broadcast', icon: <RadioTower size={18} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
  { id: 'database', label: 'Database', icon: <Database size={18} /> },
];

export function Shell({ page, setPage, children }: { page: Page; setPage: (page: Page) => void; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gs-black text-gs-white">
      <div className="grid grid-cols-[260px_1fr] min-h-screen">
        <aside className="border-r border-gs-line bg-[#0b0b0c] p-6">
          <h1 className="text-3xl font-black">GridSwifts</h1>
          <p className="text-gs-soft text-xs tracking-[0.3em] uppercase mt-1">Football Stats 2.0.2</p>
          <nav className="mt-10 space-y-2">
            {nav.map((item) => (
              <button key={item.id} onClick={() => setPage(item.id)} className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${page === item.id ? 'bg-gs-orange text-black font-bold' : 'text-zinc-300 hover:bg-gs-card2 hover:text-white'}`}>
                <span className={page === item.id ? 'text-black' : 'text-gs-orange'}>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
        </aside>
        <section>
          <header className="h-16 border-b border-gs-line bg-[#111113] flex items-center justify-between px-6">
            <div><h2 className="font-bold text-lg">Game Operations Center</h2><p className="text-xs text-zinc-400">Team- und Spielverwaltung mit zentraler SQLite-Datenbank</p></div>
            <div className="rounded-full bg-gs-orange text-black px-4 py-2 font-bold">v2.0.2</div>
          </header>
          <div className="p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
