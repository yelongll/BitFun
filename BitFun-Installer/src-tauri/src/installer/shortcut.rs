//! Windows shortcut (.lnk) creation for desktop and Start Menu.

use anyhow::{Context, Result};
use std::path::{Path, PathBuf};

/// Create a desktop shortcut for 空灵语言.
pub fn create_desktop_shortcut(install_path: &Path) -> Result<()> {
    let desktop = dirs::desktop_dir().with_context(|| "Cannot find Desktop directory")?;
    let shortcut_path = desktop.join("空灵语言.lnk");
    let exe_path = install_path.join("BitFun.exe");

    create_lnk(&shortcut_path, &exe_path, install_path)?;
    log::info!("Created desktop shortcut at {}", shortcut_path.display());
    Ok(())
}

/// Create a Start Menu shortcut for 空灵语言.
pub fn create_start_menu_shortcut(install_path: &Path) -> Result<()> {
    let start_menu = get_start_menu_dir()?;
    let kongling_folder = start_menu.join("空灵语言");
    std::fs::create_dir_all(&kongling_folder)?;

    let shortcut_path = kongling_folder.join("空灵语言.lnk");
    let exe_path = install_path.join("BitFun.exe");

    create_lnk(&shortcut_path, &exe_path, install_path)?;
    log::info!("Created Start Menu shortcut at {}", shortcut_path.display());
    Ok(())
}

/// Remove desktop shortcut.
pub fn remove_desktop_shortcut() -> Result<()> {
    if let Some(desktop) = dirs::desktop_dir() {
        let shortcut_path = desktop.join("空灵语言.lnk");
        if shortcut_path.exists() {
            std::fs::remove_file(&shortcut_path)?;
        }
    }
    Ok(())
}

/// Remove Start Menu shortcut folder.
pub fn remove_start_menu_shortcut() -> Result<()> {
    let start_menu = get_start_menu_dir()?;
    let kongling_folder = start_menu.join("空灵语言");
    if kongling_folder.exists() {
        std::fs::remove_dir_all(&kongling_folder)?;
    }
    Ok(())
}

/// Get the current user's Start Menu Programs directory.
fn get_start_menu_dir() -> Result<PathBuf> {
    let appdata =
        std::env::var("APPDATA").with_context(|| "APPDATA environment variable not set")?;
    Ok(PathBuf::from(appdata)
        .join("Microsoft")
        .join("Windows")
        .join("Start Menu")
        .join("Programs"))
}

/// Create a Windows shortcut (.lnk) file.
fn create_lnk(shortcut_path: &Path, target: &Path, working_dir: &Path) -> Result<()> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::BOOL;
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitialize, CLSCTX_INPROC_SERVER, IPersistFile,
    };
    use windows::Win32::UI::Shell::IShellLinkW;
    use windows::Win32::UI::Shell::ShellLink;
    use windows_core::ComInterface;

    unsafe {
        CoInitialize(None)?;

        let shell_link: IShellLinkW =
            CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)?;

        let target_wide: Vec<u16> = OsStr::new(target)
            .encode_wide()
            .chain(Some(0))
            .collect();
        shell_link.SetPath(PCWSTR(target_wide.as_ptr()))?;

        let working_dir_wide: Vec<u16> = OsStr::new(working_dir)
            .encode_wide()
            .chain(Some(0))
            .collect();
        shell_link.SetWorkingDirectory(PCWSTR(working_dir_wide.as_ptr()))?;

        let shortcut_wide: Vec<u16> = OsStr::new(shortcut_path)
            .encode_wide()
            .chain(Some(0))
            .collect();
        let persist_file: IPersistFile = shell_link.cast()?;
        persist_file.Save(PCWSTR(shortcut_wide.as_ptr()), BOOL::from(true))?;
    }

    Ok(())
}
