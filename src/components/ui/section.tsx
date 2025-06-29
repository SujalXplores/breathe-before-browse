import type React from "react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <section className={`space-y-3 sm:space-y-4 ${className || ""}`}>
      <h2 className="text-sm sm:text-lg font-semibold text-foreground leading-tight">
        {title}
      </h2>
      {children}
    </section>
  );
};
