import { useEffect, useMemo, useState } from 'react';
import { Edit3, Trash2, X } from 'lucide-react';
import { yardlineLabel, type GameState, type PlayInput } from '../../lib/football-engine';
import type { EditorPlayer } from '../../lib/play-editor/playEditorTypes';
import {
  clearGameEvents,
  listGames,
  listPlayers,
  listTeams,
  type Game,
  type Player,
  type Team,
} from '../../lib/api';
import {
  appendPlayEvent,
  loadPlayEvents,
  rebuildGameStateFromEvents,
  removePlayEvent,
  updatePlayEvent,
  type RebuiltTimelineItem,
  type StoredPlayEvent,
} from '../../lib/event-store';
import { SmartPlayEditor } from './SmartPlayEditor';

type EditForm = {
  description: string;
  quarter: string;
  clockStartSeconds: number;
  clockEndSeconds: number;
  yards: number;
  returnYards: number;
  touchdown: boolean;
  firstDown: boolean;
  note: string;
};

export function LiveScoringPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<EditorPlayer[]>([]);
  const [events, setEvents] = useState<StoredPlayEvent[]>([]);
  const [timeline, setTimeline] = useState<RebuiltTimelineItem[]>([]);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [state, setState] = useState<GameState | null>(null);
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

  const selectedTimelineItem = useMemo(
    () => timeline.find((item) => item.eventId === selectedTimelineId) ?? null,
    [timeline, selectedTimelineId],
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
      const [homeRoster, awayRoster, storedEvents] = await Promise.all([
        listPlayers(game.home_team_id),
        listPlayers(game.away_team_id),
        loadPlayEvents(game.id),
      ]);

      const mappedPlayers = [...homeRoster, ...awayRoster].map(mapPlayer);
      setPlayers(mappedPlayers);
      setEvents(storedEvents);
      applyRebuild(game, storedEvents);
      setSelectedTimelineId(null);
      setEditingEventId(null);
      setEditForm(null);
      setMessage(
        `Spiel geladen: ${game.away_abbr} @ ${game.home_abbr}. ${mappedPlayers.length} Spieler, ${storedEvents.length} Events.`,
      );
    } catch (error) {
      setMessage(`Fehler beim Laden des Spiels: ${String(error)}`);
    }
  }

  function applyRebuild(game: Game, sourceEvents: StoredPlayEvent[]) {
    const rebuilt = rebuildGameStateFromEvents({ game, events: sourceEvents });
    setState(rebuilt.state);
    setTimeline(rebuilt.timeline);

    if (rebuilt.warnings.length > 0) {
      setMessage(`Rebuild mit Warnungen: ${rebuilt.warnings.join(' | ')}`);
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

  async function reloadEventsForGame(game: Game, selectedEventId?: string | null) {
    const storedEvents = await loadPlayEvents(game.id);
    setEvents(storedEvents);
    applyRebuild(game, storedEvents);
    setSelectedTimelineId(selectedEventId ?? null);
    return storedEvents;
  }

  async function handleApply(_nextState: GameState, play: PlayInput, description: string) {
    if (!selectedGame) {
      throw new Error('Kein aktives Spiel ausgewählt.');
    }

    try {
      setMessage('Speichere Play im Event Store...');

      const savedEvent = await appendPlayEvent({
        gameId: selectedGame.id,
        play,
        description,
      });

      const nextEvents = await reloadEventsForGame(selectedGame, savedEvent.id);
      setMessage(`Play gespeichert. ${nextEvents.length} Events in der Timeline.`);
    } catch (error) {
      const errorMessage = `Fehler beim Speichern des Plays: ${String(error)}`;
      setMessage(errorMessage);
      throw new Error(errorMessage);
    }
  }

  function openTimelineItem(item: RebuiltTimelineItem) {
    setSelectedTimelineId(item.eventId);
    setEditingEventId(null);
    setEditForm(null);
  }

  function startEdit(item: RebuiltTimelineItem) {
    setSelectedTimelineId(item.eventId);
    setEditingEventId(item.eventId);
    setEditForm({
      description: item.description,
      quarter: item.play.quarter ?? item.before.clock.quarter,
      clockStartSeconds: Number(item.play.clockStartSeconds ?? item.before.clock.secondsRemaining),
      clockEndSeconds: Number(item.play.clockEndSeconds ?? item.after.clock.secondsRemaining),
      yards: Number(item.play.yards ?? 0),
      returnYards: Number(item.play.returnYards ?? 0),
      touchdown: item.play.touchdown === true,
      firstDown: item.play.firstDown === true,
      note: item.play.note ?? '',
    });
  }

  async function saveEdit() {
    if (!selectedGame || !editingEventId || !editForm) return;

    const sourceEvent = events.find((event) => event.id === editingEventId);
    if (!sourceEvent) {
      setMessage('Event konnte nicht gefunden werden.');
      return;
    }

    try {
      const updatedPlay: PlayInput = {
        ...sourceEvent.play,
        quarter: editForm.quarter,
        clockStartSeconds: Number(editForm.clockStartSeconds),
        clockEndSeconds: Number(editForm.clockEndSeconds),
        yards: Number(editForm.yards),
        returnYards: Number(editForm.returnYards),
        touchdown: editForm.touchdown,
        firstDown: editForm.firstDown,
        note: editForm.note,
      };

      await updatePlayEvent({
        eventId: sourceEvent.id,
        gameId: selectedGame.id,
        seq: sourceEvent.seq,
        play: updatedPlay,
        description: editForm.description,
      });

      await reloadEventsForGame(selectedGame, sourceEvent.id);
      setEditingEventId(null);
      setEditForm(null);
      setMessage('Play bearbeitet und Spielzustand neu berechnet.');
    } catch (error) {
      setMessage(`Fehler beim Bearbeiten: ${String(error)}`);
    }
  }

  async function deleteEvent(eventId: string) {
    if (!selectedGame) return;
    if (!confirm('Play wirklich löschen? Der Spielzustand wird danach neu berechnet.')) return;

    try {
      await removePlayEvent(eventId);
      const storedEvents = await reloadEventsForGame(selectedGame, null);
      setEvents(storedEvents);
      setSelectedTimelineId(null);
      setEditingEventId(null);
      setEditForm(null);
      setMessage('Play gelöscht und Spielzustand neu berechnet.');
    } catch (error) {
      setMessage(`Fehler beim Löschen: ${String(error)}`);
    }
  }

  async function resetCurrentGame() {
    if (!selectedGame) return;
    if (!confirm('Alle Plays dieses Spiels löschen?')) return;

    try {
      await clearGameEvents(selectedGame.id);
      await loadGameContext(selectedGame);
      setMessage('Alle Events dieses Spiels wurden gelöscht.');
    } catch (error) {
      setMessage(`Fehler beim Zurücksetzen: ${String(error)}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black">Live Scoring</h1>
            <p className="text-sm text-zinc-400 mt-2">
              Event Store aktiv: jedes Play wird gespeichert und der GameState wird aus Events neu aufgebaut.
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
            <SmartPlayEditor
              state={state}
              players={players}
              teamOptions={[
                ...(homeTeam ? [{ id: homeTeam.id, label: `${homeTeam.abbr} - ${homeTeam.name}` }] : []),
                ...(awayTeam ? [{ id: awayTeam.id, label: `${awayTeam.abbr} - ${awayTeam.name}` }] : []),
              ]}
              onApply={handleApply}
            />
          )}

          <div className="grid grid-cols-[1fr_420px] gap-6">
            <TimelineList
              timeline={timeline}
              eventsCount={events.length}
              selectedTimelineId={selectedTimelineId}
              onOpen={openTimelineItem}
              onEdit={startEdit}
              onDelete={deleteEvent}
              onReset={resetCurrentGame}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />

            <TimelineDetails
              item={selectedTimelineItem}
              editing={editingEventId === selectedTimelineItem?.eventId}
              editForm={editForm}
              setEditForm={setEditForm}
              onEdit={() => selectedTimelineItem && startEdit(selectedTimelineItem)}
              onCancel={() => {
                setEditingEventId(null);
                setEditForm(null);
              }}
              onSave={saveEdit}
              onDelete={() => selectedTimelineItem && deleteEvent(selectedTimelineItem.eventId)}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          </div>
        </>
      )}
    </div>
  );
}

function TimelineList({
  timeline,
  eventsCount,
  selectedTimelineId,
  onOpen,
  onEdit,
  onDelete,
  onReset,
  homeTeam,
  awayTeam,
}: {
  timeline: RebuiltTimelineItem[];
  eventsCount: number;
  selectedTimelineId: string | null;
  onOpen: (item: RebuiltTimelineItem) => void;
  onEdit: (item: RebuiltTimelineItem) => void;
  onDelete: (eventId: string) => void;
  onReset: () => void;
  homeTeam?: Team;
  awayTeam?: Team;
}) {
  return (
    <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black">Event Timeline</h2>
          <p className="text-sm text-zinc-400">
            {eventsCount} gespeicherte Events. Bearbeiten und Löschen triggert automatischen Rebuild.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl bg-gs-card2 border border-gs-line px-4 py-2 font-bold"
        >
          Alle Plays löschen
        </button>
      </div>
      <div className="space-y-2">
        {timeline.map((item) => (
          <button
            type="button"
            key={item.eventId}
            onClick={() => onOpen(item)}
            className={`w-full rounded-2xl border p-4 text-sm text-left transition ${
              selectedTimelineId === item.eventId
                ? 'bg-gs-orange/10 border-gs-orange'
                : 'bg-gs-card2 border-gs-line hover:border-zinc-500'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-[0.2em]">
                  Play {item.seq} · Q{item.before.clock.quarter} {formatClock(item.before.clock.secondsRemaining)} · {item.before.down} & {item.before.distance} @ {teamYardline(item.before.absoluteYardline, item.before.possessionTeamId, item.before.defenseTeamId, homeTeam, awayTeam)}
                </div>
                <div className="font-bold mt-1">{item.description}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Danach: {item.after.down} & {item.after.distance} @ {teamYardline(item.after.absoluteYardline, item.after.possessionTeamId, item.after.defenseTeamId, homeTeam, awayTeam)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(item);
                  }}
                  className="rounded-xl bg-gs-orange/10 border border-gs-orange/30 text-gs-soft p-2"
                  title="Play bearbeiten"
                >
                  <Edit3 size={16} />
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(item.eventId);
                  }}
                  className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 p-2"
                  title="Play löschen"
                >
                  <Trash2 size={16} />
                </span>
              </div>
            </div>
          </button>
        ))}
        {!timeline.length && <div className="text-zinc-500 text-center py-8">Noch keine Plays.</div>}
      </div>
    </div>
  );
}

