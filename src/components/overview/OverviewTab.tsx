import type React from 'react';
import { useInterventionData, useSettings } from '../../hooks';
import { EXTENSION_CONFIG } from '../../types';
import { calculateInterventionStats } from '../../utils/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ErrorMessage } from '../ui/error-message';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Section } from '../ui/section';
import { StatsCard } from '../ui/stats-card';
import { StatusBadge } from '../ui/status-badge';
import { Toggle } from '../ui/toggle';

export const OverviewTab: React.FC = () => {
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    updateSettings,
  } = useSettings();
  const {
    history,
    loading: historyLoading,
    error: historyError,
  } = useInterventionData();

  const loading = settingsLoading || historyLoading;
  const error = settingsError || historyError;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <ErrorMessage
        message={error || 'Failed to load data'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const weeklyStats = calculateInterventionStats(history, 7);
  const todayStats = calculateInterventionStats(history, 1);

  const handleToggleIntervention = async (enabled: boolean) => {
    try {
      await updateSettings({ interventionsEnabled: enabled });
    } catch (err) {
      console.error('Failed to update intervention setting:', err);
    }
  };

  const getStatusText = () => {
    if (!settings.interventionsEnabled) return 'Disabled';
    if (weeklyStats.total === 0) return 'Ready';
    return 'Active';
  };

  const getEnabledSitesCount = () => {
    return Object.values(settings.enabledSites).filter(Boolean).length;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <Section title="Extension Status">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm sm:text-base leading-tight">
                  Mindful Browsing Interventions
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Control your social media experience
                </p>
              </div>
              <div className="flex-shrink-0">
                <StatusBadge
                  status={settings.interventionsEnabled ? 'active' : 'inactive'}
                >
                  {getStatusText()}
                </StatusBadge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <Toggle
              enabled={settings.interventionsEnabled}
              onChange={handleToggleIntervention}
              label="Enable Interventions"
              description="Show mindful pauses when visiting social media sites"
            />
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              Version {EXTENSION_CONFIG.VERSION}
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Recent Activity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <StatsCard
            title="Today"
            value={todayStats.total}
            subtitle="interventions"
            icon="📅"
          />
          <StatsCard
            title="This Week"
            value={weeklyStats.total}
            subtitle="interventions"
            icon="📊"
          />
        </div>
      </Section>

      <Section title="Current Configuration">
        <Card>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Interval</span>
                <span className="font-medium">
                  {settings.interventionInterval < 1
                    ? `${settings.interventionInterval * 60}s`
                    : `${settings.interventionInterval}m`}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Enabled Sites</span>
                <span className="font-medium">{getEnabledSitesCount()}/4</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {weeklyStats.total > 0 && (
        <Section title="Weekly Progress">
          <Card>
            <CardContent className="text-center space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                  {weeklyStats.mindfulChoiceRate}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Mindful choices this week
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-2 sm:p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="font-semibold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                    {weeklyStats.continued}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    Continued
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-2 sm:p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="font-semibold text-green-600 dark:text-green-400 text-sm sm:text-base">
                    {weeklyStats.closed}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    Closed
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 sm:p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="font-semibold text-yellow-600 dark:text-yellow-400 text-sm sm:text-base">
                    {weeklyStats.triedActivity}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    Tried Alt.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      <Section title="💡 Quick Tips">
        <Card>
          <CardContent className="space-y-3 text-xs sm:text-sm text-muted-foreground p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span className="leading-relaxed">
                Use the pause moment to check in with your intentions
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span className="leading-relaxed">
                Try the alternative activities when feeling overwhelmed
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span className="leading-relaxed">
                Review your insights weekly to spot patterns
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span className="leading-relaxed">
                Adjust settings in the Settings tab for your preferences
              </span>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className="text-lg sm:text-xl flex-shrink-0"
              role="img"
              aria-label="privacy"
            >
              🔒
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs sm:text-sm text-green-800 dark:text-green-200">
                Privacy Protected
              </h4>
              <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 mt-1 leading-relaxed">
                All your data stays on your device. No tracking, no external
                servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
