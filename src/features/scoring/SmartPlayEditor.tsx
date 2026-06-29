import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Keyboard, Send, Zap } from 'lucide-react';
import { applyPlay, yardlineLabel, type GameState, type PlayInput, type PlayKind } from '../../lib/football-engine';
import { buildPlayInputFromDefinition, defaultValuesForPlay, getPlayTypeDefinition, registryByCategory } from '../../lib/play-editor/playTypeRegistry';
import { templatesForKind, PLAY_TEMPLATES, type PlayTemplate } from '../../lib/play-editor/playTemplates';
import { playersForRole } from '../../lib/play-editor/playerResolver';
import { hasBlockingErrors, validateSmartPlay } from '../../lib/play-editor/footballIQ';
import type { EditorPlayer, PlayFieldDefinition, SmartPlayValues } from '../../lib/play-editor/playEditorTypes';

type TeamOption = {
  id: string;
  label: string;
};

type Props = {
  state: GameState;
  players: EditorPlayer[];
  teamOptions?: TeamOption[];
  onApply: (nextState: GameState, play: PlayInput, description: string) => void | Promise<void>;
};

const fieldGroups = [
  ['core', 'Core'],
  ['offense', 'Offense'],
  ['defense', 'Defense'],
  ['specialTeams', 'Special Teams'],
  ['result', 'Result'],
  ['computed', 'Computed'],
  ['penalty', 'Penalty'],
] as const;

