import { StorageError, ValidationError } from '../types';
import type { InterventionData, UserSettings } from '../types';
import { logger } from './logger';

interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

class ChromeLocalStorage implements StorageAdapter {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new StorageError('Storage operation timed out', { operation: 'get', key }));
        }, 5000);

        chrome.storage.local.get([key], (result) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            reject(new StorageError(
              `Failed to get storage item: ${chrome.runtime.lastError.message}`,
              { key, operation: 'get' }
            ));
            return;
          }

          resolve(result[key]);
        });
      });
    } catch (error) {
      logger.error('Storage get operation failed', error, { key });
      throw new StorageError('Storage get operation failed', { key, originalError: error });
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new StorageError('Storage operation timed out', { operation: 'set', key }));
        }, 5000);

        chrome.storage.local.set({ [key]: value }, () => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            reject(new StorageError(
              `Failed to set storage item: ${chrome.runtime.lastError.message}`,
              { key, operation: 'set' }
            ));
            return;
          }

          resolve();
        });
      });
    } catch (error) {
      logger.error('Storage set operation failed', error, { key });
      throw new StorageError('Storage set operation failed', { key, originalError: error });
    }
  }

  async remove(key: string): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new StorageError('Storage operation timed out', { operation: 'remove', key }));
        }, 5000);

        chrome.storage.local.remove([key], () => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            reject(new StorageError(
              `Failed to remove storage item: ${chrome.runtime.lastError.message}`,
              { key, operation: 'remove' }
            ));
            return;
          }

          resolve();
        });
      });
    } catch (error) {
      logger.error('Storage remove operation failed', error, { key });
      throw new StorageError('Storage remove operation failed', { key, originalError: error });
    }
  }

  async clear(): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new StorageError('Storage operation timed out', { operation: 'clear' }));
        }, 5000);

        chrome.storage.local.clear(() => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            reject(new StorageError(
              `Failed to clear storage: ${chrome.runtime.lastError.message}`,
              { operation: 'clear' }
            ));
            return;
          }

          resolve();
        });
      });
    } catch (error) {
      logger.error('Storage clear operation failed', error);
      throw new StorageError('Storage clear operation failed', { originalError: error });
    }
  }
}

const validateUserSettings = (settings: unknown): UserSettings => {
  if (!settings || typeof settings !== 'object') {
    throw new ValidationError('Settings must be an object');
  }

  const s = settings as Record<string, unknown>;

  if (typeof s.interventionsEnabled !== 'boolean') {
    throw new ValidationError('interventionsEnabled must be a boolean');
  }


  if (s.interventionInterval === undefined || s.interventionInterval === null) {
    s.interventionInterval = 15;
  }
  if (typeof s.interventionInterval !== 'number' || s.interventionInterval < 0.5 || s.interventionInterval > 60) {
    throw new ValidationError('interventionInterval must be a number between 0.5 and 60');
  }


  return s as unknown as UserSettings;
};

const validateInterventionData = (data: unknown): InterventionData => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Intervention data must be an object');
  }

  const d = data as Record<string, unknown>;

  if (typeof d.id !== 'string' || !d.id) {
    throw new ValidationError('id must be a non-empty string');
  }

  if (typeof d.timestamp !== 'number' || d.timestamp <= 0) {
    throw new ValidationError('timestamp must be a positive number');
  }

  if (typeof d.site !== 'string' || !d.site) {
    throw new ValidationError('site must be a non-empty string');
  }

  return d as unknown as InterventionData;
};

class StorageService {
  constructor(private adapter: StorageAdapter) { }

  async getUserSettings(): Promise<UserSettings> {
    try {
      const settings = await this.adapter.get<UserSettings>('userSettings');

      if (!settings) {
        logger.debug('No user settings found, returning defaults');
        return this.getDefaultSettings();
      }

      return validateUserSettings(settings);
    } catch (error) {
      logger.error('Failed to get user settings', error);

      if (error instanceof ValidationError) {
        logger.warn('Invalid settings found, returning defaults');
        return this.getDefaultSettings();
      }

      throw error;
    }
  }

  async saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = { ...currentSettings, ...settings };

      validateUserSettings(updatedSettings);

      await this.adapter.set('userSettings', updatedSettings);
      logger.debug('User settings saved successfully', { updatedSettings });
    } catch (error) {
      logger.error('Failed to save user settings', error, { settings });
      throw error;
    }
  }

  async getInterventionHistory(limit = 100): Promise<InterventionData[]> {
    try {
      const history = await this.adapter.get<InterventionData[]>('interventionHistory') || [];

      const validHistory = history.filter((entry, index) => {
        try {
          validateInterventionData(entry);
          return true;
        } catch (error) {
          logger.warn('Invalid intervention data found', { index, entry, error });
          return false;
        }
      });

      return validHistory.slice(-limit);
    } catch (error) {
      logger.error('Failed to get intervention history', error);
      throw error;
    }
  }

  async addInterventionData(data: Omit<InterventionData, 'id'>): Promise<void> {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const interventionData: InterventionData = { ...data, id };

      validateInterventionData(interventionData);

      const currentHistory = await this.getInterventionHistory();
      const updatedHistory = [...currentHistory, interventionData];

      const trimmedHistory = updatedHistory.slice(-100);

      await this.adapter.set('interventionHistory', trimmedHistory);
      logger.debug('Intervention data added successfully', { id });
    } catch (error) {
      logger.error('Failed to add intervention data', error, { data });
      throw error;
    }
  }

  async clearInterventionHistory(): Promise<void> {
    try {
      await this.adapter.remove('interventionHistory');
      logger.info('Intervention history cleared');
    } catch (error) {
      logger.error('Failed to clear intervention history', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.adapter.clear();
      logger.info('All extension data cleared');
    } catch (error) {
      logger.error('Failed to clear all data', error);
      throw error;
    }
  }

  async getLastInterventionTime(): Promise<number | null> {
    try {
      const lastTime = await this.adapter.get<number>('lastInterventionTime');
      return lastTime || null;
    } catch (error) {
      logger.error('Failed to get last intervention time', error);
      return null;
    }
  }

  async setLastInterventionTime(timestamp: number): Promise<void> {
    try {
      await this.adapter.set('lastInterventionTime', timestamp);
      logger.debug('Last intervention time set', { timestamp });
    } catch (error) {
      logger.error('Failed to set last intervention time', error, { timestamp });
      throw error;
    }
  }

  private getDefaultSettings(): UserSettings {
    return {
      interventionsEnabled: true,
      interventionInterval: 15,
      enabledSites: {
        facebook: true,
        instagram: true,
        twitter: true,
        tiktok: true
      },
      onboardingComplete: false,
      notificationsEnabled: false
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'healthCheck';
      const testValue = Date.now();

      await this.adapter.set(testKey, testValue);
      const retrieved = await this.adapter.get<number>(testKey);
      await this.adapter.remove(testKey);

      return retrieved === testValue;
    } catch (error) {
      logger.error('Storage health check failed', error);
      return false;
    }
  }
}

export const storage = new StorageService(new ChromeLocalStorage());

export { StorageService, ChromeLocalStorage };
