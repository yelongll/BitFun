/**
 * Model selector component.
 * Shows the active model and allows quick switching.
 *
 * Config linkage:
 * - Unified logic: all modes use ai.agent_models[mode_id]
 * - Supports 'auto' | 'primary' | 'fast' | specific model IDs
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Cpu, ChevronDown, Check, Sparkles, Cloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { configManager } from '@/infrastructure/config/services/ConfigManager';
import { agentAPI } from '@/infrastructure/api/service-api/AgentAPI';
import { ACPClientAPI, type AcpSessionOptions } from '@/infrastructure/api/service-api/ACPClientAPI';
import { getProviderDisplayName } from '@/infrastructure/config/services/modelConfigs';
import { getEffectiveReasoningMode, isReasoningVisiblyEnabled } from '@/infrastructure/config/utils/reasoning';
import { globalEventBus } from '@/infrastructure/event-bus';
import type { AIModelConfig, ModelCategory, ModelCapability } from '@/infrastructure/config/types';
import { Tooltip } from '@/component-library';
import { FlowChatStore } from '../store/FlowChatStore';
import { createLogger } from '@/shared/utils/logger';
import { getServerAIModels, isLoggedIn, type ServerAIModel } from '@/infrastructure/api/service-api/AuthAPI';
import { aiApi } from '@/infrastructure/api/service-api/AIApi';
import './ModelSelector.scss';

const log = createLogger('ModelSelector');

function resolveRequestUrl(baseUrl: string, provider: string, _modelName = ''): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('#')) {
    return trimmed.slice(0, -1).replace(/\/+$/, '');
  }
  if (provider === 'openai') {
    return trimmed.endsWith('chat/completions') ? trimmed : `${trimmed}/chat/completions`;
  }
  if (provider === 'response' || provider === 'responses') {
    return trimmed.endsWith('responses') ? trimmed : `${trimmed}/responses`;
  }
  if (provider === 'anthropic') {
    return trimmed.endsWith('v1/messages') ? trimmed : `${trimmed}/v1/messages`;
  }
  if (provider === 'gemini') {
    return trimmed;
  }
  return trimmed;
}

interface ModelSelectorProps {
  /** Current mode ID. */
  currentMode: string;
  /** Custom class name. */
  className?: string;
  /** Current session ID (used to update session mode config). */
  sessionId?: string;
  /** Current token count. */
  currentTokens?: number;
  /** Max token capacity. */
  maxTokens?: number;
}

interface ModelInfo {
  id: string;
  /** User-defined configuration name (AIModelConfig.name). */
  configName: string;
  /** Actual model identifier (AIModelConfig.model_name). */
  modelName: string;
  /** Custom display name shown in UI (optional, falls back to modelName). */
  displayName?: string;
  providerName: string;
  provider: string;
  contextWindow?: number;
  enableThinking?: boolean;
  reasoningEffort?: string;
  category?: ModelCategory;
  isServerModel?: boolean;
  requiresApiKey?: boolean;
  isNew?: boolean;
}

// Helper: identify special model IDs.
const isSpecialModel = (value: string): value is 'auto' | 'primary' | 'fast' => {
  return value === 'auto' || value === 'primary' || value === 'fast';
};

const formatContextWindow = (contextWindow?: number): string | null => {
  if (!contextWindow) return null;
  return `${Math.round(contextWindow / 1000)}k`;
};

const buildModelMetaText = (model: Pick<ModelInfo, 'providerName' | 'contextWindow'>): string => {
  const parts = [model.providerName];
  const contextWindow = formatContextWindow(model.contextWindow);

  if (contextWindow) {
    parts.push(contextWindow);
  }

  return parts.join(' · ');
};

const buildResolvedModelTooltipText = (
  modelName: string | undefined,
  model: Pick<ModelInfo, 'providerName' | 'contextWindow'> | null | undefined,
  fallback: string
): string => {
  if (!model) return fallback;

  const parts = [];
  if (modelName) {
    parts.push(modelName);
  }

  const metaText = buildModelMetaText(model);
  if (metaText) {
    parts.push(metaText);
  }

  return parts.join(' · ') || fallback;
};

