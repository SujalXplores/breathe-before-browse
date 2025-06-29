import { Brain, Clock, Eye, Moon, Sun, Zap } from "lucide-react";
import type React from "react";

interface IconProps {
  className?: string;
}

export const TimeOfDayIcon: React.FC<IconProps & { timeOfDay: string }> = ({
  timeOfDay,
  className,
}) => {
  const getIcon = () => {
    switch (timeOfDay) {
      case "morning":
        return <Sun className={className} />;
      case "afternoon":
        return <Clock className={className} />;
      case "evening":
        return <Moon className={className} />;
      default:
        return <Clock className={className} />;
    }
  };

  return getIcon();
};

export const EmotionalStateIcon: React.FC<IconProps & { state: string }> = ({
  state,
  className,
}) => {
  const getIcon = () => {
    switch (state) {
      case "intentional":
        return <Brain className={className} />;
      case "mindless":
        return <Zap className={className} />;
      case "quick":
        return <Eye className={className} />;
      default:
        return <Brain className={className} />;
    }
  };

  return getIcon();
};
