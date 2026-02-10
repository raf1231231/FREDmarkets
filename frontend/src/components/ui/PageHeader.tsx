import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-fred-gray-200 pb-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-fred-navy">{title}</h1>
        {subtitle && (
          <p className="text-sm text-fred-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
