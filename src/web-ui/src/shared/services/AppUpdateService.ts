import { create } from 'zustand';
import {
  checkForUpdate,
  getAnnouncements,
  dismissAnnouncement,
  UpdateInfo,
  Announcement,
  configureAuth,
} from '@/infrastructure/api/service-api/AuthAPI';
import { getVersionInfo } from '@/shared/utils/version';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('AppUpdateService');

const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000;
const ANNOUNCEMENT_FETCH_INTERVAL = 30 * 60 * 1000;
const DISMISSED_ANNOUNCEMENTS_KEY = 'kongling_dismissed_announcements';
const SKIPPED_VERSION_KEY = 'kongling_skipped_version';

interface AppUpdateState {
  updateInfo: UpdateInfo | null;
  announcements: Announcement[];
  isCheckingUpdate: boolean;
  isFetchingAnnouncements: boolean;
  updateCheckError: string | null;
  showUpdateModal: boolean;
  showAnnouncementBanner: boolean;
}

interface AppUpdateActions {
  checkUpdate: () => Promise<void>;
  fetchAnnouncements: () => Promise<void>;
  dismissUpdate: () => void;
  openUpdateModal: () => void;
  closeUpdateModal: () => void;
  dismissAnnouncementById: (id: number) => Promise<void>;
  hideAnnouncementBanner: () => void;
  startAutoCheck: () => void;
  stopAutoCheck: () => void;
}

type AppUpdateStore = AppUpdateState & AppUpdateActions;

let updateCheckTimer: ReturnType<typeof setInterval> | null = null;
let announcementFetchTimer: ReturnType<typeof setInterval> | null = null;

function getDismissedAnnouncementIds(): Set<number> {
  try {
    const stored = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

function saveDismissedAnnouncementIds(ids: Set<number>): void {
  localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify([...ids]));
}

function getSkippedVersion(): string | null {
  return localStorage.getItem(SKIPPED_VERSION_KEY);
}

function saveSkippedVersion(version: string): void {
  localStorage.setItem(SKIPPED_VERSION_KEY, version);
}

export const useAppUpdateStore = create<AppUpdateStore>((set, get) => ({
  updateInfo: null,
  announcements: [],
  isCheckingUpdate: false,
  isFetchingAnnouncements: false,
  updateCheckError: null,
  showUpdateModal: false,
  showAnnouncementBanner: false,

  checkUpdate: async () => {
    const serverUrl = localStorage.getItem('kongling_server_url');
    if (!serverUrl) return;

    set({ isCheckingUpdate: true, updateCheckError: null });
    try {
      configureAuth({ serverUrl });
      const versionInfo = getVersionInfo();
      const result = await checkForUpdate(versionInfo.version);

      const skippedVersion = getSkippedVersion();
      if (result.has_update && result.latest_version === skippedVersion) {
        set({ updateInfo: null, isCheckingUpdate: false });
        return;
      }

      set({ updateInfo: result, isCheckingUpdate: false });

      if (result.has_update) {
        set({ showUpdateModal: true });
      }
    } catch (err) {
      log.error('Failed to check for update', err);
      set({ updateCheckError: String(err), isCheckingUpdate: false });
    }
  },

  fetchAnnouncements: async () => {
    const serverUrl = localStorage.getItem('kongling_server_url');
    if (!serverUrl) return;

    set({ isFetchingAnnouncements: true });
    try {
      configureAuth({ serverUrl });
      const result = await getAnnouncements();
      const dismissedIds = getDismissedAnnouncementIds();
      const activeAnnouncements = result.announcements.filter(
        (a) => !dismissedIds.has(a.id)
      );

      const now = new Date().getTime();
      const validAnnouncements = activeAnnouncements.filter((a) => {
        if (!a.start_date && !a.end_date) {
          return true;
        }
        const start = a.start_date ? new Date(a.start_date).getTime() : 0;
        const end = a.end_date ? new Date(a.end_date).getTime() : Infinity;
        if (isNaN(start) || isNaN(end)) {
          return true;
        }
        return now >= start && now <= end;
      });

      validAnnouncements.sort((a, b) => b.priority - a.priority);

      set({
        announcements: validAnnouncements,
        isFetchingAnnouncements: false,
        showAnnouncementBanner: validAnnouncements.length > 0,
      });
    } catch (err) {
      log.error('Failed to fetch announcements', err);
      set({ isFetchingAnnouncements: false });
    }
  },

  dismissUpdate: () => {
    const { updateInfo } = get();
    if (updateInfo?.latest_version) {
      saveSkippedVersion(updateInfo.latest_version);
    }
    set({ showUpdateModal: false, updateInfo: null });
  },

  openUpdateModal: () => {
    set({ showUpdateModal: true });
  },

  closeUpdateModal: () => {
    set({ showUpdateModal: false });
  },

  dismissAnnouncementById: async (id: number) => {
    try {
      await dismissAnnouncement(id);
    } catch (err) {
      log.error('Failed to dismiss announcement on server', err);
    }

    const dismissedIds = getDismissedAnnouncementIds();
    dismissedIds.add(id);
    saveDismissedAnnouncementIds(dismissedIds);

    const { announcements } = get();
    const remaining = announcements.filter((a) => a.id !== id);
    set({
      announcements: remaining,
      showAnnouncementBanner: remaining.length > 0,
    });
  },

  hideAnnouncementBanner: () => {
    set({ showAnnouncementBanner: false });
  },

  startAutoCheck: () => {
    const { checkUpdate, fetchAnnouncements } = get();

    checkUpdate();
    fetchAnnouncements();

    if (updateCheckTimer) clearInterval(updateCheckTimer);
    updateCheckTimer = setInterval(() => {
      checkUpdate();
    }, UPDATE_CHECK_INTERVAL);

    if (announcementFetchTimer) clearInterval(announcementFetchTimer);
    announcementFetchTimer = setInterval(() => {
      fetchAnnouncements();
    }, ANNOUNCEMENT_FETCH_INTERVAL);
  },

  stopAutoCheck: () => {
    if (updateCheckTimer) {
      clearInterval(updateCheckTimer);
      updateCheckTimer = null;
    }
    if (announcementFetchTimer) {
      clearInterval(announcementFetchTimer);
      announcementFetchTimer = null;
    }
  },
}));
