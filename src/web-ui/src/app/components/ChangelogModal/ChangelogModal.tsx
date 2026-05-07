import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';
import { Modal } from '@/component-library';
import { History, AlertTriangle, Monitor, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  getUpdateLogs,
  UpdateLog,
  configureAuth,
} from '@/infrastructure/api/service-api/AuthAPI';
import { createLogger } from '@/shared/utils/logger';
import './ChangelogModal.scss';

const log = createLogger('ChangelogModal');

const platformNames: Record<string, string> = {
  all: '全平台',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
};

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n('common');
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const serverUrl = localStorage.getItem('kongling_server_url') || 'http://111.228.54.164';
      configureAuth({ serverUrl });
      const result = await getUpdateLogs(currentPage, 10);
      setLogs(result.logs);
      setTotalPages(result.pagination.total_pages);
    } catch (err) {
      log.error('Failed to fetch update logs', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  useEffect(() => {
    if (logs.length > 0) {
      setExpandedIds(new Set([logs[0].id]));
    }
  }, [logs]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const parseReleaseNotes = (notes: string) => {
    if (!notes) return [];
    return notes.split('\n').filter(line => line.trim() !== '');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('scenes.changelog', { defaultValue: '更新记录' })}
      showCloseButton
      size="xlarge"
    >
      <div className="bitfun-changelog-modal">
        {loading ? (
          <div className="bitfun-changelog-modal__loading">
            <Loader2 className="bitfun-changelog-modal__spinner" size={24} />
            <span>{t('common.loading', { defaultValue: '加载中...' })}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="bitfun-changelog-modal__empty">
            <History size={48} />
            <p>{t('changelog.noUpdates', { defaultValue: '暂无更新记录' })}</p>
          </div>
        ) : (
          <>
            <div className="bitfun-changelog-modal__timeline">
              {logs.map((item) => {
                const isExpanded = expandedIds.has(item.id);
                const noteLines = parseReleaseNotes(item.release_notes);

                return (
                  <div
                    key={item.id}
                    className={`bitfun-changelog-modal__item ${isExpanded ? 'is-expanded' : ''} ${item.is_critical ? 'is-critical' : ''}`}
                  >
                    <div className="bitfun-changelog-modal__item-dot" />

                    <div className="bitfun-changelog-modal__item-card">
                      <div
                        className="bitfun-changelog-modal__item-header"
                        onClick={() => toggleExpand(item.id)}
                      >
                        <div className="bitfun-changelog-modal__item-info">
                          <div className="bitfun-changelog-modal__item-version">
                            <span className="bitfun-changelog-modal__version-tag">
                              v{item.version}
                            </span>
                            {item.is_critical && (
                              <span className="bitfun-changelog-modal__critical-badge">
                                <AlertTriangle size={12} />
                                {t('changelog.critical', { defaultValue: '重要更新' })}
                              </span>
                            )}
                            <span className="bitfun-changelog-modal__platform-badge">
                              <Monitor size={12} />
                              {platformNames[item.platform] || item.platform}
                            </span>
                          </div>
                          <span className="bitfun-changelog-modal__item-date">
                            {formatDate(item.published_at)}
                          </span>
                        </div>

                        <button className="bitfun-changelog-modal__item-toggle">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {isExpanded && noteLines.length > 0 && (
                        <div className="bitfun-changelog-modal__item-notes">
                          <ul className="bitfun-changelog-modal__notes-list">
                            {noteLines.map((line, idx) => (
                              <li key={idx} className="bitfun-changelog-modal__note-line">
                                {line.replace(/^[-*•]\s*/, '')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {isExpanded && noteLines.length === 0 && (
                        <div className="bitfun-changelog-modal__item-notes">
                          <p className="bitfun-changelog-modal__no-notes">
                            {t('changelog.noNotes', { defaultValue: '暂无详细更新说明' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="bitfun-changelog-modal__pagination">
                <button
                  className="bitfun-changelog-modal__page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  {t('changelog.prev', { defaultValue: '上一页' })}
                </button>
                <span className="bitfun-changelog-modal__page-info">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="bitfun-changelog-modal__page-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  {t('changelog.next', { defaultValue: '下一页' })}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ChangelogModal;
