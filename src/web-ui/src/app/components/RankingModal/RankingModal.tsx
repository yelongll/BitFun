import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';
import { Modal } from '@/component-library';
import { Trophy, Medal, Crown, TrendingUp, Star, ArrowUp, ArrowDown, Minus, User, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  getPointsRanking,
  getPointsBalance,
  getPointsRecords,
  isLoggedIn,
  getStoredUser,
  getMe,
  RankingUser,
  PointsBalance,
  PointRecord,
} from '@/infrastructure/api/service-api/AuthAPI';
import { createLogger } from '@/shared/utils/logger';
import { getLevelByPoints, getProgressToNextLevel, LEVELS } from '@/shared/config/levels';
import './RankingModal.scss';

const log = createLogger('RankingModal');

type RankingTab = 'current' | 'total';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n('common');
  const [activeTab, setActiveTab] = useState<RankingTab>('current');
  const [rankingList, setRankingList] = useState<RankingUser[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [records, setRecords] = useState<PointRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotalPages, setRecordsTotalPages] = useState(1);
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  const currentUser = getStoredUser();

  const fetchData = useCallback(async () => {
    if (!isLoggedIn()) return;
    setLoading(true);
    try {
      const [ranking, balance] = await Promise.all([
        getPointsRanking(currentPage, 10, activeTab),
        getPointsBalance(),
      ]);
      setRankingList(ranking.ranking);
      setMyRank(ranking.my_rank);
      setTotalPages(ranking.pagination.total_pages);
      setPointsBalance(balance);

      try {
        await getMe();
        window.dispatchEvent(new CustomEvent('user-info-updated'));
      } catch (e) {
        log.warn('Failed to refresh user info', e);
      }

      const recordsResult = await getPointsRecords(recordsPage, 5);
      setRecords(recordsResult.records);
      setRecordsTotalPages(recordsResult.pagination.total_pages);
    } catch (err) {
      log.error('Failed to fetch ranking data', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, recordsPage]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const getRecordIcon = (type: string) => {
    if (type === 'earn' || type === 'reward') return <ArrowUp size={14} className="bitfun-ranking-modal__record-icon is-positive" />;
    if (type === 'deduct' || type === 'spend') return <ArrowDown size={14} className="bitfun-ranking-modal__record-icon is-negative" />;
    return <Minus size={14} className="bitfun-ranking-modal__record-icon" />;
  };

  const renderLevelIcon = (points: number, size: number = 48) => {
    const level = getLevelByPoints(points);
    return (
      <img 
        src={level.icon} 
        alt={level.name} 
        className="bitfun-ranking-modal__level-icon"
        style={{ width: size, height: size }}
        title={level.name}
      />
    );
  };

  const myLevel = pointsBalance ? getLevelByPoints(pointsBalance.points) : null;
  const myProgress = pointsBalance ? getProgressToNextLevel(pointsBalance.points) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('scenes.ranking', { defaultValue: '开发者排行榜' })}
      showCloseButton
      size="xlarge"
    >
      <div className="bitfun-ranking-modal">
        {!isLoggedIn() ? (
          <div className="bitfun-ranking-modal__empty">
            <Trophy size={48} />
            <p>{t('ranking.loginRequired', { defaultValue: '请先登录查看开发者排行榜' })}</p>
          </div>
        ) : loading ? (
          <div className="bitfun-ranking-modal__loading">
            <Loader2 className="bitfun-ranking-modal__spinner" size={24} />
            <span>{t('common.loading', { defaultValue: '加载中...' })}</span>
          </div>
        ) : (
          <>
            {pointsBalance && (
              <div className="bitfun-ranking-modal__my-stats">
                <div className="bitfun-ranking-modal__stat-card bitfun-ranking-modal__stat-card--level">
                  <div className="bitfun-ranking-modal__stat-icon">
                    {myLevel && (
                      <img 
                        src={myLevel.icon} 
                        alt={myLevel.name} 
                        className="bitfun-ranking-modal__level-badge"
                        title={myLevel.name}
                        style={{ width: 48, height: 48 }}
                      />
                    )}
                  </div>
                  <div className="bitfun-ranking-modal__stat-info">
                    <span className="bitfun-ranking-modal__stat-value bitfun-ranking-modal__stat-value--level">
                      {myLevel?.name || '-'}
                    </span>
                    <span className="bitfun-ranking-modal__stat-label">{t('ranking.myLevel', { defaultValue: '我的等级' })}</span>
                  </div>
                </div>
                <div className="bitfun-ranking-modal__stat-card bitfun-ranking-modal__stat-card--primary">
                  <div className="bitfun-ranking-modal__stat-icon">
                    <Star size={18} />
                  </div>
                  <div className="bitfun-ranking-modal__stat-info">
                    <span className="bitfun-ranking-modal__stat-value">{pointsBalance.points}</span>
                    <span className="bitfun-ranking-modal__stat-label">{t('ranking.currentPoints', { defaultValue: '编译积分' })}</span>
                  </div>
                </div>
                <div className="bitfun-ranking-modal__stat-card bitfun-ranking-modal__stat-card--rank">
                  <div className="bitfun-ranking-modal__stat-icon">
                    <TrendingUp size={18} />
                  </div>
                  <div className="bitfun-ranking-modal__stat-info">
                    <span className="bitfun-ranking-modal__stat-value">{myRank ?? '-'}</span>
                    <span className="bitfun-ranking-modal__stat-label">{t('ranking.myRank', { defaultValue: '我的排名' })}</span>
                  </div>
                </div>
              </div>
            )}

            {myProgress && (
              <div className="bitfun-ranking-modal__progress">
                <div className="bitfun-ranking-modal__progress-bar">
                  <div 
                    className="bitfun-ranking-modal__progress-fill"
                    style={{ width: `${myProgress.percentage}%` }}
                  />
                </div>
                <div className="bitfun-ranking-modal__progress-text">
                  {t('ranking.progressToNext', { 
                    defaultValue: `距离下一级还需 ${myProgress.required - myProgress.current} 积分`,
                    current: myProgress.current,
                    required: myProgress.required,
                    remaining: myProgress.required - myProgress.current
                  })}
                </div>
              </div>
            )}

            <div className="bitfun-ranking-modal__tabs">
              <button
                className={`bitfun-ranking-modal__tab ${activeTab === 'current' ? 'is-active' : ''}`}
                onClick={() => { setActiveTab('current'); setCurrentPage(1); }}
              >
                <Star size={14} />
                {t('ranking.currentRanking', { defaultValue: '编译积分' })}
              </button>
              <button
                className={`bitfun-ranking-modal__tab ${activeTab === 'total' ? 'is-active' : ''}`}
                onClick={() => { setActiveTab('total'); setCurrentPage(1); }}
              >
                <TrendingUp size={14} />
                {t('ranking.totalRanking', { defaultValue: '累计积分' })}
              </button>
            </div>

            {rankingList.length > 0 && (
              <div className="bitfun-ranking-modal__podium">
                {rankingList[1] && (
                  <div className={`bitfun-ranking-modal__podium-item bitfun-ranking-modal__podium-item--silver ${currentUser?.id === rankingList[1].id ? 'is-me' : ''}`}>
                    <div className="bitfun-ranking-modal__podium-avatar">
                      {rankingList[1].avatar_url ? (
                        <img src={rankingList[1].avatar_url} alt="" />
                      ) : (
                        <div className="bitfun-ranking-modal__podium-placeholder"><User size={18} /></div>
                      )}
                      <div className="bitfun-ranking-modal__podium-badge is-silver">2</div>
                    </div>
                    <div className="bitfun-ranking-modal__podium-level">
                      {renderLevelIcon(rankingList[1].points, 48)}
                    </div>
                    <span className="bitfun-ranking-modal__podium-name">{rankingList[1].nickname || rankingList[1].username}</span>
                    <span className="bitfun-ranking-modal__podium-points">{rankingList[1].points.toLocaleString()}</span>
                  </div>
                )}
                {rankingList[0] && (
                  <div className={`bitfun-ranking-modal__podium-item bitfun-ranking-modal__podium-item--gold ${currentUser?.id === rankingList[0].id ? 'is-me' : ''}`}>
                    <Crown size={22} className="bitfun-ranking-modal__podium-crown" />
                    <div className="bitfun-ranking-modal__podium-avatar">
                      {rankingList[0].avatar_url ? (
                        <img src={rankingList[0].avatar_url} alt="" />
                      ) : (
                        <div className="bitfun-ranking-modal__podium-placeholder"><User size={20} /></div>
                      )}
                      <div className="bitfun-ranking-modal__podium-badge is-gold">1</div>
                    </div>
                    <div className="bitfun-ranking-modal__podium-level">
                      {renderLevelIcon(rankingList[0].points, 56)}
                    </div>
                    <span className="bitfun-ranking-modal__podium-name">{rankingList[0].nickname || rankingList[0].username}</span>
                    <span className="bitfun-ranking-modal__podium-points">{rankingList[0].points.toLocaleString()}</span>
                  </div>
                )}
                {rankingList[2] && (
                  <div className={`bitfun-ranking-modal__podium-item bitfun-ranking-modal__podium-item--bronze ${currentUser?.id === rankingList[2].id ? 'is-me' : ''}`}>
                    <div className="bitfun-ranking-modal__podium-avatar">
                      {rankingList[2].avatar_url ? (
                        <img src={rankingList[2].avatar_url} alt="" />
                      ) : (
                        <div className="bitfun-ranking-modal__podium-placeholder"><User size={18} /></div>
                      )}
                      <div className="bitfun-ranking-modal__podium-badge is-bronze">3</div>
                    </div>
                    <div className="bitfun-ranking-modal__podium-level">
                      {renderLevelIcon(rankingList[2].points, 48)}
                    </div>
                    <span className="bitfun-ranking-modal__podium-name">{rankingList[2].nickname || rankingList[2].username}</span>
                    <span className="bitfun-ranking-modal__podium-points">{rankingList[2].points.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            <div className="bitfun-ranking-modal__list">
              {rankingList.slice(3).map((user) => (
                <div
                  key={user.id}
                  className={`bitfun-ranking-modal__list-item ${currentUser?.id === user.id ? 'is-me' : ''}`}
                >
                  <span className="bitfun-ranking-modal__list-rank">{user.rank}</span>
                  <div className="bitfun-ranking-modal__list-avatar">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" />
                    ) : (
                      <div className="bitfun-ranking-modal__list-placeholder"><User size={12} /></div>
                    )}
                  </div>
                  <span className="bitfun-ranking-modal__list-name">{user.nickname || user.username}</span>
                  <div className="bitfun-ranking-modal__list-level">
                    {renderLevelIcon(user.points, 40)}
                  </div>
                  <span className="bitfun-ranking-modal__list-points">{user.points.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="bitfun-ranking-modal__pagination">
                <button
                  className="bitfun-ranking-modal__page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  {t('ranking.prev', { defaultValue: '上一页' })}
                </button>
                <span className="bitfun-ranking-modal__page-info">{currentPage} / {totalPages}</span>
                <button
                  className="bitfun-ranking-modal__page-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  {t('ranking.next', { defaultValue: '下一页' })}
                </button>
              </div>
            )}

            <div className="bitfun-ranking-modal__level-info">
              <button
                className="bitfun-ranking-modal__level-info-header"
                onClick={() => setShowLevelInfo(!showLevelInfo)}
              >
                <div className="bitfun-ranking-modal__level-info-title">
                  <Info size={16} />
                  <span>{t('ranking.levelGuide', { defaultValue: '等级说明' })}</span>
                </div>
                {showLevelInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {showLevelInfo && (
                <div className="bitfun-ranking-modal__level-info-content">
                  <div className="bitfun-ranking-modal__level-categories">
                    <div className="bitfun-ranking-modal__level-category">
                      <div className="bitfun-ranking-modal__level-category-title">
                        {t('ranking.basicLevel', { defaultValue: '基础等级' })}
                      </div>
                      <div className="bitfun-ranking-modal__level-category-desc">
                        {t('ranking.basicLevelDesc', { defaultValue: '1富 - 10富，编译积分 10-700' })}
                      </div>
                    </div>
                    <div className="bitfun-ranking-modal__level-category">
                      <div className="bitfun-ranking-modal__level-category-title">
                        {t('ranking.nobleLevel', { defaultValue: '贵族等级' })}
                      </div>
                      <div className="bitfun-ranking-modal__level-category-desc">
                        {t('ranking.nobleLevelDesc', { defaultValue: '男爵 - 天君，编译积分 1000-27500' })}
                      </div>
                    </div>
                    <div className="bitfun-ranking-modal__level-category">
                      <div className="bitfun-ranking-modal__level-category-title">
                        {t('ranking.divineLevel', { defaultValue: '神级等级' })}
                      </div>
                      <div className="bitfun-ranking-modal__level-category-desc">
                        {t('ranking.divineLevelDesc', { defaultValue: '神 - 自定义神，编译积分 32500-150000' })}
                      </div>
                    </div>
                    <div className="bitfun-ranking-modal__level-category">
                      <div className="bitfun-ranking-modal__level-category-title">
                        {t('ranking.cosmicGod', { defaultValue: '宇宙之神' })}
                      </div>
                      <div className="bitfun-ranking-modal__level-category-desc">
                        {t('ranking.cosmicGodDesc', { defaultValue: '到达宇宙之神，提供开发环境+编译器所有源码' })}
                      </div>
                    </div>
                  </div>

                  <div className="bitfun-ranking-modal__level-preview">
                    <div className="bitfun-ranking-modal__level-preview-title">
                      {t('ranking.allLevels', { defaultValue: '完整等级列表' })}
                    </div>
                    <div className="bitfun-ranking-modal__level-preview-grid">
                      {LEVELS.map(level => (
                        <div key={level.name} className="bitfun-ranking-modal__level-preview-item">
                          <img src={level.icon} alt={level.name} title={`${level.name} - ${level.requirement.toLocaleString()}次编译`} />
                          <span>{level.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {records.length > 0 && (
              <div className="bitfun-ranking-modal__records">
                <h3 className="bitfun-ranking-modal__records-title">
                  {t('ranking.myRecords', { defaultValue: '积分记录' })}
                </h3>
                <div className="bitfun-ranking-modal__records-list">
                  {records.map((record) => (
                    <div key={record.id} className="bitfun-ranking-modal__record-item">
                      <div className="bitfun-ranking-modal__record-left">
                        {getRecordIcon(record.type)}
                        <span className="bitfun-ranking-modal__record-desc">{record.description}</span>
                      </div>
                      <div className="bitfun-ranking-modal__record-right">
                        <span className={`bitfun-ranking-modal__record-points ${record.points > 0 ? 'is-positive' : 'is-negative'}`}>
                          {record.points > 0 ? '+' : ''}{record.points}
                        </span>
                        <span className="bitfun-ranking-modal__record-date">
                          {new Date(record.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {recordsTotalPages > 1 && (
                  <div className="bitfun-ranking-modal__pagination">
                    <button
                      className="bitfun-ranking-modal__page-btn"
                      disabled={recordsPage <= 1}
                      onClick={() => setRecordsPage(p => p - 1)}
                    >
                      {t('ranking.prev', { defaultValue: '上一页' })}
                    </button>
                    <span className="bitfun-ranking-modal__page-info">{recordsPage} / {recordsTotalPages}</span>
                    <button
                      className="bitfun-ranking-modal__page-btn"
                      disabled={recordsPage >= recordsTotalPages}
                      onClick={() => setRecordsPage(p => p + 1)}
                    >
                      {t('ranking.next', { defaultValue: '下一页' })}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default RankingModal;
