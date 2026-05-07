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
