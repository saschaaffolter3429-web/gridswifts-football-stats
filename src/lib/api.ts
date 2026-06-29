import { invoke } from '@tauri-apps/api/core';

export type Team = {
  id: string;
  name: string;
  abbr: string;
  location?: string | null;
  league?: string | null;
  stadium?: string | null;
  primary_color: string;
  secondary_color: string;
  logo_path?: string | null;
  coaches_json: string;
};

export type TeamInput = {
  id?: string | null;
  name: string;
  abbr: string;
  location?: string | null;
  league?: string | null;
  stadium?: string | null;
  primary_color: string;
  secondary_color: string;
  logo_path?: string | null;
  coaches_json: string;
};

export type Player = {
  id: string;
  team_id: string;
  number: string;
  name: string;
  position: string;
  is_active: number;
};

export type PlayerInput = {
  id?: string | null;
  team_id: string;
  number: string;
  name: string;
  position: string;
};

export async function databasePath(): Promise<string> {
  return invoke('database_path');
}

export async function listTeams(): Promise<Team[]> {
  return invoke('list_teams');
}

export async function saveTeam(input: TeamInput): Promise<Team> {
  return invoke('save_team', { input });
}

export async function deleteTeam(id: string): Promise<void> {
  return invoke('delete_team', { id });
}

export async function listPlayers(teamId: string): Promise<Player[]> {
  return invoke('list_players', { teamId });
}

export async function savePlayer(input: PlayerInput): Promise<Player> {
  return invoke('save_player', { input });
}

export async function deletePlayer(id: string): Promise<void> {
  return invoke('delete_player', { id });
}

export async function createDemoSeed(): Promise<void> {
  return invoke('create_demo_seed');
}
