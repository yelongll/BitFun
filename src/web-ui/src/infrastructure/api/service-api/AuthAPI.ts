import { createLogger } from '@/shared/utils/logger';

const log = createLogger('AuthAPI');

export interface AuthConfig {
  serverUrl: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatar_url: string;
  status: number;
  role: string;
  points: number;
  total_earned_points: number;
  email_verified: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  user: UserInfo;
  tokens: TokenPair;
}

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  device_type: string;
  platform: string;
  app_version: string;
  ip_address: string;
  last_active_at: string;
  created_at: string;
}

let authConfig: AuthConfig = {
  serverUrl: '',
};

let tokenStore: TokenPair | null = null;

export function configureAuth(config: AuthConfig): void {
  authConfig = config;
  const stored = localStorage.getItem('kongling_auth_tokens');
  if (stored) {
    try {
      tokenStore = JSON.parse(stored);
    } catch {
      localStorage.removeItem('kongling_auth_tokens');
    }
  }
}

export function getAccessToken(): string | null {
  return tokenStore?.access_token ?? null;
}

export function getRefreshToken(): string | null {
  return tokenStore?.refresh_token ?? null;
}

export function isLoggedIn(): boolean {
  return tokenStore !== null && !!tokenStore.access_token;
}

export function clearAuth(): void {
  tokenStore = null;
  localStorage.removeItem('kongling_auth_tokens');
  localStorage.removeItem('kongling_auth_user');
}

function saveTokens(tokens: TokenPair): void {
  tokenStore = tokens;
  localStorage.setItem('kongling_auth_tokens', JSON.stringify(tokens));
}

function saveUser(user: UserInfo): void {
  localStorage.setItem('kongling_auth_user', JSON.stringify(user));
}

export function getStoredUser(): UserInfo | null {
  const stored = localStorage.getItem('kongling_auth_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function getDeviceHeaders(): Record<string, string> {
  const deviceId = getDeviceId();
  return {
    'X-Device-Id': deviceId,
    'X-Device-Name': navigator.userAgent.includes('Windows') ? 'Windows Desktop'
      : navigator.userAgent.includes('Mac') ? 'macOS Desktop'
      : navigator.userAgent.includes('Linux') ? 'Linux Desktop'
      : 'Unknown',
    'X-Platform': navigator.platform || 'unknown',
    'X-App-Version': '0.2.5',
  };
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem('kongling_device_id');
  if (!deviceId) {
    deviceId = 'desktop-' + crypto.randomUUID();
    localStorage.setItem('kongling_device_id', deviceId);
  }
  return deviceId;
}

async function request<T = any>(
  method: string,
  path: string,
  data?: any,
  requireAuth = false
): Promise<T> {
  const url = `${authConfig.serverUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getDeviceHeaders(),
  };

  if (requireAuth && tokenStore?.access_token) {
    headers['Authorization'] = `Bearer ${tokenStore.access_token}`;
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (data && method !== 'GET') {
    init.body = JSON.stringify(data);
  }

  let response = await fetch(url, init);

  if (response.status === 401 && requireAuth && tokenStore?.refresh_token) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${tokenStore.access_token}`;
      response = await fetch(url, { ...init, headers });
    } else {
      clearAuth();
      throw new Error('登录已过期，请重新登录');
    }
  }

  const result = await response.json();

  if (!result.success) {
    const errMsg = result.error?.message || '请求失败';
    const errCode = result.error?.code || 0;
    const error = new Error(errMsg) as any;
    error.code = errCode;
    error.status = response.status;
    throw error;
  }

  return result.data as T;
}

export async function register(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<LoginResponse> {
  const result = await request<LoginResponse>('POST', '/api/v1/auth/register', {
    username,
    email,
    password,
    confirm_password: confirmPassword,
  });

  saveTokens(result.tokens);
  saveUser(result.user);
  return result;
}

export async function login(
  login: string,
  password: string
): Promise<LoginResponse> {
  const result = await request<LoginResponse>('POST', '/api/v1/auth/login', {
    login,
    password,
  });

  saveTokens(result.tokens);
  saveUser(result.user);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await request('POST', '/api/v1/auth/logout', undefined, true);
  } catch (e) {
    log.error('Logout request failed', e);
  } finally {
    clearAuth();
  }
}

