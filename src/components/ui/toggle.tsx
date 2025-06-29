import type React from "react";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm font-medium text-foreground leading-tight">
          {label}
        </div>
        {description && (
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
          disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0
          hover:scale-105 active:scale-95
          ${enabled ? "bg-primary shadow-sm" : "bg-muted border border-border"}
        `}
      >
        <span
          className={`
            inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-background transition-all duration-200
            shadow-sm border border-border/20
            ${
              enabled
                ? "translate-x-5 sm:translate-x-6"
                : "translate-x-0.5 sm:translate-x-1"
            }
          `}
        />
      </button>
    </div>
  );
};
