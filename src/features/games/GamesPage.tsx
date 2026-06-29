import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { deleteGame, listGames, listTeams, saveGame, type Game, type Team } from '../../lib/api';

const emptyGame = {
  id: null as string | null,
  game_date: new Date().toISOString().slice(0, 10),
  location: '',
  home_team_id: '',
  away_team_id: '',
  quarter_length_seconds: 720,
  status: 'pregame',
  notes: '',
};

export function GamesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyGame);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    try {
      const [teamData, gameData] = await Promise.all([listTeams(), listGames()]);
      setTeams(teamData);
      setGames(gameData);

      setForm((old) => {
        if (!old.home_team_id && teamData.length >= 2) {
          return { ...old, home_team_id: teamData[0].id, away_team_id: teamData[1].id };
        }
        return old;
      });

      setMessage(`Geladen: ${teamData.length} Teams, ${gameData.length} Spiele.`);
    } catch (error) {
      setMessage(`Fehler beim Laden: ${String(error)}`);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const game = games.find((g) => g.id === selectedGameId);
    if (game) {
      setForm({
        id: game.id,
        game_date: game.game_date,
        location: game.location ?? '',
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        quarter_length_seconds: game.quarter_length_seconds,
        status: game.status,
        notes: game.notes ?? '',
      });
    }
  }, [selectedGameId, games]);

  const filteredGames = useMemo(() => {
    return games.filter((g) =>
      `${g.home_team_name} ${g.away_team_name} ${g.location ?? ''} ${g.game_date}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [games, search]);

  async function onSaveGame() {
    if (!form.home_team_id || !form.away_team_id) {
      setMessage('Bitte Heimteam und Auswärtsteam auswählen.');
      return;
    }

    try {
      const saved = await saveGame({
        ...form,
        id: form.id || null,
        quarter_length_seconds: Number(form.quarter_length_seconds),
      });
      setMessage('Spiel gespeichert.');
      await refresh();
      setSelectedGameId(saved.id);
    } catch (error) {
      setMessage(String(error));
    }
  }

  async function onDeleteGame() {
    if (!form.id) return;
    if (!confirm('Spiel wirklich löschen?')) return;
    await deleteGame(form.id);
    setSelectedGameId(null);
    setForm(emptyGame);
    await refresh();
  }

  function newGame() {
    setSelectedGameId(null);
    setForm({
      ...emptyGame,
      home_team_id: teams[0]?.id ?? '',
      away_team_id: teams[1]?.id ?? '',
    });
    setMessage('');
  }

  const home = teams.find((t) => t.id === form.home_team_id);
  const away = teams.find((t) => t.id === form.away_team_id);

  return (
    <div className="grid grid-cols-[380px_1fr] gap-6">
      <aside className="rounded-3xl border border-gs-line bg-gs-card p-5 h-[calc(100vh-7rem)] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">Spiele</h2>
          <div className="flex gap-2">
            <button onClick={refresh} className="rounded-xl bg-gs-card2 border border-gs-line px-3 py-2 font-bold">
              <RefreshCcw size={18} />
            </button>
            <button onClick={newGame} className="rounded-xl bg-gs-orange text-black px-3 py-2 font-bold">
              <CalendarPlus size={18} />
            </button>
          </div>
        </div>

        <input
          className="input mb-4"
          placeholder="Spiel suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-2">
          {filteredGames.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGameId(game.id)}
              className={`w-full text-left rounded-2xl p-4 border transition ${
                selectedGameId === game.id ? 'border-gs-orange bg-gs-orange/10' : 'border-gs-line bg-gs-card2 hover:border-zinc-500'
              }`}
            >
              <div className="text-xs text-zinc-500">{game.game_date}</div>
              <div className="font-black mt-1">{game.away_abbr} @ {game.home_abbr}</div>
              <div className="text-sm text-zinc-400">{game.location || 'kein Ort'}</div>
              <div className="mt-2 text-xs text-gs-soft uppercase tracking-wider">{game.status}</div>
            </button>
          ))}

          {!filteredGames.length && (
            <div className="text-center text-zinc-500 text-sm p-6">
              Noch keine Spiele erfasst.
            </div>
          )}
        </div>
      </aside>

      <section className="space-y-6 h-[calc(100vh-7rem)] overflow-auto pr-2">
        <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black">Game Setup</h2>
              <p className="text-sm text-zinc-400">Heimteam, Auswärtsteam, Ort, Datum und Viertellänge definieren</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onDeleteGame} className="rounded-2xl bg-red-500/15 text-red-300 border border-red-500/30 px-4 py-3 font-bold">
                <Trash2 size={18} />
              </button>
              <button onClick={onSaveGame} className="rounded-2xl bg-gs-orange text-black px-5 py-3 font-black flex items-center gap-2">
                <Save size={18} /> Speichern
              </button>
            </div>
          </div>

          {message && <div className="mb-4 rounded-2xl bg-gs-orange/10 border border-gs-orange/30 text-gs-soft px-4 py-3">{message}</div>}

          {teams.length < 2 && (
            <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3">
              Du brauchst mindestens zwei Teams. In der Teamverwaltung kannst du Teams anlegen.
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Field label="Datum">
              <input className="input" type="date" value={form.game_date} onChange={(e) => setForm({ ...form, game_date: e.target.value })} />
            </Field>

            <Field label="Ort / Stadion">
              <input className="input" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>

            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pregame">Pregame</option>
                <option value="live">Live</option>
                <option value="halftime">Halftime</option>
                <option value="final">Final</option>
                <option value="archived">Archived</option>
              </select>
            </Field>

            <Field label="Auswärtsteam">
              <select className="input" value={form.away_team_id} onChange={(e) => setForm({ ...form, away_team_id: e.target.value })}>
                <option value="">Auswählen...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.abbr} - {t.name}</option>)}
              </select>
            </Field>

            <Field label="Heimteam">
              <select className="input" value={form.home_team_id} onChange={(e) => setForm({ ...form, home_team_id: e.target.value })}>
                <option value="">Auswählen...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.abbr} - {t.name}</option>)}
              </select>
            </Field>

            <Field label="Viertellänge">
              <select className="input" value={form.quarter_length_seconds} onChange={(e) => setForm({ ...form, quarter_length_seconds: Number(e.target.value) })}>
                <option value={600}>10 Minuten</option>
                <option value={720}>12 Minuten</option>
                <option value={900}>15 Minuten</option>
              </select>
            </Field>
          </div>

          <Field label="Notizen">
            <textarea className="input min-h-28" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>

        <div className="rounded-3xl border border-gs-line bg-black overflow-hidden">
          <div className="bg-[#151517] px-6 py-4 flex items-center justify-center gap-10">
            <TeamPreview team={away} side="Away" />
            <div className="text-gs-orange font-black text-2xl">VS</div>
            <TeamPreview team={home} side="Home" />
          </div>
          <div className="p-6 text-center text-zinc-400">
            Dieses Game Setup ist die Grundlage für Play Log, Scoreboard, Drives und Broadcast Center.
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamPreview({ team, side }: { team?: Team; side: string }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl border border-white/10"
        style={{ background: team ? `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})` : '#222' }}
      />
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider">{side}</div>
        <div className="font-black text-xl">{team?.abbr ?? '---'}</div>
        <div className="text-sm text-zinc-400">{team?.name ?? 'Team auswählen'}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mt-4">
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