async function refreshToken(): Promise<boolean> {
  if (!tokenStore?.refresh_token) return false;

  try {
    const result = await request<{ tokens: TokenPair }>('POST', '/api/v1/auth/refresh', {
      refresh_token: tokenStore.refresh_token,
    });

    saveTokens(result.tokens);
    return true;
  } catch {
    return false;
  }
}

export async function getMe(): Promise<UserInfo> {
  const result = await request<{ user: UserInfo }>('GET', '/api/v1/auth/me', undefined, true);
  saveUser(result.user);
  return result.user;
}

export async function updateProfile(data: {
  nickname?: string;
  avatar_url?: string;
}): Promise<UserInfo> {
  const result = await request<{ user: UserInfo }>('PUT', '/api/v1/auth/profile', data, true);
  saveUser(result.user);
  return result.user;
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  await request('PUT', '/api/v1/auth/password', {
    old_password: oldPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  }, true);
}

export async function getDevices(): Promise<DeviceInfo[]> {
  const result = await request<{ devices: DeviceInfo[] }>('GET', '/api/v1/auth/devices', undefined, true);
  return result.devices;
}

export async function removeDevice(deviceId: string): Promise<void> {
  await request('POST', '/api/v1/auth/devices/remove', {
    device_id: deviceId,
  }, true);
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const result = await request<{ status: string }>('GET', '/api/v1/health');
    return result.status === 'healthy';
  } catch {
    return false;
  }
}

export interface PointsBalance {
  points: number;
  total_earned: number;
}

export interface PointRecord {
  id: number;
  user_id: number;
  points: number;
  balance: number;
  type: string;
  description: string;
  related_id: string;
  created_at: string;
}

export interface RankingUser {
  id: number;
  username: string;
  nickname: string;
  avatar_url: string;
  points: number;
  total_earned_points: number;
  rank: number;
}

export async function getPointsBalance(): Promise<PointsBalance> {
  return request<PointsBalance>('GET', '/api/v1/points/balance', undefined, true);
}

export async function getPointsRecords(page = 1, pageSize = 20, type?: string): Promise<{
  records: PointRecord[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (type) params.append('type', type);
  return request('GET', `/api/v1/points/records?${params}`, undefined, true);
}

export async function getPointsRanking(page = 1, pageSize = 50, type = 'current'): Promise<{
  ranking: RankingUser[];
  my_rank: number | null;
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), type });
  return request('GET', `/api/v1/points/ranking?${params}`, undefined, true);
}

export async function addBuildReward(buildId?: string, description?: string): Promise<{
  awarded: boolean;
  message: string;
  points: number;
  balance: number;
}> {
  return request('POST', '/api/v1/points/build', { build_id: buildId, description }, true);
}

export async function addDailyLoginReward(): Promise<{
  awarded: boolean;
  message: string;
  points: number;
  balance: number;
}> {
  return request('POST', '/api/v1/points/daily-login', undefined, true);
}

export async function deductPoints(points: number, description: string, relatedId?: string): Promise<{
  message: string;
  points: number;
  balance: number;
}> {
  return request('POST', '/api/v1/points/deduct', { points, description, related_id: relatedId }, true);
}

export interface ExampleItem {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  author: string;
  tags: string[];
  stars: number;
  downloads: number;
  created_at: string;
}

export interface ExampleDetail extends ExampleItem {
  file_content: string;
  file_path: string;
  file_size: number;
}

export async function getExamples(params?: {
  page?: number;
  page_size?: number;
  category?: string;
  difficulty?: string;
  search?: string;
  author_type?: 'official' | 'user';
}): Promise<{
  examples: ExampleItem[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.page_size) searchParams.append('page_size', String(params.page_size));
  if (params?.category) searchParams.append('category', params.category);
  if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.author_type) searchParams.append('author_type', params.author_type);
  return request('GET', `/api/v1/examples?${searchParams}`, undefined, false);
}

export async function getExampleCategories(): Promise<{
  categories: { category: string; name: string; count: number }[];
}> {
  return request('GET', '/api/v1/examples/categories', undefined, false);
}

