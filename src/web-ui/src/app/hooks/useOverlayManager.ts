import { useCallback } from 'react';

export interface OverlayManager {
  openOverlay: (sceneId: string, options?: Record<string, unknown>) => void;
  closeOverlay: () => void;
}

export const useOverlayManager = (): OverlayManager => {
  const openOverlay = useCallback((sceneId: string, options?: Record<string, unknown>) => {
    console.log('openOverlay', sceneId, options);
  }, []);

  const closeOverlay = useCallback(() => {
    console.log('closeOverlay');
  }, []);

  return { openOverlay, closeOverlay };
};
