import { create } from 'zustand';

interface SessionContext {
  mode?: string;
  sessionId?: string;
}

interface HeaderState {
  sessionContext: SessionContext | null;
  setSessionContext: (context: SessionContext | null) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  sessionContext: null,
  setSessionContext: (context) => set({ sessionContext: context }),
}));
