import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4 md:gap-4 md:pb-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h1>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
