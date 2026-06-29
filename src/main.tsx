import React from 'react';
import ReactDOM from 'react-dom/client';
import { Database, PlaySquare, RadioTower, Users, Trophy } from 'lucide-react';
import './styles.css';

function App() {
  return (
    <main className="min-h-screen bg-gs-black text-gs-white">
      <div className="grid grid-cols-[260px_1fr] min-h-screen">
        <aside className="border-r border-gs-line bg-[#0b0b0c] p-6">
          <h1 className="text-3xl font-black">GridSwifts</h1>
          <p className="text-gs-soft text-xs tracking-[0.3em] uppercase mt-1">Football Stats 2.0</p>

          <nav className="mt-10 space-y-2">
            <Nav icon={<Trophy size={18}/>} label="Dashboard" />
            <Nav icon={<PlaySquare size={18}/>} label="Play Log" />
            <Nav icon={<RadioTower size={18}/>} label="Broadcast" />
            <Nav icon={<Users size={18}/>} label="Teams" />
            <Nav icon={<Database size={18}/>} label="Database" />
          </nav>
        </aside>

        <section>
          <header className="h-16 border-b border-gs-line bg-[#111113] flex items-center justify-between px-6">
            <div>
              <h2 className="font-bold text-lg">Game Operations Center</h2>
              <p className="text-xs text-zinc-400">Neue professionelle Basis: Tauri + React + SQLite</p>
            </div>
            <div className="rounded-full bg-gs-orange text-black px-4 py-2 font-bold">v2.0.0</div>
          </header>

          <div className="p-6 grid grid-cols-4 gap-4">
            <Stat title="Teams" value="0" />
            <Stat title="Games" value="0" />
            <Stat title="Drives" value="0" />
            <Stat title="Database" value="Ready" />
          </div>

          <div className="px-6 grid grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
              <h3 className="text-2xl font-black">Nächster Entwicklungsschritt</h3>
              <p className="text-zinc-400 mt-3">
                Diese Version ist die professionelle Projektbasis. Als nächstes werden Teamverwaltung,
                zentrale SQLite-Datenbank, Spielverwaltung und der neue Play Editor vollständig angebunden.
              </p>

              <div className="mt-6 rounded-2xl bg-gs-card2 p-5">
                <h4 className="font-bold text-gs-soft">Play Counting Regel</h4>
                <p className="text-sm text-zinc-300 mt-2">
                  In GridSwifts 2.0 zählen nur noch Passing und Running Plays zu den Total Plays.
                  Keine Penaltys, keine Timeouts, keine Kicks.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-gs-line bg-black overflow-hidden">
              <div className="bg-[#151517] py-4 text-center font-black">Broadcast Preview</div>
              <div className="h-72 bg-gradient-to-b from-[#222] to-[#0b3d1f] relative">
                <div className="absolute left-10 right-10 bottom-10 h-36 bg-gs-field border-2 border-white skew-x-[-8deg]">
                  <div className="absolute left-0 top-0 bottom-0 w-10 bg-blue-500" />
                  <div className="absolute right-0 top-0 bottom-0 w-10 bg-blue-500" />
                  <div className="absolute left-[30%] top-16 w-[35%] border-t-8 border-gs-orange" />
                  <div className="absolute left-[63%] top-[3.6rem] w-6 h-6 rounded-full bg-orange-900 border-2 border-white" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Nav({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-zinc-300 hover:bg-gs-card2 hover:text-white">
      <span className="text-gs-orange">{icon}</span>
      {label}
    </button>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-gs-line bg-gs-card p-5">
      <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
