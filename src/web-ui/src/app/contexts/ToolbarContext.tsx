/**
 * ToolbarContext - Manages toolbar state for tab bar integration
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface RunConfig {
  id: string;
  name: string;
}

interface ToolbarState {
  isRunning: boolean;
  isDebugging: boolean;
  isBuilding: boolean;
  selectedConfig: string;
  runConfigs: RunConfig[];
}

interface ToolbarContextType extends ToolbarState {
  setIsRunning: (value: boolean) => void;
  setIsDebugging: (value: boolean) => void;
  setIsBuilding: (value: boolean) => void;
  setSelectedConfig: (value: string) => void;
  handleRun: (configId?: string) => void;
  handleDebug: () => void;
  handleStop: () => void;
  handleRestart: () => void;
  handleBuild: () => void;
  handleFormat: () => void;
  handleOpenTerminal: () => void;
  handleOpenSettings: () => void;
}

const ToolbarContext = createContext<ToolbarContextType | null>(null);

export const ToolbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string>('debug');

  const runConfigs: RunConfig[] = [
    { id: 'debug', name: '调试' },
    { id: 'release', name: '发布' },
    { id: 'test', name: '测试' },
  ];

  const handleRun = useCallback((configId?: string) => {
    setIsRunning(true);
    // TODO: Implement actual run logic with config
    console.log('Run triggered with config:', configId || selectedConfig);
  }, [selectedConfig]);

  const handleDebug = useCallback(() => {
    setIsDebugging(true);
    // TODO: Implement actual debug logic
    console.log('Debug triggered');
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setIsDebugging(false);
    setIsBuilding(false);
    // TODO: Implement actual stop logic
    console.log('Stop triggered');
  }, []);

  const handleRestart = useCallback(() => {
    handleStop();
    setTimeout(() => {
      handleRun();
    }, 100);
    console.log('Restart triggered');
  }, [handleRun, handleStop]);

  const handleBuild = useCallback(() => {
    setIsBuilding(true);
    // TODO: Implement actual build logic
    console.log('Build triggered');
  }, []);

  const handleFormat = useCallback(() => {
    // TODO: Implement actual format logic
    console.log('Format triggered');
  }, []);

  const handleOpenTerminal = useCallback(() => {
    // TODO: Implement actual terminal open logic
    console.log('Terminal open triggered');
  }, []);

  const handleOpenSettings = useCallback(() => {
    // TODO: Implement actual settings open logic
    console.log('Settings open triggered');
  }, []);

  return (
    <ToolbarContext.Provider
      value={{
        isRunning,
        isDebugging,
        isBuilding,
        selectedConfig,
        runConfigs,
        setIsRunning,
        setIsDebugging,
        setIsBuilding,
        setSelectedConfig,
        handleRun,
        handleDebug,
        handleStop,
        handleRestart,
        handleBuild,
        handleFormat,
        handleOpenTerminal,
        handleOpenSettings,
      }}
    >
      {children}
    </ToolbarContext.Provider>
  );
};

export const useToolbar = () => {
  const context = useContext(ToolbarContext);
  if (!context) {
    throw new Error('useToolbar must be used within ToolbarProvider');
  }
  return context;
};
