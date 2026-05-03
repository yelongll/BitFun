import React, { useState, useEffect, useRef } from 'react';
import { getCompletions, getCompletionPrefix, CompletionItem } from './completions';
import './CompletionPopup.scss';

interface CompletionPopupProps {
  code: string;
  position: number;
  selectedIndex: number;
  onSelect: (item: CompletionItem) => void;
  onClose: () => void;
  visible: boolean;
}

export const CompletionPopup: React.FC<CompletionPopupProps> = ({
  code,
  position,
  selectedIndex,
  onSelect,
  onClose: _onClose,
  visible,
}) => {
  const [items, setItems] = useState<CompletionItem[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      const prefix = getCompletionPrefix(code, position);
      const completions = getCompletions(prefix);
      setItems(completions);
    }
  }, [code, position, visible]);

  useEffect(() => {
    if (visible && popupRef.current) {
      const selectedElement = popupRef.current.querySelector('.completion-item--selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [visible, selectedIndex]);

  if (!visible || items.length === 0) {
    return null;
  }

  return (
    <div ref={popupRef} className="completion-popup">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className={`completion-item ${index === selectedIndex ? 'completion-item--selected' : ''}`}
          onClick={() => onSelect(item)}
        >
          <span className={`completion-item__icon completion-item__icon--${item.type}`}>
            {item.type === 'keyword' ? 'K' : item.type === 'data-type' ? 'T' : item.type === 'pragma' ? 'P' : 'S'}
          </span>
          <span className="completion-item__label">{item.label}</span>
          {item.detail && (
            <span className="completion-item__detail">{item.detail}</span>
          )}
        </div>
      ))}
    </div>
  );
};
