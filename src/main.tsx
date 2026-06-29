import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { databasePath } from './lib/api';
import { Shell, type Page } from './components/Shell';
import { TeamsPage } from './features/teams/TeamsPage';
import { GamesPage } from './features/games/GamesPage';
import './styles.css';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [db, setDb] = useState('');

  useEffect(() => { databasePath().then(setDb).catch(console.error); }, []);

  return (
    <Shell page={page} setPage={setPage}>
      {page === 'teams' && <TeamsPage />}
      {page === 'games' && <GamesPage />}
      {page !== 'teams' && page !== 'games' && <Dashboard db={db} goTeams={() => setPage('teams')} goGames={() => setPage('games')} />}
    </Shell>
  );
}

function Dashboard({ db, goTeams, goGames }: { db: string; goTeams: () => void; goGames: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gs-line bg-gs-card p-7">
        <h1 className="text-4xl font-black">GridSwifts 2.0.2</h1>
        <p className="mt-3 text-zinc-400 max-w-3xl">Dieses Release ergänzt die Spielverwaltung. Teams können nun in echten Games verwendet werden. Das Game Setup ist die Basis für Play Log, Drives, Box Score und Broadcast.</p>
        <div className="flex gap-3">
          <button onClick={goTeams} className="mt-6 rounded-2xl bg-gs-card2 border border-gs-line px-6 py-3 text-white font-black">Teamverwaltung öffnen</button>
          <button onClick={goGames} className="mt-6 rounded-2xl bg-gs-orange px-6 py-3 text-black font-black">Spielverwaltung öffnen</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4"><Card title="Zentrale Datenbank" value="Aktiv" sub={db || 'wird geladen...'} /><Card title="Modul" value="Games" sub="erstellen, bearbeiten, löschen" /><Card title="Nächster Schritt" value="Live Scoring" sub="Play Log 2.1.0" /></div>
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return <div className="rounded-3xl border border-gs-line bg-gs-card p-5"><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">{title}</div><div className="mt-2 text-2xl font-black">{value}</div><div className="mt-2 text-xs text-zinc-400 break-all">{sub}</div></div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
