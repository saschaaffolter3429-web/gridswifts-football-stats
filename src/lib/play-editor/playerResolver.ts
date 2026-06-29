import type { EditorPlayer, PlayerRole, TeamId } from './playEditorTypes';

const ROLE_POSITION_HINTS: Record<PlayerRole, string[]> = {
  passer: ['QB'],
  runner: ['RB', 'FB', 'QB', 'WR', 'ATH'],
  receiver: ['WR', 'TE', 'RB', 'FB', 'ATH'],
  intendedReceiver: ['WR', 'TE', 'RB', 'FB', 'ATH'],
  tackler: ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'ATH'],
  assistTackler: ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'ATH'],
  sacker: ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'ATH'],
  interceptor: ['LB', 'CB', 'S', 'ATH'],
  forcedFumble: ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'ATH'],
  fumbleRecoverer: ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'OL', 'RB', 'WR', 'TE', 'ATH'],
  kicker: ['K'],
  punter: ['P', 'K'],
  returner: ['KR', 'PR', 'WR', 'RB', 'CB', 'S', 'ATH'],
  holder: ['QB', 'P', 'K'],
  snapper: ['LS', 'OL'],
  blocker: ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'ATH'],
};

const OFFENSE_ROLES = new Set<PlayerRole>([
  'passer',
  'runner',
  'receiver',
  'intendedReceiver',
  'kicker',
  'punter',
  'holder',
  'snapper',
]);

const DEFENSE_ROLES = new Set<PlayerRole>([
  'tackler',
  'assistTackler',
  'sacker',
  'interceptor',
  'forcedFumble',
  'blocker',
]);

export function playersForRole(params: {
  players: EditorPlayer[];
  role: PlayerRole;
  offenseTeamId: TeamId;
  defenseTeamId: TeamId;
}): EditorPlayer[] {
  const { players, role, offenseTeamId, defenseTeamId } = params;
  const preferredPositions = ROLE_POSITION_HINTS[role] ?? [];

  let teamFiltered = players;

  if (OFFENSE_ROLES.has(role)) {
    teamFiltered = players.filter((p) => p.teamId === offenseTeamId);
  }

  if (DEFENSE_ROLES.has(role)) {
    teamFiltered = players.filter((p) => p.teamId === defenseTeamId);
  }

  if (role === 'fumbleRecoverer' || role === 'returner') {
    teamFiltered = players.filter((p) => p.teamId === offenseTeamId || p.teamId === defenseTeamId);
  }

  return [...teamFiltered].sort((a, b) => {
    const aPreferred = preferredPositions.includes(a.position) ? 0 : 1;
    const bPreferred = preferredPositions.includes(b.position) ? 0 : 1;

    if (aPreferred !== bPreferred) return aPreferred - bPreferred;

    const aNum = Number(a.number);
    const bNum = Number(b.number);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;

    return a.name.localeCompare(b.name);
  });
}

export function roleLabel(role: PlayerRole): string {
  const labels: Record<PlayerRole, string> = {
    passer: 'Passer',
    runner: 'Runner',
    receiver: 'Receiver',
    intendedReceiver: 'Intended Receiver',
    tackler: 'Tackler',
    assistTackler: 'Assist Tackler',
    sacker: 'Sacker',
    interceptor: 'Interceptor',
    forcedFumble: 'Forced Fumble',
    fumbleRecoverer: 'Fumble Recovery',
    kicker: 'Kicker',
    punter: 'Punter',
    returner: 'Returner',
    holder: 'Holder',
    snapper: 'Snapper',
    blocker: 'Blocker',
  };

  return labels[role];
}
