import type React from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
}) => {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 text-destructive mb-3">
          <span className="text-lg">⚠️</span>
          <span className="font-medium">Error</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
