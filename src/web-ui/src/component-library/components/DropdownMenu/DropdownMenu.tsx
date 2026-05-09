import React from 'react';
import { Menu } from 'lucide-react';
import './DropdownMenu.scss';

export interface DropdownMenuEntry {
  id: string;
  type?: 'item' | 'separator' | 'label';
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownMenuProps {
  entries: DropdownMenuEntry[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
  open?: boolean;
  onClose?: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement>;
  minWidth?: number;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  entries,
  trigger,
  align = 'left',
  open: controlledOpen,
  onClose,
  minWidth,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  return (
    <div className="dropdown-menu">
      <button
        className="dropdown-menu__trigger"
        onClick={() => controlledOpen !== undefined ? onClose?.() : setInternalOpen(!internalOpen)}
      >
        {trigger || <Menu size={16} />}
      </button>
      {isOpen && (
        <div 
          className={`dropdown-menu__content dropdown-menu__content--${align}`}
          style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
        >
          {entries.map((entry, index) => {
            if (entry.type === 'separator' || entry.divider) {
              return <div key={entry.id || index} className="dropdown-menu__divider" />;
            }
            if (entry.type === 'label') {
              return (
                <div key={entry.id} className="dropdown-menu__label">
                  {entry.label}
                </div>
              );
            }
            return (
              <button
                key={entry.id}
                className={`dropdown-menu__item ${entry.danger ? 'dropdown-menu__item--danger' : ''}`}
                onClick={() => {
                  entry.onClick?.();
                  handleClose();
                }}
                disabled={entry.disabled}
              >
                {entry.icon && <span className="dropdown-menu__item-icon">{entry.icon}</span>}
                <span className="dropdown-menu__item-label">{entry.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
