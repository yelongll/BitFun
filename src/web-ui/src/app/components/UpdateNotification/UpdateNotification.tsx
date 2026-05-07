import React from 'react';
import { Download, X, AlertTriangle, Sparkles } from 'lucide-react';
import { Modal } from '@/component-library';
import { useI18n } from '@/infrastructure/i18n';
import { useAppUpdateStore } from '@/shared/services/AppUpdateService';
import { getVersionInfo } from '@/shared/utils/version';
import './UpdateNotification.scss';

const UpdateNotification: React.FC = () => {
  const { t } = useI18n('common');
  const { updateInfo, showUpdateModal, closeUpdateModal, dismissUpdate } = useAppUpdateStore();
  const versionInfo = getVersionInfo();

  if (!updateInfo || !showUpdateModal) return null;

  const handleDownload = () => {
    if (updateInfo.download_url) {
      window.open(updateInfo.download_url, '_blank', 'noopener,noreferrer');
    }
    closeUpdateModal();
  };

  const handleSkip = () => {
    dismissUpdate();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={showUpdateModal}
      onClose={closeUpdateModal}
      title=""
      showCloseButton={false}
      size="medium"
    >
      <div className="update-notification">
        <button className="update-notification__close" onClick={closeUpdateModal}>
          <X size={18} />
        </button>

        <div className="update-notification__header">
          <div className="update-notification__icon-wrapper">
            {updateInfo.is_critical ? (
              <AlertTriangle size={28} className="update-notification__icon is-critical" />
            ) : (
              <Sparkles size={28} className="update-notification__icon is-normal" />
            )}
          </div>
          <h2 className="update-notification__title">
            {updateInfo.is_critical
              ? t('update.criticalUpdate', { defaultValue: '重要更新可用' })
              : t('update.newUpdate', { defaultValue: '发现新版本' })}
          </h2>
          <p className="update-notification__subtitle">
            {t('update.versionAvailable', { defaultValue: '新版本已就绪，升级以获得更好的体验' })}
          </p>
        </div>

        <div className="update-notification__version-info">
          <div className="update-notification__version-row">
            <span className="update-notification__version-label">
              {t('update.currentVersion', { defaultValue: '当前版本' })}
            </span>
            <span className="update-notification__version-value is-old">
              v{versionInfo.version}
            </span>
          </div>
          <div className="update-notification__version-arrow">→</div>
          <div className="update-notification__version-row">
            <span className="update-notification__version-label">
              {t('update.latestVersion', { defaultValue: '最新版本' })}
            </span>
            <span className="update-notification__version-value is-new">
              v{updateInfo.latest_version}
            </span>
          </div>
        </div>

        {updateInfo.release_notes && (
          <div className="update-notification__notes">
            <h3 className="update-notification__notes-title">
              {t('update.releaseNotes', { defaultValue: '更新内容' })}
            </h3>
            <div className="update-notification__notes-content">
              {updateInfo.release_notes.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}

        <div className="update-notification__meta">
          {updateInfo.release_date && (
            <span className="update-notification__meta-item">
              {t('update.releaseDate', { defaultValue: '发布日期' })}: {new Date(updateInfo.release_date).toLocaleDateString()}
            </span>
          )}
          {updateInfo.file_size > 0 && (
            <span className="update-notification__meta-item">
              {t('update.fileSize', { defaultValue: '文件大小' })}: {formatFileSize(updateInfo.file_size)}
            </span>
          )}
        </div>

        <div className="update-notification__actions">
          <button className="update-notification__btn is-primary" onClick={handleDownload}>
            <Download size={16} />
            {t('update.downloadNow', { defaultValue: '立即下载' })}
          </button>
          {!updateInfo.is_critical && (
            <button className="update-notification__btn is-secondary" onClick={handleSkip}>
              {t('update.skipVersion', { defaultValue: '跳过此版本' })}
            </button>
          )}
          <button className="update-notification__btn is-ghost" onClick={closeUpdateModal}>
            {t('update.remindLater', { defaultValue: '稍后提醒' })}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UpdateNotification;
