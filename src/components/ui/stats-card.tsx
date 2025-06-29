import type React from "react";
import { Card, CardContent } from "./card";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 leading-tight">
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div
              className="text-lg sm:text-2xl opacity-60 flex-shrink-0"
              role="img"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