export async function getExampleDetail(id: number): Promise<{ example: ExampleDetail }> {
  return request('GET', `/api/v1/examples/${id}`, undefined, false);
}

export async function downloadExample(id: number): Promise<{
  file_name: string;
  content: string;
  download_url: string;
  file_size?: number;
  is_binary?: boolean;
}> {
  return request('POST', `/api/v1/examples/${id}/download`, undefined, true);
}

export function downloadExampleWithProgress(
  id: number,
  onProgress: (percent: number) => void
): Promise<{
  file_name: string;
  content: string;
  download_url: string;
  file_size?: number;
  is_binary?: boolean;
}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${authConfig.serverUrl}/api/v1/examples/${id}/download`;

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';

    const deviceHeaders = getDeviceHeaders();
    Object.entries(deviceHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    if (tokenStore?.access_token) {
      xhr.setRequestHeader('Authorization', `Bearer ${tokenStore.access_token}`);
    }

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 30));
      }
    });

    xhr.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(30 + Math.round((e.loaded / e.total) * 70));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 401 && tokenStore?.refresh_token) {
        refreshToken().then((refreshed) => {
          if (refreshed) {
            downloadExampleWithProgress(id, onProgress).then(resolve).catch(reject);
          } else {
            clearAuth();
            reject(new Error('登录已过期，请重新登录'));
          }
        });
        return;
      }

      try {
        const result = typeof xhr.response === 'string' ? JSON.parse(xhr.response) : xhr.response;
        if (!result.success) {
          const errMsg = result.error?.message || '请求失败';
          reject(new Error(errMsg));
          return;
        }
        onProgress(100);
        resolve(result.data);
      } catch (err) {
        reject(err);
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('网络请求失败'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('下载已取消'));
    });

    xhr.send();
  });
}

export async function starExample(id: number): Promise<{
  starred: boolean;
  message: string;
}> {
  return request('POST', `/api/v1/examples/${id}/star`, undefined, true);
}

export async function getMyExamples(params?: {
  page?: number;
  page_size?: number;
}): Promise<{
  examples: ExampleItem[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.page_size) searchParams.append('page_size', String(params.page_size));
  return request('GET', `/api/v1/examples/my?${searchParams}`, undefined, true);
}

export async function uploadExample(data: {
  name: string;
  description?: string;
  category: string;
  difficulty?: string;
  tags?: string;
  file_content: string;
  file_path?: string;
}): Promise<{ id: number }> {
  return request('POST', '/api/v1/examples/upload', data, true);
}

export async function uploadExampleFile(
  file: File,
  metadata: {
    name: string;
    description?: string;
    category: string;
    difficulty?: string;
    tags?: string;
  }
): Promise<{ id: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', metadata.name);
  if (metadata.description) formData.append('description', metadata.description);
  formData.append('category', metadata.category);
  if (metadata.difficulty) formData.append('difficulty', metadata.difficulty);
  if (metadata.tags) formData.append('tags', metadata.tags);

  const url = `${authConfig.serverUrl}/api/v1/examples/upload-file`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenStore?.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

export async function updateExample(id: number, data: {
  name?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  tags?: string;
  file_content?: string;
  file_path?: string;
  status?: number;
}): Promise<void> {
  return request('PUT', `/api/v1/examples/${id}`, data, true);
}

export async function deleteExample(id: number): Promise<void> {
  return request('DELETE', `/api/v1/examples/${id}`, undefined, true);
}

export interface LibraryItem {
  id: number;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  tags: string[];
  stars: number;
  downloads: number;
  file_path: string;
  file_content: string;
  file_size: number;
  status: number;
  sort_order: number;
  is_official: number;
  user_id: number | null;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
}

export async function getLibraries(params?: {
  page?: number;
  page_size?: number;
  category?: string;
  search?: string;
  is_official?: number;
}): Promise<{
  libraries: LibraryItem[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.page_size) searchParams.append('page_size', String(params.page_size));
  if (params?.category) searchParams.append('category', params.category);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.is_official !== undefined) searchParams.append('is_official', String(params.is_official));
  return request('GET', `/api/v1/libraries?${searchParams}`);
}

export async function getLibraryCategories(): Promise<{
  categories: { key: string; name: string }[];
}> {
  return request('GET', '/api/v1/libraries/categories');
}

export async function getLibraryDetail(id: number): Promise<{ library: LibraryItem }> {
  return request('GET', `/api/v1/libraries/${id}`);
}

export async function downloadLibrary(id: number): Promise<{
  file_name: string;
  content: string;
  download_url: string;
  file_size?: number;
  is_binary?: boolean;
}> {
  return request('POST', `/api/v1/libraries/${id}/download`, undefined, true);
}

export function downloadLibraryWithProgress(
  id: number,
  onProgress: (percent: number) => void
): Promise<{
  file_name: string;
  content: string;
  download_url: string;
  file_size?: number;
  is_binary?: boolean;
}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${authConfig.serverUrl}/api/v1/libraries/${id}/download`;

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';

    const deviceHeaders = getDeviceHeaders();
    Object.entries(deviceHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    if (tokenStore?.access_token) {
      xhr.setRequestHeader('Authorization', `Bearer ${tokenStore.access_token}`);
    }

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 30));
      }
    });

    xhr.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(30 + Math.round((e.loaded / e.total) * 70));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 401 && tokenStore?.refresh_token) {
        refreshToken().then((refreshed) => {
          if (refreshed) {
            downloadLibraryWithProgress(id, onProgress).then(resolve).catch(reject);
          } else {
            clearAuth();
            reject(new Error('登录已过期，请重新登录'));
          }
        });
        return;
      }

      try {
        const result = typeof xhr.response === 'string' ? JSON.parse(xhr.response) : xhr.response;
        if (!result.success) {
          const errMsg = result.error?.message || '请求失败';
          reject(new Error(errMsg));
          return;
        }
        onProgress(100);
        resolve(result.data);
      } catch (err) {
        reject(err);
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('网络请求失败'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('下载已取消'));
    });

    xhr.send();
  });
}

