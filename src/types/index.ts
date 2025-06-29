export const EXTENSION_CONFIG = {
  NAME: 'Breathe Before Browse',
  VERSION: '1.0.0',
  INTERVENTION_DURATION: {
    MIN: 10,
    DEFAULT: 15,
    MAX: 30
  },
  INTERVENTION_INTERVAL: {
    MIN: 5,
    DEFAULT: 15,
    MAX: 60
  },
  STORAGE_KEYS: {
    SETTINGS: 'userSettings',
    INTERVENTION_HISTORY: 'interventionHistory',
    ONBOARDING_COMPLETE: 'onboardingComplete',
    LAST_INTERVENTION_TIME: 'lastInterventionTime'
  },
  LIMITS: {
    MAX_HISTORY_ENTRIES: 100,
    STATS_RETENTION_DAYS: 30
  }
} as const;

export const TARGET_SITES = {
  FACEBOOK: {
    patterns: [/^https?:\/\/.*\.?facebook\.com/],
    name: 'facebook',
    displayName: 'Facebook'
  },
  INSTAGRAM: {
    patterns: [/^https?:\/\/.*\.?instagram\.com/],
    name: 'instagram',
    displayName: 'Instagram'
  },
  TWITTER: {
    patterns: [/^https?:\/\/.*\.?(twitter|x)\.com/],
    name: 'twitter',
    displayName: 'Twitter/X'
  },
  TIKTOK: {
    patterns: [/^https?:\/\/.*\.?tiktok\.com/],
    name: 'tiktok',
    displayName: 'TikTok'
  }
} as const;

export type EmotionalState = 'intentional' | 'mindless' | 'quick' | '';

export type InterventionAction =
  | 'continued'
  | 'closed-tab'
  | 'tried-activity'
  | 'continued-after-suggestion'
  | 'escaped';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export type SiteName = 'facebook' | 'instagram' | 'twitter' | 'tiktok';

/**
 * User Settings Interface
 */
export interface UserSettings {
  readonly interventionsEnabled: boolean;
  readonly interventionInterval: number;
  readonly enabledSites: Record<SiteName, boolean>;
  readonly onboardingComplete: boolean;
  readonly notificationsEnabled: boolean;
}

/**
 * Intervention Data Interface
 */
export interface InterventionData {
  readonly id: string;
  readonly timestamp: number;
  readonly site: string;
  readonly emotionalState: EmotionalState;
  readonly actionTaken: InterventionAction;
  readonly interventionDuration: number;
  readonly timeOfDay: TimeOfDay;
}

/**
 * Statistics Interface
 */
export interface InterventionStats {
  readonly total: number;
  readonly continued: number;
  readonly closed: number;
  readonly triedActivity: number;
  readonly mindfulChoiceRate: number;
  readonly periodStart: number;
  readonly periodEnd: number;
}

/**
 * Alternative Activity Interface
 */
export interface AlternativeActivity {
  readonly id: string;
  readonly text: string;
  readonly category: 'micro-break' | 'physical' | 'mental' | 'productive' | 'creative' | 'social';
  readonly timeOfDay: TimeOfDay[];
  readonly duration: number;
}

/**
 * Message Types for Extension Communication
 */
export interface ExtensionMessage {
  readonly action: string;
  readonly data?: unknown;
}

export interface ShowInterventionMessage extends ExtensionMessage {
  readonly action: 'showIntervention';
  readonly data: {
    readonly site: string;
    readonly timestamp: number;
  };
}

export interface LogInterventionMessage extends ExtensionMessage {
  readonly action: 'logIntervention';
  readonly data: Omit<InterventionData, 'id' | 'timeOfDay'>;
}

/**
 * Error Types
 */
export class ExtensionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export class StorageError extends ExtensionError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'STORAGE_ERROR', context);
    this.name = 'StorageError';
  }
}

export class ValidationError extends ExtensionError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

/**
 * Default Settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  interventionsEnabled: true,
  interventionInterval: EXTENSION_CONFIG.INTERVENTION_INTERVAL.DEFAULT,
  enabledSites: {
    facebook: true,
    instagram: true,
    twitter: true,
    tiktok: true
  },
  onboardingComplete: false,
  notificationsEnabled: false
} as const;
