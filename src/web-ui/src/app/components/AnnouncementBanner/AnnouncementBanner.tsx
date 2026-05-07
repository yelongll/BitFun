import React, { useState, useEffect, useCallback } from 'react';
import { Info, AlertTriangle, CheckCircle, AlertCircle, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppUpdateStore } from '@/shared/services/AppUpdateService';
import type { Announcement } from '@/infrastructure/api/service-api/AuthAPI';
import './AnnouncementBanner.scss';

const typeConfig: Record<string, { icon: React.ElementType; className: string }> = {
  info: { icon: Info, className: 'is-info' },
  warning: { icon: AlertTriangle, className: 'is-warning' },
  success: { icon: CheckCircle, className: 'is-success' },
  critical: { icon: AlertCircle, className: 'is-critical' },
};

const AnnouncementBanner: React.FC = () => {
  const { announcements, showAnnouncementBanner, dismissAnnouncementById, hideAnnouncementBanner } = useAppUpdateStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentAnnouncement: Announcement | undefined = announcements[currentIndex];

  useEffect(() => {
    if (currentIndex >= announcements.length && announcements.length > 0) {
      setCurrentIndex(announcements.length - 1);
    }
  }, [announcements.length, currentIndex]);

  const handleDismiss = useCallback(async () => {
    if (!currentAnnouncement) return;

    if (currentAnnouncement.is_dismissible) {
      await dismissAnnouncementById(currentAnnouncement.id);
    } else {
      hideAnnouncementBanner();
    }
  }, [currentAnnouncement, dismissAnnouncementById, hideAnnouncementBanner]);

  const handleAction = useCallback(() => {
    if (currentAnnouncement?.action_url) {
      window.open(currentAnnouncement.action_url, '_blank', 'noopener,noreferrer');
    }
  }, [currentAnnouncement]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : announcements.length - 1));
  }, [announcements.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < announcements.length - 1 ? prev + 1 : 0));
  }, [announcements.length]);

  if (!showAnnouncementBanner || !currentAnnouncement) return null;

  const config = typeConfig[currentAnnouncement.type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div className={`announcement-banner ${config.className}`}>
      {currentAnnouncement.is_dismissible && (
        <button className="announcement-banner__dismiss" onClick={handleDismiss}>
          <X size={14} />
        </button>
      )}

      <div className="announcement-banner__header">
        <div className="announcement-banner__icon">
          <IconComponent size={18} />
        </div>
        <div className="announcement-banner__body">
          <div className="announcement-banner__title">{currentAnnouncement.title}</div>
          {currentAnnouncement.content && (
            <div className="announcement-banner__desc">{currentAnnouncement.content}</div>
          )}
        </div>
      </div>

      {(currentAnnouncement.action_text || announcements.length > 1) && (
        <div className="announcement-banner__footer">
          {currentAnnouncement.action_text && currentAnnouncement.action_url && (
            <button className="announcement-banner__action" onClick={handleAction}>
              {currentAnnouncement.action_text}
              <ExternalLink size={12} />
            </button>
          )}
          {announcements.length > 1 && (
            <div className="announcement-banner__pagination">
              <button className="announcement-banner__page-btn" onClick={handlePrev}>
                <ChevronLeft size={14} />
              </button>
              <span className="announcement-banner__page-indicator">
                {currentIndex + 1}/{announcements.length}
              </span>
              <button className="announcement-banner__page-btn" onClick={handleNext}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;
