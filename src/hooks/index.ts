import { useCallback, useEffect, useRef, useState } from 'react';
import type { InterventionData, UserSettings } from '../types';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userSettings = await storage.getUserSettings();
      setSettings(userSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      logger.error('Failed to load settings in hook', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    try {
      setError(null);
      await storage.saveUserSettings(newSettings);

      setSettings(prev => prev ? { ...prev, ...newSettings } : null);

      logger.debug('Settings updated successfully', { newSettings });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      logger.error('Failed to update settings in hook', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    reload: loadSettings
  };
};

export const useInterventionData = () => {
  const [history, setHistory] = useState<InterventionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const interventionHistory = await storage.getInterventionHistory();
      setHistory(interventionHistory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load intervention data';
      setError(errorMessage);
      logger.error('Failed to load intervention history in hook', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      setError(null);
      await storage.clearInterventionHistory();
      setHistory([]);
      logger.info('Intervention history cleared');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear intervention data';
      setError(errorMessage);
      logger.error('Failed to clear intervention history in hook', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    error,
    clearHistory,
    reload: loadHistory
  };
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useAsync = <T, P extends unknown[]>(
  asyncFunction: (...args: P) => Promise<T>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: P) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      logger.error('Async operation failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return {
    data,
    loading,
    error,
    execute
  };
};

export const useLocalStorage = <T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.warn('Failed to parse localStorage item', { key, error });
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error('Failed to save to localStorage', error, { key });
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

export const useIsMounted = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
};

export const useExtensionMessage = <T>(
  messageType: string,
  handler: (data: T) => void
) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const messageListener = (
      request: { action: string; data: T },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void
    ) => {
      if (request.action === messageType) {
        try {
          handlerRef.current(request.data);
          sendResponse({ success: true });
        } catch (error) {
          logger.error('Error handling extension message', error, { messageType });
          sendResponse({ success: false, error: error });
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [messageType]);
};

export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
};
