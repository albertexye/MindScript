#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
