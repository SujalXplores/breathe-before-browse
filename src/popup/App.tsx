import type React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { InsightsTab } from '../components/insights/InsightsTab';
import { OverviewTab } from '../components/overview/OverviewTab';
import { SettingsTab } from '../components/settings/SettingsTab';
import { ErrorMessage } from '../components/ui/error-message';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { EXTENSION_CONFIG } from '../types';

export const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setError('An unexpected error occurred. Please try refreshing.');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError('An unexpected error occurred. Please try refreshing.');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, []);

  return (
    <div className="min-w-[360px] w-full max-w-[420px] h-[600px] bg-background flex flex-col">
      <header className="header-gradient text-primary-foreground p-4 sm:p-6 flex-shrink-0 shadow-lg shadow-primary/10">
        <div className="flex items-center gap-3">
          <div
            className="text-2xl flex-shrink-0 animate-float"
            role="img"
            aria-label="meditation"
          >
            🧘‍♀️
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold truncate">
              {EXTENSION_CONFIG.NAME}
            </h1>
            <p className="text-primary-foreground/90 text-xs sm:text-sm leading-tight">
              Mindful social media browsing
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 sm:p-6 flex-shrink-0">
          <ErrorMessage
            message={error}
            onRetry={() => {
              setError(null);
              window.location.reload();
            }}
          />
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-background h-14 sm:h-16 p-0 relative z-10 flex-shrink-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 py-2 transition-all duration-200 hover:bg-muted/50"
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-base sm:text-lg"
                  role="img"
                  aria-label="home"
                >
                  🏠
                </span>
                <span className="text-[10px] sm:text-xs font-medium leading-tight">
                  Overview
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 py-2 transition-all duration-200 hover:bg-muted/50"
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-base sm:text-lg"
                  role="img"
                  aria-label="settings"
                >
                  ⚙️
                </span>
                <span className="text-[10px] sm:text-xs font-medium leading-tight">
                  Settings
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 py-2 transition-all duration-200 hover:bg-muted/50"
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-base sm:text-lg"
                  role="img"
                  aria-label="analytics"
                >
                  📊
                </span>
                <span className="text-[10px] sm:text-xs font-medium leading-tight">
                  Insights
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto relative z-0">
            <TabsContent
              value="overview"
              className="p-3 sm:p-4 lg:p-6 m-0 h-full"
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary" />
                  </div>
                }
              >
                <OverviewTab />
              </Suspense>
            </TabsContent>

            <TabsContent
              value="settings"
              className="p-3 sm:p-4 lg:p-6 m-0 h-full"
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary" />
                  </div>
                }
              >
                <SettingsTab />
              </Suspense>
            </TabsContent>

            <TabsContent
              value="insights"
              className="p-3 sm:p-4 lg:p-6 m-0 h-full"
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary" />
                  </div>
                }
              >
                <InsightsTab />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <footer className="glass-effect border-t border-primary/10 p-3 sm:p-4 text-center flex-shrink-0">
        <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight animate-pulse-soft">
          Made with ❤️ for mindful browsing
        </p>
      </footer>
    </div>
  );
};