const getModelDisplayLabel = (model: ModelInfo | null, fallback: string): string => {
  if (!model) return fallback;
  if (isSpecialModel(model.id)) return model.configName;
  return (model.isServerModel ? (model.displayName || model.modelName) : (model.modelName || model.displayName)) || model.configName || fallback;
};

const getModelTooltipText = (model: ModelInfo | null, fallback: string): string => {
  if (!model) return fallback;
  if (model.id === 'auto') return model.providerName;
  if (isSpecialModel(model.id)) {
    return buildResolvedModelTooltipText(model.modelName, model, fallback);
  }
  return buildModelMetaText(model);
};

const buildAutoModelInfo = (
  t: (key: string) => string,
): ModelInfo => ({
  id: 'auto',
  configName: t('modelSelector.autoModel'),
  modelName: t('modelSelector.autoModel'),
  providerName: t('modelSelector.autoModelDesc'),
  provider: 'auto',
});

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentMode,
  className = '',
  sessionId,
  currentTokens = 0,
  maxTokens = 0,
}) => {
  const { t } = useTranslation('flow-chat');
  const [allModels, setAllModels] = useState<AIModelConfig[]>([]);
  const [defaultModels, setDefaultModels] = useState<Record<string, string>>({});
  const [agentModels, setAgentModels] = useState<Record<string, string>>({}); // mode_id -> model_id
  const [acpOptions, setAcpOptions] = useState<AcpSessionOptions | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverModels, setServerModels] = useState<ServerAIModel[]>([]);
  const [modelSpeeds, setModelSpeeds] = useState<Record<string, number>>({});
  const [testingModels, setTestingModels] = useState<Set<string>>(new Set());

  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeSession = sessionId ? FlowChatStore.getInstance().getState().sessions.get(sessionId) : undefined;
  const acpClientId = activeSession?.config.agentType?.startsWith('acp:')
    ? activeSession.config.agentType.slice('acp:'.length)
    : null;
  const isAcpSession = Boolean(acpClientId && sessionId);

  // Load configuration data.
  const loadConfigData = useCallback(async () => {
    try {
      const [models, defaultModelsData, agentModelsData] = await Promise.all([
        configManager.getConfig<AIModelConfig[]>('ai.models') || [],
        configManager.getConfig<any>('ai.default_models') || {},
        configManager.getConfig<Record<string, string>>('ai.agent_models') || {}
      ]);

      setAllModels(models);
      setDefaultModels(defaultModelsData);
      setAgentModels(agentModelsData);

      log.debug('Configuration loaded', {
        modelsCount: models.length
      });
    } catch (error) {
      log.error('Failed to load configuration', error);
    }
  }, []);
  
  const loadServerModels = useCallback(async () => {
    if (!isLoggedIn()) {
      setServerModels([]);
      return;
    }
    
    try {
      const result = await getServerAIModels();
      const models = result.models || [];
      setServerModels(models);
      log.debug('Server models loaded', { count: models.length });
      
      const existingModels = await configManager.getConfig<AIModelConfig[]>('ai.models') || [];
      const serverModelIds = new Set(models.map(m => m.id));
      const updatedModels = existingModels.filter(m => {
        if (m.id && m.id.startsWith('server_')) {
          const serverId = parseInt(m.id.replace('server_', ''), 10);
          if (!serverModelIds.has(serverId)) {
            log.debug('Removing locally cached server model that no longer exists on server', { modelId: m.id, serverId });
            return false;
          }
        }
        return true;
      });
      
      if (updatedModels.length !== existingModels.length) {
        await configManager.setConfig('ai.models', updatedModels);
        log.debug('Cleaned up stale server models from local config', { 
          removed: existingModels.length - updatedModels.length 
        });
      }
    } catch (error) {
      log.debug('Failed to load server models', error);
      setServerModels([]);
    }
  }, []);
  
  useEffect(() => {
    loadConfigData();
    loadServerModels();
    
    const handleConfigUpdate = () => {
      log.debug('Configuration update detected, reloading');
      loadConfigData();
      loadServerModels();
    };
    
    globalEventBus.on('mode:config:updated', handleConfigUpdate);
    
    const unsubscribe = configManager.onConfigChange((path) => {
      if (path.startsWith('ai.')) {
        log.debug('AI configuration changed', { path });
        loadConfigData();
      }
    });
    
    return () => {
      globalEventBus.off('mode:config:updated', handleConfigUpdate);
      unsubscribe();
    };
  }, [loadConfigData, loadServerModels]);

  const loadAcpOptions = useCallback(async () => {
    if (!isAcpSession || !acpClientId || !sessionId) {
      setAcpOptions(null);
      return;
    }

    try {
      const options = await ACPClientAPI.getSessionOptions({
        sessionId,
        clientId: acpClientId,
        workspacePath: activeSession?.workspacePath || activeSession?.config.workspacePath,
        remoteConnectionId: activeSession?.remoteConnectionId,
        remoteSshHost: activeSession?.remoteSshHost,
      });
      setAcpOptions(options);
    } catch (error) {
      log.warn('Failed to load ACP session model options', { sessionId, acpClientId, error });
      setAcpOptions(null);
    }
  }, [
    activeSession?.config.workspacePath,
    activeSession?.remoteConnectionId,
    activeSession?.remoteSshHost,
    activeSession?.workspacePath,
    acpClientId,
    isAcpSession,
    sessionId,
  ]);

  useEffect(() => {
    loadAcpOptions();
  }, [loadAcpOptions]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const acpAvailableModels = useMemo((): ModelInfo[] => {
    if (!isAcpSession || !acpOptions) return [];
    return acpOptions.availableModels.map(model => ({
      id: model.id,
      configName: model.name,
      modelName: model.name,
      providerName: acpClientId ? `${acpClientId} ACP` : 'ACP',
      provider: 'acp',
    }));
  }, [acpClientId, acpOptions, isAcpSession]);

  const acpCurrentModel = useMemo((): ModelInfo | null => {
    if (!isAcpSession || !acpOptions?.currentModelId) return null;
    return acpAvailableModels.find(model => model.id === acpOptions.currentModelId) || {
      id: acpOptions.currentModelId,
      configName: acpOptions.currentModelId,
      modelName: acpOptions.currentModelId,
      providerName: acpClientId ? `${acpClientId} ACP` : 'ACP',
      provider: 'acp',
    };
  }, [acpAvailableModels, acpClientId, acpOptions?.currentModelId, isAcpSession]);
  
  const getCurrentModelId = useCallback((): string => {
    const configuredModelId = agentModels[currentMode] || 'auto';
    if (configuredModelId === 'auto') return 'auto';
    if (configuredModelId === 'primary' || configuredModelId === 'fast') {
      const actualModelId = defaultModels[configuredModelId];
      const model = allModels.find(m => m.id === actualModelId);
      return model ? configuredModelId : 'auto';
    }
    const model = allModels.find(m => m.id === configuredModelId);
    return model ? configuredModelId : 'auto';
  }, [allModels, currentMode, agentModels, defaultModels]);

  const currentModel = useMemo((): ModelInfo | null => {
    const modelId = getCurrentModelId();

    if (modelId === 'auto') {
      return buildAutoModelInfo(t);
    }

    if (isSpecialModel(modelId)) {
      const actualModelId = defaultModels[modelId];
      if (!actualModelId) return buildAutoModelInfo(t);

      const model = allModels.find(m => m.id === actualModelId);
      if (!model) return buildAutoModelInfo(t);

      return {
        id: modelId,
        configName: modelId === 'primary' ? t('modelSelector.primaryModel') : t('modelSelector.fastModel'),
        modelName: model.model_name,
        displayName: model.name,
        providerName: getProviderDisplayName(model),
        provider: model.provider,
        contextWindow: model.context_window,
        enableThinking: isReasoningVisiblyEnabled(getEffectiveReasoningMode(model)),
        reasoningEffort: model.reasoning_effort,
        category: model.category,
      };
    }

    const model = allModels.find(m => m.id === modelId);
    if (!model) return buildAutoModelInfo(t);

    if (modelId.startsWith('server_')) {
      const serverModelDbId = parseInt(modelId.replace('server_', ''), 10);
      const serverModel = serverModels.find(m => m.id === serverModelDbId);
      if (serverModel) {
        return {
          id: model.id || '',
          configName: serverModel.name,
          modelName: serverModel.model_name,
          displayName: serverModel.name,
          providerName: serverModel.provider,
          provider: serverModel.provider,
          contextWindow: serverModel.context_window,
          enableThinking: serverModel.reasoning_mode === 'enabled' || serverModel.reasoning_mode === 'adaptive',
          reasoningEffort: serverModel.reasoning_effort || undefined,
          category: (serverModel.category as ModelCategory) || model.category,
          isServerModel: true,
        };
      }
    }

    return {
      id: model.id || '',
      configName: model.name,
      modelName: model.model_name,
      displayName: model.name,
      providerName: getProviderDisplayName(model),
      provider: model.provider,
      contextWindow: model.context_window,
      enableThinking: isReasoningVisiblyEnabled(getEffectiveReasoningMode(model)),
      reasoningEffort: model.reasoning_effort,
      category: model.category,
    };
  }, [getCurrentModelId, allModels, defaultModels, serverModels, t]);
  
  const availableModels = useMemo((): ModelInfo[] => {
    const serverModelKeys = new Set(
      serverModels
        .filter(m => m.enabled && m.capabilities?.includes('text_chat'))
        .map(m => `${m.provider?.toLowerCase().trim()}:${m.model_name?.toLowerCase().trim()}`)
        .filter(Boolean)
    );
    
    const localModels = allModels
      .filter(m => {
        if (!m.enabled) return false;
        if (m.id?.startsWith('server_')) return false;
        const capabilities = Array.isArray(m.capabilities) ? m.capabilities : [];
        if (!capabilities.includes('text_chat')) return false;
        const modelKey = `${m.provider?.toLowerCase().trim()}:${m.model_name?.toLowerCase().trim()}`;
        if (serverModelKeys.has(modelKey)) return false;
        return true;
      })
      .map(m => ({
        id: m.id || '',
        configName: m.name,
        modelName: m.model_name,
        displayName: m.name,
        providerName: getProviderDisplayName(m),
        provider: m.provider,
        contextWindow: m.context_window,
        enableThinking: isReasoningVisiblyEnabled(getEffectiveReasoningMode(m)),
        reasoningEffort: m.reasoning_effort,
        category: m.category,
        isServerModel: false,
      }));
    
    const localModelKeys = new Set(
      localModels.map(m => `${m.provider?.toLowerCase().trim()}:${m.modelName?.toLowerCase().trim()}`)
    );
    
    const serverModelInfos: ModelInfo[] = serverModels
      .filter(m => {
        if (!m.enabled) {
          log.debug('Server model filtered out: not enabled', { id: m.id, name: m.name });
          return false;
        }
        const caps: string[] | string | undefined = m.capabilities as string[] | string | undefined;
        const hasTextChat = Array.isArray(caps) ? caps.includes('text_chat') : typeof caps === 'string' && caps.includes('text_chat');
        if (!hasTextChat) {
          log.debug('Server model filtered out: no text_chat capability', { id: m.id, name: m.name, capabilities: m.capabilities });
          return false;
        }
        const modelKey = `${m.provider?.toLowerCase().trim()}:${m.model_name?.toLowerCase().trim()}`;
        const isDuplicate = localModelKeys.has(modelKey);
        if (isDuplicate) {
          log.debug('Server model filtered out: duplicate provider+model_name', { id: m.id, name: m.name, provider: m.provider, model_name: m.model_name });
          return false;
        }
        return true;
      })
      .map(m => ({
        id: `server:${m.id}`,
        configName: m.name,
        modelName: m.model_name,
        displayName: m.name,
        providerName: m.provider,
        provider: m.provider,
        contextWindow: m.context_window,
        enableThinking: m.reasoning_mode === 'enabled' || m.reasoning_mode === 'adaptive',
        reasoningEffort: m.reasoning_effort || undefined,
        category: m.category as ModelCategory,
        isServerModel: true,
        requiresApiKey: m.requires_api_key !== false,
        isNew: m.is_new === true,
      }));
    
    const result = [...localModels, ...serverModelInfos];
    return result;
  }, [allModels, serverModels]);
  
  const handleSelectModel = useCallback(async (modelId: string) => {
    if (loading) return;

    setLoading(true);
    try {
      if (isAcpSession && acpClientId && sessionId) {
        const options = await ACPClientAPI.setSessionModel({
          sessionId,
          clientId: acpClientId,
          workspacePath: activeSession?.workspacePath || activeSession?.config.workspacePath,
          remoteConnectionId: activeSession?.remoteConnectionId,
          remoteSshHost: activeSession?.remoteSshHost,
          modelId,
        });
        setAcpOptions(options);
        FlowChatStore.getInstance().updateSessionModelName(sessionId, modelId);
        setDropdownOpen(false);
        return;
      }

      let finalModelId = modelId;

      if (modelId.startsWith('server:')) {
        const serverModelId = parseInt(modelId.replace('server:', ''), 10);
        const serverModel = serverModels.find(m => m.id === serverModelId);
        
        if (serverModel) {
          const existingModels = await configManager.getConfig<AIModelConfig[]>('ai.models') || [];
          
          const existingByModelName = existingModels.find(m =>
            m.enabled && m.model_name?.toLowerCase().trim() === serverModel.model_name?.toLowerCase().trim()
          );
          
          const localModelId = `server_${serverModel.id}`;
          const apiFormat = serverModel.api_format || 'openai';
          
          const updatedModels = existingModels.filter(m => m.id !== localModelId);
          
          const newLocalModel: AIModelConfig = {
            id: localModelId,
            name: serverModel.name,
            model_name: serverModel.model_name,
            provider: apiFormat,
            base_url: serverModel.base_url || '',
            request_url: resolveRequestUrl(serverModel.base_url || '', apiFormat, serverModel.model_name),
            api_key: serverModel.api_key || '',
            context_window: serverModel.context_window,
            max_tokens: serverModel.max_tokens,
            enabled: true,
            category: (serverModel.category as ModelCategory) || 'general_chat',
            capabilities: (serverModel.capabilities as ModelCapability[]) || ['text_chat'],
            auth: { type: 'api_key' },
            reasoning_mode: serverModel.reasoning_mode === 'enabled' ? 'enabled' : 
                            serverModel.reasoning_mode === 'adaptive' ? 'adaptive' : undefined,
            reasoning_effort: serverModel.reasoning_effort || undefined,
            inline_think_in_text: true,
            metadata: { provider_display_name: serverModel.provider },
          };
          
          updatedModels.push(newLocalModel);
          await configManager.setConfig('ai.models', updatedModels);
          
          finalModelId = localModelId;
        }
      }

      const currentAgentModels = await configManager.getConfig<Record<string, string>>('ai.agent_models') || {};

      const updatedAgentModels = {
        ...currentAgentModels,
        [currentMode]: finalModelId,
      };

      await configManager.setConfig('ai.agent_models', updatedAgentModels);
      setAgentModels(updatedAgentModels);

      if (sessionId) {
        const store = FlowChatStore.getInstance();
        store.updateSessionModelName(sessionId, finalModelId);
        const session = store.getState().sessions.get(sessionId);
        if (!session?.isTransient) {
          await agentAPI.updateSessionModel({
            sessionId,
            modelName: finalModelId,
          });
        }
      }

      log.info('Mode model updated', { mode: currentMode, modelId: finalModelId });

      globalEventBus.emit('mode:config:updated');

      setDropdownOpen(false);
    } catch (error) {
      log.error('Failed to switch model', error);
    } finally {
      setLoading(false);
    }
  }, [
    activeSession?.config.workspacePath,
    activeSession?.remoteConnectionId,
    activeSession?.remoteSshHost,
    activeSession?.workspacePath,
    acpClientId,
    currentMode,
    isAcpSession,
    loading,
    sessionId,
    serverModels,
  ]);
  
  const testAllModelsSpeed = useCallback(async () => {
    const allModelIds = new Set<string>();
    allModels.forEach(m => { if (m.id && m.enabled) allModelIds.add(m.id); });
    serverModels.forEach(m => { if (m.enabled) allModelIds.add(`server:${m.id}`); });
    
    setModelSpeeds({});
    setTestingModels(allModelIds);
    
    const testPromises: Promise<void>[] = [];
    
    for (const model of allModels) {
      if (!model.id || !model.enabled) continue;
      
      const testPromise = async () => {
        try {
          const result = await aiApi.testAIConfigConnection(model);
          if (result.success && result.response_time_ms) {
            setModelSpeeds(prev => ({
              ...prev,
              [model.id!]: result.response_time_ms
            }));
          }
        } catch (error) {
          log.debug('Speed test failed', { modelId: model.id, error });
        } finally {
          setTestingModels(prev => {
            const next = new Set(prev);
            next.delete(model.id!);
            return next;
          });
        }
      };
      
      testPromises.push(testPromise());
    }
    
    for (const serverModel of serverModels) {
      if (!serverModel.enabled) continue;
      
      const modelId = `server:${serverModel.id}`;
      const apiFormat = serverModel.api_format || 'openai';
      const testConfig: AIModelConfig = {
        id: modelId,
        name: serverModel.name,
        model_name: serverModel.model_name,
        provider: apiFormat,
        base_url: serverModel.base_url || '',
        request_url: resolveRequestUrl(serverModel.base_url || '', apiFormat, serverModel.model_name),
        api_key: serverModel.api_key || '',
        context_window: serverModel.context_window,
        max_tokens: serverModel.max_tokens,
        enabled: true,
        category: (serverModel.category as ModelCategory) || 'general_chat',
        capabilities: (serverModel.capabilities as ModelCapability[]) || ['text_chat'],
      };
      
      const testPromise = async () => {
        try {
          const result = await aiApi.testAIConfigConnection(testConfig);
          if (result.success && result.response_time_ms) {
            setModelSpeeds(prev => ({
              ...prev,
              [modelId]: result.response_time_ms
            }));
          }
        } catch (error) {
          log.debug('Speed test failed', { modelId, error });
        } finally {
          setTestingModels(prev => {
            const next = new Set(prev);
            next.delete(modelId);
            return next;
          });
        }
      };
      
      testPromises.push(testPromise());
    }
    
    await Promise.all(testPromises);
  }, [allModels, serverModels]);
  
  const getSpeedLabel = useCallback((responseTimeMs: number): string => {
    if (responseTimeMs < 1000) return '极快';
    if (responseTimeMs < 2000) return '快';
    if (responseTimeMs < 4000) return '中等';
    return '慢';
  }, []);
  
  const getSpeedColor = useCallback((responseTimeMs: number): string => {
    if (responseTimeMs < 1000) return '#22c55e';
    if (responseTimeMs < 2000) return '#84cc16';
    if (responseTimeMs < 4000) return '#eab308';
    return '#ef4444';
  }, []);
  
  const tokenPercentage = useMemo(() => {
    if (!maxTokens || maxTokens <= 0 || !currentTokens) return 0;
    return Math.min(Math.round((currentTokens / maxTokens) * 100), 100);
  }, [currentTokens, maxTokens]);

  const tokenStatusClass = useMemo(() => {
    if (tokenPercentage >= 90) return 'critical';
    if (tokenPercentage >= 70) return 'warning';
    return '';
  }, [tokenPercentage]);

  const formatTokenCount = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`;

  if (isAcpSession) {
    if (acpAvailableModels.length === 0) {
      return null;
    }

    const currentAcpModelId = acpOptions?.currentModelId || acpAvailableModels[0]?.id || '';
    const acpTooltip = getModelTooltipText(acpCurrentModel, acpClientId ? `${acpClientId} ACP` : 'ACP');

    return (
      <div
        ref={dropdownRef}
        className={`bitfun-model-selector ${className}`}
      >
        <Tooltip content={acpTooltip}>
          <button
            className={`bitfun-model-selector__trigger ${dropdownOpen ? 'bitfun-model-selector__trigger--open' : ''}`}
            onClick={() => {
              const nextOpen = !dropdownOpen;
              setDropdownOpen(nextOpen);
              if (nextOpen) {
                loadAcpOptions();
                loadServerModels();
              }
            }}
            disabled={loading}
          >
            <Cpu size={10} className="bitfun-model-selector__icon" />
            <span className="bitfun-model-selector__name">
              {getModelDisplayLabel(acpCurrentModel, currentAcpModelId)}
            </span>
            <ChevronDown size={10} className="bitfun-model-selector__chevron" />
          </button>
        </Tooltip>

        {dropdownOpen && (
          <div className="bitfun-model-selector__dropdown">
            <div className="bitfun-model-selector__dropdown-header">
              <span>ACP model</span>
              <span className="bitfun-model-selector__dropdown-hint">
                {acpClientId}
              </span>
            </div>

            <div className="bitfun-model-selector__list">
              {acpAvailableModels.map(model => {
                const isSelected = currentAcpModelId === model.id;

                return (
                  <Tooltip key={model.id} content={model.id} placement="right">
                    <div
                      className={`bitfun-model-selector__option ${isSelected ? 'bitfun-model-selector__option--selected' : ''}`}
                      onClick={() => handleSelectModel(model.id)}
                    >
                      <div className="bitfun-model-selector__option-main">
                        <span className="bitfun-model-selector__option-name">
                          {model.modelName}
                        </span>
                      </div>
                      {isSelected && (
                        <Check size={14} className="bitfun-model-selector__option-check" />
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (availableModels.length === 0) {
    return null;
  }

  const currentModelId = getCurrentModelId();

  const fallbackTooltip = t('modelSelector.autoModelDesc');
  const baseTooltip = getModelTooltipText(currentModel, fallbackTooltip);
  const tooltipContent =
    currentTokens > 0 && maxTokens > 0
      ? `${baseTooltip} · ${formatTokenCount(currentTokens)}/${formatTokenCount(maxTokens)} (${tokenPercentage}%)`
      : baseTooltip;

  return (
    <div
      ref={dropdownRef}
      className={`bitfun-model-selector ${className}`}
    >
      <Tooltip content={tooltipContent}>
        <button
          className={`bitfun-model-selector__trigger ${dropdownOpen ? 'bitfun-model-selector__trigger--open' : ''}`}
          onClick={() => {
            if (!dropdownOpen) {
              loadServerModels();
              testAllModelsSpeed();
            }
            setDropdownOpen(!dropdownOpen);
          }}
          disabled={loading}
        >
          <Cpu size={10} className="bitfun-model-selector__icon" />
          <span className="bitfun-model-selector__name">
            {getModelDisplayLabel(currentModel, t('modelSelector.autoModel'))}
          </span>
          {currentModel?.enableThinking && (
            <Sparkles size={9} className="bitfun-model-selector__thinking-icon" />
          )}
          {currentModel?.reasoningEffort && (
            <span className="bitfun-model-selector__effort-badge">
              {currentModel.reasoningEffort}
            </span>
          )}
          {tokenPercentage > 0 && (
            <span className={`bitfun-model-selector__ctx-usage${tokenStatusClass ? ` bitfun-model-selector__ctx-usage--${tokenStatusClass}` : ''}`}>
              · {tokenPercentage}%
            </span>
          )}
          <ChevronDown size={10} className="bitfun-model-selector__chevron" />
        </button>
      </Tooltip>

      {dropdownOpen && (
        <div className="bitfun-model-selector__dropdown">
          <div className="bitfun-model-selector__dropdown-header">
            <span>{t('modelSelector.modelSelection')}</span>
            <span className="bitfun-model-selector__dropdown-hint">
              {t('modelSelector.currentMode')}: {currentMode}
            </span>
          </div>

          <Tooltip content={t('modelSelector.autoModelDesc')} placement="right">
            <div
              className={`bitfun-model-selector__option bitfun-model-selector__option--special ${currentModelId === 'auto' ? 'bitfun-model-selector__option--selected' : ''}`}
              onClick={() => handleSelectModel('auto')}
            >
              <div className="bitfun-model-selector__option-main">
                <span className="bitfun-model-selector__option-name">{t('modelSelector.autoModel')}</span>
              </div>
              {currentModelId === 'auto' && (
                <Check size={14} className="bitfun-model-selector__option-check" />
              )}
            </div>
          </Tooltip>

          {(() => {
            const primaryModel = allModels.find(m => m.id === defaultModels.primary);
            const primaryTooltip = primaryModel
              ? buildResolvedModelTooltipText(primaryModel.model_name, {
                providerName: getProviderDisplayName(primaryModel),
                contextWindow: primaryModel.context_window
              }, t('modelSelector.autoModelDesc'))
              : t('modelSelector.autoModelDesc');
            return (
              <Tooltip content={primaryTooltip} placement="right">
                <div
                  className={`bitfun-model-selector__option bitfun-model-selector__option--special ${currentModelId === 'primary' ? 'bitfun-model-selector__option--selected' : ''}`}
                  onClick={() => handleSelectModel('primary')}
                >
                  <div className="bitfun-model-selector__option-main">
                    <span className="bitfun-model-selector__option-name">{t('modelSelector.primaryModel')}</span>
                  </div>
                  {currentModelId === 'primary' && (
                    <Check size={14} className="bitfun-model-selector__option-check" />
                  )}
                </div>
              </Tooltip>
            );
          })()}

          {(() => {
            const fastModel = allModels.find(m => m.id === defaultModels.fast);
            const fastTooltip = fastModel
              ? buildResolvedModelTooltipText(fastModel.model_name, {
                providerName: getProviderDisplayName(fastModel),
                contextWindow: fastModel.context_window
              }, t('modelSelector.autoModelDesc'))
              : t('modelSelector.autoModelDesc');
            return (
              <Tooltip content={fastTooltip} placement="right">
                <div
                  className={`bitfun-model-selector__option bitfun-model-selector__option--special ${currentModelId === 'fast' ? 'bitfun-model-selector__option--selected' : ''}`}
                  onClick={() => handleSelectModel('fast')}
                >
                  <div className="bitfun-model-selector__option-main">
                    <span className="bitfun-model-selector__option-name">{t('modelSelector.fastModel')}</span>
                  </div>
                  {currentModelId === 'fast' && (
                    <Check size={14} className="bitfun-model-selector__option-check" />
                  )}
                </div>
              </Tooltip>
            );
          })()}

          <div className="bitfun-model-selector__divider" />

          <div className="bitfun-model-selector__list">
            {(() => {
              const modelsByProvider = availableModels.reduce((acc, model) => {
                const providerName = model.providerName || 'Other';
                if (!acc[providerName]) {
                  acc[providerName] = [];
                }
                acc[providerName].push(model);
                return acc;
              }, {} as Record<string, ModelInfo[]>);

              const providerOrder = Object.keys(modelsByProvider).sort((a, b) => a.localeCompare(b));

              return providerOrder.map(providerName => (
                <div key={providerName} className="bitfun-model-selector__category-group">
                  <div className="bitfun-model-selector__category-label">
                    {providerName} {t('modelSelector.providerSuffix')}
                  </div>
                  {modelsByProvider[providerName].map(model => {
                    let isSelected = currentModelId === model.id;
                    if (!isSelected && currentModelId.startsWith('server_') && model.id.startsWith('server:')) {
                      const serverDbId = currentModelId.replace('server_', '');
                      isSelected = model.id === `server:${serverDbId}`;
                    }
                    const displayLabel = model.isServerModel ? (model.displayName || model.modelName) : (model.modelName || model.displayName);
                    const speed = modelSpeeds[model.id];
                    const isTesting = testingModels.has(model.id);

                    return (
                      <Tooltip key={model.id} content={buildModelMetaText(model)} placement="right">
                        <div
                          className={`bitfun-model-selector__option ${isSelected ? 'bitfun-model-selector__option--selected' : ''}`}
                          onClick={() => handleSelectModel(model.id)}
                        >
                          <div className="bitfun-model-selector__option-main">
                            <span className="bitfun-model-selector__option-name">
                              {displayLabel}
                              {model.isNew && (
                                <span className="bitfun-model-selector__option-new-badge" title="新模型">●</span>
                              )}
                              {model.isServerModel && (
                                <Cloud size={10} className="bitfun-model-selector__option-cloud" />
                              )}
                              {model.enableThinking && (
                                <Sparkles size={10} className="bitfun-model-selector__option-thinking" />
                              )}
                            </span>
                          </div>
                          {isTesting ? (
                            <span className="bitfun-model-selector__option-speed bitfun-model-selector__option-speed--testing">
                              <span className="bitfun-model-selector__speed-dot"></span>
                              <span className="bitfun-model-selector__speed-dot"></span>
                              <span className="bitfun-model-selector__speed-dot"></span>
                            </span>
                          ) : speed ? (
                            <span 
                              className="bitfun-model-selector__option-speed" 
                              style={{ color: getSpeedColor(speed) }}
                            >
                              {getSpeedLabel(speed)} {speed}ms
                            </span>
                          ) : null}
                          {isSelected && (
                            <Check size={14} className="bitfun-model-selector__option-check" />
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
export default ModelSelector;
