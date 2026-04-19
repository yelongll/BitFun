import React from 'react';
import { Library } from 'lucide-react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';

interface LibraryEntryProps {
  isActive: boolean;
  onOpenLibrary: () => void;
}

const LibraryEntry: React.FC<LibraryEntryProps> = ({
  isActive,
  onOpenLibrary,
}) => {
  const { t } = useI18n('common');

  return (
    <div className="bitfun-nav-panel__library-entry-wrap">
      <div
        className={[
          'bitfun-nav-panel__library-entry',
          isActive && 'is-active',
        ].filter(Boolean).join(' ')}
        onClick={onOpenLibrary}
        onKeyDown={(event) => {
          if (event.currentTarget !== event.target) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenLibrary();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={t('scenes.library')}
      >
        <span className="bitfun-nav-panel__library-badge">即将上线</span>
        <span className="bitfun-nav-panel__library-entry-main">
          <span className="bitfun-nav-panel__library-entry-copy">
            <span className="bitfun-nav-panel__library-entry-title">{t('scenes.library')}</span>
          </span>
        </span>
      </div>
    </div>
  );
};

export default LibraryEntry;
