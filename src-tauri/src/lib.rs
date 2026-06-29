use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

fn app_root() -> PathBuf {
    let base = dirs_next::document_dir()
        .or_else(|| dirs_next::home_dir())
        .expect("No user directory found");
    base.join("GridSwifts Football Stats")
}

fn open_db() -> Connection {
    let root = app_root();
    fs::create_dir_all(root.join("Teams").join("Logos")).unwrap();
    fs::create_dir_all(root.join("Exports").join("PDF")).unwrap();
    fs::create_dir_all(root.join("Exports").join("Excel")).unwrap();
    fs::create_dir_all(root.join("Backups")).unwrap();

    let db_path = root.join("gridswifts.db");
    let conn = Connection::open(db_path).unwrap();
    conn.execute_batch(include_str!("../migrations/001_initial.sql")).unwrap();
    ensure_schema(&conn);
    conn
}

fn ensure_schema(conn: &Connection) {
    for sql in [
        "ALTER TABLE teams ADD COLUMN primary_color TEXT DEFAULT '#ff7a18'",
        "ALTER TABLE teams ADD COLUMN secondary_color TEXT DEFAULT '#050505'",
        "ALTER TABLE teams ADD COLUMN stadium TEXT",
        "ALTER TABLE teams ADD COLUMN coaches_json TEXT DEFAULT '[]'",
        "ALTER TABLE games ADD COLUMN notes TEXT",
    ] {
        let _ = conn.execute(sql, []);
    }

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS game_events (
            id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
            sequence INTEGER NOT NULL,
            quarter TEXT NOT NULL,
            clock_start_seconds INTEGER,
            clock_end_seconds INTEGER,
            event_type TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_game_events_game_sequence ON game_events(game_id, sequence);
        CREATE INDEX IF NOT EXISTS idx_game_events_game_deleted ON game_events(game_id, deleted_at);"
    ).unwrap();
}

fn new_id(prefix: &str) -> String {
    format!("{}_{}", prefix, chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default())
}

#[tauri::command]
fn database_path() -> String {
    app_root().join("gridswifts.db").to_string_lossy().to_string()
}

#[derive(Debug, Serialize, Deserialize)]
struct Team {
    id: String,
    name: String,
    abbr: String,
    location: Option<String>,
    league: Option<String>,
    stadium: Option<String>,
    primary_color: String,
    secondary_color: String,
    logo_path: Option<String>,
    coaches_json: String,
}

