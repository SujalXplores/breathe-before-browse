import type { EmotionalState, InterventionData, InterventionStats, TimeOfDay } from '../types';

export const calculateInterventionStats = (
  interventions: InterventionData[],
  periodDays = 7
): InterventionStats => {
  const now = Date.now();
  const periodStart = now - (periodDays * 24 * 60 * 60 * 1000);

  const periodInterventions = interventions.filter(
    intervention => intervention.timestamp >= periodStart
  );

  const total = periodInterventions.length;
  const continued = periodInterventions.filter(i => i.actionTaken === 'continued').length;
  const closed = periodInterventions.filter(i => i.actionTaken === 'closed-tab').length;
  const triedActivity = periodInterventions.filter(i => i.actionTaken === 'tried-activity').length;

  const mindfulChoices = closed + triedActivity;
  const mindfulChoiceRate = total > 0 ? Math.round((mindfulChoices / total) * 100) : 0;

  return {
    total,
    continued,
    closed,
    triedActivity,
    mindfulChoiceRate,
    periodStart,
    periodEnd: now
  };
};

export const getEmotionalStateDistribution = (
  interventions: InterventionData[]
): Record<EmotionalState, number> => {
  const distribution: Record<EmotionalState, number> = {
    intentional: 0,
    mindless: 0,
    quick: 0,
    '': 0
  };

  for (const intervention of interventions) {
    const state = intervention.emotionalState || '';
    distribution[state]++;
  }

  return distribution;
};

export const getBrowsingPatterns = (interventions: InterventionData[]): number[] => {
  const hourCounts = new Array(24).fill(0);

  for (const intervention of interventions) {
    const hour = new Date(intervention.timestamp).getHours();
    hourCounts[hour]++;
  }

  return hourCounts;
};

export const getMostActiveBrowsingHours = (interventions: InterventionData[]): number[] => {
  const hourCounts = getBrowsingPatterns(interventions);

  const hoursWithCounts = hourCounts.map((count, hour) => ({ hour, count }));
  const sortedHours = hoursWithCounts.sort((a, b) => b.count - a.count);

  return sortedHours.slice(0, 3).map(item => item.hour);
};

export const getSiteStats = (
  interventions: InterventionData[]
): Record<string, InterventionStats> => {
  const siteGroups: Record<string, InterventionData[]> = {};

  for (const intervention of interventions) {
    const site = intervention.site;
    if (!siteGroups[site]) {
      siteGroups[site] = [];
    }
    siteGroups[site].push(intervention);
  }

  const siteStats: Record<string, InterventionStats> = {};

  for (const [site, siteInterventions] of Object.entries(siteGroups)) {
    siteStats[site] = calculateInterventionStats(siteInterventions);
  }

  return siteStats;
};

export const getInterventionTrend = (
  interventions: InterventionData[],
  days = 14
): Array<{ date: string; count: number; mindfulChoices: number }> => {
  const now = new Date();
  const trend = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayInterventions = interventions.filter(
      intervention =>
        intervention.timestamp >= date.getTime() &&
        intervention.timestamp < nextDate.getTime()
    );

    const mindfulChoices = dayInterventions.filter(
      intervention =>
        intervention.actionTaken === 'closed-tab' ||
        intervention.actionTaken === 'tried-activity'
    ).length;

    trend.push({
      date: date.toISOString().split('T')[0],
      count: dayInterventions.length,
      mindfulChoices
    });
  }

  return trend;
};

export const getAverageInterventionDuration = (interventions: InterventionData[]): number => {
  if (interventions.length === 0) return 0;

  const totalDuration = interventions.reduce(
    (sum, intervention) => sum + intervention.interventionDuration,
    0
  );

  return Math.round(totalDuration / interventions.length / 1000);
};

const getCurrentTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export const getTimeOfDayDistribution = (
  interventions: InterventionData[]
): Record<TimeOfDay, number> => {
  const distribution: Record<TimeOfDay, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0
  };

  for (const intervention of interventions) {
    const timeOfDay = intervention.timeOfDay || getCurrentTimeOfDay();
    distribution[timeOfDay]++;
  }

  return distribution;
};

export const getPersonalInsights = (interventions: InterventionData[]): {
  insights: string[];
  recommendations: string[];
} => {
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (interventions.length === 0) {
    insights.push("No intervention data yet. Start browsing social media to see your patterns!");
    return { insights, recommendations };
  }

  const stats = calculateInterventionStats(interventions);
  const emotionalStates = getEmotionalStateDistribution(interventions);
  const timeDistribution = getTimeOfDayDistribution(interventions);

  if (stats.mindfulChoiceRate >= 70) {
    insights.push(`🌟 Great job! You make mindful choices ${stats.mindfulChoiceRate}% of the time.`);
  } else if (stats.mindfulChoiceRate >= 40) {
    insights.push(`📈 You're making progress with ${stats.mindfulChoiceRate}% mindful choices.`);
    recommendations.push("Try to pause longer before deciding to continue browsing.");
  } else {
    insights.push(`🎯 You have room to grow with ${stats.mindfulChoiceRate}% mindful choices.`);
    recommendations.push("Consider the 'why' behind your browsing more deeply.");
  }

  const totalEmotional = emotionalStates.intentional + emotionalStates.mindless + emotionalStates.quick;
  if (totalEmotional > 0) {
    const mindlessPercentage = Math.round((emotionalStates.mindless / totalEmotional) * 100);
    if (mindlessPercentage > 60) {
      insights.push(`🌊 ${mindlessPercentage}% of your browsing is for mindless escape.`);
      recommendations.push("Try identifying what you're seeking before opening social media.");
    } else if (emotionalStates.intentional > emotionalStates.mindless) {
      insights.push("✨ You mostly browse with intention - that's excellent!");
    }
  }

  const mostActiveTime = Object.entries(timeDistribution).reduce((a, b) =>
    timeDistribution[a[0] as TimeOfDay] > timeDistribution[b[0] as TimeOfDay] ? a : b
  )[0] as TimeOfDay;

  insights.push(`⏰ You're most active on social media in the ${mostActiveTime}.`);

  if (mostActiveTime === 'evening') {
    recommendations.push("Consider evening alternatives like reading or relaxation before bed.");
  }

  if (stats.total > 20) {
    insights.push("📱 You're a frequent social media user - the mindful pauses are especially valuable for you.");
  } else if (stats.total < 5) {
    insights.push("🕊️ You use social media sparingly - great for maintaining balance!");
  }

  return { insights, recommendations };
};

export const getWeeklyComparison = (interventions: InterventionData[]): {
  thisWeek: InterventionStats;
  lastWeek: InterventionStats;
  trend: 'improving' | 'declining' | 'stable';
} => {
  const thisWeek = calculateInterventionStats(interventions, 7);
  const lastWeekInterventions = interventions.filter(
    intervention =>
      intervention.timestamp >= (Date.now() - 14 * 24 * 60 * 60 * 1000) &&
      intervention.timestamp < (Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const lastWeek = calculateInterventionStats(lastWeekInterventions, 7);

  let trend: 'improving' | 'declining' | 'stable' = 'stable';

  const rateDiff = thisWeek.mindfulChoiceRate - lastWeek.mindfulChoiceRate;
  if (rateDiff > 5) {
    trend = 'improving';
  } else if (rateDiff < -5) {
    trend = 'declining';
  }

  return { thisWeek, lastWeek, trend };
};
