#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;
use cmd_lib::run_fun;

// Execute a command and return the statues
#[tauri::command]
fn exec_cmd(command: &str) -> (bool, String) {
    let output = if cfg!(target_os = "windows") {
        run_fun!(cmd /C $command)
    } else {
        run_fun!(sh -c $command)
    };
    match output {
        Ok(result) => (true, result),
        Err(err) => (false, err.to_string())
    }
}

// Open a folder dialog
#[tauri::command]
async fn open_folder_dialog(title: String) -> String {
    let res = rfd::FileDialog::new()
        .set_title(title)
        .set_can_create_directories(true)
        .pick_folder();
    match res {
        Some(folder) => folder.as_os_str().to_str().unwrap().to_owned(),
        None => "".to_owned()
    }
}

// Open a file dialog
#[tauri::command]
async fn open_file_dialog(title: String, filter_name: String, ext: Vec<String>) -> String {
    let res = rfd::FileDialog::new()
        .set_title(title)
        .set_can_create_directories(true)
        .add_filter(filter_name, &ext)
        .pick_file();
    match res {
        Some(file) => file.as_os_str().to_str().unwrap().to_owned(),
        None => "".to_owned()
    }
}

#[tauri::command]
async fn read_file(path: String) -> (String, Vec<u8>) {
    match std::fs::read(path) {
        Ok(data) => ("".to_owned(), data),
        Err(err) => (err.to_string(), vec![])
    }
}

#[tauri::command]
async fn folder_exists(path: String) -> bool {
    std::path::Path::new(&path).is_dir()
}

#[tauri::command]
async fn create_file(path: String, data: Vec<u8>) -> String {
    let path = std::path::Path::new(&path);
    let prefix = path.parent().unwrap();
    std::fs::create_dir_all(prefix).unwrap();
    let mut file = match std::fs::File::create(path) {
        Ok(f) => f,
        Err(e) => return e.to_string()
    };
    match file.write_all(&data) {
        Ok(_) => "".to_owned(),
        Err(e) => e.to_string()
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![exec_cmd, open_folder_dialog, open_file_dialog, read_file, folder_exists, create_file])
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
