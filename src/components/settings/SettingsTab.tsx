import type React from 'react';
import { useSettings } from '../../hooks';
import type { SiteName } from '../../types';
import { getAllSiteNames, getSiteDisplayName } from '../../utils/url-detection';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ErrorMessage } from '../ui/error-message';
import { LoadingSpinner } from '../ui/loading-spinner';
import { ModernSelect } from '../ui/modern-select';
import { Section } from '../ui/section';
import { Separator } from '../ui/separator';
import { Toggle } from '../ui/toggle';

export const SettingsTab: React.FC = () => {
  const { settings, loading, error, updateSettings } = useSettings();

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
        message={error || 'Failed to load settings'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const handleToggleIntervention = async (enabled: boolean) => {
    try {
      await updateSettings({ interventionsEnabled: enabled });
    } catch (err) {
      console.error('Failed to update intervention setting:', err);
    }
  };

  const handleSiteToggle = async (site: SiteName, enabled: boolean) => {
    try {
      await updateSettings({
        enabledSites: {
          ...settings.enabledSites,
          [site]: enabled,
        },
      });
    } catch (err) {
      console.error('Failed to update site setting:', err);
    }
  };

  const handleIntervalChange = async (interval: string) => {
    try {
      await updateSettings({ interventionInterval: Number(interval) });
    } catch (err) {
      console.error('Failed to update interval setting:', err);
    }
  };

  const handleClearData = async () => {
    if (
      confirm(
        'Are you sure you want to clear all intervention data? This cannot be undone.'
      )
    ) {
      try {
        const { storage } = await import('../../utils/storage');
        await storage.clearInterventionHistory();
        alert('Data cleared successfully');
      } catch (err) {
        console.error('Failed to clear data:', err);
        alert('Failed to clear data');
      }
    }
  };

  const intervalOptions = [
    { value: 0.5, label: '30 seconds' },
    { value: 1, label: '1 minute' },
    { value: 2, label: '2 minutes' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <Section title="General Settings">
        <Card>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <Toggle
              enabled={settings.interventionsEnabled}
              onChange={handleToggleIntervention}
              label="Enable Interventions"
              description="Show mindful pauses when visiting social media sites"
            />

            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm font-medium">
                Intervention Interval
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                How often to show interventions while browsing
              </p>
              <ModernSelect
                value={settings.interventionInterval}
                onChange={handleIntervalChange}
                options={intervalOptions}
                disabled={!settings.interventionsEnabled}
              />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Enabled Sites">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">
              Choose which sites to monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            {getAllSiteNames().map((site) => (
              <Toggle
                key={site}
                enabled={settings.enabledSites[site]}
                onChange={(enabled: boolean) => handleSiteToggle(site, enabled)}
                disabled={!settings.interventionsEnabled}
                label={getSiteDisplayName(site)}
              />
            ))}
          </CardContent>
        </Card>
      </Section>

      <Section title="Privacy & Data">
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-start gap-3">
              <div
                className="text-lg sm:text-xl flex-shrink-0"
                role="img"
                aria-label="privacy"
              >
                🔒
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                  Privacy Protected
                </h4>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  All data is stored locally on your device. No information is
                  sent to external servers.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-xs sm:text-sm">
                  Clear All Data
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Remove all intervention history and analytics data
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button
                  onClick={handleClearData}
                  variant="destructive"
                  size="sm"
                >
                  Clear Data
                </Button>
              </div>
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
              aria-label="info"
            >
              ℹ️
            </div>
            <div className="text-xs sm:text-sm min-w-0 flex-1">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                About Breathe Before Browse
              </h4>
              <p className="text-green-700 dark:text-green-300 mb-2 leading-relaxed">
                A mindful browsing extension that helps you pause and reflect
                before engaging with social media.
              </p>
              <p className="text-green-600 dark:text-green-400 text-[10px] sm:text-xs leading-relaxed">
                Built with behavioral science principles to support digital
                wellness.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
