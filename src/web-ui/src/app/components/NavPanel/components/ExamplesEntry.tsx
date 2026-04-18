import React from 'react';
import { FolderCode } from 'lucide-react';
import { Badge } from '@/component-library';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';

interface ExamplesEntryProps {
  isActive: boolean;
  onOpenExamples: () => void;
}

const ExamplesEntry: React.FC<ExamplesEntryProps> = ({
  isActive,
  onOpenExamples,
}) => {
  const { t } = useI18n('common');

  return (
    <div className="bitfun-nav-panel__examples-entry-wrap">
      <div
        className={[
          'bitfun-nav-panel__examples-entry',
          isActive && 'is-active',
        ].filter(Boolean).join(' ')}
        onClick={onOpenExamples}
        onKeyDown={(event) => {
          if (event.currentTarget !== event.target) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenExamples();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={t('scenes.examples')}
      >
        <span className="bitfun-nav-panel__examples-entry-icon">
          <FolderCode size={18} />
        </span>
        <span className="bitfun-nav-panel__examples-entry-main">
          <span className="bitfun-nav-panel__examples-entry-copy">
            <span className="bitfun-nav-panel__examples-entry-title">{t('scenes.examples')}</span>
            <Badge variant="neutral" className="bitfun-nav-panel__examples-badge">未上线</Badge>
          </span>
        </span>
      </div>
    </div>
  );
};

export default ExamplesEntry;
