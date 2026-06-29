import { useEffect, useMemo, useState } from 'react';
import {
  createInitialGameState,
  yardlineLabel,
  type GameState,
  type PlayInput,
} from '../../lib/football-engine';
import type { EditorPlayer } from '../../lib/play-editor/playEditorTypes';
import {
  listGames,
  listPlayers,
  listTeams,
  type Game,
  type Player,
  type Team,
} from '../../lib/api';
import { SmartPlayEditor } from './SmartPlayEditor';

export function LiveScoringPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<EditorPlayer[]>([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [state, setState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedGameId),
    [games, selectedGameId],
  );

  const homeTeam = useMemo(
    () => teams.find((team) => team.id === selectedGame?.home_team_id),
    [teams, selectedGame],
  );

  const awayTeam = useMemo(
    () => teams.find((team) => team.id === selectedGame?.away_team_id),
    [teams, selectedGame],
  );

  useEffect(() => {
    refreshBaseData();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      loadGameContext(selectedGame);
    }
  }, [selectedGameId]);

  async function refreshBaseData() {
    try {
      const [gameData, teamData] = await Promise.all([listGames(), listTeams()]);
      setGames(gameData);
      setTeams(teamData);

      if (!selectedGameId && gameData.length > 0) {
        setSelectedGameId(gameData[0].id);
      }

      if (gameData.length === 0) {
        setMessage('Noch kein Spiel vorhanden. Bitte zuerst im Tab Games ein Spiel erstellen.');
      }
    } catch (error) {
      setMessage(`Fehler beim Laden: ${String(error)}`);
    }
  }

  async function loadGameContext(game: Game) {
    try {
      const [homeRoster, awayRoster] = await Promise.all([
        listPlayers(game.home_team_id),
        listPlayers(game.away_team_id),
      ]);

      const mappedPlayers = [...homeRoster, ...awayRoster].map(mapPlayer);
      setPlayers(mappedPlayers);

      const initialState = createInitialGameState({
        gameId: game.id,
        homeTeamId: game.home_team_id,
        awayTeamId: game.away_team_id,
        receivingTeamId: game.home_team_id,
        startAbsoluteYardline: 25,
        quarterLengthSeconds: game.quarter_length_seconds,
      });

      setState(initialState);
      setHistory([]);
      setMessage(`Spiel geladen: ${game.away_abbr} @ ${game.home_abbr}. ${mappedPlayers.length} Spieler verfügbar.`);
    } catch (error) {
      setMessage(`Fehler beim Laden des Spiels: ${String(error)}`);
    }
  }

  function mapPlayer(player: Player): EditorPlayer {
    return {
      id: player.id,
      teamId: player.team_id,
      number: player.number,
      name: player.name,
      position: player.position,
    };
  }

  function handleApply(nextState: GameState, play: PlayInput, description: string) {
    setState(nextState);
    setHistory((old) => [`${play.kind}: ${description}`, ...old]);
    setMessage('Play verarbeitet. Persistenz/Event Store folgt im nächsten Teil von 2.1.2.');
  }

  function resetCurrentGame() {
    if (selectedGame) {
      loadGameContext(selectedGame);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black">Live Scoring</h1>
            <p className="text-sm text-zinc-400 mt-2">
              Production Integration: echtes Spiel, echte Teams und echte Roster aus SQLite.
            </p>
          </div>

          <div className="min-w-[420px]">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Aktives Spiel</span>
              <select
                className="input"
                value={selectedGameId}
                onChange={(event) => setSelectedGameId(event.target.value)}
              >
                <option value="">Spiel auswählen...</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.game_date} — {game.away_abbr} @ {game.home_abbr}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl bg-gs-orange/10 border border-gs-orange/30 text-gs-soft px-4 py-3">
            {message}
          </div>
        )}
      </div>

      {!selectedGame || !state ? (
        <div className="rounded-3xl border border-gs-line bg-black p-10 text-center">
          <h2 className="text-2xl font-black">Kein aktives Spiel geladen</h2>
          <p className="text-zinc-400 mt-3">
            Erstelle zuerst im Tab Games ein Spiel mit zwei Teams und füge in Teams Spieler hinzu.
          </p>
        </div>
      ) : (
        <>
          <GameHeader
            state={state}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            game={selectedGame}
          />

          {players.length === 0 ? (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 text-red-200 p-6">
              Für dieses Spiel wurden keine Spieler gefunden. Bitte in der Teamverwaltung Spieler zu beiden Teams hinzufügen.
            </div>
          ) : (
            <SmartPlayEditor state={state} players={players} onApply={handleApply} />
          )}

          <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">Play Timeline</h2>
              <button
                onClick={resetCurrentGame}
                className="rounded-2xl bg-gs-card2 border border-gs-line px-4 py-2 font-bold"
              >
                Spielzustand zurücksetzen
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
        </>
      )}
    </div>
  );
}

function GameHeader({
  state,
  homeTeam,
  awayTeam,
  game,
}: {
  state: GameState;
  homeTeam?: Team;
  awayTeam?: Team;
  game: Game;
}) {
  const offense = state.possessionTeamId === game.home_team_id ? homeTeam?.abbr ?? 'HOME' : awayTeam?.abbr ?? 'AWAY';
  const defense = state.defenseTeamId === game.home_team_id ? homeTeam?.abbr ?? 'HOME' : awayTeam?.abbr ?? 'AWAY';

  return (
    <div className="rounded-3xl border border-gs-line bg-black overflow-hidden">
      <div className="bg-[#151517] px-6 py-5 flex items-center justify-center gap-10">
        <ScoreTeam team={awayTeam} fallback={game.away_abbr} score={state.score[game.away_team_id] ?? 0} active={state.possessionTeamId === game.away_team_id} />
        <div className="text-gs-orange font-black text-2xl">VS</div>
        <ScoreTeam team={homeTeam} fallback={game.home_abbr} score={state.score[game.home_team_id] ?? 0} active={state.possessionTeamId === game.home_team_id} />
      </div>

      <div className="p-6 grid grid-cols-5 gap-4">
        <Info label="Quarter" value={state.clock.quarter} />
        <Info label="Clock" value={formatClock(state.clock.secondsRemaining)} />
        <Info label="Down & Distance" value={`${state.down} & ${state.distance}`} />
        <Info label="Ball" value={yardlineLabel(state.absoluteYardline, offense, defense)} />
        <Info label="Drive Plays" value={state.currentDrive.offensivePlays} />
      </div>
    </div>
  );
}

function ScoreTeam({
  team,
  fallback,
  score,
  active,
}: {
  team?: Team;
  fallback: string;
  score: number;
  active: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-3xl px-5 py-3 ${active ? 'bg-gs-orange/15 border border-gs-orange/40' : ''}`}>
      <div
        className="w-12 h-12 rounded-2xl border border-white/10"
        style={{
          background: team
            ? `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})`
            : '#222',
        }}
      />
      <div>
        <div className="text-xs text-zinc-500">TEAM</div>
        <div className="font-black text-xl">{team?.abbr ?? fallback}</div>
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
