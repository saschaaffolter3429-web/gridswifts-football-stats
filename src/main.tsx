import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { databasePath } from './lib/api';
import { Shell } from './components/Shell';
import { TeamsPage } from './features/teams/TeamsPage';
import './styles.css';

type Page = 'dashboard' | 'teams' | 'games' | 'broadcast' | 'reports' | 'database';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [db, setDb] = useState('');

  useEffect(() => {
    databasePath().then(setDb).catch(console.error);
  }, []);

  return (
    <Shell page={page} setPage={setPage}>
      {page === 'teams' ? (
        <TeamsPage />
      ) : (
        <Dashboard db={db} goTeams={() => setPage('teams')} />
      )}
    </Shell>
  );
}

function Dashboard({ db, goTeams }: { db: string; goTeams: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gs-line bg-gs-card p-7">
        <h1 className="text-4xl font-black">GridSwifts 2.0.1</h1>
        <p className="mt-3 text-zinc-400 max-w-3xl">
          Dieses Release aktiviert die erste echte Datenbank-Funktion: Teamverwaltung mit Roster,
          Coaching Staff, Farben, Stadion, Liga und Validierung.
        </p>
        <button onClick={goTeams} className="mt-6 rounded-2xl bg-gs-orange px-6 py-3 text-black font-black">
          Teamverwaltung öffnen
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Zentrale Datenbank" value="Aktiv" sub={db || 'wird geladen...'} />
        <Card title="Modul" value="Teams" sub="erstellen, bearbeiten, löschen" />
        <Card title="Nächster Schritt" value="Games" sub="Spielverwaltung 2.0.2" />
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
