//! 空灵 Language Compiler API
//! 
//! Provides Tauri commands for compiling and running 空灵 language files.

use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NimCompileRequest {
    pub file_path: String,
    pub output_path: Option<String>,
    pub compile_mode: Option<String>,
    pub nim_command: Option<String>,
    pub optimization: Option<String>,
    pub warnings: Option<String>,
    pub threads: Option<bool>,
    pub memory_management: Option<String>,
    pub app_type: Option<String>,
    pub backend: Option<String>,
    pub debug_info: Option<String>,
    pub stack_trace: Option<String>,
    pub line_trace: Option<String>,
    pub checks: Option<String>,
    pub assertions: Option<String>,
    pub target_os: Option<String>,
    pub target_cpu: Option<String>,
    pub nimcache: Option<String>,
    pub defines: Option<Vec<String>>,
    pub additional_args: Option<String>,
    // Runtime checks (detailed)
    pub obj_checks: Option<String>,
    pub field_checks: Option<String>,
    pub range_checks: Option<String>,
    pub bound_checks: Option<String>,
    pub overflow_checks: Option<String>,
    pub float_checks: Option<String>,
    pub nan_checks: Option<String>,
    pub inf_checks: Option<String>,
    // Output control
    pub out_dir: Option<String>,
    pub stdout_output: Option<String>,
    pub colors: Option<String>,
    pub verbosity: Option<i32>,
    // Compiler options
    pub pass_c: Option<String>,
    pub pass_l: Option<String>,
    pub cc: Option<String>,
    pub c_includes: Option<String>,
    pub c_lib_dir: Option<String>,
    pub c_lib: Option<String>,
    // Path management
    pub paths: Option<Vec<String>>,
    pub lib_path: Option<String>,
    pub imports: Option<Vec<String>>,
    pub includes: Option<Vec<String>>,
    // Config file control
    pub skip_cfg: Option<String>,
    pub skip_user_cfg: Option<String>,
    pub skip_parent_cfg: Option<String>,
    pub skip_proj_cfg: Option<String>,
    // Other important options
    pub force_build: Option<String>,
    pub compile_only: Option<String>,
    pub no_linking: Option<String>,
    pub no_main: Option<String>,
    pub exceptions: Option<String>,
    pub parallel_build: Option<i32>,
    pub incremental: Option<String>,
    pub style_check: Option<String>,
    pub line_dir: Option<String>,
    pub embed_src: Option<String>,
    pub experimental: Option<Vec<String>>,
    pub legacy: Option<Vec<String>>,
}

