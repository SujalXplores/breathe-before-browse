import { TARGET_SITES } from '../types';
import type { SiteName } from '../types';
import { logger } from './logger';

/**
 * Check if a URL matches any target social media sites
 */
export const isTargetSite = (url: string): boolean => {
  try {
    if (!url || typeof url !== 'string') {
      return false;
    }

    return Object.values(TARGET_SITES).some(site =>
      site.patterns.some(pattern => pattern.test(url))
    );
  } catch (error) {
    logger.error('Error checking if URL is target site', error, { url });
    return false;
  }
};

/**
 * Extract site name from URL
 */
export const getSiteNameFromUrl = (url: string): SiteName | null => {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }

    for (const [, siteConfig] of Object.entries(TARGET_SITES)) {
      const isMatch = siteConfig.patterns.some(pattern => pattern.test(url));
      if (isMatch) {
        return siteConfig.name as SiteName;
      }
    }

    return null;
  } catch (error) {
    logger.error('Error extracting site name from URL', error, { url });
    return null;
  }
};

/**
 * Get display name for a site
 */
export const getSiteDisplayName = (siteName: SiteName): string => {
  const site = Object.values(TARGET_SITES).find(s => s.name === siteName);
  return site?.displayName || siteName;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Extract hostname from URL safely
 */
export const getHostname = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    logger.warn('Failed to extract hostname from URL', { url, error });
    return null;
  }
};

/**
 * Check if URL is secure (HTTPS)
 */
export const isSecureUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Get all supported site names
 */
export const getAllSiteNames = (): SiteName[] => {
  return Object.values(TARGET_SITES).map(site => site.name as SiteName);
};

/**
 * Get site configuration by name
 */
export const getSiteConfig = (siteName: SiteName) => {
  return Object.values(TARGET_SITES).find(site => site.name === siteName);
};

/**
 * Check if site is enabled in user settings
 */
export const isSiteEnabled = (siteName: SiteName, enabledSites: Record<SiteName, boolean>): boolean => {
  return enabledSites[siteName] !== false;
};
