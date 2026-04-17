//! Windows Registry operations for the installer.
//!
//! Handles:
//! - Uninstall registry entries (Add/Remove Programs)
//! - Context menu integration ("Open with 空灵语言")
//! - PATH environment variable modification

use anyhow::{Context, Result};
use std::path::Path;
use winreg::enums::*;
use winreg::RegKey;

const APP_NAME: &str = "空灵语言";
const UNINSTALL_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\KonglingLanguage";

/// Register the application in Add/Remove Programs.
pub fn register_uninstall_entry(
    install_path: &Path,
    version: &str,
    uninstall_command: &str,
) -> Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu
        .create_subkey(UNINSTALL_KEY)
        .with_context(|| "Failed to create uninstall registry key")?;

    let exe_path = install_path.join("BitFun.exe");
    let icon_path = format!("{},0", exe_path.display());

    key.set_value("DisplayName", &APP_NAME)?;
    key.set_value("DisplayVersion", &version)?;
    key.set_value("Publisher", &"空灵语言 Team")?;
    key.set_value("InstallLocation", &install_path.to_string_lossy().as_ref())?;
    key.set_value("DisplayIcon", &icon_path)?;
    key.set_value("UninstallString", &uninstall_command)?;
    key.set_value("QuietUninstallString", &uninstall_command)?;
    key.set_value("NoModify", &1u32)?;
    key.set_value("NoRepair", &1u32)?;

    log::info!("Registered uninstall entry at {}", UNINSTALL_KEY);
    Ok(())
}

/// Remove the uninstall registry entry.
pub fn remove_uninstall_entry() -> Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    hkcu.delete_subkey_all(UNINSTALL_KEY)
        .with_context(|| "Failed to remove uninstall registry key")?;
    Ok(())
}

/// Register the right-click context menu "Open with 空灵语言" for directories.
pub fn register_context_menu(install_path: &Path) -> Result<()> {
    let exe_path = install_path.join("BitFun.exe");
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // Directory background context menu (right-click on empty area)
    let bg_key_path = r"Software\Classes\Directory\Background\shell\KonglingLanguage";
    let (bg_key, _) = hkcu.create_subkey(bg_key_path)?;
    bg_key.set_value("", &"Open with 空灵语言")?;
    bg_key.set_value("Icon", &exe_path.to_string_lossy().as_ref())?;

    let (bg_cmd_key, _) = hkcu.create_subkey(&format!(r"{}\command", bg_key_path))?;
    bg_cmd_key.set_value("", &format!("\"{}\" \"%V\"", exe_path.display()))?;

    // Directory context menu (right-click on folder)
    let dir_key_path = r"Software\Classes\Directory\shell\KonglingLanguage";
    let (dir_key, _) = hkcu.create_subkey(dir_key_path)?;
    dir_key.set_value("", &"Open with 空灵语言")?;
    dir_key.set_value("Icon", &exe_path.to_string_lossy().as_ref())?;

    let (dir_cmd_key, _) = hkcu.create_subkey(&format!(r"{}\command", dir_key_path))?;
    dir_cmd_key.set_value("", &format!("\"{}\" \"%1\"", exe_path.display()))?;

    log::info!("Registered context menu entries");
    Ok(())
}

/// Remove context menu entries.
pub fn remove_context_menu() -> Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let _ = hkcu.delete_subkey_all(r"Software\Classes\Directory\Background\shell\KonglingLanguage");
    let _ = hkcu.delete_subkey_all(r"Software\Classes\Directory\shell\KonglingLanguage");
    Ok(())
}

/// Add the install path to the user's PATH environment variable.
pub fn add_to_path(install_path: &Path) -> Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let env_key = hkcu.open_subkey_with_flags("Environment", KEY_READ | KEY_WRITE)?;

    let current_path: String = env_key.get_value("Path").unwrap_or_default();
    let install_dir = install_path.to_string_lossy();

    if !current_path
        .split(';')
        .any(|p| p.eq_ignore_ascii_case(&install_dir))
    {
        let new_path = if current_path.is_empty() {
            install_dir.to_string()
        } else {
            format!("{};{}", current_path, install_dir)
        };
        env_key.set_value("Path", &new_path)?;
        log::info!("Added {} to PATH", install_dir);
    }

    Ok(())
}

/// Remove the install path from the user's PATH environment variable.
pub fn remove_from_path(install_path: &Path) -> Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let env_key = hkcu.open_subkey_with_flags("Environment", KEY_READ | KEY_WRITE)?;

    let current_path: String = env_key.get_value("Path").unwrap_or_default();
    let install_dir = install_path.to_string_lossy();

    let new_path: Vec<&str> = current_path
        .split(';')
        .filter(|p| !p.eq_ignore_ascii_case(&install_dir))
        .collect();

    if new_path.len() < current_path.split(';').count() {
        env_key.set_value("Path", &new_path.join(";"))?;
        log::info!("Removed {} from PATH", install_dir);
    }

    Ok(())
}
