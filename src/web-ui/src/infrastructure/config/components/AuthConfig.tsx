import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/component-library';
import {
  configureAuth,
  login,
  register,
  logout,
  getStoredUser,
  clearAuth,
  UserInfo,
  getPointsBalance,
  getPointsRanking,
  PointsBalance,
  getMe,
  uploadAvatar,
} from '@/infrastructure/api/service-api/AuthAPI';
import { useSceneStore } from '@/app/stores/sceneStore';
import { createLogger } from '@/shared/utils/logger';
import './AuthConfig.scss';

const log = createLogger('AuthConfig');

const AuthConfig: React.FC = () => {
  const { t } = useTranslation('settings');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('kongling_server_url') || 'http://111.228.54.164';
  });

  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [registerAvatar, setRegisterAvatar] = useState<File | null>(null);
  const [registerAvatarPreview, setRegisterAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registerAvatarInputRef = useRef<HTMLInputElement>(null);

  const openScene = useSceneStore((state) => state.openScene);

  const fetchPointsInfo = useCallback(async () => {
    try {
      const balance = await getPointsBalance();
      setPointsBalance(balance);
      const ranking = await getPointsRanking(1, 50, 'current');
      setMyRank(ranking.my_rank);
    } catch (err) {
      log.error('Failed to fetch points info', err);
    }
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setLoggedIn(true);
    }
    configureAuth({ serverUrl });
  }, [serverUrl]);

  useEffect(() => {
    if (loggedIn) {
      getMe().then((freshUser) => {
        setUser(freshUser);
      }).catch((err) => {
        log.error('Failed to refresh user info', err);
      });
      fetchPointsInfo();
    }
  }, [loggedIn, fetchPointsInfo]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!username || !password) {
      setError(t('auth.errors.fieldsRequired', { defaultValue: '请填写用户名和密码' }));
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      localStorage.setItem('kongling_server_url', serverUrl);
      configureAuth({ serverUrl });
      const result = await login(username, password);
      setUser(result.user);
      setLoggedIn(true);
      setSuccess(t('auth.loginSuccess', { defaultValue: '登录成功' }));
      setUsername('');
      setPassword('');
      window.dispatchEvent(new CustomEvent('auth-change'));
    } catch (err: any) {
      log.error('Login failed', err);
      setError(err.message || t('auth.errors.loginFailed', { defaultValue: '登录失败' }));
    } finally {
      setLoading(false);
    }
  }, [username, password, serverUrl, t, clearMessages]);

  const handleRegister = useCallback(async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError(t('auth.errors.allFieldsRequired', { defaultValue: '请填写所有字段' }));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch', { defaultValue: '两次密码不一致' }));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errors.passwordTooShort', { defaultValue: '密码至少6位' }));
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      localStorage.setItem('kongling_server_url', serverUrl);
      configureAuth({ serverUrl });
      const result = await register(username, email, password, confirmPassword);
      
      if (registerAvatar) {
        try {
          const avatarResult = await uploadAvatar(registerAvatar);
          setUser(avatarResult.user);
        } catch (avatarErr: any) {
          log.warn('Avatar upload failed after registration', avatarErr);
          setUser(result.user);
        }
      } else {
        setUser(result.user);
      }
      
      setLoggedIn(true);
      setSuccess(t('auth.registerSuccess', { defaultValue: '注册成功' }));
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRegisterAvatar(null);
      setRegisterAvatarPreview(null);
      window.dispatchEvent(new CustomEvent('auth-change'));
    } catch (err: any) {
      log.error('Register failed', err);
      setError(err.message || t('auth.errors.registerFailed', { defaultValue: '注册失败' }));
    } finally {
      setLoading(false);
    }
  }, [username, email, password, confirmPassword, serverUrl, t, clearMessages]);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    clearMessages();

    try {
      await logout();
      setUser(null);
      setLoggedIn(false);
      setSuccess(t('auth.logoutSuccess', { defaultValue: '已退出登录' }));
      window.dispatchEvent(new CustomEvent('auth-change'));
    } catch (err: any) {
      log.error('Logout failed', err);
      clearAuth();
      setUser(null);
      setLoggedIn(false);
      window.dispatchEvent(new CustomEvent('auth-change'));
    } finally {
      setLoading(false);
    }
  }, [t, clearMessages]);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('auth.errors.invalidImageType', { defaultValue: '请选择图片文件' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('auth.errors.imageTooLarge', { defaultValue: '图片大小不能超过5MB' }));
      return;
    }

    setUploadingAvatar(true);
    clearMessages();

    try {
      const result = await uploadAvatar(file);
      console.log('Upload result:', result);
      console.log('New avatar URL:', result.avatar_url);
      console.log('User avatar_url:', result.user?.avatar_url);
      setUser(result.user);
      setSuccess(t('auth.avatarUploadSuccess', { defaultValue: '头像更新成功' }));
      window.dispatchEvent(new CustomEvent('auth-change'));
    } catch (err: any) {
      log.error('Avatar upload failed', err);
      setError(err.message || t('auth.errors.avatarUploadFailed', { defaultValue: '头像上传失败' }));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [t, clearMessages]);

  const handleRegisterAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('auth.errors.invalidImageType', { defaultValue: '请选择图片文件' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('auth.errors.imageTooLarge', { defaultValue: '图片大小不能超过5MB' }));
      return;
    }

    setRegisterAvatar(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRegisterAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    clearMessages();
  }, [t, clearMessages]);

  const handleRemoveRegisterAvatar = useCallback(() => {
    setRegisterAvatar(null);
    setRegisterAvatarPreview(null);
    if (registerAvatarInputRef.current) {
      registerAvatarInputRef.current.value = '';
    }
  }, []);

  const renderLoginForm = () => (
    <div className="auth-config__form">
      <div className="auth-config__form-title">
        {isLoginMode
          ? t('auth.login', { defaultValue: '登录' })
          : t('auth.register', { defaultValue: '注册' })}
      </div>

      {!isLoginMode && (
        <div className="auth-config__avatar-section">
          <input
            ref={registerAvatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleRegisterAvatarChange}
          />
          <div 
            className="auth-config__avatar-upload"
            onClick={() => registerAvatarInputRef.current?.click()}
          >
            {registerAvatarPreview ? (
              <img src={registerAvatarPreview} alt="Avatar preview" />
            ) : (
              <div className="auth-config__avatar-placeholder-register">
                <span>+</span>
              </div>
            )}
          </div>
          <div className="auth-config__avatar-hint">
            {registerAvatarPreview ? (
              <>
                <span>{t('auth.avatarSelected', { defaultValue: '已选择头像' })}</span>
                <button 
                  type="button" 
                  className="auth-config__avatar-remove"
                  onClick={(e) => { e.stopPropagation(); handleRemoveRegisterAvatar(); }}
                >
                  {t('auth.remove', { defaultValue: '移除' })}
                </button>
              </>
            ) : (
              <span>{t('auth.selectAvatar', { defaultValue: '选择头像（可选）' })}</span>
            )}
          </div>
        </div>
      )}

      {!isLoginMode && (
        <div className="auth-config__field">
          <label className="auth-config__label">
            {t('auth.email', { defaultValue: '邮箱' })}
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder', { defaultValue: '请输入邮箱' })}
          />
        </div>
      )}

      <div className="auth-config__field">
        <label className="auth-config__label">
          {t('auth.username', { defaultValue: '用户名' })}
        </label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('auth.usernamePlaceholder', { defaultValue: '请输入用户名' })}
        />
      </div>

      <div className="auth-config__field">
        <label className="auth-config__label">
          {t('auth.password', { defaultValue: '密码' })}
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordPlaceholder', { defaultValue: '请输入密码' })}
        />
      </div>

      {!isLoginMode && (
        <div className="auth-config__field">
          <label className="auth-config__label">
            {t('auth.confirmPassword', { defaultValue: '确认密码' })}
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.confirmPasswordPlaceholder', { defaultValue: '请再次输入密码' })}
          />
        </div>
      )}

      {error && <div className="auth-config__error">{error}</div>}
      {success && <div className="auth-config__success">{success}</div>}

      <div className="auth-config__actions">
        <Button
          variant="primary"
          onClick={isLoginMode ? handleLogin : handleRegister}
          isLoading={loading}
          disabled={loading}
        >
          {isLoginMode
            ? t('auth.login', { defaultValue: '登录' })
            : t('auth.register', { defaultValue: '注册' })}
        </Button>
      </div>

      <div className="auth-config__switch">
        <span onClick={() => { setIsLoginMode(!isLoginMode); clearMessages(); }}>
          {isLoginMode
            ? t('auth.noAccount', { defaultValue: '没有账号？点击注册' })
            : t('auth.hasAccount', { defaultValue: '已有账号？点击登录' })}
        </span>
      </div>
    </div>
  );

  const renderUserInfo = () => (
    <div className="auth-config__user-info">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleAvatarChange}
      />
      <div className="auth-config__info-wrapper">
        <div className="auth-config__left">
          <div className="auth-config__user-header">
            <div 
              className="auth-config__avatar" 
              onClick={handleAvatarClick}
              title={t('auth.clickToChangeAvatar', { defaultValue: '点击更换头像' })}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.nickname || user.username} />
              ) : (
                <div className="auth-config__avatar-placeholder">
                  {(user?.nickname || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {uploadingAvatar && (
                <div className="auth-config__avatar-uploading">
                  <div className="auth-config__avatar-spinner"></div>
                </div>
              )}
              <div className="auth-config__avatar-overlay">
                <span>{t('auth.changeAvatar', { defaultValue: '更换' })}</span>
              </div>
            </div>
            <div className="auth-config__user-details">
              <div className="auth-config__username">{user?.nickname || user?.username}</div>
              <div className="auth-config__email">{user?.email}</div>
            </div>
          </div>

          <div className="auth-config__points-section">
            <div className="auth-config__points-card">
              <div className="auth-config__points-main">
                <span className="auth-config__points-value">{pointsBalance?.points ?? user?.points ?? 0}</span>
                <span className="auth-config__points-label">{t('auth.currentPoints', { defaultValue: '编译积分' })}</span>
              </div>
              <div className="auth-config__points-divider"></div>
              <div className="auth-config__points-stats">
                <div className="auth-config__points-stat">
                  <span className="auth-config__points-stat-value">{myRank ?? '-'}</span>
                  <span className="auth-config__points-stat-label">{t('auth.ranking', { defaultValue: '排名' })}</span>
                </div>
                <div className="auth-config__points-stat">
                  <span className="auth-config__points-stat-value">{pointsBalance?.total_earned ?? user?.total_earned_points ?? 0}</span>
                  <span className="auth-config__points-stat-label">{t('auth.totalEarned', { defaultValue: '累计次数' })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-config__stats">
            <div className="auth-config__stat-item">
              <span className="auth-config__stat-label">{t('auth.status', { defaultValue: '状态' })}</span>
              <span className="auth-config__stat-value">
                {user?.status === 1
                  ? t('auth.statusNormal', { defaultValue: '正常' })
                  : t('auth.statusDisabled', { defaultValue: '禁用' })}
              </span>
            </div>
            <div className="auth-config__stat-item">
              <span className="auth-config__stat-label">{t('auth.role', { defaultValue: '角色' })}</span>
              <span className="auth-config__stat-value">
                {user?.role === 'admin'
                  ? t('auth.roleAdmin', { defaultValue: '管理员' })
                  : t('auth.roleUser', { defaultValue: '普通用户' })}
              </span>
            </div>
            <div className="auth-config__stat-item">
              <span className="auth-config__stat-label">{t('auth.lastLoginIp', { defaultValue: '最后登录IP' })}</span>
              <span className="auth-config__stat-value">{user?.last_login_ip || '-'}</span>
            </div>
            <div className="auth-config__stat-item">
              <span className="auth-config__stat-label">{t('auth.createdAt', { defaultValue: '注册时间' })}</span>
              <span className="auth-config__stat-value">{user?.created_at || '-'}</span>
            </div>
          </div>
        </div>

      </div>

      {error && <div className="auth-config__error">{error}</div>}
      {success && <div className="auth-config__success">{success}</div>}

      <div className="auth-config__actions">
        <Button variant="secondary" onClick={handleLogout} isLoading={loading}>
          {t('auth.logout', { defaultValue: '退出登录' })}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="auth-config">
      <div className="auth-config__header">
        <h2 className="auth-config__title">
          {t('configCenter.tabs.account', { defaultValue: '账户' })}
        </h2>
      </div>

      <div className="auth-config__content">
        {loggedIn ? renderUserInfo() : renderLoginForm()}
      </div>
    </div>
  );
};

export default AuthConfig;
