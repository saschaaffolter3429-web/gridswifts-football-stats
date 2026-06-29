import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, UserPlus } from 'lucide-react';
import {
  createDemoSeed,
  deletePlayer,
  deleteTeam,
  listPlayers,
  listTeams,
  savePlayer,
  saveTeam,
  type Player,
  type Team,
} from '../../lib/api';

const positions = ['QB','RB','FB','WR','TE','OL','DL','DE','DT','LB','CB','S','K','P','LS','KR','PR','ATH'];

const emptyTeam = {
  id: null,
  name: '',
  abbr: '',
  location: '',
  league: '',
  stadium: '',
  primary_color: '#ff7a18',
  secondary_color: '#050505',
  logo_path: '',
  coaches_json: '[]',
};

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyTeam);
  const [coachesText, setCoachesText] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerForm, setPlayerForm] = useState({ id: null as string | null, number: '', name: '', position: 'QB' });
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  async function refreshTeams() {
    const data = await listTeams();
    setTeams(data);
    if (!selectedTeamId && data.length) setSelectedTeamId(data[0].id);
  }

  async function refreshPlayers(teamId: string) {
    setPlayers(await listPlayers(teamId));
  }

  useEffect(() => {
    refreshTeams();
  }, []);

  useEffect(() => {
    const team = teams.find((t) => t.id === selectedTeamId);
    if (team) {
      setForm(team);
      try {
        setCoachesText(JSON.parse(team.coaches_json || '[]').join('\n'));
      } catch {
        setCoachesText('');
      }
      refreshPlayers(team.id);
    } else {
      setForm(emptyTeam);
      setPlayers([]);
      setCoachesText('');
    }
  }, [selectedTeamId, teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => `${t.name} ${t.abbr} ${t.location ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [teams, search]);

  async function onSaveTeam() {
    if (!form.name.trim() || !form.abbr.trim()) {
      setMessage('Teamname und Abkürzung sind Pflicht.');
      return;
    }

    try {
      const coaches = coachesText.split('\n').map((x) => x.trim()).filter(Boolean);
      const saved = await saveTeam({
        ...form,
        id: form.id || null,
        abbr: form.abbr.toUpperCase(),
        coaches_json: JSON.stringify(coaches),
      });

      setMessage('Team gespeichert.');
      await refreshTeams();
      setSelectedTeamId(saved.id);
    } catch (error) {
      setMessage(String(error));
    }
  }

  async function onDeleteTeam() {
    if (!form.id) return;
    if (!confirm(`Team ${form.name} wirklich löschen?`)) return;
    await deleteTeam(form.id);
    setSelectedTeamId(null);
    setForm(emptyTeam);
    setPlayers([]);
    await refreshTeams();
  }

  async function onSavePlayer() {
    if (!form.id) {
      setMessage('Bitte zuerst ein Team speichern.');
      return;
    }
    if (!playerForm.number.trim() || !playerForm.name.trim()) {
      setMessage('Nummer und Name sind Pflicht.');
      return;
    }

    try {
      await savePlayer({
        id: playerForm.id,
        team_id: form.id,
        number: playerForm.number,
        name: playerForm.name,
        position: playerForm.position,
      });
      setPlayerForm({ id: null, number: '', name: '', position: 'QB' });
      await refreshPlayers(form.id);
      setMessage('Spieler gespeichert.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  async function onDeletePlayer(id: string) {
    await deletePlayer(id);
    if (form.id) await refreshPlayers(form.id);
  }

  async function seedDemo() {
    await createDemoSeed();
    await refreshTeams();
  }

  return (
    <div className="grid grid-cols-[360px_1fr] gap-6">
      <aside className="rounded-3xl border border-gs-line bg-gs-card p-5 h-[calc(100vh-7rem)] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">Teams</h2>
          <button
            onClick={() => {
              setSelectedTeamId(null);
              setForm(emptyTeam);
              setPlayers([]);
              setCoachesText('');
            }}
            className="rounded-xl bg-gs-orange text-black px-3 py-2 font-bold"
          >
            <Plus size={18} />
          </button>
        </div>

        <input
          className="input mb-4"
          placeholder="Team suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={seedDemo} className="w-full rounded-2xl border border-gs-orange/40 bg-gs-orange/10 text-gs-soft px-4 py-3 mb-4">
          Demo Teams anlegen
        </button>

        <div className="space-y-2">
          {filteredTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`w-full text-left rounded-2xl p-4 border transition ${
                selectedTeamId === team.id ? 'border-gs-orange bg-gs-orange/10' : 'border-gs-line bg-gs-card2 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})` }}
                />
                <div>
                  <div className="font-black">{team.abbr}</div>
                  <div className="text-sm text-zinc-400">{team.name}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-6 h-[calc(100vh-7rem)] overflow-auto pr-2">
        <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black">Teamprofil</h2>
              <p className="text-sm text-zinc-400">Verein, Farben, Liga, Stadion und Coaching Staff</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onDeleteTeam} className="rounded-2xl bg-red-500/15 text-red-300 border border-red-500/30 px-4 py-3 font-bold">
                <Trash2 size={18} />
              </button>
              <button onClick={onSaveTeam} className="rounded-2xl bg-gs-orange text-black px-5 py-3 font-black flex items-center gap-2">
                <Save size={18} /> Speichern
              </button>
            </div>
          </div>

          {message && <div className="mb-4 rounded-2xl bg-gs-orange/10 border border-gs-orange/30 text-gs-soft px-4 py-3">{message}</div>}

          <div className="grid grid-cols-3 gap-4">
            <Field label="Teamname">
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Abkürzung">
              <input className="input" value={form.abbr} onChange={(e) => setForm({ ...form, abbr: e.target.value.toUpperCase().slice(0, 5) })} />
            </Field>
            <Field label="Ortschaft">
              <input className="input" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Liga">
              <input className="input" value={form.league ?? ''} onChange={(e) => setForm({ ...form, league: e.target.value })} />
            </Field>
            <Field label="Stadion / Feld">
              <input className="input" value={form.stadium ?? ''} onChange={(e) => setForm({ ...form, stadium: e.target.value })} />
            </Field>
            <Field label="Logo Pfad">
              <input className="input" value={form.logo_path ?? ''} onChange={(e) => setForm({ ...form, logo_path: e.target.value })} placeholder="später Drag & Drop" />
            </Field>
            <Field label="Primärfarbe">
              <input className="input h-12" type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
            </Field>
            <Field label="Sekundärfarbe">
              <input className="input h-12" type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
            </Field>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Vorschau</span>
              <div className="mt-2 h-12 rounded-2xl border border-white/10" style={{ background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})` }} />
            </label>
          </div>

          <Field label="Coaching Staff">
            <textarea
              className="input min-h-32"
              value={coachesText}
              onChange={(e) => setCoachesText(e.target.value)}
              placeholder={'Ein Coach pro Zeile\nHead Coach ...\nOffensive Coordinator ...'}
            />
          </Field>
        </div>

        <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black">Roster</h2>
              <p className="text-sm text-zinc-400">Spieler mit Nummer und Position verwalten</p>
            </div>
          </div>

          <div className="grid grid-cols-[90px_1fr_120px_130px] gap-3 mb-5">
            <input className="input" placeholder="#" value={playerForm.number} onChange={(e) => setPlayerForm({ ...playerForm, number: e.target.value })} />
            <input className="input" placeholder="Spielername" value={playerForm.name} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} />
            <select className="input" value={playerForm.position} onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}>
              {positions.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button onClick={onSavePlayer} className="rounded-2xl bg-gs-orange text-black font-black flex items-center justify-center gap-2">
              <UserPlus size={18} /> Spieler
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gs-line">
            <table className="w-full text-sm">
              <thead className="bg-black text-gs-orange">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Position</th>
                  <th className="p-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id} className="border-t border-gs-line">
                    <td className="p-3 font-bold">{p.number}</td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3 text-gs-soft">{p.position}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setPlayerForm({ id: p.id, number: p.number, name: p.name, position: p.position })} className="text-gs-soft mr-4">
                        Bearbeiten
                      </button>
                      <button onClick={() => onDeletePlayer(p.id)} className="text-red-300">
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
                {!players.length && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-zinc-500">Noch keine Spieler erfasst.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
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
