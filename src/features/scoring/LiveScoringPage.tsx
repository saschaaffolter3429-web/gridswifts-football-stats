import { useMemo, useState } from 'react';
import { applyPlay, createInitialGameState, yardlineLabel, type GameState, type PlayInput, type PlayKind } from '../../lib/football-engine';

const HOME = 'HOME';
const AWAY = 'AWAY';

const playKinds: PlayKind[] = [
  'RUSH',
  'PASS_COMPLETE',
  'PASS_INCOMPLETE',
  'SACK',
  'SCRAMBLE',
  'PUNT',
  'FIELD_GOAL_GOOD',
  'FIELD_GOAL_MISSED',
  'INTERCEPTION',
  'FUMBLE',
  'PENALTY',
];

export function LiveScoringPage() {
  const initial = useMemo(
    () =>
      createInitialGameState({
        gameId: 'demo_game',
        homeTeamId: HOME,
        awayTeamId: AWAY,
        receivingTeamId: HOME,
        startAbsoluteYardline: 25,
      }),
    [],
  );

  const [state, setState] = useState<GameState>(initial);
  const [history, setHistory] = useState<string[]>([]);
  const [kind, setKind] = useState<PlayKind>('RUSH');
  const [yards, setYards] = useState(0);
  const [returnYards, setReturnYards] = useState(0);
  const [clockEnd, setClockEnd] = useState(700);
  const [message, setMessage] = useState('');

  function submitPlay() {
    const play: PlayInput = {
      id: `play_${state.playIndex + 1}`,
      kind,
      yards: Number(yards),
      returnYards: Number(returnYards),
      clockStartSeconds: state.clock.secondsRemaining,
      clockEndSeconds: Number(clockEnd),
      turnover: kind === 'INTERCEPTION',
    };

    const result = applyPlay(state, play);
    setState(result.next);
    setHistory((old) => [result.description, ...old]);
    setMessage(result.warnings.length ? result.warnings.join(' | ') : 'Play verarbeitet.');
    setClockEnd(Math.max(0, Number(clockEnd) - 20));
    setYards(0);
    setReturnYards(0);
  }

  function reset() {
    setState(initial);
    setHistory([]);
    setMessage('Zurückgesetzt.');
  }

  const offense = state.possessionTeamId === HOME ? 'HOME' : 'AWAY';
  const defense = state.defenseTeamId === HOME ? 'HOME' : 'AWAY';

  return (
    <div className="grid grid-cols-[1fr_420px] gap-6">
      <section className="space-y-6">
        <div className="rounded-3xl border border-gs-line bg-black overflow-hidden">
          <div className="bg-[#151517] px-6 py-5 flex items-center justify-center gap-10">
            <ScoreTeam label="AWAY" score={state.score[AWAY] ?? 0} active={state.possessionTeamId === AWAY} />
            <div className="text-gs-orange font-black text-2xl">VS</div>
            <ScoreTeam label="HOME" score={state.score[HOME] ?? 0} active={state.possessionTeamId === HOME} />
          </div>

          <div className="p-6 grid grid-cols-4 gap-4">
            <Info label="Quarter" value={state.clock.quarter} />
            <Info label="Clock" value={formatClock(state.clock.secondsRemaining)} />
            <Info label="Down & Distance" value={`${state.down} & ${state.distance}`} />
            <Info label="Ball" value={yardlineLabel(state.absoluteYardline, offense, defense)} />
          </div>
        </div>

        <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
          <h2 className="text-2xl font-black">Football Engine Demo</h2>
          <p className="text-sm text-zinc-400 mt-2">
            Diese Seite verwendet bereits die neue Engine. Down, Distance, Ballposition, Score und Drives werden aus Plays berechnet.
          </p>

          {message && <div className="mt-4 rounded-2xl bg-gs-orange/10 border border-gs-orange/30 text-gs-soft px-4 py-3">{message}</div>}

          <div className="grid grid-cols-4 gap-4 mt-6">
            <Field label="Play Type">
              <select className="input" value={kind} onChange={(e) => setKind(e.target.value as PlayKind)}>
                {playKinds.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>

            <Field label="Yards">
              <input className="input" type="number" value={yards} onChange={(e) => setYards(Number(e.target.value))} />
            </Field>

            <Field label="Return Yards">
              <input className="input" type="number" value={returnYards} onChange={(e) => setReturnYards(Number(e.target.value))} />
            </Field>

            <Field label="Clock End">
              <input className="input" type="number" value={clockEnd} onChange={(e) => setClockEnd(Number(e.target.value))} />
            </Field>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={submitPlay} className="rounded-2xl bg-gs-orange text-black px-6 py-3 font-black">
              Play anwenden
            </button>
            <button onClick={reset} className="rounded-2xl bg-gs-card2 border border-gs-line text-white px-6 py-3 font-black">
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
          <h2 className="text-xl font-black mb-4">Current Drive</h2>
          <div className="grid grid-cols-5 gap-3">
            <Info label="Team" value={state.currentDrive.teamId} />
            <Info label="Plays" value={state.currentDrive.offensivePlays} />
            <Info label="Yards" value={state.currentDrive.yards} />
            <Info label="TOP" value={formatClock(state.currentDrive.durationSeconds)} />
            <Info label="Result" value={state.currentDrive.result} />
          </div>
        </div>
      </section>

      <aside className="rounded-3xl border border-gs-line bg-gs-card p-5 h-[calc(100vh-7rem)] overflow-auto">
        <h2 className="text-xl font-black mb-4">Engine Play History</h2>
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={i} className="rounded-2xl bg-gs-card2 border border-gs-line p-4 text-sm">
              {h}
            </div>
          ))}
          {!history.length && <div className="text-zinc-500 text-sm text-center p-8">Noch keine Plays.</div>}
        </div>
      </aside>
    </div>
  );
}

function ScoreTeam({ label, score, active }: { label: string; score: number; active: boolean }) {
  return (
    <div className={`flex items-center gap-4 rounded-3xl px-5 py-3 ${active ? 'bg-gs-orange/15 border border-gs-orange/40' : ''}`}>
      <div className="w-12 h-12 rounded-2xl bg-gs-orange/20 border border-gs-orange/40" />
      <div>
        <div className="text-xs text-zinc-500">TEAM</div>
        <div className="font-black text-xl">{label}</div>
      </div>
      <div className="text-4xl font-black">{score}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-gs-card2 border border-gs-line p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
