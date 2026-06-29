use rusqlite::Connection;
use std::{fs, path::PathBuf};

fn app_root() -> PathBuf {
    let base = dirs_next::document_dir()
        .or_else(|| dirs_next::home_dir())
        .expect("No user directory found");
    base.join("GridSwifts Football Stats")
}

fn init_database() {
    let root = app_root();
    fs::create_dir_all(root.join("Teams").join("Logos")).unwrap();
    fs::create_dir_all(root.join("Exports").join("PDF")).unwrap();
    fs::create_dir_all(root.join("Exports").join("Excel")).unwrap();
    fs::create_dir_all(root.join("Backups")).unwrap();

    let db_path = root.join("gridswifts.db");
    let conn = Connection::open(db_path).unwrap();

    conn.execute_batch(include_str!("../migrations/001_initial.sql")).unwrap();
}

#[tauri::command]
fn database_path() -> String {
    app_root().join("gridswifts.db").to_string_lossy().to_string()
}

pub fn run() {
    init_database();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![database_path])
        .run(tauri::generate_context!())
        .expect("error while running GridSwifts");
}
