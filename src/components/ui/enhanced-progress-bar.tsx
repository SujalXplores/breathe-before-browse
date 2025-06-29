import type React from 'react';
import { cn } from '../../lib/utils';

interface EnhancedProgressBarProps {
  value: number;
  max: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = ({
  value,
  max,
  variant = 'default',
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500 dark:bg-green-400',
    warning: 'bg-yellow-500 dark:bg-yellow-400',
    danger: 'bg-red-500 dark:bg-red-400',
  };

  return (
    <div
      className={cn(
        'w-full bg-muted border border-border/50 rounded-full h-1.5 sm:h-2 overflow-hidden',
        className
      )}
      aria-label={`Progress: ${percentage.toFixed(0)}%`}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out shadow-sm',
          variantClasses[variant],
          percentage > 0 && 'min-w-[2px]'
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