export function SmartPlayEditor({ state, players, teamOptions = [], onApply }: Props) {
  const categories = useMemo(() => registryByCategory(), []);
  const [selectedKind, setSelectedKind] = useState<PlayKind>('RUSH');
  const definition = getPlayTypeDefinition(selectedKind);
  const [quarter, setQuarter] = useState(state.clock.quarter);
  const [clockStartText, setClockStartText] = useState(formatClock(state.clock.secondsRemaining));
  const [clockEndText, setClockEndText] = useState(formatClock(state.clock.secondsRemaining));
  const [kickoffStartYardline, setKickoffStartYardline] = useState(35);
  const [kickingTeamId, setKickingTeamId] = useState(state.possessionTeamId);
  const [receivingTeamId, setReceivingTeamId] = useState(state.defenseTeamId);

  const context = {
    gameId: state.gameId,
    offenseTeamId: state.possessionTeamId,
    defenseTeamId: state.defenseTeamId,
    absoluteYardline: state.absoluteYardline,
    down: state.down,
    distance: state.distance,
    quarter,
    clockStartSeconds: parseClock(clockStartText),
    clockEndSeconds: parseClock(clockEndText),
  };

  const [values, setValues] = useState<SmartPlayValues>(() => defaultValuesForPlay(definition, context));
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const playPreview = enrichPlayWithGameContext(buildPlayInputFromDefinition(definition, values, context));
  const iqWarnings = validateSmartPlay({ state, definition, values, play: playPreview });
  const activeTemplates = templatesForKind(definition.kind);

  useEffect(() => {
    setQuarter(state.clock.quarter);
    setClockStartText(formatClock(state.clock.secondsRemaining));
    setClockEndText(formatClock(state.clock.secondsRemaining));
    setKickingTeamId(state.possessionTeamId);
    setReceivingTeamId(state.defenseTeamId);
  }, [state.clock.quarter, state.clock.secondsRemaining, state.possessionTeamId, state.defenseTeamId]);

  // Wenn sich die Spielsituation ändert, werden berechnete Felder wie FG-Distanz neu aufgebaut.
  // Der ausgewählte Play-Type bleibt aber bestehen.
  useEffect(() => {
    const currentDefinition = getPlayTypeDefinition(selectedKind);
    setValues((old) => ({
      ...defaultValuesForPlay(currentDefinition, context),
      ...old,
    }));
  }, [state.absoluteYardline, state.possessionTeamId, state.defenseTeamId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
        if (!(event.ctrlKey && event.key === 'Enter')) return;
      }

      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        void submit();
        return;
      }

      if (!event.ctrlKey && !event.altKey && !event.metaKey) {
        const shortcut = event.key.toUpperCase();
        const playType = Object.values(categories).flat().find((def) => def.shortcut.toUpperCase() === shortcut);

        if (playType) {
          event.preventDefault();
          switchPlayType(playType.kind);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [categories, selectedKind, values, state]);

  function switchPlayType(kind: PlayKind | string) {
    const nextDefinition = getPlayTypeDefinition(kind);
    setSelectedKind(nextDefinition.kind);
    setValues(defaultValuesForPlay(nextDefinition, context));
    setSubmitMessage('');
  }

  function applyTemplate(template: PlayTemplate) {
    const nextDefinition = getPlayTypeDefinition(template.kind);
    setSelectedKind(nextDefinition.kind);
    setValues({
      ...defaultValuesForPlay(nextDefinition, context),
      ...template.values,
    });
    setSubmitMessage(`Template geladen: ${template.label}`);
  }

  function updateValue(key: string, value: string | number | boolean) {
    setValues((old) => ({ ...old, [key]: value }));
    setSubmitMessage('');
  }

  function enrichPlayWithGameContext(play: PlayInput): PlayInput {
    return {
      ...play,
      quarter,
      clockStartSeconds: parseClock(clockStartText),
      clockEndSeconds: parseClock(clockEndText),
      ...(play.kind === 'KICKOFF'
        ? {
            kickingTeamId,
            receivingTeamId,
            kickoffStartYardline,
          }
        : {}),
    };
  }

  async function submit() {
    if (isSubmitting) return;

    const play = enrichPlayWithGameContext(buildPlayInputFromDefinition(definition, values, context));
    const warnings = validateSmartPlay({ state, definition, values, play });

    if (hasBlockingErrors(warnings)) {
      const errors = warnings.filter((warning) => warning.severity === 'error');
      setSubmitMessage(`Play nicht gespeichert: ${errors.map((error) => error.message).join(' ')}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitMessage('Play wird gespeichert...');
      const result = applyPlay(state, play);
      await onApply(result.next, play, result.description);

      setSubmitMessage('Play gespeichert und in die Event Timeline übernommen.');
      setValues(defaultValuesForPlay(definition, {
        ...context,
        absoluteYardline: result.next.absoluteYardline,
        offenseTeamId: result.next.possessionTeamId,
        defenseTeamId: result.next.defenseTeamId,
        down: result.next.down,
        distance: result.next.distance,
        clockStartSeconds: result.next.clock.secondsRemaining,
      }));
    } catch (error) {
      setSubmitMessage(`Play konnte nicht gespeichert werden: ${String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-[330px_1fr] gap-6">
      <aside className="rounded-3xl border border-gs-line bg-gs-card p-5 h-[calc(100vh-7rem)] overflow-auto">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="text-gs-orange" size={20} />
          <h2 className="text-xl font-black">Play Type</h2>
        </div>

        <div className="rounded-2xl bg-black border border-gs-line p-3 mb-5 text-xs text-zinc-400">
          Shortcuts: Play-Type Taste drücken, <span className="text-gs-soft font-bold">Ctrl+Enter</span> speichert.
        </div>

        <div className="space-y-5">
          {Object.entries(categories).map(([category, defs]) => (
            <section key={category}>
              <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">{category}</div>
              <div className="space-y-2">
                {defs.map((def) => (
                  <button
                    type="button"
                    key={def.kind}
                    onClick={() => switchPlayType(def.kind)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedKind === def.kind
                        ? 'border-gs-orange bg-gs-orange/10 text-white'
                        : 'border-gs-line bg-gs-card2 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black">{def.label}</span>
                      <span className="text-xs rounded-lg bg-black px-2 py-1 text-gs-soft">{def.shortcut}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{def.description}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <section className="space-y-6 h-[calc(100vh-7rem)] overflow-auto pr-2">
        <div className="rounded-3xl border border-gs-line bg-gs-card p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-black">Game Context</h3>
              <p className="text-xs text-zinc-400">Diese Angaben werden mit jedem Play im Event Store gespeichert.</p>
            </div>
            <div className="text-xs text-zinc-500 uppercase tracking-[0.2em]">Milestone 2.1.5 A</div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Quarter</span>
              <select className="input" value={quarter} onChange={(event) => setQuarter(event.target.value)}>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
                <option value="OT">OT</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Clock Start</span>
              <input className="input" value={clockStartText} onChange={(event) => setClockStartText(event.target.value)} placeholder="12:00" />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Clock End</span>
              <input className="input" value={clockEndText} onChange={(event) => setClockEndText(event.target.value)} placeholder="11:42" />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Possession</span>
              <input className="input opacity-70" disabled value={state.possessionTeamId} />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Defense</span>
              <input className="input opacity-70" disabled value={state.defenseTeamId} />
            </label>
          </div>

          {definition.kind === 'KICKOFF' && (
            <div className="grid grid-cols-3 gap-4 mt-4 rounded-2xl border border-gs-line bg-black/30 p-4">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Kicking Team</span>
                <select className="input" value={kickingTeamId} onChange={(event) => setKickingTeamId(event.target.value)}>
                  {teamOptions.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Receiving Team</span>
                <select className="input" value={receivingTeamId} onChange={(event) => setReceivingTeamId(event.target.value)}>
                  {teamOptions.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Kickoff Start</span>
                <input className="input" type="number" value={kickoffStartYardline} onChange={(event) => setKickoffStartYardline(Number(event.target.value))} />
              </label>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gs-line bg-black overflow-hidden">
          <div className="bg-[#151517] px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-[0.24em]">Current Situation</div>
              <div className="text-2xl font-black">
                {state.down} & {state.distance} @ {yardlineLabel(state.absoluteYardline, state.possessionTeamId, state.defenseTeamId)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 uppercase tracking-[0.24em]">Possession</div>
              <div className="text-2xl font-black text-gs-orange">{state.possessionTeamId}</div>
            </div>
          </div>
        </div>

        {submitMessage && (
          <div className={`rounded-2xl border px-4 py-3 ${
            submitMessage.startsWith('Play gespeichert')
              ? 'bg-green-500/10 border-green-500/30 text-green-200'
              : submitMessage.startsWith('Template')
                ? 'bg-gs-orange/10 border-gs-orange/30 text-gs-soft'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}>
            {submitMessage}
          </div>
        )}

        {iqWarnings.length > 0 && (
          <div className="space-y-2">
            {iqWarnings.map((warning) => (
              <div
                key={warning.code}
                className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
                  warning.severity === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                    : warning.severity === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                      : 'bg-gs-orange/10 border-gs-orange/30 text-gs-soft'
                }`}
              >
                <AlertTriangle size={18} />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}

        {activeTemplates.length > 0 && (
          <div className="rounded-3xl border border-gs-line bg-gs-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-gs-orange" size={19} />
              <h3 className="text-lg font-black">Play Templates</h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {activeTemplates.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="rounded-2xl border border-gs-line bg-gs-card2 hover:border-gs-orange text-left p-4 transition"
                >
                  <div className="font-black text-gs-soft">{template.label}</div>
                  <div className="text-xs text-zinc-500 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black">{definition.label}</h2>
              <p className="text-sm text-zinc-400">{definition.description}</p>
            </div>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={isSubmitting}
              className="rounded-2xl bg-gs-orange disabled:opacity-50 disabled:cursor-wait text-black px-5 py-3 font-black flex items-center gap-2"
            >
              <Send size={18} /> {isSubmitting ? 'Speichert...' : 'Play speichern'}
            </button>
          </div>

          <div className="space-y-6">
            {fieldGroups.map(([group, groupLabel]) => {
              const fields = definition.fields.filter((field) => {
                if (field.group !== group) return false;
                if (field.showWhen && !field.showWhen(values)) return false;
                return true;
              });

              if (!fields.length) return null;

              return (
                <section key={group} className="rounded-3xl border border-gs-line bg-black/30 p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-gs-soft mb-4">{groupLabel}</div>
                  <div className="grid grid-cols-3 gap-4">
                    {fields.map((field) => (
                      <SmartField
                        key={field.key}
                        field={field}
                        value={values[field.key]}
                        players={players}
                        offenseTeamId={state.possessionTeamId}
                        defenseTeamId={state.defenseTeamId}
                        onChange={(value) => updateValue(field.key, value)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-black border border-gs-line p-4">
            <div className="flex items-center gap-2 text-gs-soft font-bold">
              <CheckCircle2 size={18} />
              PlayInput Preview
            </div>
            <pre className="text-xs text-zinc-400 mt-3 overflow-auto">{JSON.stringify(playPreview, null, 2)}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function SmartField({
  field,
  value,
  players,
  offenseTeamId,
  defenseTeamId,
  onChange,
}: {
  field: PlayFieldDefinition;
  value: string | number | boolean | null | undefined;
  players: EditorPlayer[];
  offenseTeamId: string;
  defenseTeamId: string;
  onChange: (value: string | number | boolean) => void;
}) {
  if (field.kind === 'boolean') {
    return (
      <label className="flex items-center gap-3 rounded-2xl border border-gs-line bg-gs-card2 px-4 py-3 mt-6">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        <span className="font-bold">{field.label}</span>
      </label>
    );
  }

  if (field.kind === 'select') {
    return (
      <FieldWrap field={field}>
        <select className="input" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">Auswählen...</option>
          {field.options?.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
          ))}
        </select>
      </FieldWrap>
    );
  }

  if (field.kind === 'player') {
    const options = field.role
      ? playersForRole({ players, role: field.role, offenseTeamId, defenseTeamId })
      : players;

    return (
      <FieldWrap field={field}>
        <select className="input" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">Auswählen...</option>
          {options.map((player) => (
            <option key={player.id} value={player.id}>
              #{player.number} {player.name} ({player.position})
            </option>
          ))}
        </select>
      </FieldWrap>
    );
  }

  if (field.kind === 'computed') {
    return (
      <FieldWrap field={field}>
        <input className="input opacity-70" disabled value={String(value ?? '')} />
      </FieldWrap>
    );
  }

  return (
    <FieldWrap field={field}>
      <input
        className="input"
        type={field.kind === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.kind === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </FieldWrap>
  );
}

function FieldWrap({ field, children }: { field: PlayFieldDefinition; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {field.label}
        {field.required ? ' *' : ''}
      </span>
      {children}
      {field.help && <div className="text-xs text-zinc-500 mt-1">{field.help}</div>}
    </label>
  );
}


function parseClock(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, Number(trimmed));
  }

  const [minutesRaw, secondsRaw = '0'] = trimmed.split(':');
  const minutes = Number(minutesRaw);
  const seconds = Number(secondsRaw);

  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
  return Math.max(0, minutes * 60 + seconds);
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}
