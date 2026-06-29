import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { databasePath } from './lib/api';
import { Shell, type Page } from './components/Shell';
import { TeamsPage } from './features/teams/TeamsPage';
import { GamesPage } from './features/games/GamesPage';
import { LiveScoringPage } from './features/scoring/LiveScoringPage';
import './styles.css';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [db, setDb] = useState('');

  useEffect(() => {
    databasePath().then(setDb).catch(console.error);
  }, []);

  return (
    <Shell page={page} setPage={setPage}>
      {page === 'teams' && <TeamsPage />}
      {page === 'games' && <GamesPage />}
      {page === 'scoring' && <LiveScoringPage />}
      {page !== 'teams' && page !== 'games' && page !== 'scoring' && (
        <Dashboard
          db={db}
          goTeams={() => setPage('teams')}
          goGames={() => setPage('games')}
          goScoring={() => setPage('scoring')}
        />
      )}
    </Shell>
  );
}

function Dashboard({
  db,
  goTeams,
  goGames,
  goScoring,
}: {
  db: string;
  goTeams: () => void;
  goGames: () => void;
  goScoring: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gs-line bg-gs-card p-7">
        <h1 className="text-4xl font-black">GridSwifts 2.1.3 Smart Play Engine</h1>
        <p className="mt-3 text-zinc-400 max-w-3xl">
          Dieses Release erweitert den Smart Play Editor mit Templates, Shortcuts und besserer Football-IQ-Prüfung.
          Sie verarbeitet Plays und berechnet daraus automatisch GameState, Down, Distance, Ballposition, Score und Drives.
        </p>
        <div className="flex gap-3">
          <button onClick={goTeams} className="mt-6 rounded-2xl bg-gs-card2 border border-gs-line px-6 py-3 text-white font-black">
            Teams
          </button>
          <button onClick={goGames} className="mt-6 rounded-2xl bg-gs-card2 border border-gs-line px-6 py-3 text-white font-black">
            Games
          </button>
          <button onClick={goScoring} className="mt-6 rounded-2xl bg-gs-orange px-6 py-3 text-black font-black">
            Live Scoring Demo öffnen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Engine" value="Aktiv" sub="GameState → Play → New GameState" />
        <Card title="Datenbank" value="SQLite" sub={db || 'wird geladen...'} />
        <Card title="Nächster Schritt" value="Play Editor" sub="echte Spieler-/Game-Anbindung" />
      </div>
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-gs-line bg-gs-card p-5">
      <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">{title}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      <div className="mt-2 text-xs text-zinc-400 break-all">{sub}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