export async function starLibrary(id: number): Promise<{
  starred: boolean;
  message: string;
}> {
  return request('POST', `/api/v1/libraries/${id}/star`, undefined, true);
}

export async function getMyLibraries(params?: {
  page?: number;
  page_size?: number;
}): Promise<{
  libraries: LibraryItem[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.page_size) searchParams.append('page_size', String(params.page_size));
  return request('GET', `/api/v1/libraries/my?${searchParams}`, undefined, true);
}

export async function uploadLibrary(data: {
  name: string;
  description?: string;
  category: string;
  version?: string;
  tags?: string;
  file_content: string;
  file_path?: string;
}): Promise<{ id: number }> {
  return request('POST', '/api/v1/libraries/upload', data, true);
}

export async function uploadLibraryFile(
  file: File,
  metadata: {
    name: string;
    description?: string;
    category: string;
    version?: string;
    tags?: string;
  }
): Promise<{ id: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', metadata.name);
  if (metadata.description) formData.append('description', metadata.description);
  formData.append('category', metadata.category);
  if (metadata.version) formData.append('version', metadata.version);
  if (metadata.tags) formData.append('tags', metadata.tags);

  const url = `${authConfig.serverUrl}/api/v1/libraries/upload-file`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenStore?.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

export async function updateLibrary(id: number, data: {
  name?: string;
  description?: string;
  category?: string;
  version?: string;
  tags?: string;
  file_content?: string;
  file_path?: string;
  status?: number;
}): Promise<void> {
  return request('PUT', `/api/v1/libraries/${id}`, data, true);
}

export async function deleteLibrary(id: number): Promise<void> {
  return request('DELETE', `/api/v1/libraries/${id}`, undefined, true);
}

export interface UpdateInfo {
  has_update: boolean;
  latest_version: string;
  current_version: string;
  download_url: string;
  release_notes: string;
  release_date: string;
  is_critical: boolean;
  file_size: number;
  sha256: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  icon: string;
  action_text: string;
  action_url: string;
  is_dismissible: boolean;
  start_date: string;
  end_date: string;
  priority: number;
  created_at: string;
}

export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo> {
  return request<UpdateInfo>('GET', `/api/v1/app/update-check?current_version=${encodeURIComponent(currentVersion)}`);
}

export async function getAnnouncements(): Promise<{
  announcements: Announcement[];
}> {
  return request('GET', '/api/v1/app/announcements');
}

export async function dismissAnnouncement(id: number): Promise<void> {
  return request('POST', `/api/v1/app/announcements/${id}/dismiss`, undefined, true);
}

export interface UpdateLog {
  id: number;
  version: string;
  platform: string;
  release_notes: string;
  is_critical: boolean;
  published_at: string;
  created_at: string;
}

export interface UpdateLogsResponse {
  logs: UpdateLog[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export async function getUpdateLogs(page: number = 1, pageSize: number = 20): Promise<UpdateLogsResponse> {
  return request<UpdateLogsResponse>('GET', `/api/v1/app/update-logs?page=${page}&page_size=${pageSize}`);
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string; user: UserInfo }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const url = `${authConfig.serverUrl}/api/v1/upload/avatar`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenStore?.access_token}`,
      ...getDeviceHeaders(),
    },
    body: formData,
  });

  const responseText = await response.text();
  
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
  }
  
  if (!response.ok || !result.success) {
    const errorMsg = result.error?.message || result.message || `Upload failed (${response.status})`;
    throw new Error(errorMsg);
  }

  saveUser(result.data.user);
  return result.data;
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const url = `${authConfig.serverUrl}/api/v1/upload/image`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenStore?.access_token}`,
      ...getDeviceHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Upload failed');
  }

  return result.data;
}

