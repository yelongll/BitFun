import { configManager } from './ConfigManager';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('RunConfig');

export interface NimRunConfig {
  id: string;
  name: string;
  command: 'compile' | 'run' | 'check' | 'js' | 'c' | 'cpp';
  compileMode: 'debug' | 'release';
  optimization: 'none' | 'speed' | 'size';
  warnings: 'off' | 'on' | 'strict';
  threads: boolean;
  memoryManagement: 'orc' | 'arc' | 'refc' | 'markAndSweep' | 'boehm' | 'go' | 'none' | 'regions';
  appType?: 'console' | 'gui' | 'lib' | 'staticlib';
  backend?: 'c' | 'cpp' | 'js' | 'objc';
  debugInfo?: 'default' | 'on' | 'off';
  stackTrace?: 'default' | 'on' | 'off';
  lineTrace?: 'default' | 'on' | 'off';
  checks?: 'default' | 'on' | 'off';
  assertions?: 'default' | 'on' | 'off';
  targetOS?: string;
  targetCPU?: string;
  nimcache?: string;
  defines: string[];
  additionalArgs: string;
  outputPath?: string;
  // Runtime checks (detailed)
  objChecks?: 'default' | 'on' | 'off';
  fieldChecks?: 'default' | 'on' | 'off';
  rangeChecks?: 'default' | 'on' | 'off';
  boundChecks?: 'default' | 'on' | 'off';
  overflowChecks?: 'default' | 'on' | 'off';
  floatChecks?: 'default' | 'on' | 'off';
  nanChecks?: 'default' | 'on' | 'off';
  infChecks?: 'default' | 'on' | 'off';
  // Output control
  outDir?: string;
  stdoutOutput?: 'default' | 'on' | 'off';
  colors?: 'default' | 'on' | 'off';
  verbosity?: number;
  // Compiler options
  passC?: string;
  passL?: string;
  cc?: string;
  cIncludes?: string;
  cLibDir?: string;
  cLib?: string;
  // Path management
  paths?: string[];
  libPath?: string;
  imports?: string[];
  includes?: string[];
  // Config file control
  skipCfg?: 'default' | 'on' | 'off';
  skipUserCfg?: 'default' | 'on' | 'off';
  skipParentCfg?: 'default' | 'on' | 'off';
  skipProjCfg?: 'default' | 'on' | 'off';
  // Other important options
  forceBuild?: 'default' | 'on' | 'off';
  compileOnly?: 'default' | 'on' | 'off';
  noLinking?: 'default' | 'on' | 'off';
  noMain?: 'default' | 'on' | 'off';
  exceptions?: 'setjmp' | 'cpp' | 'goto' | 'quirky';
  parallelBuild?: number;
  incremental?: 'default' | 'on' | 'off';
  styleCheck?: 'off' | 'hint' | 'error' | 'usages';
  lineDir?: 'default' | 'on' | 'off';
  embedSrc?: 'default' | 'on' | 'off';
  experimental?: string[];
  legacy?: string[];
}

export interface RunConfigs {
  nim: NimRunConfig[];
  selectedNimConfig: string;
}

const CONFIG_PATH = 'app.run_configs';

const defaultNimConfigs: NimRunConfig[] = [
  {
    id: 'debug',
    name: '调试版',
    command: 'compile',
    compileMode: 'debug',
    optimization: 'none',
    warnings: 'on',
    threads: false,
    memoryManagement: 'arc',
    defines: [],
    additionalArgs: '',
  },
  {
    id: 'release',
    name: '发布版',
    command: 'compile',
    compileMode: 'release',
    optimization: 'speed',
    warnings: 'on',
    threads: false,
    memoryManagement: 'arc',
    defines: [],
    additionalArgs: '',
  },
  {
    id: 'check',
    name: '语法检查',
    command: 'check',
    compileMode: 'debug',
    optimization: 'none',
    warnings: 'strict',
    threads: false,
    memoryManagement: 'arc',
    defines: [],
    additionalArgs: '',
  },
];

const defaultConfigs: RunConfigs = {
  nim: defaultNimConfigs,
  selectedNimConfig: 'debug',
};

export class RunConfigService {
  private static instance: RunConfigService;
  private cachedConfigs: RunConfigs | null = null;
  private listeners: Set<(configs: RunConfigs) => void> = new Set();
  private unwatchConfig: (() => void) | null = null;

  private constructor() {
    Promise.resolve().then(() => {
      this.unwatchConfig = configManager.watch(CONFIG_PATH, () => {
        this.reload();
      });
      this.loadConfigs();
    });
  }

  static getInstance(): RunConfigService {
    if (!RunConfigService.instance) {
      RunConfigService.instance = new RunConfigService();
    }
    return RunConfigService.instance;
  }

  private async loadConfigs(): Promise<void> {
    try {
      const configs = await configManager.getConfig<RunConfigs>(CONFIG_PATH);
      this.cachedConfigs = { ...defaultConfigs, ...configs };
      log.info('Loaded run configs', { cachedConfigs: this.cachedConfigs });
    } catch (error) {
      log.warn('Failed to load run configs, using defaults', error);
      this.cachedConfigs = defaultConfigs;
    }
  }

  getConfigs(): RunConfigs {
    if (this.cachedConfigs) {
      log.info('Getting cached run configs', { cachedConfigs: this.cachedConfigs });
      return { ...this.cachedConfigs };
    }
    log.info('No cached run configs, returning defaults');
    return { ...defaultConfigs };
  }

  async getConfigsAsync(): Promise<RunConfigs> {
    try {
      const configs = await configManager.getConfig<RunConfigs>(CONFIG_PATH);
      this.cachedConfigs = { ...defaultConfigs, ...configs };
      log.info('Got run configs async', { cachedConfigs: this.cachedConfigs });
      return this.cachedConfigs;
    } catch (error) {
      log.error('Failed to get run configs', error);
      return this.getConfigs();
    }
  }

  async saveConfigs(configs: RunConfigs): Promise<void> {
    try {
      log.info('Saving run configs', { configs });
      await configManager.setConfig(CONFIG_PATH, configs);
      this.cachedConfigs = configs;
      this.notifyListeners();
      log.info('Run configs saved successfully');
    } catch (error) {
      log.error('Failed to save run configs', error);
      throw error;
    }
  }

  async saveNimConfigs(nimConfigs: NimRunConfig[], selectedConfig?: string): Promise<void> {
    log.info('Saving nim configs', { nimConfigs, selectedConfig });
    const configs = this.getConfigs();
    await this.saveConfigs({
      ...configs,
      nim: nimConfigs,
      selectedNimConfig: selectedConfig || configs.selectedNimConfig,
    });
  }

  async setSelectedNimConfig(configId: string): Promise<void> {
    const configs = this.getConfigs();
    await this.saveConfigs({
      ...configs,
      selectedNimConfig: configId,
    });
  }

  subscribe(listener: (configs: RunConfigs) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    if (this.cachedConfigs) {
      this.listeners.forEach(listener => listener(this.cachedConfigs!));
    }
  }

  private async reload(): Promise<void> {
    await this.loadConfigs();
    this.notifyListeners();
  }

  destroy(): void {
    if (this.unwatchConfig) {
      this.unwatchConfig();
      this.unwatchConfig = null;
    }
    this.listeners.clear();
  }
}

export const runConfigService = RunConfigService.getInstance();