fn add_on_off_arg(args: &mut Vec<String>, option_name: &str, value: Option<&String>) {
    if let Some(v) = value {
        match v.as_str() {
            "on" => args.push(format!("{}:on", option_name)),
            "off" => args.push(format!("{}:off", option_name)),
            "default" | _ => {}
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NimCompileResponse {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub executable_path: Option<String>,
    pub compiler_info: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NimCompilerInfo {
    pub available: bool,
    pub version: Option<String>,
    pub path: Option<String>,
}

fn get_nim_compiler_path() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let exe_dir = exe.parent()?;

    #[cfg(windows)]
    let nim_path = exe_dir.join("compiler/bin/kl.exe");
    #[cfg(not(windows))]
    let nim_path = exe_dir.join("compiler/bin/kl");

    if nim_path.exists() {
        info!("在以下位置找到 空灵 编译器: {}", nim_path.display());
        Some(nim_path)
    } else {
        warn!("在以下位置未找到 空灵 编译器: {}", nim_path.display());
        None
    }
}

#[tauri::command]
pub async fn get_nim_compiler_info() -> NimCompilerInfo {
    match get_nim_compiler_path() {
        Some(nim_path) => {
            let version_output = Command::new(&nim_path)
                .arg("--version")
                .output();

            let version = version_output.ok().and_then(|output| {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                stdout.lines().next().map(|s| s.to_string())
            });

            NimCompilerInfo {
                available: true,
                version,
                path: Some(nim_path.to_string_lossy().to_string()),
            }
        }
        None => NimCompilerInfo {
            available: false,
            version: None,
            path: None,
        },
    }
}

#[tauri::command]
pub async fn compile_nim(request: NimCompileRequest) -> Result<NimCompileResponse, String> {
    let nim_path = get_nim_compiler_path()
        .ok_or_else(|| "空灵 编译器未找到，请确保程序目录下存在 compiler/bin/kl.".to_string())?;

    let file_path = PathBuf::from(&request.file_path);
    if !file_path.exists() {
        return Err(format!("文件不存在: {}", request.file_path));
    }

    let mut args = vec!["c".to_string()];

    // Output path (only add if specified)
    if let Some(output_path) = request.output_path.as_ref() {
        if !output_path.is_empty() {
            args.push(format!("-o:{}", output_path));
        }
    }

    // Compile mode
    if request.compile_mode.as_deref() == Some("release") {
        args.push("-d:release".to_string());
    }

    // Optimization
    match request.optimization.as_deref() {
        Some("speed") => args.push("-d:optimizeSpeed".to_string()),
        Some("size") => args.push("-d:optimizeSize".to_string()),
        _ => {}
    }

    // Warnings
    match request.warnings.as_deref() {
        Some("off") => args.push("--warnings:off".to_string()),
        Some("strict") => {
            args.push("--warnings:all".to_string());
            args.push("--hints:all".to_string());
        },
        _ => {}
    }

    // Threads
    if request.threads.unwrap_or(false) {
        args.push("--threads:on".to_string());
    }

    // Memory Management (mm)
    if let Some(mm) = request.memory_management.as_ref() {
        if !mm.is_empty() {
            args.push(format!("--mm:{}", mm));
        }
    }

    // App Type
    if let Some(app_type) = request.app_type.as_ref() {
        if !app_type.is_empty() {
            args.push(format!("--app:{}", app_type));
        }
    }

    // Backend
    if let Some(backend) = request.backend.as_ref() {
        if !backend.is_empty() {
            args.push(format!("--backend:{}", backend));
        }
    }

    // Debug Info
    add_on_off_arg(&mut args, "--debuginfo", request.debug_info.as_ref());

    // Stack Trace
    add_on_off_arg(&mut args, "--stackTrace", request.stack_trace.as_ref());

    // Line Trace
    add_on_off_arg(&mut args, "--lineTrace", request.line_trace.as_ref());

    // Checks
    add_on_off_arg(&mut args, "-x", request.checks.as_ref());

    // Assertions
    add_on_off_arg(&mut args, "-a", request.assertions.as_ref());

    // Target OS
    if let Some(target_os) = request.target_os.as_ref() {
        if !target_os.is_empty() {
            args.push(format!("--os:{}", target_os));
        }
    }

    // Target CPU
    if let Some(target_cpu) = request.target_cpu.as_ref() {
        if !target_cpu.is_empty() {
            args.push(format!("--cpu:{}", target_cpu));
        }
    }

    // Nimcache
    if let Some(nimcache) = request.nimcache.as_ref() {
        if !nimcache.is_empty() {
            args.push(format!("--nimcache:{}", nimcache));
        }
    }

    // Defines
    if let Some(defines) = request.defines.as_ref() {
        for define in defines {
            args.push(format!("-d:{}", define));
        }
    }

    // Runtime checks (detailed)
    add_on_off_arg(&mut args, "--objChecks", request.obj_checks.as_ref());
    add_on_off_arg(&mut args, "--fieldChecks", request.field_checks.as_ref());
    add_on_off_arg(&mut args, "--rangeChecks", request.range_checks.as_ref());
    add_on_off_arg(&mut args, "--boundChecks", request.bound_checks.as_ref());
    add_on_off_arg(&mut args, "--overflowChecks", request.overflow_checks.as_ref());
    add_on_off_arg(&mut args, "--floatChecks", request.float_checks.as_ref());
    add_on_off_arg(&mut args, "--nanChecks", request.nan_checks.as_ref());
    add_on_off_arg(&mut args, "--infChecks", request.inf_checks.as_ref());

    // Output control
    if let Some(out_dir) = request.out_dir.as_ref() {
        if !out_dir.is_empty() {
            args.push(format!("--outdir:{}", out_dir));
        }
    }
    add_on_off_arg(&mut args, "--stdout", request.stdout_output.as_ref());
    add_on_off_arg(&mut args, "--colors", request.colors.as_ref());
    if let Some(verbosity) = request.verbosity {
        args.push(format!("--verbosity:{}", verbosity));
    }

    // Compiler options
    if let Some(pass_c) = request.pass_c.as_ref() {
        if !pass_c.is_empty() {
            args.push(format!("-t:{}", pass_c));
        }
    }
    if let Some(pass_l) = request.pass_l.as_ref() {
        if !pass_l.is_empty() {
            args.push(format!("-l:{}", pass_l));
        }
    }
    if let Some(cc) = request.cc.as_ref() {
        if !cc.is_empty() {
            args.push(format!("--cc:{}", cc));
        }
    }
    if let Some(c_includes) = request.c_includes.as_ref() {
        if !c_includes.is_empty() {
            args.push(format!("--cincludes:{}", c_includes));
        }
    }
    if let Some(c_lib_dir) = request.c_lib_dir.as_ref() {
        if !c_lib_dir.is_empty() {
            args.push(format!("--clibdir:{}", c_lib_dir));
        }
    }
    if let Some(c_lib) = request.c_lib.as_ref() {
        if !c_lib.is_empty() {
            args.push(format!("--clib:{}", c_lib));
        }
    }

    // Path management
    if let Some(paths) = request.paths.as_ref() {
        for path in paths {
            if !path.is_empty() {
                args.push(format!("-p:{}", path));
            }
        }
    }
    if let Some(lib_path) = request.lib_path.as_ref() {
        if !lib_path.is_empty() {
            args.push(format!("--lib:{}", lib_path));
        }
    }
    if let Some(imports) = request.imports.as_ref() {
        for import in imports {
            if !import.is_empty() {
                args.push(format!("--import:{}", import));
            }
        }
    }
    if let Some(includes) = request.includes.as_ref() {
        for include in includes {
            if !include.is_empty() {
                args.push(format!("--include:{}", include));
            }
        }
    }

    // Config file control
    add_on_off_arg(&mut args, "--skipCfg", request.skip_cfg.as_ref());
    add_on_off_arg(&mut args, "--skipUserCfg", request.skip_user_cfg.as_ref());
    add_on_off_arg(&mut args, "--skipParentCfg", request.skip_parent_cfg.as_ref());
    add_on_off_arg(&mut args, "--skipProjCfg", request.skip_proj_cfg.as_ref());

    // Other important options
    add_on_off_arg(&mut args, "-f", request.force_build.as_ref());
    add_on_off_arg(&mut args, "-c", request.compile_only.as_ref());
    add_on_off_arg(&mut args, "--noLinking", request.no_linking.as_ref());
    add_on_off_arg(&mut args, "--noMain", request.no_main.as_ref());
    if let Some(exceptions) = request.exceptions.as_ref() {
        if !exceptions.is_empty() {
            args.push(format!("--exceptions:{}", exceptions));
        }
    }
    if let Some(parallel_build) = request.parallel_build {
        args.push(format!("--parallelBuild:{}", parallel_build));
    }
    add_on_off_arg(&mut args, "--incremental", request.incremental.as_ref());
    if let Some(style_check) = request.style_check.as_ref() {
        if !style_check.is_empty() {
            args.push(format!("--styleCheck:{}", style_check));
        }
    }
    add_on_off_arg(&mut args, "--lineDir", request.line_dir.as_ref());
    add_on_off_arg(&mut args, "--embedsrc", request.embed_src.as_ref());
    if let Some(experimental) = request.experimental.as_ref() {
        for feature in experimental {
            if !feature.is_empty() {
                args.push(format!("--experimental:{}", feature));
            }
        }
    }
    if let Some(legacy) = request.legacy.as_ref() {
        for feature in legacy {
            if !feature.is_empty() {
                args.push(format!("--legacy:{}", feature));
            }
        }
    }

    // Additional args
    if let Some(additional_args) = request.additional_args.as_ref() {
        for arg in additional_args.split_whitespace() {
            args.push(arg.to_string());
        }
    }

    args.push(request.file_path.clone());

    info!("编译空灵文件: {} 编译参数: {:?}", request.file_path, args);

    let output = Command::new(&nim_path)
        .args(&args)
        .output()
        .map_err(|e| {
            error!("编译空灵文件失败: {}", e);
            format!("编译空灵文件失败: {}", e)
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined_output = if !stdout.is_empty() && !stderr.is_empty() {
        format!("{}\n{}", stdout, stderr)
    } else if !stdout.is_empty() {
        stdout
    } else {
        stderr.clone()
    };

    let executable_path = if output.status.success() {
        // Determine the executable path
        let exe_path = if let Some(output_path) = request.output_path.as_ref() {
            if !output_path.is_empty() {
                output_path.clone()
            } else {
                file_path.with_extension("").to_string_lossy().to_string()
            }
        } else {
            file_path.with_extension("").to_string_lossy().to_string()
        };

        #[cfg(windows)]
        {
            let mut win_path = exe_path;
            if !win_path.ends_with(".exe") {
                win_path.push_str(".exe");
            }
            Some(win_path)
        }
        #[cfg(not(windows))]
        Some(exe_path)
    } else {
        None
    };

    Ok(NimCompileResponse {
        success: output.status.success(),
        output: combined_output,
        error: if !output.status.success() && !stderr.is_empty() {
            Some(stderr.clone())
        } else {
            None
        },
        executable_path,
        compiler_info: if !stderr.is_empty() {
            Some(stderr)
        } else {
            None
        },
    })
}

#[tauri::command]
pub async fn run_nim(request: NimCompileRequest) -> Result<NimCompileResponse, String> {
    let nim_path = get_nim_compiler_path()
        .ok_or_else(|| "空灵 编译器未找到，请确保程序目录下存在 compiler/bin/kl.".to_string())?;

    let file_path = PathBuf::from(&request.file_path);
    if !file_path.exists() {
        return Err(format!("文件不存在: {}", request.file_path));
    }

    let nim_command = request.nim_command.as_deref().unwrap_or("compile");
    
    match nim_command {
        "check" => {
            // Syntax check only
            let output = Command::new(&nim_path)
                .args(&["check", &request.file_path])
                .output()
                .map_err(|e| format!("语法检查失败: {}", e))?;

            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let combined_output = if !stdout.is_empty() && !stderr.is_empty() {
                format!("{}\n{}", stdout, stderr)
            } else if !stdout.is_empty() {
                stdout
            } else {
                stderr.clone()
            };

            Ok(NimCompileResponse {
                success: output.status.success(),
                output: if output.status.success() {
                    "语法检查通过".to_string()
                } else {
                    combined_output
                },
                error: if !output.status.success() && !stderr.is_empty() {
                    Some(stderr.clone())
                } else {
                    None
                },
                executable_path: None,
                compiler_info: if !stderr.is_empty() {
                    Some(stderr)
                } else {
                    None
                },
            })
        }
        "run" => {
            // Compile and run in one step
            let mut args = vec!["r".to_string()];
            
            // Compile mode
            if request.compile_mode.as_deref() == Some("release") {
                args.push("-d:release".to_string());
            }

            // Optimization
            match request.optimization.as_deref() {
                Some("speed") => args.push("-d:optimizeSpeed".to_string()),
                Some("size") => args.push("-d:optimizeSize".to_string()),
                _ => {}
            }

            // Warnings
            match request.warnings.as_deref() {
                Some("off") => args.push("--warnings:off".to_string()),
                Some("strict") => {
                    args.push("--warnings:all".to_string());
                    args.push("--hints:all".to_string());
                },
                _ => {}
            }

            // Threads
            if request.threads.unwrap_or(false) {
                args.push("--threads:on".to_string());
            }

            // Memory Management (mm)
            if let Some(mm) = request.memory_management.as_ref() {
                if !mm.is_empty() {
                    args.push(format!("--mm:{}", mm));
                }
            }

            // App Type
            if let Some(app_type) = request.app_type.as_ref() {
                if !app_type.is_empty() {
                    args.push(format!("--app:{}", app_type));
                }
            }

            // Backend
            if let Some(backend) = request.backend.as_ref() {
                if !backend.is_empty() {
                    args.push(format!("--backend:{}", backend));
                }
            }

            // Debug Info
            add_on_off_arg(&mut args, "--debuginfo", request.debug_info.as_ref());

            // Stack Trace
            add_on_off_arg(&mut args, "--stackTrace", request.stack_trace.as_ref());

            // Line Trace
            add_on_off_arg(&mut args, "--lineTrace", request.line_trace.as_ref());

            // Checks
            add_on_off_arg(&mut args, "-x", request.checks.as_ref());

            // Assertions
            add_on_off_arg(&mut args, "-a", request.assertions.as_ref());

            // Target OS
            if let Some(target_os) = request.target_os.as_ref() {
                if !target_os.is_empty() {
                    args.push(format!("--os:{}", target_os));
                }
            }

            // Target CPU
            if let Some(target_cpu) = request.target_cpu.as_ref() {
                if !target_cpu.is_empty() {
                    args.push(format!("--cpu:{}", target_cpu));
                }
            }

            // Nimcache
            if let Some(nimcache) = request.nimcache.as_ref() {
                if !nimcache.is_empty() {
                    args.push(format!("--nimcache:{}", nimcache));
                }
            }

            // Defines
            if let Some(defines) = request.defines.as_ref() {
                for define in defines {
                    args.push(format!("-d:{}", define));
                }
            }

            // Additional args
            if let Some(additional_args) = request.additional_args.as_ref() {
                for arg in additional_args.split_whitespace() {
                    args.push(arg.to_string());
                }
            }
            
            args.push(request.file_path.clone());

            info!("运行空灵文件: {} 运行参数: {:?}", request.file_path, args);

            let output = Command::new(&nim_path)
                .args(&args)
                .output()
                .map_err(|e| format!("运行空灵文件出错: {}", e))?;

            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            
            // Merge all output (stdout + stderr)
            let combined_output = if !stdout.is_empty() && !stderr.is_empty() {
                format!("{}\n{}", stdout, stderr)
            } else if !stdout.is_empty() {
                stdout
            } else {
                stderr.clone()
            };
            
            Ok(NimCompileResponse {
                success: output.status.success(),
                output: combined_output,
                error: if !output.status.success() && !stderr.is_empty() {
                    Some(stderr.clone())
                } else {
                    None
                },
                executable_path: None,
                compiler_info: if !stderr.is_empty() {
                    Some(stderr)
                } else {
                    None
                },
            })
        }
        _ => {
            // Default: compile then run
            let compile_result = compile_nim(request.clone()).await?;

            if !compile_result.success {
                return Ok(compile_result);
            }

            let exe_path = compile_result
                .executable_path
                .as_ref()
                .ok_or_else(|| "编译空灵文件后未返回可执行文件路径".to_string())?;

            if !PathBuf::from(exe_path).exists() {
                return Err(format!("编译后的可执行文件不存在: {}", exe_path));
            }

            info!("运行空灵可执行文件: {}", exe_path);

            let output = Command::new(exe_path)
                .output()
                .map_err(|e| {
                    error!("运行空灵程序失败: {}", e);
                    format!("运行空灵程序失败: {}", e)
                })?;

            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let combined_output = if !stdout.is_empty() && !stderr.is_empty() {
                format!("{}\n{}", stdout, stderr)
            } else if !stdout.is_empty() {
                stdout
            } else {
                stderr.clone()
            };

            Ok(NimCompileResponse {
                success: output.status.success(),
                output: combined_output,
                error: if !output.status.success() && !stderr.is_empty() {
                    Some(stderr)
                } else {
                    None
                },
                executable_path: compile_result.executable_path,
                compiler_info: compile_result.compiler_info,
            })
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalLibrarySymbol {
    pub name: String,
    pub symbol_type: String,
    pub signature: Option<String>,
    pub doc_comment: Option<String>,
    pub params: Option<Vec<SymbolParam>>,
    pub return_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymbolParam {
    pub name: String,
    pub param_type: String,
    pub default_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalLibraryInfo {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub file_size: u64,
    pub symbols: Vec<LocalLibrarySymbol>,
    pub doc_comment: Option<String>,
}

fn get_compiler_lib_dir() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let exe_dir = exe.parent()?;

    let lib_dir = exe_dir.join("compiler/lib");
    if lib_dir.exists() {
        info!("在可执行文件目录找到 compiler/lib: {}", lib_dir.display());
        return Some(lib_dir);
    }

    if let Ok(cwd) = std::env::current_dir() {
        let cwd_lib = cwd.join("compiler/lib");
        if cwd_lib.exists() {
            info!("在当前工作目录找到 compiler/lib: {}", cwd_lib.display());
            return Some(cwd_lib);
        }

        let mut parent = cwd.parent();
        while let Some(p) = parent {
            let p_lib = p.join("compiler/lib");
            if p_lib.exists() {
                info!("在父目录找到 compiler/lib: {}", p_lib.display());
                return Some(p_lib);
            }
            parent = p.parent();
        }
    }

    #[cfg(debug_assertions)]
    {
        if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
            let manifest_path = PathBuf::from(manifest_dir);
            let project_root = manifest_path
                .parent()
                .and_then(|p| p.parent())
                .and_then(|p| p.parent());
            if let Some(root) = project_root {
                let root_lib = root.join("compiler/lib");
                if root_lib.exists() {
                    info!("在项目根目录找到 compiler/lib: {}", root_lib.display());
                    return Some(root_lib);
                }
            }
        }
    }

    warn!("未找到 compiler/lib 目录，已搜索: 可执行文件目录={}, 当前工作目录, 父目录链", exe_dir.display());
    None
}

fn parse_nim_symbols(content: &str) -> Vec<LocalLibrarySymbol> {
    let mut symbols = Vec::new();
    let mut current_doc: Option<String> = None;

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("##") {
            let doc_text = trimmed.trim_start_matches('#').trim();
            current_doc = Some(match current_doc.take() {
                Some(prev) => format!("{}\n{}", prev, doc_text),
                None => doc_text.to_string(),
            });
            continue;
        }

        if trimmed.is_empty() || trimmed.starts_with('#') && !trimmed.starts_with("##") {
            if !trimmed.starts_with('#') {
                current_doc = None;
            }
            continue;
        }

        let symbol = if let Some(rest) = trimmed.strip_prefix("proc ") {
            parse_proc_signature(rest, "proc", current_doc.take())
        } else if let Some(rest) = trimmed.strip_prefix("func ") {
            parse_proc_signature(rest, "func", current_doc.take())
        } else if let Some(rest) = trimmed.strip_prefix("template ") {
            parse_proc_signature(rest, "template", current_doc.take())
        } else if let Some(rest) = trimmed.strip_prefix("macro ") {
            parse_proc_signature(rest, "macro", current_doc.take())
        } else if let Some(rest) = trimmed.strip_prefix("method ") {
            parse_proc_signature(rest, "method", current_doc.take())
        } else if let Some(rest) = trimmed.strip_prefix("converter ") {
            parse_proc_signature(rest, "converter", current_doc.take())
        } else if let Some(rest) = trimmed.strip_prefix("type ") {
            parse_type_definition(rest, current_doc.take())
        } else if let Some(rest) = trimmed.strip_prefix("const ") {
            parse_const_definition(rest, current_doc.take())
        } else if let Some(rest) = trimmed.strip_prefix("let ") {
            Some(LocalLibrarySymbol {
                name: extract_identifier(rest),
                symbol_type: "let".to_string(),
                signature: Some(trimmed.to_string()),
                doc_comment: current_doc.take(),
                params: None,
                return_type: extract_type_after_colon(rest),
            })
        } else if let Some(rest) = trimmed.strip_prefix("var ") {
            Some(LocalLibrarySymbol {
                name: extract_identifier(rest),
                symbol_type: "var".to_string(),
                signature: Some(trimmed.to_string()),
                doc_comment: current_doc.take(),
                params: None,
                return_type: extract_type_after_colon(rest),
            })
        } else {
            current_doc = None;
            None
        };

        if let Some(sym) = symbol {
            symbols.push(sym);
        }
    }

    symbols
}

fn parse_proc_signature(rest: &str, symbol_type: &str, doc: Option<String>) -> Option<LocalLibrarySymbol> {
    let name = extract_identifier(rest);
    if name.is_empty() {
        return None;
    }

    let signature = format!("{} {}", symbol_type, rest.trim_end_matches(':').trim());

    let (params, return_type) = parse_params_and_return(rest);

    Some(LocalLibrarySymbol {
        name,
        symbol_type: symbol_type.to_string(),
        signature: Some(signature),
        doc_comment: doc,
        params: if params.is_empty() { None } else { Some(params) },
        return_type,
    })
}

fn parse_type_definition(rest: &str, doc: Option<String>) -> Option<LocalLibrarySymbol> {
    let name = extract_identifier(rest);
    if name.is_empty() {
        return None;
    }

    let return_type = extract_type_after_eq(rest);

    Some(LocalLibrarySymbol {
        name,
        symbol_type: "type".to_string(),
        signature: Some(format!("type {}", rest.trim_end_matches(':').trim())),
        doc_comment: doc,
        params: None,
        return_type,
    })
}

fn parse_const_definition(rest: &str, doc: Option<String>) -> Option<LocalLibrarySymbol> {
    let name = extract_identifier(rest);
    if name.is_empty() {
        return None;
    }

    let return_type = extract_type_after_colon(rest);

    Some(LocalLibrarySymbol {
        name,
        symbol_type: "const".to_string(),
        signature: Some(format!("const {}", rest.trim_end_matches(':').trim())),
        doc_comment: doc,
        params: None,
        return_type,
    })
}

fn extract_identifier(rest: &str) -> String {
    let name: String = rest
        .chars()
        .take_while(|c| c.is_alphanumeric() || *c == '_' || *c == '*')
        .collect();
    name.trim_end_matches('*').to_string()
}

fn extract_type_after_colon(rest: &str) -> Option<String> {
    if let Some(colon_pos) = rest.find(':') {
        let after_colon = &rest[colon_pos + 1..];
        let type_str: String = after_colon
            .chars()
            .take_while(|c| *c != '=' && *c != '{' && *c != '#' && !c.is_whitespace() || *c == '[' || *c == ']')
            .collect();
        let trimmed = type_str.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }
    None
}

fn extract_type_after_eq(rest: &str) -> Option<String> {
    if let Some(eq_pos) = rest.find('=') {
        let after_eq = &rest[eq_pos + 1..];
        let type_str: String = after_eq
            .chars()
            .take_while(|c| *c != '{' && *c != '#' && *c != '\n')
            .collect();
        let trimmed = type_str.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }
    None
}

fn parse_params_and_return(rest: &str) -> (Vec<SymbolParam>, Option<String>) {
    let mut params = Vec::new();
    let mut return_type = None;

    if let Some(open) = rest.find('(') {
        let close = rest.find(')').unwrap_or(rest.len());
        let params_str = &rest[open + 1..close];

        if !params_str.trim().is_empty() {
            for param_group in params_str.split(';') {
                let group = param_group.trim();
                if group.is_empty() {
                    continue;
                }
                if let Some(colon_pos) = group.find(':') {
                    let names_str = &group[..colon_pos];
                    let type_and_default = &group[colon_pos + 1..];

                    let (param_type, default_value) = if let Some(eq_pos) = type_and_default.find('=') {
                        (type_and_default[..eq_pos].trim().to_string(), Some(type_and_default[eq_pos + 1..].trim().to_string()))
                    } else {
                        (type_and_default.trim().to_string(), None)
                    };

                    for name in names_str.split(',') {
                        let name = name.trim();
                        if !name.is_empty() {
                            params.push(SymbolParam {
                                name: name.to_string(),
                                param_type: param_type.clone(),
                                default_value: default_value.clone(),
                            });
                        }
                    }
                }
            }
        }

        let after_params = &rest[close + 1..];
        if let Some(colon_pos) = after_params.find(':') {
            let ret = after_params[colon_pos + 1..]
                .chars()
                .take_while(|c| *c != '=' && *c != '{' && *c != '#')
                .collect::<String>();
            let trimmed = ret.trim();
            if !trimmed.is_empty() {
                return_type = Some(trimmed.to_string());
            }
        }
    }

    (params, return_type)
}

fn scan_lib_directory(lib_dir: &PathBuf) -> Vec<LocalLibraryInfo> {
    let mut libraries = Vec::new();

    if let Ok(entries) = std::fs::read_dir(lib_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                scan_lib_subdirectory(&path, lib_dir, &mut libraries);
            } else if is_nim_file(&path) {
                if let Some(lib_info) = read_library_file(&path, lib_dir) {
                    libraries.push(lib_info);
                }
            }
        }
    }

    libraries.sort_by(|a, b| a.name.cmp(&b.name));
    libraries
}

fn scan_lib_subdirectory(dir: &PathBuf, base_dir: &PathBuf, libraries: &mut Vec<LocalLibraryInfo>) {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                scan_lib_subdirectory(&path, base_dir, libraries);
            } else if is_nim_file(&path) {
                if let Some(lib_info) = read_library_file(&path, base_dir) {
                    libraries.push(lib_info);
                }
            }
        }
    }
}

fn is_nim_file(path: &PathBuf) -> bool {
    path.extension()
        .map(|ext| ext == "灵" || ext == "nim")
        .unwrap_or(false)
}

fn read_library_file(path: &PathBuf, base_dir: &PathBuf) -> Option<LocalLibraryInfo> {
    let content = std::fs::read_to_string(path).ok()?;
    let metadata = std::fs::metadata(path).ok()?;
    let name = path.file_stem()?.to_string_lossy().to_string();
    let relative_path = path.strip_prefix(base_dir)
        .unwrap_or(path)
        .to_string_lossy()
        .to_string();

    let doc_comment = content.lines()
        .take_while(|line| line.trim().starts_with("##"))
        .map(|line| line.trim_start_matches('#').trim())
        .collect::<Vec<_>>()
        .join("\n");

    let symbols = parse_nim_symbols(&content);

    Some(LocalLibraryInfo {
        name,
        path: path.to_string_lossy().to_string(),
        relative_path,
        file_size: metadata.len(),
        symbols,
        doc_comment: if doc_comment.is_empty() { None } else { Some(doc_comment) },
    })
}

#[tauri::command]
pub async fn get_local_libraries() -> Result<Vec<LocalLibraryInfo>, String> {
    let lib_dir = get_compiler_lib_dir()
        .ok_or_else(|| "compiler/lib 目录未找到，请确保程序目录下存在 compiler/lib.".to_string())?;

    info!("扫描本地库目录: {}", lib_dir.display());
    let libraries = scan_lib_directory(&lib_dir);
    info!("找到 {} 个本地库", libraries.len());
    Ok(libraries)
}

#[tauri::command]
pub async fn get_local_library_detail(file_path: String) -> Result<LocalLibraryInfo, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    let base_dir = get_compiler_lib_dir()
        .ok_or_else(|| "compiler/lib 目录未找到".to_string())?;

    read_library_file(&path, &base_dir)
        .ok_or_else(|| format!("无法读取库文件: {}", file_path))
}
