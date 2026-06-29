import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Keyboard, Send } from 'lucide-react';
import { applyPlay, yardlineLabel, type GameState, type PlayInput } from '../../lib/football-engine';
import { buildPlayInputFromDefinition, defaultValuesForPlay, getPlayTypeDefinition, registryByCategory } from '../../lib/play-editor/playTypeRegistry';
import { playersForRole } from '../../lib/play-editor/playerResolver';
import { hasBlockingErrors, validateSmartPlay } from '../../lib/play-editor/footballIQ';
import type { EditorPlayer, PlayFieldDefinition, SmartPlayValues } from '../../lib/play-editor/playEditorTypes';

type Props = {
  state: GameState;
  players: EditorPlayer[];
  onApply: (nextState: GameState, play: PlayInput, description: string) => void;
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

export function SmartPlayEditor({ state, players, onApply }: Props) {
  const categories = useMemo(() => registryByCategory(), []);
  const [selectedKind, setSelectedKind] = useState('RUSH');
  const definition = getPlayTypeDefinition(selectedKind);
  const context = {
    gameId: state.gameId,
    offenseTeamId: state.possessionTeamId,
    defenseTeamId: state.defenseTeamId,
    absoluteYardline: state.absoluteYardline,
    down: state.down,
    distance: state.distance,
    clockStartSeconds: state.clock.secondsRemaining,
  };

  const [values, setValues] = useState<SmartPlayValues>(() => defaultValuesForPlay(definition, context));
  const playPreview = buildPlayInputFromDefinition(definition, values, context);
  const iqWarnings = validateSmartPlay({ state, definition, values, play: playPreview });

  useEffect(() => {
    setValues(defaultValuesForPlay(definition, context));
  }, [selectedKind, state.absoluteYardline, state.possessionTeamId, state.defenseTeamId]);

  function updateValue(key: string, value: string | number | boolean) {
    setValues((old) => ({ ...old, [key]: value }));
  }

  function submit() {
    const play = buildPlayInputFromDefinition(definition, values, context);
    const warnings = validateSmartPlay({ state, definition, values, play });

    if (hasBlockingErrors(warnings)) return;

    const result = applyPlay(state, play);
    onApply(result.next, play, result.description);
  }

  return (
    <div className="grid grid-cols-[330px_1fr] gap-6">
      <aside className="rounded-3xl border border-gs-line bg-gs-card p-5 h-[calc(100vh-7rem)] overflow-auto">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="text-gs-orange" size={20} />
          <h2 className="text-xl font-black">Play Type</h2>
        </div>

        <div className="space-y-5">
          {Object.entries(categories).map(([category, defs]) => (
            <section key={category}>
              <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">{category}</div>
              <div className="space-y-2">
                {defs.map((def) => (
                  <button
                    key={def.kind}
                    onClick={() => setSelectedKind(def.kind)}
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

        <div className="rounded-3xl border border-gs-line bg-gs-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black">{definition.label}</h2>
              <p className="text-sm text-zinc-400">{definition.description}</p>
            </div>
            <button
              onClick={submit}
              disabled={hasBlockingErrors(iqWarnings)}
              className="rounded-2xl bg-gs-orange disabled:opacity-40 disabled:cursor-not-allowed text-black px-5 py-3 font-black flex items-center gap-2"
            >
              <Send size={18} /> Play speichern
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
                        values={values}
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
  values: SmartPlayValues;
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