#[derive(Debug, Deserialize)]
struct TeamInput {
    id: Option<String>,
    name: String,
    abbr: String,
    location: Option<String>,
    league: Option<String>,
    stadium: Option<String>,
    primary_color: String,
    secondary_color: String,
    logo_path: Option<String>,
    coaches_json: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Player {
    id: String,
    team_id: String,
    number: String,
    name: String,
    position: String,
    is_active: i64,
}

#[derive(Debug, Deserialize)]
struct PlayerInput {
    id: Option<String>,
    team_id: String,
    number: String,
    name: String,
    position: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Game {
    id: String,
    game_date: String,
    location: Option<String>,
    home_team_id: String,
    away_team_id: String,
    home_team_name: String,
    away_team_name: String,
    home_abbr: String,
    away_abbr: String,
    quarter_length_seconds: i64,
    status: String,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GameInput {
    id: Option<String>,
    game_date: String,
    location: Option<String>,
    home_team_id: String,
    away_team_id: String,
    quarter_length_seconds: i64,
    status: String,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GameEvent {
    id: String,
    game_id: String,
    sequence: i64,
    quarter: String,
    clock_start_seconds: Option<i64>,
    clock_end_seconds: Option<i64>,
    event_type: String,
    payload_json: String,
    created_at: String,
    updated_at: String,
    deleted_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GameEventInput {
    id: Option<String>,
    game_id: String,
    quarter: String,
    clock_start_seconds: Option<i64>,
    clock_end_seconds: Option<i64>,
    event_type: String,
    payload_json: String,
}

#[derive(Debug, Deserialize)]
struct GameEventUpdateInput {
    id: String,
    quarter: Option<String>,
    clock_start_seconds: Option<i64>,
    clock_end_seconds: Option<i64>,
    event_type: Option<String>,
    payload_json: Option<String>,
}

#[tauri::command]
fn list_teams() -> Result<Vec<Team>, String> {
    let conn = open_db();
    let mut stmt = conn.prepare(
        "SELECT id,name,abbr,location,league,stadium,primary_color,secondary_color,logo_path,coaches_json
         FROM teams ORDER BY name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(Team {
            id: row.get(0)?,
            name: row.get(1)?,
            abbr: row.get(2)?,
            location: row.get(3)?,
            league: row.get(4)?,
            stadium: row.get(5)?,
            primary_color: row.get::<_, Option<String>>(6)?.unwrap_or("#ff7a18".to_string()),
            secondary_color: row.get::<_, Option<String>>(7)?.unwrap_or("#050505".to_string()),
            logo_path: row.get(8)?,
            coaches_json: row.get::<_, Option<String>>(9)?.unwrap_or("[]".to_string()),
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_team(id: String) -> Result<Team, String> {
    let conn = open_db();
    conn.query_row(
        "SELECT id,name,abbr,location,league,stadium,primary_color,secondary_color,logo_path,coaches_json
         FROM teams WHERE id=?1",
        params![id],
        |row| {
            Ok(Team {
                id: row.get(0)?,
                name: row.get(1)?,
                abbr: row.get(2)?,
                location: row.get(3)?,
                league: row.get(4)?,
                stadium: row.get(5)?,
                primary_color: row.get::<_, Option<String>>(6)?.unwrap_or("#ff7a18".to_string()),
                secondary_color: row.get::<_, Option<String>>(7)?.unwrap_or("#050505".to_string()),
                logo_path: row.get(8)?,
                coaches_json: row.get::<_, Option<String>>(9)?.unwrap_or("[]".to_string()),
            })
        }
    ).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_team(input: TeamInput) -> Result<Team, String> {
    let conn = open_db();
    let now = chrono::Utc::now().to_rfc3339();
    let id = input.id.unwrap_or_else(|| new_id("team"));

    let duplicate: Option<String> = conn.query_row(
        "SELECT id FROM teams WHERE UPPER(abbr)=UPPER(?1) AND id<>?2 LIMIT 1",
        params![input.abbr, id],
        |row| row.get(0)
    ).optional().map_err(|e| e.to_string())?;

    if duplicate.is_some() {
        return Err("Diese Team-Abkürzung existiert bereits.".to_string());
    }

    conn.execute(
        "INSERT INTO teams(id,name,abbr,location,league,stadium,primary_color,secondary_color,logo_path,coaches_json,created_at,updated_at)
         VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?11)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           abbr=excluded.abbr,
           location=excluded.location,
           league=excluded.league,
           stadium=excluded.stadium,
           primary_color=excluded.primary_color,
           secondary_color=excluded.secondary_color,
           logo_path=excluded.logo_path,
           coaches_json=excluded.coaches_json,
           updated_at=excluded.updated_at",
        params![
            id,
            input.name,
            input.abbr.to_uppercase(),
            input.location,
            input.league,
            input.stadium,
            input.primary_color,
            input.secondary_color,
            input.logo_path,
            input.coaches_json,
            now
        ],
    ).map_err(|e| e.to_string())?;

    get_team(id)
}

#[tauri::command]
fn delete_team(id: String) -> Result<(), String> {
    let conn = open_db();
    conn.execute("DELETE FROM players WHERE team_id=?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM teams WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn list_players(team_id: String) -> Result<Vec<Player>, String> {
    let conn = open_db();
    let mut stmt = conn.prepare(
        "SELECT id,team_id,number,name,position,is_active
         FROM players WHERE team_id=?1
         ORDER BY CAST(number AS INTEGER), name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![team_id], |row| {
        Ok(Player {
            id: row.get(0)?,
            team_id: row.get(1)?,
            number: row.get(2)?,
            name: row.get(3)?,
            position: row.get(4)?,
            is_active: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_player(input: PlayerInput) -> Result<Player, String> {
    let conn = open_db();
    let id = input.id.unwrap_or_else(|| new_id("player"));

    let duplicate: Option<String> = conn.query_row(
        "SELECT id FROM players WHERE team_id=?1 AND number=?2 AND id<>?3 LIMIT 1",
        params![input.team_id, input.number, id],
        |row| row.get(0)
    ).optional().map_err(|e| e.to_string())?;

    if duplicate.is_some() {
        return Err("Diese Trikotnummer existiert in diesem Team bereits.".to_string());
    }

    conn.execute(
        "INSERT INTO players(id,team_id,number,name,position,is_active)
         VALUES(?1,?2,?3,?4,?5,1)
         ON CONFLICT(id) DO UPDATE SET
           number=excluded.number,
           name=excluded.name,
           position=excluded.position,
           is_active=1",
        params![id, input.team_id, input.number, input.name, input.position],
    ).map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id,team_id,number,name,position,is_active FROM players WHERE id=?1",
        params![id],
        |row| {
            Ok(Player {
                id: row.get(0)?,
                team_id: row.get(1)?,
                number: row.get(2)?,
                name: row.get(3)?,
                position: row.get(4)?,
                is_active: row.get(5)?,
            })
        }
    ).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_player(id: String) -> Result<(), String> {
    let conn = open_db();
    conn.execute("DELETE FROM players WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn list_games() -> Result<Vec<Game>, String> {
    let conn = open_db();
    let mut stmt = conn.prepare(
        "SELECT g.id,g.game_date,g.location,g.home_team_id,g.away_team_id,
                h.name,h.abbr,a.name,a.abbr,g.quarter_length_seconds,g.status,g.notes
         FROM games g
         JOIN teams h ON h.id=g.home_team_id
         JOIN teams a ON a.id=g.away_team_id
         ORDER BY g.game_date DESC, g.updated_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(Game {
            id: row.get(0)?,
            game_date: row.get(1)?,
            location: row.get(2)?,
            home_team_id: row.get(3)?,
            away_team_id: row.get(4)?,
            home_team_name: row.get(5)?,
            home_abbr: row.get(6)?,
            away_team_name: row.get(7)?,
            away_abbr: row.get(8)?,
            quarter_length_seconds: row.get(9)?,
            status: row.get(10)?,
            notes: row.get(11)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_game(id: String) -> Result<Game, String> {
    let conn = open_db();
    conn.query_row(
        "SELECT g.id,g.game_date,g.location,g.home_team_id,g.away_team_id,
                h.name,h.abbr,a.name,a.abbr,g.quarter_length_seconds,g.status,g.notes
         FROM games g
         JOIN teams h ON h.id=g.home_team_id
         JOIN teams a ON a.id=g.away_team_id
         WHERE g.id=?1",
        params![id],
        |row| {
            Ok(Game {
                id: row.get(0)?,
                game_date: row.get(1)?,
                location: row.get(2)?,
                home_team_id: row.get(3)?,
                away_team_id: row.get(4)?,
                home_team_name: row.get(5)?,
                home_abbr: row.get(6)?,
                away_team_name: row.get(7)?,
                away_abbr: row.get(8)?,
                quarter_length_seconds: row.get(9)?,
                status: row.get(10)?,
                notes: row.get(11)?,
            })
        }
    ).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_game(input: GameInput) -> Result<Game, String> {
    if input.home_team_id == input.away_team_id {
        return Err("Heimteam und Auswärtsteam dürfen nicht identisch sein.".to_string());
    }

    let conn = open_db();
    let now = chrono::Utc::now().to_rfc3339();
    let id = input.id.unwrap_or_else(|| new_id("game"));

    conn.execute(
        "INSERT INTO games(id,game_date,location,home_team_id,away_team_id,quarter_length_seconds,status,notes,created_at,updated_at)
         VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)
         ON CONFLICT(id) DO UPDATE SET
           game_date=excluded.game_date,
           location=excluded.location,
           home_team_id=excluded.home_team_id,
           away_team_id=excluded.away_team_id,
           quarter_length_seconds=excluded.quarter_length_seconds,
           status=excluded.status,
           notes=excluded.notes,
           updated_at=excluded.updated_at",
        params![
            id,
            input.game_date,
            input.location,
            input.home_team_id,
            input.away_team_id,
            input.quarter_length_seconds,
            input.status,
            input.notes,
            now
        ],
    ).map_err(|e| e.to_string())?;

    get_game(id)
}

#[tauri::command]
fn delete_game(id: String) -> Result<(), String> {
    let conn = open_db();
    conn.execute("DELETE FROM game_events WHERE game_id=?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM plays WHERE game_id=?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM drives WHERE game_id=?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM games WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn list_game_events(game_id: String) -> Result<Vec<GameEvent>, String> {
    let conn = open_db();
    let mut stmt = conn.prepare(
        "SELECT id,game_id,sequence,quarter,clock_start_seconds,clock_end_seconds,event_type,payload_json,created_at,updated_at,deleted_at
         FROM game_events
         WHERE game_id=?1 AND deleted_at IS NULL
         ORDER BY sequence ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![game_id], |row| {
        Ok(GameEvent {
            id: row.get(0)?,
            game_id: row.get(1)?,
            sequence: row.get(2)?,
            quarter: row.get(3)?,
            clock_start_seconds: row.get(4)?,
            clock_end_seconds: row.get(5)?,
            event_type: row.get(6)?,
            payload_json: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            deleted_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_game_event(input: GameEventInput) -> Result<GameEvent, String> {
    // Validate JSON early so corrupt events do not enter the Event Store.
    let _: serde_json::Value = serde_json::from_str(&input.payload_json).map_err(|e| format!("Ungültiges Event JSON: {e}"))?;

    let conn = open_db();
    let now = chrono::Utc::now().to_rfc3339();
    let id = input.id.unwrap_or_else(|| new_id("event"));
    let sequence: i64 = conn.query_row(
        "SELECT COALESCE(MAX(sequence), 0) + 1 FROM game_events WHERE game_id=?1",
        params![input.game_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO game_events(id,game_id,sequence,quarter,clock_start_seconds,clock_end_seconds,event_type,payload_json,created_at,updated_at,deleted_at)
         VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?9,NULL)",
        params![
            id,
            input.game_id,
            sequence,
            input.quarter,
            input.clock_start_seconds,
            input.clock_end_seconds,
            input.event_type,
            input.payload_json,
            now,
        ],
    ).map_err(|e| e.to_string())?;

    get_game_event(id)
}

#[tauri::command]
fn get_game_event(id: String) -> Result<GameEvent, String> {
    let conn = open_db();
    conn.query_row(
        "SELECT id,game_id,sequence,quarter,clock_start_seconds,clock_end_seconds,event_type,payload_json,created_at,updated_at,deleted_at
         FROM game_events WHERE id=?1",
        params![id],
        |row| {
            Ok(GameEvent {
                id: row.get(0)?,
                game_id: row.get(1)?,
                sequence: row.get(2)?,
                quarter: row.get(3)?,
                clock_start_seconds: row.get(4)?,
                clock_end_seconds: row.get(5)?,
                event_type: row.get(6)?,
                payload_json: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                deleted_at: row.get(10)?,
            })
        }
    ).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_game_event(input: GameEventUpdateInput) -> Result<GameEvent, String> {
    if let Some(payload) = &input.payload_json {
        let _: serde_json::Value = serde_json::from_str(payload).map_err(|e| format!("Ungültiges Event JSON: {e}"))?;
    }

    let conn = open_db();
    let now = chrono::Utc::now().to_rfc3339();
    let existing = get_game_event(input.id.clone())?;

    conn.execute(
        "UPDATE game_events SET
            quarter=?2,
            clock_start_seconds=?3,
            clock_end_seconds=?4,
            event_type=?5,
            payload_json=?6,
            updated_at=?7
         WHERE id=?1",
        params![
            input.id,
            input.quarter.unwrap_or(existing.quarter),
            input.clock_start_seconds.or(existing.clock_start_seconds),
            input.clock_end_seconds.or(existing.clock_end_seconds),
            input.event_type.unwrap_or(existing.event_type),
            input.payload_json.unwrap_or(existing.payload_json),
            now,
        ],
    ).map_err(|e| e.to_string())?;

    get_game_event(existing.id)
}

#[tauri::command]
fn delete_game_event(id: String) -> Result<(), String> {
    let conn = open_db();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE game_events SET deleted_at=?2, updated_at=?2 WHERE id=?1",
        params![id, now],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn clear_game_events(game_id: String) -> Result<(), String> {
    let conn = open_db();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE game_events SET deleted_at=?2, updated_at=?2 WHERE game_id=?1 AND deleted_at IS NULL",
        params![game_id, now],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_demo_seed() -> Result<(), String> {
    let conn = open_db();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT OR IGNORE INTO teams(id,name,abbr,location,league,stadium,primary_color,secondary_color,coaches_json,created_at,updated_at)
         VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?10)",
        params![
            "team_lul",
            "Lucerne Lions",
            "LUL",
            "Lucerne",
            "Demo League",
            "Demo Stadium",
            "#ff7a18",
            "#050505",
            "[\"Head Coach Demo\"]",
            now
        ],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR IGNORE INTO teams(id,name,abbr,location,league,stadium,primary_color,secondary_color,coaches_json,created_at,updated_at)
         VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?10)",
        params![
            "team_gor",
            "Gotham Ravens",
            "GOR",
            "Zug",
            "Demo League",
            "Raven Field",
            "#ffffff",
            "#111111",
            "[\"Head Coach Example\"]",
            now
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn run() {
    open_db();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            database_path,
            list_teams,
            get_team,
            save_team,
            delete_team,
            list_players,
            save_player,
            delete_player,
            list_games,
            get_game,
            save_game,
            delete_game,
            list_game_events,
            get_game_event,
            save_game_event,
            update_game_event,
            delete_game_event,
            clear_game_events,
            create_demo_seed
        ])
        .run(tauri::generate_context!())
        .expect("error while running GridSwifts");
}
