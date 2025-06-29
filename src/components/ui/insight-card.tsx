import { Lightbulb, Target } from "lucide-react";
import type React from "react";
import { Card, CardContent } from "./card";

interface InsightCardProps {
  type: "insight" | "recommendation";
  children: React.ReactNode;
}

export const InsightCard: React.FC<InsightCardProps> = ({ type, children }) => {
  const icon =
    type === "insight" ? (
      <Lightbulb className="w-4 h-4" />
    ) : (
      <Target className="w-4 h-4" />
    );
  const bgColor = type === "insight" ? "bg-blue-50/50" : "bg-green-50/50";
  const borderColor =
    type === "insight" ? "border-blue-200" : "border-green-200";
  const iconColor = type === "insight" ? "text-blue-600" : "text-green-600";

  return (
    <Card className={`${bgColor} ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`mt-0.5 ${iconColor}`}>{icon}</div>
          <p className="text-sm">{children}</p>
        </div>
      </CardContent>
    </Card>
  );
};
