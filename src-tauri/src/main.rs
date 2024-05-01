#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

// Execute a command and return the statues
#[tauri::command]
fn exec_cmd(command: &str) -> (i32, String) {
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .arg("/C")
            .arg(command)
            .output()
    } else {
        Command::new("sh")
            .arg("-c")
            .arg(command)
            .output()
    };
    match output {
        Ok(result) => match result.status.code() {
            Some(code) => (code, "".to_owned()),
            None => (
                -1,
                match String::from_utf8(result.stderr) {
                    Ok(stderr) => stderr,
                    Err(_) => "".to_owned(),
                },
            ),
        },
        Err(err) => (-1, err.to_string()),
    }
}

// Open a file dialog
#[tauri::command]
async fn open_file_dialog(title: String) -> String {
    let res = rfd::FileDialog::new()
        .set_title(title)
        .set_can_create_directories(true)
        .pick_folder();
    match res {
        Some(folder) => folder.as_os_str().to_str().unwrap().to_owned(),
        None => "".to_owned()
    }
}

#[tauri::command]
async fn folder_exists(path: String) -> bool {
    std::path::Path::new(&path).is_dir()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![exec_cmd])
        .invoke_handler(tauri::generate_handler![open_file_dialog])
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
