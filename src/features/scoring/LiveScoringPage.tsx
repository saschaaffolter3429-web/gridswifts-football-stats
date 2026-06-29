import { useMemo, useState } from 'react';
import { createInitialGameState, yardlineLabel, type GameState, type PlayInput } from '../../lib/football-engine';
import type { EditorPlayer } from '../../lib/play-editor/playEditorTypes';
import { SmartPlayEditor } from './SmartPlayEditor';

const HOME = 'HOME';
const AWAY = 'AWAY';

const demoPlayers: EditorPlayer[] = [
  { id: 'home_qb_12', teamId: HOME, number: '12', name: 'Home Quarterback', position: 'QB' },
  { id: 'home_rb_21', teamId: HOME, number: '21', name: 'Home Running Back', position: 'RB' },
  { id: 'home_wr_11', teamId: HOME, number: '11', name: 'Home Receiver', position: 'WR' },
  { id: 'home_te_88', teamId: HOME, number: '88', name: 'Home Tight End', position: 'TE' },
  { id: 'home_k_7', teamId: HOME, number: '7', name: 'Home Kicker', position: 'K' },
  { id: 'home_p_9', teamId: HOME, number: '9', name: 'Home Punter', position: 'P' },
  { id: 'home_lb_44', teamId: HOME, number: '44', name: 'Home Linebacker', position: 'LB' },
  { id: 'home_cb_2', teamId: HOME, number: '2', name: 'Home Corner', position: 'CB' },

  { id: 'away_qb_4', teamId: AWAY, number: '4', name: 'Away Quarterback', position: 'QB' },
  { id: 'away_rb_24', teamId: AWAY, number: '24', name: 'Away Running Back', position: 'RB' },
  { id: 'away_wr_10', teamId: AWAY, number: '10', name: 'Away Receiver', position: 'WR' },
  { id: 'away_te_85', teamId: AWAY, number: '85', name: 'Away Tight End', position: 'TE' },
  { id: 'away_k_6', teamId: AWAY, number: '6', name: 'Away Kicker', position: 'K' },
  { id: 'away_p_8', teamId: AWAY, number: '8', name: 'Away Punter', position: 'P' },
  { id: 'away_lb_52', teamId: AWAY, number: '52', name: 'Away Linebacker', position: 'LB' },
  { id: 'away_s_3', teamId: AWAY, number: '3', name: 'Away Safety', position: 'S' },
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

  function handleApply(nextState: GameState, play: PlayInput, description: string) {
    setState(nextState);
    setHistory((old) => [`${play.kind}: ${description}`, ...old]);
  }

  function reset() {
    setState(initial);
    setHistory([]);
  }

  const offense = state.possessionTeamId === HOME ? 'HOME' : 'AWAY';
  const defense = state.defenseTeamId === HOME ? 'HOME' : 'AWAY';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gs-line bg-black overflow-hidden">
        <div className="bg-[#151517] px-6 py-5 flex items-center justify-center gap-10">
          <ScoreTeam label="AWAY" score={state.score[AWAY] ?? 0} active={state.possessionTeamId === AWAY} />
          <div className="text-gs-orange font-black text-2xl">VS</div>
          <ScoreTeam label="HOME" score={state.score[HOME] ?? 0} active={state.possessionTeamId === HOME} />
        </div>

        <div className="p-6 grid grid-cols-5 gap-4">
          <Info label="Quarter" value={state.clock.quarter} />
          <Info label="Clock" value={formatClock(state.clock.secondsRemaining)} />
          <Info label="Down & Distance" value={`${state.down} & ${state.distance}`} />
          <Info label="Ball" value={yardlineLabel(state.absoluteYardline, offense, defense)} />
          <Info label="Drive Plays" value={state.currentDrive.offensivePlays} />
        </div>
      </div>

      <SmartPlayEditor state={state} players={demoPlayers} onApply={handleApply} />

      <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">Play Timeline</h2>
          <button onClick={reset} className="rounded-2xl bg-gs-card2 border border-gs-line px-4 py-2 font-bold">
            Reset Demo
          </button>
        </div>
        <div className="space-y-2">
          {history.map((item, index) => (
            <div key={`${item}_${index}`} className="rounded-2xl bg-gs-card2 border border-gs-line p-4 text-sm">
              {item}
            </div>
          ))}
          {!history.length && <div className="text-zinc-500 text-center py-8">Noch keine Plays.</div>}
        </div>
      </div>
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

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
