import { BarChart3, Clock, Heart, Target } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useInterventionData } from '../../hooks';
import {
  calculateInterventionStats,
  getEmotionalStateDistribution,
  getPersonalInsights,
  getTimeOfDayDistribution,
  getWeeklyComparison,
} from '../../utils/analytics';
import { Card } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { EnhancedProgressBar } from '../ui/enhanced-progress-bar';
import { ErrorMessage } from '../ui/error-message';
import { EmotionalStateIcon, TimeOfDayIcon } from '../ui/icons';
import { InsightCard } from '../ui/insight-card';
import { LoadingSpinner } from '../ui/loading-spinner';
import { MetricCard } from '../ui/metric-card';

export const InsightsTab: React.FC = () => {
  const { history, loading, error } = useInterventionData();

  const analytics = useMemo(() => {
    if (!history.length) return null;

    const weeklyStats = calculateInterventionStats(history, 7);
    const insights = getPersonalInsights(history);
    const comparison = getWeeklyComparison(history);
    const emotionalStates = getEmotionalStateDistribution(history);
    const timeDistribution = getTimeOfDayDistribution(history);

    return {
      weeklyStats,
      insights,
      comparison,
      emotionalStates,
      timeDistribution,
    };
  }, [history]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage message={error} onRetry={() => window.location.reload()} />
    );
  }

  if (!analytics || history.length === 0) {
    return (
      <EmptyState
        title="No Data Yet"
        description="Start browsing social media to see your mindful usage patterns and insights!"
        icon={
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Chart icon"
          >
            <title>No data chart</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        }
      />
    );
  }

  const {
    weeklyStats,
    insights,
    comparison,
    emotionalStates,
    timeDistribution,
  } = analytics;

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return 'up' as const;
      case 'declining':
        return 'down' as const;
      default:
        return 'neutral' as const;
    }
  };

  const emotionalStateLabels = {
    intentional: 'Intentional',
    mindless: 'Mindless',
    quick: 'Quick Check',
    '': 'Not specified',
  };

  const timeOfDayLabels = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <MetricCard
          title="This Week"
          value={weeklyStats.total}
          subtitle="interventions"
          icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
        />
        <MetricCard
          title="Mindful Choices"
          value={`${weeklyStats.mindfulChoiceRate}%`}
          subtitle="success rate"
          icon={<Target className="w-4 h-4 sm:w-5 sm:h-5" />}
          trend={getTrendIcon(comparison.trend)}
          trendValue={
            comparison.trend === 'improving'
              ? '+5%'
              : comparison.trend === 'declining'
              ? '-3%'
              : '0%'
          }
        />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm sm:text-lg">Weekly Breakdown</h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                Continued browsing
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 sm:min-w-[120px]">
              <span className="text-xs sm:text-sm font-bold">
                {weeklyStats.continued}
              </span>
              <div className="flex-1 min-w-[60px]">
                <EnhancedProgressBar
                  value={weeklyStats.continued}
                  max={weeklyStats.total}
                  variant="default"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Closed tab</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 sm:min-w-[120px]">
              <span className="text-xs sm:text-sm font-bold">
                {weeklyStats.closed}
              </span>
              <div className="flex-1 min-w-[60px]">
                <EnhancedProgressBar
                  value={weeklyStats.closed}
                  max={weeklyStats.total}
                  variant="success"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                Tried activity
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 sm:min-w-[120px]">
              <span className="text-xs sm:text-sm font-bold">
                {weeklyStats.triedActivity}
              </span>
              <div className="flex-1 min-w-[60px]">
                <EnhancedProgressBar
                  value={weeklyStats.triedActivity}
                  max={weeklyStats.total}
                  variant="warning"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm sm:text-lg">
            Browsing Intentions
          </h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(emotionalStates)
            .filter(([_, count]) => count > 0)
            .map(([state, count]) => {
              const percentage = Math.round((count / weeklyStats.total) * 100);
              return (
                <div
                  key={state}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <EmotionalStateIcon
                      state={state}
                      className="text-muted-foreground flex-shrink-0"
                    />
                    <span className="text-xs sm:text-sm font-medium">
                      {
                        emotionalStateLabels[
                          state as keyof typeof emotionalStateLabels
                        ]
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 sm:min-w-[120px]">
                    <span className="text-xs sm:text-sm font-bold">
                      {percentage}%
                    </span>
                    <div className="flex-1 min-w-[60px]">
                      <EnhancedProgressBar
                        value={percentage}
                        max={100}
                        variant={
                          state === 'intentional'
                            ? 'success'
                            : state === 'mindless'
                            ? 'danger'
                            : 'default'
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm sm:text-lg">Usage Patterns</h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(timeDistribution)
            .filter(([_, count]) => count > 0)
            .map(([timeOfDay, count]) => {
              const percentage = Math.round((count / weeklyStats.total) * 100);
              return (
                <div
                  key={timeOfDay}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <TimeOfDayIcon
                      timeOfDay={timeOfDay}
                      className="text-muted-foreground flex-shrink-0"
                    />
                    <span className="text-xs sm:text-sm font-medium">
                      {
                        timeOfDayLabels[
                          timeOfDay as keyof typeof timeOfDayLabels
                        ]
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 sm:min-w-[120px]">
                    <span className="text-xs sm:text-sm font-bold">
                      {percentage}%
                    </span>
                    <div className="flex-1 min-w-[60px]">
                      <EnhancedProgressBar
                        value={percentage}
                        max={100}
                        variant="default"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm sm:text-lg">
            Personal Insights
          </h3>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {insights.insights.map((insight, index) => (
            <InsightCard
              key={`insight-${insight.slice(0, 20)}-${index}`}
              type="insight"
            >
              {insight}
            </InsightCard>
          ))}
        </div>
      </Card>

      {insights.recommendations.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <h3 className="font-semibold text-sm sm:text-lg">
              Recommendations
            </h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {insights.recommendations.map((recommendation, index) => (
              <InsightCard
                key={`recommendation-${recommendation.slice(0, 20)}-${index}`}
                type="recommendation"
              >
                {recommendation}
              </InsightCard>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