export interface RealtimeMessage {
  id: number;
  event_type: string;
  data: any;
  created_at: string;
}

export class RealtimeClient {
  private abortController: AbortController | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;

  constructor() {}

  async connect(): Promise<void> {
    if (this.abortController) {
      this.disconnect();
    }

    const url = `${authConfig.serverUrl}/api/v1/realtime/subscribe`;
    
    this.abortController = new AbortController();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenStore?.access_token}`,
          'Accept': 'text/event-stream',
          ...getDeviceHeaders(),
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', { status: 'connected' });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            data = line.substring(5).trim();
          } else if (line === '' && data) {
            try {
              const parsed = JSON.parse(data);
              this.emit(eventType, parsed);
            } catch (e) {
              log.error('Failed to parse SSE data', e);
            }
            eventType = 'message';
            data = '';
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      
      this.isConnected = false;
      this.emit('error', { error });
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
      }
    }
  }

  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.isConnected = false;
      this.emit('disconnected', { status: 'disconnected' });
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export async function getUnreadMessageCount(): Promise<{ unread_count: number }> {
  return request('GET', '/api/v1/realtime/unread', undefined, true);
}

export async function sendNotification(
  userId: number,
  eventType: string,
  data: any
): Promise<{ message_id: number }> {
  return request('POST', '/api/v1/realtime/send', {
    user_id: userId,
    event_type: eventType,
    data,
  }, true);
}

export async function broadcastNotification(
  eventType: string,
  data: any
): Promise<{ recipients: number }> {
  return request('POST', '/api/v1/realtime/broadcast', {
    event_type: eventType,
    data,
  }, true);
}

export interface ServerAIModel {
  id: number;
  name: string;
  provider: string;
  model_name: string;
  base_url: string;
  api_format: string;
  api_key: string;
  context_window: number;
  max_tokens: number;
  temperature: number | null;
  enabled: boolean;
  is_public: boolean;
  category: string;
  capabilities: string[];
  reasoning_mode: string;
  reasoning_effort: string | null;
  requires_api_key: boolean;
  allowed_users: number[] | null;
  is_new: boolean;
  custom_headers: Record<string, string> | null;
  description: string | null;
  icon: string | null;
}

export async function getServerAIModels(): Promise<{ models: ServerAIModel[] }> {
  if (!isLoggedIn()) {
    return { models: [] };
  }
  
  try {
    const result = await request<{ models: ServerAIModel[] }>('GET', '/api/v1/ai-models', undefined, true);
    return result;
  } catch (error) {
    log.debug('Failed to load server AI models', error);
    return { models: [] };
  }
}
