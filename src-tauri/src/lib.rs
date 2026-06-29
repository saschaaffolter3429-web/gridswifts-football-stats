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
    ] {
        let _ = conn.execute(sql, []);
    }
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

fn new_id(prefix: &str) -> String {
    format!("{}_{}", prefix, chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default())
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

    for p in [
        ("p_lul_21","team_lul","21","AAA Quarterback","QB"),
        ("p_lul_22","team_lul","22","BBB Runner","RB"),
        ("p_lul_23","team_lul","23","CCC Receiver","WR"),
        ("p_gor_4","team_gor","4","DDD Linebacker","LB"),
        ("p_gor_5","team_gor","5","EEE Corner","CB"),
    ] {
        conn.execute(
            "INSERT OR IGNORE INTO players(id,team_id,number,name,position,is_active)
             VALUES(?1,?2,?3,?4,?5,1)",
            params![p.0,p.1,p.2,p.3,p.4],
        ).map_err(|e| e.to_string())?;
    }

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
            create_demo_seed
        ])
        .run(tauri::generate_context!())
        .expect("error while running GridSwifts");
}