function TimelineDetails({
  item,
  editing,
  editForm,
  setEditForm,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  homeTeam,
  awayTeam,
}: {
  item: RebuiltTimelineItem | null;
  editing: boolean;
  editForm: EditForm | null;
  setEditForm: (form: EditForm) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  homeTeam?: Team;
  awayTeam?: Team;
}) {
  if (!item) {
    return (
      <aside className="rounded-3xl border border-gs-line bg-gs-card p-6 h-fit">
        <h2 className="text-xl font-black">Play Details</h2>
        <p className="text-sm text-zinc-400 mt-3">Wähle einen Play in der Timeline aus.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl border border-gs-line bg-gs-card p-6 h-fit sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black">Play {item.seq}</h2>
          <p className="text-xs text-zinc-500 uppercase tracking-[0.2em]">{item.play.kind}</p>
        </div>
        {editing ? (
          <button type="button" onClick={onCancel} className="rounded-xl bg-gs-card2 border border-gs-line p-2">
            <X size={16} />
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="space-y-4">
          <Detail label="Situation vorher" value={`Q${item.before.clock.quarter} ${formatClock(item.before.clock.secondsRemaining)} · ${item.before.down} & ${item.before.distance} @ ${teamYardline(item.before.absoluteYardline, item.before.possessionTeamId, item.before.defenseTeamId, homeTeam, awayTeam)}`} />
          <Detail label="Beschreibung" value={item.description} />
          <Detail label="Event Clock" value={`Q${item.play.quarter ?? item.before.clock.quarter} ${formatClock(Number(item.play.clockStartSeconds ?? item.before.clock.secondsRemaining))} → ${formatClock(Number(item.play.clockEndSeconds ?? item.after.clock.secondsRemaining))}`} />
          <Detail label="Yards" value={String(item.play.yards ?? 0)} />
          <Detail label="Return Yards" value={String(item.play.returnYards ?? 0)} />
          <Detail label="Situation danach" value={`Q${item.after.clock.quarter} ${formatClock(item.after.clock.secondsRemaining)} · ${item.after.down} & ${item.after.distance} @ ${teamYardline(item.after.absoluteYardline, item.after.possessionTeamId, item.after.defenseTeamId, homeTeam, awayTeam)}`} />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onEdit} className="rounded-2xl bg-gs-orange text-black px-4 py-2 font-black flex items-center gap-2">
              <Edit3 size={16} /> Bearbeiten
            </button>
            <button type="button" onClick={onDelete} className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-2 font-black flex items-center gap-2">
              <Trash2 size={16} /> Löschen
            </button>
          </div>
        </div>
      ) : editForm ? (
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Beschreibung</span>
            <textarea
              className="input min-h-24"
              value={editForm.description}
              onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Quarter</span>
              <select className="input" value={editForm.quarter} onChange={(event) => setEditForm({ ...editForm, quarter: event.target.value })}>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
                <option value="OT">OT</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Clock Start</span>
              <input className="input" value={formatClock(editForm.clockStartSeconds)} onChange={(event) => setEditForm({ ...editForm, clockStartSeconds: parseClock(event.target.value) })} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Clock End</span>
              <input className="input" value={formatClock(editForm.clockEndSeconds)} onChange={(event) => setEditForm({ ...editForm, clockEndSeconds: parseClock(event.target.value) })} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Yards</span>
              <input className="input" type="number" value={editForm.yards} onChange={(event) => setEditForm({ ...editForm, yards: Number(event.target.value) })} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Return</span>
              <input className="input" type="number" value={editForm.returnYards} onChange={(event) => setEditForm({ ...editForm, returnYards: Number(event.target.value) })} />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-gs-line bg-gs-card2 px-4 py-3">
            <input type="checkbox" checked={editForm.touchdown} onChange={(event) => setEditForm({ ...editForm, touchdown: event.target.checked })} />
            <span className="font-bold">Touchdown</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-gs-line bg-gs-card2 px-4 py-3">
            <input type="checkbox" checked={editForm.firstDown} onChange={(event) => setEditForm({ ...editForm, firstDown: event.target.checked })} />
            <span className="font-bold">First Down</span>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Notiz</span>
            <textarea
              className="input min-h-20"
              value={editForm.note}
              onChange={(event) => setEditForm({ ...editForm, note: event.target.value })}
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onSave} className="rounded-2xl bg-gs-orange text-black px-4 py-2 font-black">
              Änderung speichern
            </button>
            <button type="button" onClick={onCancel} className="rounded-2xl bg-gs-card2 border border-gs-line px-4 py-2 font-black">
              Abbrechen
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gs-card2 border border-gs-line p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-2 font-bold">{value}</div>
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

function teamYardline(absoluteYardline: number, possessionTeamId: string, defenseTeamId: string, homeTeam?: Team, awayTeam?: Team): string {
  const offenseAbbr = possessionTeamId === homeTeam?.id ? homeTeam?.abbr : possessionTeamId === awayTeam?.id ? awayTeam?.abbr : 'OWN';
  const defenseAbbr = defenseTeamId === homeTeam?.id ? homeTeam?.abbr : defenseTeamId === awayTeam?.id ? awayTeam?.abbr : 'OPP';
  return yardlineLabel(absoluteYardline, offenseAbbr ?? 'OWN', defenseAbbr ?? 'OPP');
}

function parseClock(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (/^\d+$/.test(trimmed)) return Math.max(0, Number(trimmed));

  const [minutesRaw, secondsRaw = '0'] = trimmed.split(':');
  const minutes = Number(minutesRaw);
  const seconds = Number(secondsRaw);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
  return Math.max(0, minutes * 60 + seconds);
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
