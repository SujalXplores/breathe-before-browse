import { DEFAULT_USER_SETTINGS } from '../types';
import type {
  InterventionData,
  LogInterventionMessage,
  ShowInterventionMessage,
  UserSettings
} from '../types';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';
import { getSiteNameFromUrl, isTargetSite } from '../utils/url-detection';

const backgroundLogger = logger.child({ component: 'background' });

interface TabInfo {
  tabId: number;
  siteName: string;
  url: string;
  startTime: number;
}

class BackgroundService {
  private isInitialized = false;
  private contentScriptReadyTabs = new Set<number>();

  private readonly CONFIG = {
    RETRY_DELAY_MS: 500,
    INJECTION_DELAY_MS: 200,
    MAX_RETRY_ATTEMPTS: 3,
    ACTIVE_TABS_KEY: 'activeBrowsingTabs',
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      backgroundLogger.info('Background service initializing');

      this.setupTabListeners();
      this.setupMessageListeners();
      this.setupInstallListener();
      this.setupAlarmListener();

      await this.cleanupStaleData();
      await this.restoreActiveTabAlarms();

      const isHealthy = await storage.healthCheck();
      if (!isHealthy) {
        backgroundLogger.error('Storage health check failed');
      }

      this.isInitialized = true;
      backgroundLogger.info('Background service initialized successfully');
    } catch (error) {
      backgroundLogger.error('Failed to initialize background service', error);
      throw error;
    }
  }

  private setupAlarmListener(): void {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      try {
        backgroundLogger.debug('Alarm fired', { alarmName: alarm.name });

        if (!alarm.name.startsWith('intervention-')) {
          return;
        }

        const tabId = Number.parseInt(alarm.name.replace('intervention-', ''), 10);
        if (Number.isNaN(tabId)) {
          backgroundLogger.warn('Invalid tab ID in alarm name', { alarmName: alarm.name });
          return;
        }

        const tabInfo = await this.getTabInfo(tabId);
        if (!tabInfo) {
          backgroundLogger.debug('Tab info not found, cleaning up alarm', { tabId });
          await chrome.alarms.clear(alarm.name);
          return;
        }

        const tab = await chrome.tabs.get(tabId).catch(() => null);
        if (!tab || !tab.url || !isTargetSite(tab.url)) {
          backgroundLogger.debug('Tab no longer exists or not on target site', { tabId });
          await this.cleanupTabData(tabId);
          return;
        }

        if (await this.shouldShowScheduledIntervention()) {
          await this.triggerIntervention(tabId, tabInfo.siteName);
          await this.updateLastInterventionTime();
        }

      } catch (error) {
        backgroundLogger.error('Error handling alarm', error, { alarmName: alarm.name });
      }
    });
  }

  private setupTabListeners(): void {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      try {
        if (changeInfo.status !== 'complete' || !tab.url) {
          return;
        }

        backgroundLogger.debug('Tab updated', { tabId, url: tab.url });

        await this.cleanupTabData(tabId);

        if (!isTargetSite(tab.url)) {
          return;
        }

        const siteName = getSiteNameFromUrl(tab.url);
        if (!siteName) {
          backgroundLogger.warn('Could not determine site name for target URL', { url: tab.url });
          return;
        }

        backgroundLogger.info('Target site detected', { siteName, url: tab.url });

        const settings = await this.getUserSettings();
        if (!this.shouldShowIntervention(settings, siteName)) {
          backgroundLogger.debug('Intervention skipped based on settings', { siteName });
          return;
        }

        await this.setupTabForInterventions(tabId, siteName, tab.url, settings.interventionInterval);

      } catch (error) {
        backgroundLogger.error('Error processing tab update', error, { tabId });
      }
    });

    chrome.tabs.onRemoved.addListener(async (tabId) => {
      await this.cleanupTabData(tabId);
      this.contentScriptReadyTabs.delete(tabId);
      backgroundLogger.debug('Tab closed, cleaned up data', { tabId });
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      if (changeInfo.url && !isTargetSite(changeInfo.url)) {
        await this.cleanupTabData(tabId);
        backgroundLogger.debug('Tab navigated away from target site', { tabId });
      }
    });
  }

  private async setupTabForInterventions(tabId: number, siteName: string, url: string, intervalMinutes: number): Promise<void> {
    try {
      const tabInfo: TabInfo = {
        tabId,
        siteName,
        url,
        startTime: Date.now()
      };

      await this.saveTabInfo(tabId, tabInfo);

      const alarmName = `intervention-${tabId}`;
      await chrome.alarms.create(alarmName, {
        delayInMinutes: intervalMinutes,
        periodInMinutes: intervalMinutes
      });

      backgroundLogger.info('Tab set up for interventions', {
        tabId,
        siteName,
        intervalMinutes,
        alarmName
      });

    } catch (error) {
      backgroundLogger.error('Failed to setup tab for interventions', error, { tabId, siteName });
    }
  }

  private async cleanupTabData(tabId: number): Promise<void> {
    try {
      const alarmName = `intervention-${tabId}`;
      await chrome.alarms.clear(alarmName);

      await this.removeTabInfo(tabId);

      backgroundLogger.debug('Tab data cleaned up', { tabId, alarmName });
    } catch (error) {
      backgroundLogger.error('Failed to cleanup tab data', error, { tabId });
    }
  }

  private async saveTabInfo(tabId: number, tabInfo: TabInfo): Promise<void> {
    try {
      const activeTabs = await this.getActiveTabs();
      activeTabs[tabId] = tabInfo;
      await chrome.storage.local.set({ [this.CONFIG.ACTIVE_TABS_KEY]: activeTabs });
    } catch (error) {
      backgroundLogger.error('Failed to save tab info', error, { tabId });
    }
  }

  private async getTabInfo(tabId: number): Promise<TabInfo | null> {
    try {
      const activeTabs = await this.getActiveTabs();
      return activeTabs[tabId] || null;
    } catch (error) {
      backgroundLogger.error('Failed to get tab info', error, { tabId });
      return null;
    }
  }

  private async removeTabInfo(tabId: number): Promise<void> {
    try {
      const activeTabs = await this.getActiveTabs();
      delete activeTabs[tabId];
      await chrome.storage.local.set({ [this.CONFIG.ACTIVE_TABS_KEY]: activeTabs });
    } catch (error) {
      backgroundLogger.error('Failed to remove tab info', error, { tabId });
    }
  }

  private async getActiveTabs(): Promise<Record<number, TabInfo>> {
    try {
      const result = await chrome.storage.local.get([this.CONFIG.ACTIVE_TABS_KEY]);
      return result[this.CONFIG.ACTIVE_TABS_KEY] || {};
    } catch (error) {
      backgroundLogger.error('Failed to get active tabs', error);
      return {};
    }
  }

  /**
   * Clean up stale data from previous sessions
   */
  private async cleanupStaleData(): Promise<void> {
    try {
      const alarms = await chrome.alarms.getAll();
      for (const alarm of alarms) {
        if (alarm.name.startsWith('intervention-')) {
          await chrome.alarms.clear(alarm.name);
        }
      }

      await chrome.storage.local.remove([this.CONFIG.ACTIVE_TABS_KEY]);

      backgroundLogger.debug('Stale data cleaned up');
    } catch (error) {
      backgroundLogger.error('Failed to cleanup stale data', error);
    }
  }

  /**
   * Restore alarms for existing tabs (in case service worker restarted)
   */
  private async restoreActiveTabAlarms(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      const settings = await this.getUserSettings();

      for (const tab of tabs) {
        if (tab.id && tab.url && isTargetSite(tab.url)) {
          const siteName = getSiteNameFromUrl(tab.url);
          if (siteName && this.shouldShowIntervention(settings, siteName)) {
            await this.setupTabForInterventions(tab.id, siteName, tab.url, settings.interventionInterval);
          }
        }
      }

      backgroundLogger.debug('Active tab alarms restored');
    } catch (error) {
      backgroundLogger.error('Failed to restore active tab alarms', error);
    }
  }

  /**
   * Set up message listeners for communication with content scripts
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      (async () => {
        try {
          if (request.action === 'logIntervention') {
            await this.handleLogIntervention(request as LogInterventionMessage);
            sendResponse({ success: true });
          } else if (request.action === 'getSettings') {
            const settings = await this.getUserSettings();
            sendResponse({ success: true, data: settings });
          } else if (request.action === 'contentScriptReady') {
            this.handleContentScriptReady(request, sender);
            sendResponse({ success: true });
          } else if (request.action === 'closeTab') {
            await this.handleCloseTab(sender);
            sendResponse({ success: true });
          } else {
            backgroundLogger.warn('Unknown message action', { action: request.action });
            sendResponse({ success: false, error: 'Unknown action' });
          }
        } catch (error) {
          backgroundLogger.error('Error handling message', error, { action: request.action });
          sendResponse({ success: false, error: 'Internal error' });
        }
      })();

      return true;
    });
  }

  /**
   * Set up extension installation listener
   */
  private setupInstallListener(): void {
    chrome.runtime.onInstalled.addListener(async (details) => {
      try {
        backgroundLogger.info('Extension installed/updated', { reason: details.reason });

        if (details.reason === 'install') {
          await this.handleFirstInstall();
        } else if (details.reason === 'update') {
          await this.handleUpdate(details.previousVersion);
        }
      } catch (error) {
        backgroundLogger.error('Error handling extension install/update', error);
      }
    });
  }

  /**
   * Handle first-time installation
   */
  private async handleFirstInstall(): Promise<void> {
    try {
      backgroundLogger.info('Setting up default settings for new user');
      await storage.saveUserSettings(DEFAULT_USER_SETTINGS);
      backgroundLogger.info('First install setup completed');
    } catch (error) {
      backgroundLogger.error('Failed to setup first install', error);
    }
  }

  /**
   * Handle extension updates
   */
  private async handleUpdate(previousVersion?: string): Promise<void> {
    try {
      backgroundLogger.info('Handling extension update', { previousVersion });

      const settings = await this.getUserSettings();
      await storage.saveUserSettings(settings);

      backgroundLogger.info('Update handling completed');
    } catch (error) {
      backgroundLogger.error('Failed to handle update', error);
    }
  }

  /**
   * Get user settings with fallback to defaults
   */
  private async getUserSettings(): Promise<UserSettings> {
    try {
      return await storage.getUserSettings();
    } catch (error) {
      backgroundLogger.error('Failed to get user settings, using defaults', error);
      return DEFAULT_USER_SETTINGS;
    }
  }

  /**
   * Check if intervention should be shown based on settings
   */
  private shouldShowIntervention(settings: UserSettings, siteName: string): boolean {
    if (!settings.interventionsEnabled) {
      backgroundLogger.debug('Interventions disabled globally');
      return false;
    }

    const normalizedSiteName = this.normalizeSiteName(siteName);
    const enabledSites = settings.enabledSites;

    if (normalizedSiteName in enabledSites && !enabledSites[normalizedSiteName as keyof typeof enabledSites]) {
      backgroundLogger.debug('Site disabled in settings', { siteName: normalizedSiteName });
      return false;
    }

    backgroundLogger.debug('Intervention should be shown', { siteName: normalizedSiteName });
    return true;
  }

  /**
   * Normalize site name to match settings keys
   */
  private normalizeSiteName(siteName: string): string {
    const lowerSiteName = siteName.toLowerCase();

    if (lowerSiteName.includes('instagram')) return 'instagram';
    if (lowerSiteName.includes('facebook')) return 'facebook';
    if (lowerSiteName.includes('twitter') || lowerSiteName.includes('x.com')) return 'twitter';
    if (lowerSiteName.includes('tiktok')) return 'tiktok';

    return lowerSiteName;
  }

  /**
   * Trigger intervention on target tab
   */
  private async triggerIntervention(tabId: number, siteName: string): Promise<void> {
    try {
      const message: ShowInterventionMessage = {
        action: 'showIntervention',
        data: {
          site: siteName,
          timestamp: Date.now()
        }
      };

      await this.sendInterventionWithRetry(tabId, siteName, message, 0);
    } catch (error) {
      backgroundLogger.error('Failed to trigger intervention', error, { tabId, siteName });
    }
  }

  /**
   * Send intervention message with retry logic
   */
  private async sendInterventionWithRetry(
    tabId: number,
    siteName: string,
    message: ShowInterventionMessage,
    attempt: number
  ): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, message);
      backgroundLogger.info('Intervention triggered', { tabId, siteName, attempt });
    } catch (error) {
      if (attempt < this.CONFIG.MAX_RETRY_ATTEMPTS) {
        backgroundLogger.warn(`Intervention message failed, retrying (attempt ${attempt + 1})`, {
          tabId,
          siteName,
          error: (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : String(error)
        });

        if (!this.contentScriptReadyTabs.has(tabId)) {
          await this.injectContentScript(tabId);
        }

        const delay = this.CONFIG.RETRY_DELAY_MS * (2 ** attempt);
        setTimeout(() => {
          this.sendInterventionWithRetry(tabId, siteName, message, attempt + 1);
        }, delay);
      } else {
        backgroundLogger.error('Failed to trigger intervention after all retries', error, {
          tabId,
          siteName,
          attempts: attempt + 1
        });
      }
    }
  }

  /**
   * Inject content script into tab
   */
  private async injectContentScript(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['assets/content.js']
      });
      backgroundLogger.debug('Content script injected', { tabId });
    } catch (injectionError) {
      backgroundLogger.error('Failed to inject content script', injectionError, { tabId });
    }
  }

  /**
   * Handle content script ready signal
   */
  private handleContentScriptReady(request: { data?: { site?: string; url?: string } }, sender: chrome.runtime.MessageSender): void {
    const tabId = sender.tab?.id;
    if (tabId) {
      this.contentScriptReadyTabs.add(tabId);
      backgroundLogger.debug('Content script ready', {
        tabId,
        site: request.data?.site,
        url: request.data?.url
      });
    }
  }

  /**
   * Get current time of day
   */
  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Handle intervention logging from content script
   */
  private async handleLogIntervention(message: LogInterventionMessage): Promise<void> {
    try {
      const interventionData: Omit<InterventionData, 'id'> = {
        ...message.data,
        timeOfDay: this.getCurrentTimeOfDay()
      };

      await storage.addInterventionData(interventionData);
      await this.updateLastInterventionTime();

      backgroundLogger.info('Intervention logged', {
        site: interventionData.site,
        action: interventionData.actionTaken
      });
    } catch (error) {
      backgroundLogger.error('Failed to log intervention', error);
    }
  }


  /**
   * Check if we should show scheduled intervention
   */
  private async shouldShowScheduledIntervention(): Promise<boolean> {
    try {
      const lastInterventionTime = await storage.getLastInterventionTime();
      const settings = await this.getUserSettings();
      const now = Date.now();
      const intervalMs = settings.interventionInterval * 60 * 1000;

      return !lastInterventionTime || (now - lastInterventionTime) >= intervalMs;
    } catch (error) {
      backgroundLogger.error('Error checking scheduled intervention', error);
      return true;
    }
  }

  /**
   * Update the last intervention time
   */
  private async updateLastInterventionTime(): Promise<void> {
    try {
      await storage.setLastInterventionTime(Date.now());
      backgroundLogger.debug('Last intervention time updated');
    } catch (error) {
      backgroundLogger.error('Failed to update last intervention time', error);
    }
  }

  /**
   * Handle tab closing request from content script
   */
  private async handleCloseTab(sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const tabId = sender.tab?.id;
      if (!tabId) {
        backgroundLogger.warn('No tab ID found in close tab request');
        return;
      }

      await this.cleanupTabData(tabId);

      await chrome.tabs.remove(tabId);

      backgroundLogger.info('Tab closed successfully', { tabId });
    } catch (error) {
      backgroundLogger.error('Failed to close tab', error, {
        tabId: sender.tab?.id
      });
    }
  }
}

const backgroundService = new BackgroundService();

backgroundService.initialize().catch(error => {
  console.error('Failed to initialize background service:', error);
});

self.addEventListener('activate', () => {
  backgroundLogger.info('Service worker activated');
});

export { BackgroundService };
