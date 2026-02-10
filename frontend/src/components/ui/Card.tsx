import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function Card({ children, title, className = "" }: CardProps) {
  return (
    <div
      className={`bg-fred-white rounded-[5px] border border-fred-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {title && (
        <div className="px-5 py-3 border-b border-fred-gray-200">
          <h3 className="text-base font-semibold text-fred-navy">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
